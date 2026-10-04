# Task 140 · Smart-account traders and card availability with unattributed swaps

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§4.3–4.4, 5.1–5.2, 6; Guard 2.0
§§2.1, 2.2, 8 (coverage and `incomplete`); task 133 and 043 reports.

## Why

The lead indexed one real graduated Pons coin end to end (ANYR, 8,337 swaps over 87 hours) and opened its page. The card
was frozen at the launch block, 82 hours stale, showing curve-era numbers ($2K market cap against about $1.0M real).
There were two causes:

1. **One unattributed swap freezes the whole card, forever.** `loadSources` (apps/engines/src/sources.ts) returns null
   when any swap or liquidity event at or before the block has `senders_pending` or a null trader/actor. ANYR had 2
   such curve trades (the first 7 blocks after launch) and 873 such v4 swaps, so every checkpoint after launch was
   skipped silently. Every other coin in the sample got about 100 evaluations, and ANYR got 1. Any busy coin will hit
   this.
2. **Smart-account trades have no trader.** 827 of those 875 swaps were ERC-4337 UserOps (the transaction goes to
   EntryPoint v0.8 `0x4337…f108`, v0.7 `0x0000…a032` or v0.6 `0x5FF1…2789`, now verified in the registry). Task 133
   stores the EntryPoint evidence but leaves the actor null unless a full 043 trace binding is supplied.

Trading agents mostly use smart accounts, so a guard that cannot attribute UserOps cannot see the market EKO is built
for.

## Do

1. **UserOp trader attribution from receipts (no traces).** For a transaction to a registry-verified EntryPoint, map
   each swap or transfer log to its UserOp by log order: an operation's execution logs come before its
   `UserOperationEvent` (and after the previous op's event, or after `BeforeExecution` for the first). The trader is
   that op's `sender` (the smart account). Record the account class (`erc4337`) and keep the bundler (`tx.from`) and
   any paymaster as separate, non-trader roles. When the bracketing is ambiguous (mismatched counts, nested or
   unknown EntryPoint), the actor stays null with a named reason. This is holder-level attribution only: 043's strict
   principal and control bindings still decide who **controls** an account, and nothing here may feed a control or
   bundle claim on its own. Backfill and live follower must produce identical rows.
2. **Cards keep updating when some swaps are unattributed.** Replace the all-or-nothing gate in `loadSources`:
   - Price, liquidity, curve or pool state, supply and volume still update from all swaps.
   - Attribution-dependent measures (holder concentration by actor, insider and deployer sells, bundles, fresh-wallet
     share, wallet flow) are computed from attributed rows only. Each carries the unattributed share (count and
     volume) as a named coverage gap.
   - Above a threshold you take from the spec or set conservatively and document (for example, 5% of volume in the
     window), each dependent check is `incomplete` / "Not fully checked" with that reason. It is never silently
     clean, and the gap is never filled with a guess.
   - Unattributed rows never enter an aggregate as if attributed. That is the intent of the old gate, and it is kept.
   - Never skip a checkpoint silently: if a card cannot be produced, record why (a counter and a reason on the coin).
3. **Re-evaluation.** When rows later become attributed (sender enrichment, a new EntryPoint mapping), the affected
   coins are re-evaluated through the existing activity revision, without a full replay.
4. **Tests** offline:
   - one UserOp, two UserOps in one bundle, and a paymaster-sponsored op;
   - mismatched event counts, and an unverified EntryPoint;
   - backfill and follower parity;
   - a coin with a small unattributed share (card updates, gap named);
   - a coin with a large share (dependent checks incomplete, price still current);
   - the old freeze reproduced as a regression: a coin with one early unattributed swap must still get a card at
     head.

## Don't

- No traces or new paid calls per transaction; receipts are already acquired. No new dependencies. Don't edit
  `docs/eko/` or the Guard design; flag spec conflicts as `TODO(spec)`. Rule 9.
- Don't weaken 043's principal rules or treat a bundler, paymaster or EntryPoint as the trader.

## Report

Files, the attribution rule and its ambiguity cases, the coverage-gap fields and threshold, test results, and
typecheck, test, brand:check and check:addresses results.
