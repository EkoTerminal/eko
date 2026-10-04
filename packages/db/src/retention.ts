import type { ChainDb } from './client.js';
import { binary } from './types.js';

/**
 * Retention for chain tables that otherwise grow without bound. Old transfers are not simply deleted: balances and
 * engine holdings are recomputed from transfer history, so each compacted (token, holder) pair keeps its net movement
 * in `transfer_baselines`. Every setting is off unless given; production keeps full history (BACKEND §3.6).
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
  /** Rows per transaction. */
  batchRows?: number;
  /** Stop starting new batches after this long, in milliseconds. */
  budgetMs?: number;
  now?: () => number;
}
export interface RetentionResult { quoteRows: number; idleTokens: number; idleRows: number; pendingRows: number; finished: boolean }

const DAY_MS = 86_400_000;

/** Newest indexed block older than `days`, or null when indexed history does not reach that far back. */
export async function retentionHorizon(db: ChainDb, days: number, nowMs: number): Promise<bigint | null> {
  const row = (await db.sql.query<{ n: string | null }>('SELECT max(number)::text AS n FROM chain_blocks WHERE ts < $1',
    [new Date(nowMs - days * DAY_MS)])).rows[0];
  return row?.n == null ? null : BigInt(row.n);
}

/** Move up to `limit` of the oldest transfers at or below `through` into per-holder baselines, in one transaction. */
export async function compactTransfers(db: ChainDb, tokens: Uint8Array[], through: bigint, limit: number): Promise<number> {
  if (!tokens.length) return 0;
  return db.tx(async tx => {
    const result = await tx.sql.query<{ rows: string }>(`WITH picked AS (
        SELECT tableoid, ctid FROM token_transfers WHERE token = ANY($1::bytea[]) AND block <= $2 ORDER BY block LIMIT $3
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

/** One bounded retention pass: quote tokens, then idle tokens, then unknown-pool events. */
export async function runRetention(db: ChainDb, options: RetentionOptions): Promise<RetentionResult> {
  const now = options.now ?? Date.now, started = now(), limit = options.batchRows ?? 20_000, budget = options.budgetMs ?? 60_000;
  const result: RetentionResult = { quoteRows: 0, idleTokens: 0, idleRows: 0, pendingRows: 0, finished: true };
  const timeLeft = () => now() - started < budget;
  const quote = options.quoteTokens.map(token => binary(token as `0x${string}`));
  const drain = async (step: () => Promise<number>) => {
    let total = 0;
    for (;;) {
      if (!timeLeft()) { result.finished = false; return total; }
      const moved = await step(); total += moved;
      if (moved < limit) return total;
    }
  };
  if (options.quoteDays !== undefined && quote.length) {
    const before = await retentionHorizon(db, options.quoteDays, started);
    if (before !== null) result.quoteRows = await drain(() => compactTransfers(db, quote, before, limit));
  }
  if (options.idleTokenDays !== undefined) {
    if (options.idleTokenDays <= 7) throw new Error('Idle-token retention must exceed the engines idle window');
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
    const before = await retentionHorizon(db, options.pendingPoolDays, started);
    if (before !== null) result.pendingRows = await drain(() => prunePendingPoolEvents(db, before, limit));
  }
  return result;
}
