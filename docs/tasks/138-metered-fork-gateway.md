# Task 138 · Metered fork gateway for Anvil (real-chain simulation checks)

Read `AGENTS.md` first (rule 9 included). Several packets are built and fixture-tested but blocked from their real-chain
acceptance by one missing piece of infrastructure:
- the Pons reference exit (040);
- the v3 reference simulation (068);
- the control profiles (039, 069);
- the directional depth (041);
- graduation (042).

Their drivers (`packages/chain/src/simulation/anvil.ts`, `pons-fork-cli.ts`, the `SerializedMeteredForkLease`) only
accept a **local gateway** that sits between Anvil and the archive RPC. Every upstream read Anvil makes, including lazy
storage loads, must go through our RPC spending guard (task 024: `createMeteredClients`, the daily and session
budgets). Read `docs/guard/research/pons-executable-notes.md` (verified Pons facts), `docs/operations/rpc-spend-guard.md`,
the 040/068 implementation reports, and `docs/guard/guard-2.0.md` §§3.4, 8.

## Do

1. **`apps/fork-gateway`** (or a module in `packages/chain` if that fits the repo better), started by a CLI:
   - It is a local JSON-RPC HTTP server bound to `127.0.0.1` only.
   - It accepts Anvil's upstream calls (`eth_getStorageAt`, `eth_getCode`, `eth_getBalance`,
     `eth_getTransactionCount`, `eth_getBlockByNumber`, `eth_chainId`, `eth_blockNumber`, and anything else Anvil
     needs for forking, listed explicitly) and forwards them through the metered archive client.
   - Every forwarded call is metered and counted against `RPC_SESSION_BUDGET` and the daily paid budget. When a budget
     closes, the gateway returns a clear error and Anvil's request fails. It never falls back to an unmetered call.
   - Methods outside the allowlist (`eth_sendRawTransaction`, `debug_*`, anything else) are rejected.
   - Responses are cached by (method, params, pinned block), because reads at a pinned block are immutable. A rerun
     at the same block costs nothing. The cache is on disk with a size cap.
   - Logs show method counts, units and cache hits, with no URLs or keys.
2. **Lease and reset:** implement the reset callback the existing `SerializedMeteredForkLease` expects. One Anvil
   process at a time per lease, `anvil_reset` to the pinned block between cases, and a clean shutdown.
3. **Wiring:** make the 040 Pons fork CLI and the 068 v3 reference runner use the gateway end to end. A single
   documented command runs "fork-check N coins at block B, sizes $100/$1k, EOA and smart account" and writes the
   fork-match records the acceptance code already defines, with the actual request units and cache hits.
4. **Fresh accounts only:** fork cases must use freshly generated keys and assert they have no code at the pinned
   block. Anvil's default keys carry an EIP-7702 sweeper delegation on this chain (see pons-executable-notes.md,
   "Lead fork validation"). Assert that each recipient's balance delta equals the event amounts.
5. **Tests:** run offline with a fake upstream. Cover the allowlist, budget closing (session and daily), cache hits at
   a pinned block, rejection of unpinned `latest` reads during a pinned case, redaction, and the reset between cases.
6. **Docs:** `docs/operations/fork-checks.md`, with the exact commands the lead runs. Include an estimate of upstream
   calls per Pons case. Anvil lazily loads only the touched storage, so this is typically tens to a few hundred
   calls, and the cache makes reruns free.

## Don't

- No new dependencies: Anvil comes from the existing Foundry install. Don't edit `docs/eko/`. Rule 9.
- No network in your sandbox. The lead runs the first real fork check with a session budget.

## Report

The files, the method allowlist, the cache design, the command, the expected calls per case, and typecheck, test,
brand:check and check:addresses results.
