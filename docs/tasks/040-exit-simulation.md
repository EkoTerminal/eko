# Task 040 · Isolated Pons reference exit execution

Depends on 030, 031, 039. Implements [Guard 2.0](../guard/guard-2.0.md) §§3.4, 8.1, 9.1. Deliver one validated Pons curve route and reproducible ordinary-account probes, leaving unsupported successors explicit.

## Do

1. Implement verified local curve buy/sell with refunds and actual fee schedule; match isolated deterministic EOA/smart-account round-trip and sell-only forks at $100/$1k.
2. Record actual Q/R/taxes, venue/all-in/network+L1 fees, overrides/purchased storage, entry caps/cooldowns and classified provider/token/capacity failures.
3. Test exempt leakage, fixed severe cost, temporary antisnipe, delayed sell, class-specific restriction, reset isolation and ≥30 matched accuracy cases where evidence exists; otherwise report missing real matches.

## Don't

Override away token checks, label size-limited entry honeypot or claim missing matches passed.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
