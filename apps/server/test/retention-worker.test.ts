import { afterEach, describe, expect, it, vi } from 'vitest';
import { migrate, openDb, type ChainDb } from '@eko/db';
import { loadConfig } from '../src/config.js';
import { RetentionWorker } from '../src/retention-worker.js';

const base = { NODE_ENV: 'test', PGLITE_DIR: ':memory:', SESSION_SECRET: 'sample-session-placeholder'.repeat(2) };
const sample = `0x${'1'.repeat(40)}`;
const walletCollectors = JSON.stringify({ wallets: { startBlock: 1, burnToken: sample, assets: [{ token: sample, decimals: 18, maxOutflowRaw: '1' }] } });
const handles: ChainDb[] = [];
afterEach(async () => { await Promise.all(handles.splice(0).map(db => db.close())); });

describe('chain retention settings', () => {
  it('are off by default, bounded, and refused alongside the wallet outflow collectors', () => {
    const off = loadConfig(base);
    expect([off.RETENTION_QUOTE_TRANSFER_DAYS, off.RETENTION_IDLE_TOKEN_DAYS, off.RETENTION_PENDING_POOL_DAYS]).toEqual([undefined, undefined, undefined]);
    const on = loadConfig({ ...base, RETENTION_QUOTE_TRANSFER_DAYS: '2', RETENTION_IDLE_TOKEN_DAYS: '14', RETENTION_PENDING_POOL_DAYS: '3' });
    expect([on.RETENTION_QUOTE_TRANSFER_DAYS, on.RETENTION_IDLE_TOKEN_DAYS, on.RETENTION_PENDING_POOL_DAYS]).toEqual([2, 14, 3]);
    expect(() => loadConfig({ ...base, RETENTION_IDLE_TOKEN_DAYS: '7' })).toThrow('RETENTION_IDLE_TOKEN_DAYS');
    expect(() => loadConfig({ ...base, RETENTION_QUOTE_TRANSFER_DAYS: '0' })).toThrow('RETENTION_QUOTE_TRANSFER_DAYS');
    expect(() => loadConfig({ ...base, RETENTION_QUOTE_TRANSFER_DAYS: '2', SECURITY_COLLECTORS: walletCollectors })).toThrow('wallet outflow collectors');
    expect(loadConfig({ ...base, RETENTION_PENDING_POOL_DAYS: '3', SECURITY_COLLECTORS: walletCollectors }).RETENTION_PENDING_POOL_DAYS).toBe(3);
  });
});

describe('retention worker', () => {
  it('does nothing unless configured, and reports each bounded pass without row data', async () => {
    const db = await openDb({ pgliteDir: ':memory:' }); handles.push(db); await migrate(db);
    const idle = vi.fn(), off = new RetentionWorker(db, {}, idle, 60_000);
    off.start(); await off.stop();
    expect(off.enabled).toBe(false); expect(idle).not.toHaveBeenCalled();
    const report = vi.fn(), on = new RetentionWorker(db, { quoteDays: 2, pendingPoolDays: 3 }, report, 60_000);
    on.start(); await on.tick(); await on.stop();
    expect(report).toHaveBeenCalledWith({ quoteRows: 0, idleTokens: 0, idleRows: 0, pendingRows: 0, finished: true });
    const failing = vi.fn(), broken = new RetentionWorker({ sql: { query: async () => { throw new Error('fixture failure with row data'); } } } as unknown as ChainDb,
      { quoteDays: 2 }, failing, 60_000);
    await broken.tick();
    expect(failing).toHaveBeenCalledWith({ failed: true });
  });
});
