# Task 042 · Observed graduation and per-pool custody adapter

Depends on 030, 039, 040, 041. Implements [Guard 2.0](../guard/guard-2.0.md) §§2.5, 3.4, 4.3. A bounded adapter for the known Pons successor requires real migration fixtures; unavailable evidence is a valid packet result.

## Do

1. Bind verified migration event/call to old/new route, real reserves, full-range v4 position and locker custody using per-PoolId settlement/fees.
2. Reconcile U→K/P, pools/ticks/positions and alternative executable routes; old-pool empty with reachable successor is migration, not pull.
3. Test normal graduation, inaccessible successor, removable secondary pool, expired lock and PoolManager aggregate rejection; report any unsupported residual preventing critical completion.

## Don't

Assume historical reserve fractions, call locked positions burned or hide missing migration fixtures.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
