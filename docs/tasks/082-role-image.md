# Task 082 · Package one image with explicit launch role dispatch

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§1.2, 2.1, 19; 05-GO-PLAN §4.1.
Dependencies: existing 017/022/023/025; executable handlers from 080/093/116 as they land. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Update image inputs to include every required workspace manifest before frozen installation, build the needed apps and include both migration sets and registry assets. Add a closed APP_ROLE dispatcher with exactly-one-worker semantics.
2. Support existing api/indexer/engines and wire new mcp/receipts/bots/og roles only to implemented entry points. Unknown or unavailable roles fail startup; no role silently launches the API or enables trading.
3. Exercise image build and role startup/shutdown against isolated Postgres when available; verify API replicas use RUN_WORKER=false, production refuses PGlite and secrets are runtime-only. Report any clean frozen-install failure separately.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
