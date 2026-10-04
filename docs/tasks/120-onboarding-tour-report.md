# Task 120 report

Candidate: base `eece6311ae9b901ee1f4c68fcd1c5089ce917ede` plus the uncommitted changes in this worktree. No commit, push, deployment, external messages, paid run, new dependency or migration.

Implemented 03-FRONTEND §§3.21, 4.1 and 7.5, with preferences following 04-BACKEND §23 CA-10 and copy following 02-MARKETING §04. The existing tour engine is mounted after scan value through a dismissible “Take the 40-second tour.” pill. No welcome modal is mounted. Ten specified anchors are defined; only visible implemented anchors participate, including on mobile. Missing, gated, hidden and inert surfaces are skipped. Escape works even from an input. System and Settings reduced motion are honored; trade highlights and checklist completion do not celebrate trades.

The checklist counts five launch actions: rendered coin scan, evidence opened, completed owner bag report, confirmed guarded trade, and a received agent connection test. Legacy paper/close/live preference fields remain backward compatible but do not contribute to these five actions. Progress OR-merges on reload and sign-in. Anonymous device progress is claimed on sign-in; later accounts use separate mirrors. Pending saves are canceled on account switch and late responses are ignored. The `eko.onboarding=off` bypass suppresses automatic surfaces and server progress writes.

Changed files:

- `apps/web/src/App.tsx`: mount onboarding.
- `apps/web/src/store/onboarding.ts`: launch actions, version, account-local persistence and merge.
- `apps/web/src/components/onboarding/Welcome.tsx`: remove the obsolete welcome TODO; the compatibility component remains empty and unmounted.
- `apps/web/src/components/onboarding/{Onboarding,Checklist,Tour,steps}.tsx` and `sync.ts`: offer, checklist, visible-anchor engine, keyboard controls and preference synchronization.
- `apps/web/src/components/shell/Shell.tsx`, `components/chart/ChartStage.tsx`, `components/trade/TradePanel.tsx`: scan, mission, mode, available markers, fees and trade anchors. The existing wallet anchor is reused.
- `apps/web/src/pages/scan/{ScanInput,ScanResult}.tsx`, `pages/terminal/{Coin,CoinCard,Bags}.tsx`, `pages/mission/Connect.tsx`, `components/trade/WalletTradeProvider.tsx`: anchors and completion events. Guard logic and signing checks are unchanged.
- `apps/web/src/styles/onboarding.css`: nonblocking offer, mobile clearance and reduced-motion behavior.
- `packages/shared/src/schemas.ts`: defaulted launch checklist fields; legacy fields retained.
- `apps/web/src/components/onboarding/{onboarding.test.ts,launch.test.tsx}`: merge, reload, sign-in, account boundaries, canceled/late saves, bypass, pre-value rendering, absent/gated anchors, keyboard dismissal and motion tests.
- `apps/server/test/onboarding.test.ts`: existing exact round-trip fixture now includes all five launch fields as well as legacy progress.
- `apps/web/e2e/onboarding.spec.ts`: replaces retired skeleton/future-tour cases with launch offer, reload persistence, bypass, mobile missing anchors and reduced-motion cases.
- This report.

Task 119 was inspected using `git show task-119:apps/web/src/pages/Settings.tsx`, `git show task-119:apps/web/src/routes.ts` and `git show task-119:apps/web/src/lib/settings.ts`. This task links Help and About through `/settings#about`, retains the existing `startTour()` interface used by its replay button and copies no Settings implementation. The lead must integrate Task 119 to deliver its Settings page. `/bags`, `/radar`, `/scan` and `/mission/connect` are existing navigation targets. Simple/Pro, `/learn`, future Drop controls and unaccepted execution paths were not added.

TODO(spec): `apps/web/src/store/onboarding.ts` documents the unspecified ownership of device progress in CA-10: claim anonymous progress once on sign-in and isolate subsequent account mirrors by account id. No other new TODO(spec). Existing bag-sell integration and Guard/fee contract TODOs are unchanged and remain owned by their packets.

Validation:

| Command | Exit / result |
| --- | --- |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test src/components/onboarding/onboarding.test.ts src/components/onboarding/launch.test.tsx src/pages/scan/scan.test.tsx src/components/trade/TradePanel.test.tsx` | 0; 4 files, 104 tests passed |
| `pnpm typecheck` | 0; repository typechecking passed on final source |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0; complete repository gate, including contracts, packs/evals, workspace tests, web/server builds and role-image fixtures |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test` | 0; 52 files, 703 tests passed, including the final anchor-resize adjustment |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/onboarding.test.ts` | 0; 1 file, 7 tests passed |
| `pnpm brand:check` | 0; 47 files checked |
| `pnpm check:addresses` | 0; 516 source files checked |
| `git diff --check` | 0 |

During development, the initial web typecheck exited 2 for partial checklist fixture types and React's unsupported `onToggleCapture` prop; those were corrected. The first focused run exited 1 because the SSR test read Zustand's initial snapshot instead of its updated store. Its failing file was rerun alone after extracting the rendered view: `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test src/components/onboarding/launch.test.tsx` exited 0 (9 tests). The subsequent four-file focused run passed all 104 tests. No assertions were weakened, tests skipped/deleted or timeouts increased.

Evidence is offline fixtures and automated checks only: no live wallet signatures, real trades, live agent installs, measured 40-second completion time, live latency or exhaustive holdings coverage is asserted. Playwright cases are prepared but not executed because this sandbox disallows local ports. Reproduce them in a port-enabled environment with `pnpm --filter @eko/web e2e onboarding.spec.ts --project=desktop`; mobile behavior is exercised with an explicit viewport within that suite.

Completed checkpoint: full test process session `9526` exited 0; log `/tmp/eko-task-120-test.log`. Final web suite session `95251` exited 0; log `/tmp/eko-task-120-web-final.log`. Final typecheck session `53357` exited 0; log `/tmp/eko-task-120-typecheck-final.log`. Focused server session `35536` exited 0; log `/tmp/eko-task-120-server-focused.log`. Brand/address checks were repeated after the final changes and both exited 0. Full-gate web tests were supplemented by a complete final web run after the anchor-resize adjustment; no relevant source changed afterward except the obsolete welcome comment. Logs have environment home paths redacted.

Actual external cost: none; all evidence uses local fixtures. Behavioral coverage includes the five-action preference contract, reload/sign-in merge, account switch/canceled writes, automatic-off bypass, no welcome before value, visible/gated/absent anchors, keyboard dismissal and motion overrides. A numerical coverage report was not generated. All local jobs have finished. Next action for the lead: review and integrate these uncommitted changes with Task 119; execute the prepared browser suite in an environment that permits ports. Nothing is deployed or asserted to have live approval.
