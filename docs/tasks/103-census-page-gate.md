# Task 103 · Build Census methodology page and label gate evidence

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §5.7; 03-FRONTEND §3.9; 05-GO-PLAN §§7, 16.
Dependencies: 102; reviewed labels supplied independently. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Replace /census placeholder with methodology, label definitions and gate-aware rendering; gated state has no numeric headline or chart placeholders. Ungated data cites the accepted model version and required disclosures.
2. Add a label-evaluation importer/runner for held-out declared wallets and the specified 200 agent/300 human two-reviewer sets. Store precision and Wilson lower bound, recall and model/dataset hashes in eval_gates; do not repurpose Guard buyer-harm labels as agent truth.
3. Test gated/ungated DOM, expired/version-mismatched gate and synthetic importer disagreements. One session builds the page/runner; actual independent labels and >=90% precision remain external work, and gated methodology can ship without them.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
