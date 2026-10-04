# Task 092 · Implement encrypted journal storage and data deletion

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§3.2, 3.5–3.6, 9.9, 23 CA-30; FACTS §7.
Dependencies: 091, 079. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement wrapped per-user DEKs and AES-256-GCM entry encryption with id/agent AAD, JCS payload and fresh per-entry salt. Only commitments enter receipt_items; persist journal opt-in and limit payloads to 16 KB.
2. Add owner-only paginated journal reads and DELETE /me/data: destroy wrapped DEKs before deleting harness rows, revoke keys/grants and preserve only permitted public commitments. share=true writes de-identified bucketed ground truth through a declared writer interface.
3. Test ciphertext swap/authentication failure, cross-account denial, wrong KEK, salt uniqueness, deletion/retry and restored backup unreadability after key destruction. Define how destruction tombstones survive restore; no private data in logs/telemetry/OG.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
