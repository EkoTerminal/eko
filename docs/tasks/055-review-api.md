# Task 055 · Immutable independent review API

Depends on 027, 035, 051, 054. Implements [Guard 2.0](../guard/guard-2.0.md) §9.3. Persist blinded review judgments and export schema independently of frontend work.

## Do

1. Add two independent pseudonymous label slots, evidence references, immutable revisions/adjudication and role-based score blindness.
2. Export pinned cursor/availability/identity/outcome/method/dataset hashes and distinguish retrospective responsibility from machine outcome.
3. Test two-reviewer independence, submitted reveal, unresolved/adjudicated labels, same-case revisions and Untrusted text validation.

## Don't

Invent human labels, use real personal identifiers or overwrite a disagreement.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
