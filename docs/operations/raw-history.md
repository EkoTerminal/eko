# Short raw history

The owner-delegated policy replaces BACKEND §3.6's raw-history policy and §5.2's fingerprint sampling window. Specs under `docs/eko` remain unchanged.

Set these on the worker and engines, then restart both roles:

```dotenv
RETENTION_ENABLED=true
RETENTION_DRY_RUN=false
RETENTION_SWAP_DAYS=7
RETENTION_TRANSFER_DAYS=3
FINGERPRINT_LOOKBACK_DAYS=3
FINGERPRINT_REFRESH_DAYS=3
```

The deployment default remains report-only (`RETENTION_DRY_RUN=true`). Swap days must be an integer of at least seven, transfer days at least one. The fingerprint windows must be positive integer days and their sum must not exceed swap days. Increasing them requires increasing the swap window on both roles. New caps supersede the old determination, quote, idle and quiet-coin swap/transfer deletion rules. The determination rules continue summarising Pons and liquidity events. Rating, pending-pool and Feed retention still run. The old `RETENTION_RAW_DAYS` remains a compatibility setting for direct legacy retention callers, not the worker's swap or transfer cap.

Every identity is eligible, including active, quote, unrated, unknown and pending coins. Each rule selects the oldest raw timestamp/block first across all coins, drains that block in bounded batches, and advances. The existing adaptive control starts at 1,000 rows, halves on statement timeouts down to 32, grows after four successes, pauses 100 ms per row budget (rather than per sparse block), and limits each raw rule to fifteen seconds and each pass to 115 seconds. Raw statements have a five-second ceiling; other rules retain six-second budgets and one-second statements. Outcome holder snapshots are deferred until deletion threatens their cut; hourly trending aggregates remain full-window work and commit separately from deletion. Lock waits still stop after one second. Backlogged passes continue after a 100 ms pause. A coin with a dense minute does not strand that minute. Complete minute bars are frozen before partial-minute deletions. No new estimate scans of the raw tables run.

Swaps run first, after endangered launch trending snapshots and completed grade-price samples are saved. `trending_snapshot_queue` contains unsaved launch blocks and is maintained on token insertion/first-block changes; completed snapshots leave the queue. Each pass drains endangered queue entries through its horizon before deleting swaps, committing each snapshot independently. Completed queue work is not repeated for every deletion batch. Each deleted batch first writes lifetime facts, per-pool last prices, first buyers, unresolved-buy counts and the three outcome checkpoint summaries. Transfers run second, after opening, graduation and outcome holder snapshots (the outcome engine excludes identities without a deployer, so quote-token outcome scans are omitted), and fold exact signed integer movements into `transfer_baselines` in the same transaction as deletion. Pass logs include `rule`, `rows`, `skipped`, `timeouts` and `batch_rows`. A timed-out batch rolls back its summaries and deletions together.

Before compaction, each raw rule advances and commits its insert fence. Insert triggers take compatible shared row locks on the two small fence rows, so the advance waits for earlier writers and later writers see the committed boundary. Compaction never holds these fence row locks. It shares advisory key `(4663,208)` with rollback, while ordinary indexer inserts do not acquire that key. A separate durable `raw_history_progress` row resumes block-index seeks at the current block, including partially drained blocks, without walking the growing deleted index prefix. The transfer block index and existing swap block/time index supply oldest-first discovery. No `SHARE ROW EXCLUSIVE` table lock runs in retention. The cap retains complete boundary minutes. Reorgs inside the retained raw window rebuild balances, bars and rating prices as before. Inserts attempting to replay compacted raw blocks also fail to prevent double-counting summaries. A rollback crossing a compacted watermark or frozen minute fails explicitly and requires restoring pre-compaction archive evidence. Never continue such a rollback by clearing its watermark. Previously deleted legacy history cannot be reconstructed and remains explicitly incomplete. Previously incomplete sender or price evidence remains incomplete in summaries, and old pending rows cease to be enrichment candidates.

## One-time manual backlog drain

Deploy the new image and apply chain migration `0209_bar_write_locks` through the normal indexer migration step before running this command. It creates only a small coin-mutex table; no raw-table index build is required. Keep the earlier 0208 prebuild prerequisites below. Run during a quiet period; the indexer can continue inserting new blocks. The examples name the worker container `eko-worker`; substitute its actual container name from `docker ps` if different. The container already supplies `DATABASE_URL` and the image supplies the bundled CLI:

```sh
docker exec -it eko-worker node dist/raw-history-backlog.js --statement-timeout-ms 60000 --batch-rows 2000 --pause-ms 50
```

Preview with exactly the same eligibility cutoffs, without writing summaries, fences, cursors or raw rows:

```sh
docker exec -it eko-worker node dist/raw-history-backlog.js --statement-timeout-ms 60000 --batch-rows 2000 --pause-ms 50 --dry-run
```

Dry-run counts are exact at each query's snapshot and can themselves read many pages or hit the statement timeout. The CLI runs only `raw_swaps` (seven days) then `raw_transfers` (three days), including their existing prerequisite summaries. These explicit manual horizons supersede BACKEND §3.6 just as the worker policy does. It uses the worker's frozen rule inputs and pool-manager registry entry. It does not depend on `RETENTION_ENABLED` or `RETENTION_DRY_RUN`. Cutoffs preserve the complete boundary minute; after a long drain it rechecks current cutoffs until caught up.

Watch the attached terminal: one JSON line per committed snapshot/deletion batch includes `rule`, `rows`, `throughBlock`, `totalRows`, `rowsPerMinute` (whole-command committed rate), and `oldestRemainingBlock` (null for an empty table). Snapshot batches report zero deletions and their snapshot count; their `throughBlock` is the preparation horizon. Deletion batches report the actual drained block, including partial blocks. `retry` lines include the SQLSTATE and reduced `batchRows`; `complete` means both rules reached their cutoff. This exec process's stdout is attached to the terminal, not the worker's normal `docker logs` stream.

Press **Ctrl-C once** in the attached terminal. The process finishes its current transaction, prints `stopped`, releases the mutex and closes the connection. The initial `started` line prints its PID; from another terminal, `docker exec eko-worker kill -INT PID` also requests this graceful stop (replace `PID` with that printed number). A current statement can take up to the configured timeout, and a transaction can contain multiple statements. Restart the same command to resume: summary updates, raw deletion and `raw_history_progress` commit together. A killed connection rolls back only its uncommitted transaction; PostgreSQL releases its session mutex automatically.

The manual command holds **session advisory key `(4663,208)`** for its full run on one dedicated connection. Worker raw batches try that same key transactionally and skip both raw rules while it is held; other retention rules can still run. A command started during an existing worker batch exits with a busy message; retry after that batch commits. Ordinary indexer inserts do not take this mutex, and only the short initial fence advance locks the watermark row. Reorgs share the mutex and must wait for the manual command to finish or stop.

There is no worker duty-cycle budget and no adaptive decrease on successful batches. The configured row count is the per-coin/per-block maximum; sparse blocks produce smaller transactions. Each manual batch pauses 50 ms by default, including sparse batches. A timeout, lock timeout or deadlock rolls the transaction back, then halves the row setting for that rule; failure at one row exits visibly. Lock waits retain their separate one-second ceiling. Increase the statement setting for genuinely large prerequisites; reducing the delete size cannot reduce the size of an immutable snapshot.

The load-related changes are:

- `refreshBars` (normal ingest and deferred pricing) and `rebuildBars` (graduation/reorg/manual rebuild) previously took `LOCK TABLE bars_1m IN EXCLUSIVE MODE`. Both now serialize by sorted coin mutex rows in `bar_write_locks`, including the first write of an absent bar. Different coins no longer wait on a table-wide bar lock; same-coin writes remain ordered.
- `reference_price_baselines` now consumes the already loaded, locked swap batch rather than rereading each raw swap by primary key. It retains reference-source filtering and monotonic upserts. The supplied 3.5 ms SELECT for 32 warm rows does not establish the production INSERT wait cause: cold heap/index reads, WAL and conflicting baseline writers still need database wait-event evidence.
- `coin_holder_checkpoints` is built only when deletion reaches the checkpoint or preceding-hour cut. Older transfers are already folded into holder baselines, so a first small delete no longer triggers scans of the whole three-day eligible token prefix. Large holder maps or a single dense block can still be expensive. Outcome clocks and completed grade-price preparation are cached once per coin per rule/pass (bounded to 4,096 entries); rolled-back preparation is never cached.
- Hourly trending snapshots commit one launch at a time before swap deletion. A later delete failure no longer discards that full-hour aggregation, and the completed queue is checked once per pass. Hour windows still require their complete aggregate; outcome-hour statistics already accumulate only the exact removed rows.
- Transfer `WITH picked AS MATERIALIZED` deletes now join the selected `(ts,tx_hash,log_index)` primary keys, with explicit timestamp bounds for partition pruning. This replaces a physical `(tableoid,ctid)` join that could walk unrelated partition heaps. Baseline upserts remain in the same atomic statement as deletion.

Expected throughput must be measured on the target disk. For dense batches, rows/minute = `60 * 2000 / (SQL_seconds + 0.05)`; at 1 second of SQL that is about **114,286 rows/minute**, at 5 seconds about **23,762**. A one-row block with 10 ms of SQL and the default pause gives only **1,000 rows/minute**. Snapshot-only work removes zero rows. These are conditional planning examples, not measured production results; use the emitted cumulative rate to estimate the remaining 6M/30M backlog. The one-time command removes the worker's duty-cycle ceiling but cannot remove disk contention.

## Reader inventory

| Reader | History needed | Served after compaction |
|---|---|---|
| Charts, Radar series, minute bars | Lifetime minutes, trailing eight hours | `bars_1m`, with frozen old-minute keys. Sub-minute candles use only six hours of raw swaps. |
| Coin trade markers / Trades tab | Individual recent events | Retained flow markers above the coin's swap watermark. A plain note directs older activity to the chart and summaries. |
| Grade outcomes | First grade at each rules cut, 1-hour / 24-hour price samples and maximum | `retention_grade_prices`, captured before deletion. |
| Rating price baselines | Latest and lifetime peak, last full rating | `coin_rating_prices` and `coin_rating_checks`; ordinary rollback also reads retained minute peaks. |
| Buyer counts and first buyers | Lifetime distinct known wallets, first event provenance, unresolved counts | `read_buyers`, `coin_buyer_firsts`, `read_buyer_firsts`, `coin_unknown_buys` and `read_unknown_buys`. Unknown buys remain upper-bound observations and keep buyer availability pending after raw deletion. |
| Live holders / preceding hour | Exact balances | `balances` plus raw movements and `transfer_baselines`. Historical metadata keeps the indexed outgoing and incoming holder probes. |
| Engine lifetime / launch checks | Launch-to-checkpoint sufficient statistics | `coin_lifetime`, including launch, first-hour, early-buyer, sell, attribution and per-pool price facts. |
| Delayed 1-hour / 24-hour / 7-day outcomes | Exact horizon lifetime and holder inputs | `coin_lifetime_checkpoints`, `coin_holder_checkpoints`, `coin_outcome_hours`, `coin_outcome_events` for independently compacted LP/curve prefixes, and opening holdings. No later lifetime facts are borrowed. Outcome evidence keeps the original price endpoints and up to five canonical insider-sell examples alongside exact counts. |
| Graduation | Opening holders, first pool trade, pre-graduation price, first five minutes | Existing `coin_lifetime.graduation`, `opening_holdings` and `graduation_holdings`, plus retained liquidity and Pons events. |
| Launch trending | Hour before launch | `trending_snapshots`, saved before the first deletion. Live trending uses only the trailing hour. |
| Census | Seven days at a finalized cut | Raw swaps retained for seven days, with a complete-minute margin; published Census uses `census_snapshots`. |
| Wallet watcher / beta labels | Three-day sample at cuts from the last three days, up to 200 swaps each | Raw swaps within the combined six-day span; buyer ranks use maintained firsts and unresolved counts. Previously published labels remain, refreshed behavior labels use fewer observations. Declared registry labels retain their source. |
| Blue chip / liquidity / curve state | Latest per-pool priced sample and position totals, current holders | `read_blue_chip` and lifetime per-pool samples for Blue chip; retained last-50/60 trade samples for existing coin liquidity/curve readers, plus position and balance summaries. |
| Arbitrary old block replay / backfill evidence | Event-by-event historical inputs | Requires an archive. It cannot be reconstructed from net balances or lifetime statistics. The three supported outcome cuts have summaries; arbitrary pre-watermark source loads are unavailable. |

Pending-price/sender repairs, ingestion activity, recent Feed trades, live sell checks and pricing medians operate on retained rows and short live windows. Repairing a deleted event or reproducing arbitrary historical acquisition needs an archive; summaries are not raw evidence. `reference_price_baselines` retains the selected reference-pool price and block before its raw observation is removed, for decoder restarts and pending-price repair. Backfill evidence capture rejects compacted source ranges.

## Kept indexes

All names below are parent index names; each attached month inherits a child. Migration `0207_raw_history_indexes` in the indexer ledger drops `swaps_coin_block`, `swaps_trader_block`, and `swaps_known_buy_coin_trader`. Migration `0207_raw_history_summaries` in the engines ledger creates outcome summaries and extends the retained-price view. The indexer drops use `DROP INDEX IF EXISTS`. The transfer holder indexes are retained: token/block cannot serve their wallet-and-block probes without scanning the full token prefix.

| Table | Index | Query served |
|---|---|---|
| swaps | `swaps_pkey` | Event identity / deduplication, oldest time selection |
| swaps | `swaps_coin_order` | Coin/block pages, engine activity and ordered trade reads; replaces coin/block prefix |
| swaps | `swaps_coin_ts` | Per-minute bar rebuilding and coin/time windows |
| swaps | `swaps_block_ts` | Block activity, reorgs and bounded backfills |
| swaps | `swaps_pool_block` | Pool reference price at a block |
| swaps | `swaps_tx_log_ts` | Feed / live transaction lookup |
| swaps | `swaps_priced_ts_block_coin` | Cross-coin hourly USD rankings and market windows |
| swaps | `swaps_pending_coin` | Pending sender probes |
| swaps | `swaps_pending_pricing_coin` | Pending pricing probes |
| swaps | `swaps_positive_coin_order` | Covered latest positive-price coin scans, including fast empty results |
| swaps | `swaps_buy_wallet_first` | First buy for a coin/wallet and buyer membership; replaces known-buy prefix |
| swaps | `swaps_fingerprint_wallet_order` | Ordered attributed wallet samples; replaces trader/block prefix |
| swaps | `swaps_unpriced_coin` | Empty / present unpriced-coin checks |
| swaps | `swaps_unpriced_time` | Globally newest unpriced repair candidates |
| swaps | `swaps_feed_trade_window` | Time-bounded large-trade Feed |
| token_transfers | `token_transfers_pkey` | Event identity / deduplication and oldest time selection |
| token_transfers | `token_transfers_block` | Oldest-first deletion and durable block cursor seeks |
| token_transfers | `token_transfers_token_block` | Token movement ranges and baseline compaction |
| token_transfers | `transfers_holder_from_block` | Last outgoing movement of a holder at a historical block |
| token_transfers | `transfers_holder_to_block` | Last incoming movement of a holder at a historical block |

The two unpriced indexes have different leading keys. The positive-price index avoids scanning all seven days for coins without a positive price. The Feed partial index avoids filtering the full raw trade volume. These are deliberate query-specific indexes, not redundant prefixes. Counts from the first hours of a new index do not justify removing it.

## Production prebuild for 0208

Apply chain migration `0208_raw_history_progress` and engines migration `0208_retention_reads`. Both are pinned in migration tests. Existing 0207 migrations are unchanged. Build indexes before deploying: transactional migration runners cannot build them concurrently. An ordinary parent build over 40 million transfers would block writes. These commands use the operator's existing database connection and run outside a transaction:

```sql
-- Full statement for the measured October partition:
CREATE INDEX CONCURRENTLY IF NOT EXISTS token_transfers_2026_10_retention_block ON token_transfers_2026_10(block);
-- Include EVERY attached leaf, including empty future months (the October build above is then a no-op):
SELECT format('CREATE INDEX CONCURRENTLY IF NOT EXISTS %I ON %s(block);',
              c.relname||'_retention_block',p.relid::regclass)
FROM pg_partition_tree('token_transfers') p JOIN pg_class c ON c.oid=p.relid
WHERE p.isleaf ORDER BY p.relid::regclass::text
\gexec
CREATE INDEX IF NOT EXISTS token_transfers_block ON ONLY token_transfers(block);
SELECT format('ALTER INDEX token_transfers_block ATTACH PARTITION %I;',c.relname||'_retention_block')
FROM pg_partition_tree('token_transfers') p JOIN pg_class c ON c.oid=p.relid
WHERE p.isleaf AND NOT EXISTS(
 SELECT 1 FROM pg_inherits i WHERE i.inhparent='token_transfers_block'::regclass
 AND i.inhrelid=to_regclass(quote_ident(c.relname||'_retention_block')))
ORDER BY p.relid::regclass::text
\gexec
CREATE INDEX CONCURRENTLY IF NOT EXISTS verdicts_grade_seek ON verdicts(coin,valid_from_block,id)
WHERE data->>'level' IN ('clear','monitor','danger');
```

The migration's exact parent statement is `CREATE INDEX IF NOT EXISTS token_transfers_block ON token_transfers(block);`. After every leaf is attached, the parent is valid and that statement is a no-op. Future partitions inherit it. The grade seek first selects the earliest qualifying block through its partial index, then sorts only that block's receipt-sequence ties. Verdict candidate coins come from bounded ID primary-key probes; no global DISTINCT is needed. Identity and Feed windows apply LIMIT before eligibility; their cursors advance through retained windows. The preceding-hour clock lookup orders by `(ts DESC,number DESC)` through the existing timestamp index, rather than scanning block numbers backward across an hour.

Projection models, ranks, single-coin card refreshes and retained buyer writes call `read_lock_coins` before their projection writes. It creates and immediately locks each mutex row in sorted bytea coin order before moving to the next key. This avoids a separate unordered insertion phase and does not allocate a heavyweight advisory lock for every coin in a large rank refresh. Raw compaction uses the same helper before freezing bars or inserting buyers. PostgreSQL concurrency regression: `EKO_TEST_POSTGRES_URL` must point to a disposable test database; the test uses and removes an isolated schema. The normal PGlite gate skips that one test because PGlite has only one backend.

Throughput is an estimate until measured on the target server. For EACH raw rule, rows/hour = `3600 * committed_rows_per_pass / pass_seconds`. A planning example with a 115-second pass, 15 seconds per raw rule, 1,000 rows in 0.5 seconds of SQL plus a 0.1-second pause gives about **783,000 rows/hour per rule** (6M swaps: 7.7 hours; 30M transfers: 38.3 hours). This is not a forecast for sparse blocks: a one-row block does not become a 1,000-row transaction. With sparse blocks and a 10 ms transaction per row, the amortized pause adds 0.1 ms/row, giving about **46,500 rows/hour per rule** at the same worst-case duty cycle. Snapshot-only passes remove zero swaps; once caught up, other rules generally consume less than their full budgets. Use the existing per-rule committed-row log and observed pass durations to replace these assumptions. No production timing, 15M/40M-row load test or steady-state catch-up rate was measured offline.

## First deletion and disk reclamation

Apply both migration ledgers through the normal release migration step before enabling deletion. Stop old worker/engine versions first. The two 0207 migrations are registered in the pinned migration tests. Keep the existing backup/archive before the first destructive pass. Complete the existing 0206 projection backfill (`scripts/backfill-watcher-buyers.sql`) before enabling the cap. Wait until deletion catches up (`raw_swaps` and `raw_transfers` report zero removed rows with no timeouts or skipped rules and the pass has `finished=true`); a single bounded pass is not a full deletion. Check age directly using the two time-leading indexes:

```sql
SELECT 'swaps' AS source, min(ts) AS oldest FROM swaps
UNION ALL SELECT 'token_transfers', min(ts) FROM token_transfers;
```

Run the following with `psql` connected to the operator's existing database connection. Run outside a transaction. They enumerate every attached leaf partition and every remaining leaf index, so names are exact even when PostgreSQL generated the child name. Reindex sequentially to limit disk and I/O pressure. Pause the retention worker during maintenance (`RETENTION_ENABLED=false`, restart worker).

```sql
\set ON_ERROR_STOP on
SELECT format('VACUUM (ANALYZE) %I.%I;', n.nspname,c.relname)
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE c.oid IN (SELECT relid FROM pg_partition_tree('swaps') WHERE isleaf
               UNION ALL SELECT relid FROM pg_partition_tree('token_transfers') WHERE isleaf)
ORDER BY c.relname
\gexec

SELECT format('REINDEX INDEX CONCURRENTLY %I.%I;', n.nspname,i.relname)
FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid JOIN pg_namespace n ON n.oid=i.relnamespace
WHERE x.indrelid IN (SELECT relid FROM pg_partition_tree('swaps') WHERE isleaf
                    UNION ALL SELECT relid FROM pg_partition_tree('token_transfers') WHERE isleaf)
ORDER BY x.indrelid::regclass::text,i.relname
\gexec

SELECT c.oid::regclass AS partition,
 pg_size_pretty(pg_relation_size(c.oid)) AS heap,
 pg_size_pretty(pg_indexes_size(c.oid)) AS indexes,
 pg_size_pretty(pg_total_relation_size(c.oid)) AS total
FROM pg_class c
WHERE c.oid IN (SELECT relid FROM pg_partition_tree('swaps') WHERE isleaf
               UNION ALL SELECT relid FROM pg_partition_tree('token_transfers') WHERE isleaf)
ORDER BY c.relname;
```

Ordinary VACUUM makes heap space reusable; it usually does **not** shrink the heap file. Concurrent reindex returns index bloat to the filesystem and temporarily needs room for an additional copy of the index. To return heap space too, schedule a maintenance window, stop ingest and API/engine/worker activity, and run this **instead of** the preceding vacuum/reindex loop. `VACUUM FULL` takes an exclusive lock, rewrites each heap, rebuilds its indexes, and needs spare disk for the rewrite. Do not run it while serving requests.

```sql
\set ON_ERROR_STOP on
SELECT format('VACUUM (FULL, ANALYZE) %I.%I;', n.nspname,c.relname)
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE c.oid IN (SELECT relid FROM pg_partition_tree('swaps') WHERE isleaf
               UNION ALL SELECT relid FROM pg_partition_tree('token_transfers') WHERE isleaf)
ORDER BY c.relname
\gexec
```

Restart ingest, engines, API and the worker after maintenance, retaining `RETENTION_DRY_RUN=false`. Recheck the age, pass logs, heap/index sizes and API latency.

## Capacity estimate

At the supplied 10.7-day measurements, linear live-data estimates after deletion **and compaction/reindex** are:

| Raw table | Rows / retained days | Heap | Kept indexes | Total |
|---|---|---:|---:|---:|
| swaps | About 11.2 million / 7 days | 3.07 GB | 7.78 GB | 10.85 GB |
| token_transfers | Three days of the observed daily transfer rate | 2.38 GB | 3.00 GB | 5.38 GB |
| Combined | | 5.45 GB | 10.78 GB | 16.23 GB |

Swap indexes use `(13.5 - 0.730 - 0.742 - 0.142) × 7 / 10.7` GB. Transfer indexes use `10.7 × 3 / 10.7` GB. Heap estimates use `4.7 × 7 / 10.7` and `8.5 × 3 / 10.7`. These are approximate capacity estimates in the units supplied, not measured post-maintenance sizes. Index fill, changing traffic and the supplied rounded index totals affect them. They exclude TOAST overhead, retained summaries, other tables, WAL, backups and temporary maintenance copies. Without a heap rewrite, budget the existing heap allocation even after ordinary VACUUM: about 13.2 GB of existing heaps plus 10.78 GB of rebuilt indexes, or 23.98 GB for these two raw tables. The whole database still need not fit in 3 GB of shared buffers; measure the frequently read working set and latency after rollout.
