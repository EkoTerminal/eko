# Task 065 · Curve progress for every Pons coin

Read `AGENTS.md` first (rule 9 included). After task 023, `curvePct` reaches the Pairs "Near graduation" column only for
a handful of coins: on the real 200k-block replay (2,475 Pons coins), none of the 100 newest coins in the New column had
it. The engines compute it from the curve's launch inventory and current balance, and total supply / launch inventory is
known for few coins. Spec: `docs/eko/04-BACKEND.md` §6.4–6.5 (supply, card), `docs/guard/guard-2.0.md` §2.5 (supply and
curve inventory definitions), the Pons facts in `docs/guard/research/facts-and-requirements.md` §2 and
`docs/guard/research/research-robinhood-chain.md` (curve mechanics and graduation threshold).

## Do

1. Find why `curvePct` is missing for most coins on real data (which input is absent: launch inventory, curve balance,
   total supply, graduation threshold) and fix it from data we already index (the launch block's `Transfer` into the
   curve, `CurveBuy`/`CurveSell` amounts, `TokenLaunched.graduationThreshold`) or, where the indexer doesn't capture the
   needed input yet, add it to the indexer for Pons launches (no per-block RPC; at most one pinned read per launch,
   metered).
2. Progress must match Pons's own definition of progress toward graduation (quote raised vs threshold, or tokens sold vs
   sellable inventory: use whichever the Pons contract uses, per the research file; say which) and be exact at launch
   (0%) and at graduation (100%).
3. Tests on the captured fixtures plus synthetic launches; replay determinism unchanged.

## Don't

- No new dependencies. Don't edit `docs/eko/` or `docs/guard/`. Rule 9. No network in your sandbox; the lead reruns on
  real data.

## Report

The root cause, the fix, the definition used, tests, and typecheck/test/brand:check/check:addresses results.
