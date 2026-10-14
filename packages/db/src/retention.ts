import { retentionDb, retentionRules, retentionCursors, retentionBatchSizes } from './retention-control.js';
import { determinationPass, compactUnratedTransfers, compactLifetimeSwaps, reportRows, addReport, retentionBatch, type RetentionTableReport } from './determination-retention.js';
import { ratingRetention } from './rating-retention.js';
import type { ChainDb } from './client.js';
import { snapshotTrending } from './trending.js';
import { binary } from './types.js';

/**
 * Retention for tables that otherwise grow without bound. Old transfers are not simply deleted: balances and engine
 * holdings are recomputed from transfer history, so each compacted (token, holder) pair keeps its net movement in
 * `transfer_baselines`. Derived Feed rows are deleted outright: their sources (verdicts, playbook matches) are kept.
 * Quiet coins (dead or Danger) keep a summary (`history_prunes`, bars, balances, baselines) instead of raw history.
 * The worker defaults to report-only settlement and seven-day caps. Actual deletion requires dryRun=false.
 * This owner-requested policy supersedes BACKEND §3.6 for the named tables. Reader exceptions are in docs/operations/retention.md.
 */
export interface RetentionOptions {
  /** Registry quote tokens (for example WETH and USDG), lower-case hex. Their history is read only through balances. */
  quoteTokens: string[];
  /** All worker deletions are report-only unless explicitly false. */
  dryRun?: boolean;
  settleHours?: number;
  rawDays?: number;
  ratingDays?: number;
  pauseMs?: number;
  /** Frozen rule inputs supplied by the worker, defaults match playbooks v1. */
  firstBlocks?: number;
  cohortSec?: number;
  poolManager?: string;
  /** Compact quote-token transfers older than this many days. */
  quoteDays?: number;
  /** Compact every transfer of a token with no transfer in this many days. Must exceed the engines' 7-day idle window. */
  idleTokenDays?: number;
  /** Delete raw events of pools still unknown after this many days. */
  pendingPoolDays?: number;
  /** Delete verdict, playbook and wash rows of the Feed projection (`read_feed`) older than this many days. */
  feedDays?: number;
  /** Drop the raw history of coins whose current verdict is Danger and that had no swap or transfer in this many days
   * (see `pruneQuietCoins`). */
  dangerQuietDays?: number;
  /** Drop the raw history of every non-quote coin with no swap or transfer in this many days. Must exceed the engines'
   * 7-day idle window. */
  quietCoinDays?: number;
  /** Rows per transaction (Feed batches are capped lower, see `FEED_BATCH_ROWS`). */
  batchRows?: number;
  /** Each rule stops starting batches after this many milliseconds (default 6 seconds). */
  budgetMs?: number;
  /** Total pass deadline, capped at 115 seconds and checked before each statement. */
  passBudgetMs?: number;
  now?: () => number;
}
export interface RetentionResult {
  quoteRows: number; idleTokens: number; idleRows: number; pendingRows: number; feedRows: number;
  /** Coins whose history the Danger and quiet-coin rules worked on, and the rows they removed per table. */
  dangerCoins: number; quietCoins: number; historyTransfers: number; historyLiquidity: number; historyPons: number; historySwaps: number;
  /** Trending lists saved before swaps they read could be deleted. */
  trendingSnapshots: number;
  finished: boolean;
  skippedRules: string[];
  ratingRows?: Record<string, number>;
  ruleStats?: Record<string, { rows: number; skipped: number; timeouts: number; batchRows: number }>;
  dryRun?: boolean;
  tables?: RetentionTableReport[];
}

const DAY_MS = 86_400_000;
/** Feed deletes share `read_feed` with the API's read-model refresh, which locks the table; keep each batch short. */
export const FEED_BATCH_ROWS = 5_000;
/** The engines stop evaluating a coin seven days after its last activity. */
export const ENGINE_IDLE_DAYS = 7;
/**
 * Swaps stay at least this long after a coin's last swap, whatever the rule. Wallet fingerprints read each wallet's
 * swaps of the 14 days before a swap block, plus the buy order of every coin it bought then, and refresh every swap
 * block of a wallet's last 14 days (28 days in all). The Census reads seven days. Deleting younger swaps would change
 * labels and the Census for wallets and coins that are still active.
 */
export const SWAP_EVIDENCE_DAYS = 28;
/** Feed kinds projected from kept sources and never re-derived by the read-model refresh. `new_pair` and `graduation`
 * rows are a few per coin and are re-derived by every refresh of their coin, so they stay. */
const FEED_KINDS = ['verdict', 'playbook', 'wash'];

/**
 * Newest indexed block older than `days`, or null when indexed history does not reach that far back. Block times never
 * decrease with height, so the newest time below the cutoff (chain_blocks_ts) holds it; max(number) read every row.
 */
export async function retentionHorizon(db: ChainDb, days: number, nowMs: number): Promise<bigint | null> {
  const row = (await db.sql.query<{ n: string | null }>('SELECT number::text AS n FROM chain_blocks WHERE ts < $1 ORDER BY ts DESC, number DESC LIMIT 1',
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

/** Bound the unknown-pool candidate walk even when every old row belongs to a known pool. */
async function pendingPoolBatch(db: ChainDb, through: bigint, limit: number, after?: unknown[]) {
  return db.tx(async tx => {
    const window = (await tx.sql.query<{ tx_hash: Uint8Array; log_index: number; tid: string }>(`SELECT tx_hash,log_index,ctid::text AS tid FROM pending_pool_events
      ${after ? 'WHERE (tx_hash,log_index)>($1::bytea,$2::integer)' : ''}
      ORDER BY tx_hash,log_index LIMIT ${limit} FOR UPDATE`, after)).rows;
    if (!window.length) return { rows: 0, after: undefined };
    // Locked physical tuples avoid another join over a large hash/log-index list.
    const rows = Number((await tx.sql.query<{ n: string }>(`WITH gone AS (DELETE FROM pending_pool_events e
      WHERE e.ctid=ANY($2::tid[]) AND e.block<=$1
        AND NOT EXISTS(SELECT 1 FROM pools o WHERE o.id=e.emitter) RETURNING 1)
      SELECT count(*)::text AS n FROM gone`, [through.toString(),window.map(r=>r.tid)])).rows[0]?.n ?? 0);
    return { rows, after: [window.at(-1)!.tx_hash,window.at(-1)!.log_index] };
  });
}
export async function prunePendingPoolEvents(db: ChainDb, through: bigint, limit: number): Promise<number> {
  return (await pendingPoolBatch(db,through,limit)).rows;
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
      ORDER BY x.block, x.id LIMIT $3 FOR UPDATE OF x SKIP LOCKED
    ) d WHERE f.id = d.id RETURNING 1) SELECT count(*)::text AS n FROM gone`,
    [through.toString(), FEED_KINDS, limit])).rows[0]?.n ?? 0);
}

export type HistoryRule = 'danger_quiet' | 'quiet_coin' | 'settled' | 'raw_cap';
export interface QuietCoin { address: Uint8Array; swaps: boolean }
const ZERO_ADDRESS = Buffer.alloc(20);
/** A liquidity event of a coin's pool against a quote asset, at or below $2, that no other check reads: removals by the
 * coin's deployer stay for the prior-removal check of the deployer's later launches (engines `sources.ts`). */
const prunableLiquidity = `FROM pools p JOIN liquidity_events e ON e.pool_id=p.id JOIN tokens t ON t.address=$1
  WHERE ((p.currency0=$1 AND p.currency1=ANY($3::bytea[])) OR (p.currency1=$1 AND p.currency0=ANY($3::bytea[]))) AND e.block<=$2
  AND (t.deployer IS NULL OR e.actor IS NULL OR e.actor<>t.deployer OR e.kind NOT IN ('Burn','ModifyLiquidity'))`;

/**
 * Up to `limit` coins (after `after`, in address order) whose raw history a rule may drop at `through`: not a quote
 * token; for `danger_quiet`, a current Danger card; no swap or transfer after `through`; no swap, liquidity event or
 * unknown-pool event still waiting for enrichment; every outcome horizon (1h, 24h, 7d) decided, meaning labeled, or
 * reached with no swap at or before its end block, which the outcome engine skips with or without the pruned rows;
 * and something left to drop. `swaps` is set when the coin's swaps may go too: it has swaps and none after
 * `swapsThrough`.
 */
export async function quietCoins(db: ChainDb, rule: HistoryRule, through: bigint, swapsThrough: bigint | null, exclude: Uint8Array[],
  pairQuotes: Uint8Array[], after: Uint8Array | null, limit: number): Promise<QuietCoin[]> {
  const swapStage = `($2::bigint IS NOT NULL AND EXISTS(SELECT 1 FROM swaps s WHERE s.coin=t.address AND s.block<=$2)
    AND ($6::text IN ('settled','raw_cap') OR NOT EXISTS(SELECT 1 FROM swaps s WHERE s.coin=t.address AND s.block>$2)))`;
  return (await db.sql.query<{ address: Uint8Array; swaps: boolean }>(`SELECT t.address,${swapStage} AS swaps
    FROM tokens t JOIN engine_block_times created ON created.number=t.first_block
    WHERE NOT (t.address=ANY($3::bytea[])) AND ($5::bytea IS NULL OR t.address>$5)
      AND ($6::text<>'danger_quiet' OR EXISTS(SELECT 1 FROM coin_card_latest c WHERE c.coin=t.address AND c.data->'verdict'->>'level'='danger'))
      AND ($6::text='raw_cap' OR (NOT EXISTS(SELECT 1 FROM swaps s WHERE s.coin=t.address AND s.block>$1)
        AND NOT EXISTS(SELECT 1 FROM token_transfers x WHERE x.token=t.address AND x.block>$1)))
      AND ($6::text NOT IN ('settled','raw_cap') OR EXISTS(SELECT 1 FROM coin_card_latest c WHERE c.coin=t.address
        AND NOT EXISTS(SELECT 1 FROM swaps s WHERE s.coin=t.address AND s.block>c.as_of_block AND s.block<=$1)
        AND NOT EXISTS(SELECT 1 FROM token_transfers x WHERE x.token=t.address AND x.block>c.as_of_block AND x.block<=$1)
        AND NOT EXISTS(SELECT 1 FROM pons_events e WHERE e.token=t.address AND e.block>c.as_of_block AND e.block<=$1)
        AND NOT EXISTS(SELECT 1 FROM liquidity_events e JOIN pools p ON p.id=e.pool_id WHERE (p.currency0=t.address OR p.currency1=t.address) AND e.block>c.as_of_block AND e.block<=$1)))
      AND NOT EXISTS(SELECT 1 FROM swaps s WHERE s.coin=t.address AND (s.senders_pending OR s.pricing_pending))
      AND NOT EXISTS(SELECT 1 FROM pools p JOIN liquidity_events e ON e.pool_id=p.id WHERE (p.currency0=t.address OR p.currency1=t.address) AND e.senders_pending)
      AND NOT EXISTS(SELECT 1 FROM pools p JOIN pending_pool_events e ON e.emitter=p.id WHERE p.currency0=t.address OR p.currency1=t.address)
      AND NOT EXISTS(SELECT 1 FROM (VALUES ('1h',3600),('24h',86400),('7d',604800)) AS h(horizon,sec)
        LEFT JOIN LATERAL (SELECT e.number FROM engine_block_times e WHERE e.ts>=created.ts+make_interval(secs=>h.sec) ORDER BY e.ts,e.number LIMIT 1) e ON true
        WHERE NOT EXISTS(SELECT 1 FROM outcomes o WHERE o.coin=t.address AND o.horizon=h.horizon)
          AND (e.number IS NULL OR EXISTS(SELECT 1 FROM swaps s WHERE s.coin=t.address AND s.block<=e.number))
          AND ($6::text NOT IN ('settled','raw_cap') OR coalesce(e.number,9223372036854775807)<=$1))
      AND (EXISTS(SELECT 1 FROM token_transfers x WHERE x.token=t.address AND x.block<=$1)
        OR EXISTS(SELECT 1 FROM pons_events e WHERE e.token=t.address AND e.block<=$1)
        OR EXISTS(SELECT 1 FROM pools p JOIN liquidity_events e ON e.pool_id=p.id
          WHERE ((p.currency0=t.address AND p.currency1=ANY($4::bytea[])) OR (p.currency1=t.address AND p.currency0=ANY($4::bytea[]))) AND e.block<=$1
          AND ($6::text IN ('settled','raw_cap') OR t.deployer IS NULL OR e.actor IS NULL OR e.actor<>t.deployer OR e.kind NOT IN ('Burn','ModifyLiquidity')))
        OR ${swapStage})
    ORDER BY t.address LIMIT $7`, [through.toString(), swapsThrough?.toString() ?? null, exclude, pairQuotes, after, rule, limit])).rows;
}
type PruneCounts = Partial<Record<'transfers' | 'liquidity' | 'pons' | 'swaps', number>>;
/** The coin's current verdict level and Danger playbook ids (coin $1), recorded with every prune (0186). */
const rating = `(SELECT c.data->'verdict'->>'level' FROM coin_card_latest c WHERE c.coin=$1),
  (SELECT coalesce(jsonb_agg(DISTINCT m->>'id' ORDER BY m->>'id'),'[]'::jsonb) FROM coin_card_latest c
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(c.data->'verdict'->'playbooks')='array' THEN c.data->'verdict'->'playbooks' ELSE '[]'::jsonb END) m
    WHERE c.coin=$1 AND m->>'level'='danger')`;
/** A Danger rating, once recorded, survives later prunes: the engines keep a revived Danger coin Danger, so a later card
 * says Danger too, but its Danger playbooks may be ones the deleted history no longer lets them re-run. */
const keepRating = `verdict_level=CASE WHEN history_prunes.verdict_level='danger' THEN 'danger' ELSE coalesce(excluded.verdict_level,history_prunes.verdict_level) END,
  danger_playbooks=(SELECT coalesce(jsonb_agg(DISTINCT v ORDER BY v),'[]'::jsonb) FROM jsonb_array_elements_text(history_prunes.danger_playbooks||excluded.danger_playbooks) v)`;
/** Record what a batch removed, in the batch's transaction, so no reader sees missing rows without the summary row. */
async function recordPrune(db: ChainDb, coin: Uint8Array, rule: HistoryRule, through: bigint, counts: PruneCounts) {
  await db.sql.query(`INSERT INTO history_prunes(coin,rule,through_block,transfers,liquidity,pons,swaps,verdict_level,danger_playbooks)
    SELECT $1,$2,$3,$4,$5,$6,$7,${rating}
    ON CONFLICT(coin) DO UPDATE SET through_block=greatest(history_prunes.through_block,excluded.through_block),transfers=history_prunes.transfers+excluded.transfers,
      liquidity=history_prunes.liquidity+excluded.liquidity,pons=history_prunes.pons+excluded.pons,swaps=history_prunes.swaps+excluded.swaps,${keepRating},updated_at=now()`,
  [coin, rule, through.toString(), counts.transfers ?? 0, counts.liquidity ?? 0, counts.pons ?? 0, counts.swaps ?? 0]);
}
/** Delete up to `limit` of a coin's prunable liquidity events at or below `through`. */
export async function pruneLiquidity(db: ChainDb, coin: Uint8Array, through: bigint, pairQuotes: Uint8Array[], limit: number): Promise<number> {
  return Number((await db.sql.query<{ n: string }>(`WITH gone AS (DELETE FROM liquidity_events x USING (SELECT e.tx_hash,e.log_index ${prunableLiquidity} LIMIT $4) d
    WHERE x.tx_hash=d.tx_hash AND x.log_index=d.log_index RETURNING 1) SELECT count(*)::text AS n FROM gone`, [coin, through.toString(), pairQuotes, limit])).rows[0]?.n ?? 0);
}
/** Delete up to `limit` of a coin's Pons events at or below `through`. */
export async function prunePons(db: ChainDb, coin: Uint8Array, through: bigint, limit: number): Promise<number> {
  return Number((await db.sql.query<{ n: string }>(`WITH gone AS (DELETE FROM pons_events x USING (SELECT tx_hash,log_index FROM pons_events WHERE token=$1 AND block<=$2 LIMIT $3) d
    WHERE x.tx_hash=d.tx_hash AND x.log_index=d.log_index RETURNING 1) SELECT count(*)::text AS n FROM gone`, [coin, through.toString(), limit])).rows[0]?.n ?? 0);
}
/**
 * Delete a coin's oldest swaps at or below `through`: at least `limit` when that many remain, always whole minutes, so
 * a minute bar never loses only part of its swaps (market.ts keeps bars whose minute has no swap left). The swap
 * trigger marks the coin's Watcher flow dirty from the deleted swaps' time, which would make the Watcher delete the
 * coin's chart markers from then on and rebuild them from nothing. The swaps are older than every flow window, so
 * the coin's dirty mark is put back as it was.
 */
export async function pruneSwaps(db: ChainDb, coin: Uint8Array, through: bigint, limit: number): Promise<number> {
  return db.tx(async tx => {
    const placeholder = (await tx.sql.query("INSERT INTO flow_dirty(coin,from_sec) VALUES($1,'Infinity') ON CONFLICT(coin) DO NOTHING RETURNING coin", [coin])).rows.length > 0;
    const prior = placeholder ? undefined : (await tx.sql.query<{ revision: string; from_sec: number }>('SELECT revision,from_sec FROM flow_dirty WHERE coin=$1 FOR UPDATE', [coin])).rows[0];
    const moved = Number((await tx.sql.query<{ n: string }>(`WITH edge AS (
        SELECT date_trunc('minute',ts)+interval '1 minute' AS ts FROM swaps WHERE coin=$1 AND block<=$2 ORDER BY ts LIMIT 1 OFFSET $3
      ), gone AS (DELETE FROM swaps WHERE coin=$1 AND block<=$2 AND ts<coalesce((SELECT ts FROM edge),'infinity'::timestamptz)
        AND (SELECT count(*) FROM (SELECT 1 FROM swaps WHERE coin=$1 AND block<=$2 AND ts<coalesce((SELECT ts FROM edge),'infinity'::timestamptz) LIMIT 10001) bounded)<=10000 RETURNING 1)
      SELECT count(*)::text AS n FROM gone`, [coin, through.toString(), Math.max(0, limit - 1)])).rows[0]?.n ?? 0);
    if (prior) await tx.sql.query('UPDATE flow_dirty SET revision=$2,from_sec=$3 WHERE coin=$1', [coin, prior.revision, prior.from_sec]);
    else await tx.sql.query('DELETE FROM flow_dirty WHERE coin=$1', [coin]);
    return moved;
  });
}
/** Summarise the swaps about to be deleted (trade times and an upper bound on distinct buyers) before the first batch. */
async function recordSwapSummary(db: ChainDb, coin: Uint8Array, rule: HistoryRule, through: bigint) {
  await db.sql.query(`INSERT INTO history_prunes(coin,rule,through_block,swaps_through_block,first_trade_ts,last_trade_ts,buyers,verdict_level,danger_playbooks)
    SELECT $1,$2,$3,$3,min(ts),max(ts),count(DISTINCT trader) FILTER(WHERE side=1 AND trader IS NOT NULL AND NOT senders_pending)
      +count(*) FILTER(WHERE side=1 AND (trader IS NULL OR senders_pending)),${rating} FROM swaps WHERE coin=$1 AND block<=$3
    ON CONFLICT(coin) DO UPDATE SET through_block=greatest(history_prunes.through_block,excluded.through_block),
      swaps_through_block=greatest(history_prunes.swaps_through_block,excluded.swaps_through_block),first_trade_ts=least(history_prunes.first_trade_ts,excluded.first_trade_ts),
      last_trade_ts=greatest(history_prunes.last_trade_ts,excluded.last_trade_ts),buyers=history_prunes.buyers+excluded.buyers,${keepRating},updated_at=now()`,
  [coin, rule, through.toString()]);
}
interface HistoryPass { pauseMs?:number; limit: number; timeLeft: () => boolean; result: RetentionResult }
/**
 * Drop one quiet coin's raw history and keep its summary. Transfers at or below `through` are compacted into
 * `transfer_baselines` (exact balances and holder views), its quote-pool liquidity events and Pons events there are
 * deleted, and, when `swapsThrough` is given, its swaps at or below that. Kept: tokens, pools, exemptions, balances,
 * baselines, minute bars, cards, verdicts, matches, outcomes, deployer statistics, receipts and Feed rows. Returns
 * false when the time budget ran out first.
 */
export async function pruneCoinHistory(db: ChainDb, coin: QuietCoin, rule: HistoryRule, through: bigint, swapsThrough: bigint | null,
  pairQuotes: Uint8Array[], pass: HistoryPass): Promise<boolean> {
  const { limit, timeLeft, result } = pass, address = coin.address;
  const drain = async (step: (tx: ChainDb) => Promise<number>, count: keyof typeof totals) => {
    for (;;) {
      if (!timeLeft()) return false;
      const moved = await retentionBatch(db,step,pass.pauseMs);
      result[totals[count]] += moved;
      if (moved < limit) return true;
    }
  };
  const totals = { transfers: 'historyTransfers', liquidity: 'historyLiquidity', pons: 'historyPons', swaps: 'historySwaps' } as const;
  const steps: [keyof PruneCounts, (tx: ChainDb) => Promise<number>][] = [
    ['transfers', tx => compactTransfers(tx, [address], through, limit)],
    ['liquidity', tx => pruneLiquidity(tx, address, through, pairQuotes, limit)],
    ['pons', tx => prunePons(tx, address, through, limit)],
  ];
  for (const [kind, step] of steps) {
    const done = await drain(async tx => {
      const moved = await step(tx);
      if (moved) await recordPrune(tx, address, rule, through, { [kind]: moved });
      return moved;
    }, kind);
    if (!done) return false;
  }
  if (!coin.swaps || swapsThrough === null) return true;
  // Resume an interrupted deletion at its recorded horizon, so the summary covers exactly the deleted swaps.
  const started = (await db.sql.query<{ through: string }>(`SELECT p.swaps_through_block::text AS through FROM history_prunes p
    WHERE p.coin=$1 AND EXISTS(SELECT 1 FROM swaps s WHERE s.coin=p.coin AND s.block<=p.swaps_through_block)`, [address])).rows[0];
  const target = started ? BigInt(started.through) : swapsThrough;
  if (!started) await recordSwapSummary(db, address, rule, target);
  return drain(async tx => {
    const moved = await pruneSwaps(tx, address, target, limit);
    if (moved) await recordPrune(tx, address, rule, target, { swaps: moved });
    return moved;
  }, 'swaps');
}
/**
 * One rule's pass over quiet coins: events and transfers go at the rule's horizon, swaps once the coin has also had
 * no swap for `SWAP_EVIDENCE_DAYS`, and only after the trending lists that read those swaps are saved.
 */
async function pruneQuietCoins(db: ChainDb, rule: HistoryRule, days: number, nowMs: number, exclude: Uint8Array[], pass: HistoryPass) {
  const through = await retentionHorizon(db, days, nowMs);
  if (through === null) return;
  let swapsThrough = await retentionHorizon(db, Math.max(days, SWAP_EVIDENCE_DAYS), nowMs);
  if (swapsThrough !== null) {
    let complete = false;
    while (!complete && pass.timeLeft()) {
      const saved = await snapshotTrending(db, swapsThrough, 1);
      pass.result.trendingSnapshots += saved.saved; complete = saved.complete;
    }
    if (!complete) swapsThrough = null;
  }
  const pairQuotes = [...exclude, ZERO_ADDRESS];
  let after: Uint8Array | null = null;
  while (pass.timeLeft()) {
    const coins = await quietCoins(db, rule, through, swapsThrough, exclude, pairQuotes, after, Math.min(pass.limit,100));
    if (!coins.length) return;
    for (const coin of coins) {
      const done = await pruneCoinHistory(db, coin, rule, through, swapsThrough, pairQuotes, pass);
      pass.result[rule === 'danger_quiet' ? 'dangerCoins' : 'quietCoins']++;
      if (!done) return;
      after = coin.address;
    }
  }
}

/** Walk only token identities, then probe each token's indexed event ranges. */
export async function rawCandidates(db: ChainDb, through: bigint, quote: Uint8Array[], after: Uint8Array | null, swaps = false, limit = 200) {
  const event = swaps ? 'swaps' : 'token_transfers', key = swaps ? 'coin' : 'token';
  return (await db.sql.query<{ address: Uint8Array; eligible: boolean }>(`WITH identities AS MATERIALIZED (
      SELECT address FROM tokens WHERE deployer IS NULL AND launchpad IS NULL
        AND ($3::bytea IS NULL OR address>$3) AND NOT address=ANY($2::bytea[]) ORDER BY address LIMIT ${Math.min(limit,200)}
    ) SELECT t.address, (EXISTS(SELECT 1 FROM ${event} x WHERE x.${key}=t.address AND x.block<=$1 LIMIT 1)
      AND NOT EXISTS(SELECT 1 FROM swaps s WHERE s.coin=t.address AND s.senders_pending LIMIT 1)
      AND NOT EXISTS(SELECT 1 FROM swaps s WHERE s.coin=t.address AND s.pricing_pending LIMIT 1)
      ${swaps ? '' : `AND NOT EXISTS(SELECT 1 FROM pools p JOIN liquidity_events e ON e.pool_id=p.id
        WHERE (p.currency0=t.address OR p.currency1=t.address) AND e.senders_pending LIMIT 1)
      AND NOT EXISTS(SELECT 1 FROM coin_card_latest c WHERE c.coin=t.address LIMIT 1)`}) AS eligible
    FROM identities t ORDER BY t.address`, [through.toString(), quote, after])).rows;
}

/** Each rule owns a short budget. A timed-out transaction rolls back before the next rule starts. */
export async function runRetention(source: ChainDb, options: RetentionOptions): Promise<RetentionResult> {
  options = { ...options, dryRun: options.dryRun ?? true };
  const passDeadline = Date.now() + Math.min(options.passBudgetMs ?? 115_000, 115_000);
  let queryDeadline = passDeadline;
  const db = retentionDb(source, () => queryDeadline), cursors = retentionCursors(source);
  const now = options.now ?? Date.now, started = now();
  let limit = Math.min(options.batchRows ?? 1000, 5000);
  if (options.quietCoinDays !== undefined && options.quietCoinDays <= ENGINE_IDLE_DAYS) throw new Error('Quiet-coin retention must exceed the engines idle window');
  if (options.idleTokenDays !== undefined && options.idleTokenDays <= ENGINE_IDLE_DAYS) throw new Error('Idle-token retention must exceed the engines idle window');
  if (options.dangerQuietDays !== undefined && !(options.dangerQuietDays >= 1)) throw new Error('Danger-coin retention needs at least one quiet day');
  const result: RetentionResult = { quoteRows: 0, idleTokens: 0, idleRows: 0, pendingRows: 0, feedRows: 0, dangerCoins: 0, quietCoins: 0,
    historyTransfers: 0, historyLiquidity: 0, historyPons: 0, historySwaps: 0, trendingSnapshots: 0, finished: true, skippedRules: [] };
  if (options.dryRun) { result.dryRun = true; result.tables = []; }
  const rules = retentionRules(options, result, budget => { queryDeadline = Math.min(passDeadline, Date.now() + budget); }, retentionBatchSizes(source));
  const runRule: typeof rules = (name, work) => rules(name, (timeLeft, rows) => { limit = rows; return work(timeLeft, rows); });
  const quote = options.quoteTokens.map(token => binary(token as `0x${string}`));
  if (options.rawDays !== undefined) quote.push(ZERO_ADDRESS);
  const modern = options.settleHours !== undefined || options.rawDays !== undefined;
  const report = async (table: string) => {
    if (!result.tables?.some(r => r.table === table)) addReport(result, await reportRows(db, table, '', []));
  };
  if (modern) {
    for (const rule of ['settled', 'raw_cap'] as const) {
      if (rule === 'settled' ? options.settleHours === undefined : options.rawDays === undefined) continue;
      await runRule(rule, async timeLeft => {
        if (options.dryRun) { for (const table of ['token_transfers','liquidity_events','pons_events','swaps']) await report(table); return; }
        await determinationPass(db, { ...options, batchRows: limit }, result, quote, started, rule, timeLeft);
      });
    }
  }
  const drain = async (timeLeft: () => boolean, step: (tx: ChainDb) => Promise<number>, count: 'quoteRows' | 'idleRows' | 'pendingRows' | 'feedRows' | 'historySwaps', size = limit) => {
    while (timeLeft()) {
      const moved = await retentionBatch(db, step, options.pauseMs); result[count] += moved;
      if (moved < size) return true;
    }
    result.finished = false; return false;
  };
  if (options.rawDays !== undefined) {
    for (const swaps of [false, true]) await runRule(swaps ? 'raw_swaps' : 'unrated_transfers', async timeLeft => {
      if (options.dryRun) { await report(swaps ? 'swaps' : 'token_transfers'); return; }
      const through = await retentionHorizon(db, swaps ? Math.max(options.rawDays!, SWAP_EVIDENCE_DAYS) : options.rawDays!, started);
      if (through == null) return;
      if (swaps) {
        let complete = false;
        while (timeLeft() && !complete) { const saved = await snapshotTrending(db, through, 1); result.trendingSnapshots += saved.saved; complete = saved.complete; }
        if (!complete) { result.finished = false; return; }
      }
      const name = swaps ? 'raw_swaps' : 'unrated_transfers';
      let after = (cursors.get(name)?.[0] as Uint8Array | undefined) ?? null;
      while (timeLeft()) {
        const page = await rawCandidates(db, through, swaps ? [] : quote, after, swaps, limit);
        if (!page.length) { cursors.delete(name); return; }
        for (const token of page) {
          if (!timeLeft()) { result.finished = false; return; }
          if (token.eligible) {
            const complete = await drain(timeLeft, tx => swaps ? compactLifetimeSwaps(tx, token.address, through, limit, options.firstBlocks, options.cohortSec,
              options.poolManager, quote.some(q => Buffer.from(q).equals(Buffer.from(token.address)))) : compactUnratedTransfers(tx, token.address, through, limit), swaps ? 'historySwaps' : 'idleRows');
            if (!complete) return;
          }
          after = token.address; cursors.set(name, [after]);
        }
      }
      result.finished = false;
    });
  }
  const quoteDays = modern ? (options.rawDays === undefined ? undefined : Math.min(options.rawDays, options.quoteDays ?? options.rawDays)) : options.quoteDays;
  if (quoteDays !== undefined && quote.length) await runRule('quote_transfers', async timeLeft => {
    const through = await retentionHorizon(db, quoteDays, started); if (through == null) return;
    if (options.dryRun) await report('token_transfers');
    else await drain(timeLeft, tx => compactTransfers(tx, quote, through, limit), 'quoteRows');
  });
  if (options.ratingDays !== undefined) await ratingRetention(db, options, result, started, runRule, cursors);
  if (!modern && options.idleTokenDays !== undefined) await runRule('idle_transfers', async timeLeft => {
    const through = await retentionHorizon(db, options.idleTokenDays!, started); if (through == null) return;
    if (options.dryRun) { await report('token_transfers'); return; }
    while (timeLeft()) {
      const tokens = await idleTokens(db, through, quote, 200); if (!tokens.length) return;
      result.idleTokens += tokens.length;
      if (!await drain(timeLeft, tx => compactTransfers(tx, tokens, through, limit), 'idleRows')) return;
    }
    result.finished = false;
  });
  for (const [name, days, step, count] of [
    ['pending_pool_events', options.pendingPoolDays, prunePendingPoolEvents, 'pendingRows'],
    ['read_feed', options.feedDays ?? (modern ? options.ratingDays : undefined), pruneFeed, 'feedRows']
  ] as const) {
    if (days === undefined) continue;
    await runRule(name, async timeLeft => {
      const through = await retentionHorizon(db, days, started); if (through == null) return;
      if (options.dryRun) await report(name);
      else if (name === 'pending_pool_events') {
        while (timeLeft()) {
          const batch = await retentionBatch(db, tx => pendingPoolBatch(tx, through, limit, cursors.get(name)), options.pauseMs);
          result.pendingRows += batch.rows;
          if (!batch.after) { cursors.delete(name); return; }
          cursors.set(name, batch.after);
        }
        result.finished = false;
      } else await drain(timeLeft, tx => step(tx, through, Math.min(limit, FEED_BATCH_ROWS)), count);
    });
  }
  if (!modern) for (const [rule, days] of [['danger_quiet', options.dangerQuietDays], ['quiet_coin', options.quietCoinDays]] as const) {
    if (days === undefined) continue;
    await runRule(rule, async timeLeft => {
      if (options.dryRun) { for (const table of ['token_transfers','liquidity_events','pons_events','swaps']) await report(table); return; }
      await pruneQuietCoins(db, rule, days, started, quote, { limit, timeLeft, result, pauseMs: options.pauseMs });
    });
  }
  return result;
}
