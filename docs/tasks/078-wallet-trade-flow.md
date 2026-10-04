# Task 078 · Connect guarded orders to wallet signing

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 03-FRONTEND §§4.2–4.3, 6, 9; 04-BACKEND §12.4.
Dependencies: 076, 077, 090. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Wire quote/order creation, exact approval confirmation, refreshed quote, user swap signature, submitted/rejected callbacks and reconciliation feedback through /v1. Validate account, chain 4663 and config router/spender allowlists before each wallet request.
2. Preserve an idempotency key across retries of one order, show whether anything was sent on failures and clear state on account/chain changes. Keep user signing in the wallet.
3. Add focused wallet-spy E2E cases: hard refusal/paused/not-allowlisted/quote-only makes zero wallet requests; warning requires acknowledgement; approved clean trade confirms and reconciles; rejection/reload recovers without duplicate orders.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
