# Task 060 · Development fitting and frozen candidate

Depends on 053, 054, 058, 059. Implements [Guard 2.0](../guard/guard-2.0.md) §9.4. Choose a candidate using purged development validation only; do not inspect final test labels while choosing.

## Do

1. Validate measurement/paper fidelity and factual/attribution/text gates on development; run preregistered finite grid, compatibility/history ablations and per-size/class metrics.
2. Select by prescribed simplest/precision/recall/deviation/hash tie-break; optional history/buckets remain disabled unless independently justified.
3. Export immutable parameters/method/calibration hashes, actual validation evidence and candidate freeze; unmet coverage/label gates stay shadow.

## Don't

Tune truth/strategy/thresholds against held-out labels or count missing tiers as detected harm.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
