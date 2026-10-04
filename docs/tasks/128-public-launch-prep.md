# Task 128 · Prepare T public repositories, bounty and transparency evidence

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 05-GO-PLAN §§3.5, 6.2–6.4, 9, 16; 01-OVERVIEW §12; 04-BACKEND §14.0.
Dependencies: 019, 081, 113, 089; consume independent review/tool reports when available. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Prepare file manifests/licences for public contracts, playbooks and receipts-verifier artifacts, candidate hashes and SECURITY/security.txt coverage. Use neutral role labels and domain placeholders; publication requires its explicit release instruction.
2. Prepare /transparency and /official links/pages with verified public project wallets/contracts only when supplied. State no token yet at T and distinguish receipts deployment from D0 review acceptance. Keep unknown public identifiers unresolved.
3. Build the Oct 13 13:00 to Oct 16 13:00 public-window/bounty checklist and unresolved findings table, correcting inherited Oct 5–8/D0-only deadlines in review handoff documentation. No live bounty, completed review or bytecode/deploy claim without actual evidence; D0 sign-off is Oct 18.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
