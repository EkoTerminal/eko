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
    expect([off.RETENTION_QUOTE_TRANSFER_DAYS, off.RETENTION_IDLE_TOKEN_DAYS, off.RETENTION_PENDING_POOL_DAYS, off.RETENTION_FEED_DAYS,
      off.RETENTION_DANGER_QUIET_DAYS, off.RETENTION_QUIET_COIN_DAYS]).toEqual([undefined, undefined, undefined, undefined, undefined, undefined]);
    const on = loadConfig({ ...base, RETENTION_QUOTE_TRANSFER_DAYS: '2', RETENTION_IDLE_TOKEN_DAYS: '14', RETENTION_PENDING_POOL_DAYS: '3', RETENTION_FEED_DAYS: '3',
      RETENTION_DANGER_QUIET_DAYS: '2', RETENTION_QUIET_COIN_DAYS: '8' });
    expect([on.RETENTION_QUOTE_TRANSFER_DAYS, on.RETENTION_IDLE_TOKEN_DAYS, on.RETENTION_PENDING_POOL_DAYS, on.RETENTION_FEED_DAYS,
      on.RETENTION_DANGER_QUIET_DAYS, on.RETENTION_QUIET_COIN_DAYS]).toEqual([2, 14, 3, 3, 2, 8]);
    expect(() => loadConfig({ ...base, RETENTION_FEED_DAYS: '0' })).toThrow('RETENTION_FEED_DAYS');
    expect(() => loadConfig({ ...base, RETENTION_IDLE_TOKEN_DAYS: '7' })).toThrow('RETENTION_IDLE_TOKEN_DAYS');
    // The quiet-coin window must exceed the engines' seven-day idle window, like the idle-token rule.
    expect(() => loadConfig({ ...base, RETENTION_QUIET_COIN_DAYS: '7' })).toThrow('RETENTION_QUIET_COIN_DAYS');
    expect(() => loadConfig({ ...base, RETENTION_DANGER_QUIET_DAYS: '0' })).toThrow('RETENTION_DANGER_QUIET_DAYS');
    // Both history rules compact transfers, so they are refused with the wallet outflow collectors too.
    expect(() => loadConfig({ ...base, RETENTION_DANGER_QUIET_DAYS: '2', SECURITY_COLLECTORS: walletCollectors })).toThrow('wallet outflow collectors');
    expect(() => loadConfig({ ...base, RETENTION_QUIET_COIN_DAYS: '8', SECURITY_COLLECTORS: walletCollectors })).toThrow('wallet outflow collectors');
    expect(() => loadConfig({ ...base, RETENTION_QUOTE_TRANSFER_DAYS: '0' })).toThrow('RETENTION_QUOTE_TRANSFER_DAYS');
    expect(() => loadConfig({ ...base, RETENTION_QUOTE_TRANSFER_DAYS: '2', SECURITY_COLLECTORS: walletCollectors })).toThrow('wallet outflow collectors');
    expect(loadConfig({ ...base, RETENTION_PENDING_POOL_DAYS: '3', SECURITY_COLLECTORS: walletCollectors }).RETENTION_PENDING_POOL_DAYS).toBe(3);
    expect(loadConfig({ ...base, RETENTION_FEED_DAYS: '3', SECURITY_COLLECTORS: walletCollectors }).RETENTION_FEED_DAYS).toBe(3);
  });
});

describe('retention worker', () => {
  it('does nothing unless configured, and reports each bounded pass without row data', async () => {
    const db = await openDb({ pgliteDir: ':memory:' }); handles.push(db); await migrate(db);
    const idle = vi.fn(), off = new RetentionWorker(db, {}, idle, 60_000);
    off.start(); await off.stop();
    expect(off.enabled).toBe(false); expect(idle).not.toHaveBeenCalled();
    const report = vi.fn(), on = new RetentionWorker(db, { quoteDays: 2, pendingPoolDays: 3, feedDays: 3 }, report, 60_000);
    on.start(); await on.tick(); await on.stop();
    expect(report).toHaveBeenCalledWith({ quoteRows: 0, idleTokens: 0, idleRows: 0, pendingRows: 0, feedRows: 0, dangerCoins: 0, quietCoins: 0,
      historyTransfers: 0, historyLiquidity: 0, historyPons: 0, historySwaps: 0, trendingSnapshots: 0, finished: true });
    expect(new RetentionWorker(db, { quietCoinDays: 8 }, vi.fn(), 60_000).enabled).toBe(true);
    expect(new RetentionWorker(db, { feedDays: 3 }, vi.fn(), 60_000).enabled).toBe(true);
    const failing = vi.fn(), broken = new RetentionWorker({ sql: { query: async () => { throw new Error('fixture failure with row data'); } } } as unknown as ChainDb,
      { quoteDays: 2 }, failing, 60_000);
    await broken.tick();
    expect(failing).toHaveBeenCalledWith({ failed: true });
  });
});
