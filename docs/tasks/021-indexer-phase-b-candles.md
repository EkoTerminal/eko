# Task 021 · Indexer follow-ups: pool history (Phase B), swaps for new pairs, holders, candles, two fixes

Read `AGENTS.md` first (rule 9 included). Task 017 (merged) indexes Pons launches and trades correctly and keeps up
with the head. This task fills what the coin cards and charts need next. Spec: `docs/eko/04-BACKEND.md` **§4.3**
(Phase B `logs:recent`: v3, v4, WETH and ERC-20 `Transfer` for known tokens over the last 30 days; leased ranges,
adaptive windows), **§4.4** (v3/v4 decoders, actor resolution), **§3.1–3.3** (conventions, `balances` among the
indexer's tables, monthly partitions), §2.2 row `apps/server/src/market/*` ("trades are indexed swaps; ETH-USD comes
from the v3 WETH/USDG pools"), **CA-4** (candles `{tf, bars, asOfBlock}`; `1s`/`15s` cover the last 6 h;
on-chain OHLCV from `swaps`, curve trades included before graduation, in USD, 1m–1d), §6 (the Normalizer will read
holders, top-10 share and supply from here; circulating supply rules in §6).

Live facts from the lead's runs on the owner's dRPC (Oct 1): `eth_getLogs` rejects ranges over 100,000 blocks; dense
windows return "logs matched by query exceeds limit of 10000" or "HTTP response body exceeded the size limit"; the
head follower logs `unknown_pool` for v4 swaps whose pool was initialised before indexing began; about 5 "malformed"
logs per second are counted at the head; `head_time_error` appears a few times a minute.

## Do

1. **Pool discovery (Phase B, `logs:pools`)**: v3 `PoolCreated` (factory) and v4 `Initialize` (PoolManager) over the
   last 30 days → `pools` with currencies, fee, tick spacing, hooks and the real creation block, plus `tokens` rows for
   every pool currency not yet known (metadata and `total_supply` through Multicall3 batches; add `total_supply` to
   `tokens`). After it runs, `unknown_pool` must stop for pools inside the window. Pons-hook pools (hooks =
   `pons.v4Hook` from the registry) are marked as Pons graduations on their token row (`graduated_pool`,
   `graduated_block`).
2. **Swaps for the pairs that matter (`logs:pair_swaps`)**: backfill v3 `Swap` and v4 `Swap` for (a) every pool created
   in the last 7 days and (b) every Pons-graduated pool, using topic/address filters in batches sized to dRPC's limits
   (v4: `topics: [Swap, [poolId…]]`; v3: `address: [pool…]`). Same leased, resumable, adaptive machinery as Phase A;
   USD as in 017b. The head follower keeps writing live swaps for every known pool.
3. **Holders**: ERC-20 `Transfer` for tracked tokens (every Pons token and every token from step 1's new pools) over the
   last 30 days into `token_transfers`, and a `balances(token, holder, amount, last_block)` table maintained from them
   (one writer: the indexer; idempotent on replay: compute from transfers, never double-apply). Expose a query in
   `packages/db` for holder count, top-10 share and the top holders at a block, excluding the burn sinks
   (`0x0`, `0x…dEaD`, the token itself) as §6 defines; mark which holders are the Pons curve.
4. **Candles** (CA-4): a `bars_1m(coin, minute, open, high, low, close, volume_usd, trades, first_block, last_block)`
   table kept by the indexer (upsert per applied block; rebuilt from `swaps` for backfilled ranges by a
   `pnpm --filter @eko/indexer bars:rebuild --from --to` command), prices in USD per whole token. A query in
   `packages/db`: `candles(coin, tf, from, to)` → `{tf, bars, asOfBlock}` for `1m|5m|15m|1h|4h|1d` aggregated from
   `bars_1m`, and `1s|15s` from raw `swaps` limited to the last 6 hours. Curve trades count before graduation, pool
   swaps after. Market cap per bar = close × circulating supply (or total supply with a `TODO(spec)` if circulating
   isn't computable yet).
5. **Malformed logs**: classify instead of lumping. An ERC-721 `Transfer` (same topic, 4 topics, no data) is "not
   ERC-20", not malformed; anything else unknown but well-formed is "unknown topic". Count by reason in the metrics and
   log one sample per new reason (address, topic0, topic count, data length; never more). Only genuinely undecodable
   logs for a topic we claim to decode count as malformed.
6. **`head_time_error`**: find why the head-time read fails intermittently and fix it (retry once, fall back to the
   applied block's time); keep lag accurate.
7. **Tests** (PGlite, no network): pool discovery from fixture logs (the v3 `PoolCreated` and v4 `Initialize` fixtures
   in `packages/chain` and `apps/indexer`); a Pons-hook pool marks graduation; balances from a transfer sequence
   (including mint, burn to `0x…dEaD`, self-transfer) and replay idempotence; holder count and top-10 excluding sinks;
   bars from known swaps (open/high/low/close/volume across minute boundaries, aggregation to 5m/1h, 1s/15s window
   limit); malformed vs ERC-721 vs unknown classification.

## Don't

- No engines, verdicts, cards or API routes (tasks 022–023). Don't edit `docs/eko/`. No new dependencies. Rule 9.

## Report

Files, new tables and keys, `TODO(spec)` list, typecheck/test/brand:check/check:addresses results, and the exact
commands for the lead to run Phase B (pools, pair swaps, holders) and `bars:rebuild` live on a local PGlite.
