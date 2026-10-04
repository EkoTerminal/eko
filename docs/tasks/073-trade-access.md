# Task 073 · Enforce runtime trading switches, allowlist and launch caps

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§12.4, 21.4, 23 CA-7/8/9; 05-GO-PLAN §§8–9.
Dependencies: 010, 026, 028. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add trading_allowlist and authenticated admin maintenance with audit records; parse TRADE_CAPS_FILE and expose the effective cap, verified routers and spenders through config.
2. Enforce LIVE_TRADING_ENABLED AND trading_live, beta membership and per-wallet $25/$100 caps, then the T $250 schedule. Treat the 72-hour $1,000 step as a release action conditional on clean evidence; document how to hold the lower cap.
3. Test runtime cache changes, ceiling off, demos, non-admin writes, lower per-wallet overrides, over-cap orders and 72-hour boundaries. Quotes remain visible; every refused order produces no unsigned executable transaction.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
