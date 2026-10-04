# Task 096 · Generate T harness packs and connection tests

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §9.11, 23 CA-19; 03-FRONTEND §3.17; 05-GO-PLAN §§8–9.
Dependencies: 091, 094, 095. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Create one pack.yaml and deterministic packs:build generation for Claude Code and generic MCP plus connector metadata. Serve GET /packs and generate configTemplate with MCP_URL/API_KEY placeholders; keep connector D0 when OAuth readiness is false.
2. Include spec preflight-before-order/session-journal/Untrusted/advisory instructions and guidance to check brokerage approvals are on. Wire existing Connect UI to real packs, key creation and first authenticated journal event.
3. Run scripted local sessions with a fake upstream place_order; every emitted order needs matching allow, forced denial stops, approval-unavailable never loops and journal persists. Do not store upstream credentials or activate D0 packs.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
