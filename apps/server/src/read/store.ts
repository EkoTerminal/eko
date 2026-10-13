import { binary, hex, readFlows, unavailableFlow, type ChainDb } from '@eko/db';
import { readSellChecks, type SellCheckReading } from '@eko/engines';
import { readCurveStates, readPoolLiquidity, readPoolMoney } from './pool-liquidity.js';
import { CoinCardSchema, VerdictSchema, findingsFirst, isHardDanger, type Address, type CoinCard, type RadarRow, type Verdict } from '@eko/shared';
import { toUntrusted } from '@eko/untrusted';
import { reportError } from '../obs/errors.js';
/** Coins per read-model refresh transaction (see refreshModels). */
export const REFRESH_BATCH=25;

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
  private rankTimer?:ReturnType<typeof setInterval>;
  /** Background refreshers: projections every 250 ms, the per-minute volume ranks every `rankMs` (production). */
  start(rankMs=5000) {
    this.modelTimer=setInterval(()=>{void this.refreshModels().catch(error=>reportError(error,{where:'read model refresh'}));},250);this.modelTimer.unref();
    this.rankTimer=setInterval(()=>{void this.refreshRanks().catch(error=>reportError(error,{where:'read rank refresh'}));},rankMs);this.rankTimer.unref();
  }
  async close() {clearInterval(this.modelTimer);clearInterval(this.rankTimer);await this.modelRefresh;await this.rankRefresh;}
  /**
   * Requests read the current projection. With the background refresher running (every 250 ms) they never wait on its
   * backlog: during the 2026-10-09 scanner catch-up a radar request waited 40+ s behind refresh batches contending for
   * the read_feed lock, and pairs, feed, scan and Guard reads did the same. Without the refresher (tests, one-off tools,
   * the worker role) a request still refreshes first.
   */
  async currentModels() { if (!this.modelTimer) await this.refreshModels(); }
  /**
   * Requests read the ranks as they stand. The per-minute volume re-rank updates read_coins under the same lock the
   * refresher takes every 250 ms, so the first request of each minute used to run it and wait behind refresh batches
   * (10–20 s radar loads on 2026-10-09). The background timer runs it instead; without it a request refreshes first.
   */
  async currentRanks() { if (!this.rankTimer) await this.refreshRanks(); }
  /** True once start() runs the background refresher (production); tests and tools refresh inline instead. */
  get background() { return this.modelTimer !== undefined; }
  /** Durable coin revisions coalesce inserts, enrichment updates and reorg deletes after commit. */
  async refreshModels() {
    if(this.modelRefresh)return this.modelRefresh;
    this.modelRefresh=(async()=>{
      const cutoff=(await this.db.sql.query<{revision:string|null}>('SELECT max(revision) AS revision FROM read_dirty')).rows[0].revision;
      if(cutoff==null)return;
      for(;;) {
        // Each batch holds read_feed and read_coins for its whole transaction, and every card write's verdict trigger
        // writes read_feed. 250 coins held them 14-27 s per batch (2026-10-09) and the scanner wrote four cards a minute.
        const pending=(await this.db.sql.query<{coin:Uint8Array;revision:string}>('SELECT coin,revision FROM read_dirty WHERE revision<=$1 ORDER BY revision LIMIT $2',[cutoff,REFRESH_BATCH])).rows;
        if(!pending.length)return;
        await this.db.tx(async tx=>{
          // Multiple API processes serialize projection refreshes, never lock ingest source rows.
          await tx.sql.query('LOCK TABLE read_feed IN SHARE ROW EXCLUSIVE MODE');
          await tx.sql.query('LOCK TABLE read_coins IN SHARE ROW EXCLUSIVE MODE');
          await tx.sql.query('SELECT refresh_read_models($1::bytea[],$2::bigint)',[pending.map(r=>r.coin),Math.floor(this.now()/60000)*60]);
          // The indexer marks coins dirty from its swap trigger in its own row order; waiting on one of those rows here
          // deadlocked its block writes (5-9 an hour on 2026-10-11). A row it is changing gets a new revision anyway, so
          // it is skipped and refreshed next time.
          await tx.sql.query(`DELETE FROM read_dirty d USING (SELECT x.coin FROM read_dirty x JOIN unnest($1::bytea[],$2::bigint[]) p(coin,revision)
            ON x.coin=p.coin AND x.revision=p.revision FOR UPDATE OF x SKIP LOCKED) s WHERE d.coin=s.coin`,[pending.map(r=>r.coin),pending.map(r=>r.revision)]);
        });
        for(const listener of this.listeners)listener(pending.map(r=>hex(r.coin)));
      }
    })().finally(()=>{this.modelRefresh=undefined;});
    return this.modelRefresh;
  }
  // Only API-owned projections change here; source chain/engine tables stay read-only.
  async refreshRanks() {
    await this.currentModels();
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
    await this.currentModels();
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
    ), span AS (
      -- Each coin's first bar in the last eight hours: the series starts there, not at a fixed clock bucket.
      SELECT b.coin,min(minute) AS first FROM bars_1m b ${bounded ? '' : 'JOIN selected t ON t.address=b.coin'}
      WHERE ${bounded ? 'b.coin=ANY($2::bytea[]) AND' : ''} minute>=to_timestamp($1::double precision-28800) AND minute<=to_timestamp($1::double precision) GROUP BY b.coin
    ), buckets AS (
      -- Up to about 96 points per coin at the finest whole-minute width that covers its span: one-minute closes for a
      -- coin under 96 minutes old, five-minute closes over the full eight hours. Ten-minute buckets gave a coin
      -- under twenty minutes old fewer than two points, which draws nothing.
      SELECT b.coin,floor(extract(epoch FROM b.minute-s.first)/(60*greatest(1,ceil(extract(epoch FROM to_timestamp($1::double precision)-s.first)/5760.0)))) AS bucket,
        (array_agg(b.close ORDER BY b.minute DESC))[1] AS close
      FROM bars_1m b JOIN span s ON s.coin=b.coin
      WHERE ${bounded ? 'b.coin=ANY($2::bytea[]) AND' : ''} b.minute>=to_timestamp($1::double precision-28800) AND b.minute<=to_timestamp($1::double precision) GROUP BY b.coin,bucket
    ), sparks AS (SELECT coin,array_agg(close ORDER BY bucket) AS points FROM buckets GROUP BY coin)
    SELECT t.*,t.data->'verdict' AS verdict,coalesce(bt.ts,cb.ts) AS created_at,
      b.price,b.previous1h,b.previous24h,coalesce(b.volume,0) AS volume,coalesce(b.trades,0) AS trades,coalesce(b.prior_volume,0) AS prior_volume,b.first_minute,s.points AS spark
    FROM selected t LEFT JOIN market b ON b.coin=t.address LEFT JOIN sparks s ON s.coin=t.address
    LEFT JOIN engine_block_times bt ON bt.number=t.first_block LEFT JOIN chain_blocks cb ON cb.number=t.first_block`,params);
    const flows=await readFlows(this.db,result.rows.map(t=>hex(t.address)));
    const sells=await readSellChecks(this.db,result.rows.map(t=>hex(t.address)),this.now());
    const pools=await readPoolLiquidity(this.db,result.rows.filter(t=>t.graduated_block!=null).map(t=>hex(t.address)));
    // A coin still on its Pons curve shows the money in the curve and its progress as of its latest trade: the card's
    // own progress is as of its rating, minutes behind a coin that is trading.
    const curves=await readCurveStates(this.db,result.rows.filter(t=>t.graduated_block==null && t.launchpad==='pons').map(t=>hex(t.address)));
    for(const [coin,state] of curves)pools.set(coin,state.usd);
    // A coin that never had a curve (it launched in a Uniswap pool) shows the ETH, WETH or USDG in its pools.
    for(const [coin,usd] of await readPoolMoney(this.db,result.rows.filter(t=>t.graduated_block==null && t.curve==null && t.launchpad!=='pons').map(t=>hex(t.address)),this.now()))pools.set(coin,usd);
    // A coin with only a few minutes of bars gets its series from its trades instead (the latest 96 priced ones), so a
    // launch shows a line from its second trade on.
    const thin=result.rows.filter(t=>!t.pricing_pending && (t.spark?.length ?? 0)<6).map(t=>t.address);
    const trades=new Map<string,number[]>();
    if(thin.length)for(const row of (await this.db.sql.query<{coin:Uint8Array;points:number[]}>(`SELECT coin,array_agg(price ORDER BY block,log_index) AS points FROM (
        SELECT s.coin,s.block,s.log_index,s.usd/(s.amount_coin::double precision/power(10,coalesce(t.decimals,18))) AS price,
          row_number() OVER (PARTITION BY s.coin ORDER BY s.block DESC,s.log_index DESC) AS n
        FROM swaps s JOIN tokens t ON t.address=s.coin
        WHERE s.coin=ANY($1::bytea[]) AND s.ts>to_timestamp($2::double precision-28800) AND s.ts<=to_timestamp($2::double precision) AND s.usd>0 AND s.amount_coin>0) latest
      WHERE n<=96 GROUP BY coin`,[thin,now])).rows)trades.set(hex(row.coin),row.points.map(Number));
    return result.rows.map(t => {
      const sell=sells.get(hex(t.address)),pool=pools.get(hex(t.address)),traded=trades.get(hex(t.address));
      const spark=traded && traded.length>(t.spark?.length ?? 0) ? traded : t.spark;
      const card = t.data ? withSellCheck(CoinCardSchema.parse(t.data),sell) : null;
      const verdict = t.verdict ? VerdictSchema.parse(t.verdict) : null;
      const flow=flows.get(hex(t.address))??unavailableFlow('1h');
      const {meta:flowMeta,...flowValues}=flow;
      if(card){card.flow=flowValues;card.meta={...card.meta,flow:flowMeta};}
      // CA-35: exit cost at $1K is a measurement only when the sell check measured that size.
      const unavailable: NonNullable<RadarRow['unavailable']> = sell?.exit1k==null ? ['exitCost'] : [];
      if(flow.meta?.unavailable)unavailable.push('flow');
      // Depth is structural in current engine cards, even when LP ownership is known. A graduated coin's row shows its
      // pool's value (both sides of the graduation position) instead, read from indexed events.
      if (pool == null && (!card || card.meta?.liquidity?.unavailable || card.meta?.liquidity?.missing?.includes('depthUsd'))) unavailable.push('liquidity');
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
        // A Pons coin is on its curve until its graduation is indexed. Its token row exists a moment before its curve
        // address does; reading that gap as graduated sent brand-new launches to Migrated and tagged them "Pons → pool".
        stage: t.graduated_block != null ? 'graduated' : card?.identity.stage ?? (t.curve || t.launchpad === 'pons' ? 'curve' : 'graduated'),
        curvePct: curves.has(hex(t.address)) ? Math.round(curves.get(hex(t.address))!.curvePct*100)/100 : card?.identity.curvePct, priceUsd: t.pricing_pending ? 0 : t.price ?? 0, priceUnavailable: t.pricing_pending || t.price == null,
        change1hPct: !t.pricing_pending && t.price != null && t.previous1h ? 100 * (t.price/t.previous1h-1) : 0,
        change24hPct: !t.pricing_pending && t.price != null && t.previous24h ? 100 * (t.price/t.previous24h-1) : undefined,
        liquidityUsd: pool ?? (unavailable.includes('liquidity') ? 0 : card!.liquidity.depthUsd.pct2),
        marketCapUsd: !t.pricing_pending && supply != null && t.price != null ? t.price*supply : undefined,
        verdict: verdict?.level ?? 'pending', verdictPending: !verdict,
        ...(verdict?.playbooks.some(m => m.level === 'danger' && isHardDanger(m.id)) ? { hardDanger: true } : {}),
        evaluatedPlaybooks: verdict?.evaluatedPlaybooks,
        missingChecks: [...new Set(Object.values(card?.meta ?? {}).flatMap(m => m.missing ?? []))],
        topPlaybook: verdict ? findingsFirst(verdict.playbooks)[0]?.id : undefined, ageSec: Math.max(0,now-(t.created_at ? new Date(t.created_at).getTime()/1000 : now)),
        flow:flowValues, exitCost1kPct:sell?.exit1k ?? 0,
        ...(sell ? {sellCheck:{status:sell.status,asOfBlock:sell.block,checkedAt:sell.checkedAt.toISOString()}} : {}),
        rank:0, signal:card?.signal, spark8h:t.pricing_pending ? undefined : spark ?? [], beta:verdict?.beta, unavailable,
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
    // The card's age is the age of its rating. `freshness.block` is the oldest block among its sections, and the
    // identity section dates from the launch, so reading that block made every card as old as its coin: a coin page
    // said "as of 275647 s ago" and held the trade panel as stale.
    const times = await this.db.sql.query<{ ts: Date }>(`SELECT ts FROM engine_block_times WHERE number=$1 UNION ALL SELECT ts FROM chain_blocks WHERE number=$1 LIMIT 1`,[card.verdict.asOfBlock ?? card.freshness.block]);
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
