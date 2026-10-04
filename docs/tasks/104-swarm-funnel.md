# Task 104 · Implement naive-view Swarm funnel and vote validation

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§8.1–8.4; 01-OVERVIEW §06; 04-BACKEND §20.
Dependencies: 035, 041, 102. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement the pure funnel, versioned persona definitions and naive-view snapshot hash. Do not insert true-view Guard reasons into the naive view; unavailable required funnel fields prevent model scheduling.
2. Add strict VoteBatch runtime schemas and validation of snapshot/block/persona echo, size/action consistency and bounded output. Token text remains delimited Untrusted data; scoring never grants permission.
3. Test every funnel threshold, stale/malformed/contradictory batch, duplicate/missing personas and hostile text. Preserve beta markers and keep swarm_ranking off.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
