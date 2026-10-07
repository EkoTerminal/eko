import type { ChainDb } from './client.js';
import { binary } from './types.js';

/**
 * Retention for tables that otherwise grow without bound. Old transfers are not simply deleted: balances and engine
 * holdings are recomputed from transfer history, so each compacted (token, holder) pair keeps its net movement in
 * `transfer_baselines`. Derived Feed rows are deleted outright: their sources (verdicts, playbook matches) are kept.
 * Every setting is off unless given; production keeps full history (BACKEND §3.6). Table-by-table decisions:
 * docs/operations/retention.md.
 */
export interface RetentionOptions {
  /** Registry quote tokens (for example WETH and USDG), lower-case hex. Their history is read only through balances. */
  quoteTokens: string[];
  /** Compact quote-token transfers older than this many days. */
  quoteDays?: number;
  /** Compact every transfer of a token with no transfer in this many days. Must exceed the engines' 7-day idle window. */
  idleTokenDays?: number;
  /** Delete raw events of pools still unknown after this many days. */
  pendingPoolDays?: number;
  /** Delete verdict, playbook and wash rows of the Feed projection (`read_feed`) older than this many days. */
  feedDays?: number;
  /** Rows per transaction (Feed batches are capped lower, see `FEED_BATCH_ROWS`). */
  batchRows?: number;
  /** Each enabled rule stops starting new batches after this long, in milliseconds, so one rule's backlog never
   * starves the rules after it. A pass therefore takes at most about one budget per enabled rule. */
  budgetMs?: number;
  now?: () => number;
}
export interface RetentionResult { quoteRows: number; idleTokens: number; idleRows: number; pendingRows: number; feedRows: number; finished: boolean }

const DAY_MS = 86_400_000;
/** Feed deletes share `read_feed` with the API's read-model refresh, which locks the table; keep each batch short. */
export const FEED_BATCH_ROWS = 5_000;
/** Feed kinds projected from kept sources and never re-derived by the read-model refresh. `new_pair` and `graduation`
 * rows are a few per coin and are rewritten on every refresh of their coin, so they stay. */
const FEED_KINDS = ['verdict', 'playbook', 'wash'];

/** Newest indexed block older than `days`, or null when indexed history does not reach that far back. */
export async function retentionHorizon(db: ChainDb, days: number, nowMs: number): Promise<bigint | null> {
  const row = (await db.sql.query<{ n: string | null }>('SELECT max(number)::text AS n FROM chain_blocks WHERE ts < $1',
    [new Date(nowMs - days * DAY_MS)])).rows[0];
  return row?.n == null ? null : BigInt(row.n);
}

/**
 * Move up to `limit` of the oldest transfers at or below `through` into per-holder baselines, in one transaction.
 * Ordering by (token, block) follows the `token_transfers(token, block)` index, so each batch reads about `limit`
 * rows; ordering by block alone made every batch scan and sort all eligible transfers of the given tokens.
 */
export async function compactTransfers(db: ChainDb, tokens: Uint8Array[], through: bigint, limit: number): Promise<number> {
  if (!tokens.length) return 0;
  return db.tx(async tx => {
    const result = await tx.sql.query<{ rows: string }>(`WITH picked AS (
        SELECT tableoid, ctid FROM token_transfers WHERE token = ANY($1::bytea[]) AND block <= $2 ORDER BY token, block LIMIT $3
      ), moved AS (
        DELETE FROM token_transfers t USING picked p WHERE t.tableoid = p.tableoid AND t.ctid = p.ctid
        RETURNING t.token, t.from_address, t.to_address, t.amount, t.block, t.kind
      ), deltas AS (
        SELECT token, to_address AS holder, amount, block FROM moved WHERE kind = 'Transfer'
        UNION ALL SELECT token, from_address, -amount, block FROM moved WHERE kind = 'Transfer'
      ), merged AS (
        INSERT INTO transfer_baselines(token, holder, amount, through_block)
        SELECT token, holder, sum(amount), max(block) FROM deltas GROUP BY token, holder
        ON CONFLICT(token, holder) DO UPDATE SET amount = transfer_baselines.amount + excluded.amount,
          through_block = greatest(transfer_baselines.through_block, excluded.through_block)
        RETURNING 1
      ) SELECT (SELECT count(*) FROM moved)::text AS rows, (SELECT count(*) FROM merged)::text AS merged`,
      [tokens, through.toString(), limit]);
    return Number(result.rows[0]?.rows ?? 0);
  });
}

/** Tokens other than `exclude` with transfers at or below `through` and none after it. */
export async function idleTokens(db: ChainDb, through: bigint, exclude: Uint8Array[], limit: number): Promise<Uint8Array[]> {
  return (await db.sql.query<{ address: Uint8Array }>(`SELECT t.address FROM tokens t
    WHERE NOT (t.address = ANY($2::bytea[]))
      AND EXISTS (SELECT 1 FROM token_transfers x WHERE x.token = t.address AND x.block <= $1)
      AND NOT EXISTS (SELECT 1 FROM token_transfers x WHERE x.token = t.address AND x.block > $1)
    ORDER BY t.address LIMIT $3`, [through.toString(), exclude, limit])).rows.map(row => row.address);
}

/** Delete up to `limit` raw events, at or below `through`, of pools that are still unknown. */
export async function prunePendingPoolEvents(db: ChainDb, through: bigint, limit: number): Promise<number> {
  return Number((await db.sql.query<{ n: string }>(`WITH gone AS (DELETE FROM pending_pool_events e USING (
      SELECT tx_hash, log_index FROM pending_pool_events p
      WHERE p.block <= $1 AND NOT EXISTS (SELECT 1 FROM pools o WHERE o.id = p.emitter) LIMIT $2
    ) d WHERE e.tx_hash = d.tx_hash AND e.log_index = d.log_index RETURNING 1) SELECT count(*)::text AS n FROM gone`,
    [through.toString(), limit])).rows[0]?.n ?? 0);
}

/**
 * Delete up to `limit` verdict, playbook and wash rows of the Feed projection at or below `through`. Each coin's first
 * verdict row stays: the verdict trigger recomputes `read_first_verdict` (the Feed's time-to-first-verdict) from the
 * coin's remaining verdict rows, so the earliest one must survive. Coins without a recorded first verdict keep all
 * their verdict rows.
 */
export async function pruneFeed(db: ChainDb, through: bigint, limit: number): Promise<number> {
  return Number((await db.sql.query<{ n: string }>(`WITH gone AS (DELETE FROM read_feed f USING (
      SELECT x.id FROM read_feed x WHERE x.kind = ANY($2::text[]) AND x.block <= $1
        AND (x.kind <> 'verdict' OR EXISTS (SELECT 1 FROM read_first_verdict r WHERE r.coin = x.coin AND r.block < x.block))
      LIMIT $3
    ) d WHERE f.id = d.id RETURNING 1) SELECT count(*)::text AS n FROM gone`,
    [through.toString(), FEED_KINDS, limit])).rows[0]?.n ?? 0);
}

/** One bounded retention pass: quote tokens, idle tokens, unknown-pool events, then Feed rows, each on its own budget. */
export async function runRetention(db: ChainDb, options: RetentionOptions): Promise<RetentionResult> {
  const now = options.now ?? Date.now, started = now(), limit = options.batchRows ?? 20_000, budget = options.budgetMs ?? 60_000;
  const result: RetentionResult = { quoteRows: 0, idleTokens: 0, idleRows: 0, pendingRows: 0, feedRows: 0, finished: true };
  let ruleStarted = started;
  const startRule = () => { ruleStarted = now(); };
  const timeLeft = () => now() - ruleStarted < budget;
  const quote = options.quoteTokens.map(token => binary(token as `0x${string}`));
  const drain = async (step: () => Promise<number>, size = limit) => {
    let total = 0;
    for (;;) {
      if (!timeLeft()) { result.finished = false; return total; }
      const moved = await step(); total += moved;
      if (moved < size) return total;
    }
  };
  if (options.quoteDays !== undefined && quote.length) {
    startRule();
    const before = await retentionHorizon(db, options.quoteDays, started);
    if (before !== null) result.quoteRows = await drain(() => compactTransfers(db, quote, before, limit));
  }
  if (options.idleTokenDays !== undefined) {
    if (options.idleTokenDays <= 7) throw new Error('Idle-token retention must exceed the engines idle window');
    startRule();
    const before = await retentionHorizon(db, options.idleTokenDays, started);
    while (before !== null && timeLeft()) {
      const tokens = await idleTokens(db, before, quote, 200);
      if (!tokens.length) break;
      result.idleTokens += tokens.length;
      result.idleRows += await drain(() => compactTransfers(db, tokens, before, limit));
      if (!timeLeft()) break;
    }
    if (!timeLeft()) result.finished = false;
  }
  if (options.pendingPoolDays !== undefined) {
    startRule();
    const before = await retentionHorizon(db, options.pendingPoolDays, started);
    if (before !== null) result.pendingRows = await drain(() => prunePendingPoolEvents(db, before, limit));
  }
  if (options.feedDays !== undefined) {
    startRule();
    const before = await retentionHorizon(db, options.feedDays, started), size = Math.min(limit, FEED_BATCH_ROWS);
    if (before !== null) result.feedRows = await drain(() => pruneFeed(db, before, size), size);
  }
  return result;
}
