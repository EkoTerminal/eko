import { binary, hex, type ChainDb } from '@eko/db';
import { CoinCardSchema, type Address } from '@eko/shared';
import { curveState, poolValueUsd, positionQuote } from './pool-liquidity.js';

const LiquidityCardSchema=CoinCardSchema.pick({liquidity:true,meta:true}).partial();
interface Trade {pool_id:string;amount_coin:string;amount_quote:string;usd:number;block:number;log_index:number;tx_hash:string}
interface PoolInput {id:string;coinFirst:boolean;full:number|null;seen:boolean;positions:{lower:number;upper:number;liquidity:number}[]}
interface InputRow {
  address:Uint8Array;graduated_block:string|null;graduated_pool:Uint8Array|null;launchpad:string|null;curve:Uint8Array|null;
  total_supply:string|null;data:unknown;revision:string;signature:string;saved_revision:string|null;saved_signature:string|null;
  inputs:PoolInput[]|null;threshold:string|null;retained:Trade|null;retained_prices:Record<string,Trade>|null;
}
/** Caller owns a transaction. Acquire the complete sorted set before either projection, including standalone callers. */
export async function refreshLiquidityModels(db: ChainDb, coins: Address[], _now: number) {
  if(!coins.length)return;
  const keys=coins.map(binary);
  await db.sql.query('SELECT read_lock_coins($1::bytea[])',[keys]);
  const rows=(await db.sql.query<InputRow>(`
    SELECT t.address,t.graduated_block,t.graduated_pool,t.launchpad,t.curve,t.total_supply,
      c.data AS data,
      coalesce(v.revision,0)::text AS revision,coalesce(encode(t.graduated_pool,'hex'),'') AS signature,
      i.revision::text AS saved_revision,i.signature AS saved_signature,i.data AS inputs,
      coalesce(e.data->>'graduationThreshold',life.data->'curve'->>'launchThreshold') AS threshold,
      life.data->'lastPositivePriced' AS retained,rp.prices AS retained_prices
    FROM tokens t LEFT JOIN read_liquidity_versions v ON v.coin=t.address
    LEFT JOIN read_liquidity_inputs i ON i.coin=t.address LEFT JOIN coin_card_latest c ON c.coin=t.address
    LEFT JOIN coin_lifetime life ON life.coin=t.address LEFT JOIN read_liquidity_retained rp ON rp.coin=t.address
    LEFT JOIN LATERAL (SELECT data FROM pons_events WHERE token=t.address AND kind='launch' ORDER BY block,log_index LIMIT 1) e ON true
    WHERE t.address=ANY($1::bytea[])`,[keys])).rows;
  const due=rows.filter(t=>t.saved_revision!==t.revision || t.saved_signature!==t.signature);
  if(due.length) {
    // Only liquidity/pool revisions (and a changed graduation reference) enter this query. Never run it for a trade.
    const inputs=(await db.sql.query<{coin:Uint8Array;inputs:PoolInput[]}>(`
      SELECT t.address AS coin,coalesce(jsonb_agg(jsonb_build_object('id','0x'||encode(p.id,'hex'),'coinFirst',p.currency0=t.address,
        'full',CASE WHEN f.liquidity IS NOT NULL OR kept.full IS NOT NULL THEN coalesce(f.liquidity,0)+coalesce(kept.full,0) END,'seen',coalesce(m.seen,false) OR kept.positions IS NOT NULL,'positions',coalesce(m.positions,'[]')||coalesce(kept.positions,'[]'))) FILTER(WHERE p.id IS NOT NULL),'[]') AS inputs
      FROM tokens t LEFT JOIN LATERAL (SELECT id,currency0,currency1 FROM pools WHERE currency0=t.address UNION SELECT id,currency0,currency1 FROM pools WHERE currency1=t.address
        UNION SELECT id,currency0,currency1 FROM pools WHERE id=t.graduated_pool
        UNION SELECT t.graduated_pool,t.address,NULL::bytea WHERE t.graduated_pool IS NOT NULL AND NOT EXISTS(SELECT 1 FROM pools WHERE id=t.graduated_pool)) p ON true
      LEFT JOIN LATERAL (SELECT sum(liquidity) FILTER(WHERE kind='ModifyLiquidity' AND n_amount>0 AND nullif(lower_tick,'')::int<=-887000 AND nullif(upper_tick,'')::int>=887000)::float8 AS liquidity
        FROM read_pool_positions WHERE pool_id=p.id AND n>0) f ON true
      LEFT JOIN LATERAL (SELECT bool_or(n>0) AS seen,jsonb_agg(jsonb_build_object('lower',nullif(lower_tick,'')::int,'upper',nullif(upper_tick,'')::int,'liquidity',liquidity::float8)) FILTER(WHERE n>0) AS positions
        FROM read_pool_positions WHERE pool_id=p.id) m ON true
      LEFT JOIN LATERAL (SELECT
        (SELECT jsonb_agg(jsonb_build_object('lower',(v->>'lower')::int,'upper',(v->>'upper')::int,'liquidity',(v->>'liquidity')::float8)) FROM jsonb_each(l.data->'liquidity'->('0x'||encode(p.id,'hex'))->'moneyPositions') x(k,v)) AS positions,
        (l.data->'liquidity'->('0x'||encode(p.id,'hex'))->>'fullRangeDelta')::float8 AS full
        FROM coin_lifetime l WHERE l.coin IN(p.currency0,p.currency1,t.address) AND l.data->'liquidity' ? ('0x'||encode(p.id,'hex')) ORDER BY (l.coin=t.address) DESC LIMIT 1) kept ON true
      WHERE t.address=ANY($1::bytea[]) GROUP BY t.address`,[due.map(t=>t.address)])).rows;
    // Combine live and retained deltas by range before valuation. Burns may cancel a retained position.
    const byCoin=new Map(inputs.map(r=>[hex(r.coin),r.inputs]));
    for(const row of due) {
      row.inputs=byCoin.get(hex(row.address)) ?? [];
      for(const p of row.inputs) {
        const ranges=new Map<string,{lower:number;upper:number;liquidity:number}>();
        for(const r of p.positions) {const k=`${r.lower}:${r.upper}`,prior=ranges.get(k);ranges.set(k,{...r,liquidity:r.liquidity+(prior?.liquidity ?? 0)});}
        p.positions=[...ranges.values()].filter(r=>r.liquidity>0);
      }
    }
  }
  // One indexed latest priced probe per known pool, or per curve. No 50/60-row merge or lifetime tail expansion.
  const probes=rows.flatMap<{coin:Address;pool:string|null}>(t=>t.graduated_block==null && t.launchpad==='pons' ? [{coin:hex(t.address),pool:null}] :
    (t.inputs ?? []).filter(p=>t.graduated_block==null || p.id===(t.graduated_pool ? hex(t.graduated_pool) : '')).map(p=>({coin:hex(t.address),pool:p.id})));
  const prices=(await db.sql.query<{coin:string;pool:string|null;trade:Trade|null}>(`
    SELECT k->>'coin' AS coin,k->>'pool' AS pool,to_jsonb(s) AS trade FROM jsonb_array_elements($1::jsonb) k
    LEFT JOIN LATERAL (
      (SELECT '0x'||encode(pool_id,'hex') AS pool_id,amount_coin::text,amount_quote::text,usd,block::float8,log_index,'0x'||encode(tx_hash,'hex') AS tx_hash FROM swaps
        WHERE k->>'pool' IS NOT NULL AND pool_id=decode(substring(k->>'pool' FROM 3),'hex') AND coin=decode(substring(k->>'coin' FROM 3),'hex')
          AND usd>0 AND amount_coin>0 AND amount_quote>0 ORDER BY block DESC,log_index DESC,tx_hash DESC LIMIT 1)
      UNION ALL
      (SELECT '0x'||encode(pool_id,'hex') AS pool_id,amount_coin::text,amount_quote::text,usd,block::float8,log_index,'0x'||encode(tx_hash,'hex') AS tx_hash FROM swaps
        WHERE k->>'pool' IS NULL AND coin=decode(substring(k->>'coin' FROM 3),'hex')
          AND usd>0 AND amount_coin>0 AND amount_quote>0 ORDER BY block DESC,log_index DESC,tx_hash DESC LIMIT 1)
    ) s ON true`,[JSON.stringify(probes)])).rows;
  const latest=new Map(prices.map(p=>[`${p.coin}:${p.pool ?? ''}`,p.trade]));
  const newer=(a:Trade|null|undefined,b:Trade|null|undefined)=>!a ? b : !b ? a :
    Number(a.block)!==Number(b.block) ? Number(a.block)>Number(b.block)?a:b : a.log_index!==b.log_index ? a.log_index>b.log_index?a:b : a.tx_hash>=b.tx_hash?a:b;
  const values=rows.map(t=>{
    const coin=hex(t.address),card=t.data ? LiquidityCardSchema.parse(t.data) : null;
    let usd:number|undefined,curvePct:number|null=null;
    if(t.graduated_block==null && t.launchpad==='pons') {
      const s=newer(latest.get(`${coin}:`),t.retained);
      const state=s ? curveState(Number(t.threshold),Number(t.total_supply),Number(s.amount_coin),Number(s.amount_quote),Number(s.usd)) : null;
      if(state) {usd=state.usd;curvePct=Math.round(state.curvePct*100)/100;}
    } else if(t.graduated_block!=null || t.curve==null)for(const p of t.inputs ?? []) {
      if(t.graduated_block!=null && p.id!==(t.graduated_pool ? hex(t.graduated_pool) : ''))continue;
      const s=newer(latest.get(`${coin}:${p.id}`),t.retained_prices?.[p.id]);
      if(!s || !(s.usd>0) || !(Number(s.amount_coin)>0) || !(Number(s.amount_quote)>0))continue;
      if(t.graduated_block!=null) {
        if(Number(s.block)<Number(t.graduated_block) || p.full==null)continue;
        usd=poolValueUsd(p.full,Number(s.amount_coin),Number(s.amount_quote),s.usd) ?? undefined;
      } else if(p.seen) {
        const sqrt=Math.sqrt(p.coinFirst ? Number(s.amount_quote)/Number(s.amount_coin) : Number(s.amount_coin)/Number(s.amount_quote));
        const quote=p.positions.reduce((sum,r)=>sum+positionQuote(r.liquidity,r.lower,r.upper,sqrt,p.coinFirst),0);
        const value=quote*s.usd/Number(s.amount_quote);
        if(Number.isFinite(value))usd=(usd ?? 0)+value;
      }
    }
    const unavailable=usd==null && (!card?.liquidity || !!card?.meta?.liquidity?.unavailable || !!card?.meta?.liquidity?.missing?.includes('depthUsd'));
    return {coin,usd:usd ?? (unavailable?0:card!.liquidity!.depthUsd.pct2),unavailable,curve_pct:curvePct};
  });
  await db.sql.query(`WITH saved AS (
    INSERT INTO read_liquidity_inputs(coin,revision,signature,data)
    SELECT decode(v->>'coin','hex'),(v->>'revision')::bigint,v->>'signature',v->'inputs' FROM jsonb_array_elements($2::jsonb) v
    WHERE EXISTS(SELECT 1 FROM tokens t WHERE t.address=decode(v->>'coin','hex')) ORDER BY v->>'coin'
    ON CONFLICT(coin) DO UPDATE SET revision=excluded.revision,signature=excluded.signature,data=excluded.data
  ), gone_inputs AS (
    DELETE FROM read_liquidity_inputs r WHERE r.coin=ANY($3::bytea[]) AND NOT EXISTS(SELECT 1 FROM tokens t WHERE t.address=r.coin)
  ), gone AS (
    DELETE FROM read_coin_liquidity r WHERE r.coin=ANY($3::bytea[]) AND NOT EXISTS(SELECT 1 FROM tokens t WHERE t.address=r.coin)
  ) INSERT INTO read_coin_liquidity(coin,usd,unavailable,curve_pct)
    SELECT decode(substring(v->>'coin' FROM 3),'hex'),(v->>'usd')::float8,(v->>'unavailable')::boolean,(v->>'curve_pct')::float8
    FROM jsonb_array_elements($1::jsonb) v
    WHERE EXISTS(SELECT 1 FROM tokens t WHERE t.address=decode(substring(v->>'coin' FROM 3),'hex')) ORDER BY v->>'coin'
    ON CONFLICT(coin) DO UPDATE SET usd=excluded.usd,unavailable=excluded.unavailable,curve_pct=excluded.curve_pct
    WHERE (read_coin_liquidity.usd,read_coin_liquidity.unavailable,read_coin_liquidity.curve_pct)
      IS DISTINCT FROM (excluded.usd,excluded.unavailable,excluded.curve_pct)`,[JSON.stringify(values),JSON.stringify(due.map(t=>({coin:hex(t.address).slice(2),revision:t.revision,signature:t.signature,inputs:t.inputs}))),keys]);
}
