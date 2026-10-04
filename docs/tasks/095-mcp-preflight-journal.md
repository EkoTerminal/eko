# Task 095 · Persist preflight and journal MCP transactions

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§9.3, 9.6, 9.9, 20; Guard 2.0 §§1, 7.2.
Dependencies: 028, 052, 092, 093. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add preflight/journal handlers with one transactional path for stored order hash, policy version, decision, encrypted journal row and private receipt commitment. Force identity from the bearer; import the existing pure evaluate/resolveRepeat functions.
2. Enforce unique agent/clientOrderRef, final-result replay, conflicting-order refusal and complete needs_approval re-evaluation; at T requests requiring approval return approval_unavailable. Async missing actual-order checks return the 052 named denial/queue state.
3. Test concurrent duplicates and crash rollback, unchanged journalId on replay, foreign preflight reference, killed/stale/missing inputs, all mandatory buyer modes and journal opt-in. Measure cached server preflight p95 below 150 ms, distinguishing queue/RPC time.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
