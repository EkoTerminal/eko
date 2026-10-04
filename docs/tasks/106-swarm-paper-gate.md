# Task 106 · Build Swarm paper fills and calibration reporting

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§8.6–8.7, 20; 01-OVERVIEW §06.
Dependencies: 105, 068, 040, 080, 102. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Reuse simulation and heritage position accounting for 2–10-second delayed paper entries, persona exits and immutable grades with taxes/costs. No-lookahead and failed entries/exits remain visible.
2. Implement baseline comparison, reliability slope and bootstrap Brier difference report over the prescribed >=500 coins and >=14 days. The paper result can be beta; ranking stays off before acceptance and never uses an uncommitted forecast.
3. Test delayed state, cost accounting, snapshot cutoff, missing prices, provider censorship and gate denominator checks. Deliver the resumable runner and report actual elapsed coverage; fixtures are not a 14-day calibration pass.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
