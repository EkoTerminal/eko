# Task 056 · Finite blinded evidence review page report

Prepared in the worktree, uncommitted and unreleased. Guard V2 remains shadow/inactive. All new validation cases are synthetic fixtures; no human judgment or comparator-parity measurement was invented.

## Source and candidate

Source/base revision: `d384bd60d9839fe404042e101a5a0c5d86930373` (Guard 055).
Candidate: that revision plus the uncommitted files listed below. Candidate content SHA256: `b578e527a567505db88cf3edfc28f154870800a1a3c98389a81084d5c6c8f3c6`.
The digest hashes sorted changed/new relative filenames and their bytes, each separated by NUL, excluding this report. No candidate commit was created.

## Changed files

- `apps/web/src/pages/review/Review.tsx`, `review.css`: finite pinned role, holding, funding, transfer, sale, exit, control, coverage, intervention, real-buyer, recovery and identity-provenance views. Show exact raw quantities/rationals, supported/unknown/replay-invalid states, unknown missing panels, evidence anchors, cursor/availability, context and provenance pins. Intervention and real-buyer scatter plots use only supported unambiguous timestamp/return pairs, with exact source values and linked panels; no interpolation, invented missing facts or causal assertion.
- `apps/web/src/pages/review/model.ts`: finite question drafts, current independent slots, append ancestry, adjudication prerequisites, pinned-evidence validation, shared Untrusted sanitization and bigint plot normalization.
- `apps/web/src/pages/review/client.ts`: shared-schema session requests for the exact revision, assigned role, immutable label/adjudication submission and role-projected export. Reveal is granted only by a fresh server projection. Failed submissions/refreshes do not grant reveal; malformed or mismatched responses fail closed.
- `apps/web/src/copy/review.ts`: finite review questions about bags, current selling, account/size exit, audience independence, recycled paths, horizon changes, recovery and provenance. Calibration and parity limitations remain explicit.
- `apps/web/src/routes.ts`, `apps/web/src/App.tsx`: direct internal `/internal/review/:revisionId` route, separate from public launch navigation. Invalid IDs cannot reach review requests. Revision/session changes remount the page and discard prior reveal state.
- `packages/db/src/review-store.ts`, `apps/server/src/http/review-api.ts`: bounded additive `GET /v2/review/revisions/:revisionId/role`, returning the existing shared `ReviewRoleSchema` as JSON for the assigned session only. It returns no account identifier, pseudonym, scores or judgments; caller-supplied role headers have no effect. Existing writes still bind reviewer/adjudicator identity on the server. No migration or review-contract version change.
- `apps/web/package.json`, `pnpm-lock.yaml`: declare the existing `@eko/untrusted` workspace dependency for rationale sanitization; update only its lockfile importer offline.
- `apps/web/src/pages/review/Review.test.tsx`: 13 synthetic SSR/model/transport cases covering supported/unknown/invalid evidence, exact plots, questions, inert nested text, hidden/revealed state, independent forms, immutable ancestry, invalid evidence, read-only/waiting roles, revised case blindness, failed POST/refresh and immutable role-projected exports. Optional static fixture generation opens no ports.
- `apps/server/test/review-api.test.ts`: add assigned-role/auth/JSON/header-spoofing coverage while retaining all original independent-review and export tests.
- `docs/tasks/056-review-page-report.md`: this report.

## Specification and ambiguity

Followed Guard 2.0 §9.3 (finite questions, blind independent review, unresolved labels and immutable adjudication/export), §§3.3/4.2/9.1–9.2 (separate raw sales, real-buyer/intervention validity, account/size and recovery), §§2.1/6–7 (pinned availability, evidence and inactive rollout); FACTS §7; FRONTEND §§1.1/7/8/9; BACKEND §9.5; MARKETING §04 claims and required analysis copy.

`TODO(spec)` in `apps/web/src/routes.ts`: §9.3 supplies no review URL or launch stage. The smallest reading is an assigned internal deep link, outside launch navigation; authorization remains enforced by the Guard 055 API. The existing Guard 055 DTO does not provide acquired comparator snapshots or typed intervention/cohort variant labels. The page renders supplied panels and exact return pairs without guessing those distinctions or claiming parity; original method/benchmark hashes and linked evidence remain available. No general analytics surface, source acquisition, score fitting or activation switch was added. No existing tests were weakened, skipped or deleted, and no personal identifiers were added or ported into code, fixtures or this report.

## Checks and reproduction

Check commands use `pnpm_config_verify_deps_before_run=false` in their environment to prevent pnpm's automatic reinstall before scripts in this offline sandbox. Application scripts and assertions remain unchanged.

| Exact command (with that environment variable) | Exit/result |
|---|---|
| `VITEST_MAX_WORKERS=2 REVIEW_VISUAL_DIR=/tmp/056-review-visual pnpm --filter @eko/web test src/pages/review/Review.test.tsx src/routes.test.ts src/copy/copy.test.ts` | 0; 3 files, 21 tests passed. |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/review-api.test.ts` | 0; 4 tests passed. |
| `pnpm --filter @eko/web typecheck` | 0. |
| `pnpm typecheck` | 0; complete workspace on final source. |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0; all workspace suites (3,109 package tests), contract tests, web/server builds and role-image checks passed. |
| `pnpm brand:check` | 0; 159 files checked, including built artifacts. |
| `pnpm check:addresses` | 0; 460 source files checked. |
| `git diff --check` | 0. |

The first role-transport test exposed Fastify's plain-text string response; the endpoint now explicitly sends JSON and the focused file passes. The first comprehensive test attempt exited 1 on missing contract dependency links after the offline installation attempt. Restoring those installed links allowed the final comprehensive run. No timeout was increased.

Dependency preparation: `CI=true pnpm install --offline --no-frozen-lockfile` exited 1 because the local store lacks the existing font archive. Existing installed dependencies were restored from the local Guard 055 worktree; `CI=true pnpm install --offline --no-frozen-lockfile --lockfile-only` exited 0 and updated only the new workspace importer. A full clean frozen install is not verified in this sandbox; the lead should run `pnpm install --frozen-lockfile` with a complete dependency cache.

Logs: `/tmp/056-web-focused.log`, `/tmp/056-server-focused.log`, `/tmp/056-web-typecheck.log`, `/tmp/056-typecheck.log`, `/tmp/056-test.log`, `/tmp/056-brand.log`, `/tmp/056-addresses.log`, `/tmp/056-install.log`, `/tmp/056-lockfile.log`. Static supported/unknown/replay-invalid fixtures: `/tmp/056-review-visual/`. A local-file Playwright screenshot attempt exited 1 because Chromium launch was denied by the sandbox's process bootstrap permission; browser visual/interaction verification remains unperformed. Reproduce that check by opening the static HTML files at desktop/mobile widths outside this restriction.

For application reproduction, provision an immutable case and distinct reviewer/adjudicator assignments using Guard 055's coordinator endpoints, sign in as an assigned session and open `/internal/review/<revisionId>`. Both reviewers begin blinded independently; submitting an unresolved judgment reveals only according to the existing server projection. The adjudicator waits for both labels, then appends a versioned evidence-backed decision. Revise a case to check renewed blindness, revise a label to check preserved history/stale adjudication, and download the export to inspect its unchanged server hash and per-revision visibility.

## Coverage, process and next action

Measured chain cases: 0. Real human judgments: 0. Matched comparator snapshots: 0. Acquired provider request units: 0; provider pricing not assumed; paid acquisition cost: $0. No paid job, listener, deployment, release or persistent data acquisition was started. No acquisition checkpoint applies.

All required validation processes completed with exit 0; no task process is left running. Final comprehensive log: `/tmp/056-test.log`. Next action: the lead can review the uncommitted diff, verify a clean frozen install and visually exercise the prepared fixtures. Actual independent human assignment, source provenance, acquisition and matched-tool parity remain later packet work.
