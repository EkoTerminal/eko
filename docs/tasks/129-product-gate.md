# Task 129 · Complete the launch browser and contract integration gate

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 03-FRONTEND §13; 04-BACKEND §20; 05-GO-PLAN §§7–9.
Dependencies: 078, 096, 103, 108–121, 123–125, 128; OAuth only if 099 accepted. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Extend existing Playwright fixtures to the complete T route list against real isolated server data, at 1512x982, 1440x900, 1280x800 and 390x844. Include guarded paper/fork execution and ownership rather than using only offline mocks.
2. Exercise scan/share/bags, exact wallet approvals, refusals with zero wallet requests, Connect/preflight/private journal/deletion, watch alerts, receipt tamper, Census gating, policy links and all D0/Drop controls absent. Reuse Guard V2 visual evidence from 036/037 and unchanged valid tests.
3. Record candidate/browser/server revisions and exact outputs with console/accessibility/overflow results. Run the final product gate once on the stable candidate; pending fork/browser access blocks acceptance rather than being called a pass.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
