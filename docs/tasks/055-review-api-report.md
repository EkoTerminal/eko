# Task 055 · Immutable independent review API report

Prepared in the worktree, uncommitted and unreleased. Guard V2 remains shadow/inactive. All judgments introduced by this packet are explicitly synthetic test fixtures; real independent human judgments remain an external dependency.

## Source and candidate

Source/base revision: `e209393ba0626cbfc62c588a61148acfbb1137eb` (Guard 054).
Candidate: that revision plus the uncommitted changes below. Candidate content SHA256: `512c8ba8718a4a2fba0d22c98867e04b458068ccbe517b8803a1bb96695e20ba`.
This digest hashes sorted changed/new relative filenames and their bytes, each separated by NUL, excluding this report to avoid self-reference. No candidate commit was created.

## Changed files

- `packages/shared/src/contracts/guard-review.ts`, `packages/shared/src/contracts/index.ts`: closed versioned review contracts, ten review questions, evidence panels, pseudonymous roles, pinned provenance and blinded export schemas. Human retrospective responsibility is separate from machine outcome.
- `packages/db/drizzle/0179_review_api.sql`, `packages/db/src/engines-migrate.ts`: five additive evals-owned append-only tables, with independent account/pseudonym/slot constraints and revision ancestry. Uses reserved migration 0179 only; no server migration needed.
- `packages/db/src/review-store.ts`, `packages/db/src/index.ts`: immutable/idempotent case and label revisions, case-scoped serialization, adjudication against both current labels, role-specific reads and deterministic hashed exports. Public revision IDs exclude hidden scores to prevent score enumeration from their digest.
- `apps/server/src/http/review-api.ts`, `apps/server/src/app.ts`: session-bound internal REST routes, coordinator-only provisioning, origin checks for writes, explicit case assignments for reads and exports. Label writers cannot supply their own reviewer identity or slot.
- `packages/db/package.json`, `pnpm-lock.yaml`: declare the existing workspace Untrusted sanitizer dependency and update its lockfile importer offline.
- `packages/db/test/review-api.test.ts`, `packages/db/test/fixtures/review.ts`, `apps/server/test/review-api.test.ts`: nine synthetic database/HTTP tests for independence, role blindness/reveal, unresolved/disputed/agreed/adjudicated states, preserved original disagreements, stale adjudication, revisions, pinned evidence, malicious text and immutable SQL writes.
- `packages/shared/test/fixtures/contracts/guard-review.ts`, `packages/shared/test/contracts.test.ts`: add valid examples for all 17 new exported schemas to the existing exhaustive contract test.
- `packages/db/test/merge-migrations.test.ts`: extend the migration ledger expectation with 0179 and assert all five tables/triggers across fresh installs, upgrades and idempotent replay. Existing assertions retained.
- `docs/tasks/055-review-api-report.md`: this report.

## API handoff

All routes are under `/v2/review`, require a session, and writes require an allowed origin.

| Route | Behavior |
|---|---|
| `POST /cases` | Coordinator/admin imports a closed pinned case snapshot or appends a revision using `supersedes`. |
| `POST /cases/:caseId/assignments` | Coordinator/admin binds an account UUID to an opaque pseudonym and one case role. Only a hash of the account UUID is stored in review tables. |
| `GET /revisions/:revisionId` | Returns the assigned role's projection of that exact snapshot. |
| `POST /revisions/:revisionId/labels` | Session's assigned reviewer slot submits or appends a label revision. Evidence IDs are mandatory and must belong to the case. |
| `POST /revisions/:revisionId/adjudications` | Assigned adjudicator appends a decision pinned to both current independent label IDs. |
| `GET /cases/:caseId/export` | Ordered case/label/adjudication history with per-revision visibility and a content hash. |

Reviewers remain blinded until their own first submission on that exact case revision, including unresolved submissions. The other reviewer's submission cannot reveal scores or answers to an unsubmitted slot. Adjudicators remain blinded until both slots submit. Explicit evaluator assignments can inspect the complete record; admin status alone does not grant read/export access. New case revisions require new judgments and do not inherit the old revision's reveal permission. Revisions retain old labels and adjudications; a revised label makes an old adjudication historical rather than silently rewriting it.

Exports pin cursor, acquisition availability, identity, machine outcome, method/configuration, dataset and evidence hashes, together with source/candidate revisions, outcome record IDs and benchmark artifact hashes. Snapshot facts use closed typed fields; all narrative text must be sanitized bounded Untrusted text. No request handler acquires chain data, computes benchmarks or changes active verdicts.

## Specification and ambiguity

Followed Guard 2.0 §9.3 (independent slots, evidence, blindness, unresolved labels and adjudication), §2.1 (captured cursor/availability), §7.2 (evals ownership and inactive rollout), and §11 (human dependency); FACTS §7 (shared contracts/session authentication); BACKEND §9.5 (Untrusted text).

`TODO(spec)` in `guard-review.ts`: §9.3 does not specify review DTO vocabulary, route names or assignment provisioning. This packet freezes a closed versioned contract, typed factual panels and coordinator-provisioned session assignments. The rule-author pseudonym is excluded from reviewer/adjudicator slots. Actual human independence and verified provenance of imported snapshots must be established externally; distinct accounts/pseudonyms cannot prove distinct independent people. No existing test was weakened, skipped or deleted. No personal identifiers were added to source, fixtures or this report.

## Checks and reproduction

For this sandbox, commands used `pnpm_config_verify_deps_before_run=false` in their environment. This prevents pnpm's automatic dependency reinstall before scripts; it does not disable application checks. Ordinary scripts are unchanged.

| Exact command (with that environment variable) | Exit/result |
|---|---|
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/db test test/review-api.test.ts` | 0; 6/6 passed. |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/review-api.test.ts` | 0; 3/3 passed. |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/shared test test/contracts.test.ts` | 0; 221/221 passed. |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/db test test/merge-migrations.test.ts` | 0; 3/3 passed. |
| `pnpm typecheck` | 0; complete workspace on final code and fixtures. |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0; all workspace package suites, contract tests, web/server builds and role-image checks passed (including 3,095 package tests). |
| `pnpm brand:check` | 0; 154 files checked, including built artifacts. |
| `pnpm check:addresses` | 0; 455 source files checked. |
| `git diff --check` | 0. |

The first new migration fixture run failed because a semicolon in a SQL comment was split by the existing migration loader; the comment was corrected. Initial comprehensive runs exposed missing examples for the new schemas and the old exact migration ledger expectation. Both were extended, their focused files passed, then the comprehensive gate was restarted. No timeout was raised.

Dependency preparation: `CI=true pnpm install --offline --no-frozen-lockfile` exited 1 because the local store lacks the existing font archive. Installed dependency directories were restored from the local Guard 054 worktree. `pnpm install --offline --no-frozen-lockfile --lockfile-only` exited 0 and updated only the declared workspace importer. A later `pnpm install --offline --frozen-lockfile --lockfile-only` attempted registry access for pnpm supply-chain metadata despite offline mode and was interrupted (130). A clean full frozen install has not been verified in this sandbox; the lead should run it with a complete dependency cache.

Focused reproduction commands above exercise in-memory PGlite and Fastify injection without network ports. Logs: `/tmp/055-db-focused.log`, `/tmp/055-server-focused.log`, `/tmp/055-shared-focused.log`, `/tmp/055-migration-focused.log`, `/tmp/055-typecheck.log`, `/tmp/055-test.log`, `/tmp/055-brand.log`, `/tmp/055-addresses.log`. Dependency logs: `/tmp/055-install.log`, `/tmp/055-lockfile.log`, `/tmp/055-frozen-lockfile.log`.

## Coverage, process and next action

Measured chain cases: 0. Real human judgments: 0. Acquired Guard provider request units: 0; provider pricing not assumed; paid acquisition cost: $0. Registry metadata attempts during the blocked lockfile check are not chain acquisition or benchmark coverage. No paid job, deployment, release, server listener or persistent data run was started.

All validation processes completed; no process is left running. Final comprehensive log: `/tmp/055-test.log`. No acquisition checkpoint is applicable. Next action: the lead can review the uncommitted diff and complete clean-install verification. Packets 056/057/059 own the review page, acquisition/import and real independent label completion. Human assignment, genuine provenance, comparator parity, calibration and release gates remain external/unmeasured.
