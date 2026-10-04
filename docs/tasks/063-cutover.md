# Task 063 · Concrete cutover and rollback preparation

Depends on 037, 038, 052, 061, 062. Implements [Guard 2.0](../guard/guard-2.0.md) §§7.2–7.3, 9.4. Prepare an atomic version switch with all consumer/proof checks; actual release follows existing explicit authorization.

## Do

1. Assemble API/cache/web/bot/policy schema negotiation and released factor/check/profile manifest; declare which class/venue coverage can ship and which stays incomplete.
2. Exercise switch and rollback in test, preserve old receipts and guardPolicyVersion semantics; independently flag Signal adapter.
3. Release only when authorized under the real repository process; report exact built/tested/prepared/released state and any unmet gates.

## Don't

Bypass gates, deploy as implicit document approval or roll back into rejected serial attribution.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
