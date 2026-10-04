# Task 031 · Swap, transfer and attributed cohort metrics

Depends on 029, 030. Implements [Guard 2.0](../guard/guard-2.0.md) §§2.4, 3.2–3.3. Build useful insider/sniper/disposition facts from existing swaps/transfers/exemptions before native funding or causal replay.

## Do

1. Implement FIFO lots and direct-principal/creation-subtree candidate, exemption and first-trade/launch-window cohorts; transfer descendants preserve origin independently of control.
2. Compute bought/held/sold-of-acquired/sold-of-float, direct actual sales, trading-only cash multiple, raw open episodes and 300/3600/86400-second campaign sums with unknown impact/basis statuses.
3. Test transfer→recipient sale, burn, gift, mixed basis, rebuy, router recipient, tiny profit, same-second order and 61/301-second fragmented disposal; reconcile units and quote deltas.

## Don't

Call raw disposal an attributed harmful dump, merge gift owners or use old dumped labels as truth.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
