# Task 109 · Serve private wallet bags and redacted public shares

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§15.1, 23 CA-6; 03-FRONTEND §3.7.
Dependencies: 090, 107, 035. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement owner-only GET /wallets/:address/bags from indexed holdings, pinned balances and measured card data. Trigger bounded scan work for missing cards and retain per-row unavailable/error status.
2. Implement explicit share creation and public GET /bags/:id from a persisted redacted snapshot. Default wallet/address and dollar values omitted; include only opted-in fields and round shared balances to two significant figures.
3. Test foreign-wallet requests, demos, unknown balances, retry/progressive scans and public response/cache leakage with both opt-ins independently toggled. User channels cannot reveal another account holdings.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
