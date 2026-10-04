# Task 089 implementation · 2026-10-02

Prepared seven launch policy drafts and the public `/legal/:doc` renderer. Draft version: `2026-10-02-draft.1`. Owner approval is an external record due **2026-10-05**; `approvedAt`, `evidenceRef` and `effectiveAt` remain null. This work is prepared and locally tested, not approved, committed, published or deployed.

Candidate: base revision `42ccea5ebd58847e8875c30667dc559d0d34b912` plus the uncommitted task 089 changes below. Source-content SHA-256: `3657af5cd3607d060999c613ab6bdcffce5983f36185b531152f3722e33ffdac` (sorted modified/untracked file paths and bytes separated by NUL, excluding this report).

Changed files:

- `apps/web/src/copy/legal.ts`: terms, privacy, risk, AI, team trading, KOL and sanctions drafts; version/review record, placeholders and exact slug allowlist.
- `apps/web/src/pages/Legal.tsx`, `legal.css`, `Legal.test.tsx`: public draft pages, unknown-policy state, readable layout and 20 policy tests. Plain React text rendering keeps HTML and markdown inert; slugs never become paths or markup.
- `apps/web/src/components/PolicyLinks.tsx`, `components/shell/Shell.tsx`, `styles/shell.css`: all seven links in the shared desktop sidebar/mobile More footer; reusable exact analysis disclaimer with risk/AI/terms links.
- `apps/web/src/routes.ts`: replace the legal placeholder with a lazy public T page, independent of authentication and optional flags.
- `apps/web/src/pages/terminal/{Radar,Feed,Pairs,Coin,CoinCard,RadarParts}.tsx`: disclaimer and policy links at page footers, standalone verdict evidence, inspector verdicts and the disabled trade slot. No Guard logic or trading capability changed.
- `docs/tasks/089-implementation.md`: this handoff.

Spec followed: OVERVIEW §12; MARKETING §§04–05; FRONTEND §§2.2, 8; GO PLAN §7. Implementation truth was checked against packets 075/092/116 and current source; BACKEND §§3.5–3.6 clarify encryption, deletion and planned retention. The spec's launch capabilities are not accepted in this candidate: the drafts explicitly describe guarded execution, sanctions, encrypted Flight Recorder, account-wide deletion and Telegram as pending instead of claiming they work. Existing manual web notes are distinguished from the encrypted harness journal. The 0% launch-week terminal fee is explicit; token-day fees, tiers and manual burns remain staged, with terminal fees directed only to the public burn wallet.

Checks and reproduction (all offline; no browser server or live-chain job):

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/web exec vitest run src/pages/Legal.test.tsx src/copy/copy.test.ts src/pages/terminal/Coin.test.tsx src/pages/terminal/RadarParts.test.tsx src/pages/terminal/pending.test.tsx` | 0 | 5 files, 42 tests passed |
| `pnpm typecheck` | 0 | All workspace typechecks completed; `/tmp/eko-089-typecheck.log` |
| `pnpm --filter @eko/web build` | 0 | Production bundle including lazy Legal JS/CSS; `/tmp/eko-089-build.log` |
| `pnpm brand:check` | 0 | 123 files after the build (15 before it) |
| `pnpm check:addresses` | 0 | 270 source files |
| `git diff --check` | 0 | No whitespace errors |
| `pnpm test` | 1 | Existing policy performance test exceeded its 5-second timeout while typecheck also ran; `/tmp/eko-089-test.log` |
| `pnpm --filter @eko/policy exec vitest run test/performance.test.ts` | 0 | Isolated performance test passed with existing assertions/timeouts |
| `npm_config_workspace_concurrency=1 pnpm test` | 1 | pnpm 11 ignored this environment prefix; packages still ran concurrently. Same performance test measured p95 47.44 ms against 30 ms; `/tmp/eko-089-test-serial.log` |
| `pnpm -r --workspace-concurrency=1 test` | 1 | Explicit sequential scheduling passed contracts, db, shared and all 438 web tests, then stopped at an unchanged chain test timeout; `/tmp/eko-089-test-sequential.log` |

The first web test attempt passed file filters after `--`, which ran the whole web suite; one new assertion assumed HTML attribute ordering and was corrected to match actual React rendering. No existing tests were deleted, skipped or weakened. Corrected focused and full web runs both passed. The Foundry chain fork remains skipped by its existing `RPC_HTTP_URL`-unset behavior; this is no live/fork acceptance evidence.

**Full workspace gate unresolved:** the sequential run timed out in `packages/chain/test/abi-pull.test.ts`, “rejects incompatible CHAIN_ID before constructing a live RPC check” (5-second timeout, test file 12.23 seconds). It recorded 112 passing chain tests and one timeout. It stopped before later workspace packages and before another whole-package policy run. Timing failures affected two unchanged packages; the passing isolated policy test does not certify the full gate. No third scheduling repair or engine/chain edit was attempted. Reproduce the full root command with pnpm 11's supported environment prefix in a less-contended environment: `pnpm_config_workspace_concurrency=1 pnpm test`. The old `npm_config_` prefix is ignored (`pnpm config get workspace-concurrency` returned `undefined`; the `pnpm_config_` prefix returned `1`). This reproduction command is prepared, not executed here.

New `TODO(spec)` items (both in `copy/legal.ts`):

1. Confirm the public domain/contact and operational log/backup retention before approval. Placeholders remain inert text, without invented contact links. Spec-defined launch retention is described as a design requiring implementation evidence.
2. Set the team blackout duration and exception-review procedure externally. No numerical window is specified, so the draft pauses team trades in an asset under pending analysis until a window/procedure is approved.

Remaining dependencies: external owner approval with date and evidence tied to the exact draft version; confirmed public domain/contact and the two decisions above; accepted behavior/evidence from 075, 092 and 116, plus sanctions screening (074), before the corresponding draft limitations can be removed. Later landing/share/Settings consumers should reuse the shared links and canonical copy when those packets land. No other packets' implementations, prototype files, read-only specs, package declarations or lockfile were changed. No identifiers needed replacement.

Evidence is local fixture/static-render/build evidence only. No paid jobs, provider requests, chain reads, external messages or deployment ran; metered provider/chain spend was **$0**. Browser/mobile visual verification was not run because this sandbox has no ports. All processes above have finished; the logs are the checkpoint, with no background continuation. Next actions are a healthy-environment full test gate, external owner review and dependency acceptance, not publication by this session.
