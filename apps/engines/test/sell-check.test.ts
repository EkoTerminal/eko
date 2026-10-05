import { afterEach, describe, expect, it, vi } from 'vitest';
import { binary, openDb, migrate, migrateEngines, type ChainDb } from '@eko/db';
import { loadRegistry, probeAbi, v4PoolId, v4ProbeAbi, RpcGuardError, type SellRpc } from '@eko/chain';
import type { Address } from '@eko/shared';
import { decodeFunctionData, encodeAbiParameters, getAddress, zeroAddress, type Hex } from 'viem';
import { SellChecker, SellCheckScheduler, indexedEthUsd, readSellChecks, recordSellRefusal, sellRefusalTotals, sellRoute, usdToWei } from '../src/sell-check.js';

// Synthetic indexed rows and a synthetic RPC only: no live chain data or network calls.
const address = (n: number): Address => `0x${n.toString(16).padStart(40, '0')}`;
const registry = loadRegistry();
const weth = registry.requireAddress('tokens.WETH').toLowerCase() as Address, usdg = registry.requireAddress('tokens.USDG').toLowerCase() as Address;
const curveCoin = address(1), curve = address(2), v3Coin = address(3), v3Pool = address(4), graduated = address(5), oldCurve = address(6), usdgCoin = address(7), fresh = address(8), hook = address(9);
const key = { currency0: zeroAddress, currency1: getAddress(graduated), fee: 10000, tickSpacing: 200, hooks: getAddress(hook) };
const poolId = v4PoolId(key);
const epoch = Date.parse('2026-10-01T00:00:00Z');
const handles: ChainDb[] = [];
afterEach(async () => { await Promise.all(handles.splice(0).map(db => db.close())); });
let tx = 1;
async function seed() {
  const db = await openDb({ pgliteDir: ':memory:' }); handles.push(db);
  await migrate(db); await migrateEngines(db); await db.ensurePartitions(new Date(epoch));
  const token = (a: Address, launchpad: string, c: Address | null, block: number, extra: Record<string, unknown> = {}) =>
    db.insert('tokens', { address: binary(a), deployer: binary(address(99)), curve: c ? binary(c) : null, launchpad, name: 'Sample', symbol: 'DEMO', decimals: 18, first_block: String(block), block: String(block), ...extra });
  await token(curveCoin, 'pons', curve, 10); await token(v3Coin, 'other', null, 10); await token(usdgCoin, 'other', null, 10);
  await token(graduated, 'pons', oldCurve, 10, { graduated_block: '50', graduated_pool: binary(poolId) }); await token(fresh, 'pons', address(10), 990);
  for (const [n, sec] of [[10, 0], [50, 400], [990, 3590], [1000, 3600]] as const)
    await db.sql.query("INSERT INTO engine_block_times(number,ts,hash,source) VALUES($1,$2,$3,'fixture')", [n, new Date(epoch + sec * 1000), binary(`0x${n.toString(16).padStart(64, '0')}`)]);
  await db.sql.query("INSERT INTO ingest_cursors(stream,block,hash) VALUES('head',1000,NULL)");
  await db.insert('pools', { id: binary(v3Pool), venue: 'uniswap_v3', currency0: binary(v3Coin), currency1: binary(weth), fee: 3000, tick_spacing: 60, creation_verified: true, created_block: '10', block: '10' });
  await db.insert('pools', { id: binary(address(11)), venue: 'uniswap_v3', currency0: binary(usdgCoin), currency1: binary(usdg), fee: 3000, tick_spacing: 60, creation_verified: true, created_block: '10', block: '10' });
  await db.insert('pools', { id: binary(poolId), venue: 'uniswap_v4', currency0: binary(zeroAddress), currency1: binary(graduated), fee: 10000, tick_spacing: 200, hooks: binary(hook), creation_verified: true, created_block: '50', block: '50' });
  for (const coin of [curveCoin, v3Coin, usdgCoin, graduated, fresh])
    await db.sql.query("INSERT INTO read_coins(coin,tier,activity,first_block,pair_column,pair_block,launchpad) VALUES($1,2,$2,10,'new',10,'pons')", [binary(coin), new Date(epoch + 3000_000)]);
  return db;
}
// ETH-quoted swaps priced by the indexer at $2,000 per ETH (one ETH in, $2,000 out).
async function ethSwap(db: ChainDb, sec: number, usd = 2000, coin = curveCoin) {
  await db.insert('swaps', { ts: new Date(epoch + sec * 1000), block: String(sec), tx_hash: binary(`0x${(tx++).toString(16).padStart(64, '0')}`), log_index: 0, venue: 'pons_curve', pool_id: binary(curve),
    coin: binary(coin), quote_asset: binary(zeroAddress), trader: binary(address(98)), side: 1, amount_coin: '1000', amount_quote: (10n ** 18n).toString(), price_quote: 1, usd });
}
const out = (tokens: bigint, returned: bigint, spent: bigint, buyOk = true, sellOk = true) => encodeAbiParameters(
  [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'bool' }, { type: 'bool' }, { type: 'bytes' }], [tokens, returned, returned, spent, buyOk, sellOk, '0x']);
type Outcome = 'sellable' | 'honeypot' | 'down';
/** Decodes which coin the probe trades and answers with that coin's synthetic outcome. */
function chain(outcomes: Record<string, Outcome>) {
  const request = vi.fn(async ({ params }: { method: string; params: readonly unknown[] }) => {
    const { data, value } = { data: (params[0] as { data: Hex }).data, value: 0n };
    if (params.length < 3) return encodeAbiParameters([{ type: 'uint256' }], [10n ** 30n]);
    let coin: string, size: bigint;
    try { const call = decodeFunctionData({ abi: probeAbi, data }); if (call.functionName !== 'roundTrip') throw new Error(); coin = call.args[0]; size = call.args[2].value; }
    catch { const call = decodeFunctionData({ abi: v4ProbeAbi, data }); coin = call.args[2].currency1; size = call.args[4]; }
    void value;
    const outcome = outcomes[coin.toLowerCase()];
    if (outcome === 'down' || !outcome) throw new Error('synthetic provider failure');
    return outcome === 'sellable' ? out(10n ** 21n, size * 9n / 10n, size) : out(10n ** 21n, 0n, size, true, false);
  });
  return { request } satisfies SellRpc & { request: typeof request };
}

describe('live sell checks (indexed routes, synthetic probe outputs)', () => {
  it('routes a curve before graduation, the graduated v4 pool after it, and native v3 pools; others are unsupported', async () => {
    const db = await seed();
    expect(await sellRoute(db, curveCoin, 1000)).toEqual({ venue: 'pons_curve', coin: getAddress(curveCoin), curve: getAddress(curve) });
    expect(await sellRoute(db, graduated, 1000)).toMatchObject({ venue: 'uniswap_v4', poolId, key, hookData: '0x' });
    expect(await sellRoute(db, graduated, 40)).toMatchObject({ venue: 'pons_curve', curve: getAddress(oldCurve) });
    expect(await sellRoute(db, v3Coin, 1000)).toMatchObject({ venue: 'uniswap_v3', pool: getAddress(v3Pool), fee: 3000, weth: getAddress(weth) });
    expect(await sellRoute(db, usdgCoin, 1000)).toBeNull();
    expect(await sellRoute(db, address(77), 1000)).toBeNull();
    // With several native pools, the one with the most recent USD volume wins over the newest.
    const busy = address(12);
    await db.insert('pools', { id: binary(busy), venue: 'uniswap_v3', currency0: binary(v3Coin), currency1: binary(weth), fee: 10000, tick_spacing: 200, creation_verified: true, created_block: '5', block: '5' });
    await db.insert('swaps', { ts: new Date(epoch + 3000_000), block: '900', tx_hash: binary(`0x${(tx++).toString(16).padStart(64, '0')}`), log_index: 0, venue: 'uniswap_v3', pool_id: binary(busy),
      coin: binary(v3Coin), quote_asset: binary(weth), trader: binary(address(98)), side: 1, amount_coin: '1000', amount_quote: '1', price_quote: 1, usd: 5000 });
    expect(await sellRoute(db, v3Coin, 1000)).toMatchObject({ venue: 'uniswap_v3', pool: getAddress(busy), fee: 10000 });
  });
  it('sizes with the indexed ETH-USD of recent ETH-quoted swaps, never a default price', async () => {
    const db = await seed();
    expect(await indexedEthUsd(db, epoch + 3600_000)).toBeNull();
    for (const [sec, usd] of [[3000, 1900], [3100, 2000], [3200, 2100], [100, 9999]] as const) await ethSwap(db, sec, usd);
    expect(await indexedEthUsd(db, epoch + 3600_000)).toBe(2000);
    expect(usdToWei(1000, 2000)).toBe(5n * 10n ** 17n);
    expect(() => usdToWei(1000, 0)).toThrow();
  });
  it('checks due coins at the indexed head, stores readings and evidence, and skips coins younger than the minimum age', async () => {
    const db = await seed(); await ethSwap(db, 3500);
    let now = epoch + 3600_000;
    const rpc = chain({ [curveCoin]: 'sellable', [v3Coin]: 'honeypot', [graduated]: 'sellable' });
    const scheduler = new SellCheckScheduler(db, new SellChecker(db, rpc, { now: () => now }));
    expect(await scheduler.tick()).toBe(4);
    const latest = new Map((await db.sql.query<{ coin: Uint8Array; status: string; block: string; exit_cost_100_pct: number | null; exit_cost_1k_pct: number | null; venue: string | null }>(
      'SELECT coin,status,block,exit_cost_100_pct,exit_cost_1k_pct,venue FROM sell_check_latest')).rows.map(r => [`0x${Buffer.from(r.coin).toString('hex')}`, { ...r, block: Number(r.block) }]));
    expect(latest.get(curveCoin)).toMatchObject({ status: 'sellable', block: 1000, exit_cost_100_pct: 10, exit_cost_1k_pct: 10, venue: 'pons_curve' });
    expect(latest.get(graduated)).toMatchObject({ status: 'sellable', venue: 'uniswap_v4' });
    expect(latest.get(v3Coin)).toMatchObject({ status: 'refused', exit_cost_1k_pct: 100, venue: 'uniswap_v3' });
    expect(latest.get(usdgCoin)).toMatchObject({ status: 'unsupported', exit_cost_1k_pct: null, venue: null });
    expect(latest.has(fresh)).toBe(false);
    // Each size is one eth_call at the head block; the refused curve-free coin needed no capacity read.
    expect(rpc.request).toHaveBeenCalledTimes(6);
    expect(rpc.request.mock.calls.every(([r]) => r.method === 'eth_call' && r.params[1] === '0x3e8')).toBe(true);
    expect(Number((await db.sql.query<{ n: string }>('SELECT sum(requests) AS n FROM sell_check_runs')).rows[0]!.n)).toBe(6);
    // Nothing is due again until there is new activity past the minimum interval.
    expect(await scheduler.tick()).toBe(0);
    now += 30_000; expect(await scheduler.tick()).toBe(1);
    await db.sql.query('UPDATE read_coins SET activity=$1 WHERE coin=$2', [new Date(now), binary(curveCoin)]);
    expect(await scheduler.tick()).toBe(0);
    now += 601_000; expect((await scheduler.due(now)).map(d => d.coin)).toEqual([curveCoin]);
  });
  it('keeps the earlier reading through a provider failure on the same route, and reads only measured, recent readings', async () => {
    const db = await seed(); await ethSwap(db, 3500);
    let now = epoch + 3600_000, outcome: Outcome = 'sellable';
    const rpc = { request: vi.fn((r: { method: string; params: readonly unknown[] }) => chain({ [curveCoin]: outcome }).request(r)) };
    const checker = new SellChecker(db, rpc, { now: () => now });
    const scheduler = new SellCheckScheduler(db, checker, { minIntervalSec: 600 });
    await scheduler.tick();
    outcome = 'down'; now += 700_000;
    await db.sql.query('UPDATE read_coins SET activity=$1 WHERE coin=$2', [new Date(now - 1000), binary(curveCoin)]);
    await scheduler.tick();
    const row = (await db.sql.query<{ status: string; attempt_status: string; checked_at: Date }>('SELECT status,attempt_status,checked_at FROM sell_check_latest WHERE coin=$1', [binary(curveCoin)])).rows[0]!;
    expect(row).toMatchObject({ status: 'sellable', attempt_status: 'unavailable' });
    expect(new Date(row.checked_at).getTime()).toBe(epoch + 3600_000);
    const readings = await readSellChecks(db, [curveCoin, v3Coin, usdgCoin], now);
    expect([...readings.keys()]).toEqual([curveCoin]);
    expect(readings.get(curveCoin)).toMatchObject({ status: 'sellable', exit100: 10, exit1k: 10, block: 1000, venue: 'pons_curve' });
    expect((await readSellChecks(db, [curveCoin], now + 49 * 3600_000)).size).toBe(0);
  });
  it('stops at the daily request cap and pauses for the day when the RPC budget is exhausted', async () => {
    const db = await seed(); await ethSwap(db, 3500);
    const now = epoch + 3600_000, rpc = chain({ [curveCoin]: 'sellable', [v3Coin]: 'sellable', [graduated]: 'sellable' });
    expect(await new SellCheckScheduler(db, new SellChecker(db, rpc, { now: () => now }), { parallel: 1, dailyRequests: 7 }).tick()).toBe(2);
    const log = vi.fn();
    const exhausted = new SellCheckScheduler(db, new SellChecker(db, { request: async () => { throw new RpcGuardError('rpc_budget_exhausted'); } }, { now: () => now }), {}, log);
    const run = exhausted.run(10);
    await vi.waitFor(() => expect(log).toHaveBeenCalledWith('sell_check_paused', { reason: 'rpc_budget_exhausted' }));
    exhausted.stop(); await run;
    expect(await exhausted.tick()).toBe(0);
  });
  it('counts refused quotes per coin, today and per hour', async () => {
    const db = await seed();
    const now = epoch + 5 * 3600_000 + 600_000;
    const result = await new SellChecker(db, chain({ [v3Coin]: 'honeypot' }), { now: () => now }).check(v3Coin, 1000, [250], 2000);
    expect(result).toMatchObject({ status: 'refused', exit100: null, exit1k: null, requests: 1, ethUsd: 2000 });
    // Repeated refusals of one coin count once; a refusal from yesterday never counts today.
    for (const offset of [0, 60_000]) await recordSellRefusal(db, result, new Date(now - offset), 250);
    await recordSellRefusal(db, { ...result, coin: curveCoin }, new Date(now - 2 * 3600_000), 250);
    await recordSellRefusal(db, { ...result, coin: graduated }, new Date(epoch - 3600_000), 250);
    const totals = await sellRefusalTotals(db, now + 1000);
    expect(totals.today).toBe(2);
    expect(totals.byHour).toHaveLength(24);
    expect(totals.byHour[23]).toBe(1);
    expect(totals.byHour[21]).toBe(1);
    expect(totals.byHour.reduce((a, b) => a + b, 0)).toBe(3);
  });
});
