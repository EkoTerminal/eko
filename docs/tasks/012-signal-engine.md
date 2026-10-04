# Task 012 · packages/signal: the five readings (pure)

Read `AGENTS.md` first. Spec: `docs/eko/04-BACKEND.md` **§7.7** (Signal: five readings — owner decision of Sep 30:
the table of readings, weights, composite, refresh, rules, tests), §23 **CA-31** (`CoinSignal`, already in
`@eko/shared`), §7.2 (playbook matches feed Risk), §6 (Normalizer: what card data exists). Import `CoinSignal`,
`CoinCard`, `PlaybookMatch` from `@eko/shared`; don't redefine them.

## Do

1. Create `packages/signal` (`@eko/signal`), wired like `packages/policy` (update the lockfile offline — AGENTS rule 6).
2. Define a typed `SignalInput` with exactly what §7.7 needs: 5 m and 1 h price change, buy volume this hour and the
   previous hour, ±2% depth, exit cost at $1k, holder count now and an hour ago, top-10 share, fresh-wallet share,
   bundle-held share, trending rank (optional), agent share of buying, X mention pace (optional), playbook matches,
   control powers (mutable tax, blacklist, mint), LP status, and `asOfBlock`. Most come from `CoinCard`; add a helper
   `inputFromCard(card, extras)` and mark anything the card doesn't carry as an `extras` field with `TODO(spec)`.
3. Implement each reading exactly as §7.7 states (0–100, 50 = neutral): Momentum, Liquidity (log-scale depth anchors
   $2k ≈ 20, $50k ≈ 70, $250k+ ≈ 95, penalty when exit cost at $1k > 5%), Holders, Narrative (no data → 50 and
   `lowData: true`), Risk (start 100; Monitor match −25; any Danger match → 0; mutable tax / blacklist / mint −10 each;
   removable LP −15). Choose smooth, monotonic curves for the parts §7.7 leaves open and document each in code
   (`TODO(spec)` where it's a judgement call).
4. `computeSignal(input): CoinSignal` — weights 30/25/20/15/10 (`SIGNAL_VERSION = 1`), composite = rounded weighted
   sum, `beta: true`, `asOfBlock`. Plus `explainSignal(signal)` returning the per-reading points for the "how we got
   this" breakdown (e.g. Momentum 86 × 30% = 25.8).
5. A throttle helper for the 15 s per-coin refresh rule (pure: given last-computed time and now, should we recompute?).
6. Tests: each reading at boundaries and monotonic in its inputs; Narrative no-data → 50 + `lowData`; a Danger match
   forces Risk to 0; the composite matches the landing's worked example (readings 86/80/58/70/44 → 72, points
   25.8 + 20.0 + 11.6 + 10.5 + 4.4); the output always validates against `CoinSignalSchema`.

## Don't

- No I/O, no wiring into engines or the API (later). Don't edit `docs/eko/`. No new npm dependencies.

## Report

Files, the curves you chose for each reading, `TODO(spec)` list, typecheck/test results.
