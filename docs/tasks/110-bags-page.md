# Task 110 · Port Scan my bags and shared bag reports

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 03-FRONTEND §3.7, 4.1, 4.8; prototype terminal/Bags.jsx.
Dependencies: 109, 077, 078; Guard display adapters from 037. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Port ../app/src/pages/terminal/Bags.jsx layout/interactions into /bags and /bags/r/:id using typed real data, not prototype sample identities or prices. Include connect/empty/progressive/per-row-error states and the mobile sticky Share action.
2. Wire Sell through the guard to the shared sell panel and Watch to its service when available; public share page works without a wallet. Values and wallet identity require separate explicit opt-ins.
3. Test redaction and preview parity, accessible disclosures, retry and mobile layout at the existing four viewport sizes. Ensure pending/incomplete is not counted as a confirmed playbook match and never copies the prototype fee assumptions.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
