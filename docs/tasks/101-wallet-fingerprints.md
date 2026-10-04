# Task 101 · Compute Watcher features and likely-agent labels

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§5.2–5.5, 20; FACTS §3.
Dependencies: 100, 133; qualified control/service inputs from 043/046. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement the specified 14-day/200-swap features and pure fp-1.0.0 scoring from indexed actor/UserOp/delegation/router/timing data. Missing observations remain explicit; never infer agents from Guard risk bands.
2. Persist immutable model-version labels with precedence and confidence tiers, incremental changed-wallet updates and bounded replay. Reuse qualified graph/service evidence from existing Guard packets instead of constructing another funding graph.
3. Test all feature boundaries, same-second block timing, shared services, few-swaps cases, no-lookahead, model-version changes and reorgs. Candidate inference remains beta until the separate label precision evidence exists.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
