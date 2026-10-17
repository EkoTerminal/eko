import { BlueChipReader } from './blue-chip.js';
import { binary, hex, readFlows, readRatingPrices, liveRating, unavailableFlow, type ChainDb } from '@eko/db';
import { readSellChecks, type SellCheckReading } from '@eko/engines';
import { refreshLiquidityModels } from './liquidity-model.js';
import { CoinCardSchema, VerdictSchema, findingsFirst, isHardDanger, type Address, type CoinCard, type RadarRow, type Verdict } from '@eko/shared';
import { toUntrusted } from '@eko/untrusted';
import { reportError } from '../obs/errors.js';
/** Coins per read-model refresh transaction (see refreshModels). */
export const REFRESH_BATCH=25;
/** Coalesce active coins at the existing three-second refresh interval. */
export const REFRESH_REST_MS=3000;

interface Stored {
  liquidity_usd:number|null;liquidity_unavailable:boolean|null;curve_pct:number|null;
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
  blueChip?: BlueChipReader;
  private rankRefresh?:Promise<void>;
  private modelRefresh?:Promise<void>;
  private refreshedAt=new Map<string,number>();
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
   * Requests read current ranks. The background timer owns minute rolls, so requests do not wait on projection
   * writers. Without the timer a request refreshes first.
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
        const started=this.now();
        for(const [coin,at] of this.refreshedAt)if(started-at>=REFRESH_REST_MS || started<at)this.refreshedAt.delete(coin);
        const resting=this.modelTimer ? [...this.refreshedAt.keys()].map(coin=>binary(coin as Address)) : [];
        const pending=(await this.db.sql.query<{coin:Uint8Array;revision:string}>('SELECT coin,revision FROM read_dirty WHERE revision<=$1 AND NOT coin=ANY($3::bytea[]) ORDER BY revision LIMIT $2',[cutoff,REFRESH_BATCH,resting])).rows;
        if(!pending.length)return;
        await this.db.tx(async tx=>{
          // The SQL function serializes only coins in this batch.
          await tx.sql.query('SELECT refresh_read_models($1::bytea[],$2::bigint)',[pending.map(r=>r.coin),Math.floor(this.now()/60000)*60]);
          await refreshLiquidityModels(tx,pending.map(r=>hex(r.coin)),this.now());
          // The indexer marks coins dirty from its swap trigger in its own row order; waiting on one of those rows here
          // deadlocked its block writes (5-9 an hour on 2026-10-11). A row it is changing gets a new revision anyway, so
          // it is skipped and refreshed next time.
          await tx.sql.query(`DELETE FROM read_dirty d USING (SELECT x.coin FROM read_dirty x JOIN unnest($1::bytea[],$2::bigint[]) p(coin,revision)
            ON x.coin=p.coin AND x.revision=p.revision
            WHERE NOT EXISTS(SELECT 1 FROM read_buyer_dirty b JOIN tokens t ON t.address=b.coin AND t.deployer IS NOT NULL WHERE b.coin=x.coin)
            FOR UPDATE OF x SKIP LOCKED) s WHERE d.coin=s.coin`,[pending.map(r=>r.coin),pending.map(r=>r.revision)]);
        });
        if(this.modelTimer)for(const r of pending)this.refreshedAt.set(hex(r.coin),started);
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
      const previous=Number(clock.rows[0].window_sec);
      const forward=window>previous && window-previous<3600;
      const affected=(await tx.sql.query<{coins:Uint8Array[]}>(`SELECT coalesce(array_agg(coin),'{}') AS coins FROM (
        ${forward ? `SELECT DISTINCT coin FROM bars_1m WHERE (minute>=to_timestamp($2::double precision-3540) AND minute<to_timestamp($1::double precision-3540))
          OR (minute>to_timestamp($2::double precision) AND minute<=to_timestamp($1::double precision))` : `SELECT coin FROM read_coins WHERE volume<>0 UNION SELECT coin FROM bars_1m
          WHERE minute>=to_timestamp($1::double precision-3540) AND minute<=to_timestamp($1::double precision)`}

        ) candidates`,forward ? [window,previous] : [window])).rows[0]!.coins;
      // Models, single-coin card refreshes, retention buyer writes and ranks acquire the same complete key set first.
      await tx.sql.query('SELECT read_lock_coins($1::bytea[])',[affected]);
      await tx.sql.query(`WITH affected AS (SELECT unnest($2::bytea[]) AS coin), fresh AS (SELECT r.coin,CASE WHEN r.pricing_pending THEN 0 ELSE coalesce(b.volume,0) END AS volume
          FROM affected a JOIN read_coins r ON r.coin=a.coin LEFT JOIN LATERAL (SELECT sum(volume_usd) AS volume FROM bars_1m
            WHERE coin=a.coin AND minute>=to_timestamp($1::double precision-3540) AND minute<=to_timestamp($1::double precision)) b ON true)
        UPDATE read_coins r SET volume=f.volume FROM fresh f WHERE r.coin=f.coin AND r.volume IS DISTINCT FROM f.volume`,[window,affected]);
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
      SELECT t.*,c.data,l.usd AS liquidity_usd,l.unavailable AS liquidity_unavailable,l.curve_pct,r.activity,coalesce(r.buyers_pending,false) AS buyers_pending,coalesce(r.pricing_pending,false) AS pricing_pending,(r.coin IS NOT NULL) AS eligible FROM tokens t LEFT JOIN coin_card_latest c ON c.coin=t.address ${bounded ? 'AND c.coin=ANY($2::bytea[])' : ''}
      LEFT JOIN read_coins r ON r.coin=t.address ${bounded ? 'AND r.coin=ANY($2::bytea[])' : ''} LEFT JOIN read_coin_liquidity l ON l.coin=t.address ${bounded ? 'AND l.coin=ANY($2::bytea[])' : ''} WHERE ${filter}
    ), recent AS MATERIALIZED (
      SELECT b.* FROM selected t JOIN bars_1m b ON b.coin=t.address WHERE b.minute>=to_timestamp($1::double precision-86400)
    ), market AS (
      SELECT t.address AS coin,last.close AS price,hour.close AS previous1h,day.close AS previous24h,first.minute AS first_minute,
        coalesce(v.volume,0) AS volume,coalesce(v.trades,0) AS trades,coalesce(v.prior_volume,0) AS prior_volume
      FROM selected t
      LEFT JOIN LATERAL (SELECT close FROM bars_1m WHERE coin=t.address ORDER BY minute DESC LIMIT 1) last ON true
      LEFT JOIN LATERAL (SELECT close FROM bars_1m WHERE coin=t.address AND minute<=to_timestamp($1::double precision-3600) ORDER BY minute DESC LIMIT 1) hour ON true
      LEFT JOIN LATERAL (SELECT close FROM bars_1m WHERE coin=t.address AND minute<=to_timestamp($1::double precision-86400) ORDER BY minute DESC LIMIT 1) day ON true
      LEFT JOIN LATERAL (SELECT minute FROM bars_1m WHERE coin=t.address ORDER BY minute LIMIT 1) first ON true
      LEFT JOIN (SELECT coin,sum(volume_usd) FILTER(WHERE minute>=to_timestamp($1::double precision-3600)) AS volume,
        sum(trades) FILTER(WHERE minute>=to_timestamp($1::double precision-3600)) AS trades,
        sum(volume_usd) FILTER(WHERE minute<to_timestamp($1::double precision-3600)) AS prior_volume FROM recent GROUP BY coin) v ON v.coin=t.address
    ), span AS (
      -- Each coin's first bar in the last eight hours: the series starts there, not at a fixed clock bucket.
      SELECT b.coin,min(minute) AS first FROM recent b
      WHERE ${bounded ? 'b.coin=ANY($2::bytea[]) AND' : ''} minute>=to_timestamp($1::double precision-28800) AND minute<=to_timestamp($1::double precision) GROUP BY b.coin
    ), buckets AS (
      -- Up to about 96 points per coin at the finest whole-minute width that covers its span: one-minute closes for a
      -- coin under 96 minutes old, five-minute closes over the full eight hours. Ten-minute buckets gave a coin
      -- under twenty minutes old fewer than two points, which draws nothing.
      SELECT b.coin,floor(extract(epoch FROM b.minute-s.first)/(60*greatest(1,ceil(extract(epoch FROM to_timestamp($1::double precision)-s.first)/5760.0)))) AS bucket,
        (array_agg(b.close ORDER BY b.minute DESC))[1] AS close
      FROM recent b JOIN span s ON s.coin=b.coin
      WHERE ${bounded ? 'b.coin=ANY($2::bytea[]) AND' : ''} b.minute>=to_timestamp($1::double precision-28800) AND b.minute<=to_timestamp($1::double precision) GROUP BY b.coin,bucket
    ), sparks AS (SELECT coin,array_agg(close ORDER BY bucket) AS points FROM buckets GROUP BY coin)
    SELECT t.*,t.data->'verdict' AS verdict,coalesce(bt.ts,cb.ts) AS created_at,
      b.price,b.previous1h,b.previous24h,coalesce(b.volume,0) AS volume,coalesce(b.trades,0) AS trades,coalesce(b.prior_volume,0) AS prior_volume,b.first_minute,s.points AS spark
    FROM selected t LEFT JOIN market b ON b.coin=t.address LEFT JOIN sparks s ON s.coin=t.address
    LEFT JOIN engine_block_times bt ON bt.number=t.first_block LEFT JOIN chain_blocks cb ON cb.number=t.first_block`,params);
    const readAddresses=result.rows.map(t=>hex(t.address));
    const [prices,flows,sells]=await Promise.all([
      readRatingPrices(this.db,readAddresses),readFlows(this.db,readAddresses),readSellChecks(this.db,readAddresses,this.now()),
    ]);
    // A coin with only a few minutes of bars gets its series from its trades instead (the latest 96 priced ones), so a
    // launch shows a line from its second trade on.
    const thin=result.rows.filter(t=>!t.pricing_pending && (t.spark?.length ?? 0)<6).map(t=>t.address);
    const trades=new Map<string,number[]>();
    if(thin.length)for(const row of (await this.db.sql.query<{coin:Uint8Array;points:number[]}>(`SELECT t.address AS coin,array_agg(s.usd/(s.amount_coin::double precision/power(10,coalesce(t.decimals,18))) ORDER BY s.block,s.log_index) AS points
      FROM tokens t CROSS JOIN LATERAL (WITH candidates AS MATERIALIZED (SELECT block,log_index,usd,amount_coin FROM swaps s
        WHERE s.coin=t.address AND s.ts>to_timestamp($2::double precision-28800) AND s.ts<=to_timestamp($2::double precision)
          AND s.usd>0 AND s.amount_coin>0) SELECT * FROM candidates ORDER BY block DESC,log_index DESC LIMIT 96) s
      WHERE t.address=ANY($1::bytea[]) GROUP BY t.address,t.decimals`,[thin,now])).rows)trades.set(hex(row.coin),row.points.map(Number));
    const memberships = await this.blueChip?.members(result.rows.map(t=>hex(t.address)));
    return result.rows.map(t => {
      const sell=sells.get(hex(t.address)),traded=trades.get(hex(t.address));
      const spark=traded && traded.length>(t.spark?.length ?? 0) ? traded : t.spark;
      const card = t.data ? withSellCheck(CoinCardSchema.parse(t.data),sell) : null;
      const verdict = t.verdict ? liveRating(VerdictSchema.parse(t.verdict),prices.get(hex(t.address))) : null;
      if(card && verdict) {card.verdict=verdict;if(verdict.lastChecked)card.freshness.ageSec=Math.max(0,Math.floor(now-Date.parse(verdict.lastChecked.at)/1000));}
      const flow=flows.get(hex(t.address))??unavailableFlow('1h');
      const {meta:flowMeta,...flowValues}=flow;
      if(card){card.flow=flowValues;card.meta={...card.meta,flow:flowMeta};}
      // CA-35: exit cost at $1K is a measurement only when the sell check measured that size.
      const unavailable: NonNullable<RadarRow['unavailable']> = sell?.exit1k==null ? ['exitCost'] : [];
      if(flow.meta?.unavailable)unavailable.push('flow');
      // Depth is structural in current engine cards, even when LP ownership is known. A graduated coin's row shows its
      // pool's value (both sides of the graduation position) instead, read from indexed events.
      if (t.liquidity_unavailable ?? true) unavailable.push('liquidity');
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
        curvePct: t.curve_pct ?? card?.identity.curvePct, priceUsd: t.pricing_pending ? 0 : t.price ?? 0, priceUnavailable: t.pricing_pending || t.price == null,
        change1hPct: !t.pricing_pending && t.price != null && t.previous1h ? 100 * (t.price/t.previous1h-1) : 0,
        change24hPct: !t.pricing_pending && t.price != null && t.previous24h ? 100 * (t.price/t.previous24h-1) : undefined,
        liquidityUsd: t.liquidity_usd ?? 0,
        marketCapUsd: !t.pricing_pending && supply != null && t.price != null ? t.price*supply : undefined,
        verdict: verdict?.level ?? 'pending', verdictPending: !verdict,
        lastChecked:verdict?.lastChecked, priceMove:verdict?.priceMove,
        ratingAgeSec:verdict?.lastChecked ? Math.max(0,Math.floor(now-Date.parse(verdict.lastChecked.at)/1000)) : undefined,
        ...(verdict?.playbooks.some(m => m.level === 'danger' && isHardDanger(m.id)) ? { hardDanger: true } : {}),
        evaluatedPlaybooks: verdict?.evaluatedPlaybooks,
        missingChecks: [...new Set(Object.values(card?.meta ?? {}).flatMap(m => m.missing ?? []))],
        topPlaybook: verdict ? findingsFirst(verdict.playbooks)[0]?.id : undefined, ageSec: Math.max(0,now-(t.created_at ? new Date(t.created_at).getTime()/1000 : now)),
        flow:flowValues, exitCost1kPct:sell?.exit1k ?? 0,
        ...(sell ? {sellCheck:{status:sell.status,asOfBlock:sell.block,checkedAt:sell.checkedAt.toISOString()}} : {}),
        rank:0, signal:card?.signal, spark8h:t.pricing_pending ? undefined : spark ?? [], beta:verdict?.beta, unavailable,
        ...(t.pricing_pending ? {} : activity(t, now)),
      };
      const member = memberships?.get(row.address);
      if(member) { row.blueChip=member; if(card) { card.blueChip=member;card.blueChipCriteria=this.blueChip!.criteria; } }
      return { eligible:t.eligible,row,card,volume:t.pricing_pending ? 0 : t.volume,firstBlock:Number(t.first_block),graduationBlock:Number(t.graduated_block ?? 0),activity:t.activity ? new Date(t.activity).getTime() : this.now(),exit100:sell?.exit100 ?? null };
    });
  }
  async exists(address:Address) {return (await this.db.sql.query('SELECT 1 FROM tokens WHERE address=$1',[binary(address)])).rows.length>0;}
  async card(address: Address) {
    const result = await this.db.sql.query<{ data: unknown }>('SELECT data FROM coin_card_latest WHERE coin=$1',[binary(address)]);
    if (!result.rows.length) return null;
    const card = withSellCheck(CoinCardSchema.parse(result.rows[0].data),(await readSellChecks(this.db,[address.toLowerCase() as Address],this.now())).get(address.toLowerCase() as Address));
    const prices=(await readRatingPrices(this.db,[address])).get(address.toLowerCase() as Address);
    card.verdict=liveRating(card.verdict,prices);
    // The card's age is the age of its latest check. `freshness.block` is the oldest block among its sections, and the
    // identity section dates from the launch, so reading that block made every card as old as its coin: a coin page
    // said "as of 275647 s ago" and held the trade panel as stale.
    const times = await this.db.sql.query<{ ts: Date }>(`SELECT ts FROM engine_block_times WHERE number=$1 UNION ALL SELECT ts FROM chain_blocks WHERE number=$1 LIMIT 1`,[card.verdict.asOfBlock ?? card.freshness.block]);
    card.freshness.ageSec = card.verdict.lastChecked ? Math.max(0,Math.floor((this.now()-Date.parse(card.verdict.lastChecked.at))/1000)) : times.rows[0] ? Math.max(0,Math.floor((this.now()-new Date(times.rows[0].ts).getTime())/1000)) : card.freshness.ageSec;
    const flow=(await readFlows(this.db,[address])).get(address)??unavailableFlow('1h',card.freshness.block);
    const {meta:flowMeta,...flowValues}=flow;
    card.flow=flowValues;card.meta={...card.meta,flow:flowMeta};
    const member=(await this.blueChip?.members([address]))?.get(address.toLowerCase() as Address);
    if(member) { card.blueChip=member;card.blueChipCriteria=this.blueChip!.criteria; }
    return card;
  }
  async verdict(address: Address): Promise<Verdict | null> {
    const result = await this.db.sql.query<{ data:unknown }>(`SELECT v.data FROM verdicts v LEFT JOIN receipt_publications p ON p.id=v.id WHERE v.coin=$1 AND NOT EXISTS
      (SELECT 1 FROM verdict_events e WHERE e.verdict_id=v.id AND e.kind='orphaned') ORDER BY valid_from_block DESC,p.publication_sequence DESC NULLS LAST,v.id DESC LIMIT 1`,[binary(address)]);
    if(!result.rows[0])return null;
    const verdict=VerdictSchema.parse(result.rows[0].data);
    const latest=(await this.db.sql.query<{data:CoinCard}>('SELECT data FROM coin_card_latest WHERE coin=$1',[binary(address)])).rows[0];
    const measured=latest?.data.verdict.receipt.id===verdict.receipt.id ? latest.data.verdict : verdict;
    return liveRating(measured,(await readRatingPrices(this.db,[address])).get(address.toLowerCase() as Address));
  }
}
