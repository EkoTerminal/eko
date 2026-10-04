# Task 132 · Verify and implement the Klik launchpad adapter

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§4.3–4.5; 01-OVERVIEW §06.
Dependencies: 016, 024, 027; versioned partial cards from 029/035. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Verify Klik registry/deployment/event fragments against pinned fixture sources using the existing launchpad interface. Store provenance without owner identities or paid endpoint values.
2. Implement supported launches/trades/migrations and recent address/topic-filtered backfill; partial cards remain neutral when unsupported risk inputs are absent.
3. Test replay/reorg, unknown ABI, emitter validation and shared response masks. Report support explicitly; no automatic execution route or claim that all launchpads are covered.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
