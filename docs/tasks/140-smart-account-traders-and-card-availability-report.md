# Task 140 implementation report

Base: `3eccccc670fdb4052d68c762c77d69616abb244d` (`fix-backfill-ts`). Candidate: uncommitted worktree. Source/test/migration SHA-256: `bd6e647cd365379b9967c510b41a96825a93364470646936ef209f3ccc25bc41` (sorted relative paths and contents, NUL-separated; report excluded). No dependencies, lockfile changes, indexer migration, live requests, trace acquisition, deployment, or commits.

## Files and behavior

- `apps/indexer/src/receipt-actors.ts`, `wallet-protocol.ts`, `types.ts`: receipt-only holder actors and retained protocol evidence. `receipt-actors.test.ts` and `wallet-protocol.test.ts` cover the pure mapper and collector.
- `apps/indexer/src/enrich.ts`, `rows.ts`: sender enrichment also selects null actors whose pending marker is already cleared; completed unresolved attempts retain a method/registry revision per log, so unchanged gaps stay idle and a new EntryPoint mapping retries them; canonical re-decoding can fill missing actors without overwriting attributed rows or raw trade amounts. `apps/indexer/test/log-head.test.ts` checks backfill/live actor and role-evidence parity, sender enrichment, and re-decoding.
- `apps/engines/src/attribution-coverage.ts`, `aggregates.ts`, `sources.ts`, `replay-cache.ts`: nullable actors, separate market and actor lanes, incremental lifetime gap totals, window coverage, and unavailable-source diagnostics. All swaps still contribute to price, volume and curve progress. Null/pending actors never enter actor buckets, buy totals, insider sells or LP ownership.
- `apps/engines/src/card.ts`, `receipt.ts`, `worker.ts`, `activity.ts`: expose and receipt the coverage gaps, name incomplete checks, hash actor/pending changes into activity revisions, and refresh a revised coin at an already-evaluated live head. Scheduling rows update; earlier cards and published verdicts remain retained.
- `apps/engines/src/outcomes.ts`: nullable-actor handling; incomplete attribution cannot newly produce a `survived` history label. Independently observed adverse outcomes remain available with coverage attached.
- `apps/engines/test/engines.test.ts`, `attribution-coverage.test.ts`: small/large gaps, current price and volume, cached/uncached parity, the early-swap freeze regression, same-head enrichment, diagnostics, exact threshold edges, unknown volume and actor-window eviction.
- `packages/shared/src/contracts/coin.ts`, `labels.ts`, `packages/shared/test/contracts.test.ts`: additive coverage schema and preservation through card and flow parsing, including the required exported-schema fixture.
- `packages/db/drizzle/0147_card_availability.sql`, `packages/db/src/engines-migrate.ts`, `engines-schema.ts`, `packages/db/test/merge-migrations.test.ts`: engines-owned failure counters and unique `(coin, valid_from_block, rules_version, hash)` card revisions. Migration 0147 is registered only in the engines ledger. No existing card rows are deleted.

The inherited verified EntryPoint registry also required an offline fixture update in `packages/chain/test/verify.test.ts`: synthetic code for the three newly resolved entries, exact code-row count 17 (previously 14), and explicit positive checks for all three EntryPoints. Production verification and captured chain fixtures are unchanged. The focused 19 verification tests pass; this corrects the eight failures seen on the base branch's stale fixture during the serial gate.

## Attribution rule and ambiguity

For a transaction whose `to` is a resolved EntryPoint v0.6/v0.7/v0.8 in the verified registry, use a complete acquired receipt. Sort logs numerically. Exactly one `BeforeExecution` opens the first segment; each `UserOperationEvent` closes its operation segment. Execution logs strictly between consecutive boundaries receive that successful operation's `sender` and account class `erc4337`. The terminal events themselves, validation logs before the marker, and logs after the last event remain unattributed.

`wallet_protocol_coverage.data.holderAttribution` retains method `receipt-log-brackets-1`, a `mappingRevision` hash of the method and resolved EntryPoint registry, per-log `sender`, `accountClass`, `operationHash`, `bundler`, `paymaster`, and named gaps. A zero paymaster is stored as no sponsorship. The bundler and paymaster are separate roles, never substituted for a missing sender. `userops` retains registry-verified events independently of principal binding.

Named rejection cases: `unverified_entry_point`, `missing_complete_receipt`, `failed_transaction`, `duplicate_log_index`, `nested_or_unknown_entry_point`, `before_execution_count_mismatch`, `malformed_before_execution`, `user_operation_event_count_mismatch`, `duplicate_user_operation_event`, and `malformed_or_unsupported_user_operation`. Acquired full transaction calldata additionally checks operation count and ordered sender/nonce; scoped receipts use the marker/event brackets without extra calls. Failed operations and logs outside successful brackets have `outside_successful_user_operation`; externally called delegated accounts still require their execution binding.

Receipt evidence does **not** populate 043's principal bindings, launch roles, ownership/control graph, or bundle claims. Existing supplied 043 trace bindings remain separate and take precedence when available. Guard §2.2's complex principal/control requirements are unchanged; this packet adds the narrower holder actor described by BACKEND §4.4.

## Coverage and availability

`LoadedSources.attributionCoverage` is retained in deterministic receipt inputs. Cards and flow responses expose named checks under `meta.<section>.coverageGaps`:

- Supply: `holder_concentration`, `bundles`, `fresh_wallet_share`.
- Flow: `wallet_flow`, `wash_trading`.
- Playbooks: `insider_sells`, `deployer_sells`, `exempt_insiders`, `wash_trading`.
- Liquidity: `liquidity_ownership`.

Each gap carries `reason`, `window`, `status`, `threshold`, `totalCount`, `unattributedCount`, `countShare`, `totalVolumeUsd`, `unattributedVolumeUsd`, `volumeShare`, and `unknownVolumeCount`. USD sums cover priced rows; the unknown-volume count explicitly qualifies missing USD. Liquidity has null USD quantities, rather than invented valuations. Existing holder-address balances and supply remain chain facts; receipt actors do not turn holder concentration into a control-group concentration claim. Existing unsupported bundles/freshness/label-flow fields remain unavailable.

**Threshold:** more than 5% unattributed count **or** known USD volume makes the dependent check `incomplete`; missing USD on any unattributed trade also makes it incomplete. Exactly 5% is permitted but still carries a named gap. Hourly flow/wash uses `(T-3600,T]`; lifetime checks use launch through checkpoint; graduation sells use the existing graduation through five-minute window. LP ownership requires zero missing/deferred actors, since position-unit gaps have no comparable USD denominator. Large gaps withhold dependent rule inputs, add `attribution_incomplete` section flags and a `Not fully checked` verdict reason, and cannot yield a clear verdict. Independent market data continues updating.

`engine_card_failures` stores `coin`, cumulative `attempts`, `last_block`, and fixed `reason` (`missing_launch_identity`, `launch_after_checkpoint`, `missing_block_clock`, or `source_load_failed`). Worker telemetry also exposes `cardFailures`. Existing evaluated checkpoints remain idempotent skips; unavailable source attempts are recorded rather than silently discarded.

New `TODO(spec)`: `attribution-coverage.ts` documents the conservative 5% count/volume threshold because the cited spec has no receipt-attribution threshold. Existing unrelated TODOs remain. Follows BACKEND §§4.3–4.4, 5.1–5.2, 6.5; Guard §§2.1–2.2, 3.1, 5.3 and 8. No edits to `docs/eko/` or the Guard design.

## Verification

Final-candidate typecheck, brand, address and whitespace checks passed. `PNPM_CONFIG_WORKSPACE_CONCURRENCY=1 VITEST_MAX_WORKERS=1 pnpm test` completed with exit 0: all 2,725 Vitest tests passed, plus 33 offline Solidity tests. The existing RPC-dependent fork test was skipped because `RPC_HTTP_URL` is unset; no live fork verification is claimed. The root gate also built web/server and passed the role-image fixture checks without ports or provider calls. Local `pnpm config get workspace-concurrency` showed the older `npm_config_workspace_concurrency` variable is ignored by this pnpm version, while `PNPM_CONFIG_WORKSPACE_CONCURRENCY=1` resolves to `1`.

| Command | Exit | Result |
|---|---:|---|
| `PNPM_CONFIG_WORKSPACE_CONCURRENCY=1 VITEST_MAX_WORKERS=1 pnpm test` | 0 | Full workspace and role-image gate; `/tmp/eko-140-test-final.log` |
| `pnpm typecheck` | 0 | All workspace typechecks; `/tmp/eko-140-typecheck-final.log` |
| `pnpm --filter @eko/db typecheck` | 0 | Final migration-test refinement; `/tmp/eko-140-db-typecheck.log` |
| `pnpm brand:check` | 0 | 36 files; `/tmp/eko-140-brand-final.log` |
| `pnpm check:addresses` | 0 | 407 source files; `/tmp/eko-140-addresses-final.log` |
| `git diff --check` | 0 | No whitespace errors |
| `pnpm --filter @eko/db test test/merge-migrations.test.ts --maxWorkers=1` | 0 | 3 fresh/upgrade/idempotence tests; `/tmp/eko-140-migrations.log` |
| `pnpm --filter @eko/policy test test/performance.test.ts --maxWorkers=1` | 0 | Existing unchanged performance assertion passes in isolation; `/tmp/eko-140-policy-repro.log` |

Completed focused evidence:

| Command | Exit | Result |
|---|---:|---|
| `pnpm --filter @eko/indexer test test/receipt-actors.test.ts test/wallet-protocol.test.ts --maxWorkers=1` | 0 | 14 tests |
| `pnpm --filter @eko/indexer test test/log-head.test.ts -t 'keeps non-Pons senders pending in head\|attributes smart-account' --maxWorkers=1` | 0 | 2 selected idempotence/parity/enrichment tests, including retry after a registry change |
| `pnpm --filter @eko/engines test test/attribution-coverage.test.ts --maxWorkers=1` | 0 | 3 coverage tests |
| `pnpm --filter @eko/engines test test/engines.test.ts -t 'raw same-block revisions\|unchanged head\|reports distinct\|replays 1.0.0' --maxWorkers=1` | 0 | 4 selected regressions |
| `pnpm --filter @eko/shared test test/contracts.test.ts --maxWorkers=1` | 0 | 199 contract tests |

Earlier failed iterations are not passing evidence: the first engine run exposed the same-block unique constraint and an additive telemetry shape (corrected by preserving the summary shape); parity fixture diagnosis exposed missing required worker options and a flush outside a transaction (both corrected in the fixture); the first comprehensive run stopped at the missing exported-schema sample (added and focused-tested), the next stopped at the exact migration-ledger expectation (updated with 0147 and upgrade retention assertions), and the subsequent concurrent run failed unchanged policy performance with p95 60.4 ms against its 30 ms limit. That performance test passed in isolation; the final gate uses the verified pnpm concurrency setting. A later serial gate passed all 219 engines and 216 chain tests, then exposed one indexer idempotence regression (134/135 passed): unresolved delegated actors were retried on every enrichment request. Recording the method/registry revision fixes that behavior while permitting newly verified EntryPoints to retry; both the existing idempotence test and the new registry-change fixture pass. The final root gate passed on that stable candidate, including all 219 engines, 135 indexer, 216 chain, 294 server and 24 MCP tests. The old freeze test was replaced with assertions for the packet's new behavior. No existing assertions were weakened, package timeouts raised, or tests disabled. Selected diagnostic runs naturally excluded unrelated tests; they are not claimed as complete suites.

No personal identifiers or real secrets were added or ported. All new acceptance data is synthetic and offline. Lead review/commit and applying migration 0147 in the engines role remain the handoff; no commit or deployment was attempted.
