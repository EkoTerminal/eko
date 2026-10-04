# Task 030 · Pons supply and address holding reconciliation

Depends on 027, 029. Implements [Guard 2.0](../guard/guard-2.0.md) §§2.5, 3.1–3.2. Reconcile present and historical Pons curve balances from supplied transfers; unsupported graduation remains unknown.

## Do

1. Add exact S/D/K/U/P/C/F snapshots with source boundaries, current supply reads and historical mint/burn reconciliation; version cap semantics.
2. Implement liquid/raw/locked address holdings, address top-ten, holder count and small-float states; sinks require proof and unknown custody stays visible.
3. Test true burn versus sink deposit, live burn-intent wallet, 80% locked allocation, zero/small/negative float and future total_supply sample rejection.

## Don't

Treat all token-self holdings as burned or use PoolManager-wide inventory for a pool.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
