# Task 125 · Provide production-refused v1 fixture injection

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §23 CA-27; 03-FRONTEND §13.
Dependencies: 090; producer interfaces for each implemented fixture kind. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add POST /dev/fixtures/:kind for specified card/verdict/marker/pair/feed/journal/approval/order/burn fixtures through their owning producer services. ENABLE_DEV_ROUTES is required; production refuses registration even if set.
2. Validate shared schemas, neutral synthetic data and isolated dev storage. Flagged D0 kinds must remain absent when their feature is off, and unavailable producers report missing capability.
3. Test production refusal, schema validation, owned journal injection and typed WS propagation. Do not fabricate launch observations or bypass single-writer rules for convenience.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
