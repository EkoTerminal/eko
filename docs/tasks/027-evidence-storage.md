# Task 027 · Versioned evidence and coverage storage

Depends on 026. Implements [Guard 2.0](../guard/guard-2.0.md) §§2.1, 7.2–7.3. Add only shared persistence needed for existing-data assessments; later collectors own their specialized migrations.

## Do

1. Add additive evidence, availability/coverage, role and V2 verdict revision tables with declared writers and shared typed bus extensions.
2. Implement known-at cursor queries, idempotent source/revision keys, immutable supersession/orphan events and content-hash references.
3. Test same-key replay, new same-block evidence revision, same-second late discovery and reorg invalidation; preserve legacy rows and uniqueness.

## Don't

Rewrite receipts, design all future subsystem migrations here or run destructive production migrations.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
