# Task 017 · apps/indexer: head follower, reorgs, chain tables and the Pons backfill

Read `AGENTS.md` first. This turns the screens' sample data into real data: it follows Robinhood Chain (4663) block by
block into Postgres. Spec: `docs/eko/04-BACKEND.md` **§4.1** (transports), **§4.2** (head follower and reorgs, with the
`HeadFollower` sketch), **§4.3** (idempotent backfill, leased ranges, adaptive windows; Phase A only), **§4.4**
(decoders and actor resolution), **§3.1–3.3** (conventions, table ownership, key schemas; `swaps` partitioned by
month), §21.1 (bus topics: `NOTIFY eko_<topic>` with ids only), §2.1 (layout: `apps/indexer`, `packages/db`), §2.4 (env:
`DATABASE_URL`, `RPC_HTTP_URL`, `RPC_WS_URL`, `RPC_FALLBACK_HTTP_URL`, `INDEX_START_BLOCK`, `INDEX_BACKFILL_WORKERS`,
`INDEX_LOG_RANGE`, `INDEX_REORG_DEPTH`, `APP_ROLE`). Use `@eko/chain` (task 016) for the registry, decoders, the Pons
adapter and actor resolution; don't re-implement them.

The lead captured **real full blocks with receipts** through the owner's dRPC endpoint in
`apps/indexer/test/fixtures/4663/blocks.json`: the Pons launch block (57 logs), a block with a Pons sell, a Uniswap v3
block with a `PoolCreated` and swaps (99 logs), and a v4 `Initialize` block, each with its parent hash. You have no
network; the lead runs the live checks. dRPC facts (verified Oct 1): `eth_getBlockReceipts` works; `eth_getLogs` handles
large windows but returns "logs matched by query exceeds limit of 10000" or "HTTP response body exceeded the size limit"
on dense ones; `trace_*` is not available (not needed here).

## Do

1. **`packages/db`** (`@eko/db`, new): the indexer-owned chain tables from §3.2 that T needs, in Drizzle with the §3.3
   `bytes` helper, plus hand-written SQL where Drizzle can't (monthly partitions): `chain_blocks`, `ingest_cursors`,
   `ingest_ranges` (§4.3 SQL), `tokens` (address, symbol and name as stored raw text, decimals, launchpad, deployer,
   curve, first_block), `pools` (v3 pool address or v4 PoolId, venue, currency0/1, fee, tick spacing, hooks,
   created_block), `swaps` (§3.3, partitioned), `liquidity_events`, `token_transfers` (partitioned), `pons_events`,
   `pons_exemptions` (unique `(token, wallet)`), `wallets`. Its migrations use their own migrations table (so they live
   beside the server's SignalOS migrations in the same database) and a `pnpm --filter @eko/db migrate` script. Leave the
   SignalOS server schema where it is (`TODO(spec)` for the §2.1 move). Works on Postgres and PGlite.
2. **`apps/indexer`** (`@eko/indexer`, `APP_ROLE=indexer`):
   - Clients as §4.1: `headWs` (`watchBlockNumber({ emitMissed: true })`) with the 250 ms `eth_blockNumber` backstop;
     `http` = `fallback([RPC_HTTP_URL, RPC_FALLBACK_HTTP_URL])`. Refuse to start if `eth_chainId` ≠ 4663.
   - `HeadFollower` as §4.2: ordered, de-duplicated `BlockQueue`; full block + `eth_getBlockReceipts`; parent-hash check;
     rollback walking back to the common ancestor (halt with an alert past `INDEX_REORG_DEPTH`), one `deleteAbove` per
     chain table, `eko_chain_reorg`; one transaction per block (insert block, decoded rows, cursor); then
     `eko_chain_block`, plus `eko_swap` / `eko_pair_created` with ids only. `ON CONFLICT DO NOTHING` on natural keys, so
     replays are no-ops.
   - Per block: decode every receipt log with `@eko/chain` (v3 `PoolCreated`/`Swap`/`Mint`/`Burn`/`Initialize`; v4
     `Initialize`/`Swap`/`ModifyLiquidity`/`Donate`; WETH; ERC-20 `Transfer` only for tokens in `tokens`; Pons factory and
     curves through the adapter with a `tokenForCurve` lookup), resolve the actor per tx, and write `pools` (v3 from
     `PoolCreated`, v4 from `Initialize`), `tokens` (Pons launches), `swaps` (v3 by pool, v4 by PoolId, Pons curve trades
     as `venue: 'pons_curve'` with native ETH as the quote; `side` from the coin's point of view), `liquidity_events`,
     `token_transfers`, `pons_events`, `pons_exemptions` (deduped). `price_quote` from the amounts with decimals; `usd`
     when the quote is WETH or native ETH, from the latest WETH/USDG v3 swap at or before the block (`TODO(spec)` for
     other quotes); otherwise null.
3. **Phase A backfill** (§4.3, `logs:pons`), as two streams so leased ranges can run in parallel: first
   `logs:pons_factory` (address-filtered `TokenLaunched` over the whole range → tokens and curves), then
   `logs:pons_curves` (topic-filtered `CurveBuy`/`CurveSell`/`SnipeTaxExempted`, keeping only logs whose emitter is a
   known curve). Leased `ingest_ranges` with `FOR UPDATE SKIP LOCKED`, lease expiry and retries; adaptive window (start
   at `INDEX_LOG_RANGE`, halve on the two dRPC errors above, double up to 20,000 on success); the ERC-8004 identity
   mints (`Transfer` from 0x0) can be a third stream or a `TODO(spec)`. CLI: `pnpm --filter @eko/indexer backfill
   --stream <name> --from <block> --to <block>`, and `--workers N` for the loop.
4. **Ops**: `pnpm --filter @eko/indexer start` (head follower) and `backfill`; structured logs; metrics for head lag,
   blocks per second, unknown topics and malformed logs; graceful shutdown that finishes the current block.
5. **Tests** (PGlite, no network): replay the fixture blocks end to end and assert the rows (the Pons launch, its
   exemptions deduped, curve buys/sells as swaps with the right side and actor, the v3 pool and swaps, the v4 pool from
   `Initialize`); replay twice → no duplicates; a synthetic reorg (two branches sharing an ancestor) rolls back and
   re-applies; depth limit halts; the backfill's adaptive window halves on both error messages and doubles on success;
   leases expire and are re-claimed; partitions are created ahead.

## Don't

- No engines, cards, verdicts or API routes (later tasks). No Phase B or C. No deploy config (the lead sets up Railway).
  Don't edit `docs/eko/`. Dependencies: only what's in the lockfile (`drizzle-orm`, `@electric-sql/pglite`, `pg` if
  present, `viem`, `zod`); update the lockfile offline per AGENTS rule 6.

## Report

Files, the tables and their keys, `TODO(spec)` list, typecheck/test/brand:check/check:addresses results, and the exact
commands for the lead to run the head follower and a Phase A backfill live against a local PGlite.
