# Task 121 · Truthful public Drops page

Candidate: uncommitted worktree diff on `add2dd5502fedfb54ee31141ff0d4ce3c6200776`. Implementation/test SHA-256: `7100ae041509b4853068925d05b24731823bf7780045a2888f499fe30d3f14a4` (the 12 files listed in `/tmp/eko-121-checkpoint.json`, excluding this report). Initial working tree was clean. No commit, push, deployment, publication, paid job or live chain access was performed.

## Changes and spec

- `packages/shared/src/drops.ts`, `src/contracts/api.ts`, `src/index.ts`: additive optional CA-9 demo, feature-flag and published-release fields; shared validation/projection. Hidden, undemoed, invalid and future-recorded entries are omitted. A requested live entry requires all named public flags and already published release evidence; otherwise it remains demo. Flag bindings must belong to the existing shared Drop stage. Elapsed target dates never enable live wording.
- `apps/server/src/http/v1/{config,defaults,drop-manifest}.ts`: config derives records exclusively from the recorded-demo manifest. Public status is evaluated before signed demo-session flag overrides. The actual manifest is empty because no working recordings or published Drop releases were supplied.
- `apps/web/src/routes.ts`, `src/pages/{Drops.tsx,drops.css}`: replace the public T placeholder with loading, unavailable, empty and recorded-demo states. Cards embed root-relative MP4/WebM videos under `/demos/drops/`, with native controls, inline playback and no preload. Target dates remain qualified; live cards link to their publication evidence.
- `packages/shared/test/drops.test.ts`, `apps/server/test/drops-config.test.ts`, `apps/web/src/pages/drops.test.tsx`: 31 new tests covering status/flag/evidence combinations, invalid URLs and bindings, signed-demo disagreement, empty config, route loading and escaped text. The manifest test also checks that any actual manifest assets exist and are nonempty.

Followed FRONTEND §3.22 (and §10 shared flags), BACKEND §23 CA-9/CA-29, FACTS §6 and MARKETING §04/§05 claims/disclaimers. Existing shell disclaimers remain in place. No future Drop surface, Guard logic, migration, dependency, lockfile, read-only spec or prototype was changed. No personal identifiers or real secrets were added or ported.

## Ambiguity and remaining evidence

One new `TODO(spec)` in `packages/shared/src/drops.ts`: “CA-9 omits demo assets, flag bindings and published-release evidence.” The smallest extension adds optional `demo {videoUrl, recordedAt}`, `requiredFlags` and `release {version, publishedAt, url}`. Legacy config records still parse but cannot render without demo evidence. Dates in the actual manifest use ISO calendar dates; the public legacy date field remains compatible.

006/010 integration is present. There are no new package or migration dependencies. Publishing a Drop later requires a real recording at its manifest video path, a qualified target date, flags for the demoed features, and actual published release evidence before selecting live status. All sample titles, dates, videos and release URLs in tests are fixtures; none is release evidence. The public candidate intentionally displays “No recorded Drop demos yet.” Feature acceptance and publication remain external.

## Validation and reproduction

Commands below used the existing dependency tree with the per-command prefix `pnpm_config_verify_deps_before_run=false`; no persistent configuration or installation changed.

| Exact command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/shared test test/drops.test.ts` | 0 | 23 tests; `/tmp/eko-121-shared-focused.log` |
| `pnpm --filter @eko/web test src/pages/drops.test.tsx src/routes.test.ts` | 0 | 10 tests, including 5 existing route tests; `/tmp/eko-121-web-focused.log` |
| `pnpm --filter @eko/server test test/drops-config.test.ts` | 0 | 3 HTTP-injection tests; `/tmp/eko-121-server-focused.log` |
| `pnpm typecheck` | 0 | Entire workspace; `/tmp/eko-121-typecheck.log` |
| `pnpm test` | 0 | 148 Vitest files, 2,619 tests; 33 contract tests passed; web/server builds and built-role fixtures passed; `/tmp/eko-121-test.log` |
| `pnpm brand:check` | 0 | 150 files checked after builds; `/tmp/eko-121-brand.log` |
| `pnpm check:addresses` | 0 | 387 source files; `/tmp/eko-121-addresses.log` |
| `git diff --check` | 0 | Tracked diff whitespace |

The focused commands reproduce all Drop behavior without network or listening ports. The existing contract fork test skipped because `RPC_HTTP_URL` is unset; no skip or assertion was added, removed or weakened. Browser playback and live release links were not verified in this sandbox. Actual paid cost: **$0**. The 31 new tests pass; coverage percentage and live latency were not measured. `/tmp/eko-121-checkpoint.json` records the candidate, source fingerprint, logs, results and next action. Typecheck process 54126 and full-test process 43846 completed with exit 0. No process remains running. Implementation is built/tested and prepared for the lead's review and commit; it is not deployed or release-approved.
