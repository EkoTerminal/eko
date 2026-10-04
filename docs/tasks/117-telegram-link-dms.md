# Task 117 · Link Telegram notifications to SIWE accounts

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §16, 23 CA-22; 03-FRONTEND §3.11.
Dependencies: 090, 114, 116. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement POST /telegram/link issuing an expiring one-time account-bound start code; redeem in DM, enforce linked identity uniqueness and allow unlink. The bot only sees the link code and public scan targets.
2. Consume owner alert delivery records with deduplication/retries and deterministic DM notices linking to web. D0 approvals remain dark; leave notification interfaces prepared without registering approve actions.
3. Test expired/reused/foreign codes, account relink, duplicate sends and unlink cancellation. Verify descriptions/start include required analysis and non-affiliation text; real messages require separate authorization.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
