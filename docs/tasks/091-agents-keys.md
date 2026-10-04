# Task 091 · Persist agents, presets and one-time harness keys

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§3.2, 9.1, 9.6, 21.4, 23 CA-18; 03-FRONTEND §§3.12–3.17.
Dependencies: 090, 028. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add API-owned agents, policies and agent_keys storage with owner-scoped list/create/detail/update/disconnect and key list/create/revoke routes. Apply presets at creation; GET policy and policy-presets work at T while editable policy PUT stays D0-gated.
2. Issue one-time eko_live keys, lookup by prefix and constant-time HMAC with HARNESS_KEY_PEPPER. Never persist/log clear keys; revoked keys cease authenticating. Publish agent events only to their account.
3. Test ownership, session/demo write denial, key shown once, revocation, concurrent agent limit enforcement and preset explicit-null semantics. Feed existing Mission UI with real schema-parsed data; keep advisory badges until separately reviewed enforcement exists.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
