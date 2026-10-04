# Task 133 · Collect UserOp and delegation evidence for Watcher

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§4.3–4.4, 5.1–5.2; Guard 2.0 §2.1.
Dependencies: 016, 024, 025; complex principals/traces remain owned by 043. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Extend the indexer with verified EntryPoint UserOperationEvent and 7702 authorization/delegation storage, sharing the existing scoped receipt/enrichment path. Resolve required EntryPoint TODOs only from pinned verified evidence; ERC-8004 collection belongs exclusively to 100.
2. Persist raw protocol evidence and coverage outside the pure Watcher; use 043 principal bindings for complex execution rather than duplicating trace acquisition or assuming the outer signer is the wallet.
3. Test independent UserOps in one tx, sponsorship versus sender, changing delegation, missing receipts, replay/reorg and metered call limits. Unverified EntryPoint/events remain explicit missing inputs.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
