# Task 037 handoff

Source revision: `93c74054fbce064f23c825f626b0a38a024cff41`. Candidate: uncommitted worktree on that revision; changed source/test file manifest SHA-256 `7257648f98f60c4fcaf7808f1bbd6de99a5ed2c6b688aef3226b8fb7a83b5959`. Hash definition: sort changed paths, append each path + NUL + file bytes + NUL; exclude this report. No commit, push, deployment or publication.

Implemented Guard 2.0 §§1, 6, 7.2 and the task packet. Reused 036's labels, gap names, exact decimal reason formatting and disclaimers by moving common copy into shared exports; existing web imports re-export it. No scoring, Signal computation, paid acquisition or release changes.

- Added explicit `/v2/radar`, `/v2/pairs`, `/v2/feed` compact reads and wired existing web consumers. Shadow/candidate labels and gaps are separate from the active V1 grade/order. Source-wide Guard totals retain their unavailable state.
- Added typed optional Guard assessment fields for summaries/Alert/research, V2 card extension for scan, and typed Feed `guardFactorId`/`guardReasonCode`/reason fields. Historical Feed records use only their recorded fields, never a current assessment retrofitted onto an older event.
- Added CA-33 RuleSignal schema with optional typed blocked-signal fields. User origin stays rule/agent; `blockedBy` retains legacy playbook/check-code semantics. Supplied source names and prose stay Untrusted.
- Added pure negotiated preparation for Radar/Pair/Alert/BagReport/scan/widget/OG/bot/research/pack surfaces, a three-line compact component with full-detail links, neutral share/meta titles, escaped inert SVG OG preparation, and plain-text notification preparation. No bot transport or artifact publication.
- Added snapshot/reference size/account context, common buyer-risk/DYOR/NFA/AI/non-affiliation notices, stale snapshot retention, and pack instructions. V1 WS updates preserve only negotiated Guard fields; omitted Signal/spark/tax fields still disappear.

Changed files:

- `apps/server/src/app.ts`
- `apps/server/src/http/v2-guard.ts`
- `apps/server/src/read/feed.ts`
- `apps/server/src/read/guard-consumers.ts`
- `apps/server/test/guard-consumers.test.ts`
- `apps/web/src/components/GuardCompact.test.tsx`
- `apps/web/src/components/GuardCompact.tsx`
- `apps/web/src/components/PolicyLinks.tsx`
- `apps/web/src/components/ui/index.tsx`
- `apps/web/src/copy/guard.ts`
- `apps/web/src/copy/index.ts`
- `apps/web/src/mocks/demo/mission-packs.ts`
- `apps/web/src/pages/research/Research.tsx`
- `apps/web/src/pages/terminal/Feed.tsx`
- `apps/web/src/pages/terminal/GuardCard.tsx`
- `apps/web/src/pages/terminal/Pairs.tsx`
- `apps/web/src/pages/terminal/Radar.tsx`
- `apps/web/src/pages/terminal/RadarParts.tsx`
- `apps/web/src/pages/terminal/pairsFeedModel.ts`
- `apps/web/src/pages/terminal/radarModel.ts`
- `packages/shared/src/contracts/api.ts`
- `packages/shared/src/contracts/feed.ts`
- `packages/shared/src/contracts/guard-consumers.ts`
- `packages/shared/src/contracts/guard-copy.ts`
- `packages/shared/src/contracts/index.ts`
- `packages/shared/src/contracts/loop.ts`
- `packages/shared/src/contracts/research.ts`
- `packages/shared/test/fixtures/contracts/guard-v2.ts`
- `packages/shared/test/guard-consumers.test.ts`

Checks (synthetic fixtures/in-process requests; no measured chain accuracy or visual browser QA):

| Exact command | Exit | Result / log |
|---|---:|---|
| `pnpm --filter @eko/shared exec vitest run test/guard-consumers.test.ts test/contracts.test.ts` | 0 | 210 tests; `/tmp/eko-037-shared-focused.log` |
| `pnpm --filter @eko/web exec vitest run src/components/GuardCompact.test.tsx src/pages/terminal/GuardCard.test.tsx src/pages/terminal/RadarParts.test.tsx src/pages/terminal/pairsFeedModel.test.tsx src/pages/terminal/radarModel.test.ts src/pages/terminal/feedDescription.test.tsx src/pages/research/research.test.tsx` | 0 | 78 tests; `/tmp/eko-037-web-focused.log` |
| `pnpm --filter @eko/server exec vitest run test/guard-consumers.test.ts test/guard-card-api.test.ts` | 0 | 14 tests; `/tmp/eko-037-server-focused.log` |
| `pnpm typecheck` | 0 | All workspace packages; `/tmp/eko-037-typecheck-final.log` |
| `pnpm test` | 0 | Workspace tests, builds and role-image fixtures passed; `/tmp/eko-037-test-final.log` |
| `git diff --check` | 0 | No whitespace errors |

Remaining gaps / reproduction:

- Alert, BagReport, widget, OG and bot live services are not implemented in this checkout. Their shared adapters are prepared and fixture-tested, not released endpoints. Reproduce prepared results with `prepareGuardSurface` and `guardNotification`/`guardOgSvg` using `packages/shared/test/fixtures/contracts/guard-v2.ts`; the focused shared test exercises every surface. Existing placeholder routes remain placeholder routes.
- `TODO(spec)` in `packages/shared/src/contracts/loop.ts`: CA-33 does not define a finite reason-field contract or enumerate legacy GuardCheckId. Supplied reason prose is Untrusted, and `blockedBy` uses the existing GuardCheck code schema until that registry exists. No reason prose is parsed to derive Guard fields.
- No browser/port/live validation was run in this sandbox. Reproduce local read integration with the focused server command above (Fastify injection only). V2 is still shadow/inactive; fixture active modes do not establish acceptance or release.
- The full test command's pre-existing Robinhood Chain fork fixture is skipped when `RPC_HTTP_URL` is unset. This task neither added nor weakened that skip.

Acquisition/run accounting: no acquisition job; actual external request units **0**, actual spend **$0**, paid subscription/pricing **not applicable**. Coverage is synthetic fixtures and captured local read projections, not newly measured provider/chain coverage. Mock RPC metering in the repository's test/role fixtures is not billable acquisition.

Checkpoint: `/tmp/eko-037-checkpoint.json`. Final test session `15527` and typecheck session `51884` both completed with exit 0. Next action: lead reviews and commits the uncommitted diff. No process remains running. No migration or dependency/lockfile change was needed.
