# Task 076 · Reconcile v1 orders and detect post-fill guard misses

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§12.4, 18, 23 CA-7; 05-GO-PLAN §13.1.
Dependencies: 075, 079; receipt publication can remain pending until 080. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add submitted/rejected/order-history/detail routes with owner checks and typed orders WS events. Extend the single reconciler to the supported route set; match actual sender, chain, target, calldata and value before accepting a fill.
2. Use decoded actual fill amounts instead of quote estimates for EKO orders. Run the post-fill sell check and persist its evidence; an observed guard miss disables trading_live, records a durable incident and queues the miss/post-mortem record for 112.
3. Test spoofed txs, reverts, missing swap logs, duplicate confirmations, post-fill sell failure and repeated incidents. Assert the switch changes within its cache interval and public orders cannot leak between accounts.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
