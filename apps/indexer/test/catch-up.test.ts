import { afterEach, describe, expect, it, vi } from 'vitest';
import { chainTables, hex, migrate, openDb, ChainDb } from '@eko/db';
import { BlockDecoder } from '../src/decode.js';
import { LogHeadFollower } from '../src/log-head.js';
import { Metrics } from '../src/types.js';
import { blockOf, catchUpChain, memoryClient, registry, seedCatchUp, type Chain } from './catch-up-fixture.js';
const quiet = () => {};
const handles: ChainDb[] = [];
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(handles.splice(0).map(db => db.close())); });
async function database() { const db = await openDb({ pgliteDir: ':memory:' }); handles.push(db); await migrate(db); await seedCatchUp(db); return db; }
type Config = ConstructorParameters<typeof LogHeadFollower>[3];
/** The follower as it ran before these optimizations: 20-block windows and commits, every parent read, public logs plus a paid timestamp scan, serial writes. */
const legacy = { maxRange: 20, catchUpRange: 20, commitRange: 20, deepParents: 'fetch', paidLogs: false, overlapWrites: false } as const;
const REORG = 32;
async function run(chain: Chain, head: bigint, config: Partial<Config>, db?: ChainDb, startBlock = 1n) {
  db ??= await database();
  const client = memoryClient(chain, () => head), ticks: Record<string, unknown>[] = [];
  const live = new LogHeadFollower(client, db, new BlockDecoder(client, registry, new Metrics(quiet), quiet), { startBlock, reorgDepth: REORG, pipeline: true, ...legacy, ...config,
    logger: (event, fields) => { if (event === 'head_tick') ticks.push(fields!); } });
  for (let i = 0; i < 500 && (await db.cursor('head_logs') ?? 0n) < head; i++) await live.tick();
  expect(await db.cursor('head_logs')).toBe(head);
  return { db, client, ticks, live };
}
/**
 * Every chain table and derived row (wallet-protocol rows without their wall-clock recorded_at), with
 * chain_blocks.parent_hash reported separately. Wallet-protocol rows record when the decoder's code cache last read a
 * target, which a rollback (it clears that cache) moves; `protocol: false` leaves them out, as log-head.test.ts does.
 */
async function snapshot(db: ChainDb, { protocol = true } = {}) {
  const tables: Record<string, unknown[]> = {};
  for (const table of [...chainTables.filter(t => protocol || !['userops', 'delegations_7702', 'wallet_protocol_coverage'].includes(t)), 'bars_1m', 'balances'] as const) {
    const rows = (await db.sql.query<Record<string, unknown>>(`SELECT * FROM ${table}`)).rows.map(r => ({ ...r, recorded_at: undefined, ...(table === 'chain_blocks' ? { parent_hash: undefined } : {}) }));
    tables[table] = rows.map(r => JSON.stringify(r)).sort();
  }
  const parents = new Map((await db.sql.query<{ number: string; parent_hash: Uint8Array | null }>('SELECT number,parent_hash FROM chain_blocks')).rows.map(r => [BigInt(r.number), r.parent_hash ? hex(r.parent_hash) : null]));
  return { tables, parents };
}

describe('live catch-up optimizations', () => {
  const chain = catchUpChain(400), head = 400n;
  it.each([
    ['larger catch-up windows', { catchUpRange: 160 }],
    ['larger commits', { commitRange: 60 }],
    ['overlapped writes over four commits per window', { overlapWrites: true, commitRange: 5 }],
    ['paid candidate logs', { paidLogs: true }],
    ['all of them', { catchUpRange: 160, commitRange: 60, overlapWrites: true, paidLogs: true }],
  ] as const)('stores identical rows with %s', async (_name, config) => {
    const before = await snapshot((await run(chain, head, {})).db), after = await run(chain, head, config);
    const rows = await snapshot(after.db);
    expect(rows.tables).toEqual(before.tables);
    expect(rows.parents).toEqual(before.parents);
    expect(before.tables.swaps.length).toBeGreaterThan(300);expect(before.tables.bars_1m.length).toBeGreaterThan(20);
  }, 60000);

  it('skips only parent links below the reorg window and stores every other row identically', async () => {
    const before = await snapshot((await run(chain, head, {})).db);
    const after = await run(chain, head, { deepParents: 'skip', catchUpRange: 160, commitRange: 60, overlapWrites: true, paidLogs: true });
    const rows = await snapshot(after.db);
    expect(rows.tables).toEqual(before.tables);
    const skipped = [...rows.parents].filter(([, parent]) => parent == null).map(([n]) => n);
    expect(skipped.length).toBeGreaterThan(30);
    for (const [n, parent] of rows.parents) {
      // Unrecorded only below the window, and only where the parent block had no candidate log; otherwise exact.
      if (parent == null) { expect(n).toBeLessThan(head - BigInt(REORG)); expect(chain.get(n - 1n)!.receipts).toHaveLength(0); }
      else expect(parent).toBe(before.parents.get(n));
    }
    // Inside the reorg window every missing parent is still read and checked.
    const window = [...rows.parents].filter(([n]) => n >= head - BigInt(REORG) && chain.get(n - 1n)!.receipts.length === 0);
    expect(window.length).toBeGreaterThan(2); expect(window.every(([, parent]) => parent != null)).toBe(true);
    expect(after.client.calls.parentHeader).toBe(window.length);
    expect(after.ticks.reduce((n, t) => n + Number(t.deep_links_skipped), 0)).toBe(skipped.length);
  }, 60000);

  it('rolls back and replays a reorg inside the reorg window with every optimization on', async () => {
    const optimized = { deepParents: 'skip', catchUpRange: 160, commitRange: 60, overlapWrites: true, paidLogs: true } as const;
    const live = new Map(chain), first = await run(live, head, optimized);
    // The last 12 blocks change hashes; the chain then grows by 10.
    for (let n = 389; n <= 410; n++) live.set(BigInt(n), blockOf(n, 1, n === 389 ? 0 : 1));
    const replay = await run(live, 410n, optimized, first.db);
    expect(await replay.db.blockHash(399n)).toBe(live.get(399n)!.block.hash);
    const truth = await snapshot((await run(live, 410n, {})).db, { protocol: false }), rows = await snapshot(replay.db, { protocol: false });
    expect(rows.tables).toEqual(truth.tables);
    for (const [n, parent] of rows.parents) if (parent != null) expect(parent).toBe(truth.parents.get(n));
    for (const [n, parent] of rows.parents) if (n >= 410n - BigInt(REORG)) expect(parent).not.toBeNull();
  }, 60000);

  it('reads candidate logs in spans the provider accepts, without dropping or repeating a refusal', async () => {
    const client = memoryClient(chain, () => head), logs = client.logs, spans: number[] = [];
    client.logs = async filter => { const span = Number(filter.to - filter.from + 1n); spans.push(span); if (!filter.addresses && span > 48) throw new Error('logs matched by query exceeds limit of 10000'); return logs(filter); };
    const db = await database(), ticks: Record<string, unknown>[] = [];
    const follower = new LogHeadFollower(client, db, new BlockDecoder(client, registry, new Metrics(quiet), quiet), { startBlock: 1n, reorgDepth: REORG, pipeline: true, ...legacy, catchUpRange: 160, logger: (event, fields) => { if (event === 'head_tick') ticks.push(fields!); } });
    for (let i = 0; i < 100 && (await db.cursor('head_logs') ?? 0n) < head; i++) await follower.tick();
    expect(await db.cursor('head_logs')).toBe(head);
    expect((await snapshot(db)).tables).toEqual((await snapshot((await run(chain, head, {})).db)).tables);
    // After the first refusal (160 → 80 → 40) later windows ask for at most the accepted span.
    const refused = spans.filter(s => s > 48);
    expect(refused).toEqual([160, 80]);
    expect(ticks.slice(1).every(t => Number(t.log_span) <= 80)).toBe(true);
  }, 60000);

  it('grows the window far behind and returns to the head window near it', async () => {
    const { ticks } = await run(chain, head, { catchUpRange: 160 });
    // 400 blocks behind: 160, 160, then the remaining 80 (still more than two head windows behind).
    expect(ticks.map(t => t.blocks_covered)).toEqual([160, 160, 80]);
    const near = await run(chain, head, { catchUpRange: 160 }, undefined, 365n);
    expect(near.ticks.map(t => t.blocks_covered)).toEqual([20, 16]);
  }, 60000);
});
