# Task 083 · Prepare reproducible Railway staging and rollback

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §19; 05-GO-PLAN §§4, 7, 9; task 017 lead deployment handoff.
Dependencies: 082; include 075/080/093/116 when available. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Create repo-local Railway staging service definitions/runbook for web/API, Postgres, indexer, engines, single reconciler, MCP, receipts and bots/OG; keep Anvil private on a compatible host. Pin one candidate revision and document TLS/origin/WS routing, migrations and health checks.
2. Use secret names/placeholders only and default trading ceilings/ops off. Document separately authorized provisioning and deployment commands, service resource limits and migration/rollback ordering; rehearse rollback in an isolated environment with a target under ten minutes.
3. Validate manifests and boot smoke scripts; record actual deploy URL/revision/health/migration evidence only after an authorized run. // TODO(spec): Railway is requested for staging; production remains Vultr/BitLaunch per the launch spec until an explicit decision changes it.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
