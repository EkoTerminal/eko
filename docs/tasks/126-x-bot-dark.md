# Task 126 · Prepare X summon bot with transport disabled at T

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §16; 05-GO-PLAN §§3.2, 8, 11.5.
Dependencies: 116, 111, 037. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement the X mention cursor/parser, interaction deduplication, card upload/reply and three-per-user/hour plus daily/monthly spend limits with the spec API. Responses use deterministic text/images, one per interaction and no links.
2. Gate polling and all sends on summon_x; at T flag-off means zero platform reads/writes. Prepare separately gated burn_board posting interface without enabling or implementing D0 burn collection here.
3. Test restart cursor, duplicate mention, exhausted budget, 401/403 stop and flag toggles with fake transports. Record account automated-label/credentials/spend-cap setup as external readiness; no account mutation, purchase or posting in this packet.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
