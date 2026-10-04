# Task 046 · Qualified control and coordination graph functions

Depends on 031, 043, 044, 045. Implements [Guard 2.0](../guard/guard-2.0.md) §§2.3, 5.3. Graphs qualify conserved factual ledger paths, avoiding the ledger→graph dependency cycle in both drafts.

## Do

1. Implement direct control, private payment, recent funder/collector/loop, bounded hops/recycling and medium 50% candidates under exact windows.
2. Build immutable disjoint components with expiry/split/reorg and hub-deletion diagnostics; distinguish origin/control and three economic participant roles.
3. Test old/dust/CEX paths, 80/89% medium leads, delayed 2h sweeps/2d recycling, two controlled accounts, three-wallet consolidation and future collection exclusion.

## Don't

Promote medium/soft links to keys or operator history before their precision gate.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
