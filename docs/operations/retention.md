# Determination retention

The worker now uses the [short raw-history policy](raw-history.md). Its all-coin swap and transfer caps supersede the raw rules below. This page documents compatibility callers and rating retention.

This owner-requested policy replaces BACKEND §3.6's perpetual raw/rating history for the tables below. The specification
files remain unchanged. It extends the existing worker, `history_prunes`, `transfer_baselines`, trending snapshots,
onboarding and scan jobs. It does not add another scheduler or an automatic chain-history download.

## Deployment defaults

| Variable | Default | Meaning |
|---|---:|---|
| `RETENTION_ENABLED` | `true` | Set false to stop scheduled passes and explicit worker ticks. |
| `RETENTION_DRY_RUN` | `true` | Report configured tables with `estimateSkipped=true`, without scanning payloads or mutating data. Zero counts in this mode are placeholders, not eligibility measurements. |
| `RETENTION_SETTLE_HOURS` | `24` | A current card plus no swap or transfer for this long settles a coin, regardless of launchpad or verdict. |
| `RETENTION_RAW_DAYS` | `7` | Compact older rated-coin history even when the coin remains active. Also compact unrated/quote transfers. Reader exceptions below remain. |
| `RETENTION_RATING_DAYS` | `7` | Keep recent rating records and the latest versions, plus the reader/FK boundaries below. |

All five are part of the build identity. Deployment with defaults changes no existing row data. Migration
`0201_determination_retention` belongs to `eko_engine_migrations` and adds summaries, nullable receipt payloads,
retention-specific trigger guards and lookup indexes. The worker runs backlogged passes with a 100 ms pause between passes, then waits ten minutes after catching up. Existing optional
quote-transfer, idle-token, Feed, unknown-pool, Danger and quiet settings remain recognized. Modern settlement/raw
settings supersede the old Danger/quiet rules. A shorter configured quote-transfer window still applies. Unknown-pool
and Feed windows default to the raw and rating windows respectively when their older setting is absent.

Deletion is a separate operational choice: set `RETENTION_DRY_RUN=false` after reviewing reports. No production
cleanup, commit or deployment was performed as part of this change.

## Table and reader boundaries

| Table | Retained | Compacted or removed | Reader setting the boundary |
|---|---|---|---|
| `token_transfers` | Recent rows, pending enrichment inputs, and inputs of an undecided past outcome | Eligible prefixes become exact `(token, holder)` net baselines, never a plain transfer deletion | `apps/engines/src/sources.ts` holdings and graduation, `outcomes.ts` opening holdings, `sell-check-reference.ts` transaction-level tax samples, `apps/server/src/coin-onboarding.ts` attribution |
| `swaps` | At least seven days for compatibility callers, pending attribution/pricing and undecided past horizons | Older prefixes become lifetime statistics, buyer sets and at most 60 trade samples, with whole-minute bars retained | `apps/engines/src/watcher/store.ts` reads configured three-day wallet windows at boundaries up to three days back, `sources.ts` lifetime checks, `apps/server/src/read/pool-liquidity.ts` latest 50/60 trades |
| `liquidity_events` | Pending/deferred attribution and pools shared by two non-quote coins | Quote-pool prefixes become position balances, wallet peaks, launch provider, additions and removal statistics | `apps/engines/src/sources.ts` ownership/pulls/prior removals, `outcomes.ts` pool peaks, `apps/server/src/read/pool-liquidity.ts` range sums |
| `pons_events` | Event kinds other than `launch` and `trade`, and the common pending/outcome exceptions | Launch/trade prefixes become threshold, exact quote reserves, validity and lifetime volume/progress | `apps/engines/src/curve-progress.ts`, `sources.ts`, `apps/server/src/read/pool-liquidity.ts` |
| `coin_cards` | Current `coin_card_latest` target, latest per coin/rules version, and seven days | Older versions deleted | `apps/engines/src/worker.ts` prior-card comparison, `apps/server/src/read/store.ts`, `read/live.ts` |
| `verdicts`, `verdict_events` | Latest canonical per rules version, receipt-sequence-selected current versions, first verdict, first grade at each rules cut, correction/orphaned verdicts, surviving shadow FK targets and legacy verdicts without a publication | Obsolete published verdicts and their created/superseded events deleted after publication payload compaction | `apps/engines/src/worker.ts`, `apps/server/src/read/store.ts`, `pairs.ts`, `grade-outcomes.ts`, `alerts/service.ts`, `packages/db/src/receipt-outbox.ts` legacy references |
| `playbook_matches` | Latest block per coin and seven days | Old detail deleted after retaining first occurrence of each `(coin, rules version, playbook, level)` in `coin_match_lifetime` | `apps/engines/src/outcomes.ts` strongest historical matches and honeypot outcomes, `replay-cache.ts` |
| `guard_shadow_runs` | Latest per coin and seven days | Older shadow detail deleted | `apps/engines/src/shadow-v2.ts` writes this journal, surviving `legacy_verdict_id` references protect their verdict |
| `receipt_publications` | Every identifier, publication sequence, producer, kind, chain, revision, hash, time and compact supersession/call/cohort metadata; latest/current-card payload and seven days | Older engines-verdict `data` and `canonical_payload` become null | `packages/db/src/receipt-outbox.ts` publication/recovery, `receipt-api.ts` proofs, `apps/server/src/read/scoreboard.ts` calls and historical cohorts |
| `receipt_items` | Every immutable leaf/header and all batch/proof/anchor relationships | The matching obsolete engines-verdict payload copy is also dropped | `packages/db/src/receipt-api.ts`, `receipt-outbox.ts`, `receipt-committer.ts` |
| `coin_buyer_firsts`, `coin_unknown_buys` | Original first-buy provenance and per-block unresolved counts | Nothing | `apps/engines/src/watcher/store.ts` exact historical first-buy/rank inputs |
| Forecast/Guard/private receipts and their journals | Original payloads/commitments | Nothing | `apps/server/src/swarm/runner.ts` reads forecast envelopes, `packages/db/src/ghost-reports.ts` and `guard-receipts.ts` read original Guard evidence, MCP uses these readers |
| `wallet_fingerprint_dependencies` | Label-linked runs forever and seven days of other dependencies | Older dependencies of runs that produced no label deleted | `apps/engines/src/watcher/store.ts`, `registry-labels.ts` canonical label checks |
| `read_feed` | First verdict and identity/graduation rows, plus rating-window history | Older verdict/playbook/wash projections deleted by the existing Feed prune | `apps/server/src/read/feed.ts`, `alerts/service.ts`, `read_first_verdict` |
| `pending_pool_events` | Known-pool enrichment inputs and raw-window history | Older still-unknown pool logs deleted by the existing rule | `apps/indexer/src/enrich.ts`, `apps/engines/src/sources.ts` attribution completeness |
| Bars, balances, baselines, tokens, pools, outcomes, deployer statistics, labels, clocks and receipt proof journals | Existing derived/current evidence | Nothing | Charts, current holdings, history and canonical/proof readers |

## Lifetime sufficient statistics

`coin_lifetime` is part of the existing per-coin prune transaction. It contains attributed/missing counts and USD
volumes, unknown-price counts, signed coin flow, curve volume/net progress, exact curve threshold/reserve and validity,
the buyer/recipient set, per-pool trade counts, first/latest/priced trades and a 60-trade tail. It also retains per-actor
cash in/out, sold units and first five sell references, early cohorts' first buy/funder, gross purchases, early/lifetime
sales, funders and attribution completeness. Current cohort holdings come from balances/baselines, not frozen shares.

`coin_buyer_firsts` and `coin_unknown_buys` preserve per-wallet first-buy block/pool/log ordering and unresolved-buy
counts per block. The wallet reader unions these with raw buys and deduplicates trader counts. Quote assets retain
only this wallet provenance and current-balance baselines, rather than full coin-rating statistics.

Liquidity statistics retain each position's original controller and net units, range sums, full-range graduation
liquidity, wallet held/peak units, first provider, latest addition/removal and bounded evidence examples. Prior deployer
removal counts are retained with examples. Opening and pre-graduation holder snapshots retain exact integer balances.
Graduation sells retain per-actor sold units/minimum price and window attribution totals. Grade price summaries retain
entry, horizon close and interval high for each published grade horizon/rules cut before their swaps disappear.

The readers merge the summary with the surviving suffix. A revision check retries a source load if compaction commits
between its queries, and refuses a moving snapshot after two attempts. Stored cards are untouched by raw compaction.
Preserved coins also re-rate after new LP, pool, Pons or exemption activity, without waiting for a trade.
New compaction does not introduce `history_pruned` coverage gaps or manufacture a passing check from unknown inputs.

## Evidence that remains raw

The seven-day raw cap has explicit exceptions, rather than changing a check's meaning:

- Wallet fingerprints now use three-day lookback and refresh windows. The worker’s seven-day swap cap covers their combined span. Buyer order uses retained first-buyer statistics.
- An undecided horizon whose checkpoint is already inside the proposed deletion prefix keeps its inputs. A *future*
  seven-day horizon can use the opening/LP/lifetime summaries, and does not prevent 24-hour settlement.
- A current card must cover the proposed prefix. Activity not yet evaluated is retained, so an engine outage cannot
  freeze an old determination by advancing its prune watermark over unseen events.
- Transaction-level tax samples read the trailing day. Transfers and Pons trades inside that day remain raw even if the settlement
  setting is shorter than 24 hours.
- Pending sender/pricing attribution and known-pool deferred enrichment need transaction-level evidence to resolve
  identities, taxes and ownership. Such rated coins are left alone; pending inputs also exclude unrated compaction.
- Unonboarded liquidity is retained until its first ownership determination. The launchpad/controller interpretation
  and retrospective outcome checkpoints are not yet established, so this version does not compact that evidence.
- Pools shared by two non-quote coins retain their liquidity logs: deleting one side's events would remove the other
  coin's independently ordered LP history. Non-launch/trade Pons events remain for their own specialized readers.
- A minute exceeding the bounded whole-minute swap batch remains raw so its chart cannot be rebuilt from a partial
  minute. It requires a separate operational decision, rather than an unbounded deletion transaction.
- Legacy prunes without lifetime statistics are not upgraded with guessed totals. Their already-deleted deployer,
  bundle/fresh-wallet/exempt-insider, liquidity and graduation evidence cannot be recovered from the retained cards
  alone. Their existing Danger floor/partial reporting remains, and modern compaction leaves those coins alone.
- Forecast and Guard/private receipt envelopes are not truncated. Forecast execution/calibration and Ghost Report/MCP
  evidence readers still require their original bytes. Hashes alone cannot reconstruct those inputs.

No new chain re-read was added. Replay/backfill inside an already-pruned prefix remains unsupported. In particular,
re-inserting compacted transfers on top of their baselines would double-count balances.

<a id="per-coin-history-of-quiet-coins"></a>

## Opening and revival

`read/store.ts` and `read/scan.ts` immediately return `coin_card_latest`. An on-demand scan of a still-settled coin
finishes ready with that card in `apps/engines/src/worker.ts`; it does not download its life again. The indexer's normal
swap/transfer insertion produces activity above `history_prunes`' watermark. Live planning and scan jobs then evaluate
the revived coin, combining lifetime statistics with the new suffix. Uniswap onboarding still uses its existing
per-coin, bounded, metered metadata/first-mint acquisition in `apps/server/src/coin-onboarding.ts`.

Receipt payloads are schema/canonical/hash/snapshot-validated before removal. Corruption rejects the batch. Enqueue
and compaction coordinate with a publication row lock, so recovery cannot reintroduce a full payload after its drop.

Archived receipt lookups retain leaf/hash, Merkle proofs and canonical anchor verification. They do not reveal an
original payload after it has been removed. Supersession references and exact hash-based publication retries remain
valid, and the receipts worker can recover an unconsumed tombstone and commit its original leaf.

## Reports, batches and storage estimates

The JSON pass line retains its existing counters, `finished`, and optional `dryRun`/`tables`. It adds:

- `skippedRules`: rule names when lock/statement failures cannot be recovered or the pass deadline prevents work, with `finished=false`. No SQL or row data is logged.
- `ruleStats`: committed rows, skipped count, timeout attempts and the remembered batch size per rule. Recovered timeouts do not count as skipped rules.
- `ratingRows`: committed row counts (including zero) for receipt publications/items, fingerprint dependencies,
  shadows, cards, matches and verdicts. Receipt counts measure payload archival, not header deletion.
- `tables[].estimateSkipped`: dry-run eligibility/byte estimates were skipped. The accompanying zeros are placeholders.

Dry runs do not count eligible tuples, detoast payloads, or simulate cascading eligibility. The earlier exact-report
assertions were replaced with skipped-estimate and read-only checks. Real mode's table counts still describe committed
work, with `estimatedBytes=0` when bytes were not measured.

Transactions normally process 1,000 candidates, capped at 5,000. Swaps retain complete minutes, bounded to at most
10,000 rows. Every query, including direct reads, has a one-second statement timeout and one-second lock timeout.
Retention transactions disable parallel gather workers and discourage sequential scans/hash/merge joins so bounded
candidate windows use indexed probes. `read_feed` locks selected rows with `SKIP LOCKED` in block/id order. A table-level
lock can still cause a timeout, which skips that rule. Statement timeouts halve that rule's batch size and retry within its original budget, down to 32 rows (or the configured ceiling if smaller).
Sizes persist per database handle across passes and grow by 10% after four successful rule runs without timeouts.
Changing the configured ceiling resets the size. Rating key lists use array predicates rather than expanded VALUES joins,
verdict grade boundaries are computed once per coin/cut in each window, and pending-event deletes use locked physical tuples. Pauses remain 100 ms after batches, including failed batches.

Each rule, including each rating selector and receipt archival, gets six seconds to start batches. The pass has a
115-second deadline, rechecked before each SQL statement with its timeout shortened to the remaining rule/pass duration.
Custom scheduling budgets shorter than one second still allow one normally bounded statement.
Primary-key and token cursors persist across passes in the worker process and wrap on exhaustion. A restart resets
those cursors, without changing deletion eligibility. No cleanup progress is stored in a new persistent table.

Transaction-local `eko.retention` suppresses only retention
DELETE invalidations in read-model and flow/census triggers, leaving insert/update and normal reorg behavior
unchanged. The existing engine-activity trigger keeps its single marker per SQL statement so incremental checksums
still match full-history planning, without per-row invalidation work. Append-only exceptions permit only the intended record deletion or engines-verdict payload nulling with
all immutable identity fields unchanged. Private/Guard payload mutation stays disallowed.

Historical estimate, superseded by [raw-history.md](raw-history.md): if swaps cover the same nine-day interval as the supplied transfer observations, 7.3 GB implies roughly **22.7 GB** for the required 28-day window.
Seven days of transfers is at most **7.5 GB** before settlement savings, plus holder baselines. Recent publication
payloads are roughly **4.5 GB** at that rate, plus latest payloads, receipt-item copies and permanent small headers.
Cards/shadows/Feed are approximately 1.2/1.1/0.9 GB before latest-version and first-row exceptions. The supplied total
leaves about 20 GB in other relations, whose age distribution and removable share are unknown.

Under that age/rate assumption, a reasonable initial envelope is **50–65 GB**, potentially lower with settlement and unlabelled-dependency
cleanup. It is not an honest fixed plateau guarantee: bars, clocks, labels, coin/wallet aggregates, proof headers,
required forecast/Guard evidence and stalled enrichment still grow. An initial database with only nine days of swaps
can grow until day 28 even while cleanup works. Relation statistics and actual relation/TOAST/index sizes are needed to
refine the estimate. Deletions make space reusable through autovacuum; physical bytes need not shrink immediately.

## Verification

Tests cover default dry-run immutability, settled card/read-model/API equality, launchpad and Uniswap revival with
full-history verdict/playbook levels and coverage, future seven-day outcomes, rating/FK/provenance boundaries,
receipt supersession/proof/recovery after payload removal, and retained bars/balances/trending history. Required gates
are typecheck, DB, indexer, engines (two workers), server (two workers), and the documentation surface census.

## Selection access paths

Candidate windows come before eligibility filtering. The dependency selector no longer asks the planner to find
old runs without a run-block index. Receipt archival no longer computes a global `DISTINCT ON` over live payloads.
Raw transfer and swap discovery starts with at most 200 token identities ordered by the token primary key, followed
by indexed existence probes. Windows containing only retained rows still advance their cursor.

| Selection | Access path | Five-second risk after this change |
|---|---|---|
| Fingerprint dependencies | `(run_id,block)` primary-key window, run ID PK, clock number PK, label `run_id` index | Bounded candidates, cold I/O can still time out |
| Shadows | ID PK window, new `(coin,block,recorded_at,id)` successor index | Bounded candidates, cold I/O can still time out |
| Cards | ID PK window, new `(coin,rules_version,valid_from_block,id)`, latest `card_id` index | Bounded candidates, cold I/O can still time out |
| Matches | `(coin,valid_from_block,rules_version,playbook_id)` PK window and per-coin newer-block seek | Bounded candidates, cold I/O can still time out |
| Verdicts | ID PK window, new coin/rules/block/ID successor index, coin/block index, event verdict/kind and shadow FK indexes, receipt ID PK | Many orphan versions or cold I/O can still time out |
| Receipt archival | Existing partial `(recorded_at,id)` live-payload index, ID PK, new partial payload-coin/sequence index | Bounded candidates, payload validation and cold I/O can still time out |
| Receipt items and verdict events | ID PK and `(verdict_id,kind)` | Bounded publication/verdict IDs, cold I/O can still time out |
| Quiet/settled/capped coins | Token address PK, coin/token block indexes, pending partial indexes, pool currency indexes, outcome/card PKs | Many token probes or cold I/O can still time out |
| Transfer compaction | `(token,block)` range, bounded selected tuple IDs | Bounded rows, triggers/holder contention can still time out |
| Lifetime swaps and minute edge | `(coin,ts)` range/limit, then in-memory block/log ordering of the bounded whole-minute prefix | Hot-coin ranges and cold I/O can still time out |
| First post-graduation / pre-graduation swap | `(coin,block)` with ordered limit | Dense blocks can require incremental sorting and time out |
| Pons compaction | `(token,block,log_index,tx_hash)` ordered limit | Bounded rows, cold I/O can still time out |
| Liquidity compaction | Pool currency indexes, lateral per-pool `(pool_id,block)` ordered limits, sort only bounded pool windows | Dense blocks / many pools / cold I/O can still time out |
| Opening and graduation holdings | Token/lifetime PKs, `(token,block)` prefix, baseline `(token,holder)` PK | Wide per-coin prefixes can still time out, transaction rolls back |
| Grade entry/close/high | `(coin,ts)` ranges, coin/block verdict index and clock `(ts,number)` cut seek | Wide per-coin price windows can still time out |
| Trending snapshot discovery / ranking | Small tokens side, snapshot/clock PKs, priced swaps `(ts,block,coin)` covering hourly range | High-volume hours can still time out, swaps stay until snapshots exist |
| Identity, legacy-prune, clock, lifetime, pool, provenance totals | Token/prune/lifetime/clock PKs, pool currency indexes, buyer/unknown-buy coin-leading PKs | Large per-coin provenance totals can still time out |
| Unknown-pool events | `(tx_hash,log_index)` PK window, pool ID PK | Bounded candidates, cold I/O can still time out |
| Feed | `(block,id)` cursor index, first-verdict coin PK, ID PK delete and `SKIP LOCKED` | Retained first rows or table locks can still time out |
| Dry-run reports | Skip estimates entirely | No large-table eligibility queries |

Migration `0202_retention_probe_indexes.sql` is in the engines ledger and its pinned merge-migration test list.
The indexer test pins only the chain ledger, which did not change. The runner applies all engines migrations in one
transaction, so `CREATE INDEX CONCURRENTLY` is not supported. Index construction reads each affected relation,
sorts index entries, writes indexes/WAL, and blocks writes to those tables until the transaction commits. Receipt
expression extraction can read/detoast much of the 11 GB publication table, and card indexing scans the 2.5 GB table.
Allow a maintenance window and temporary disk headroom, with duration measured on the target hardware. No new
index is built over the 11.6M dependency rows: its primary key already supplies the access path, so dependency-index
build cost is zero. There is no production EXPLAIN or timing evidence from this offline change.
