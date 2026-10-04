# Task 112 · Publish immutable Scoreboard counters and grades

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§7.5, 13, 18, 23 CA-15; 03-FRONTEND §3.8.
Dependencies: 076, 081, 051; forecasts only after 106. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement GET /scoreboard by kind with stable pagination, measured refused/missed counters and the real observation start. Consume confirmed guard misses, refusals and append-only corrections; do not count failed scans as refused fills or absent monitoring as zero misses.
2. Append grades and weekly cohort aggregates from accepted mature outcomes using all eligible launches with censoring and denominators. Preserve original receipts; consume Guard outcome labels from 051 without rebuilding its oracle.
3. Test a missed fill and correction, duplicates, immature/censored cases, cohort membership at known-at cuts and empty measured record. Milestone rows remain D0-gated and unavailable metrics render explicitly.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
