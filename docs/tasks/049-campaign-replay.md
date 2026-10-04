# Task 049 · Sale campaign state and mechanical replay

Depends on 031, 040, 041, 042, 046. Implements [Guard 2.0](../guard/guard-2.0.md) §§3.3, 4.2, 9.2. Deliver queued Pons campaign reconstruction with exact transaction boundaries; this is separate from the buyer benchmark runner.

## Do

1. Reconstruct pre/post state from parent checkpoint and transaction prefix; compute pressure with pinned decimal/error bounds and open/closed campaigns.
2. Implement real outside-buyer before/during cohort valuation and sell-only/net-trading interventions with original limit/deadline/funding validity.
3. Test intra-block launch/buy/dump/fee-change, tiny profit, $300 reserve-relative harm, slow 24h bleed, outsider/gift seller and invalid counterfactual; retain raw pressure on attribution failure.

## Don't

Skip invalid remaining swaps, claim control from origin or perform this work in cached evaluate.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
