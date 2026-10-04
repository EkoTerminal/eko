# Task 067 · Generalize v3 quotes and unsigned route construction

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§6.1, 12.1–12.3; FACTS §7 CA-7 in BACKEND §23.
Dependencies: 016, 024. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Extend the existing v3 adapter beyond its fixed ETH/USDG market to indexed coin pools on 4663. Read decimals and verified registry addresses; compare supported fee tiers by net output at one pinned block.
2. Build exact-input buy/sell legs, raw amountIn, minOut, valueWei and networkFeeUsd for TradeQuote. Keep terminal fees zero through T; no destination or fee leg when bps is zero. Leave unverified router functions unavailable.
3. Test both directions, decimals, no pool, missing price, slippage and encoded recipient/value/amounts with injected clients. Preserve heritage fork coverage; report the exact pinned fork command for the lead.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
