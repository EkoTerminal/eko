# Task 052 · Actual-account quote and execution revalidation

Depends on 028, 034, 040, 041, 042. Implements [Guard 2.0](../guard/guard-2.0.md) §§1, 3.4, 7.2–7.3. Connect initial pure policy semantics to isolated actual-size/account execution observations.

## Do

1. Replace interpolated cost with actual order quote/profile and sell-only path; async misses return named denial/queue status.
2. Revalidate fresh current state at calldata preparation separately from unchanged final idempotent preflight replay; bind account/chain/token/side/raw amount/route/calldata/value/slippage/policy/Guard receipt.
3. Test 15-second quote age,5-second refresh, relevant immediate state invalidation, changed orderHash, approval re-evaluation, High/null/Safe gates and critical stale check; measure cached p95.

## Don't

Let approved/idempotent allow become a perpetual permit or imply optional executor is installed.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
