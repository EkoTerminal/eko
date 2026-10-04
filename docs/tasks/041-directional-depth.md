# Task 041 · Local directional depth and route bounds

Depends on 039, 040. Implements [Guard 2.0](../guard/guard-2.0.md) §3.4. Compute all policy/card marginal depth sizes locally on supported reconstructed routes.

## Do

1. Implement exact inversion or monotone 48-total-evaluation bracket/refine solver for buy/sell 2/5/10 and independent fee-inclusive size quotes.
2. Store conservative bounds/domain/precision and best net route/ties; compute supported removal-depth contribution only with validated position input.
3. Test ≤1% refinement, $1m lower bound, cap exhaustion, nonmonotone hook unsupported, zero depth and policy floor proof; report local evaluations and zero remote search calls.

## Don't

Sum v3/v4 L units, swap average-discount into marginal depth or interpolate actual orders.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
