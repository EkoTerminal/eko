# Task 038 · Separately versioned Signal input adapter

Depends on 026, 035. Implements [Guard 2.0](../guard/guard-2.0.md) §7.2. Preserve five readings and original v1 history; new adapter is independently versioned and initially shadow.

## Do

1. Implement specified v2 Risk band/power/LP mapping with numeric 50 lowData rendered unavailable for either tier gap and High zero overlay.
2. Keep other four input definitions legacy-compatible or explicitly lowData; record measurement versions and Guard receipt, maintain 15-second refresh.
3. Test high Signal with denied Guard, incomplete no Hot, confirmed powers counted once, unchanged v1 fixtures and no Signal feedback into ranking/permission.

## Don't

Invent a sixth reading state or silently substitute new float/depth definitions into v1.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
