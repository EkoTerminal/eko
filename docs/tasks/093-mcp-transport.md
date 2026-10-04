# Task 093 · Create authenticated Streamable HTTP MCP transport

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§9.1–9.4, 21.4; FACTS §7.
Dependencies: 091. Deliver an injectable registration interface; 094/095 consume it later and do not block the transport packet. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Create apps/mcp with the spec-named MCP transport/SDK only if needed, registering POST /mcp and required transport methods. Resolve each bearer key to exactly one active agent/account; never trust an incoming agentId.
2. Apply per-key limits, launch-week entitlements, allowed tools and typed templated content plus structuredContent and the Untrusted notice. D0/Drop tools are absent when unavailable; OAuth-disabled metadata must not suggest a working connector.
3. Test invalid/revoked keys, agent spoofing, malformed protocol messages, rate limits, tool discovery and process shutdown. Use fake secrets supplied at runtime and redact headers; update lockfile offline for any new workspace declarations.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
