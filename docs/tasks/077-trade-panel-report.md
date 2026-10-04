# Task 077 implementation report

Prepared, uncommitted web work on base `8fd5e5d4c55405eab84de44dc25d5e7e0a58165e`. Final source/test candidate SHA-256: `b2c60937cb0ad330770072d15e158b9378daf4da2c4116dbe864f197f2462cab`. `/tmp/eko-077-candidate.json` records sorted relative paths/content hashes; the candidate is SHA-256 of compact sorted-key JSON of its `files` array, excluding this report. No dependencies, lockfile, migrations, server code, Guard logic, specification or prototype changes. No personal identifiers or secrets were added or ported. No commit, push, deployment, publication, external messages or paid run.

Follows FRONTEND §§3.6, 4.3, 7–9; Guard 2.0 §§6, 7.2; FACTS §7/shared CA-7 contracts; existing 036 rendering and the 075 handoff. The approved `../app/src/components/trade/TradePanel.jsx` supplies the layout. Its local Guard interpolation and simulated success steps are replaced by typed server quotes and actual returned order statuses. Fees use the shared symbolic destination contract from 075 rather than inventing an address.

Changed files:

- `apps/web/src/components/trade/TradePanel.tsx`: the shared coin/Radar/Pairs panel and fixture-testable view, buy/sell, capped presets, custom USD amount, slippage, current mode, raw input/output/minimum/native value, fee bps/USD/tier/destination, taxes, size-specific exit cost, impact, route, block and execution/L1 network fee. Shared Guard rendering, per-quote warnings, admission/refusal states, neutral sells, real-funds and analysis/policy disclaimers. Small nonzero costs retain their value; token prices use the existing coin formatter. Quote-supplied external links never become actionable.
- `components/trade/tradePanelModel.ts`, `useTradeQuote.ts`: five-second visible refresh, document/intersection visibility, expiry and anti-snipe refresh, original request-clock age limit, cancellation/generation ownership, input-key invalidation and acknowledgement reset. Hidden/unmounted panels stop requests; expired responses cannot spin retries. Failed refreshes retain disclosure data while blocking execution. Recognizes 075 admission refusals delivered inside informational quotes as well as CA-8 errors.
- `components/trade/TradeContext.tsx`: typed `TradeAdapter`/`TradeHandoff` and a shared submission lock. The adapter receives the displayed quote, captured request and exact current warning codes. Rechecks the gate and age at the tap; refuses duplicate taps. No legacy execution caller is used. The default adapter is absent, so signing remains unavailable until 078 installs its flow.
- `components/trade/trade-panel.css`, `copy/trade.ts`: prototype-compatible panel styling and neutral copy, keyboard focus, semantic live announcements, touch targets, no trade motion, scrollable drawers and phone/tab/safe-area clearance.
- `pages/terminal/{Coin,Radar,Pairs,RadarParts}.tsx`: replace every disabled placeholder with the shared panel; pass stale/Guard state and anti-snipe clocks. Suppress inspector quoting behind a trade dialog. The collapsed coin sheet hides and makes the entire panel inert; users expand it to view disclosures before any trade action. A resize observer reserves the actual sheet height below the page.
- `mocks/transport.ts`: request-scoped offline quote fixtures for the selected coin/side/amount/account, valid expiry, zero terminal fee, no approvals or executable route, and explicitly unavailable execution checks.
- `components/trade/TradePanel.test.tsx`: 62 synthetic tests covering display/gating, fee bps/null destination, caps, warnings, input/clock changes, visibility/expiry/anti-snipe, cancellation, callback exclusion, shared locking, inert text, versioned Guard rendering, small prices/costs, mobile/accessibility rules and the fixture transport.
- `pages/terminal/{RadarParts,Coin}.test.tsx`, `pages/Legal.test.tsx`: replace obsolete placeholder expectations with the new unavailable/configuration behavior, preserving price formatting and exact disclaimer/policy coverage. No tests were removed or skipped; no assertions or timeouts were weakened.

Verification from the repository root:

| Exact command | Exit | Evidence |
|---|---:|---|
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web exec vitest run src/components/trade/TradePanel.test.tsx src/pages/terminal/RadarParts.test.tsx src/pages/terminal/Coin.test.tsx src/pages/Legal.test.tsx src/pages/terminal/GuardCard.test.tsx src/mocks/mocks.test.ts` | 0 | Final candidate, 6 files / 316 tests; `/tmp/eko-077-focused-final.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/indexer test test/performance.test.ts` | 0 | Isolated reproduction, 13 tests; `/tmp/eko-077-performance-final.log`, checkpoint `/tmp/eko-077-performance-checkpoint.json`, 56.87 s |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/engines test test/engines.test.ts` | 0 | Isolated reproduction, 64 tests; `/tmp/eko-077-engines-final.log`, checkpoint `/tmp/eko-077-engines-checkpoint.json`, 231.85 s |
| `pnpm typecheck` | 0 | Final candidate, all workspace packages; `/tmp/eko-077-typecheck-final.log`, checkpoint `/tmp/eko-077-typecheck-checkpoint.json`, 132.67 s |
| `VITEST_MAX_WORKERS=2 pnpm test` | 1 | Initial candidate; two timing failures, not a full pass; `/tmp/eko-077-test-initial.log`, checkpoint `/tmp/eko-077-test-initial-checkpoint.json`, 549.21 s |
| `pnpm_config_workspace_concurrency=1 VITEST_MAX_WORKERS=2 pnpm test` | 1 | Final candidate; policy p95 assertion failed; `/tmp/eko-077-test-final.log`, checkpoint `/tmp/eko-077-test-checkpoint.json`, 81.28 s |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/policy test test/performance.test.ts` | 1 | The entire failing file was rerun alone; p95 38.89 ms versus <30 ms; `/tmp/eko-077-policy-final.log`, checkpoint `/tmp/eko-077-policy-checkpoint.json`, 14.40 s |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test` | 0 | Final candidate, all 41 web files / 573 tests; `/tmp/eko-077-web-final.log`, checkpoint `/tmp/eko-077-web-checkpoint.json`, 10.54 s |
| `pnpm test:role-image` | 0 | Final candidate; web/server production builds and role images; `/tmp/eko-077-roleimage-final.log`, checkpoint `/tmp/eko-077-roleimage-checkpoint.json`, 40.48 s |
| `pnpm brand:check` | 0 | Final candidate; `/tmp/eko-077-brand-final.log`, checkpoint `/tmp/eko-077-brand-checkpoint.json` |
| `pnpm check:addresses` | 0 | Final candidate; `/tmp/eko-077-addresses-final.log`, checkpoint `/tmp/eko-077-addresses-checkpoint.json` |
| `git diff --check` | 0 | No whitespace errors |

The first focused run exposed fixture assumptions (the generic seed amount was $1, an apostrophe was HTML-escaped, and the CSS raw import was empty in this runner). These were corrected; the isolated panel reproduction passed 52 tests before additional coverage. Workspace typecheck then caught an unparsed new Guard fixture; it now uses the shared runtime schema. The final focused and typecheck checks above cover the final candidate. Earlier development logs/typecheck checkpoints remain in `/tmp/eko-077-reproduction.log`, `/tmp/eko-077-typecheck-initial.log` and `/tmp/eko-077-typecheck-pre-final-checkpoint.json`.

The first full gate ran against candidate `54d4e7d847e0c44743922bb440ff03cda38179a98e412e81ef870dc495145a2d`. It reported an indexer captured-block benchmark over its existing 20-second timeout and an engines durable-replay case over its existing 30-second timeout. Each entire failing file passed when rerun alone, without any source/assertion/timeout change to those packages. The final full gate used the final candidate and a per-command pnpm workspace concurrency of 1, verified with a small offline workspace fixture. The pnpm 11 setting is `pnpm_config_workspace_concurrency`, not the older npm prefix. This changes scheduling only; all suites and their existing checks remain enabled. The original full run is not claimed as verification of later web refinements. No global configuration was changed.

**Unresolved verification blocker:** the final full command stopped at `packages/policy/test/performance.test.ts:30`: p95 evaluation was 52.97 ms against its existing <30 ms assertion. Rerunning that entire file alone still failed at 38.89 ms. No policy/indexer/engines source or tests differ from the starting worktree. This failure cannot be claimed as an isolated passing flake. The full workspace gate remains red; server/MCP suites and the later workspace suites were not reached by that final run. No further unchanged retry, assertion relaxation, timeout increase or off-packet policy change was made. The next concrete option is lead/owning-packet diagnosis of the unchanged performance baseline in an environment with controlled contention, followed by the exact full gate. Web implementation, typecheck, focused web coverage and all-web coverage are verified independently above.

Every new `TODO(spec)` (all in `components/trade/TradePanel.tsx`):

1. CA-7 lacks output asset/decimals. Quantities are explicitly labeled raw units; no token quantity conversion is invented.
2. CA-7 `GuardCheck` lacks a threshold field. Display the supplied label/value and selected mode; do not infer thresholds or re-evaluate Guard locally.
3. CA-9 lacks a venue-link allowlist and per-wallet cap field. Do not use `quote.route.linkOut` or parse server prose. Display the configured launch cap and current cap/admission refusal. A typed allowlisted venue link and individual cap require contract-owner work.

The existing unrelated `TODO(spec)` notes for coin price/change fields, own-token identity and marker transaction identity remain. The obsolete M3 trade-placeholder TODOs were removed.

Remaining dependencies: production accepted acquisition remains unavailable (`sim_unavailable`) by default. Packet 078 must install `TradeProvider` with a `TradeAdapter` using its wallet flow, including re-quote/material-change confirmation, wallet/session/network checks, exact approvals/calldata and fee-destination checks. Packet 076 owns submission/rejection/reconciliation server-side. This packet displays the actual order status returned by the installed adapter; stream settlement integration belongs with that flow. It does not manufacture fills or claim live execution.

Evidence is offline fixtures, static React markup, scheduler/lock tests and source/CSS accessibility/clearance assertions. No listening port, browser screenshot baseline, live mobile layout/focus measurement or wallet/fork execution was run. Desktop/mobile visual and wallet acceptance remain integration checks in a permitted browser environment. Newly measured fork executions: **0**; live acquisition requests/units: **0**; actual charged cost: **$0**. Existing indexer/meter tests can log synthetic paid/public units; these are fixture counters, not billed observations or live coverage. No numerical code-coverage percentage, deployment acceptance or latency claim is established.

Reproduction: run the exact commands in the final verification table from the repository root. Local job logs/checkpoints use `/tmp/eko-077-*-final.log` and `/tmp/eko-077-*-checkpoint.json`. Next action is lead review of this uncommitted candidate and resolution of the policy performance blocker before the full integration gate; no release or external approval is implied.

Final checkpoint: `/tmp/eko-077-checkpoint.json`. Final candidate source hashes match the manifest. All validation commands have completed; no validation or acquisition process remains running. Web/server production bundles and fixture role-image checks passed independently; full workspace tests remain failed as described above. Prepared, tested and built work is uncommitted and has not been deployed, live-verified or externally approved.


## Integration resolution (integrate-c / task-077)

File-only merge resolution; git metadata remains untouched for the lead to stage and commit.

- `apps/web/src/mocks/transport.ts`: combine `createQuote` and trade request/response schemas with the existing alert settings, Telegram linking and telemetry imports. Keep all existing routes and append the request-scoped `/trade/quote` handler.
- `apps/web/src/pages/terminal/Coin.tsx`: retain the shared `WatchButton` and existing actions/features; add the incoming dynamic `--trade-sheet-clearance` style and retain the shared guarded panel, hidden/inert collapsed sheet and measured sheet height.
- `apps/web/src/pages/terminal/RadarParts.tsx`: retain the entire Watch section and replace only its adjacent disabled trade slot with `TradePanel`. Radar and Pairs use the same incoming shared panel.
- Add regression assertions in `Coin.test.tsx`, `RadarParts.test.tsx` and `mocks/mocks.test.ts` for Watch/trade coexistence, sheet clearance, and alerts/Telegram alongside quotes. The inspector's static-render test mocks its browser media-query hook, matching the existing Coin test setup. No existing assertions or timeouts were removed or weakened.

No server files, migrations, dependencies or lockfile changes; migration renumbering is not applicable. No files removed. Incoming additions are the six files under `components/trade/`, `copy/trade.ts` and this report. No new `TODO(spec)` was introduced; the incoming contract limitations and packet 078 adapter dependency above remain. Followed FRONTEND §§3.5–3.6, 4.3, 7–9 and FACTS §7; no specification edits.

Integration verification (offline; final source/test candidate except the initial failing test setup):

| Command | Exit | Result |
|---|---:|---|
| `pnpm typecheck` | 0 | All workspace typechecks; `/tmp/eko-int-c-077-typecheck.log` |
| `pnpm --filter @eko/web typecheck` | 0 | Final inspector-test mock setup; `/tmp/eko-int-c-077-web-typecheck-final.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test` | 1 | First integration run: 643 passed, one new inspector test required the media-query mock |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test src/pages/terminal/RadarParts.test.tsx` | 0 | Corrected setup, 8 tests; `/tmp/eko-int-c-077-focused.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test` | 0 | Final candidate, 47 files / 644 tests; `/tmp/eko-int-c-077-web-final.log` |
| `git diff --check` and `git diff --cached --check` | 0 | Both whitespace checks passed |
| Worktree text conflict-marker scan | 0 | No markers; binary files excluded |
| `pnpm_config_workspace_concurrency=1 VITEST_MAX_WORKERS=2 pnpm test` | 0 | All workspaces plus web/server production builds and role-image checks; `/tmp/eko-int-c-077-test-final.log`, `/tmp/eko-int-c-077-test-final.exit` |

The first integration full-gate runner was interrupted during engines, with no final exit/result; its partial log at `/tmp/eko-int-c-077-test.log` is not claimed as a full pass. Its session was unavailable after resuming. Source/test hashes were rechecked against `/tmp/eko-int-c-077-candidate.json` and were unchanged. The resumed full gate passed, including policy performance, engines (319 tests), indexer (153), server (417), web (644) and MCP (36). This successful integration gate supersedes the historical branch-candidate gate blocker above for this working tree. No test/assertion/timeout changes were made to those other workspaces. Browser/mobile visual acceptance, wallet execution, deployment and live verification are unverified.

The initial broad byte-level marker scan reported false positives from two existing PNG files (exit 1). The corrected text-only scan and `rg` search for `<<<<<<<` both passed (exit 0). No source conflict markers were present after resolution.
