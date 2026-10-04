# Task 079 · Persist immutable public receipt items

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§3.2, 13; Guard 2.0 §7.3.
Dependencies: 019, 034. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Create receipts-owned receipt_items/receipt_batches storage and an idempotent enqueue interface over immutable public verdict/forecast revisions. Reuse 034 raw payload hashes and shared leaf encoding; distinguish recorded from anchored references.
2. Enqueue every newly published output transactionally or through a durable producer outbox, including same-block revisions and corrections. Preserve model/rules/schema/snapshot/window metadata and reorg/supersession references.
3. Test crash between producer persistence and enqueue, duplicate input, altered input, rounded display versus raw payload and replay recovery. Do not enqueue an invented forecast or rewrite an old payload.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
