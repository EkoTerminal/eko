# Task 054 · Fixed-delay buyer benchmark runner

Depends on 040, 041, 042, 048, 049, 051. Implements [Guard 2.0](../guard/guard-2.0.md) §§9.1–9.2. Implement the paired evaluation oracle before fitting points; one coding session creates the deterministic resumable runner.

## Do

1. Implement delays 5/30/60/300, $100/$1k, primary 60s fixed 3600 exit, alternative holds/stop-target and exact checkpoint/failure states.
2. Store matching entry verdict/source cut, paper versus persistent method, quote/USD/signed gas returns, class/route and unsupported paths.
3. Test first scheduled failed exit, later recovery, entry cap, quote movement, persistent invalidity, paper 1%/harm reversal gate and resume; report covered real matches separately from synthetic checks.

## Don't

Pool half-agents labels into primary truth, wait for a successful exit or fit exit strategy on hold-out.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
