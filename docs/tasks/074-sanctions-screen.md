# Task 074 · Add sanctions refresh and quote/order screening

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§12.2, 12.4, 18; 05-GO-PLAN §7 policy checklist.
Dependencies: 073. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement the daily OFAC digital-currency-address refresh into a worker-owned versioned dataset using the spec source, preserving the last complete snapshot on refresh errors.
2. Expose a single screening service for quote and order creation; refuse listed wallets with the shared error shape and generic served copy. Record dataset freshness and refresh failure without logging private account context.
3. Test parser fixtures, address normalization, listed/unlisted cases and failed/partial refresh behavior. // TODO(spec): the spec gives no sanctions snapshot maximum age; document the conservative refusal policy for an absent usable snapshot.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
