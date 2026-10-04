# Task 134 · Generic pool position and LP custody observations

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§6.1, 6.3; Guard 2.0 §3.4.
Dependencies: 021, 027, 069; 041 owns depth and 042 owns the known Pons successor. This packet covers acquisition or integration outside the existing Guard packet ownership.

## Do

1. Collect indexed non-Pons v3 position ownership, liquidity-removal rights and verified locker expiry at a pinned block; support only registry-verified lock contracts and expose unknown custody explicitly.
2. Feed validated position/removability observations to 041 without implementing its solver or scoring. For unsupported generic v4 positions, publish a named gap; never use aggregate PoolManager balances.
3. Test transferred positions, partial removal, expired versus active locks, burned versus locked custody and unknown locker code. Bound acquisition to requested pools with injected clients; report unresolved real-fixture coverage.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.

