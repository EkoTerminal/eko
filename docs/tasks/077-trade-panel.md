# Task 077 · Replace trade placeholders with the shared guarded panel

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 03-FRONTEND §§3.6, 4.3, 7–9; Guard 2.0 §§6, 7.2.
Dependencies: 036, 075; share the panel across the existing 008/014/015 screens. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Port the approved prototype trade layout into one typed TradePanel for coin, Radar and Pairs. Render buy/sell, amount presets, slippage and all quote fee/tax/cost/route/minimum/network lines, using current shared Guard rendering.
2. Requote every five seconds while visible and at anti-snipe expiry; clear warning acknowledgement on quote replacement. Render connect, stale, expired, paused, allowlist, cap, refusal and quote-only states without actionable buy/sell on refused paths.
3. Test every state, display of quote.bps and null destination, presets above cap, acknowledgement reset, focus/reduced-motion and mobile sheet clearance. Use neutral copy and the required real-funds and analysis disclaimers.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
