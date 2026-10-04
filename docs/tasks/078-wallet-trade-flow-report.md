# Task 078 implementation report

Prepared, uncommitted work on base `a9e6f9949d22ab16bfa75addf0bd8f56ed143edf`. Source/test candidate SHA-256: `5cf7fd8c1d4cc5eedc79374b811bba2e1582f5f3e9eeab74136a697b1dd8ff28`. `/tmp/eko-078-candidate.json` records sorted relative paths/content hashes; the candidate hashes compact sorted-key JSON of its `files` array, excluding this report. No dependencies, lockfile changes, migrations, server changes, Guard changes, specification edits or prototype edits. No personal identifiers or secrets were added or ported. No commit, push, deployment, publication, external messages or paid run.

Follows FRONTEND §§4.2–4.3, 6, 9; BACKEND §12.4; FACTS §7/shared CA-7 and the 075/076/077 handoffs. Reuses existing SIWE, chain-switch, idempotency, rejection detection, wagmi configuration and exact ERC-20 approval helpers. No wallet library was added.

## Changes

- `apps/web/src/lib/tradeFlow.ts`: React-free guarded flow with injected transport, wallet, storage and current identity/config reads. Rechecks account, chain 4663, bound quote, expiry/original request clock, admission, caps, symbolic fee destination, exact approval/spender and router/calldata/value before wallet requests. Refreshes before execution and after successful approvals. Changed fee bps, exit cost/impact above the relative 25% boundary, route or taxes require review; refreshed warnings require acknowledgement of their exact quote. Unknown wallet errors never assert that nothing was sent.
- `apps/web/src/lib/guardedTradeClient.ts`: runtime-validated `/v1` quote/order/submitted/rejected/detail interfaces and history resync. Missing 076 endpoints fail at this typed boundary. Guarded execution does not call legacy order endpoints.
- `apps/web/src/lib/trade.ts`: extract `approveExactToken` from the existing approval helper; guarded calls pin account/chain and revalidate immediately before wagmi, then await the successful receipt. Retained approval behavior is preserved.
- `apps/web/src/components/trade/WalletTradeProvider.tsx`, `apps/web/src/main.tsx`: install the adapter, recover matching authenticated journal scopes on reload/reconnect, subscribe to typed orders events and resync history/detail. Exclude old-identity feedback and prevent delayed reconnect/HTTP responses from restoring earlier order state.
- `apps/web/src/components/trade/TradeContext.tsx`, `TradePanel.tsx`, `tradePanelModel.ts`, and `apps/web/src/copy/trade.ts`: carry original request time; display refreshed disclosures/warning review, large-trade confirmation, sent/approval/unknown failure feedback and reconciliation status. Clear transient account/input state and ignore its late results. Preserve shared duplicate-tap locking.
- `apps/web/src/lib/tradeFlow.e2e.test.ts`, `trade-wallet.test.ts`: offline transport-to-flow-to-wallet-spy cases covering refusal, warnings, exact approvals/refresh/signing/actual-fill reconciliation, transaction mismatch, lost creation/submission/rejection responses, durable-storage flow reconstruction, identity changes, unknown submissions, storage failure and reconnect/confirmation races.
- `apps/web/src/components/trade/TradePanel.test.tsx`: preserve the exact handoff assertion and extend it with the original request clock. No tests, assertions or timeouts were weakened, skipped or deleted.
- `apps/web/e2e/guarded-trade.spec.ts`: seven prepared browser flow/wallet-spy fixtures. These use injected transport/wallet seams and reconstructed flow objects; they do not establish real injected-provider, actual browser navigation reload, or chain execution.

One scoped journal retains the exact quote/body/idempotency key before creation; lost creation responses retry that body/key. The signing stage is persisted before opening the swap wallet request. Reloads inspect that order and cannot sign again. A returned hash is saved before the submitted callback; explicit rejection callbacks can replay. Other identities' journals remain stored without replaying under the current account. Never-signed intents can retire on quote expiry; unknown wallet requests retain their recovery barrier. Submitted taps resolve without waiting for chain settlement. Only server orders events/detail supply confirmation and actual fill amounts.

## Verification

Commands run from the repository root:

| Exact command | Exit | Evidence |
|---|---:|---|
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web exec vitest run src/lib/tradeFlow.e2e.test.ts src/lib/trade-wallet.test.ts src/components/trade/TradePanel.test.tsx src/lib/trade-account.test.ts` | 0 | Final candidate, 4 files / 112 tests; `/tmp/eko-078-focused-final.log` |
| `pnpm --filter @eko/web typecheck` | 0 | Final candidate; `/tmp/eko-078-web-typecheck-final.log` |
| `pnpm --filter @eko/web exec playwright test e2e/guarded-trade.spec.ts --project=desktop --list` | 0 | Seven cases discovered; `/tmp/eko-078-browser-list.log`; discovery only |
| `pnpm typecheck` | 0 | `/tmp/eko-078-typecheck-final.log`; 57.23 seconds |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | All workspace suites, web/server builds and role-image checks; `/tmp/eko-078-test-final.log`; 469.87 seconds |
| `pnpm brand:check` | 0 | `/tmp/eko-078-brand-final.log`; 0.43 seconds |
| `pnpm check:addresses` | 0 | `/tmp/eko-078-addresses-final.log`; 0.44 seconds |
| `git diff --check` | 0 | No whitespace errors |

Focused development checks exposed acknowledgement preparation before the bound refresh and the exact handoff assertion's new clock field. These were corrected. Typecheck caught fixture contract annotations; those were corrected using the existing complete config fixture. Final focused coverage includes both concurrency regressions. No failure was hidden or addressed by weakening an assertion or raising a timeout.

## TODO(spec) and dependencies

1. New `apps/web/src/lib/tradeFlow.ts` TODO: CA-7 lacks a Permit2 verifying-contract/nonce/ABI binding. Permit2 and unsupported approval kinds stay unavailable until an accepted route contract supplies it. No signing payload or expiry is invented. Exact ERC-20 approvals are implemented.
2. New `apps/web/src/lib/guardedTradeClient.ts` TODO: 076 names detail/history without frozen response wrappers. This typed boundary expects GET `/trade/order/:id` → `{order}`, GET `/trade/orders` → `{rows}`, and submitted/rejected callbacks → `{order}`. Align this adapter with integrated 076 routes. This worktree contains 075 creation, not 076 server callback/detail/reconciliation implementation.
3. Existing 077 TODOs remain: CA-7 output quantities lack asset/decimals, GuardCheck lacks thresholds, CA-9 lacks venue-link allowlists and individual wallet caps. Raw units, supplied Guard values and configured caps/server refusals remain visible; quote-supplied links remain inert.
4. Accepted acquisition/routes and 076 reconciliation remain integration prerequisites. The default 075 backend stays unavailable; no execution acceptance or server release switch was activated. Existing wallet controls reuse `ensureChain`/`siweSignIn`; unmatched chain/session/account blocks trading.

All executed evidence is offline fixtures, runtime schema validation, wagmi spies, static panel checks and workspace verification. No listening port, real wallet, live account, fork execution, acquisition, deployment or approval was performed. Actual paid cost: $0; newly measured live/fork executions: 0; live acquisition units: 0. Existing suite meter counters/loopback attempts are synthetic evidence. Browser E2E execution is deferred because this sandbox has no network or ports. In a permitted browser environment reproduce prepared fixtures with `pnpm --filter @eko/web exec playwright test e2e/guarded-trade.spec.ts --project=desktop`. Real provider/fork and integrated 076 acceptance remain separate checks.

Long-job checkpoint: `/tmp/eko-078-checkpoint.json` records candidate, runner/process identifiers, exact commands, logs, durations, exits, cost and next action. All listed final gates completed with exit 0. Runner session 60674 completed with exit 0; no validation/acquisition process remains running. Source hashes match the manifest after verification. Next action: lead review and 076 integration, followed by browser/provider acceptance in a permitted environment. Work is prepared, tested and built; it is uncommitted, undeployed and not live-verified or externally approved.

Full-suite passing counts: shared 300, untrusted 275, signal 53, policy 327, web 618, playbooks 387, db 27, chain 316, engines 249, indexer 152, server 364, MCP 24. These are fixture/test counts, not code-coverage percentages or live coverage. No final gate failed, so no isolated failure retry was needed. Existing conditional fork checks were not activated and no skip was added.
