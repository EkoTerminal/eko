import { afterEach, describe, expect, it } from 'vitest';
import { binary, hex, migrate, migrateEngines, openDb, rebuildBalances, runRetention, ScanJobs, type ChainDb } from '@eko/db';
import { CoinCardSchema, type Address, type CoinCard } from '@eko/shared';
import type { Hex } from 'viem';
import { EngineWorker } from '../src/worker.js';
import { loadSources } from '../src/sources.js';
import { loadFingerprintInput } from '../src/watcher/store.js';

// A quiet coin whose raw history retention dropped (packages/db/src/retention.ts) must not be re-carded from what is
// left, and must be evaluated correctly, with the affected checks marked partial, once it trades again.
const address = (n: number): Address => `0x${n.toString(16).padStart(40, '0')}`;
const hash = (n: number): Hex => `0x${n.toString(16).padStart(64, '0')}`;
const coin = address(1), deployer = address(2), pool = address(5), zero = address(0);
const traders = [address(0x11), address(0x12), address(0x13)], newcomer = address(0x21), latecomer = address(0x22);
const epoch = Date.parse('2026-08-01T00:00:00Z') / 1000, DAY = 86_400;
const handles: ChainDb[] = [];
afterEach(async () => { await Promise.all(handles.splice(0).map(db => db.close())); });
let event = 0;

async function block(db: ChainDb, n: number, sec: number) {
  await db.insert('chain_blocks', { number: String(n), block: String(n), hash: binary(hash(n)), parent_hash: binary(hash(n - 1)), ts: new Date((epoch + sec) * 1000) });
}
async function swap(db: ChainDb, n: number, sec: number, trader: Address, side: 1 | -1) {
  await db.insert('swaps', { ts: new Date((epoch + sec) * 1000), block: String(n), tx_hash: binary(hash(++event)), log_index: 0, venue: 'uniswap_v3', pool_id: binary(pool),
    coin: binary(coin), quote_asset: binary(zero), trader: binary(trader), tx_from: binary(trader), tx_to: binary(pool), side, amount_coin: '100', amount_quote: '100',
    price_quote: 1, usd: 10, priced_block: String(n) });
}
async function transfer(db: ChainDb, n: number, sec: number, from: Address, to: Address, amount: number) {
  await db.insert('token_transfers', { ts: new Date((epoch + sec) * 1000), block: String(n), tx_hash: binary(hash(++event)), log_index: 0, token: binary(coin),
    from_address: binary(from), to_address: binary(to), amount: String(amount) });
  await db.tx(tx => rebuildBalances(tx));
}
async function lp(db: ChainDb, n: number, sec: number, actor: Address, kind: string) {
  await db.insert('liquidity_events', { block: String(n), ts: new Date((epoch + sec) * 1000), tx_hash: binary(hash(++event)), log_index: 0, venue: 'uniswap_v3', pool_id: binary(pool),
    kind, actor: binary(actor), data: JSON.stringify({ owner: actor, amount: '1000', tickLower: '-100', tickUpper: '100' }) });
}
async function fixture() {
  const db = await openDb({ pgliteDir: ':memory:' }); handles.push(db);
  await migrate(db); await migrateEngines(db); await db.ensurePartitions(new Date(epoch * 1000));
  await block(db, 1, 0);
  await db.insert('tokens', { address: binary(coin), deployer: binary(deployer), curve: null, name: 'Sample token', symbol: 'DEMO', launchpad: 'other', decimals: 0,
    total_supply: '3000', supply_block: '1', first_block: '1', block: '1' });
  await db.insert('pools', { id: binary(pool), venue: 'uniswap_v3', currency0: binary(coin), currency1: binary(zero), fee: 3000, tick_spacing: 1, creation_verified: true, created_block: '1', block: '1' });
  for (const t of traders) await transfer(db, 1, 0, zero, t, 1000);
  await block(db, 2, 60); await lp(db, 2, 60, deployer, 'Mint'); await lp(db, 2, 60, traders[2]!, 'Mint');
  await swap(db, 2, 60, traders[0]!, 1); await swap(db, 2, 60, traders[1]!, 1);
  await block(db, 3, 120); await swap(db, 3, 120, traders[0]!, -1); await transfer(db, 3, 120, traders[0]!, traders[1]!, 50);
  // Last activity on day 5, then quiet.
  await block(db, 10, 5 * DAY); await swap(db, 10, 5 * DAY, traders[1]!, 1); await transfer(db, 10, 5 * DAY, traders[1]!, traders[2]!, 20);
  return db;
}
const cards = async (db: ChainDb) => Number((await db.sql.query<{ n: string }>('SELECT count(*) AS n FROM coin_cards')).rows[0]!.n);
const latest = async (db: ChainDb): Promise<CoinCard> => CoinCardSchema.parse((await db.sql.query<{ data: unknown }>('SELECT data FROM coin_card_latest WHERE coin=$1', [binary(coin)])).rows[0]!.data);
const failure = async (db: ChainDb) => (await db.sql.query<{ reason: string }>('SELECT reason FROM engine_card_failures WHERE coin=$1', [binary(coin)])).rows[0]?.reason;
/** Holders with a positive balance, from balances (kept exact through baselines), excluding sinks. */
const rating = async (db: ChainDb) => (await db.sql.query('SELECT verdict_level,danger_playbooks FROM history_prunes WHERE coin=$1', [binary(coin)])).rows[0];
const holders = async (db: ChainDb) => Number((await db.sql.query<{ n: string }>(`SELECT count(*) AS n FROM balances WHERE token=$1 AND amount>0
  AND holder<>$1 AND holder<>decode(repeat('00',20),'hex')`, [binary(coin)])).rows[0]!.n);

describe('engines over pruned coin history', () => {
  it('leaves a pruned quiet coin alone and evaluates it with partial checks once it trades again', async () => {
    const db = await fixture();
    await block(db, 11, 5 * DAY + 600);
    const worker = (sec: number) => new EngineWorker(db, { now: () => epoch + sec });
    expect(await worker(5 * DAY + 600).poll()).toBeGreaterThan(0);
    // A Danger card, all three outcome horizons labeled, then two quiet days: the Danger rule drops its transfers and
    // liquidity events. Its swaps stay (they are younger than 28 days).
    await db.sql.query(`UPDATE coin_card_latest SET data=jsonb_set(data,'{verdict,level}','"danger"') WHERE coin=$1`, [binary(coin)]);
    for (const horizon of ['1h', '24h', '7d']) await db.sql.query("INSERT INTO outcomes VALUES($1,$2,1,'rugged','{}') ON CONFLICT DO NOTHING", [binary(coin), horizon]);
    await block(db, 20, 8 * DAY);
    expect(await runRetention(db, { quoteTokens: [], dangerQuietDays: 2, now: () => (epoch + 8 * DAY) * 1000 })).toMatchObject({ dangerCoins: 1, historyLiquidity: 2, historySwaps: 0 });
    expect(await rating(db)).toEqual({ verdict_level: 'danger', danger_playbooks: [] });
    const before = await cards(db), card = await latest(db);
    // Still inside the engines' seven-day window, but nothing new happened: no re-evaluation, no failure, same card.
    await worker(8 * DAY).poll();
    expect(await cards(db)).toBe(before);
    expect(await failure(db)).toBeUndefined();
    expect(await latest(db)).toEqual(card);
    // An on-demand scan answers with the kept card instead of re-checking it from partial history.
    const job = await new ScanJobs(db).ensure(coin, coin, 'pending');
    await db.sql.query("UPDATE scan_jobs SET phase='evaluating' WHERE id=$1", [job.id]);
    expect(await worker(8 * DAY).processScanJobs(20)).toBe(1);
    expect(await new ScanJobs(db).get(job.id)).toMatchObject({ phase: 'done', status: 'ready' });
    expect(await cards(db)).toBe(before);
    // A direct load refuses rather than reading the gap.
    expect(await loadSources(db, coin, 20)).toBeNull();
    expect(await failure(db)).toBe('history_pruned');

    // It trades again: evaluated from balances and baselines plus the new activity, with the pruned checks partial.
    await block(db, 21, 8 * DAY + 3600); await swap(db, 21, 8 * DAY + 3600, newcomer, 1); await transfer(db, 21, 8 * DAY + 3600, traders[2]!, newcomer, 5);
    expect(await worker(8 * DAY + 3700).poll()).toBeGreaterThan(0);
    expect(await cards(db)).toBeGreaterThan(before);
    const revived = await latest(db);
    expect(revived.meta?.liquidity?.coverageGaps?.liquidity_ownership?.reason).toBe('history_pruned');
    expect(revived.meta?.liquidity?.unavailable).toBe(true);
    expect(revived.verdict.reasons.join(' ')).toContain('liquidity ownership (history pruned)');
    // Rated Danger when pruned: it stays Danger, although no Danger match can be re-run from what is left.
    expect(revived.verdict.level).toBe('danger');
    expect(revived.verdict.reasons[0]).toBe('Rated Danger before its history was pruned');
    expect(revived.verdict.playbooks.some(m => m.level === 'danger')).toBe(false);
    const sources = (await loadSources(db, coin, 21))!;
    expect(sources.holderSummary.count).toBe(await holders(db));
    expect(sources.liquidity).toBeUndefined();
    // Its swaps were kept, so whole-life trade checks are still measured.
    expect(sources.attributionCoverage?.deployer_sells?.reason).toBe('unattributed_swaps');

    // Quiet again for 28 days: its swaps go too (trending lists are saved first). A later revival marks the whole-life
    // trade checks partial, and a buyer's place among the coin's buyers counts the deleted buyers.
    for (const horizon of ['1h', '24h', '7d']) expect((await db.sql.query('SELECT 1 FROM outcomes WHERE coin=$1 AND horizon=$2', [binary(coin), horizon])).rows).toHaveLength(1);
    await block(db, 30, 40 * DAY);
    const second = await runRetention(db, { quoteTokens: [], quietCoinDays: 8, now: () => (epoch + 40 * DAY) * 1000 });
    expect(second).toMatchObject({ quietCoins: 1, historySwaps: 5 });
    expect((await db.sql.query('SELECT 1 FROM trending_snapshots WHERE created_block=1')).rows).toHaveLength(1);
    await block(db, 31, 41 * DAY); await swap(db, 31, 41 * DAY, latecomer, 1); await transfer(db, 31, 41 * DAY, traders[2]!, latecomer, 5);
    const late = (await loadSources(db, coin, 31))!;
    for (const key of ['deployer_sells', 'bundles', 'fresh_wallet_share', 'exempt_insiders']) expect(late.attributionCoverage?.[key]?.reason).toBe('history_pruned');
    // Still Danger after a second prune and revival.
    expect(await rating(db)).toEqual({ verdict_level: 'danger', danger_playbooks: [] });
    expect(await worker(41 * DAY + 100).poll()).toBeGreaterThan(0);
    expect((await latest(db)).verdict.level).toBe('danger');
    expect(late.holderSummary.count).toBe(await holders(db));
    const reactions = (await loadFingerprintInput(db, latecomer, 31)).input.reactions;
    // Three distinct buyers were deleted (two original ones and the first revival's newcomer); the latecomer is fourth at best.
    expect(reactions.find(r => r.coin === hex(binary(coin)))?.buyerRank).toBe(4);
  });

  it('does not carry a non-Danger rating forward: a revived coin pruned as Clear is not Clear while checks are partial', async () => {
    const db = await fixture();
    await block(db, 11, 5 * DAY + 600);
    const worker = (sec: number) => new EngineWorker(db, { now: () => epoch + sec });
    expect(await worker(5 * DAY + 600).poll()).toBeGreaterThan(0);
    await db.sql.query(`UPDATE coin_card_latest SET data=jsonb_set(data,'{verdict,level}','"clear"') WHERE coin=$1`, [binary(coin)]);
    for (const horizon of ['1h', '24h', '7d']) await db.sql.query("INSERT INTO outcomes VALUES($1,$2,1,'survived','{}') ON CONFLICT DO NOTHING", [binary(coin), horizon]);
    await block(db, 20, 14 * DAY);
    expect(await runRetention(db, { quoteTokens: [], quietCoinDays: 8, now: () => (epoch + 14 * DAY) * 1000 })).toMatchObject({ quietCoins: 1, historyLiquidity: 2 });
    expect(await rating(db)).toEqual({ verdict_level: 'clear', danger_playbooks: [] });
    await block(db, 21, 14 * DAY + 3600); await swap(db, 21, 14 * DAY + 3600, newcomer, 1); await transfer(db, 21, 14 * DAY + 3600, traders[2]!, newcomer, 5);
    expect(await worker(14 * DAY + 3700).poll()).toBeGreaterThan(0);
    const revived = await latest(db);
    expect(['clear', 'danger']).not.toContain(revived.verdict.level);
    expect(revived.verdict.reasons.join(' ')).toContain('liquidity ownership (history pruned)');
    expect(revived.verdict.reasons.join(' ')).not.toContain('Rated Danger');
  });
});
