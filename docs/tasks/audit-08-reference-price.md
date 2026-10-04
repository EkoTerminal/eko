# Audit fix 08: trusted ETH/USD reference price only from verified canonical pools (Medium finding)

Source: `.audit-grade/REPORT.md` and `.audit-grade/findings.tsv`, finding
`tee-oracle|apps/indexer/src/decode.ts|unverified-reference-price` (Medium, open).

## Problem (from the audit)
In `apps/indexer/src/decode.ts` (around lines 200, 231–245, 344–347), the in-block reference-rate loop prices trades
from any stored Uniswap v3 pool whose currencies are WETH and USDG, without checking the pool came from the canonical
factory (the pool record has a creation-verification flag). A pool from another factory emitting `Swap` events can set
the ETH/USD rate that prices genuine trades earlier in the same block, later blocks, and (via the restart query that
reads the last stored WETH/USDG swap) recovery after restart. Wrong USD values flow into cards, signals and analytics.

## Do
1. Only canonical, verified pools (factory provenance from the address registry, creation verified) may set the
   reference rate: in-block, carried forward, and in the restart/recovery query (restrict it to verified canonical
   pools, e.g. by join or stored provenance; add a migration only if unavoidable, following the repo's migration rules).
2. If no trusted source exists for a block, the rate stays unavailable (or keeps the last trusted value with its block),
   never falls back to an unverified pool. Say which, citing the spec (docs/eko is read-only) or mark `TODO(spec)`.
3. Decide whether already-stored USD values computed from unverified pools need correction; implement the smallest
   correct repair (e.g. recompute on re-index) or document why none is needed.
4. Tests: an unverified WETH/USDG pool's swaps cannot change trusted USD values within the block, in later blocks, or
   after restart; a missing trusted source stays unavailable; existing indexer tests keep passing.

## Proof
- New tests; `pnpm --filter @eko/indexer test`, root `pnpm typecheck` and `pnpm test` pass.

Follow AGENTS.md. Only this task. End with the AGENTS.md report.
