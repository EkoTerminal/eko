# Task 088 · Prepare beta and product release checkpoints

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 05-GO-PLAN §§1, 8–10, 13, 16; 04-BACKEND §§12.4, 20–21.
Dependencies: 073, 076, 083–087, 089; T evidence from 129 and applicable 061–063. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Write a candidate-bound Gate B/Gate T checklist and beta daily evidence form: team $25 first, users $100 next, public $250 only after Oct 12 acceptance, and conditional cap increase after 72 hours.
2. Provide bounded scripts/checks for the Oct 13 smoke list, post-fill monitoring, error/spend/latency summaries and rollback; reuse completed gate evidence when the candidate is unchanged. A miss disables trading and fails the gate.
3. Record go/no-go, no open Sev 1/2, on-call role coverage and the next external step. Do not invent beta fills or approval. Keep D0 go/no-go Oct 18 distinct from token day Oct 20; elapsed observation and owner sign-off are separate requirements.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
