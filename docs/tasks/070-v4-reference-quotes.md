# Task 070 · Add v4 reference quotes and simulation with quote-only fallback

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§6.1–6.2, 12.1, 20; FACTS §§3, 5b.
Dependencies: 026, 027, 067, 068; use per-pool custody from 042 for Pons successors. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Build verified PoolKey/PoolId quote and probe legs for one supported v4 route through its real hook; compare quote and actual simulated output, keeping unknown hooks unsupported.
2. Persist per-size costs and hook evidence with isolated state; expose route.executable=false until the separate executable fork gate passes. Use config venue-link allowlists for graduated Pons fallback.
3. Test clean hook, quote/simulation mismatch, asymmetric fee, sell restriction and missing successor state. Record actual ABI/fork capability results; neither a v4 Initialize fixture nor a quote proves execution.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
