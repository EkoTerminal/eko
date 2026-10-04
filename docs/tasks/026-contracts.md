# Task 026 · Guard contracts, levels and parameter registry

No dependencies. Implements [Guard 2.0](../guard/guard-2.0.md) §§1, 5.3, 7.1, 9.4. Freeze canonical V2 schemas and candidate definitions before consumer or collector work.

## Do

1. Implement complete CoinCardV2/GuardAssessmentV2 runtime schemas, closed metric/check/factor/reason enums, exact raw/rational quantities and null/bound status validation.
2. Register every CALIBRATE starting value/formula, comparison, source, rationale, method and gate; distinguish shadow from released factors and both check tiers.
3. Preserve complete V1 Verdict/Playbook/Card schemas and add negotiated V2/optional guardV2; test all four level projections, unknown issuer, known zero, missing amount and denominator rejection.

## Don't

Change active scoring, invent legacy playbook IDs or populate observations from masked zeros.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
