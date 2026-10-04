# Task 037 · Lists, Feed, bots and shared copy adapters

Depends on 035, 036. Implements [Guard 2.0](../guard/guard-2.0.md) §§1, 6, 7.2. Reuse shared verdict rendering for compact consumers rather than reimplementing decision logic.

## Do

1. Adapt Radar/Pair/Alert/BagReport/scan/widget/OG/bots/research/packs to negotiated V2 label and coverage, preserving V1 historical reads.
2. Add optional typed guardFactorId/guardReasonCode to Feed and blocked RuleSignal without changing blockedBy or user-origin semantics.
3. Test three-line tiles versus full reason access, neutral share/meta titles, sanitized OG and required DYOR/NFA/AI/non-affiliation on each verdict surface.

## Don't

Send bot messages or publish artifacts as part of this packet, parse reason prose or treat source text as trusted copy.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
