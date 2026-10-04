# Task 100 · Seed and version declared ERC-8004 agent wallets

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§3.4, 5.1, 5.5; FACTS §3.
Dependencies: 016, 021, 024, 133. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add indexer-owned agent_registry collection from IdentityRegistry mints and verified wallet-change events, using batched pinned getAgentWallet reads; zero wallets remain unlabelled.
2. Write Watcher-owned point-in-time declared-agent labels at wallet_block with confidence 0.99 and registration evidence. Keep permissionless declaration distinct from behavioral inference and preserve crew attachments from the qualified graph interface.
3. Test transfer/wallet change, retroactive discovery, zero wallet, replay/reorg and labels at historical cuts. Report real registry coverage; never treat an identity token owner automatically as its trading wallet.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
