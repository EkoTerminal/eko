# Task 105 · Run capped Swarm inference and receipt-backed forecasts

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§8.3–8.5, 8.8, 18; FACTS §3.
Dependencies: 104, 079; reuse existing provider registry and budget modules. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement queued adaptive 10-to-50 sampling, content-hash cache and OpenRouter-first/PPQ fallback using the existing provider interfaces. Verify model slugs as an operator input; absent configuration disables inference.
2. Persist votes, inference runs/rejections, model/persona versions, spend and forecasts with immutable receipt outbox records. Enforce SWARM_ENABLED and daily/per-coin budgets across restarts; forecasts cannot begin their outcome window before anchoring.
3. Test cache, budget races, provider failover, invalid votes and both-provider outage. Rules Fast Scan stays available; no model output affects Guard or Radar order. Live calls require the existing approved budget.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
