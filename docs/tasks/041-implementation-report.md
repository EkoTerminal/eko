# Task 041 implementation report

Prepared, uncommitted implementation. Source revision: `4fc8b615cd12828b2d555ab17f5d654b314bf11c`. Candidate source/test/migration manifest SHA-256: `967be50898c80b108640f32c7bc4d059d7e00096df03ce7e59073f8e941be731`; sorted relative paths and content hashes are in `/private/tmp/eko-041-candidate.json`. This report is excluded from that manifest. No personal identifiers were added or ported. No commit, deployment, paid job, network acquisition or listening port was started. V2 remains shadow/inactive.

Follows Guard 2.0 §3.4 and its shared directional-depth contract in §7.1. The task's local 48-total-evaluation solver supersedes BACKEND §6.1's older remote quote-search/8-quote description. Existing quote-age, actual-account execution and release gates are not completed by local predictions.

## Changed files

- `packages/chain/src/simulation/depth.ts`: pure integer bracket/refine solver, $1 starting bracket, doubling through the $1m cap, at most 48 evaluations including bracketing, ≤1% relative refinement, raw-lattice exact maximum proof, directional lower/upper bounds, termination/domain/USD precision and lower-bound policy-floor proof. A search/evaluation cap never becomes an exact observation.
- `packages/chain/src/simulation/depth-v3.ts`: local exact-input concentrated-liquidity steps with integer input/output/fee rounding and pinned constant-L tick intervals. Handles either token orientation, initialized boundaries, zero-L gaps and proved finite venue capacity. Incomplete reconstruction and unknown/nonmonotone hooks are unsupported. No interpolation or cross-pool L aggregation.
- `packages/chain/src/simulation/directional-depth.ts`: buy/sell 2/5/10 marginal-price solves, market-only inputs, separate fresh fee-inclusive quotes for supplied sizes/account fee profiles, actual held-quantity sell-only prediction, refunds, rational net-proceeds selection and byte-ordered exact ties. Uses the existing 040 integer Pons model; no universal Pons fee or EKO execution leg is enabled. All size quotes remain `local_prediction`.
- `packages/chain/src/simulation/depth-removal.ts`: validates position coverage, snapshot cursor/hash, provenance, custody and aligned per-pool intervals before subtraction. Recomputes every supplied reachable supported route at its original valuation, then sums distinct pools' USD depth bounds, never their L units. Retains a conservative removal-share interval. Incomplete discovery/positions are unknown; full depth zero is an unknown ratio with a separate no-exit finding.
- `packages/chain/src/simulation/depth-run.ts`, `packages/chain/src/index.ts`: explicit opt-in run envelope, immutable input/route fingerprints, all six cuts, independent $100/$1k/$10k bands by account profile, all candidate quotes/best route/ties, conservative single-route headline floor and separate local evaluation counters. Unsupported routes cannot establish zero token-wide capacity.
- `packages/chain/src/simulation/pons-math.ts`: fixes the terminal reserve-boundary state so a final capped buy's acquired position can be sold. Further buys with no available allocation return the input as a refund. The existing tests were retained, with a new final-buy/refund/sell regression.
- `apps/engines/src/directional-depth.ts`, `apps/engines/src/index.ts`: opt-in immutable prediction persistence with canonical-block and digest/conflict checks; rejects fixture-origin recording. Shared card adapter preserves bounds/provenance and never promotes a refined interval to an exact metric or completes an execution check.
- `packages/shared/src/contracts/guard-v2.ts`, `packages/shared/test/fixtures/contracts/guard-v2.ts`: additive optional closed solver domain/termination/raw-bound/zero-remote-call fields and exported directional measurement schema, with its frozen contract fixture. Existing card fixtures remain compatible.
- `packages/db/drizzle/0134_directional_depth.sql`, `packages/db/src/{engines-migrate,engines-schema}.ts`, `packages/db/test/merge-migrations.test.ts`: reserved engines migration 0134 and retained prediction table/index; fresh/upgrade/idempotence checks. Server migration 0015 was not needed. No dependencies or lockfile changes.
- `packages/chain/test/{directional-depth-fixtures,directional-depth.test}.ts`, `apps/engines/test/directional-depth.test.ts`: synthetic arithmetic, bounds, independent quotes, removal, shared adaptation and recording tests.

## Verification

Commands run from the repository root:

| Command | Exit | Evidence |
|---|---|---|
| `pnpm --filter @eko/chain test test/directional-depth.test.ts test/pons-simulation.test.ts` | 0 | 27 tests; `/private/tmp/eko-041-chain-focused-final.log` |
| `pnpm --filter @eko/engines test test/directional-depth.test.ts` | 0 | 2 tests; `/private/tmp/eko-041-engines-focused-final.log` |
| `pnpm --filter @eko/db test test/merge-migrations.test.ts` | 0 | 3 tests; `/private/tmp/eko-041-db-focused.log` |
| `pnpm --filter @eko/shared test test/contracts.test.ts` | 0 | 197 tests; `/private/tmp/eko-041-shared-focused.log` |
| `pnpm typecheck` | 0 | `/private/tmp/eko-041-typecheck-final.log` |
| `pnpm test` | 0 | `/private/tmp/eko-041-test-final.log` |
| `git diff --check` | 0 | No whitespace errors |

The final full gate passed all workspace suites and built role-image checks with fixture RPC and no ports/providers. The existing contract suite passed 33 tests and retained its one RPC-dependent fork skip; no new skip was introduced. Full chain coverage: 202 tests; engines: 194; indexer: 119; server: 259.

The first full test attempt found the missing frozen fixture for the newly exported schema. That fixture was added; the focused contract gate above passed before the final full run. No assertion or existing test was removed, skipped or weakened.

Fixture measurements are in `/private/tmp/eko-041-fixture-evaluations.json`: one synthetic Pons pool uses **122** depth evaluations across the six cuts (18/21/22 buy, 18/21/22 sell), one synthetic v3 pool uses **116** (17/20/21 buy, 17/20/21 sell). Each independently quotes three sizes. Each individual depth solve stays below 48 evaluations; these aggregate counts are not a per-solve cap. A separate always-acceptable search fixture reaches the $1m lower bound in **21** local evaluations. Bounds are checked against independent constant-product/concentrated-liquidity inversion, including an initialized interval crossing.

Actual upstream/search requests: **0**; actual paid request units: **0**; actual charged cost: **$0**. Provider pricing, real deployed coverage and matched EVM execution were not measured. The v3/Pons fixtures and in-process database checks are synthetic validation, not measured route acceptance. No acquisition or local EVM process is running.

## Remaining gates and reproduction

- Supported reconstruction is a reviewed 040 Pons integer model or a complete single-pool v3 tick-interval snapshot. 068's remote quoter alone is not such a reconstruction. Supply canonical state/code/profile and USD-quality evidence before treating an input as measured. Bind Pons inputs through the existing 039/040 control-profile review. Missing measured inputs remain a gate; a boolean fixture profile is not deployment acceptance.
- Multi-hop/split execution, v4/hooks and Pons successor custody are not certified by these adapters. Preserve incomplete route discovery for those residuals; 042 owns successor/custody integration. Local single-route headline bounds can prove smaller floors; they do not establish complete token-wide route coverage.
- The local quote model needs supplied applicable fee profiles. A partially refunded buy with nonzero app entry fees is unsupported until its charge/refund order is reviewed. Gas/L1, token/account restrictions, cooldowns and actual-account entitlement require execution evidence from 040/052. Do not promote local math to a passed execution check.
- In an authorized environment, supply exact tick endpoints/coverage or Pons reserves, pinned USD conversion and reviewed profile to `computeLocalDepthRun`. Validate each direction/cut and independent order against matched local/fork execution with ≤1% error, record metered units/pricing/cost/coverage, and only then call `persistLocalDepthRun` for measured-source predictions. Fixture runs must remain separate. Rerun the focused commands above to reproduce local coverage without network or ports.
- `TODO(spec)`: Guard §7.1 does not specify the reconstruction/run acquisition envelope. The versioned normalizer-local prediction record is stored separately; shared card records retain the existing metric contract plus optional closed solver metadata.

Checkpoint: `/private/tmp/eko-041-checkpoint.json`. All final verification processes have ended with exit 0. Next action: lead review/commit, then obtain the missing reviewed measured reconstruction/execution evidence and continue 042 → 052 → 075. This work has not been released and does not authorize trading activation.
