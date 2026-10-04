# Task 036 implementation report · 2026-10-02

Source revision: `c6732b24f75656c81e7c0ac0272e7e103f6bf4a4`.
Candidate: uncommitted packet 036 changes; the lead commits.
Candidate source SHA-256: `1268eb2f81050a05c60e6d9d05136dba891516f9cb8f6bafcd8d70efb547eeb1`.
Fingerprint: the 14 changed/new `apps/web/` files below, sorted by relative path, concatenated as path + NUL + file bytes + NUL. This report is excluded.

## Changed files and behavior

- `apps/web/src/copy/guard.ts`: canonical labels, snapshot disclaimer, named gaps, explicit shadow/candidate copy and buyer-mode explanations. No observed-Lower badge beneath an Elevated gap overlay; High retains its coverage gaps.
- `apps/web/src/components/ui/index.tsx`, `apps/web/src/styles/ui.css`: shared chip consumes typed Guard assessments, displays level plus equally prominent gap line, and uses neutral colour for shadow/candidate assessments. Existing legacy chip labels remain legacy. The inert text boundary strips controls, bidi and zero-width characters while preserving escaped text and flags.
- `apps/web/src/lib/api.ts`, `apps/web/src/lib/api.test.ts`: explicit V2 reads use the configured API origin/path prefix without nesting `/v2` underneath `/v1`; existing V1 and execution paths retain their behavior.
- `apps/web/src/pages/terminal/useGuardCoin.ts`: independently parsed fast verdict and partial-card V2 reads; refresh on existing coin notifications/resync and explicit retry. Older overlapping refreshes are ignored. Null/error refreshes preserve persisted records and expose a stale notice; Scanning applies only before the first persisted assessment. Demo transport continues its existing V1 fixtures.
- `apps/web/src/pages/terminal/GuardCard.tsx`: complete typed card groups, separate route/size/account entry and exit rows, venue versus all-in cost/network fee, exact raw amounts and denominators, raw/liquid/locked holdings, bounded/unknown/not-applicable status and coverage, controls, services, history, recovery, jobs and source snapshot. Empty collections never imply completed coverage unless explicitly supported. Reason expansion uses the shared validated templates and validated evidence IDs; external/nested text stays inert with explicit Copy text. Optional Signal/readings/composite, spark and change fields render only when supplied; low-data readings are unavailable and High overlays the composite.
- `apps/web/src/pages/terminal/Coin.tsx`, `apps/web/src/pages/terminal/CoinCard.tsx`, `apps/web/src/pages/terminal/coin.css`: integrate partial V2 cards despite unavailable legacy issuer cards, retain the fast assessment, keep active legacy evidence before shadow metrics, use separate focus targets, show legacy rules/receipt references, and retain desktop/mobile layout with a horizontally scrollable reference quote table. Mode controls describe mandatory buy gates; they do not enable the unfinished trade panel.
- `apps/web/src/pages/terminal/Radar.tsx`, `apps/web/src/pages/terminal/radarModel.ts`, `apps/web/src/pages/terminal/radarModel.test.ts`: remove the conflicting Signal sorting control and computation. Replace the two old Signal-sort expectations with no-Signal-ranking assertions; preserve all non-Signal ordering, server Rank and unavailable-value sorting.
- `apps/web/src/pages/terminal/GuardCard.test.tsx`: synthetic level/gap/account/metric/legacy/optional-field/inert-text fixtures and integration assertions; prepares seven static visual fixtures when explicitly requested with `GUARD_VISUAL_DIR`.
- `docs/tasks/036-web-levels-report.md`: this handoff.

Followed Guard 2.0 §§1, 6, 7.1–7.2; FACTS §§6–7; FRONTEND §§3.0, 3.5, 7–9 and CA-31; BACKEND §7.7 and §§9.5–9.7/CA-34–35; MARKETING §§04–05. Read AGENTS including rule 9 and the gap analysis. Guard 2.0 supersedes conflicting legacy policy/label wording. Signal sorting contradicted both this packet and BACKEND §7.7 and was removed; its former tests were replaced with tests of the specified behavior. No existing test was skipped or weakened. No personal identifiers or real secrets were introduced or ported. No dependency/lockfile change. No new `TODO(spec)`; existing trade/execution and source-data gaps remain with their owning packets.

## Checks and checkpoint

| Exact command | Exit | Evidence |
|---|---:|---|
| `GUARD_VISUAL_DIR=/private/tmp/eko-036-visual pnpm --filter @eko/web exec vitest run src/pages/terminal/GuardCard.test.tsx src/pages/terminal/Coin.test.tsx src/pages/terminal/pending.test.tsx src/pages/terminal/availability.test.tsx src/pages/terminal/radarModel.test.ts src/lib/api.test.ts src/components/ui/ui.test.tsx src/pages/terminal/RadarParts.test.tsx` | 0 | Pre-final-fast-view candidate: 8 files / 68 tests; seven static visual fixtures prepared |
| `pnpm typecheck` | 0 | All workspace scripts; `/private/tmp/eko-036-typecheck-final.log`. Subsequent evidence-focus/fast-view adjustments were checked by the final web typecheck below; other packages unchanged |
| `pnpm --filter @eko/web typecheck` | 0 | Final candidate, including evidence-focus and fast-view regression |
| `pnpm test` | 1 | Initial concurrently loaded run; unchanged policy performance test measured p95 53.319916 ms against its strict 30 ms assertion; `/private/tmp/eko-036-test.log` |
| `pnpm --filter @eko/policy exec vitest run test/performance.test.ts` | 0 | 1 file / 1 test; timing reproduction passed in isolation with unchanged assertions |
| `npm_config_workspace_concurrency=1 pnpm test` | 0 | Full gate without concurrent typechecking: 2,448 Vitest tests plus contract unit/gas tests, web/server builds and role-image fixture checks; `/private/tmp/eko-036-test-final.log` |
| `pnpm --filter @eko/web test` | 0 | Final candidate: 36 files / 472 tests, including fast-view regression |
| `pnpm --filter @eko/web build` | 0 | Final web source build; `/private/tmp/eko-036-web-build-final.log` |
| `git diff --check` | 0 | No whitespace errors |

Full gate completed at source fingerprint `cfceb3fa9f0a81dab41576656b3fe8f4008981a3a277b8b4332c5d5fa48843e3`. The final candidate adds only the V1-issuer-error/fast-V2-assessment rendering condition and its regression assertion in Coin.tsx/GuardCard.test.tsx. Final web typecheck/test/build revalidate that adjustment; all other source files and package/dependency configuration are unchanged. The optional contract chain-fork test remained gated because its RPC environment was unset; no live-fork validation is claimed. Final web typecheck, complete web suite and build completed with exit 0. All task processes have finished. Next external action is browser-capable visual/interactive review, then lead review/commit through the existing process.

## Visual validation limit and reproduction

Fixtures cover Lower, Elevated with a lower-tier gap, High with a critical gap, Incomplete, shadow, candidate and legacy. Markup/assertion validation is synthetic and passed. Chromium could not launch inside this sandbox: macOS `bootstrap_check_in` returned `Permission denied (1100)` before any page rendered. This is an environment failure; no browser screenshot/layout or interactive desktop/mobile validation is claimed. Static fixture HTML is prepared, not visually accepted or released.

The attempted command (exit 1) was:

```sh
pnpm --filter @eko/web exec node --input-type=module -e 'import { chromium } from "@playwright/test"; const browser = await chromium.launch({headless:true}); const page = await browser.newPage({viewport:{width:390,height:844}}); await page.goto("file:///private/tmp/eko-036-visual/elevated.html"); console.log(JSON.stringify(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,gap:document.querySelector(".guard-gap")?.textContent})))); await page.screenshot({path:"/private/tmp/eko-036-visual/mobile-elevated.png"}); await browser.close();'
```

On a browser-capable checkout, regenerate with the focused command above. Open `/private/tmp/eko-036-visual/{lower,elevated,high,incomplete,shadow,candidate,legacy}.html` at 1440×1000 and 390×844. Inspect headline/gap prominence, wrapping, quote-table scrolling, metric evidence expansion, raw precision and disclaimer text. The static fixtures intentionally have no client event wiring. On the real app, check Safe/Balanced selection and synchronization with the sidebar, expansion/focus, explicit Copy text, retries, and retained prior results after a failed refresh. No port or network service was opened here.

## Remaining boundaries

- Visual/interactive validation above remains for a browser-capable environment; no screenshot or measurement exists from this sandbox.
- Scoring/calibration/coverage release gates remain unaccepted. Shadow/candidate displays do not affect orders. V2 list/Feed/bot/other compact consumers remain packet 037; Signal input computation remains 038; guarded execution remains its execution/UI packets.
- Real source collectors may leave card rows unknown. Existing response coverage is displayed without fabricating acquisition or outcomes. Legacy WS events trigger explicitly negotiated REST refreshes; no V2 payload is inferred from V1 data.
- Actual request units: **0**. Paid/provider acquisition cost: **$0**; pricing not applicable. No paid job, live-chain request, deployment, release, commit or push. Coverage described in this report is fixture/assertion coverage, not measured chain coverage.
