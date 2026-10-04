# Task 139 · Pons fork manifest builder and on-curve fee accrual reconciliation

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: Guard 2.0 §§3.4, 8; task 040 and 138 reports;
`docs/guard/research/pons-executable-notes.md`; `docs/operations/fork-checks.md`.
Dependencies: 040 (Pons reference exit), 138 (metered fork gateway and `fork:check`). 072 is being built in parallel and
owns unsigned trade legs; stay out of its scope.

The lead now has a metered fork gateway, but every fork check needs a `ForkCheckManifest` with a reviewed
`PonsCurveRoute`. Writing one by hand is slow and error-prone. Also, the 040 simulator reconciles each trade's charge
against **native payouts** to `route.recipients`. Pons v2 does not pay fees out per trade: the published curve adds
`fee` to `quoteFeeBalance` and `tax` to `creatorTaxBalance` (and earmarks a buyback slice in `buybackQuoteBalance`),
and only `sweepFees` pays them out. So the charge is real but no recipient's balance moves, and every Pons
observation ends in `fidelity_mismatch`.

## Do

1. **Accrual reconciliation (040b).** Add an optional `accruals: PonsStaticCall[]` to `PonsCurveRoute`: one-word
   getters on the curve whose increase holds a trade's charge (for Pons v2: `quoteFeeBalance()` and
   `creatorTaxBalance()`; `buybackQuoteBalance` is a slice of `quoteFeeBalance`, so it must not be added twice).
   A charge reconciles when it equals the native payouts plus the accrual deltas, each non-negative. Record the
   accrual deltas in the observation next to `buyPayouts`/`sellPayouts`. Routes without `accruals` behave exactly as
   before. Test: charges held entirely on the curve, charges paid out entirely, a mix, a negative delta, and the
   buyback slice not double-counted.
2. **`fork:manifest` CLI** in `packages/chain`. Inputs: a pinned block number (or `head-minus N`), and either a list
   of Pons coin addresses or `--from-db N` (the N most recently traded, not graduated, not ready-to-graduate Pons curves
   from the indexer tables). It reads only through `createMeteredClients` (the archive client for pinned reads), with
   a finite `RPC_SESSION_BUDGET` required. For each coin it builds the full `PonsCurveRoute`:
   - the cursor (block hash and timestamp from the pinned header);
   - code-hash pins for the coin, curve and factory, and the selectors from pons-executable-notes, each checked
     against the deployed bytecode (dispatcher PUSH4 scan); a missing selector makes the coin `unsupported` with a
     reason, never a guessed binding;
   - `execution.buy` = `buy(amount, 0, recipient)` and `execution.sell` = `sell(amount, 0, recipient)` on the curve,
     with the curve as `spender`;
   - `stateReads`: `trackedTokens()`, `realQuoteReserve()`, `phantomQuote()`, `reservedTokens()`;
   - `accruals` from step 1;
   - buy and sell terms from `feeBps()` and `creatorTaxBps()` on the gross amount, plus the anti-snipe term if
     `currentSnipeTaxBps(token)` is not zero at the pin (then mark the coin as in its snipe window);
   - `decayEndSec` from the launch timestamp plus the launch's snapshotted snipe window, read from the factory
     (fall back to `unsupported` if the deployed factory does not expose it);
   - exemptions from the factory's launch record and events (launcher, fee recipient, any declared list), with
     `complete` true only when the source proves completeness;
   - `cooldown` `{seconds: 0}` only with evidence (no cooldown code path in the deployed curve), else `null`;
   - `feeAccounting.gasIncludesL1` from a receipt check on chain 4663 (Arbitrum-style `gasUsed` includes L1);
   - `origin: 'measured'`, `reviewed: false`, and evidence IDs that are digests of the exact reads.
   It also writes `ethUsd` as an exact rational from the WETH/USDG pool `slot0` at the pinned block hash (reuse
   the indexer's pool choice; no floating point). It prints each coin's supported/unsupported status and the request
   units used. The lead reviews the file and sets `reviewed: true` by hand; the CLI never does.
3. **Docs.** Add the command, the review checklist (what the lead must confirm before flipping `reviewed`) and the
   expected cost per coin to `docs/operations/fork-checks.md`.
4. **Tests** offline with a fake archive: a complete Pons coin, a missing selector, a coin inside its snipe window, an
   unknown factory layout, an incomplete exemption list, and the exact ETH/USD rational.

## Don't

- No new dependencies. Don't edit `docs/eko/` or the Guard design. Rule 9.
- No network in your sandbox. The lead runs the CLI with a session budget.
- Never mark a route reviewed, never invent bindings, and never relax the existing fidelity or completeness gates
  beyond the accrual reconciliation above.

## Report

Files, the route fields and where each comes from, the accrual change and its tests, the exact lead commands, the
expected request units per coin, and typecheck, test, brand:check and check:addresses results.
