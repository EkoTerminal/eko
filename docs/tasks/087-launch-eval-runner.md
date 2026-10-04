# Task 087 · Assemble stage-aware launch evals and CI evidence

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §20; 05-GO-PLAN §§1, 7–9.
Dependencies: existing deterministic suites; 068/075/080 for B; 093–096/129 for T; consume 061–063 unchanged. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add an eval runner and CI manifest that records exact candidate revision, fixture/dataset/config hashes, commands, exit codes and pending/skipped suites. Select Gate B and Gate T suites independently; ingest Guard acceptance reports rather than refit or rerun their datasets.
2. Run pinned Normalizer/execution/receipt/harness/injection/latency/product suites with their spec pass bars. Inventory 200+ genuinely labeled block-pinned coins by class, preserving gaps instead of fabricating labels; scheduled model generation uses only approved provider budgets.
3. Test runner failure propagation, optional quote-only v4 handling, missing fork/label data and zero honeypot fills with a real observed denominator. Add nightly application/CI scheduling and retain red reports; prepared runner code alone does not certify either gate.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
