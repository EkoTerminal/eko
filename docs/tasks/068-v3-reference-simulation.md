# Task 068 · Implement v3 reference buy-then-sell simulation

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§6.1–6.2, 6.5, 20; Guard 2.0 §§3.4, 9.1.
Dependencies: 026, 067; coordinate the shared simulation interface with 040. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Implement the non-Pons v3 simulation path using the spec probe and metered trace transport, plus isolated EOA deep confirmation on Anvil. Never deploy the probe or override token restrictions. Keep Pons reference execution owned by 040.
2. Persist pinned reference results for $100/$1k/$10k, taxes, revert classification, trace digest and 30-day trace retention; refresh card/playbook inputs from real results. Distinguish provider failure, entry limits, contract restriction and confirmed blocked exit.
3. Test clean swaps, failed sells, near-zero returns, cooldown, fee-on-transfer and RPC failure; compare supported fork cases with actual balance deltas. Missing fork evidence leaves the route incomplete, never a completed low-risk check.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
