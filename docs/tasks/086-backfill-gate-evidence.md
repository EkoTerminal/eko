# Task 086 · Verify launch backfills and historical coverage

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§4.3, 7.5; 05-GO-PLAN §7; Guard 2.0 §§8.3, 9.3.
Dependencies: 017, 021, 025, 065, 066; consume 048/057 for Guard-specific acquisition and incident evidence. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Create a bounded verifier for Phase A genesis Pons/registry ranges, Phase B recent pools/swaps/holders/candles and Phase C declared coverage or the seven-day/candidate fallback. Check gaps, leases, duplicates, reorg status and exact minted/burned balance reconciliation.
2. Consume the existing Guard acquisition manifests rather than run another collector. Report the verified 53-launch manifest status, clone fixtures and 50 deployer-history comparisons; absent manifest/human review remains unresolved.
3. Run on available local data and save range/count/hash/checkpoint evidence. List approved-budget commands for remaining live checks and measured follower catch-up/head lag. A 200k-block replay is not genesis coverage or a complete 30-day backfill.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
