# Task 081 · Serve receipt proofs and independent verification data

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§13, 23 CA-16; 03-FRONTEND §3.8.
Dependencies: 080, 034; private read access depends on 092. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement GET /receipts/:id with pending/anchored states, exact leaf/proof/root/batchId/tx/block and versioned public payload after its reveal window. Verify the item binding against its actual registry event.
2. Preserve private items as commitments only unless explicit owner reveal is authorized. Keep POST reveal behind its D0 stage; no journal payload or salt appears in public responses or metadata.
3. Test tampered payload/proof/root/event, unknown batch, uncommitted item, old V1 and current V2 fixtures, reveal-window timing and foreign-account access.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
