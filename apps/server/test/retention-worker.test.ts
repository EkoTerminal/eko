import { afterEach, describe, expect, it, vi } from 'vitest';
import * as retention from '@eko/db';
import { migrate, openDb, type ChainDb } from '@eko/db';
import { loadConfig } from '../src/config.js';
import { ChainDb as Database } from '@eko/db';
import { RetentionWorker } from '../src/retention-worker.js';

const base = { NODE_ENV: 'test', PGLITE_DIR: ':memory:', SESSION_SECRET: 'sample-session-placeholder'.repeat(2) };
const sample = `0x${'1'.repeat(40)}`;
const walletCollectors = JSON.stringify({ wallets: { startBlock: 1, burnToken: sample, assets: [{ token: sample, decimals: 18, maxOutflowRaw: '1' }] } });
const handles: ChainDb[] = [];
afterEach(async () => { await Promise.all(handles.splice(0).map(db => db.close())); });

describe('chain retention settings', () => {
  it('defaults to report-only settlement, a seven-day cap and seven-day rating history',()=>{
    const c=loadConfig(base);expect(c.RETENTION_ENABLED).toBe(true);expect(loadConfig({...base,RETENTION_ENABLED:'false'}).RETENTION_ENABLED).toBe(false);expect([c.RETENTION_DRY_RUN,c.RETENTION_SETTLE_HOURS,c.RETENTION_RAW_DAYS,c.RETENTION_RATING_DAYS]).toEqual([true,24,7,7]);
    expect(loadConfig({...base,RETENTION_DRY_RUN:'false'}).RETENTION_DRY_RUN).toBe(false);
    expect([c.RETENTION_SWAP_DAYS,c.RETENTION_TRANSFER_DAYS,c.FINGERPRINT_LOOKBACK_DAYS,c.FINGERPRINT_REFRESH_DAYS]).toEqual([7,3,3,3]);
    expect(loadConfig({...base,RETENTION_SWAP_DAYS:'10',RETENTION_TRANSFER_DAYS:'2',FINGERPRINT_LOOKBACK_DAYS:'6',FINGERPRINT_REFRESH_DAYS:'4'}).RETENTION_SWAP_DAYS).toBe(10);
    for(const key of ['RETENTION_TRANSFER_DAYS','FINGERPRINT_LOOKBACK_DAYS','FINGERPRINT_REFRESH_DAYS'])expect(()=>loadConfig({...base,[key]:'0'})).toThrow(key);
    expect(()=>loadConfig({...base,RETENTION_SWAP_DAYS:'6'})).toThrow('RETENTION_SWAP_DAYS');
    expect(()=>loadConfig({...base,FINGERPRINT_LOOKBACK_DAYS:'5'})).toThrow('must fit');
    for(const key of ['RETENTION_SETTLE_HOURS','RETENTION_RAW_DAYS','RETENTION_RATING_DAYS'])expect(()=>loadConfig({...base,[key]:'0'})).toThrow(key);
    expect(()=>loadConfig({...base,RETENTION_DRY_RUN:'false',SECURITY_COLLECTORS:walletCollectors})).toThrow('wallet outflow collectors');
    expect(loadConfig({...base,RETENTION_ENABLED:'false',RETENTION_DRY_RUN:'false',SECURITY_COLLECTORS:walletCollectors}).RETENTION_ENABLED).toBe(false);
  });
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
  it('runs backlogged passes after a pause, then waits ten minutes and stops cleanly',async()=>{
    vi.useFakeTimers();
    const result={quoteRows:0,idleTokens:0,idleRows:0,pendingRows:0,feedRows:0,dangerCoins:0,quietCoins:0,historyTransfers:0,historyLiquidity:0,historyPons:0,historySwaps:0,trendingSnapshots:0,skippedRules:[],finished:false};
    const run=vi.spyOn(retention,'runRetention').mockResolvedValueOnce(result).mockResolvedValue({...result,finished:true});
    const worker=new RetentionWorker({} as ChainDb,{ratingDays:7,dryRun:false},vi.fn());
    try {
      worker.start();await worker.tick();expect(run).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(99);expect(run).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);expect(run).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(599999);expect(run).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);expect(run).toHaveBeenCalledTimes(3);
      await worker.stop();await vi.advanceTimersByTimeAsync(600000);expect(run).toHaveBeenCalledTimes(3);
    } finally {await worker.stop();run.mockRestore();vi.useRealTimers();}
  });
  it.each(['dry-run','failure'])('waits the normal interval for %s and never overlaps passes',async kind=>{
    vi.useFakeTimers();
    let complete!:(value:retention.RetentionResult)=>void;
    const run=vi.spyOn(retention,'runRetention').mockImplementation(()=>new Promise(resolve=>{complete=resolve;}));
    const worker=new RetentionWorker({} as ChainDb,{ratingDays:7},vi.fn());
    try {
      worker.start();const pending=worker.tick();
      expect(worker.tick()).toBe(pending);
      await vi.advanceTimersByTimeAsync(600000);expect(run).toHaveBeenCalledTimes(1);
      if(kind==='failure')run.mockRejectedValue(new Error('fixture failure'));
      complete({finished:false,dryRun:true} as retention.RetentionResult);await pending;
      await vi.advanceTimersByTimeAsync(100);expect(run).toHaveBeenCalledTimes(1);
      if(kind==='failure') {await vi.advanceTimersByTimeAsync(599900);expect(run).toHaveBeenCalledTimes(2);await vi.advanceTimersByTimeAsync(100);expect(run).toHaveBeenCalledTimes(2);}
    } finally {await worker.stop();run.mockRestore();vi.useRealTimers();}
  });
  it('keeps existing pass fields and emits skipped rules and real rating counts',async()=>{
    const sql={query:async <T>(query:string)=>{if(query.startsWith('SELECT run_id,block FROM wallet_fingerprint_dependencies'))throw Object.assign(new Error('fixture timeout'),{code:'57014'});return {rows:[] as T[]};}};
    const db=new Database(sql,work=>work(sql)),report=vi.fn();
    await new RetentionWorker(db,{ratingDays:7,dryRun:false},report).tick();
    expect(report).toHaveBeenCalledWith(expect.objectContaining({quoteRows:0,feedRows:0,finished:false,skippedRules:['wallet_fingerprint_dependencies'],ratingRows:{receipt_publications:0,receipt_items:0,wallet_fingerprint_dependencies:0,guard_shadow_runs:0,coin_cards:0,playbook_matches:0,verdicts:0}}));
  });
  it('does nothing unless configured, and reports each bounded pass without row data', async () => {
    const db = await openDb({ pgliteDir: ':memory:' }); handles.push(db); await migrate(db);
    const idle = vi.fn(), off = new RetentionWorker(db, {}, idle, 60_000);
    off.start(); await off.stop();
    expect(off.enabled).toBe(false); expect(idle).not.toHaveBeenCalled();
    const disabled = new RetentionWorker(db, { enabled:false, rawDays:7 }, idle);
    disabled.start(); await disabled.tick(); await disabled.stop();
    expect(disabled.enabled).toBe(false); expect(idle).not.toHaveBeenCalled();
    const report = vi.fn(), on = new RetentionWorker(db, { quoteDays: 2, pendingPoolDays: 3, feedDays: 3 }, report, 60_000);
    on.start(); await on.tick(); await on.stop();
    expect(report).toHaveBeenCalledWith({ quoteRows: 0, idleTokens: 0, idleRows: 0, pendingRows: 0, feedRows: 0, dangerCoins: 0, quietCoins: 0,
      historyTransfers: 0, historyLiquidity: 0, historyPons: 0, historySwaps: 0, trendingSnapshots: 0, finished: true, skippedRules:[], dryRun:true,tables:[], ruleStats:expect.any(Object) });
    expect(new RetentionWorker(db, { quietCoinDays: 8 }, vi.fn(), 60_000).enabled).toBe(true);
    expect(new RetentionWorker(db, { feedDays: 3 }, vi.fn(), 60_000).enabled).toBe(true);
    const failing = vi.fn(), broken = new RetentionWorker({ sql: { query: async () => { throw new Error('fixture failure with row data'); } } } as unknown as ChainDb,
      { quoteDays: 2 }, failing, 60_000);
    await broken.tick();
    expect(failing).toHaveBeenCalledWith({ failed: true });
  });
});
