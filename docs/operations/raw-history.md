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

Every identity is eligible, including active, quote, unrated, unknown and pending coins. Each rule selects the oldest raw timestamp/block first across all coins, drains that block in bounded batches, and advances. The existing adaptive control starts at 1,000 rows, halves on statement timeouts down to 32, grows after four successes, pauses 100 ms between batches, and limits each rule to six seconds and each pass to 115 seconds. Backlogged passes continue after a 100 ms pause. A coin with a dense minute does not strand that minute. Complete minute bars are frozen before partial-minute deletions. No new estimate scans of the raw tables run.

Swaps run first, after launch trending snapshots and completed grade-price samples are saved. Each deleted batch first writes lifetime facts, per-pool last prices, first buyers, unresolved-buy counts and the three outcome checkpoint summaries. Transfers run second, after opening, graduation and outcome holder snapshots, and fold exact signed integer movements into `transfer_baselines` in the same transaction as deletion. Pass logs include `rule`, `rows`, `skipped`, `timeouts` and `batch_rows`. A timed-out batch rolls back its summaries and deletions together.

Deletion and rollback share table locks. The cap retains complete boundary minutes. Reorgs inside the retained raw window rebuild balances, bars and rating prices as before. Inserts attempting to replay compacted raw blocks also fail to prevent double-counting summaries. A rollback crossing a compacted watermark or frozen minute fails explicitly and requires restoring pre-compaction archive evidence. Never continue such a rollback by clearing its watermark. Previously deleted legacy history cannot be reconstructed and remains explicitly incomplete. Previously incomplete sender or price evidence remains incomplete in summaries, and old pending rows cease to be enrichment candidates.

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
| token_transfers | `token_transfers_token_block` | Token movement ranges and baseline compaction |
| token_transfers | `transfers_holder_from_block` | Last outgoing movement of a holder at a historical block |
| token_transfers | `transfers_holder_to_block` | Last incoming movement of a holder at a historical block |

The two unpriced indexes have different leading keys. The positive-price index avoids scanning all seven days for coins without a positive price. The Feed partial index avoids filtering the full raw trade volume. These are deliberate query-specific indexes, not redundant prefixes. Counts from the first hours of a new index do not justify removing it.

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
