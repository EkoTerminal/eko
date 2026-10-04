# Task 044 · Native and quote funding acquisition capability

Depends on 027, 031, 043. Implements [Guard 2.0](../guard/guard-2.0.md) §§2.3, 8.1–8.2. Verify the cheapest sufficient indexed path before designing live funding completion around it.

## Do

1. Implement provider interface/paged address intervals for successful external/internal native and quote funding, first-observed/first-ever, and complete source coverage.
2. Capability-test known funding-only/failed/internal flows; if no usable indexed source, publish unavailable plus a shared union-interval diagnostic trace plan priced within approved cap.
3. Cache by address range/block hash, conserve successful values, meter pages/confirmations/traces/Anvil upstream separately; test pagination gap/resume and top-level-only insufficiency.

## Don't

Start whole-chain/genesis scans, use unavailable trace_filter or assume indexed-provider RPC pricing.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
