# Task 115 · Build Watchlist, alerts drawer and notification settings

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 03-FRONTEND §§3.11, 3.20, 5; BACKEND §23 CA-22/28.
Dependencies: 114, 117. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Replace /watch placeholder with grouped watches, add/remove and alert thresholds plus Telegram link. Reuse the shell alerts drawer and typed realtime client.
2. Connect Watch actions on Radar/coin/bags; optimistic removals roll back on errors. Hide Drop 2 crew and D0 push controls when their flags are off.
3. Test unauthenticated inline connect, optimistic failure, resync, alert within one second, empty/error states and mobile focus. All third-party labels use UntrustedText.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
