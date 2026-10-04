# Task 048 · Resumable logs-first selective backfill runner

Depends on 027, 045, 047. Implements [Guard 2.0](../guard/guard-2.0.md) §8.3. Build source acquisition/checkpoint code; broader paid runs still need the owner resource decision.

## Do

1. Enumerate launch metadata and reconstruct selected token/market events from creation with follow-up, timestamp range lookup and boundary state reads.
2. Support seven-day first reconstruction pilot and predeclared 14+7 cohort, one-day funding/seven-day recycling context and optional 51-day history metadata manifest.
3. Test adaptive dense log splits, missing range, older token creation, future source cut, resume/reorg with no duplicated calls and cap stop.

## Don't

Replay every block/coin, promise total price from log lower bounds or selectively inflate history denominator.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
