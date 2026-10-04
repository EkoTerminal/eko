# Task 094 · Register the five T Senses and lookup tools

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§9.2–9.5, 23; FACTS §7.
Dependencies: 093, 081, 035, 102. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Wire coin_verdict, coin_card, playbook_match, census_summary and receipts_lookup to existing versioned read services using closed input schemas and structured shared outputs.
2. Preserve V1 historical proof behavior and negotiated Guard V2 projections from 035/037. Unknown checks stay named gaps, Census headlines require its separate label gate, and third-party nested text passes through Untrusted.
3. Test tool input/output schema parity, unavailable coin/history/receipt, flowWindow/minLevel, gated Census and adversarial names/evidence. No RPC simulation, funding collector or free-text instruction execution runs inside a read handler.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
