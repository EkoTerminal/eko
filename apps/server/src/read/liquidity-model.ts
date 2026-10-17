import { binary, hex, type ChainDb } from '@eko/db';
import { CoinCardSchema, type Address } from '@eko/shared';
import { readCurveStates, readPoolLiquidity, readPoolMoney } from './pool-liquidity.js';

// Refreshes also see identity-only cards, so validate only the fields this projection consumes.
const LiquidityCardSchema=CoinCardSchema.pick({liquidity:true,meta:true}).partial();

/** Runs under the same coin locks and revision acknowledgement as read_coins, never on a production list read. */
export async function refreshLiquidityModels(db: ChainDb, coins: Address[], now: number) {
  const keys=coins.map(binary);
  const rows=(await db.sql.query<{address:Uint8Array;graduated_block:string|null;launchpad:string|null;curve:Uint8Array|null;data:unknown}>(`
    SELECT t.address,t.graduated_block,t.launchpad,t.curve,c.data FROM tokens t
    LEFT JOIN coin_card_latest c ON c.coin=t.address WHERE t.address=ANY($1::bytea[])`,[keys])).rows;
  const pools=await readPoolLiquidity(db,rows.filter(t=>t.graduated_block!=null).map(t=>hex(t.address)));
  const curves=await readCurveStates(db,rows.filter(t=>t.graduated_block==null && t.launchpad==='pons').map(t=>hex(t.address)));
  // Bypass the old request cache: every source revision must publish its current positions, including removals.
  const money=await readPoolMoney(db,rows.filter(t=>t.graduated_block==null && t.curve==null && t.launchpad!=='pons').map(t=>hex(t.address)),now,true);
  for(const [coin,state] of curves)pools.set(coin,state.usd);
  for(const [coin,usd] of money)pools.set(coin,usd);
  const values=rows.map(t=>{
    const coin=hex(t.address),pool=pools.get(coin),card=t.data ? LiquidityCardSchema.parse(t.data) : null;
    const unavailable=pool==null && (!card?.liquidity || !!card.meta?.liquidity?.unavailable || !!card.meta?.liquidity?.missing?.includes('depthUsd'));
    const curve=curves.get(coin);
    return {coin,usd:pool ?? (unavailable ? 0 : card!.liquidity!.depthUsd.pct2),unavailable,curve_pct:curve ? Math.round(curve.curvePct*100)/100 : null};
  });
  await db.sql.query(`INSERT INTO read_coin_liquidity(coin,usd,unavailable,curve_pct)
    SELECT decode(substring(v->>'coin' FROM 3),'hex'),(v->>'usd')::float8,(v->>'unavailable')::boolean,(v->>'curve_pct')::float8
    FROM jsonb_array_elements($1::jsonb) v ORDER BY v->>'coin'
    ON CONFLICT(coin) DO UPDATE SET usd=excluded.usd,unavailable=excluded.unavailable,curve_pct=excluded.curve_pct
    WHERE (read_coin_liquidity.usd,read_coin_liquidity.unavailable,read_coin_liquidity.curve_pct)
      IS DISTINCT FROM (excluded.usd,excluded.unavailable,excluded.curve_pct)`,[JSON.stringify(values)]);
  await db.sql.query('DELETE FROM read_coin_liquidity r WHERE r.coin=ANY($1::bytea[]) AND NOT EXISTS(SELECT 1 FROM tokens t WHERE t.address=r.coin)',[keys]);
}
