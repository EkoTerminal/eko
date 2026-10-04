# Task 098 · Build SIWE connector consent and agent grants

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §9.1 BE-3; 03-FRONTEND §3.17; BACKEND §23.
Dependencies: 090, 091, 097. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add GET /oauth/requests/:id and POST /oauth/consent with API-owned grants/codes and the /oauth/consent web page. Show sanitized client name, validated redirect host and scopes; choose or create an owner-scoped agent within limits.
2. Require a SIWE session authenticated within one hour, required senses:read/preflight/journal scopes and explicit approve/deny. Mint one HMAC-stored one-time code and an oauth-kind agent key with exact request/account/resource binding.
3. Test foreign requests/agents, expired session/request, double consent, concurrent agent creation and deny redirect/state handling. Set frame-ancestors none on consent; token delivery/rotation belongs to 099.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
