# Task 075 · Wire guarded v1 trade quotes and order creation

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§12.2–12.4, 15.1, 23 CA-7/8; Guard 2.0 §7.2.
Dependencies: 067, 068, 073, 074, 052, 090; 072 only for executable Pons and 071 only for executable v4. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add POST /trade/quote and POST /trade/order over the existing execution service, using shared TradeQuote/TradeOrder contracts and supported adapters. Persist ownership, checked inputs and quote expiry rather than relying on process-local permits.
2. Consume 052 account/size/route revalidation and 028 mandatory policy gates; do not reproduce their scoring or simulation logic. Enforce indicative versus bound quotes, per-quote warning acknowledgements, idempotent request-body matching and current trading access before returning unsigned calldata.
3. Test restart/replica quote lookup, duplicate and conflicting requests, quote age at 15 seconds, stale critical checks, fee-zero output and every refusal. Retained /api order callers must not bypass the new guard.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
