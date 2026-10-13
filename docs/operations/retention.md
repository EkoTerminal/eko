# Determination retention

This owner-requested policy replaces BACKEND §3.6's perpetual raw/rating history for the tables below. The specification
files remain unchanged. It extends the existing worker, `history_prunes`, `transfer_baselines`, trending snapshots,
onboarding and scan jobs. It does not add another scheduler or an automatic chain-history download.

## Deployment defaults

| Variable | Default | Meaning |
|---|---:|---|
| `RETENTION_DRY_RUN` | `true` | Report eligible rows and estimated tuple/payload bytes, without deleting, updating payloads, creating baselines or saving snapshots. Applies to the older retention rules too. |
| `RETENTION_SETTLE_HOURS` | `24` | A current card plus no swap or transfer for this long settles a coin, regardless of launchpad or verdict. |
| `RETENTION_RAW_DAYS` | `7` | Compact older rated-coin history even when the coin remains active. Also compact unrated/quote transfers. Reader exceptions below remain. |
| `RETENTION_RATING_DAYS` | `7` | Keep recent rating records and the latest versions, plus the reader/FK boundaries below. |

All four are part of the build identity. Deployment with defaults changes no existing row data. Migration
`0201_determination_retention` belongs to `eko_engine_migrations` and adds summaries, nullable receipt payloads,
retention-specific trigger guards and lookup indexes. The worker still ticks every ten minutes. Existing optional
quote-transfer, idle-token, Feed, unknown-pool, Danger and quiet settings remain recognized. Modern settlement/raw
settings supersede the old Danger/quiet rules. A shorter configured quote-transfer window still applies. Unknown-pool
and Feed windows default to the raw and rating windows respectively when their older setting is absent.

Deletion is a separate operational choice: set `RETENTION_DRY_RUN=false` after reviewing reports. No production
cleanup, commit or deployment was performed as part of this change.

## Table and reader boundaries

| Table | Retained | Compacted or removed | Reader setting the boundary |
|---|---|---|---|
| `token_transfers` | Recent rows, pending enrichment inputs, and inputs of an undecided past outcome | Eligible prefixes become exact `(token, holder)` net baselines, never a plain transfer deletion | `apps/engines/src/sources.ts` holdings and graduation, `outcomes.ts` opening holdings, `sell-check-reference.ts` transaction-level tax samples, `apps/server/src/coin-onboarding.ts` attribution |
| `swaps` | At least 28 days, pending attribution/pricing and undecided past horizons | Older prefixes become lifetime statistics, buyer sets and at most 60 trade samples, with whole-minute bars retained | `apps/engines/src/watcher/store.ts` reads 14-day wallet windows at boundaries up to 14 days back, `sources.ts` lifetime checks, `apps/server/src/read/pool-liquidity.ts` latest 50/60 trades |
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

- Wallet fingerprints require ordered cross-coin 28-day swap evidence, including buy ordering. Per-coin lifetime totals
  cannot reconstruct these overlapping point-in-time windows, so those swaps remain raw for 28 days.
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

A worker report contains one line per eligible table, for example:

```text
retention dry_run=true table=swaps rows=1200 estimated_bytes=640000
```

Rows are policy candidates, including later deletion of unreferenced parents after their eligible children/payloads.
Bytes estimate stored tuple or payload-column widths, not index space, total WAL or instant filesystem reclamation.
Settlement and cap reports deduplicate the same coin/table prefix. Real passes report deleted rows; a zero byte
estimate in a real pass means bytes were not measured.

Transactions normally process 1,000 rows, capped at 5,000. Swaps retain complete minutes, bounded to at most 10,000
rows. Transactions use a one-second lock timeout, five-second statement timeout and 100 ms pause between batches.
Each rule stops starting batches after roughly a minute. Transaction-local `eko.retention` suppresses only retention
DELETE invalidations in read-model and flow/census triggers, leaving insert/update and normal reorg behavior
unchanged. The existing engine-activity trigger keeps its single marker per SQL statement so incremental checksums
still match full-history planning, without per-row invalidation work. Append-only exceptions permit only the intended record deletion or engines-verdict payload nulling with
all immutable identity fields unchanged. Private/Guard payload mutation stays disallowed.

If swaps cover the same nine-day interval as the supplied transfer observations, 7.3 GB implies roughly **22.7 GB** for the required 28-day window.
Seven days of transfers is at most **7.5 GB** before settlement savings, plus holder baselines. Recent publication
payloads are roughly **4.5 GB** at that rate, plus latest payloads, receipt-item copies and permanent small headers.
Cards/shadows/Feed are approximately 1.2/1.1/0.9 GB before latest-version and first-row exceptions. The supplied total
leaves about 20 GB in other relations, whose age distribution and removable share are unknown.

Under that age/rate assumption, a reasonable initial envelope is **50–65 GB**, potentially lower with settlement and unlabelled-dependency
cleanup. It is not an honest fixed plateau guarantee: bars, clocks, labels, coin/wallet aggregates, proof headers,
required forecast/Guard evidence and stalled enrichment still grow. An initial database with only nine days of swaps
can grow until day 28 even while cleanup works. Dry-run counts and actual relation/TOAST/index sizes are needed to
refine the estimate. Deletions make space reusable through autovacuum; physical bytes need not shrink immediately.

## Verification

Tests cover default dry-run immutability, settled card/read-model/API equality, launchpad and Uniswap revival with
full-history verdict/playbook levels and coverage, future seven-day outcomes, rating/FK/provenance boundaries,
receipt supersession/proof/recovery after payload removal, and retained bars/balances/trending history. Required gates
are typecheck, DB, indexer, engines (two workers), server (two workers), and the documentation surface census.
