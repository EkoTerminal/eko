# Task 102 · Publish measured flow, markers and gated Census reads

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§5.5–5.7, 15.3, 23 CA-3/14; 03-FRONTEND §§3.0, 3.5, 3.9.
Dependencies: 100, 101, 035; crew membership from 046/047. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Compute Watcher-owned 5m/1h/24h buy-USD mix and wash estimates with point-in-time labels; keep unresolved sender/price mass unavailable rather than treating it as human or zero.
2. Wire card/list flow and coin markers plus flow WS, Feed agent/crew events and GET /census. Apply label precedence without double-counting; gated Census responses contain methodology/model/gate status without headline numbers.
3. Test window boundaries, swaps with pending enrichment, declared/likely split, partial crew coverage, unavailable lists, WS coalescing and historical label changes. Publish beta/confidence on every pre-gate flow surface; keep Drop 1 MCP tools absent.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
