# Task 028 · Mandatory buyer-level policy adapter

Depends on 026, 027. Implements [Guard 2.0](../guard/guard-2.0.md) §§1, 5.3, 7.2. Implement the policy change using cached fixture/partial verdicts already available; actual-size execution wiring arrives later.

## Do

1. Add guardPolicyVersion 2 and mandatory High/critical-incomplete buy gates; Safe always denies Elevated, Balanced/Degen use limits or optional stricter refusal.
2. Keep presets for unset fields, other denial order and sell bypass; explicit null cannot bypass High or Safe Elevated. Keep needs_approval re-evaluation and final idempotent-result replay.
3. Test all modes across four levels, lower-tier gaps, critical gaps, null/monitor/danger settings, approval attempts and sells; guard behind coherent migration flag.

## Don't

Activate heuristic scores, interpolate actual-size quotes or change stored idempotent results.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
