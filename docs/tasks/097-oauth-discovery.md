# Task 097 · Implement MCP OAuth discovery and client registration

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §9.1 BE-3; 23 errata v1.2.
Dependencies: 093. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement protected-resource metadata at both specified paths, authorization-server metadata and DCR with public clients and exact callback allowlists. Store OAuth client/request rows under MCP ownership and rate-limit registration.
2. Validate authorize response type, client, redirect, S256 challenge, state, scopes and resource before creating a ten-minute request and redirecting to consent. Treat client names as Untrusted; support verified metadata-document clients without arbitrary URL fetching.
3. Test discovery challenge, invalid redirect/resource/PKCE, expiry and registration limits. Keep MCP_OAUTH_ENABLED=false until 099 real-connector evidence passes; failure selects the documented D0 fallback.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
