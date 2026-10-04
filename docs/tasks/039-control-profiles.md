# Task 039 · Pinned Pons effective control and fee profiles

Depends on 027, 029, 035. Implements [Guard 2.0](../guard/guard-2.0.md) §§3.4, 5.3, 8.1. Acquire and validate one Pons profile first; generic unsupported code cannot inherit it.

## Do

1. Pin implementation/config/hook/locker/authority and actual getter/decay/fee policy observations; move template writes out of source loading.
2. Verify relevant permissions with state-changing fork tests, record bounded/unrestricted/queued capabilities and effective profile invalidation.
3. Test reviewed versus unknown template, no-op getter/setter, changed implementation, effective total charge with unknown breakdown and horizon-external timelock.

## Don't

Hard-code universal 1%/three-second parameters or call missing powers false.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
