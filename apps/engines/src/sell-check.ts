import { binary, hex, type ChainDb } from '@eko/db';
import { loadRegistry, rpcStopReason, runSellProbe, sellRouteId, v4PoolId, SELL_CHECK_METHOD, type AddressRegistry, type SellProbe, type SellRoute, type SellRpc } from '@eko/chain';
import type { Address } from '@eko/shared';
import { getAddress, zeroAddress, type Hex } from 'viem';

/**
 * Live sell checks for Radar, coin pages and the quote guard (BACKEND §6.2, the eth_call probe fallback).
 * Readings are measurements at one block and route; anything not measured stays unavailable, never zero.
 */
export const SELL_CHECK_SIZES_USD = [100, 1000] as const;
export type SellCheckStatus = 'sellable' | 'refused' | 'buy_failed' | 'unavailable' | 'unsupported';
export interface SellCheckResult {
  coin: Address; block: number; status: SellCheckStatus; route: SellRoute | null; ethUsd: number | null;
  probes: (SellProbe & { sizeUsd: number })[]; requests: number;
  exit100: number | null; exit1k: number | null;
}
export interface SellCheckReading {
  coin: Address; status: 'sellable' | 'refused'; block: number; checkedAt: Date;
  venue: SellRoute['venue']; exit100: number | null; exit1k: number | null;
}
const FEES = new Set([100, 500, 3000, 10000]);
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** ETH-USD as the indexer priced recent ETH-quoted swaps (their usd is the ETH amount times its ETH-USD reading). */
export async function indexedEthUsd(db: ChainDb, nowMs: number, registry: AddressRegistry = loadRegistry(), windowSec = 1800): Promise<number | null> {
  const weth = registry.requireAddress('tokens.WETH');
  const rows = (await db.sql.query<{ usd: number; amount_quote: string }>(`SELECT usd,amount_quote FROM swaps
    WHERE ts>to_timestamp($1::double precision) AND ts<=to_timestamp($2::double precision) AND quote_asset=ANY($3::bytea[]) AND usd>0 AND amount_quote>0
    ORDER BY ts DESC LIMIT 25`, [nowMs / 1000 - windowSec, nowMs / 1000, [binary(zeroAddress), binary(weth)]])).rows;
  const rates = rows.map(r => Number(r.usd) / (Number(r.amount_quote) / 1e18)).filter(v => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (!rates.length) return null;
  const mid = Math.floor(rates.length / 2);
  return rates.length % 2 ? rates[mid]! : (rates[mid - 1]! + rates[mid]!) / 2;
}
/** USD size to wei at one ETH-USD reading. Display sizing only: the probe measures its own debit and credit. */
export function usdToWei(usd: number, ethUsd: number): bigint {
  if (!(usd > 0) || !(ethUsd > 0) || !Number.isFinite(usd) || !Number.isFinite(ethUsd)) throw new Error('Invalid sell-check size');
  return BigInt(Math.round(usd * 1e6)) * 10n ** 18n / BigInt(Math.max(1, Math.round(ethUsd * 1e6)));
}

/** About one day of Robinhood Chain blocks (~10 per second), for ranking pools by recent volume. */
const DAY_BLOCKS = 864_000;
/**
 * The route a check runs on, from indexed state only: the Pons curve until graduation, then the graduated pool, else
 * the native-ETH v3 or v4 pool with the most USD volume over about the last day.
 * TODO(spec): §6.1 picks the best route by output after fees among routes whose probe passes; this probes one route.
 */
export async function sellRoute(db: ChainDb, coin: Address, block: number, registry: AddressRegistry = loadRegistry()): Promise<SellRoute | null> {
  const token = (await db.sql.query<{ launchpad: string | null; curve: Uint8Array | null; graduated_block: string | null; graduated_pool: Uint8Array | null }>(
    'SELECT launchpad,curve,graduated_block,graduated_pool FROM tokens WHERE address=$1', [binary(coin)])).rows[0];
  if (!token) return null;
  const checksummed = getAddress(coin);
  if (token.launchpad === 'pons' && token.curve && (token.graduated_block == null || Number(token.graduated_block) > block))
    return { venue: 'pons_curve', coin: checksummed, curve: getAddress(hex(token.curve)) };
  const pools = (await db.sql.query<{ id: Uint8Array; venue: string; currency0: Uint8Array; currency1: Uint8Array; fee: number; tick_spacing: number; hooks: Uint8Array | null; created_block: string }>(
    `SELECT id,venue,currency0,currency1,fee,tick_spacing,hooks,created_block FROM pools
     WHERE (currency0=$1 OR currency1=$1) AND created_block<=$2 AND venue IN ('uniswap_v3','uniswap_v4')`, [binary(coin), block])).rows;
  const weth = registry.addressOf('tokens.WETH'), router = registry.addressOf('uniswapV3.swapRouter02'), quoter = registry.addressOf('uniswapV3.quoterV2');
  const manager = registry.addressOf('uniswapV4.poolManager'), v4Quoter = registry.addressOf('uniswapV4.v4Quoter');
  const routes: { id: string; route: SellRoute; usd: number; created: number; graduated: boolean }[] = [];
  for (const p of pools) {
    const id = hex(p.id), c0 = hex(p.currency0), c1 = hex(p.currency1), other = same(c0, coin) ? c1 : c0;
    const graduated = !!token.graduated_pool && same(hex(token.graduated_pool), id), created = Number(p.created_block);
    if (p.venue === 'uniswap_v3' && weth && router && quoter && same(other, weth) && FEES.has(p.fee) && /^0x[0-9a-f]{40}$/.test(id))
      routes.push({ id, route: { venue: 'uniswap_v3', coin: checksummed, pool: getAddress(id), router, quoter, weth, fee: p.fee as 100 | 500 | 3000 | 10000 }, usd: 0, created, graduated });
    if (p.venue === 'uniswap_v4' && manager && v4Quoter && same(c0, zeroAddress) && same(c1, coin) && /^0x[0-9a-f]{64}$/.test(id)) {
      // V4Probe supports native ETH as currency0 only; the key must hash to the indexed PoolId.
      const key = { currency0: zeroAddress, currency1: checksummed, fee: p.fee, tickSpacing: p.tick_spacing, hooks: p.hooks ? getAddress(hex(p.hooks)) : zeroAddress };
      if (v4PoolId(key).toLowerCase() === id)
        routes.push({ id, route: { venue: 'uniswap_v4', coin: checksummed, poolId: id as Hex, manager, quoter: v4Quoter, key, hookData: '0x' }, usd: 0, created, graduated });
    }
  }
  // Volume only breaks a tie between several candidate pools; the coin/block index bounds the scan.
  if (routes.length > 1 && !routes.some(r => r.graduated)) {
    const volume = new Map((await db.sql.query<{ pool_id: Uint8Array; usd: number | null }>('SELECT pool_id,sum(usd) AS usd FROM swaps WHERE coin=$1 AND block>$2 AND block<=$3 GROUP BY pool_id',
      [binary(coin), block - DAY_BLOCKS, block])).rows.map(r => [hex(r.pool_id), Number(r.usd ?? 0)]));
    for (const r of routes) r.usd = volume.get(r.id as Hex) ?? 0;
  }
  routes.sort((a, b) => Number(b.graduated) - Number(a.graduated) || b.usd - a.usd || b.created - a.created);
  return routes[0]?.route ?? null;
}
export function combineSellProbes(probes: SellProbe[]): SellCheckStatus {
  if (probes.some(p => p.status === 'sell_failed')) return 'refused';
  if (probes.some(p => p.status === 'sellable')) return 'sellable';
  if (probes.length && probes.every(p => p.status === 'buy_failed')) return 'buy_failed';
  return 'unavailable';
}
/** Runs the probe on the coin's indexed route at the given block. Shared by the engines scheduler and the API quote guard. */
export class SellChecker {
  constructor(readonly db: ChainDb, readonly rpc: SellRpc, readonly options: { registry?: AddressRegistry; now?: () => number } = {}) {}
  private get registry() { return this.options.registry ??= loadRegistry(); }
  now() { return this.options.now?.() ?? Date.now(); }
  ethUsd() { return indexedEthUsd(this.db, this.now(), this.registry); }
  async check(coin: Address, block: number, sizesUsd: readonly number[], ethUsd?: number | null): Promise<SellCheckResult> {
    const base: SellCheckResult = { coin, block, status: 'unavailable', route: null, ethUsd: null, probes: [], requests: 0, exit100: null, exit1k: null };
    const route = await sellRoute(this.db, coin, block, this.registry);
    if (!route) return { ...base, status: 'unsupported' };
    const price = ethUsd === undefined ? await this.ethUsd() : ethUsd;
    if (price == null) return { ...base, route };
    const probes = await Promise.all(sizesUsd.map(async sizeUsd => ({ ...await runSellProbe(this.rpc, route, usdToWei(sizeUsd, price), BigInt(block), { nowSec: () => this.now() / 1000 }), sizeUsd })));
    const exit = (size: number) => { const p = probes.find(p => p.sizeUsd === size); return p && (p.status === 'sellable' || p.status === 'sell_failed') ? p.exitCostPct : null; };
    return { ...base, route, ethUsd: price, probes, requests: probes.reduce((n, p) => n + p.requests, 0), status: combineSellProbes(probes), exit100: exit(100), exit1k: exit(1000) };
  }
}

const MEASURED = new Set<SellCheckStatus>(['sellable', 'refused', 'buy_failed']);
/** Store one check: every run as evidence, and the current reading. A transient failure keeps the earlier reading of
 * the same route; a new route or a lost route replaces it, so a closed curve's reading never outlives graduation. */
export async function persistSellCheck(db: ChainDb, result: SellCheckResult, at: Date, activityAt: Date | null) {
  const routeId = result.route ? sellRouteId(result.route) : null;
  const data = { ethUsd: result.ethUsd, route: result.route, probes: result.probes.map(({ requests: _requests, ...p }) => p) };
  await db.tx(async tx => {
    await tx.sql.query('INSERT INTO sell_check_runs(coin,block,checked_at,status,requests,data) VALUES($1,$2,$3,$4,$5,$6)',
      [binary(result.coin), result.block, at, result.status, result.requests, JSON.stringify(data)]);
    const prior = (await tx.sql.query<{ route_id: string | null; status: SellCheckStatus }>('SELECT route_id,status FROM sell_check_latest WHERE coin=$1 FOR UPDATE', [binary(result.coin)])).rows[0];
    if (result.status === 'unavailable' && prior && MEASURED.has(prior.status) && prior.route_id === routeId) {
      await tx.sql.query('UPDATE sell_check_latest SET attempted_at=$2,attempt_status=$3 WHERE coin=$1', [binary(result.coin), at, result.status]);
      return;
    }
    await tx.sql.query(`INSERT INTO sell_check_latest(coin,block,checked_at,activity_at,venue,route_id,status,exit_cost_100_pct,exit_cost_1k_pct,method_version,data,attempted_at,attempt_status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$3,$7) ON CONFLICT(coin) DO UPDATE SET block=excluded.block,checked_at=excluded.checked_at,activity_at=excluded.activity_at,
      venue=excluded.venue,route_id=excluded.route_id,status=excluded.status,exit_cost_100_pct=excluded.exit_cost_100_pct,exit_cost_1k_pct=excluded.exit_cost_1k_pct,
      method_version=excluded.method_version,data=excluded.data,attempted_at=excluded.attempted_at,attempt_status=excluded.attempt_status`,
      [binary(result.coin), result.block, at, activityAt, result.route?.venue ?? null, routeId, result.status,
        MEASURED.has(result.status) ? result.exit100 : null, MEASURED.has(result.status) ? result.exit1k : null, SELL_CHECK_METHOD, JSON.stringify(data)]);
  });
}

/** Current sellable/refused readings for the read model. Older than maxAgeMs means not checked any more, never stale data. */
export async function readSellChecks(db: ChainDb, coins: Address[], nowMs: number, maxAgeMs = 48 * 3600_000): Promise<Map<Address, SellCheckReading>> {
  if (!coins.length) return new Map();
  const rows = (await db.sql.query<{ coin: Uint8Array; status: 'sellable' | 'refused'; block: string; checked_at: Date; venue: SellRoute['venue']; exit_cost_100_pct: number | null; exit_cost_1k_pct: number | null }>(
    `SELECT coin,status,block,checked_at,venue,exit_cost_100_pct,exit_cost_1k_pct FROM sell_check_latest
     WHERE coin=ANY($1::bytea[]) AND status IN ('sellable','refused') AND checked_at>to_timestamp($2::double precision)`, [coins.map(binary), (nowMs - maxAgeMs) / 1000])).rows;
  return new Map(rows.map(r => [hex(r.coin), { coin: hex(r.coin), status: r.status, block: Number(r.block), checkedAt: new Date(r.checked_at), venue: r.venue,
    exit100: r.exit_cost_100_pct, exit1k: r.exit_cost_1k_pct }]));
}

/** A buy quote refused because the sell failed at the quoted size. Counted per coin; no account or wallet is stored. */
export async function recordSellRefusal(db: ChainDb, result: SellCheckResult, at: Date, sizeUsd: number) {
  await db.sql.query('INSERT INTO sell_check_refusals(coin,refused_at,block,data) VALUES($1,$2,$3,$4)', [binary(result.coin), at, result.block,
    JSON.stringify({ sizeUsd, route: result.route ? sellRouteId(result.route) : null, probes: result.probes.map(p => ({ status: p.status, reason: p.reason, exitCostPct: p.exitCostPct, sizeWei: p.sizeWei })) })]);
}
/** Distinct coins refused since UTC midnight, and per hour over the last 24 hours (oldest first). */
export async function sellRefusalTotals(db: ChainDb, nowMs: number) {
  const midnight = Math.floor(nowMs / 86400000) * 86400, from = Math.floor(nowMs / 3600000) * 3600 - 23 * 3600;
  const [today, hourly] = await Promise.all([
    db.sql.query<{ n: string }>('SELECT count(DISTINCT coin) AS n FROM sell_check_refusals WHERE refused_at>=to_timestamp($1::double precision) AND refused_at<to_timestamp($2::double precision)', [midnight, nowMs / 1000]),
    db.sql.query<{ h: number; n: string }>(`SELECT floor((extract(epoch FROM refused_at)-$1)/3600)::int AS h,count(DISTINCT coin) AS n FROM sell_check_refusals
      WHERE refused_at>=to_timestamp($1::double precision) AND refused_at<to_timestamp($2::double precision) GROUP BY 1`, [from, nowMs / 1000]),
  ]);
  return { today: Number(today.rows[0]?.n ?? 0), byHour: Array.from({ length: 24 }, (_, i) => Number(hourly.rows.find(r => Number(r.h) === i)?.n ?? 0)) };
}

export interface SellCheckSchedule {
  /** Coins checked per tick, and how many run at once. */
  batch?: number; parallel?: number;
  /** No check before a coin is this old (Pons anti-snipe windows are seconds long). */
  minAgeSec?: number;
  /** New activity re-checks a coin at most this often. */
  minIntervalSec?: number;
  /** A measured coin with no new activity is re-checked after this long. */
  maxAgeSec?: number;
  /** Retry after a provider failure or missing price, and after no supported route. */
  retrySec?: number; unsupportedRetrySec?: number;
  /** Paid requests the scheduler may spend per UTC day; the process-wide RPC budget still applies. */
  dailyRequests?: number;
}
const DEFAULTS: Required<SellCheckSchedule> = { batch: 8, parallel: 4, minAgeSec: 30, minIntervalSec: 600, maxAgeSec: 86400, retrySec: 900, unsupportedRetrySec: 6 * 3600, dailyRequests: 60_000 };
/**
 * Picks live Radar coins that need a reading (never checked, new activity since the last one, idle past the
 * refresh age, a provider failure to retry, or a graduated curve) and checks them at the indexed head.
 */
export class SellCheckScheduler {
  private readonly cfg: Required<SellCheckSchedule>;
  private stopped = false; private wake?: () => void;
  private day = ''; private spent = 0; private pausedUntil = 0; private prunedAt = 0;
  constructor(readonly db: ChainDb, readonly checker: SellChecker, schedule: SellCheckSchedule = {}, readonly log: (event: string, fields: Record<string, unknown>) => void = () => {}) {
    this.cfg = { ...DEFAULTS, ...Object.fromEntries(Object.entries(schedule).filter(([, v]) => v !== undefined)) };
    for (const [key, value] of Object.entries(this.cfg)) if (!Number.isSafeInteger(value) || value < 0 || (['batch', 'parallel'].includes(key) && value < 1)) throw new Error(`Invalid sell-check ${key}`);
  }
  stop() { this.stopped = true; this.wake?.(); }
  async run(pollMs: number) {
    while (!this.stopped) {
      try { await this.tick(); }
      catch (error) {
        const reason = rpcStopReason(error);
        if (reason === 'rpc_budget_exhausted') { this.pausedUntil = (Math.floor(this.checker.now() / 86400000) + 1) * 86400000; this.log('sell_check_paused', { reason }); }
        else if (reason) { this.log('sell_check_stopped', { reason }); return; }
        else this.log('sell_check_failed', {});
      }
      if (this.stopped) return;
      await new Promise<void>(resolve => { const timer = setTimeout(resolve, pollMs); timer.unref?.(); this.wake = () => { clearTimeout(timer); resolve(); }; });
    }
  }
  private async head(): Promise<number | null> {
    const row = (await this.db.sql.query<{ block: string | null }>(`SELECT coalesce((SELECT block FROM ingest_cursors WHERE stream='head'),(SELECT max(number) FROM chain_blocks)) AS block`)).rows[0];
    return row?.block == null ? null : Number(row.block);
  }
  private async budget(now: number) {
    const day = new Date(now).toISOString().slice(0, 10);
    if (day !== this.day) {
      this.day = day;
      this.spent = Number((await this.db.sql.query<{ n: string }>('SELECT coalesce(sum(requests),0) AS n FROM sell_check_runs WHERE checked_at>=to_timestamp($1::double precision)',
        [Math.floor(now / 86400000) * 86400])).rows[0]!.n);
    }
    return this.cfg.dailyRequests - this.spent;
  }
  /** Coins due for a check, newest launches first, then the most recently active. */
  async due(now: number) {
    const s = now / 1000, c = this.cfg;
    return (await this.db.sql.query<{ coin: Uint8Array; activity: Date }>(`SELECT r.coin,r.activity FROM read_coins r JOIN tokens t ON t.address=r.coin
      LEFT JOIN sell_check_latest l ON l.coin=r.coin LEFT JOIN engine_block_times bt ON bt.number=t.first_block LEFT JOIN chain_blocks cb ON cb.number=t.first_block
      WHERE r.activity>to_timestamp($1::double precision-604800) AND coalesce(bt.ts,cb.ts,r.activity)<=to_timestamp($1::double precision-$2) AND (
        l.coin IS NULL
        OR (l.attempt_status='unavailable' AND l.attempted_at<=to_timestamp($1::double precision-$5))
        OR (l.attempt_status='unsupported' AND l.attempted_at<=to_timestamp($1::double precision-$6))
        OR (l.attempt_status IN ('sellable','refused','buy_failed') AND r.activity>coalesce(l.activity_at,'-infinity'::timestamptz) AND l.attempted_at<=to_timestamp($1::double precision-$3))
        OR (l.attempt_status IN ('sellable','refused','buy_failed') AND l.attempted_at<=to_timestamp($1::double precision-$4))
        OR (l.venue='pons_curve' AND t.graduated_block IS NOT NULL AND l.attempt_status<>'unavailable'))
      ORDER BY (l.coin IS NULL) DESC,r.activity DESC,r.coin LIMIT $7`, [s, c.minAgeSec, c.minIntervalSec, c.maxAgeSec, c.retrySec, c.unsupportedRetrySec, c.batch])).rows
      .map(r => ({ coin: hex(r.coin), activity: new Date(r.activity) }));
  }
  /** One bounded pass. Returns the number of coins attempted. */
  async tick() {
    const now = this.checker.now();
    if (now < this.pausedUntil) return 0;
    if (now - this.prunedAt >= 3600_000) { await this.db.sql.query("DELETE FROM sell_check_runs WHERE checked_at<to_timestamp($1::double precision)", [now / 1000 - 30 * 86400]); this.prunedAt = now; }
    const block = await this.head();
    if (block == null) return 0;
    const coins = await this.due(now);
    if (!coins.length) return 0;
    const ethUsd = await this.checker.ethUsd();
    if (ethUsd == null) { this.log('sell_check_waiting', { reason: 'eth_usd_unavailable' }); return 0; }
    let attempted = 0;
    for (let i = 0; i < coins.length && !this.stopped; i += this.cfg.parallel) {
      // Worst case per coin: one call per size plus one Pons capacity re-read per failed size.
      const group = coins.slice(i, i + this.cfg.parallel), worst = SELL_CHECK_SIZES_USD.length * 2;
      if (await this.budget(now) < group.length * worst) { this.log('sell_check_daily_cap', { cap: this.cfg.dailyRequests }); break; }
      const results = await Promise.all(group.map(({ coin }) => this.checker.check(coin, block, SELL_CHECK_SIZES_USD, ethUsd)));
      for (let j = 0; j < results.length; j++) {
        this.spent += results[j]!.requests;
        await persistSellCheck(this.db, results[j]!, new Date(now), group[j]!.activity);
        attempted++;
      }
    }
    return attempted;
  }
}
