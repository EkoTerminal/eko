# Task 089 · Draft and serve launch policy pages

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 01-OVERVIEW §12; 02-MARKETING §§04–05; 03-FRONTEND §§2.2, 8; 05-GO-PLAN §7.
Dependencies: 005, 006; implementation truth from 075/092/116. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Write versioned terms, privacy, risk, AI disclosure, team trading, KOL and sanctions policy drafts and render /legal/:doc from them. State actual opt-in journal/deletion behavior, user signing, advisory brokerage checks and the 0% launch-week terminal fee.
2. Link policies throughout the existing shell and verdict surfaces, including the exact required disclaimers. Record owner policy approval as an external dated field due Oct 5, rather than describing draft text as approved.
3. Test known/unknown policy slugs, inert content, link coverage and claims/brand checks. Keep token-day fees/manual burns staged, avoid named team members and use placeholders for undecided public domain/contact details.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
