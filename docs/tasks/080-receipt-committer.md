# Task 080 · Run recoverable five-minute receipt commits

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§1.2, 13, 18; 05-GO-PLAN §6.1.
Dependencies: 079, 019, 024. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement APP_ROLE=receipts as a single leased worker: seal eligible queued items into a deterministic tree every five minutes, persist the exact batch and send only ReceiptsRegistry.commit using its gas-only committer key supplied from secrets.
2. Extract sequential batchId and committer from the actual BatchCommitted event; bind txHash/block/root/count. Recover pending transactions before retry, handle rotation and reorgs, and never mistake another committer transaction for this batch.
3. Test fixture proofs, two-worker exclusion, shutdown/restart around broadcast and confirmation, junk batches, failed RPC and rotation. Measure commit lag; a missing two-window heartbeat alerts. Real deployment/signing is a separately authorized operator step.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
