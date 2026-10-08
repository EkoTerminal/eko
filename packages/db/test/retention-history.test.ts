import { afterEach, describe, expect, it } from 'vitest';
import { binary, hex, migrate, migrateEngines, openDb, pruneSwaps, rebuildBalances, rebuildBars, refreshBars, runRetention, trendingAt, type ChainDb } from '../src/index.js';

// Per-coin history retention: quiet Danger coins after two days, every quiet coin after eight. Days are counted from
// the fixture epoch; the pass runs on day 40.
const epoch = Date.parse('2026-08-01T00:00:00Z');
const DAY = 86_400_000, MINUTE = 60_000;
const at = (day: number) => new Date(epoch + day * DAY);
const now = () => epoch + 40 * DAY;
const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}` as `0x${string}`;
const hash = (n: number) => `0x${n.toString(16).padStart(64, '0')}` as `0x${string}`;
const zero = address(0), weth = address(0xee), deployer = address(0xde);
const holders = [address(0x11), address(0x12), address(0x13)];
const coins = { dead: address(0xa1), danger: address(0xa2), calm: address(0xa3), active: address(0xa4), unlabeled: address(0xa5), pending: address(0xa6), untraded: address(0xa7) };
const poolOf = (coin: `0x${string}`) => address(Number(BigInt(coin)) + 0x100);
const handles: ChainDb[] = [];
afterEach(async () => { await Promise.all(handles.splice(0).map(db => db.close())); });

let block = 0, event = 0;
/** The block at `day`: numbers follow time (a sparse chain), and the engines' clock mirrors the indexed headers. */
const blockOf = (day: number) => Math.round(day * 1000) + 1;
async function blockAt(db: ChainDb, day: number) {
  const n = blockOf(day);
  block = Math.max(block, n);
  await db.insert('chain_blocks', { number: String(n), block: String(n), hash: binary(hash(n)), parent_hash: binary(hash(n - 1)), ts: at(day) });
  await db.sql.query("INSERT INTO engine_block_times VALUES($1,$2,$3,'head') ON CONFLICT DO NOTHING", [n, at(day), binary(hash(n))]);
  return n;
}
async function token(db: ChainDb, coin: `0x${string}`, day: number) {
  const n = await blockAt(db, day);
  await db.insert('tokens', { address: binary(coin), deployer: binary(deployer), curve: null, name: 'Sample token', symbol: 'DEMO', launchpad: null,
    decimals: 0, total_supply: '3000', supply_block: String(n), first_block: String(n), block: String(n) });
  await db.insert('pools', { id: binary(poolOf(coin)), venue: 'uniswap_v3', currency0: binary(coin), currency1: binary(weth), fee: 3000, tick_spacing: 60,
    creation_verified: true, created_block: String(n), block: String(n) });
  for (const h of holders) await transfer(db, n, day, coin, zero, h, 1000);
  return n;
}
async function transfer(db: ChainDb, n: number, day: number, coin: `0x${string}`, from: `0x${string}`, to: `0x${string}`, amount: number) {
  await db.insert('token_transfers', { ts: at(day), block: String(n), tx_hash: binary(hash(++event)), log_index: 0, token: binary(coin),
    from_address: binary(from), to_address: binary(to), amount: String(amount) });
}
async function swap(db: ChainDb, n: number, day: number, coin: `0x${string}`, trader: `0x${string}`, side: 1 | -1, extra: Record<string, unknown> = {}) {
  await db.insertMany('swaps', [{ ts: at(day), block: String(n), tx_hash: binary(hash(++event)), log_index: 0, venue: 'uniswap_v3', pool_id: binary(poolOf(coin)),
    coin: binary(coin), quote_asset: binary(weth), trader: binary(trader), tx_from: binary(trader), tx_to: null, side, amount_coin: '100', amount_quote: '1',
    price_quote: 0.01, usd: 2, priced_block: String(n), ...extra }]);
  await db.tx(tx => refreshBars(tx, [{ coin: binary(coin), minute: new Date(Math.floor(at(day).getTime() / MINUTE) * MINUTE) }]));
}
async function liquidity(db: ChainDb, n: number, day: number, coin: `0x${string}`, actor: `0x${string}`, kind: string) {
  await db.insert('liquidity_events', { block: String(n), ts: at(day), tx_hash: binary(hash(++event)), log_index: 0, venue: 'uniswap_v3', pool_id: binary(poolOf(coin)),
    kind, actor: binary(actor), data: JSON.stringify({ owner: actor, amount: '10', tickLower: '-60', tickUpper: '60' }) });
}
async function pons(db: ChainDb, n: number, coin: `0x${string}`, kind: string) {
  await db.insert('pons_events', { block: String(n), tx_hash: binary(hash(++event)), log_index: 0, token: binary(coin), emitter: binary(address(0xfa)), kind, data: '{}' });
}
async function card(db: ChainDb, coin: `0x${string}`, level: string) {
  await db.sql.query('INSERT INTO coin_cards VALUES($1,$2,1,$3,$4,$5)', [`card:${coin}`, binary(coin), 'sample-hash', JSON.stringify({ verdict: { level } }), '1.0.0']);
  await db.sql.query('INSERT INTO coin_card_latest VALUES($1,$2,1,$3)', [binary(coin), `card:${coin}`, JSON.stringify({ verdict: { level } })]);
}
async function outcomes(db: ChainDb, coin: `0x${string}`, horizons = ['1h', '24h', '7d']) {
  for (const horizon of horizons) await db.sql.query("INSERT INTO outcomes VALUES($1,$2,1,'rugged','{}')", [binary(coin), horizon]);
}
/** A coin traded from `from` to `to` (days): buys by two holders, one sell, holder transfers, LP and Pons events. */
async function traded(db: ChainDb, coin: `0x${string}`, from: number, to: number) {
  const n = await blockAt(db, from + 0.001);
  // Three swaps in one minute, so retention must delete them together.
  await swap(db, n, from + 0.001, coin, holders[0]!, 1); await swap(db, n, from + 0.001, coin, holders[1]!, 1); await swap(db, n, from + 0.001, coin, holders[0]!, -1);
  await liquidity(db, n, from + 0.001, coin, holders[2]!, 'Mint'); await liquidity(db, n, from + 0.001, coin, deployer, 'Mint');
  await pons(db, n, coin, 'launch'); await pons(db, n, coin, 'trade');
  const m = await blockAt(db, (from + to) / 2);
  await transfer(db, m, (from + to) / 2, coin, holders[0]!, holders[1]!, 7); await swap(db, m, (from + to) / 2, coin, holders[1]!, 1);
  // The deployer's liquidity removal stays: other launches of this deployer read it as a prior removal.
  const last = await blockAt(db, to);
  await liquidity(db, last, to, coin, deployer, 'Burn'); await transfer(db, last, to, coin, holders[1]!, holders[2]!, 3); await swap(db, last, to, coin, holders[1]!, -1);
}

async function fixture() {
  block = 0; event = 0;
  const db = await openDb({ pgliteDir: ':memory:' }); handles.push(db);
  await migrate(db); await migrateEngines(db); await db.ensurePartitions(at(0));
  await db.insert('tokens', { address: binary(weth), deployer: null, curve: null, name: 'Quote token', symbol: 'QUOTE', launchpad: null, decimals: 18,
    total_supply: null, supply_block: null, first_block: '0', block: '0' });
  await token(db, coins.dead, 0); await traded(db, coins.dead, 0, 3); await outcomes(db, coins.dead); await card(db, coins.dead, 'monitor');
  // Launched while the dead coin traded: its trending window reads the dead coin's first swaps.
  await token(db, coins.active, 0.01); await traded(db, coins.active, 0.02, 39.9); await outcomes(db, coins.active); await card(db, coins.active, 'clear');
  await token(db, coins.unlabeled, 0.5); await traded(db, coins.unlabeled, 0.6, 2); await outcomes(db, coins.unlabeled, ['1h']);
  await token(db, coins.pending, 0.7); await traded(db, coins.pending, 0.8, 2); await outcomes(db, coins.pending);
  await db.sql.query('UPDATE swaps SET senders_pending=true WHERE coin=$1 AND side=-1', [binary(coins.pending)]);
  await token(db, coins.untraded, 1);
  await token(db, coins.danger, 30); await traded(db, coins.danger, 30, 37); await outcomes(db, coins.danger); await card(db, coins.danger, 'danger');
  await token(db, coins.calm, 30); await traded(db, coins.calm, 30, 37); await outcomes(db, coins.calm); await card(db, coins.calm, 'monitor');
  await blockAt(db, 39.95);
  await db.tx(tx => rebuildBalances(tx));
  return db;
}
const counts = async (db: ChainDb, coin: `0x${string}`) => {
  const n = async (sql: string) => Number((await db.sql.query<{ n: string }>(sql, [binary(coin)])).rows[0]!.n);
  return { transfers: await n('SELECT count(*) AS n FROM token_transfers WHERE token=$1'), swaps: await n('SELECT count(*) AS n FROM swaps WHERE coin=$1'),
    liquidity: await n('SELECT count(*) AS n FROM liquidity_events e JOIN pools p ON p.id=e.pool_id WHERE p.currency0=$1'), pons: await n('SELECT count(*) AS n FROM pons_events WHERE token=$1'),
    bars: await n('SELECT count(*) AS n FROM bars_1m WHERE coin=$1') };
};
const table = async (db: ChainDb, sql: string) => (await db.sql.query(sql)).rows.map(row => JSON.stringify(row, (_, v) => v?.type === 'Buffer' ? hex(Buffer.from(v.data)) : v));
const kept = (db: ChainDb) => Promise.all(['balances', 'bars_1m', 'coin_card_latest', 'coin_cards', 'outcomes', 'pools', 'tokens', 'read_buyers', 'read_coins']
  .map(name => table(db, `SELECT * FROM ${name} ORDER BY 1,2`)));
const prune = async (db: ChainDb, coin: `0x${string}`) => (await db.sql.query<{ rule: string; through_block: string; swaps_through_block: string | null; first_trade_ts: Date | null;
  last_trade_ts: Date | null; buyers: string; transfers: string; swaps: string; liquidity: string; pons: string }>(`SELECT rule,through_block::text,swaps_through_block::text,
  first_trade_ts,last_trade_ts,buyers::text,transfers::text,swaps::text,liquidity::text,pons::text FROM history_prunes WHERE coin=$1`, [binary(coin)])).rows[0];
const refreshReads = (db: ChainDb) => db.sql.query('SELECT refresh_read_models($1::bytea[],$2::bigint)', [Object.values(coins).map(binary), Math.floor(now() / 1000)]);

describe('per-coin history retention', () => {
  it('drops raw history of quiet and quiet Danger coins, keeps their summaries, and leaves every other coin alone', async () => {
    const db = await fixture();
    await refreshReads(db);
    const before = Object.fromEntries(await Promise.all(Object.entries(coins).map(async ([k, c]) => [k, await counts(db, c)])));
    const summaries = await kept(db);
    const trending = await trendingAt(db, blockOf(0.01), (at(0.01).getTime() / 1000) - 3600);
    expect(trending.map(r => r.coin)).toContain(coins.dead);
    const result = await runRetention(db, { quoteTokens: [weth], dangerQuietDays: 2, quietCoinDays: 8, batchRows: 2, now });
    expect(result).toMatchObject({ finished: true, dangerCoins: 1, quietCoins: 2 });
    // Dead for 37 days: transfers rolled into baselines, liquidity, Pons and swaps gone, except the deployer's removal.
    expect(await counts(db, coins.dead)).toEqual({ transfers: 0, swaps: 0, liquidity: 1, pons: 0, bars: before.dead.bars });
    expect(await prune(db, coins.dead)).toMatchObject({ rule: 'quiet_coin', buyers: '2', transfers: String(before.dead.transfers), swaps: String(before.dead.swaps),
      liquidity: '2', pons: '2', first_trade_ts: at(0.001), last_trade_ts: at(3) });
    expect((await prune(db, coins.dead))!.swaps_through_block).not.toBeNull();
    // Danger and quiet for three days: transfers and events go now, swaps stay until they are 28 days quiet.
    expect(await counts(db, coins.danger)).toEqual({ ...before.danger, transfers: 0, liquidity: 1, pons: 0 });
    expect(await prune(db, coins.danger)).toMatchObject({ rule: 'danger_quiet', swaps_through_block: null });
    // Never traded, so its outcomes are decided without labels: only its mint transfers existed.
    expect(await counts(db, coins.untraded)).toMatchObject({ transfers: 0, swaps: 0 });
    // Untouched: a Monitor coin quiet for three days, an active coin, a coin with an unlabeled 24h outcome and a coin
    // with a swap still waiting for sender enrichment.
    for (const coin of ['calm', 'active', 'unlabeled', 'pending'] as const) {
      expect(await counts(db, coins[coin])).toEqual(before[coin]);
      expect(await prune(db, coins[coin])).toBeUndefined();
    }
    // Summaries are intact: balances, minute bars, cards, outcomes, pools, tokens and the read models (buyers and last
    // trade of the pruned coins included).
    await db.tx(tx => rebuildBalances(tx)); await refreshReads(db);
    expect(await kept(db)).toEqual(summaries);
    // A rebuild of every bar (as after a reorg) keeps the pruned coins' bars instead of rebuilding them from nothing.
    await db.tx(tx => rebuildBars(tx, 0n, BigInt(block)));
    expect(await kept(db)).toEqual(summaries);
    // The trending list a later launch read from the dead coin's swaps was saved before they went.
    expect(result.trendingSnapshots).toBeGreaterThan(0);
    expect(await trendingAt(db, blockOf(0.01), (at(0.01).getTime() / 1000) - 3600)).toEqual(trending);
    // Nothing is left to do on the next pass.
    expect(await runRetention(db, { quoteTokens: [weth], dangerQuietDays: 2, quietCoinDays: 8, now })).toMatchObject({ finished: true, dangerCoins: 0, quietCoins: 0,
      historyTransfers: 0, historyLiquidity: 0, historyPons: 0, historySwaps: 0 });
  });

  it('stops at its time budget and finishes over later passes with the same result', async () => {
    const full = await fixture();
    await runRetention(full, { quoteTokens: [weth], dangerQuietDays: 2, quietCoinDays: 8, now });
    const expected = await Promise.all(Object.values(coins).map(c => counts(full, c)));
    const db = await fixture();
    let clock = now(), passes = 0;
    for (;;) {
      passes++;
      const result = await runRetention(db, { quoteTokens: [weth], dangerQuietDays: 2, quietCoinDays: 8, batchRows: 1, budgetMs: 10, now: () => (clock += 1) });
      clock = now();
      if (result.finished) break;
      expect(passes).toBeLessThan(200);
    }
    expect(passes).toBeGreaterThan(1);
    expect(await Promise.all(Object.values(coins).map(c => counts(db, c)))).toEqual(expected);
    expect(await table(db, 'SELECT rule,through_block,swaps_through_block,first_trade_ts,last_trade_ts,buyers,transfers,swaps,liquidity,pons FROM history_prunes ORDER BY coin'))
      .toEqual(await table(full, 'SELECT rule,through_block,swaps_through_block,first_trade_ts,last_trade_ts,buyers,transfers,swaps,liquidity,pons FROM history_prunes ORDER BY coin'));
  });

  it('deletes swaps in whole minutes and puts the coin\'s Watcher flow mark back as it was', async () => {
    const db = await fixture(), dead = binary(coins.dead);
    const minutes = async () => (await db.sql.query<{ m: Date }>("SELECT DISTINCT date_trunc('minute',ts) AS m FROM swaps WHERE coin=$1 ORDER BY 1", [dead])).rows.map(r => r.m.getTime());
    const all = await minutes();
    await db.sql.query('INSERT INTO flow_dirty(coin,revision,from_sec) VALUES($1,77,123.5) ON CONFLICT(coin) DO UPDATE SET revision=77,from_sec=123.5', [dead]);
    // One row per batch still removes the whole first minute (three swaps).
    expect(await pruneSwaps(db, dead, BigInt(block), 1)).toBe(3);
    expect(await minutes()).toEqual(all.slice(1));
    expect((await db.sql.query('SELECT revision::text,from_sec FROM flow_dirty WHERE coin=$1', [dead])).rows).toEqual([{ revision: '77', from_sec: 123.5 }]);
    await db.sql.query('DELETE FROM flow_dirty');
    expect(await pruneSwaps(db, dead, BigInt(block), 1)).toBe(1);
    expect((await db.sql.query('SELECT 1 FROM flow_dirty')).rows).toHaveLength(0);
  });

  it('keeps tracking a revived coin, refuses an eight-day window inside the engines window, and is off unless configured', async () => {
    const db = await fixture();
    expect(await runRetention(db, { quoteTokens: [weth], now })).toMatchObject({ dangerCoins: 0, quietCoins: 0, historyTransfers: 0 });
    expect((await db.sql.query('SELECT 1 FROM history_prunes')).rows).toHaveLength(0);
    await expect(runRetention(db, { quoteTokens: [weth], quietCoinDays: 7, now })).rejects.toThrow('idle window');
    await expect(runRetention(db, { quoteTokens: [weth], dangerQuietDays: 0, now })).rejects.toThrow('quiet day');
    // The API keeps the read models current; buyers and the last trade survive the swaps they came from.
    await refreshReads(db);
    await runRetention(db, { quoteTokens: [weth], quietCoinDays: 8, now });
    await refreshReads(db);
    const summary = (await db.sql.query<{ buyers: string; activity: Date }>('SELECT buyers::text,activity FROM read_coins WHERE coin=$1', [binary(coins.dead)])).rows[0]!;
    expect(summary).toEqual({ buyers: '2', activity: at(3) });
    // The dead coin trades again: a new buyer joins the kept buyers, the last trade moves, and it is no longer quiet.
    const n = await blockAt(db, 40.5);
    await swap(db, n, 40.5, coins.dead, address(0x99), 1); await transfer(db, n, 40.5, coins.dead, holders[2]!, address(0x99), 5);
    await refreshReads(db);
    expect((await db.sql.query('SELECT buyers::text,activity FROM read_coins WHERE coin=$1', [binary(coins.dead)])).rows[0]).toEqual({ buyers: '3', activity: at(40.5) });
    expect(await runRetention(db, { quoteTokens: [weth], quietCoinDays: 8, now: () => epoch + 41 * DAY })).toMatchObject({ quietCoins: 0 });
    expect(await counts(db, coins.dead)).toMatchObject({ swaps: 1, transfers: 1 });
  });
});
