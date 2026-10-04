# Task 118 implementation report

Candidate: base `317dc6032d9fd9fe3d2a497cdf5600910bc7f93e` plus the uncommitted task-118 working-tree changes. Source fingerprint (SHA-256 of sorted changed source paths and bytes, excluding this report): `772c8560cd21d4d3128ce521e4bb40a6f9fdab4aac05cdb30ff7d750733d6542`. No commit, push, deployment, publication, social message, paid run or real fact approval was performed.

## Changes

- `packages/shared/src/contracts/ghost-reports.ts`, `packages/shared/src/contracts/index.ts`: strict additive report/review/record contracts and deterministic plain-text share drafts using the existing Guard reason adapter. Missing checks/evidence and receipt-anchor status remain explicit. Identity collisions and exemptions never imply shared control or wrongdoing. Raw source text and personal-attribution fields are excluded.
- `packages/db/src/ghost-reports.ts`, `packages/db/src/index.ts`: internal preparation from persisted token-wide Guard receipts and captured, content-hash-validated engine evidence. Immutable drafts retain the original assessment. Fact approvals are separate immutable records. New assessments and invalidated dependencies require corrections; reviewed correction links preserve the predecessor.
- `packages/db/drizzle/0142_ghost_reports.sql`, `packages/db/src/engines-migrate.ts`: reserved migration 0142 adds draft/review tables, foreign keys, indexes and immutable triggers. No dependency or lockfile change.
- `apps/server/src/http/ghost-reports.ts`, `apps/server/src/app.ts`: reviewed-only list/detail/share reads under `/v2/ghost-reports`, with no-store caching. Verified status additionally requires complete checks and CA-16 canonical, revealed receipt binding. No public preparation or approval endpoint.
- `apps/server/src/ops/ghost-reports-cli.ts`: local pre-release draft preparation from an existing receipt; no acquisition, approval or posting.
- `apps/web/src/components/GhostReports.tsx`, `apps/web/src/pages/terminal/Radar.tsx`, `apps/web/src/pages/terminal/Feed.tsx`: Radar and Feed show reviewed records, full evidence/coverage/corrections, receipt links, disclaimers and refresh/error states. Removed Radar's hard-coded demo incident strip.
- Tests: `packages/shared/test/ghost-reports.test.ts`, `packages/shared/test/fixtures/contracts/ghost-reports.ts`, `packages/shared/test/contracts.test.ts`, `apps/server/test/ghost-reports.test.ts`, `apps/web/src/components/GhostReports.test.tsx`, `packages/db/test/merge-migrations.test.ts`. The existing migration-union expectation now includes 0142 and asserts both new tables/triggers; no assertion was removed or weakened.

Spec followed: 02-MARKETING §§04–05 and §07 Ghost Report; 05-GO-PLAN §7 Oct 2–3; 03-FRONTEND §§3.2–3.3; Guard 2.0 §§6–7. Existing 035/037 reason/coverage contracts and 081 receipt verification are consumed rather than reimplemented.

## Evidence and remaining dependencies

All new test inputs are neutral synthetic fixtures. No live incident evidence was available or acquired. No real Ghost Report has been prepared or approved. RPC requests: 0; external requests: 0; acquisition cost: $0. Tests establish contract/storage/API behavior, not measured chain findings or live coverage.

For a first real draft, supply an existing production token-wide Guard 2 receipt for a chain-4663 contract, with its rules/code/snapshot/decision hashes and at least one typed reason whose complete source references resolve to retained, content-hash-validated engine evidence at the captured cursor and availability cut. Run:

```sh
pnpm --filter @eko/server exec node --import tsx src/ops/ghost-reports-cli.ts 'guard:0x<revision-hash>'
```

Apply the normal engine migrations, including 0142, before using the writer or reads. Human DEV fact review must precede the internal `GhostReportStore.approve({reportId, reviewedAt, humanFactApproval: true})` action. Partial drafts can be reviewed but remain partial; verified status also requires complete checks and a canonical, publicly revealed registry-bound receipt. The share draft says “From our pre-release engine.” Trading-blackout and publication decisions remain human operations.

Prepare a correction using the new receipt and prior report hash as the CLI's second argument. Old drafts/reviews are preserved; only reviewed corrections become public links. Public records are read through `GET /v2/ghost-reports`, `GET /v2/ghost-reports/:id` and `GET /v2/ghost-reports/:id/share`.

Task 057's address-verified incident manifest is absent from this checkout, so no external incident allegation or 53-launch finding is imported. Any such claim needs that verified manifest and matching actual Guard evidence first. Task 111's OG renderer remains separate; this packet prepares deterministic text through the existing reason adapter.

## TODO(spec)

One new TODO in `packages/shared/src/contracts/ghost-reports.ts`: the specs do not freeze a Ghost Report storage/review API. This implementation uses a separate additive `ghost-report-1` contract and `/v2/ghost-reports` resource without changing Guard scoring or existing Feed kinds. Radar's existing count-related TODO was narrowed after replacing its demo-only report.

## Validation checkpoint

Final checks:

| Command | Exit | Result |
|---|---:|---|
| `pnpm --filter @eko/server test test/ghost-reports.test.ts` | 0 | 4 focused tests passed; also passed in the final full server suite. |
| `pnpm --filter @eko/shared test test/contracts.test.ts test/ghost-reports.test.ts` | 0 | 203 focused tests passed. |
| `pnpm --filter @eko/web test src/components/GhostReports.test.tsx` | 0 | 2 focused tests passed. |
| `pnpm --filter @eko/db test test/merge-migrations.test.ts` | 0 | 3 upgrade/replay tests passed. |
| `pnpm --filter @eko/policy test test/performance.test.ts` | 0 | Unchanged benchmark passes in isolation. |
| `pnpm --filter @eko/server typecheck` | 0 | Focused compilation passed. |
| `pnpm typecheck` | 0 | Final whole-workspace compilation passed. |
| `pnpm test` | 1 | Final default parallel run stopped at unchanged policy performance assertion: p95 55.5 ms, limit 30 ms. An earlier parallel run measured 34.5 ms. No assertion or timing limit changed. |
| `pnpm -r --workspace-concurrency=1 --no-bail test` | 0 | All workspace suites passed: 2,670 Vitest tests plus 33 contract tests; one existing fork test was skipped by the contract runner. |
| `pnpm test:role-image` | 0 | Web/server built; bundled role fixture checks passed without ports/providers. |
| `pnpm brand:check` | 0 | Passed. |
| `pnpm check:addresses` | 0 | Passed. |
| `git diff --check` | 0 | Passed. |

The default root test command has not passed under parallel load in this session. The complete sequential workspace run and the remaining built-role gate passed; do not describe the default command as green. The earlier migration-union failure was corrected by adding 0142 to the exact expected ledger and checking the new tables/triggers. A root run using `pnpm --config.workspace-concurrency=1 test` also stopped on that earlier migration expectation; that root option did not serialize the nested runner, so the final comprehensive run used the explicit recursive command above.

Completed process checkpoints: session `76303` (sequential workspace tests, exit 0), session `57755` (final typecheck, exit 0), session `26312` (built roles, exit 0), session `1344` (final default root tests, exit 1). No validation process remains running. Logs: `/tmp/eko-118-packages-serial.log`, `/tmp/eko-118-typecheck-final.log`, `/tmp/eko-118-role-image.log`, `/tmp/eko-118-test-final.log`; focused logs use `/tmp/eko-118-focused-*.log`, and brand/address logs use `/tmp/eko-118-brand.log` and `/tmp/eko-118-addresses.log`. Logs were sanitized to neutral workspace/home markers. Actual acquisition spend remains $0; chain coverage and live findings remain unmeasured. Next action: lead review/commit, apply migration 0142 through the normal engines migration path, obtain real evidence and perform human fact review. The ordinary parallel root test gate should be rerun in the lead's validation environment.
