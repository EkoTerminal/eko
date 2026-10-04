# Task 136 report

Candidate: uncommitted changes on `9d54c42398586801c3e5d0a33e7c6503dbf0b02a`. No commit, push, deployment, publication, migration, new dependency or lockfile change.

## Changes

- `apps/web/public/manifest.webmanifest`, `public/icons/eko-{192,512,maskable-512}.png`, and `index.html`: EKO standalone identity, `/mission?src=pwa`, root scope, `#05121c` colors, Approvals/Scan/Radar shortcuts and installation icons. Icons reuse existing brand assets; the maskable icon has an opaque background.
- `apps/web/build/pwa.ts`, `vite.config.ts`, and `src/sw.ts`: handwritten build-time shell list and content-versioned worker. Precache emitted JS/CSS/fonts, static fonts, manifest and icons; cache fonts first. Only exact listed asset URLs can enter the cache. API paths, OG images, cross-origin responses and mutations use network-only requests with HTTP caching disabled. Navigation responses are never stored; offline navigation falls back to the precached shell. Activation removes obsolete EKO caches and entries outside the allowlist. Updates wait for existing clients to close rather than interrupt signing.
- `src/lib/pwa.ts`, `src/components/Pwa.tsx`, `src/copy/pwa.ts`, `src/main.tsx`, and `src/pages/Settings.tsx`: production registration, installation from Settings → Display, manual Safari steps, standalone detection, and connection messages. Install events are retained until a user taps; no first-visit prompt. No push permission, subscription, push handler or notification-click handler is registered.
- `src/lib/connection.ts` and `src/lib/api.ts`: reactive offline/API-unavailable banner, recovery reporting, and `cache: 'no-store'` for API calls, including before the worker controls the page.
- `src/sw.test.ts` and `src/lib/pwa.test.tsx`: eight new tests covering production artifacts and the worker lifecycle, offline shell/fonts, network-only private responses, poisoned caches, sign-out, update replay exclusion, install interaction, missing API connectivity and recovery. Existing Settings/logout and API boundary tests remain intact.

## Specifications and decisions

Followed `03-FRONTEND` §§1.2, 12 and 13 and `02-MARKETING` claims/voice rules. The spec names `vite-plugin-pwa` with `injectManifest`; it is absent from the installed dependency set. The task instruction explicitly requires a handwritten fallback without new dependencies, so a local Vite plugin injects the shell manifest into `src/sw.ts` instead. No spec files were edited. No new `TODO(spec)` notes or personal identifiers; no source identifiers required replacement.

## Checks and checkpoint

| Command | Exit | Evidence |
| --- | --- | --- |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test src/sw.test.ts src/lib/pwa.test.tsx src/pages/settings/settings.test.tsx src/lib/api.test.ts` | 0 | Final candidate: 4 files / 25 tests passed. Initial run caught precache build order and SSR fixture issues; both corrected without changing assertions. |
| `pnpm typecheck` | 0 | All workspace typechecks passed, including a final-candidate rerun. |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | All workspace suites passed, plus web/server production builds and role-image fixture checks. Web: 49 files / 599 tests passed. Existing contract fork skip described below. |
| `pnpm brand:check` | 0 | 202 files checked after the final production build. |
| `pnpm check:addresses` | 0 | 479 source files checked. |
| `git diff --check` | 0 | No whitespace errors. |

Local logs: `/tmp/eko-136-typecheck.log`, `/tmp/eko-136-test.log`, `/tmp/eko-136-brand.log`, `/tmp/eko-136-addresses.log`. Comprehensive test session `26706`, final typecheck session `6564`, and final focused-test session `16021` are complete (all exit 0); no job remains running. The comprehensive command began before the compiler-only portability adjustment; the affected production-build/worker checks were rerun against the final code (25 focused tests), and the comprehensive gate's final web/server builds and role checks used the final code. The worker build uses the existing TypeScript compiler rather than a newer Node type-stripping API, preserving the repository's Node minimum. No coverage collection was performed; external paid-run spend is $0. Next action is the lead's browser/device integration check below.

## Evidence limits and remaining integration checks

Built/tested locally with synthetic responses, fake browser events and a worker VM operating on a real production Vite build. No live wallet, account, API, transaction, browser installation, Lighthouse or device evidence. The existing contract runner skipped `testForkCommitAndVerifyFixture` because `RPC_HTTP_URL` is unset; this task did not add or change skips. No deployment or approval is implied.

The sandbox has no network or ports, so actual browser/device installability remains a lead integration check on an HTTPS or localhost-served production build:

1. `pnpm --filter @eko/web build`, then serve the terminal production directory; `/sw.js`, `/index.html`, the manifest, icons and emitted assets must resolve on the same origin. A separate marketing host must preserve access to the terminal shell and worker.
2. Open `/settings`, wait for worker activation, and use Settings → Display to install. Verify standalone launch opens `/mission?src=pwa`; check the three shortcuts and Android maskable icon. On iOS Safari use Share → Add to Home Screen.
3. After loading online, disconnect the network and reload `/mission` or `/approve/demo-approval`. Verify the shell loads and shows “You're offline. Approvals need a connection.” Private reads and approval/order mutations must fail; reconnect to recover. With the API unreachable but the browser online, verify the API connection message.
4. Inspect Cache Storage while reading private orders/approvals/journal/receipts and OG images, sign out, then install a changed build and close old clients to activate it. Only listed shell/font/icon assets may remain; private responses must never replay offline.

Push stays deferred to D0. No dependency on the parallel trade/signing or share-image packets was introduced; their runtime responses remain outside the cache allowlist.
