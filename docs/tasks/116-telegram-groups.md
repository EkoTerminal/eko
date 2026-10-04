# Task 116 · Build Telegram group scans and caller records

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §16; FACTS §3; 05-GO-PLAN §3.3.
Dependencies: 107, 111, 112; use 037 shared Guard copy. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Create apps/bots Telegram webhook with grammY only as named by the spec, validating webhook secret and deduplicating update ids. Parse contract addresses/tickers, return deterministic verdict image/text/record links and never store full group messages.
2. Persist first-caller-per-coin/group records, 24-hour grading against the launch cohort and a group badge/leaderboard using neutral identifiers. Unknown or immature results remain pending; implement /scan /bags /alerts /help as scans/link guidance.
3. Test duplicate updates, hostile text, ambiguity, privacy parsing, missing cards and pending caller outcomes with mocked sends. Document BotFather privacy configuration and /start disclosures; no wallet connect, trading, payments, Mini App or approval buttons.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
