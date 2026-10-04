# Task 112 implementation report

Prepared implementation, uncommitted. Base revision: `7a2d5ecef9374b20005037277c2e443cbf2fcf08`. Candidate manifest SHA-256: `72862c27cb09bb96fbc5bf0b79e22dc4e70f5fb8a2b21721ac45a08fa53327d0` (sorted relative-path/content hashes, excluding this report). **All required final gates passed.** No commit, push, deployment, public publication, external message, network acquisition or paid run was performed. No personal identifiers were added or ported. No dependency or lockfile changes.

Follows Backend §§7.5, 13, 18, 23 CA-15; Frontend §3.8; FACTS §7. Guard 051's simultaneous, versioned outcome labels are consumed as requested; the legacy priority outcome table is not used as a substitute. Guard's oracle, scoring, active version and shadow release gates remain unchanged.

Changed files and behavior:

- `apps/server/src/read/scoreboard.ts`: public append-only projections of confirmed trade miss handoffs and original V1 verdict publications; separate verdict/orphan corrections, reviewed refusal proofs, post-mortem annotations, accepted mature outcome grades and weekly cohort snapshots. Account, calldata, private incident payloads and journal data are not projected. Independent account-bound token-restriction proofs are required for refusal rows; informational denials, provider errors, scans and incident drafts do not count. Misses require confirmed buys, measured post-fill failures, exact account/amount/transaction binding and canonical block evidence. Reorgs append counter retractions; post-mortems and verdict corrections retain original rows. Outcome withdrawal appends unavailable grade/cohort corrections without changing receipts.
- `apps/server/src/http/v1/reads.ts`, `apps/server/src/app.ts`: register public `GET /v1/scoreboard?kind&cursor&limit`, following the repository's versioned REST convention. Default kind is `calls`; limit is 1–100, default 50. Invalid kinds, cursors, limits and unknown query fields refuse with 422. Kind-bound pagination pins an append sequence and observation time. Writers and readers serialize publication so concurrent additions cannot appear behind an existing cursor. Milestones use the existing public phase and remain unavailable before D0; they remain explicitly unaccepted after D0 until their producer is accepted. Forecasts are typed unavailable pending 106.
- `packages/shared/src/contracts/scoreboard.ts`, `packages/shared/src/contracts/index.ts`: additive response schema with existing row kinds, nullable counters, per-metric availability and snapshot boundary. Covered empty monitoring can report zero with its actual observation start; absent, stale or disjoint coverage stays unavailable. Each observed counter retains its own start when the two monitoring periods differ.
- `apps/server/drizzle/0044_scoreboard.sql`, `apps/server/drizzle/meta/{0044_snapshot.json,_journal.json}`, `apps/server/src/db/schema.ts`: only reserved server migration 0044; immutable redacted scoreboard records with unique source identity, append sequence and database enforcement against updates/deletes. No packages/db migration was needed. Snapshot ancestry follows this candidate's 0031 predecessor; parallel integration must retain coherent ancestry and increasing journal timestamps.
- `apps/server/test/scoreboard-api.test.ts`: ten synthetic integration tests for unavailable/covered empty states, measured miss handoff, post-mortem correction, duplicate consumption, denied/unavailable acquisition, positive reviewed refusal, immutable receipts, immature and fixture rejection, accepted mature grades, censored/immature/ungraded cohorts, point-in-time Clear membership, empty cohorts, source corrections/reorgs, coverage gaps and snapshot pagination under later arrivals.
- `apps/server/test/harness-migrations.test.ts`: extends existing ledger expectations to include 0044 and retains all prior preservation checks; adds snapshot ancestry and a 0031→0044 upgrade/idempotence/immutability test.
- `packages/shared/test/contracts.test.ts`, `packages/shared/test/fixtures/contracts/scoreboard.ts`: adds the new response to the existing exhaustive valid/malformed contract-fixture gate. No tests were removed, skipped or weakened; no timeout was raised.

Grades and cohorts:

The trusted host must explicitly accept an existing canonical, mature, measured 051 revision using review evidence IDs. Fixture-origin and provisional revisions are rejected. Mature censored revisions remain censored rather than being filled with legacy labels. The 24-hour receipt comparison uses original launch-time decisions, confirmed adverse facts or complete survival, and a separate `n/a` row where the comparison cannot be assessed. Original receipt bytes are untouched.

Weekly snapshots use every indexed launch in a reviewed UTC-week universe at the supplied availability cut. The Clear subset uses the first original verdict publication available by launch+60 seconds; later Clear calls, corrections and future publications cannot add members. Cohorts expose eligible, evaluated, censored, immature and ungraded counts, version/cut identifiers and membership hashes. Rug rate has its own confirmed-label denominator; the median uses independently executed terminal $100 benchmark amounts retained by 051 and exposes its return denominator. Unsupported outcomes do not produce invented returns. Empty denominators explicitly mark those metrics unavailable. Existing cohort snapshots are immutable; a later reviewed cut produces a new snapshot.

Verification and reproduction:

| Exact command | Exit | Evidence |
|---|---:|---|
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server exec vitest run test/scoreboard-api.test.ts test/harness-migrations.test.ts test/trade-reconcile.test.ts` | 0 | 44 tests, 3 files; `/tmp/eko-112-focused-stable.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/shared exec vitest run test/contracts.test.ts` | 0 | 223 tests; `/tmp/eko-112-shared-focused.log` |
| `pnpm typecheck` | 0 | `/tmp/eko-112-typecheck-final.log` |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | `/tmp/eko-112-test-final.log`; includes all workspace suites and role-image builds/verification |
| `pnpm brand:check` | 0 | `/tmp/eko-112-brand-final.log` |
| `pnpm check:addresses` | 0 | `/tmp/eko-112-addresses-final.log` |
| `git diff --check` | 0 | Whitespace check |

Development checks: initial focused tests exited 1 on numeric PGlite pagination boundaries and a synthetic receipt snapshot hash; both were corrected. The next focused run exited 1 on median floating-point arithmetic; the calculation was corrected. The first combined focused run exited 1 because older migration tests still expected the pre-0044 ledger length; expectations were extended to the new exact ledger without dropping preservation assertions. The stable focused run passed. An early test-file typecheck exited 2 on a missing fixture import and the fixture account field, both corrected. The first full gate exited 1 because the shared contract suite lacked a sample for the new response schema; adding the sample made the isolated 223-test file pass. This partial run is not claimed as full verification.

Every new `TODO(spec)`:

1. CA-15 has no unavailable counter wire shape. Keep its keys with nullable values and explicit availability instead of fabricated zeros.
2. Coverage acquisition is unspecified. Trusted host `recordCoverage` accepts reviewed measured intervals and evidence IDs; process boot and first incident do not establish observation start. Gaps/stale ends remain unavailable.
3. The current quote contract has no measured-refusal envelope. Trusted host `recordRefusal` binds an independent, reproduced, resolved token restriction to the original refused buy quote, account, guard receipt reference and canonical state. A deny check alone cannot count.
4. Hit/miss mapping is unspecified. Use the 24-hour launch horizon: Danger versus confirmed adverse, Clear versus complete survival; Monitor/pending and unassessable outcomes are `n/a`. Decisions recorded after the entry cut are not retroactively scored against an earlier launch window.
5. Weekly comparison details are unspecified. Use UTC Monday weeks, original launch+60-second membership, a 24-hour $100 executable net benchmark, explicit denominators/censoring and a reviewed all-launch coverage attestation.

Remaining dependencies and handoff:

- 106 owns forecast grading; no forecast grade is enabled here.
- Production acquisition/monitoring and independent review must supply accepted coverage intervals, account-bound refusal proofs, mature 051 revisions and weekly universe evidence through the trusted service methods. No public write/approval endpoint is added. Default empty databases correctly remain unavailable. 051's source fidelity, calibration and live acceptance requirements are not established by these tests.
- 081 owns receipt anchoring/verification. These rows preserve original receipt references and never imply registry acceptance or rewrite receipt payloads.
- Post-mortem content is separate incident work. Until the trusted host calls `attachPostMortem` with a first-party path and review evidence, the missed row explicitly says its post-mortem is pending. This packet does not fabricate a published link.
- D0 milestone acquisition remains unaccepted. The read response exposes its stage and unavailable state; it does not synthesize lock/buy rows.

Trusted reproduction: call `recordCoverage` with accepted measured intervals; `recordRefusal` with a retained refused quote and independent proof; `acceptOutcome(streamId, cut, evidenceIds)` for a mature 051 revision; `publishCohort` with the closed week, canonical known-at cut, outcome/identity versions and reviewed launch-universe evidence. GET consumes the durable 076 miss handoff and verdict corrections idempotently. Later source invalidation retains original rows and appends corrections. Tests reproduce all of this offline with synthetic envelopes.

Cost/coverage: **0 upstream requests and $0 paid cost**. All evidence here is synthetic normalized input plus local PGlite migrations/transactions and fixture HTTP injection. Fixture envelopes deliberately exercise the `measured` discriminant; they are not measured-chain observations or independent reviewer judgments. No live monitoring coverage, calibration, release approval or deployment is claimed.

Checkpoint: `/tmp/eko-112-checkpoint.json`. Candidate manifest: `/tmp/eko-112-candidate.json`. All gate processes ended. Full test log: `/tmp/eko-112-test-final.log`; typecheck log: `/tmp/eko-112-typecheck-final.log`. Next action: lead reviews the uncommitted scoped diff and integrates 0044 with parallel migration ancestry. Production acquisition/review and stage acceptance remain separate work. Logs normalize workspace/home paths to neutral placeholders.

Final full gate elapsed time: 436.26 seconds. Final typecheck elapsed time: 66.53 seconds. No timing failures occurred in the successful full run, and no timeout adjustment or test weakening was required.

Integration note: reserved migration `0044_scoreboard` retained its number (no renumbering was needed). At integration, it was appended after `0043_oauth_tokens` at idx 25, with `when` 1790970577354 (previous entry + 1). Its snapshot received a fresh UUID v4 and was chained from 0043, preserving every prior table and metadata field plus only `scoreboard_records`. The migration harness retains all prior assertion blocks and adds the 0043→0044 upgrade and preservation checks. Branch verification above describes the original candidate; integration verification is reported separately.

Integration verification (file-only merge resolution):

| Exact command | Exit | Result |
|---|---:|---|
| `git diff --check` | 0 | No whitespace errors |
| `rg -n '^<<<<<<<' --glob '!node_modules/**' --glob '!.git/**' .` | 1 | No conflict-marker matches (expected grep exit) |
| Local journal/snapshot preservation assertions | 0 | Existing journal entries unchanged; 0044 adds only scoreboard records to 0043 |
| `pnpm_config_verify_deps_before_run=warn pnpm typecheck` | 0 | All workspace typechecks passed |
| `pnpm_config_verify_deps_before_run=warn VITEST_MAX_WORKERS=2 pnpm --filter @eko/shared test` | 0 | 383 tests, 12 files passed |
| `pnpm_config_verify_deps_before_run=warn VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/harness-migrations.test.ts test/scoreboard-api.test.ts test/census-eval-cli.test.ts` | 0 | 31 tests, 3 files passed |
| `pnpm_config_verify_deps_before_run=warn VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test` | 0 | 559 tests, 59 files passed |

Initial plain typecheck/server/shared commands each exited 1 before checks started because pnpm attempted an automatic reinstall without a TTY. With the per-command warning override, the first typecheck exited 2 and server suite exited 1 because the pre-existing local `packages/db/node_modules/@eko/untrusted` workspace link was missing. Restoring that already-declared workspace dependency link resolved both; no dependency declaration, lockfile, network installation, persistent configuration, test assertion or timeout changed. Shared tests had already passed and were not repeated. Final logs: `/tmp/eko-int-112-typecheck-final.log`, `/tmp/eko-int-112-shared-existing.log`, `/tmp/eko-int-112-focused.log`, `/tmp/eko-int-112-server-final.log`.

All five conflicted files were resolved by preserving both sides' additive intent: existing schema tables, contract exports, contract samples, and every prior harness assertion block remain. Git metadata was not modified; the lead must stage the resolutions and commit. Root `pnpm test` was deliberately not run, per the integration instruction; its final gate remains unverified here. No new spec ambiguity was introduced, and `docs/eko/` was untouched.
