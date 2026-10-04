# Task 118 · Prepare evidence-backed Ghost Report drafts and app records

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 02-MARKETING §07 Ghost Report; 05-GO-PLAN §7 Oct 3; FRONTEND §3.2; Guard 2.0 §§6–7.
Dependencies: 035, 037, 081, 111; consume 057 verified incident manifest when applicable. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Create immutable Ghost Report draft records from actual supported engine evidence with contract/tx/receipt/rules/coverage references, named missing checks and correction links. No person attribution or inference of guilt from exemptions/clones alone.
2. Expose reviewed records for Radar strip/Feed and generate deterministic share drafts using the existing Guard reason adapter. Human fact approval is required before a report is treated as verified; pre-T output says from the pre-release engine.
3. Test rejected/partial evidence, updated guard assessment, correction preservation and no personal identifiers. Deliver a reviewable first draft only if real evidence exists; otherwise provide the concrete evidence requirement. No automatic social posting in this packet.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
