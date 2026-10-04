# Task 059 · Independent labels and adjudication import

Depends on 055, 056, 057, 058. Implements [Guard 2.0](../guard/guard-2.0.md) §9.3. Human judgments are a real dependency; this packet validates and imports completed work rather than pretending code can supply it.

## Do

1. Export assignments/neutral reviewer IDs and completeness requirements, import signed immutable independent decisions and evidence.
2. Route disagreements to designated adjudicator, preserve unresolved records and inspect basis/control reversals; keep test scores hidden.
3. Check actual counts, inclusion weights, missing judgments, independent roles and label-set hash; report pending human work as blocker without invented pass.

## Don't

Prefill guilt/Guard/vendor labels or reduce sample to hide missing reviewers.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
