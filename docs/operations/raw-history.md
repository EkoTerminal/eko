# Daily raw history maintenance

The operator-requested policy supersedes the monthly layout / retention in BACKEND §§3.3, 3.6. Swaps retain seven days (`RETENTION_SWAP_DAYS`, minimum 7); transfers retain three (`RETENTION_TRANSFER_DAYS`, minimum 1). UTC partitions are `swaps_d2026_10_16` and `token_transfers_d2026_10_16`, with inclusive midnight / exclusive next midnight bounds. `ensurePartitions(date)` provisions each table from the UTC day containing `date - retention window` through `date + DAYS_AHEAD` (default 3, range 0–366). Historical ingestion provisions its own dates. Existing monthly ranges remain authoritative until manually replaced. Bars retain monthly partitions. Parent partitioned indexes propagate automatically. Repeated calls use the committed per-process cache; rolled-back DDL is never cached.

Chain migration **0210_daily_raw_history**, recorded in `eko_indexer_migrations`, removes only empty May, June, July, November and December 2026 monthly siblings, under a lock and an actual `EXISTS` check. Populated siblings and October remain. It removes `raw_history_progress`, retains `raw_history_watermarks`, and adds the seal journal, range fences, ordered lifetime fold and live-source views. Engines migration **0210_daily_raw_reads**, recorded in `eko_engine_migrations`, switches the raw branch of `retention_read_swaps` to that live-source view. Apply both through the existing release migration procedure before starting new workers. Previous migrations remain unchanged; the old row-draining backlog executable is retired.

## Sealing and ongoing retention

`sealRawPartition(db, table, partition, {tsBefore?})` accepts an attached raw range partition. It commits a timestamp-range insert/mutation fence through the existing watermark-row barrier, then seals in a pinned session with `statement_timeout=0`. Ordinary current-time indexer inserts continue. A failed aggregate transaction rolls back all its summaries; its pending range fence persists so rerunning the same call can finish. The committed journal makes retries idempotent. Changing a persisted cutoff is refused. A pending seal is a maintenance checkpoint, not evidence that dropping the table is permitted.

All aggregation stays in PostgreSQL. Each summary uses a set-based `INSERT … SELECT`; the ordered lifetime aggregate preserves the existing JavaScript reducer's canonical block/log/hash order, attribution, evidence examples and last-60 tail. Temporary source tables and their indexes disappear at transaction end. The summaries are:

- `coin_lifetime`: ordered lifetime/launch/early-wallet/first-hour/deployer/graduation and per-pool price statistics; opening and graduation holdings. Transfers previously wrote no separate lifetime transfer counters: their exact movement statistics are `transfer_baselines` plus holder checkpoints.
- `reference_price_baselines`, `coin_buyer_firsts`, `coin_unknown_buys`, `read_buyers`, `history_prunes`.
- `coin_outcome_hours`, `coin_lifetime_checkpoints`, `coin_holder_checkpoints`; existing independently compacted `coin_outcome_events` and LP/Pons summaries are preserved.
- `bars_1m` and `raw_history_bar_keys` (including the complete boundary minute for a partial monthly seal), `retention_grade_prices`, `trending_snapshots` and its queue.
- Engine swap/window generations and the live activity change log, explicitly replacing invalidations that parent DELETE triggers formerly performed.

The singleton worker runs the partition rule at start and at most hourly, under advisory mutex `(4663,208)`, shared with rollback. Other rules retain their cadence, budgets and batching. Each eligible daily range has **END strictly older than** its configured cutoff: retention can therefore keep up to one extra day. Monthly partitions are never automatically dropped. Each partition commits seal, detach, drop/journal, and block-watermark advance separately, in that order. DDL uses `lock_timeout='5s'`; conflicts leave the journal resumable at the next hourly pass. The seal itself has no statement deadline. Successful maintenance logs one line with table, partition, rows and elapsed seconds. Dry run lists partitions without fencing or changing them.

The range fence closes the seal/drop/watermark race. Live-source views hide sealed rows until drop, so summaries and source events cannot both enter holder/lifetime readers after a lock conflict. Engine caches invalidate when sealing commits. Reorgs across sealed history, watermark boundaries or frozen bars fail explicitly and require an archive. Never clear these fences to force replay. Parent statement triggers continue to govern ingestion; direct writes to standalone maintenance tables are reserved for the operator sequence below.

## One-time October replacement

Keep the indexer, engines, pricing repair, API and new hourly retention worker running throughout. Deploy the daily-partition code and both 0210 migrations first, using the normal release procedure. With October still monthly, provisioning recognizes its bounds and the hourly rule considers only names matching `*_dYYYY_MM_DD`, including when resuming journal entries. Neither path depends on an October seal or on the operator helpers having run.

Use an existing backup/archive and enough spare disk for retained daily heaps, indexes, aggregation work and WAL. The original 18/19 GB monthly files stay attached until step 4 commits, and remain on disk until step 5. Copying may take an hour or more; all live history remains available during it. Maintenance inserts address standalone leaves directly, so parent statement-level ingestion triggers do not execute again.

Run the following **numbered commands in order**, from the deployed checkout, with the existing PostgreSQL connection environment. Each helper call is its own autocommit transaction; never wrap the whole procedure in a transaction. Use the same `DAYS_AHEAD` as the deployment and a `REORG_TAIL` at least as large as its supported reorg depth (default 300 blocks). An error stops that command list: inspect it and resume as described. A `55P03` acquisition failure means retry after the conflicting transaction ends, keeping the 10-second lock timeout.

1. **Configure the sessions and load the helpers.** Usually under one second. Blocks no application reads or writes; only helper metadata DDL is installed. Verify the function and journal definitions; reload this same file after a load failure. No data is copied, detached or deleted here.

   ```sh
   set -eu
   export PGOPTIONS="${PGOPTIONS:-} -c statement_timeout=0 -c timezone=UTC -c eko.days_ahead=${DAYS_AHEAD:-3} -c eko.reorg_tail=${REORG_TAIL:-300}"
   psql -X -v ON_ERROR_STOP=1 -f scripts/raw-history-repartition.sql
   psql -X -v ON_ERROR_STOP=1 -c '\df raw_history_repartition_*'
   ```

2. **Seal the discarded prefixes and build the source lookup index while attached.** Allow 5–60+ minutes per table for seals and 2–30+ minutes for the concurrent transfer index, depending on storage. The seal briefly coordinates its watermark row with in-flight mutations, then fences only the discarded timestamp prefix; current-time ingestion, retained pricing repair and reads continue. Aggregation and `CREATE INDEX CONCURRENTLY` do not take the parent out of service. Swaps already inherits `(block,ts)`; transfers needs the extra source index below.

   ```sh
   node --env-file-if-exists=.env apps/server/dist/raw-history-repartition-seal.js 2026-10-15T00:00:00Z
   # Source checkout alternative to the node command:
   # pnpm --filter @eko/db raw-history:seal 2026-10-15T00:00:00Z
   psql -X -v ON_ERROR_STOP=1 -c 'CREATE INDEX CONCURRENTLY IF NOT EXISTS token_transfers_2026_10_repartition_block ON token_transfers_2026_10(block,ts)'
   psql -X -v ON_ERROR_STOP=1 -c 'ANALYZE token_transfers_2026_10'
   psql -X -v ON_ERROR_STOP=1 -c "SELECT name,end_ts,sealed,through_block FROM raw_history_seals WHERE partition_name IN ('swaps_2026_10','token_transfers_2026_10') ORDER BY name"
   psql -X -v ON_ERROR_STOP=1 -c "SELECT indisvalid,indisready FROM pg_index WHERE indexrelid='token_transfers_2026_10_repartition_block'::regclass"
   ```

   This example fixes swaps' cutoff at October 8 and transfers' at October 12. On a later start date supply the actual UTC timestamp instead; the first seal persists its cutoff across retries and midnight. Verify both seals are true and both index flags are true. Rerun a failed seal: committed summaries are no-ops, incomplete aggregates roll back. If a concurrent build leaves an invalid index, run `DROP INDEX CONCURRENTLY token_transfers_2026_10_repartition_block` and repeat the build; `IF NOT EXISTS` alone does not repair an invalid index. Do not run the index build inside `BEGIN`.

3. **Plan and copy the kept days with October still attached.** Allow 1–15+ minutes per populated day, potentially an hour or more overall. Blocks no parent reads/writes: source scans hold ACCESS SHARE and index builds/ANALYZE address standalone leaves. Verify every planned day has `copied=true`, a recorded `high_block` (`-1` for an empty copy), its validated day CHECK and all parent indexes. Resume by rerunning this entire step: completed days are no-ops and a failed day's create/load/index work rolls back together.

   ```sh
   for raw_table in swaps token_transfers; do
     psql -X -v ON_ERROR_STOP=1 -c "SELECT raw_history_repartition_plan('$raw_table')"
   done
   psql -X -At -v ON_ERROR_STOP=1 -c "SELECT format('SELECT raw_history_repartition_copy(%L,%L::timestamptz);',name,day) FROM raw_history_repartition_days ORDER BY name,day" > .raw-history-copy.sql
   psql -X -v ON_ERROR_STOP=1 -f .raw-history-copy.sql
   psql -X -v ON_ERROR_STOP=1 -c 'SELECT name,min(day),max(day),bool_and(copied) AS copied,max(high_block) AS high_block FROM raw_history_repartition_days GROUP BY name'
   psql -X -v ON_ERROR_STOP=1 -c "SELECT inhrelid::regclass FROM pg_inherits WHERE inhparent IN ('swaps'::regclass,'token_transfers'::regclass) ORDER BY 1"
   ```

   The plan covers every UTC day containing the fixed cutoff through at least actual today plus `DAYS_AHEAD`, also including later source dates. With an October 15 execution and lookahead 3, that is October 8–18 for swaps and October 12–18 for transfers. A future daily partition already attached outside October remains authoritative and needs no recopy. For each standalone day, copy reads the named still-attached month with the day bounds and `ts >= cutoff`, records the highest block actually copied, builds every current parent index (including unique, partial, expression and INCLUDE definitions), adds a transfer block index and ANALYZEs. An unplanned existing standalone table is refused for inspection rather than truncated.

   If copying crosses midnight, repeat this step immediately before cutover to extend and copy the lookahead. Keep the copy-to-cutover delay small. The procedure reconciles append-only block deltas, pending enrichment and the configured reorg tail; arbitrary older backfill or updates to already-finalized rows outside those sets require a fresh copy, not a larger lock window. Existing seal fences continue to reject changes to discarded history. No schema/index migrations should run between copy and cutover.

4. **Cut over each table in one transaction. This is the only application-wide blocking window in the replacement.** For an hour's delta of about **70,000 swaps / 150,000 transfers**, expect **roughly 10–60 seconds per table** on healthy storage, plus up to 10 seconds waiting for locks. This is an estimate, not a measured PostgreSQL production result or a deadline: index count, pending backlog, WAL and disk latency can extend it. Reads, pricing updates and ingestion for that parent wait from ACCESS EXCLUSIVE acquisition until commit; the other raw parent remains available. Keep engines, repair and API running: their requests wait and then continue.

   ```sh
   for raw_table in swaps token_transfers; do
     psql -X -v ON_ERROR_STOP=1 -c "\timing on" -c "SELECT raw_history_repartition_cutover('$raw_table')"
   done
   psql -X -v ON_ERROR_STOP=1 -c "SELECT d.name,d.day,d.copied,EXISTS(SELECT 1 FROM pg_inherits i WHERE i.inhparent=d.name::regclass AND i.inhrelid=to_regclass(d.name||'_d'||to_char(d.day AT TIME ZONE 'UTC','YYYY_MM_DD'))) AS attached FROM raw_history_repartition_days d ORDER BY name,day"
   psql -X -v ON_ERROR_STOP=1 -c 'SELECT ts,block,tableoid::regclass FROM swaps ORDER BY ts DESC LIMIT 1' -c 'SELECT ts,block,tableoid::regclass FROM token_transfers ORDER BY ts DESC LIMIT 1'
   ```

   After locking the parent, cutover detaches the month and, for every planned standalone day:

   - Inserts monthly rows with `block > day.high_block`, restricted to the day and kept cutoff, with `ON CONFLICT DO NOTHING`.
   - Uses the swap leaf's `senders_pending` and `pricing_pending` partial indexes to enumerate keys, probes the monthly primary key `(ts,tx_hash,log_index)`, and updates all columns only when the row differs. Cleared source flags are still discovered from the copied leaf flags.
   - Deletes/reinserts the last `REORG_TAIL` blocks ending at the highest block copied for the whole table, across day boundaries. This removes reorg-deleted events and includes replacement/late events within that range.
   - Attaches the day using its validated CHECK and prebuilt equivalent indexes, avoiding heap validation scans or index builds.

   Catch-up uses block-leading indexes, partial indexes and parameterized primary-key probes; it never runs an unrestricted monthly heap scan. Verify all planned days show attached and parent latest-row queries work. Failure anywhere rolls back **detach, repairs and all prior attaches together**, leaving October attached and its live contents intact. Retry the failed table's cutover; a committed invocation is a no-op. If it requests more planned days, repeat step 3 first. Cancellation also rolls back the transaction. Do not detach manually. Do not drop originals until these checks pass for both tables.

5. **Drop detached originals, advance the discarded-prefix watermark and verify lookahead.** Usually seconds for drop/finish; ANALYZE may take seconds/minutes. Blocks only the detached original during DROP; finish checks catalogs and updates the watermark without locking the live parent, and ANALYZE permits reads/writes. Verify both journals show dropped, the block fences equal at least their sealed-prefix `through_block`, and next `DAYS_AHEAD` daily partitions exist. Retry the same calls after failures; committed drops and finish calls are idempotent.

   ```sh
   for raw_table in swaps token_transfers; do
     psql -X -v ON_ERROR_STOP=1 -c "SELECT raw_history_repartition_drop('$raw_table')"
     psql -X -v ON_ERROR_STOP=1 -c "SELECT raw_history_repartition_finish('$raw_table')" -c "ANALYZE $raw_table"
   done
   psql -X -v ON_ERROR_STOP=1 -c "SELECT s.name,s.sealed,s.dropped,s.through_block AS discarded_through,w.through_block AS watermark FROM raw_history_seals s JOIN raw_history_watermarks w USING(name) WHERE s.partition_name=s.name||'_2026_10'"
   rm .raw-history-copy.sql
   ```

   Finish refuses missing future coverage and rolls back its watermark change. If the date advanced after cutover, run a fresh normal provisioning process (`pnpm --filter @eko/db migrate`, whose applied migrations are no-ops and whose `ensurePartitions` provisions today plus deployment `DAYS_AHEAD`) and retry finish. Keep the day-plan and seal journals as recovery evidence. No service restart or reader resume command is needed.

## Verification and limits

Tests run this exact SQL sequence against PGlite, including real range partition DDL, CHECK constraints, parent indexes, direct copy, replays and repeated stages. Optional tests selected by `EKO_TEST_POSTGRES_URL` exercise independent PostgreSQL sessions; PGlite cannot validate real lock waits or production timing. Production PostgreSQL 16.15 performance and disk reclamation require operator measurement.

The equivalence test retains the original batch algorithm as a test-only oracle and compares all summaries it writes. Revision counters and `updated_at` differ because a day commits once rather than once per small batch; these are invalidation metadata, not measurements. Floating-point aggregate sums may differ in last bits for nonintegral USD inputs because grouped SQL sums can reassociate additions; the ordered lifetime fold preserves its input order. Tests additionally cover live cached swaps, delayed outcomes, grade prices, charts, buyer counts, holder balances, lifetime, trending, Census and blue-chip readers. Arbitrary historical replay and enrichment of discarded events still require an archive. Previously incomplete evidence stays incomplete.
