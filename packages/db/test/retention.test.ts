import { afterEach, describe, expect, it } from 'vitest';
import { binary, hex, migrate, openDb, rebuildBalances, runRetention, type ChainDb } from '../src/index.js';

const epoch = Date.parse('2026-10-01T00:00:00Z');
const DAY = 86_400_000;
const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}` as `0x${string}`;
const hash = (n: number) => `0x${n.toString(16).padStart(64, '0')}` as `0x${string}`;
const zero = address(0), quote = address(0xa1), idle = address(0xb1), active = address(0xc1);
const holders = [address(0x11), address(0x12), address(0x13)];
const handles: ChainDb[] = [];
afterEach(async () => { await Promise.all(handles.splice(0).map(db => db.close())); });

let eventId = 1;
async function database() {
  const db = await openDb({ pgliteDir: ':memory:' }); handles.push(db);
  await migrate(db); await db.ensurePartitions(new Date(epoch));
  return db;
}
const at = (day: number) => new Date(epoch + day * DAY);
async function block(db: ChainDb, n: number, day: number) {
  await db.insert('chain_blocks', { number: String(n), block: String(n), hash: binary(hash(n)), parent_hash: binary(hash(n - 1)), ts: at(day) });
}
async function transfer(db: ChainDb, n: number, day: number, token: `0x${string}`, from: `0x${string}`, to: `0x${string}`, amount: number, kind = 'Transfer') {
  await db.insert('token_transfers', { ts: at(day), block: String(n), tx_hash: binary(hash(eventId++)), log_index: 0,
    token: binary(token), from_address: binary(from), to_address: binary(to), amount: String(amount), kind });
}
async function token(db: ChainDb, address: `0x${string}`) {
  await db.insert('tokens', { address: binary(address), deployer: binary(zero), curve: null, name: 'Sample token', symbol: 'DEMO',
    launchpad: null, decimals: 0, total_supply: '1000000', supply_block: '1', first_block: '1', block: '1' });
}
const balances = async (db: ChainDb) => (await db.sql.query<{ token: Uint8Array; holder: Uint8Array; amount: string }>(
  'SELECT token, holder, amount::text FROM balances ORDER BY token, holder')).rows.map(r => `${hex(r.token)}:${hex(r.holder)}:${r.amount}`);
const count = async (db: ChainDb, token: `0x${string}`) => Number((await db.sql.query<{ n: string }>(
  'SELECT count(*)::text AS n FROM token_transfers WHERE token=$1', [binary(token)])).rows[0]!.n);

async function fixture() {
  const db = await database();
  for (const t of [quote, idle, active]) await token(db, t);
  // Days 0-9: mints and churn on every token; days 18-20: only the quote and active tokens keep moving.
  let n = 1;
  for (let day = 0; day <= 20; day++) {
    await block(db, n, day);
    for (const t of [quote, idle, active]) {
      if (day > 9 && t === idle) continue;
      if (day > 9 && day < 18) continue;
      if (day === 0) for (const h of holders) await transfer(db, n, day, t, zero, h, 1000);
      else await transfer(db, n, day, t, holders[day % 3]!, holders[(day + 1) % 3]!, day * 3);
      if (t === quote && day % 4 === 0) await transfer(db, n, day, t, holders[0]!, zero, 0, 'Deposit');
    }
    n++;
  }
  await db.tx(tx => rebuildBalances(tx));
  return db;
}

describe('chain retention roll-up', () => {
  it('compacts old quote and idle-token transfers while every recomputed balance stays exact', async () => {
    const db = await fixture(), before = await balances(db);
    const quoteBefore = await count(db, quote), activeBefore = await count(db, active);
    const result = await runRetention(db, { quoteTokens: [quote], quoteDays: 2, idleTokenDays: 8, batchRows: 5, now: () => epoch + 20.5 * DAY });
    expect(result).toMatchObject({ finished: true, idleTokens: 1 });
    expect(result.quoteRows).toBeGreaterThan(0);
    // Quote: only the last two days remain. Idle token: nothing remains. Active token: untouched.
    expect(await count(db, quote)).toBeLessThan(quoteBefore);
    expect(Number((await db.sql.query<{ n: string }>("SELECT count(*)::text AS n FROM token_transfers WHERE token=$1 AND ts < $2", [binary(quote), at(18.5)])).rows[0]!.n)).toBe(0);
    expect(await count(db, idle)).toBe(0);
    expect(await count(db, active)).toBe(activeBefore);
    // A full rebuild and a touched recompute both reproduce the original balances.
    await db.tx(tx => rebuildBalances(tx));
    expect(await balances(db)).toEqual(before);
    await db.tx(tx => rebuildBalances(tx, holders.map(h => ({ token: binary(quote), holder: binary(h) }))));
    expect(await balances(db)).toEqual(before);
    // A new transfer after compaction moves the balance by exactly its amount.
    await block(db, 99, 20.6); await transfer(db, 99, 20.6, quote, holders[0]!, holders[1]!, 7);
    await db.tx(tx => rebuildBalances(tx, [holders[0]!, holders[1]!].map(h => ({ token: binary(quote), holder: binary(h) }))));
    const after = await balances(db), key = (h: `0x${string}`) => `${quote}:${h}:`;
    const amount = (rows: string[], h: `0x${string}`) => BigInt(rows.find(r => r.startsWith(key(h)))!.split(':')[2]!);
    expect(amount(after, holders[0]!)).toBe(amount(before, holders[0]!) - 7n);
    expect(amount(after, holders[1]!)).toBe(amount(before, holders[1]!) + 7n);
    // A second pass has nothing left to do.
    expect(await runRetention(db, { quoteTokens: [quote], quoteDays: 2, idleTokenDays: 8, now: () => epoch + 20.5 * DAY }))
      .toMatchObject({ quoteRows: 0, idleRows: 0, idleTokens: 0, finished: true });
  });

  it('is off unless configured, refuses an idle window inside the engines window, and stops at its time budget', async () => {
    const db = await fixture(), total = await count(db, quote) + await count(db, idle) + await count(db, active);
    expect(await runRetention(db, { quoteTokens: [quote], now: () => epoch + 20.5 * DAY })).toMatchObject({ quoteRows: 0, idleRows: 0, pendingRows: 0 });
    expect(await count(db, quote) + await count(db, idle) + await count(db, active)).toBe(total);
    await expect(runRetention(db, { quoteTokens: [quote], idleTokenDays: 7, now: () => epoch + 20.5 * DAY })).rejects.toThrow('idle window');
    let clock = epoch + 20.5 * DAY;
    const partial = await runRetention(db, { quoteTokens: [quote], quoteDays: 2, batchRows: 2, budgetMs: 1, now: () => (clock += 1) });
    expect(partial.finished).toBe(false);
  });

  it('deletes old events of pools that are still unknown and keeps known or recent ones', async () => {
    const db = await fixture(), pool = (n: number) => binary(address(0xd0 + n));
    await db.insert('pools', { id: pool(1), venue: 'uniswap_v3', currency0: binary(active), currency1: binary(zero), fee: 3000, tick_spacing: 1, creation_verified: true, created_block: '1', block: '1' });
    for (const [n, emitter, blockNumber] of [[1, 1, 2], [2, 2, 2], [3, 2, 20]] as const) {
      await db.sql.query('INSERT INTO pending_pool_events(block,tx_hash,log_index,emitter,currency_hints,data) VALUES($1,$2,0,$3,$4,$5)',
        [String(blockNumber), binary(hash(5000 + n)), pool(emitter), '[]', '{}']);
    }
    expect(await runRetention(db, { quoteTokens: [], pendingPoolDays: 3, now: () => epoch + 20.5 * DAY })).toMatchObject({ pendingRows: 1 });
    expect((await db.sql.query<{ block: string; emitter: Uint8Array }>('SELECT block::text, emitter FROM pending_pool_events ORDER BY block')).rows
      .map(r => [r.block, hex(r.emitter)])).toEqual([['2', address(0xd1)], ['20', address(0xd2)]]);
  });
});
