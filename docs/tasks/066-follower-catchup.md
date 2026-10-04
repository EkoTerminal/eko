# Task 066 · Live follower: faster catch-up and fewer paid reads

Read `AGENTS.md` first (rule 9 included). Task 025's logs-first follower is correct (identical to the per-block
follower in four live comparisons) and keeps up at the head, but on the Oct 2 live run (default caps, from 2,000 blocks
behind) it covered about 11 blocks/s against about 10 from the chain, so a 2,000-block gap took about 30 minutes to
close. Ticks of 200 blocks had median `rpc_wall_ms` 13.6 s, `db_write_ms` 3.7 s, `meter_rate_wait_ms` 3.0 s. In 300 s
it spent paid calls: `eth_getBlockByNumber` 283, `eth_getBlockReceipts` 300, `eth_call` 145, `eth_getCode` 76,
`eth_getLogs` 19; public: receipts 87, `eth_getLogs` 19, `eth_blockNumber` 18, `eth_getBlockByNumber` 70. Spec:
`docs/eko/04-BACKEND.md` §4.2a, `docs/operations/rpc-spend-guard.md`.

## Do

1. Find where the tick's RPC wall time goes (serial phases, per-receipt latency, waiting on the public bucket) and
   overlap or batch it so a 2,000-block gap closes in under 5 minutes on the default caps.
2. Cut the paid header reads: logs carry `blockTimestamp`, so headers are only needed for the cursor-hash check (one
   per tick) and reorg walk-back; explain and remove the rest. Explain and cut the `eth_call` count (periodic ETH/USD
   sampling should be one call per sample period) and `eth_getCode` (cached per address).
3. Add `head_tick` fields for the phase timings you use to prove it, and a benchmark on the synthetic range.
4. Keep the equality tests (fixture and synthetic) green: no data change.

## Don't

- No new dependencies. Don't edit `docs/eko/`. Rule 9. No network; the lead reruns the live comparison.

## Report

Root causes, changes, expected paid/public calls per day at the head and during catch-up, benchmark numbers, and
typecheck/test/brand:check/check:addresses results.
