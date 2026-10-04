# Task 108 handoff

Source revision: `317dc6032d9fd9fe3d2a497cdf5600910bc7f93e`. Candidate: uncommitted changes on that revision, manifest SHA-256 `6eabbfb083378a7f2762fb97538516ab498e599f59f361375c713ffc96244b62`. Hash definition: sorted changed paths, each path + NUL + file bytes + NUL; excludes this handoff. No commit, push, deployment, publication or release approval.

Implemented FRONTEND §§3.1, 3.7, 4.1, 8 and BACKEND §23 CA-5. Consumes 107 persisted POST/reload and 037 compact Guard rendering; no Guard evaluator, acquisition, queue, wallet or Scoreboard logic changes. The spec replaces the existing root-to-Radar redirect and external prototype middleware. The prototype itself was not accessed or edited. Removed the inherited machine-local prototype fallback from configuration; no personal identifiers were introduced or ported.

Changed files:

- `apps/web/src/pages/scan/Landing.tsx`: root hero, configured examples, equal-width refused/missed counters, six supplied Radar preview cards, delay/availability, harness pitch, Drops teaser and disclosures.
- `apps/web/src/pages/scan/ScanInput.tsx`: address/ticker validation, Go/Enter submission, bounded examples, canceled submission on unmount.
- `apps/web/src/pages/scan/ScanResult.tsx`: persisted result reads, candidate address selection via POST, pending/error/not-found/stale states, evidence/playbooks/history, costs, flow, receipts, Open coin, Scan my bags and neutral share intents/copy fallback. Reuses V1 cards and negotiated V2 compact/full adapters without activating shadow assessments.
- `apps/web/src/pages/scan/scanModel.ts`: contract parsing, null/absent counter preservation, abortable 700 ms polling, failure backoff, ten-second deadline (including hanging reads), retained evidence and independent completion latency samples.
- `apps/web/src/pages/scan/scan.css`, `apps/web/src/copy/scan.ts`: responsive styles and canonical copy; shared Radar flow styles are imported.
- `apps/web/src/pages/scan/scan.test.tsx`: focused synthetic render/model tests, including static wallet import boundary.
- `apps/web/e2e/landing-scan.spec.ts`: prepared 390 × 844 input-above-fold, validation, candidate selection, persisted reload, pending-to-ready and stale receipt scenarios.
- `apps/web/src/main.tsx`, `apps/web/src/TerminalApp.tsx`, `apps/web/src/routes.ts`, `apps/web/vite.config.ts`: serve the packet landing, resolve Scan results, lazy-load terminal wallet providers, retire external prototype routing and proxy negotiated Radar reads.

Checks and logs (fixtures/in-process tests only):

| Exact command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/web exec vitest run src/pages/scan/scan.test.tsx src/copy/copy.test.ts` | 0 | 29 tests, two runs; final `/tmp/eko-108-focused-final.log` |
| `pnpm --filter @eko/web typecheck` | 2 initially | Decimal-string Guard timestamp arithmetic found and corrected before workspace checks; `/tmp/eko-108-web-typecheck.log` |
| `pnpm typecheck` | 0 | Initial and final candidate; `/tmp/eko-108-typecheck-final.log` |
| `pnpm test` | 1 initially | Existing policy performance benchmark p95 60.29 ms versus its unchanged 30 ms assertion under concurrent package load; `/tmp/eko-108-test.log` |
| `pnpm --filter @eko/policy exec vitest run test/performance.test.ts` | 0 | One test passed in isolation; `/tmp/eko-108-policy-focused.log` |
| `npm_config_workspace_concurrency=1 pnpm test` | 1 | pnpm 11 ignores that configuration prefix; same benchmark p95 48.51 ms under concurrent load; `/tmp/eko-108-test-serial.log` |
| `pnpm_config_workspace_concurrency=1 pnpm test` | 0 | Full gate passed with packages serialized, including builds and role-image fixtures; `/tmp/eko-108-test-final.log` |
| `pnpm brand:check` | 0 | Initial and final runs; `/tmp/eko-108-brand-final.log` |
| `pnpm check:addresses` | 0 | Initial and final runs; `/tmp/eko-108-addresses-final.log` |
| `pnpm --filter @eko/web exec playwright test e2e/landing-scan.spec.ts --list` | 0 final | Two scenarios discovered; initial exit 1 for missing JSON import attribute, corrected; `/tmp/eko-108-browser-list-final.log` |
| `git diff --check` | 0 | No whitespace errors |

Port-free renderer probe: `pnpm --filter @eko/web exec node --input-type=module -e 'import { chromium } from "@playwright/test"; const browser = await chromium.launch({ channel: "chrome", headless: true }); await browser.close();'` exited 1 because Chrome aborted with SIGABRT. No browser scenario, visual QA or physical above-fold assertion was executed. The node test verifies input ordering, Go and equal counter columns, not browser geometry.

Remaining dependencies and reproduction:

- 112 must supply measured Scoreboard counters and a real observation start. Absent/null observations render Unavailable; only measured zeros are shown. One new `TODO(spec)` in `scanModel.ts`: CA-15 lacks a nullable/unavailable counter wire schema; the consumer accepts explicit null/absence without inventing zeros. No other new `TODO(spec)`.
- `/config.exampleScans` must be populated with verified addresses upstream. The landing has no invented examples. The existing default remains empty.
- `/bags` is an existing SIWE route and still a placeholder in this checkout; the CTA navigates there. Its implementation remains outside 108.
- Run `pnpm --filter @eko/web exec playwright test e2e/landing-scan.spec.ts --project=desktop` where local ports and Chrome are available. Both prepared scenarios use a 390 × 844 viewport and synthetic HTTP fixtures.
- Indexed completion target **p50 ≤ 3,000 ms** is recorded independently as `ui.scan_to_verdict_ms.indexed`; initially pending scans use `ui.scan_to_verdict_ms.pending`. Partial/pending verdicts do not contribute completion samples. These are submission-through-render client measurements, not engine acquisition benchmarks. Reloads do not fabricate samples. `localStats` can inspect collected indexed p50 samples; existing `/api/telemetry` transports them.
- New-pair discovery-to-complete **p95 ≤ 5,000 ms** remains 107/087's engine/staging gate (`scan.pair_to_verdict_ms`). Neither a fast pending response nor a synthetic fixture passes that gate. No live indexed p50 or new-pair p95 evidence is available in this network/port-restricted sandbox.
- No migration, dependency, lockfile, secret or custody change was needed. Reserved server migration 0020 was not used.

Actual external acquisition requests: **0**. Actual spend: **$0**. Coverage: synthetic fixture/model/render tests and workspace gates, not measured provider/chain accuracy. No paid run or subscription was used. The pre-existing contract RPC fork skip is retained; no test or assertion was deleted, weakened or newly skipped.

Checkpoint: `/tmp/eko-108-checkpoint.json`. Final gate session `81977` completed with exit 0; no process remains running. The built initial static JS import graph has 18 chunks and zero wagmi/WalletConnect source-map modules (local bundle probe exit 0). Next action: lead review/commit and browser/staging validation in an authorized environment. Built/tested/prepared work does not establish deployment or release approval.
