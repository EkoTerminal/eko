# Task 025 · Logs-first live follower (cut the head's RPC cost by about 7×)

Read `AGENTS.md` first (rule 9 included). Spec: `docs/eko/04-BACKEND.md` **§4.2a** (new, Oct 2), §4.2 (reorgs, which
still apply), §4.3–4.4 (decoders, actor resolution), §21.1 (bus topics). Builds on task 017/021 (indexer) and task 024
(the metered RPC guard: every call goes through `@eko/chain`'s metered clients).

Measured facts (Oct 2): about 10 blocks per second; the current per-block head follower spends about 3.7 paid calls
per block (about 3.2 million a day); 86% of blocks hold some swap we record, but only about 45% hold a trade of a
tracked coin (Pons launches and their pools); logs on 4663 include `blockTimestamp`; Pons `CurveBuy` is
`(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 tax)`.

## Do

1. **`LogHeadFollower`** in `apps/indexer` (replaces the per-block loop for `start`; keep the old loop behind
   `INDEX_HEAD_MODE=blocks` for debugging):
   - Tick every `INDEX_HEAD_TICK_MS` (default 1000): `eth_blockNumber`, then `eth_getLogs` over `(cursor, head]`
     (capped at `INDEX_HEAD_MAX_RANGE`, default 200 blocks, so a restart catches up in bounded windows) with the OR'd
     topic set of every event the decoders handle. Keep logs whose emitter is a known Pons factory/curve or an indexed
     pool (new pools and curves join the filter in the same tick, ordered by block and log index). Then `Transfer`
     logs for the tracked token addresses (chunked to stay under the provider's address × block limit and response
     size; adaptive like the backfill).
   - Block time from each log's `blockTimestamp`; never interpolate. A block with no logs needs no row.
   - Senders: `eth_getBlockReceipts` only for blocks containing a tracked coin's trade or launch, batched; actor
     resolution unchanged (`@eko/chain` `resolveActor`). Curve trades keep `buyer`/`recipient` from the event as
     evidence, and the trader stays the resolved actor, exactly as today, so live rows equal backfill rows.
   - Reorgs: store `blockHash` with each processed block (the `chain_blocks` row for blocks we wrote), re-read the
     cursor block's hash each tick (one call), and on a mismatch or any `removed: true` log walk back exactly as §4.2.
   - Same transactions, `ON CONFLICT` idempotency, bus notifications (`chain_block`, `swap`, `pair_created`) and
     metrics as today. Lag metric = now − the newest log's `blockTimestamp`, plus `blocks_behind`.
2. **Routing** (extend task 024's table): the head's `eth_blockNumber` and `eth_getLogs` try the public RPC first and
   fall back to paid on errors or rate limits (bounded by the guard). Receipts and the cursor-hash read go to paid.
   No per-block Pons or price reads in the head path.
3. **Equivalence test** (the key one): replay the captured fixture blocks and a synthetic 2,000-block range through
   both the old per-block follower and the new one; the chain tables must be identical (rows, actors, sides, prices,
   USD values, timestamps). Plus: reorg via a hash mismatch and via `removed`; a restart catches up in bounded
   windows; the `Transfer` chunking splits on the provider's errors; a pool created at block N gets its swaps at N+1
   in the same tick.
4. **Call budget test**: on the synthetic range, count calls by method through a fake transport and assert the head
   spends at most `ticks × 2 + chunks + receipt blocks + 1` calls, with receipts only for blocks with tracked trades.
5. **Docs**: update `docs/operations/rpc-spend-guard.md` with the measured per-day estimate for this follower and the
   env vars.

## Don't

- No new dependencies. Don't edit `docs/eko/`. Rule 9. No network in your sandbox; the lead runs the live comparison
  (old vs new follower over the same 2,000 live blocks, row for row) with a session budget.

## Report

Files, the routing changes, the equivalence and call-budget test results, the expected calls per day at 10 blocks/s,
`TODO(spec)` list, and typecheck/test/brand:check/check:addresses results.
