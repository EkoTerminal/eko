import { binary, hex, readFlows, unavailableFlow, type ChainDb } from '@eko/db';
import { readSellChecks, type SellCheckReading } from '@eko/engines';
import { CoinCardSchema, VerdictSchema, type Address, type CoinCard, type RadarRow, type Verdict } from '@eko/shared';
import { toUntrusted } from '@eko/untrusted';
import { reportError } from '../obs/errors.js';

interface Stored {
  buyers_pending:boolean;pricing_pending:boolean;eligible:boolean;address: Uint8Array; name: string | null; symbol: string | null; launchpad: string | null;
  curve: Uint8Array | null; graduated_block: string | null; total_supply: string | null; decimals: number | null;
  first_block:string; created_at: Date | null; activity: Date | null; data: unknown | null; verdict: unknown | null;
  price: number | null; previous1h: number | null; previous24h: number | null; volume: number; spark: number[] | null;
  trades: string | number; prior_volume: number; first_minute: Date | null;
}
/** Last-hour volume and trades, and the usual hourly volume over the earlier part of the last day. */
function activity(t: Pick<Stored, 'volume' | 'trades' | 'prior_volume' | 'first_minute'>, now: number) {
  const start = Math.max(now - 86400, t.first_minute ? new Date(t.first_minute).getTime() / 1000 : now), hours = (now - 3600 - start) / 3600;
  return { volume1hUsd: Number(t.volume), trades1h: Number(t.trades), ...(hours >= 1 ? { volumeBaselineUsd: Number(t.prior_volume) / hours } : {}) };
}
export interface ReadRow { eligible:boolean;row: RadarRow; card: CoinCard | null; volume: number; activity: number; firstBlock:number; graduationBlock:number; exit100?:number|null }
/** Sell-check fields the engine card leaves unmeasured: the probe measures exit cost and sellability only. */
const SELL_CHECK_UNMEASURED=['exitCostPct.usd10k','buyTax','sellTax','taxes','antiSnipeTiming'];
/**
 * Overlay a live sell-check reading on a card whose own tradeability is unavailable, as flows are overlaid. Only the
 * measured sizes leave `missing`; taxes, limits, anti-snipe timing and the $10K size stay named as not checked.
 * `honeypot` keeps the engine's confirmed value: a contract-probe failure alone is not a confirmed honeypot (§6.2).
 */
export function withSellCheck(card:CoinCard,sell:SellCheckReading|undefined):CoinCard {
  const prior=card.meta?.tradeability;
  if(!sell || prior?.unavailable===false)return card;
  const missing=new Set([...(prior?.missing ?? []).filter(m=>!['simulations','exitCosts'].includes(m) && !m.startsWith('referenceUsd')),...SELL_CHECK_UNMEASURED]);
  if(sell.exit100==null)missing.add('exitCostPct.usd100');
  if(sell.exit1k==null)missing.add('exitCostPct.usd1k');
  return {...card,tradeability:{...card.tradeability,exitCostPct:{usd100:sell.exit100 ?? 0,usd1k:sell.exit1k ?? 0,usd10k:0}},
    meta:{...card.meta,tradeability:{confidence:0.5,asOfBlock:sell.block,unavailable:false,missing:[...missing],flags:[...new Set([...(prior?.flags ?? []),`sell_check_${sell.status}`])]}}};
}
export class ReadStore {
  constructor(readonly db: ChainDb, public now: () => number = Date.now) {}
  /** True when buy quotes run the live sell check, so refusals are being counted (Radar's "Honeypots refused"). */
  sellCheckQuotes=false;
  private rankRefresh?:Promise<void>;
  private modelRefresh?:Promise<void>;
  private listeners=new Set<(coins:Address[])=>void>();
  onRefreshed(listener:(coins:Address[])=>void) {this.listeners.add(listener);return ()=>{this.listeners.delete(listener);};}
  private modelTimer?:ReturnType<typeof setInterval>;
  start() {this.modelTimer=setInterval(()=>{void this.refreshModels().catch(error=>reportError(error,{where:'read model refresh'}));},250);this.modelTimer.unref();}
  async close() {clearInterval(this.modelTimer);await this.modelRefresh;}
  /** Durable coin revisions coalesce inserts, enrichment updates and reorg deletes after commit. */
  async refreshModels() {
    if(this.modelRefresh)return this.modelRefresh;
    this.modelRefresh=(async()=>{
      const cutoff=(await this.db.sql.query<{revision:string|null}>('SELECT max(revision) AS revision FROM read_dirty')).rows[0].revision;
      if(cutoff==null)return;
      for(;;) {
        const pending=(await this.db.sql.query<{coin:Uint8Array;revision:string}>('SELECT coin,revision FROM read_dirty WHERE revision<=$1 ORDER BY revision LIMIT 250',[cutoff])).rows;
        if(!pending.length)return;
        await this.db.tx(async tx=>{
          // Multiple API processes serialize projection refreshes, never lock ingest source rows.
          await tx.sql.query('LOCK TABLE read_feed IN SHARE ROW EXCLUSIVE MODE');
          await tx.sql.query('LOCK TABLE read_coins IN SHARE ROW EXCLUSIVE MODE');
          await tx.sql.query('SELECT refresh_read_models($1::bytea[],$2::bigint)',[pending.map(r=>r.coin),Math.floor(this.now()/60000)*60]);
          await tx.sql.query('DELETE FROM read_dirty d USING unnest($1::bytea[],$2::bigint[]) p(coin,revision) WHERE d.coin=p.coin AND d.revision=p.revision',[pending.map(r=>r.coin),pending.map(r=>r.revision)]);
        });
        for(const listener of this.listeners)listener(pending.map(r=>hex(r.coin)));
      }
    })().finally(()=>{this.modelRefresh=undefined;});
    return this.modelRefresh;
  }
  // Only API-owned projections change here; source chain/engine tables stay read-only.
  async refreshRanks() {
    await this.refreshModels();
    if(this.rankRefresh)return this.rankRefresh;
    const window=Math.floor(this.now()/60000)*60;
    this.rankRefresh=this.db.tx(async tx=>{
      const clock=await tx.sql.query<{window_sec:string}>('SELECT window_sec FROM read_rank_clock WHERE singleton=true FOR UPDATE');
      if(Number(clock.rows[0].window_sec)===window)return;
      // One write per coin whose volume changed: zeroing every ranked coin and setting it again rewrote each row twice a minute.
      await tx.sql.query(`UPDATE read_coins r SET volume=n.volume FROM (SELECT c.coin,CASE WHEN c.pricing_pending THEN 0 ELSE coalesce(b.volume,0) END AS volume
        FROM read_coins c LEFT JOIN (SELECT coin,sum(volume_usd) AS volume FROM bars_1m
        WHERE minute>=to_timestamp($1::double precision-3540) AND minute<=to_timestamp($1::double precision) GROUP BY coin) b ON b.coin=c.coin
        WHERE c.volume<>0 OR b.coin IS NOT NULL) n WHERE r.coin=n.coin AND r.volume IS DISTINCT FROM n.volume`,[window]);
      await tx.sql.query('UPDATE read_rank_clock SET window_sec=$1 WHERE singleton=true',[window]);
    }).finally(()=>{this.rankRefresh=undefined;});
    return this.rankRefresh;
  }
  async rows(address?: Address, addresses?: Address[]): Promise<ReadRow[]> {
    await this.refreshModels();
    const now = this.now() / 1000;
    const params:unknown[]=[now];
    const bounded=address ? [address] : addresses;
    const filter=bounded ? 't.address=ANY($2::bytea[])' : 'r.coin IS NOT NULL';
    if(bounded)params.push(bounded.map(binary));
    const result = await this.db.sql.query<Stored>(`WITH selected AS (
      SELECT t.*,c.data,r.activity,coalesce(r.buyers_pending,false) AS buyers_pending,coalesce(r.pricing_pending,false) AS pricing_pending,(r.coin IS NOT NULL) AS eligible FROM tokens t LEFT JOIN coin_card_latest c ON c.coin=t.address ${bounded ? 'AND c.coin=ANY($2::bytea[])' : ''}
      LEFT JOIN read_coins r ON r.coin=t.address ${bounded ? 'AND r.coin=ANY($2::bytea[])' : ''} WHERE ${filter}
    ), market AS (
      SELECT b.coin,(array_agg(close ORDER BY minute DESC))[1] AS price,
        (array_agg(close ORDER BY minute DESC) FILTER(WHERE minute<=to_timestamp($1::double precision-3600)))[1] AS previous1h,
        (array_agg(close ORDER BY minute DESC) FILTER(WHERE minute<=to_timestamp($1::double precision-86400)))[1] AS previous24h,
        coalesce(sum(volume_usd) FILTER(WHERE minute>=to_timestamp($1::double precision-3600)),0) AS volume,
        coalesce(sum(trades) FILTER(WHERE minute>=to_timestamp($1::double precision-3600)),0) AS trades,
        coalesce(sum(volume_usd) FILTER(WHERE minute>=to_timestamp($1::double precision-86400) AND minute<to_timestamp($1::double precision-3600)),0) AS prior_volume,
        min(minute) AS first_minute
      FROM bars_1m b ${bounded ? 'WHERE b.coin=ANY($2::bytea[])' : 'JOIN selected t ON t.address=b.coin'} GROUP BY b.coin
    ), buckets AS (
      SELECT b.coin,floor(extract(epoch FROM minute)/600) AS bucket,(array_agg(close ORDER BY minute DESC))[1] AS close
      FROM bars_1m b ${bounded ? '' : 'JOIN selected t ON t.address=b.coin'}
      WHERE ${bounded ? 'b.coin=ANY($2::bytea[]) AND' : ''} minute>=to_timestamp(floor($1::double precision/600)*600-47*600) AND minute<=to_timestamp($1::double precision) GROUP BY b.coin,bucket
    ), sparks AS (SELECT coin,array_agg(close ORDER BY bucket) AS points FROM buckets GROUP BY coin)
    SELECT t.*,t.data->'verdict' AS verdict,coalesce(bt.ts,cb.ts) AS created_at,
      b.price,b.previous1h,b.previous24h,coalesce(b.volume,0) AS volume,coalesce(b.trades,0) AS trades,coalesce(b.prior_volume,0) AS prior_volume,b.first_minute,s.points AS spark
    FROM selected t LEFT JOIN market b ON b.coin=t.address LEFT JOIN sparks s ON s.coin=t.address
    LEFT JOIN engine_block_times bt ON bt.number=t.first_block LEFT JOIN chain_blocks cb ON cb.number=t.first_block`,params);
    const flows=await readFlows(this.db,result.rows.map(t=>hex(t.address)));
    const sells=await readSellChecks(this.db,result.rows.map(t=>hex(t.address)),this.now());
    return result.rows.map(t => {
      const sell=sells.get(hex(t.address));
      const card = t.data ? withSellCheck(CoinCardSchema.parse(t.data),sell) : null;
      const verdict = t.verdict ? VerdictSchema.parse(t.verdict) : null;
      const flow=flows.get(hex(t.address))??unavailableFlow('1h');
      const {meta:flowMeta,...flowValues}=flow;
      if(card){card.flow=flowValues;card.meta={...card.meta,flow:flowMeta};}
      // CA-35: exit cost at $1K is a measurement only when the sell check measured that size.
      const unavailable: NonNullable<RadarRow['unavailable']> = sell?.exit1k==null ? ['exitCost'] : [];
      if(flow.meta?.unavailable)unavailable.push('flow');
      // Depth is structural in current engine cards, even when LP ownership is known.
      if (!card || card.meta?.liquidity?.unavailable || card.meta?.liquidity?.missing?.includes('depthUsd')) unavailable.push('liquidity');
      if (!card?.signal) unavailable.push('signal');
      if(t.buyers_pending)unavailable.push('buyers');
      if(t.pricing_pending)unavailable.push('volume','spark');
      if (t.pricing_pending || !t.previous1h || t.price == null) unavailable.push('change');
      const supply = t.total_supply != null && t.decimals != null ? Number(t.total_supply) / 10 ** t.decimals : null;
      if (t.pricing_pending || supply == null || t.price == null) unavailable.push('marketCap');
      // TODO(spec): CoinSummary requires priceUsd even before the first priced swap; priceUnavailable masks it.
      // TODO(spec): CA-31 circulating supply is not indexed; cap uses observed total supply, as market.ts does.
      const row: RadarRow = {
        address: hex(t.address), name: toUntrusted(t.name ?? '',120), symbol: toUntrusted(t.symbol ?? '',32),
        launchpad: t.launchpad === 'pons' ? 'pons' : 'other',
        stage: t.graduated_block != null ? 'graduated' : card?.identity.stage ?? (t.curve ? 'curve' : 'graduated'),
        curvePct: card?.identity.curvePct, priceUsd: t.pricing_pending ? 0 : t.price ?? 0, priceUnavailable: t.pricing_pending || t.price == null,
        change1hPct: !t.pricing_pending && t.price != null && t.previous1h ? 100 * (t.price/t.previous1h-1) : 0,
        change24hPct: !t.pricing_pending && t.price != null && t.previous24h ? 100 * (t.price/t.previous24h-1) : undefined,
        liquidityUsd: unavailable.includes('liquidity') ? 0 : card!.liquidity.depthUsd.pct2,
        marketCapUsd: !t.pricing_pending && supply != null && t.price != null ? t.price*supply : undefined,
        verdict: verdict?.level ?? 'pending', verdictPending: !verdict,
        evaluatedPlaybooks: verdict?.evaluatedPlaybooks,
        missingChecks: [...new Set(Object.values(card?.meta ?? {}).flatMap(m => m.missing ?? []))],
        topPlaybook: verdict?.playbooks[0]?.id, ageSec: Math.max(0,now-(t.created_at ? new Date(t.created_at).getTime()/1000 : now)),
        flow:flowValues, exitCost1kPct:sell?.exit1k ?? 0,
        ...(sell ? {sellCheck:{status:sell.status,asOfBlock:sell.block,checkedAt:sell.checkedAt.toISOString()}} : {}),
        rank:0, signal:card?.signal, spark8h:t.pricing_pending ? undefined : t.spark ?? [], beta:verdict?.beta, unavailable,
        ...(t.pricing_pending ? {} : activity(t, now)),
      };
      return { eligible:t.eligible,row,card,volume:t.pricing_pending ? 0 : t.volume,firstBlock:Number(t.first_block),graduationBlock:Number(t.graduated_block ?? 0),activity:t.activity ? new Date(t.activity).getTime() : this.now(),exit100:sell?.exit100 ?? null };
    });
  }
  async exists(address:Address) {return (await this.db.sql.query('SELECT 1 FROM tokens WHERE address=$1',[binary(address)])).rows.length>0;}
  async card(address: Address) {
    const result = await this.db.sql.query<{ data: unknown }>('SELECT data FROM coin_card_latest WHERE coin=$1',[binary(address)]);
    if (!result.rows.length) return null;
    const card = withSellCheck(CoinCardSchema.parse(result.rows[0].data),(await readSellChecks(this.db,[address.toLowerCase() as Address],this.now())).get(address.toLowerCase() as Address));
    const times = await this.db.sql.query<{ ts: Date }>(`SELECT ts FROM engine_block_times WHERE number=$1 UNION ALL SELECT ts FROM chain_blocks WHERE number=$1 LIMIT 1`,[card.freshness.block]);
    card.freshness.ageSec = times.rows[0] ? Math.max(0,Math.floor((this.now()-new Date(times.rows[0].ts).getTime())/1000)) : card.freshness.ageSec;
    const flow=(await readFlows(this.db,[address])).get(address)??unavailableFlow('1h',card.freshness.block);
    const {meta:flowMeta,...flowValues}=flow;
    card.flow=flowValues;card.meta={...card.meta,flow:flowMeta};
    return card;
  }
  async verdict(address: Address): Promise<Verdict | null> {
    const result = await this.db.sql.query<{ data:unknown }>(`SELECT data FROM verdicts v WHERE coin=$1 AND NOT EXISTS
      (SELECT 1 FROM verdict_events e WHERE e.verdict_id=v.id AND e.kind='orphaned') ORDER BY valid_from_block DESC,id DESC LIMIT 1`,[binary(address)]);
    return result.rows[0] ? VerdictSchema.parse(result.rows[0].data) : null;
  }
}
