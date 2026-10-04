# Task 099 · Implement OAuth token lifecycle and connector readiness

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§9.1, 20; FACTS §5b; BACKEND §23 errata v1.2.
Dependencies: 097, 098, 095, 096. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement code redemption, opaque audience-bound access tokens, rotating refresh tokens and revoke. Enforce single-use code/refresh comparison atomically; reuse revokes the whole grant. Store only HMACs.
2. Bind scopes to the grant agent and revoke both grant/key from Mission Control and data deletion. Test expiry, PKCE, client/redirect/resource mismatch, refresh races, scope-filtered tool lists and no cross-account token access.
3. Prepare/run the bounded Inspector and real claude.ai/desktop acceptance flow when authorized access exists: consent, verdict/preflight, expiry/refresh, revoke. Record actual evidence; keep MCP_OAUTH_ENABLED false and Pack.stage D0 if any check is pending. One session builds/tests the lifecycle; external client access is a separate completion signal.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
