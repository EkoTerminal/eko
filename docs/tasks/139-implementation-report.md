# Task 139 implementation report

Implemented task 139 on the task 138 worktree, without dependencies, migrations, spec edits, network acquisition, listening ports, commits or pushes. Base revision: `8a16132dfca545de68e9f84ea50f6baff95df451`. The lead commits. Candidate source/document manifest SHA-256: `5c8ddf1a42f459a094745163532285f745ff59e2c7867f356ca8813c1885e351` (`/private/tmp/eko-139-candidate.json`, this report excluded). The supplied untracked task packet was preserved. No personal identifiers or real credentials were added or ported; published Solidity files were read for reference, not copied into the repository.

Followed Guard 2.0 §§3.4 and 8, task 040's reconciliation/fidelity contract, task 138's paid metering, executable Pons notes and operations guidance. The deployed code wins over published source. Task 072's unsigned-leg implementation was left unchanged.

## Files

- `packages/chain/src/simulation/pons.ts`: optional curve-only, argument-free, independent one-word `accruals`; signed `buyAccruals`/`sellAccruals`; payout-plus-accrual charge reconciliation. Duplicate buckets, negative deltas and non-word returns are rejected. No unsigned-leg changes.
- `packages/chain/src/simulation/fork-manifest.ts`: offline-testable pinned builder, dispatcher disassembly, code pins, native curve wiring, reviewed factory timing bindings, full exemption-log paging, receipt evidence, exact rational price, database discovery and final pin recheck. Exports strict code-review schema and measured but unreviewed candidates.
- `packages/chain/src/simulation/fork-manifest-cli.ts`: finite-budget CLI, paid-only `createMeteredClients().forkArchive` reads, pin or head-minus input, address list or indexed discovery, private output permissions, status/unit reporting, shutdown and meter/database cleanup. Provider error bodies never enter the report. Budget/shutdown stops propagate; interrupted acquisition prints available session units and does not publish a partial manifest.
- `packages/chain/package.json`, `src/index.ts`: command and builder exports. Dependency declarations did not change, so no lockfile update was needed.
- `packages/chain/test/fork-manifest.test.ts`: nine offline tests using a fake archive and an in-memory database; complete coin, missing execution/timing selector, unknown factory binding/return layout, snipe window, incomplete exemptions, unknown cooldown/L1 evidence, exact rational in both token orders, reorganization, budget admission/closure, ready exclusion, pinned recent-trade ordering and dispatcher-data false positives.
- `packages/chain/test/pons-simulation.test.ts`: existing payout fixture retained; full accruals, mixed accounting, full payouts with optional buckets, negative delta even when the signed sum balances, overlapping buyback earmark and invalid duplicate/argument-bearing getters.
- `docs/operations/fork-checks.md`: commands, review schema/checklist, unsupported semantics, profile-binding dependency and spending estimate.

## Route fields and provenance

| Field | Source |
|---|---|
| `cursor` | Metered chain ID and pinned numbered header, including hash/time; numbered header rechecked before publication. |
| `coin`, `curve`, factory pin | Coin input or indexed recent trades; deployed token `curve()`/`launchFactory()`, registry factory, curve `token()`/`factory()`/native `pairToken()` cross-checks. |
| `verification.pins` | Keccak-256 of deployed coin, curve and factory bytecode at `{blockHash,requireCanonical:true}`. |
| Execution/selectors/spender | Published signatures and executable notes; disassembled deployed PUSH4/EQ/conditional-jump dispatchers. Buy/sell static arguments are `[amount,0,recipient]`; spender is curve. All notes' curve selectors are required. |
| `stateReads` | Checked `trackedTokens()`, `realQuoteReserve()`, `phantomQuote()`, `reservedTokens()` selectors and exact one-word pinned returns. |
| `accruals` | Checked one-word `quoteFeeBalance()` and `creatorTaxBalance()`; excludes the overlapping `buybackQuoteBalance()` earmark. |
| Buy/sell terms | Pinned `feeBps()`/`creatorTaxBps()` on gross quote, creator tax cross-checked against launch record. Nonzero `currentSnipeTaxBps(token)` adds a gross buy-only temporary term and marks `inSnipeWindow`. |
| `decayEndSec` | Launch timestamp plus launch's frozen snipe duration, through explicit reviewed per-token factory getters. Launch block also comes from a reviewed getter. Never current global defaults. |
| `recipients` | Curve `deployer()` (cross-checked with factory creator recipient), `protocolFeeRecipient()` and `feeEscrow()`; duplicate addresses removed. |
| `exemptions` | Factory launcher/creator recipient plus every curve exemption event from launch block through pin. Completeness additionally requires code-hash-bound review proving exhaustive event emission and absence of unlogged mutation. |
| `cooldown`, limits | Code-hash-bound code-path evidence. Zero cooldown requires explicit no-cooldown proof; otherwise null. Unknown limit/exemption/cooldown evidence keeps a candidate unsupported. Error-selector lists remain empty; no guessed revert classification is introduced. |
| `feeAccounting.gasIncludesL1` | Pinned 4663 receipt with positive `gasUsedForL1 <= gasUsed` and positive effective price; receipt digest attached. Missing receipt evidence remains unsupported. Lead confirms provider semantics. |
| `origin`, `reviewed` | Always measured and false respectively. CLI never approves a route or creates historical matches. |
| `sourceRevision`, evidence IDs | Explicit code-review revision/digests plus digests of exact RPC method/params/result. Exact successful reads are retained in `manifestBuild.evidence`. |
| Candidate `profileHash`, `stateFingerprint` | Digests of the acquired pin/config/code/review and exact dependencies; require task 039 profile binding before normalizer integration. These are not completed control profiles. |
| `ethUsd` | Pinned WETH/USDG `slot0`; same standard-fee order and greatest-positive-liquidity rule as indexer, first discovery wins ties. Registry decimals and token order enter reduced BigInt numerator/denominator; no floating point. |

`--from-db` orders by the latest trade at/before the pin and log order, excludes indexed graduations, and archive-checks graduation/readiness. Confirmed graduated/ready coins are skipped. An unsupported unknown candidate occupies a requested discovery slot and is reported, never silently assumed eligible. Only supported candidate routes enter executable `coins`; unsupported evidence remains in `manifestBuild.statuses`.

## Accrual reconciliation

For each direction, observed charge must equal native payout deltas plus independent accrued-bucket deltas. Every individual delta and charge must be non-negative. The original reserve/debit/output/network/fidelity checks remain mandatory. Routes without `accruals` retain the payout-only behavior and make no added bucket reads. The buyback bucket is a slice, not an additional charge; deliberately adding it to an observation fails reconciliation. Sweeps that reduce a bucket also remain mismatches. Existing completeness and diverse measured-match gates were not relaxed.

## Lead commands and units

Export the existing secret environment, shared daily budget database and reviewed coin list. Do not place secret values in arguments or artifacts. Obtain the code-path review first; the operation docs specify every review field and the checklist before manually setting a route's `verification.reviewed: true`.

```sh
RPC_SESSION_BUDGET=200 pnpm --filter @eko/chain fork:manifest 77438503 --coins "$PONS_COINS" --review /private/tmp/eko-pons-code-review.json --output /private/tmp/eko-fork-manifest.json
RPC_SESSION_BUDGET=500 pnpm --filter @eko/chain fork:manifest head-minus 20 --from-db 5 --review /private/tmp/eko-pons-code-review.json --output /private/tmp/eko-fork-manifest.json
RPC_SESSION_BUDGET=2000 pnpm --filter @eko/chain fork:check /private/tmp/eko-fork-manifest.json /private/tmp/eko-fork-results.json 1
```

Replace the illustrative block with the intended pin. `PONS_COINS` is comma-separated coin addresses. The third command runs only after route review; it does not approve its own observations.

Cold estimate: **26 + exemption-log pages per coin**, each page covering at most 100,000 blocks, plus **8–20 shared requests** for chain/header/receipt/price discovery and one additional request for head-minus. One page means 27 per coin. The complete synthetic one-pool fixture proves 38 archive invocations: 27 coin reads plus 11 shared reads. Shared factory/code/config reads are reused within an invocation. There is no persistent builder cache. Configured method weights, retries and longer histories change actual units; `upstreamRequestUnits` is the meter's actual session total, while `requests` counts builder archive invocations. No dollars are inferred.

## Ambiguities and remaining lead work

New `TODO(spec)` in `fork-manifest.ts`: no deployed per-launch timing ABI is documented. The published 15-word launch record contains no launch timestamp/window/block; published factory source also differs from deployed anti-snipe curve behavior. The smallest fail-closed reading accepts only explicit code-hash-bound reviewed per-launch getter signatures, validates their dispatcher presence and one-word returns, and otherwise reports unsupported. It never invents timing bindings or derives a launch snapshot from current global configuration. Unknown extended factory layouts need a separately verified adapter extension; no speculative adapter was added.

No deployed deployment-review file was fabricated. The lead must establish timing getters, exhaustive exemptions and absence of cooldown/entry limits from actual deployed code, confirm L1 receipt semantics and pinned price provenance, bind the task 039 profile, manually approve route fields, and acquire real fork comparisons. The sandbox could not acquire those facts. The builder and accrual change are implemented; deployed supported-route coverage and measured acceptance are not claimed.

## Verification

| Command | Result | Evidence |
|---|---|---|
| `pnpm --filter @eko/chain exec vitest run test/fork-manifest.test.ts test/pons-simulation.test.ts` | Exit 0; 23 tests passed | `/private/tmp/eko-139-focused-final.log` |
| `pnpm typecheck` | Exit 0; all workspace packages passed | `/private/tmp/eko-139-typecheck-final.log` |
| `pnpm --filter @eko/chain typecheck` | Exit 0; final paid-only CLI binding rechecked | `/private/tmp/eko-139-chain-typecheck-final.log` |
| `VITEST_MAX_WORKERS=1 pnpm test` | Exit 0; 2,635 workspace Vitest tests, contract/self-tests, web/server builds and built-role fixtures passed | `/private/tmp/eko-139-test-final.log` |
| `pnpm brand:check` | Exit 0; 145 served/configured files | `/private/tmp/eko-139-brand-final.log` |
| `pnpm check:addresses` | Exit 0; 395 source files | `/private/tmp/eko-139-addresses-final.log` |
| `git diff --check` | Exit 0 | Final tracked whitespace check |

The first focused attempts exposed a test-parenthesis typo, TypeScript narrowing/event-ABI typing, and checksum-sensitive mock comparisons. Those were corrected before the final gate; no existing assertions were removed, skipped or weakened. The full workspace gate passed on its first invocation. The existing RPC-dependent contract fork coverage stayed skipped without an RPC endpoint. Verification logs have workspace paths redacted to neutral placeholders.

All verification processes have exited. Actual deployed/archive acquisition: **zero calls, zero paid units, zero real fork matches**. Synthetic RPC usage in existing fixture tests is not provider acquisition. No dependency, lockfile or database migration was added; engines 0143 was unused. No personal identifiers were introduced. The lead still owns commit and live/deployed review.
