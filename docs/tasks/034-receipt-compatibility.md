# Task 034 · Raw-hash receipts and proof compatibility

Depends on 027, 033. Implements [Guard 2.0](../guard/guard-2.0.md) §7.3. Receipt compatibility is separate from card formatting and must work before any new result becomes active.

## Do

1. Implement deterministic input/decision hashes, nonrecursive recorded payload, full revision key and same-input receipt-ID reuse.
2. Keep exact JCS/leaf/itemId/kind/batching semantics; recorded versus anchored references use real registry events, supersession remains append-only.
3. Produce shared V1/V2 browser/TS/Foundry proof fixtures including rounded threshold crossing, unknown versus zero and reorg correction; document trace-expiry retrieval.

## Don't

Change registry contract/leaf domains or hash display-rounded cards.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
