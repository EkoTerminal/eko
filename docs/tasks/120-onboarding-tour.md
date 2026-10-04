# Task 120 · Adapt the nonblocking T onboarding tour

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 03-FRONTEND §§3.21, 4.1, 7.5; 23 CA-10.
Dependencies: 108, 110, 078, 096, 119. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Offer the existing tour engine after the first scan result through a nonblocking pill; use the specified scan/verdict/playbook/marker/card/fee/trade/mode/mission/wallet anchors only where implemented.
2. Implement the five checklist actions and OR-merge local progress with account preferences; preserve eko.onboarding=off for tests and reduced-motion behavior.
3. Test reload/sign-in merge, absent/gated anchors, account switch, keyboard dismissal and no welcome modal before value. Proposed Simple/Pro and /learn remain unscheduled and are not added.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
