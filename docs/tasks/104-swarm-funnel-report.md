# Task 104 report

Candidate: base `913d0f7169921cf890f3d6cbadb1058057908857` plus the uncommitted changes listed below. No commit, push, deployment, publication or approval action was performed.

## Changes

- `apps/engines/src/swarm/index.ts`: pure funnel with the $2,000 ±2% depth, 30-second age and five-distinct-buyer thresholds; Danger/clone exclusion; caller-owned seen-hash checks; strict availability handling; card-metadata adapter; canonical naive-view and cache hashes; delimited prompt preparation with a 600-output-token ceiling for the future worker. Hashes exclude evaluation block and detection flags. Prompts exclude verdicts, playbooks, flow and Guard reasons. Eligible candidates remain beta with ranking disabled and grant no trading permission.
- `apps/engines/src/swarm/personas/v1.ts`: immutable version-1 definitions for all ten personas, prescribed exits and 70/20/10 model mix; canonical persona-set hash. Definitions are code data so the pure layer needs no YAML loader or file I/O.
- `packages/shared/src/contracts/swarm.ts`: strict bounded VoteBatch, persona vote and exit schemas; snapshot/block echoes, 600-block freshness, exact unique persona membership, action/size consistency and invalid-context checks. Rejection messages never reflect hostile model text.
- `apps/engines/src/index.ts`, `packages/shared/src/contracts/index.ts`: public exports for the following packets.
- `.env.example`, `apps/server/src/config.ts`, `apps/server/test/v1-foundation.test.ts`: AI daily budget defaults to zero as explicitly requested; regression assertion added. The starting code defaulted to two dollars.
- `apps/engines/test/swarm-funnel.test.ts`, `packages/shared/test/swarm.test.ts`: threshold boundaries, availability, content/version/model hashing, persona rules, hostile token text, malformed/stale/contradictory votes, duplicate/missing personas and numeric bounds.
- `packages/shared/test/fixtures/contracts/swarm.ts`, `packages/shared/test/contracts.test.ts`: neutral synthetic samples registered with the existing complete contract-schema gate.

Spec followed: BACKEND §§8.1–8.4 and 20; OVERVIEW §06; shared-contract conventions in FACTS §7; BACKEND §§8.5/8.7 and §9.5 for cache context, beta/ranking and the existing Untrusted boundary. Read the claims rules in MARKETING §§01/04. No spec, Guard design or prototype changes. No dependencies or migrations added; all reserved migration numbers remain unused. No personal identifiers were introduced or source identifiers ported.

## Verification results

| Command | Exit | Evidence |
| --- | --- | --- |
| `pnpm --filter @eko/shared test test/swarm.test.ts` | 0 | 43 tests passed |
| `pnpm --filter @eko/engines test test/swarm-funnel.test.ts` | 0 | 41 tests passed |
| `pnpm --filter @eko/server test test/v1-foundation.test.ts` | 0 | 15 tests passed |
| `pnpm --filter @eko/shared test test/contracts.test.ts test/swarm.test.ts` | 0 | 253 tests passed after registering all six schema samples |
| `pnpm typecheck` | 0 | All workspace typechecks passed; `/tmp/eko-104-typecheck.log` |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | 3,094 tests across 185 files; web/server builds and built role fixture checks passed; `/tmp/eko-104-test.log` |
| `pnpm brand:check` | 0 | Final check passed; 154 files checked, including built assets |
| `pnpm check:addresses` | 0 | Final check passed; 446 source files checked |
| `git diff --check` | 0 | Passed |

Initial focused iteration corrected two TypeScript annotations and a hostile-text fixture whose long suffix was part of a URL and therefore sanitised away. The first full test attempt exited 1 on missing schema samples in the existing contract registry; samples were added without changing any assertions. Focused contract tests then passed. No tests were deleted, skipped or weakened; no timeout was raised.

## Ambiguity and remaining dependencies

One new `TODO(spec)` in `apps/engines/src/swarm/index.ts`: BACKEND §8.5 names `roundedNaiveView` without defining precision. Version 1 hashes exact observed surface values. The future worker must trigger on card changes, never a clock tick; changing precision requires a versioned hash policy.

Task 105 owns provider/budget reuse, enablement, queue scheduling, persistent cache/votes/inference logs, provider-side token enforcement, adaptive sampling and receipt-backed forecasts. This packet adds no provider calls or replacement registry/budget modules. Existing availability gaps (including unmeasured card depth) prevent scheduling through the card adapter. Callers must supply observed naive metrics and distinct-buyer counts rather than fabricated defaults. Task 106 owns paper positions and calibration acceptance. `swarm_ranking` remains unchanged/off by default; no gate is claimed or enabled here.

Evidence is synthetic fixture coverage only, with no live chain/provider runs and actual model cost $0. It is not a live steer-rate, calibration or 14-day baseline pass. The code is built/tested and prepared for worker integration, remaining uncommitted for the lead.

Completed full-gate checkpoint: session 80904 exited 0; `/tmp/eko-104-test.log`. The run took approximately 7 minutes 50 seconds (launch around 16:54:09 UTC; completion observed at 17:01:59 UTC on 2026-10-03). Reported package durations include engines 80.28 s (318 tests), indexer 261.43 s (153 tests), server 112.26 s (354 tests) and MCP 5.12 s (24 tests). Built role fixtures passed using injected routes and fixture RPC, without listening ports or real providers. Typecheck session 23380 exited 0; `/tmp/eko-104-typecheck.log`. No jobs remain running from these checks. Next action: the lead reviews and integrates this uncommitted candidate; worker/paper/calibration work remains in tasks 105–106.

Reproduction: run the exact commands in the verification table from the repository root. No network or listening port is needed for the new tests.
