# Task 114 · Persist watches and deliver owner-scoped alerts

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: FACTS §7; 04-BACKEND §§15.3, 23 CA-28; 03-FRONTEND §3.11.
Dependencies: 090, 102; actual verdict changes from 035. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add account-owned watches and alert settings plus GET/POST/DELETE /watch and GET/PUT /alerts/settings. Coin/wallet targets work at T; reject crew targets until Drop 2 rather than enabling their route early.
2. Consume confirmed verdict/playbook/flow events and persist deduplicated alert delivery records with account-scoped WS. Honor thresholds and user preferences; retain retry/cursor state for Telegram notification consumers.
3. Test ownership, reconnect/resync, duplicate source events, verdict correction, removed watch and agent-trade threshold. Measure websocket alert latency against the one-second target without inventing source events.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
