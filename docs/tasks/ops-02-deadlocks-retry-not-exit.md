# Ops 02 · Deadlocks are retried, never fatal, and read-model writers lock in one order

Read `AGENTS.md` first (rule 9 included). One engineer session. Production fix.

## What happens (production, Oct 19, fresh database)

The engines container exits about once a minute (29 restarts in 37 minutes). Each restart loses the worker's
progress and caches. The hidden error is:

```
error: deadlock detected
    at EngineWorker.writeCoin → persistRun → ChainDb.tx → evaluateActivity → poll → run → main
```

The two sides, from the Postgres log:

- **Engines (card write):**
  - `UPDATE coin_card_latest SET as_of_block=$2,data=$3 WHERE coin=$1 AND as_of_block<=$2`
  - Its trigger `read_mark_dirty()` runs `INSERT INTO read_dirty(coin) … ORDER BY coin ON CONFLICT(coin) DO UPDATE`.
- **Bar writer (indexer side):**
  - `DELETE FROM bars_1m b USING (… VALUES (coin, minute) … raw_history_live_swaps … raw_history_bar_keys …)`
  - Its triggers lock `read_row_series` rows: `refresh_read_row_series(bytea[],…)` runs
    `SELECT * FROM read_row_series WHERE coin=k FOR UPDATE` per coin, and it also touches `read_dirty`.

So the two transactions lock `read_dirty` and `read_row_series` rows for overlapping coins in different orders. The
same family appears as `engine_rerate_failed: deadlock detected`, which is logged and survived. In the card path it is
fatal: `apps/engines/src/cli.ts` exits on any error, with the message "Engines halted: check environment, indexed range
and database."

## Do

1. **Retry, don't exit.**
   - A transaction that fails with SQLSTATE `40P01` (deadlock) or `40001` (serialization) is retried: bounded (for
     example 5 attempts), with jittered backoff, and from a clean state, so no partial in-memory side effects carry
     over.
   - Cover the engines card write (`persistRun` / `writeCoin` inside `evaluateActivity`), the rerate loop, and the
     indexer's bar/raw-history writes.
   - Prefer one helper in `ChainDb.tx` (opt-in per call site) over ad-hoc loops.
   - After the retries are exhausted, skip that coin or batch for this cycle with a counted reason, and continue. The
     role never exits because of a deadlock.
   - Emit a per-minute counter: `db_deadlock_retries`, `db_deadlock_skipped`.
2. **One lock order: use the existing cure (preferred over retries).**
   - `read_lock_coins(bytea[])` (migration 0208) takes `read_projection_locks` in sorted coin order. `store.ts`,
     `liquidity-model.ts`, `determination-retention.ts` and the seal (`raw-partitions.ts`:
     `read_lock_coins(array_agg(coin ORDER BY coin))`) all call it before writing.
   - **Option (a), preferred:** `writeBars` (`packages/db/src/market.ts`) calls
     `SELECT read_lock_coins(<distinct coins of its keys>)` before its DELETE. The engines' `writeCoin` and the rerate
     path call it for their coin(s) before the `coin_card_latest` UPDATE. Every writer then serialises per coin
     through one sorted lock table, and the triggers' `FOR UPDATE` on `read_row_series` / `read_dirty` become
     uncontended.
   - Keep `refresh_read_row_series` iterating coins `ORDER BY k`.
   - **Option (b), only if (a) is insufficient:** the `bars_1m` statement triggers only mark `read_dirty`
     (coin-sorted insert), and the refresher rebuilds `read_row_series` outside the bar transaction.
   - Retries (item 1) are the backstop, not the fix.

   Also:
   - Every path that locks `read_dirty` or `read_row_series` rows for several coins locks them in ascending coin order
     inside one transaction. Include `refresh_read_row_series`, the bar delete/insert path and `read_mark_dirty`.
   - Where a trigger cannot guarantee order, take the coin locks up front in sorted order, or defer the
     `read_row_series` refresh to the existing dirty queue instead of locking it inside the writer's transaction.
   - Use a migration with the next free engines number if SQL functions change. Check the live list first;
     `0225_rpc_provider_pause` is the latest.
3. **Visibility.** `cli.ts` keeps hiding raw errors (they can carry provider URLs), but it logs the error class and
   SQLSTATE (`{"event":"engines_halted","code":"40P01","class":"database"}`), so the next halt is diagnosable without a
   debug build.
4. **Tests:**
   - Reproduce the deadlock with two concurrent transactions (card update vs bar delete on overlapping coins) against
     PGlite or pg-mem where possible, otherwise against the Postgres used in CI: it is now resolved by lock order, or
     retried successfully.
   - Exhausted retries skip and continue.
   - The halt log carries the SQLSTATE.
   - The engines, indexer and db suites stay green. The engines suite is mandatory for any trigger change.

## Don't

- No new dependencies. Don't change ratings logic, budgets or retention. Rule 9 (no personal identifiers).

## Report

Files, the retry helper and where it is used, the lock order change, the migration number if any, and the gates run:
`pnpm typecheck` and the `@eko/db`, `@eko/indexer`, `@eko/engines`, `@eko/server` tests and `pnpm test:checks`, run
serially with VITEST_MAX_WORKERS=2.
