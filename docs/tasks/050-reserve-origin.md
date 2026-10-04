# Task 050 · Optional proportional reserve-origin research

Depends on 031, 042, 049. Implements [Guard 2.0](../guard/guard-2.0.md) §3.3. Optional explanatory estimator; no outcome or baseline release depends on this packet.

## Do

1. Implement reconciled actual reserve-delta buckets with gross outflow/recipient/fee separation and versioned identity cut.
2. Compute interval estimate and one-time buy offset, preserving migration buckets only on verified settlement.
3. Test virtual versus real reserves, fee outflow, zero reserve, mixed lot receipts and nonnegative exact bucket sum; publish unsupported cases.

## Don't

Call estimate conservative/stolen/victim loss or require it for a dump label.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
