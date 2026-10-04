# Task 113 · Port Scoreboard and browser receipt verification

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 03-FRONTEND §3.8; 04-BACKEND §13; prototype trust/Scoreboard.jsx.
Dependencies: 112, 081, 024; V1/V2 proof fixtures owned by 034. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Port ../app/src/pages/trust/Scoreboard.jsx to /scoreboard with equal refused/missed headlines, misses first, original/correction links, measured cohorts and immature/unavailable states. Do not port its sample track record.
2. Build /receipt/:id and reusable receipts-verifier browser module: JCS payload hash/leaf, proof fold and keyless on-chain registry root/event check. Disable verify until anchoring; private items show commitment-only copy without requiring public payload.
3. Test each tamper stage, swapped batch/tx, V1/V2 fixtures, pending/unknown receipt, inert JSON and mobile layouts. Prepare public verifier packaging without publishing or adding dependencies not named by the spec.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
