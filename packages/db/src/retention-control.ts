import { ChainDb, type SqlClient } from './client.js';
import type { RetentionOptions, RetentionResult } from './retention.js';

export async function retentionLimits(db: ChainDb) {
  await db.sql.query("SET LOCAL statement_timeout='5s'");
  await db.sql.query("SET LOCAL lock_timeout='1s'");
  await db.sql.query('SET LOCAL max_parallel_workers_per_gather=0');
  // Candidate windows and correlated probes have indexes. Avoid a large sequential scan chosen on stale statistics.
  await db.sql.query('SET LOCAL enable_seqscan=off');
  await db.sql.query('SET LOCAL enable_hashjoin=off');
  await db.sql.query('SET LOCAL enable_mergejoin=off');
}

/** Direct reads also get transaction-local limits, without enabling deletion triggers. */
export function retentionDb(db: ChainDb, deadline: number | (() => number) = Date.now() + 115_000): ChainDb {
  const transaction = <T>(work: (tx: ChainDb) => Promise<T>) => db.tx(async tx => {
    await retentionLimits(tx);
    const sql: SqlClient = { query: async (text, params) => {
      const remaining = Math.min(5_000, (typeof deadline === 'function' ? deadline() : deadline) - Date.now());
      if (remaining <= 0) throw Object.assign(new Error('Retention pass deadline reached'), { code: '57014' });
      // Recheck before every statement in multi-statement batches, including nested compaction transactions.
      await tx.sql.query(`SET LOCAL statement_timeout='${remaining}ms'`);
      return tx.sql.query(text, params);
    } };
    return work(new ChainDb(sql, nested => nested(sql)));
  });
  return new ChainDb({ query: (sql, params) => transaction(tx => tx.sql.query(sql, params)) },
    work => transaction(tx => work(tx.sql)));
}

export type RetentionRuleRunner = (name: string, work: (timeLeft: () => boolean) => Promise<void>) => Promise<void>;
export function retentionRules(options: RetentionOptions, result: RetentionResult, startDeadline: (budget: number) => void = () => {}): RetentionRuleRunner {
  const now = options.now ?? Date.now, passStarted = now();
  const passBudget = Math.min(options.passBudgetMs ?? 115_000, 115_000);
  return async (name, work) => {
    const started = now();
    const timeLeft = () => { const current = now(); return current - started < (options.budgetMs ?? 6_000) && current - passStarted < passBudget; };
    if (!timeLeft()) { result.finished = false; return; }
    // Allow one normal five-second statement even when a caller uses a tiny scheduling budget.
    startDeadline(Math.max(5_000, options.budgetMs ?? 6_000));
    try { await work(timeLeft); }
    catch (error) {
      const code = (error as { code?: string })?.code;
      if (code !== '55P03' && code !== '57014') throw error;
      result.finished = false;
      if (!result.skippedRules.includes(name)) result.skippedRules.push(name);
    }
    if (!timeLeft()) result.finished = false;
  };
}

/** Resume candidate walks across passes, including prefixes made entirely of retained rows. No row data is logged. */
const cursors = new WeakMap<ChainDb, Map<string, unknown[]>>();
export function retentionCursors(db: ChainDb) {
  let map = cursors.get(db);
  if (!map) { map = new Map(); cursors.set(db, map); }
  return map;
}
