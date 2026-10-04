# Repairing historical ETH/USD values

The reference-price fix trusts a v3 pool only when `creation_verified` records its
`PoolCreated` event from `uniswapV3.factory` in the address registry. Contract
metadata reads and third-party factory events remain provisional. Archive samples
discover pools through that canonical factory's `getPool` and choose the deepest
initialized standard-fee WETH/USDG pool (100, 500, 3000 or 10000). `EthUsdRate`
carries that selected address, venue and fee. Same-block updates, carry-forward
and restart recovery accept swaps only from that identity, with the existing
creation-verification and currency checks. A later swap from another canonical
tier cannot replace it. Selection remains pinned by the chain client; this does
not introduce a new oracle or change the depth-selection policy.

This follows `04-BACKEND.md` §2 (on-chain ETH/USD feed), §3 (USD plus its pricing
block), §4.2a (prices from swaps) and §4.4 (canonical factory). The spec does not
set a reference-rate expiry: the decoder's `TODO(spec)` retains the last trusted
rate from the selected source with its pricing block. If archive discovery has
no selected source, canonical-looking events cannot nominate one, and
USD and `priced_block` remain null. This fix does not add a staleness threshold.

## Existing data needs re-indexing

Previously stored non-null USD values may have used an unverified reference or a
secondary canonical tier instead of the selected deep source.
There is no persisted reference pool ID on those USD rows, so the affected rows
cannot be identified reliably from `priced_block` alone. Conservatively re-index
all stored swap blocks written by the previous decoder, through the last such
block. Do not delete swaps or reset the live cursor. Apply the normal indexer
migrations before using the new decoder: `0180_eth_usd_reference_sources` adds
selected-source evidence keyed by pricing block. It starts empty; it cannot
identify the sources used by the old decoder. The indexer writes these identities
in the same transaction as derived swaps, updates them on canonical replay, and
removes them above a rollback ancestor. The reference-freshness collector uses
the latest indexed identity at or below the head cursor, then reads timestamps
only from matching verified swaps. With no selected identity or matching evidence,
it reports unavailable; a more recent secondary tier cannot make it fresh.

Re-decoding an existing swap now replaces derived `usd` and `priced_block`, even
when the new value is null. It preserves event identity, raw amounts, senders and
existing quote prices. The same transaction refreshes affected candle minutes,
including removing candles that have no remaining priced trades. Repeating the
same replay is idempotent.

Use the existing `HeadFollower.ingest(block, receipts)` API for a complete replay:

1. Pause writers and engines for the maintenance interval and take the normal
   database backup. Select the first and last stored swap block needing repair.
2. Complete canonical pool-creation discovery over the relevant history with
   `pnpm --filter @eko/indexer backfill -- --stream logs:pools --from <from> --to <to>`
   if it is incomplete. This upgrades provisional canonical pools. Keep foreign
   pools unverified. The verified pools already stored need no rediscovery.
3. Create the normal registry, metered chain client, database, `BlockDecoder`, and
   `HeadFollower` as in `apps/indexer/src/cli.ts`; validate chain ID 4663. Iterate
   the stored swap blocks in ascending order, using bounded queries such as:

   ```sql
   SELECT DISTINCT block FROM swaps
   WHERE block BETWEEN $1 AND $2 AND block > $3
   ORDER BY block LIMIT 500;
   ```

   For each block, fetch the full block and its receipts, then call
   `await follower.ingest(block, receipts)`. Stop if it returns false (a stored
   hash/parent mismatch) or throws. Save the last successfully repaired block
   outside the repo for restart. This API processes existing blocks regardless
   of the head cursor and does not move that cursor backward. Finish at the
   recorded last block; use the normal RPC budget and stop handling.
4. Check repaired swap USD/pricing blocks, selected-source addresses/fees in
   `eth_usd_reference_sources`, and candle OHLC/volume values. Verify that more
   recent secondary-tier swaps did not set either USD values or reference freshness. Rebuild engine
   derivatives with `ENGINE_MODE=replay FROM=<from> TO=<to> pnpm --filter @eko/engines start`
   following §4.3. This replaces current cards/signals through the existing
   versioned replay; historical evidence stays in its existing versions.
5. Resume normal writers and engines.

Simply restarting the follower or changing `INDEX_START_BLOCK` does not repair
past rows: an existing head cursor resumes forward. Likewise, completed backfill
leases suppress repeated work, and `logs:pair_swaps` covers a restricted pool set.
Use the complete ingest replay above for all potentially affected stored swaps.

## Local proof for rescore

`apps/indexer/test/clients.test.ts` proves discovery selects the deep initialized
tier at $2,000 over a shallow tier at $90,000 and returns its address/venue/fee
on later samples. `apps/indexer/test/reference-price.test.ts` contains the
regression `pins the deep selected tier through same-block, carry-forward,
restart and canonical re-index`: both token orders preserve $2,000 per 1-WETH
trade, $20 OHLC per 100 tokens, and $6,000 candle volume across three blocks,
including replay of deliberately corrupted USD/candles and repeated replay.
Foreign-factory and provisional-pool cases remain covered.
`apps/server/test/security-collectors.test.ts` verifies that newer canonical
secondary-tier swaps cannot refresh the selected source's timestamp after restart.

This is a prepared maintenance procedure. No live migration or repair was run
as part of this fix.
