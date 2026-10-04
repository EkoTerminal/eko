# Task 127 · Prepare Farcaster summon bot for Oct 16 readiness

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §16; 05-GO-PLAN §§3.4, 11.5.
Dependencies: 111, 116, 037. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement verified Neynar mentions webhook validation, interaction deduplication and deterministic image/record-link replies using a managed signer UUID, never a custody key.
2. Gate all reply transport on summon_x and default off. Prepare the Oct 16 readiness checklist for bot FID/custody/managed signer/account disclosure; D0 activation remains separate.
3. Test replay, wrong FID, invalid webhook, failed managed signer and flag-off zero sends. No unsolicited casts, account creation, signing or external messages in this session.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
