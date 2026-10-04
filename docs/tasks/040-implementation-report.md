# Task 040 implementation report

Prepared implementation; **the measured Pons route acceptance gate remains incomplete**. Source revision: `3709c4ce6b56c6427cf8c3fa3534f7117d201295`. Candidate: uncommitted worktree, source/test manifest SHA-256 `7364a989f5000048f9dd5a219250502d8655d79687e7a68ebeafcf716f4ac79d`. The sorted relative-path/content manifest is `/private/tmp/eko-040-candidate.json`; this report is excluded. No personal identifiers were added or ported. No commit, deployment, publication, paid job, network acquisition or listening port was started.

Follows Guard 2.0 §§3.4, 8.1, 9.1; shares task 068's `RoundTripAmounts`/`DeepEvidence`, `ForkMatch`, amount/digest helpers and exclusive metered fork-reset leases. V3 defaults and behavior remain intact. Guard's executable/profile/fidelity gates take precedence over the October 1 ABI note's statement that event/getter fragments are sufficient to remove quote-only fallback. No production ABI or reviewed Pons template is fabricated from that note.

Changed areas:

- `packages/chain/src/simulation/pons-math.ts`: pure integer output-floor constant-product candidate, explicit ordered charge terms, captured real/virtual quote reserves, reserved allocation, final-buy refunds, independent post-buy no-tax sell denominator and capacity. No universal fee, recipient split or antisnipe duration. The kernel describes the synthetic supported fixture; source review and measured matching must establish whether a deployment uses this exact rounding and charge order.
- `packages/chain/src/simulation/pons.ts`: explicit native-curve route bindings and supplied static selectors/argument layouts, exact code/profile/configuration/source fingerprints, two deterministic non-exempt identities per EOA and injected `bw-probe` contract class, independent resets per run, exact acquired-amount approval, delayed sell with purchased storage retained, and real-held-position sell-only execution. Records Q/R after refunds, reserve/payout conservation, total effective buy/sell charges, venue/all-in costs, network/L1 fees, original balances/allowances, permitted funding/code overrides, limits, cooldown and raw traces. Signed net exit cash can be negative. Fixed severe fees are cost findings; known entry caps, token/class restrictions, capacity failures, provider gaps and unresolved cooldown remain distinct. No token storage/checks are overridden. EKO curve fee is zero. Pons v4 remains explicitly unsupported.
- `packages/chain/src/simulation/{types,reference}.ts`, `index.ts`: additive Pons venue in the shared match interface and exports; existing v3 fidelity calls retain their defaults. Pons completion additionally requires measured provenance, matching model/source/delay, 30 distinct cases per size/class, exact debit, ≤1% positive proceeds error and no venue or all-in harm reversal. Fixtures cannot complete a route. Local trajectories are explicitly `isolated_persistent_local` with `benchmarkQualified=false`; independently reproduced restriction outcome labels remain with their owning packets.
- `packages/chain/probe/BwProbe.sol`, `simulation/probe-runtime.ts`: never-deployed contract-account execution helper, preserving actual caller identity and purchase state across transactions; regenerated pinned compiler runtime. The existing v3 round-trip entry point remains intact. This contract class does not certify an arbitrary agent smart account.
- `packages/chain/probe/test/PonsCurve.t.sol`, `test/{pons-simulation.test,generate-pons-evm-cases}.ts`: native/token balance-delta fixtures, 120 exact TS/Solidity comparisons (30 per nominal size/class), refunds, ordinary/creator/temporary/fixed charges, privileged-recipient leakage, delayed purchased-state sell, first failed attempt, contract-specific restriction, held sells, provider/pin failures, isolation and real-match gate negatives. Nominal $100/$1k fixture inputs use an illustrative conversion; they are not a measured ETH-USD price or chain benchmark.
- `apps/engines/src/pons-reference.ts`, `index.ts`, `test/pons-reference.test.ts`: exact 039 snapshot/digest binding and explicit normalizer-owned immutable recording in 068's `sim_runs`; nested account traces are excluded from permanent summaries and expire under the existing 30-day retention. Fixture persistence, stale/reorg pins and conflicting revisions are rejected. No worker, card check or active V2 policy is enabled. No migration or dependency change was needed; engines 0133/server 0014 reservations are unused.
- `packages/chain/src/simulation/pons-fork-cli.ts`: prepared lead-only local driver; accepts only local Anvil/local metered gateway URLs, a reviewed measured manifest, pinned rational ETH-USD provenance and gateway evidence. Runs independent $100/$1k cases and optional actual held-position sells, with serialized resets. It records local RPC call count separately; upstream units/pricing/cost remain null until the gateway ledger is attached.

Final verification (offline):

| Exact command | Exit | Evidence/log |
|---|---:|---|
| `pnpm --filter @eko/chain exec vitest run test/pons-simulation.test.ts test/reference-simulation.test.ts test/reference-anvil.test.ts` | 0 | 21 tests; `/private/tmp/eko-040-chain-focused-final.log` |
| `pnpm --filter @eko/engines exec vitest run test/pons-reference.test.ts` | 0 | 3 tests; `/private/tmp/eko-040-engines-focused-final.log` |
| `forge test --root packages/chain/probe --out /private/tmp/eko-040-probe-out --cache-path /private/tmp/eko-040-probe-cache` | 0 | 16 tests, including 120 synthetic comparisons; `/private/tmp/eko-040-evm.log` |
| `pnpm --filter @eko/chain exec node --import tsx test/generate-pons-evm-cases.ts --check` | 0 | Exact checked-in Solidity expectations; `/private/tmp/eko-040-evm-cases.log` |
| `node packages/chain/probe/build.mjs --check` | 0 | Runtime matches solc 0.8.26/Cancun/10,000 optimizer runs; `/private/tmp/eko-040-probe-check.log` |
| `pnpm typecheck` | 0 | Final source candidate; `/private/tmp/eko-040-typecheck-final.log` |
| `pnpm test` | 0 | Final candidate: all workspace suites and built role checks; `/private/tmp/eko-040-test-final.log` |
| `pnpm brand:check` | 0 | 132 files; `/private/tmp/eko-040-brand-final.log` |
| `pnpm check:addresses` | 0 | 357 source files; `/private/tmp/eko-040-addresses-final.log` |
| `git diff --check` | 0 | Tracked whitespace |

The ordinary `tsx` CLI could not start its IPC listener in this sandbox (exit 1); `node --import tsx` runs the same fixture generator without a port and passed. Initial fixture failures exposed checksum-sensitive mock address comparison and a Solidity prank consumed by a getter; both were corrected. The final unsigned-leg regression also exposed a nonzero sell-template placeholder; it was corrected to zero with the exact acquired-amount patch offset. That focused run and the second workspace attempt exited 1 (`/private/tmp/eko-040-sell-leg-regression-failed.log`, `/private/tmp/eko-040-test-attempt2.log`); the corrected focused check passed before starting the final gate. No existing tests were removed, skipped or weakened.

New `TODO(spec)` notes:

1. `simulation/pons.ts`: executable deployed ABI and integer rounding are absent locally. Supplied reviewed selector/math bindings and measured fork matches are mandatory before a route can complete.
2. `simulation/pons-fork-cli.ts`: gateway installation and pricing are unspecified. The driver requires an already configured local gateway that meters **every** upstream Anvil read, including lazy storage acquisition. It does not accept a direct paid endpoint. The existing task-068 lease TODO remains applicable.

Actual acquisition: **0 upstream requests, 0 request units, $0 charged cost, 0 real fork matches**. Provider pricing and deployed route coverage were not measured. Fixture coverage includes one synthetic native curve, both reference sizes and EOA/`bw-probe` classes. No deployed Pons route, arbitrary smart-account class, ERC-20 pairing, successor execution, independent provider reproduction or observed delayed benchmark is accepted. Existing unavailable 039 measured-profile validation remains a dependency.

Prepared pinned fork reproduction for the lead, in a separately authorized environment with the local metered gateway already running:

```sh
export EKO_METERED_FORK_GATEWAY_URL=http://127.0.0.1:9545
anvil --fork-url "${EKO_METERED_FORK_GATEWAY_URL:?}" --fork-block-number 77438503 --chain-id 4663 --host 127.0.0.1 --port 8545 > /private/tmp/eko-040-anvil.log 2>&1
```

Before execution, the manifest and gateway must agree on the existing fixture pin: chain 4663, block **77438503**, hash **`0x0d965bb9263618e68aa2b869c5d9476487b80f3b142e96cca52fa68c8213e314`**, timestamp **1790864133**. This pin comes from `packages/chain/test/fixtures/4663/pons-buy-tx.json`; it was not reacquired here. The driver rechecks hash/time/chain and reviewed code pins on each reset.

In another shell, from the repository:

```sh
export EKO_LOCAL_FORK_RPC=http://127.0.0.1:8545
export EKO_METERED_FORK_GATEWAY_URL=http://127.0.0.1:9545
pnpm --filter @eko/chain exec node --import tsx src/simulation/pons-fork-cli.ts /private/tmp/eko-040-measured-manifest.json /private/tmp/eko-040-fork-results.json > /private/tmp/eko-040-fork-driver.log 2>&1
```

The required manifest is **not seeded with invented measured evidence**. Supply `cursor`, the reviewed native `route` (all pins, 039 profile/source fingerprint, static execution/state getter selectors, actual terms/recipients/exemptions/limits/cooldown/decay/network accounting), `matches`, `delaySec`, `meteringEvidenceId`, and `ethUsd:{numerator,denominator,blockHash,evidenceIds}`. Charge-term bps/fixedWei use decimal strings. Optional `held` entries contain `sizeUsd`, actual `account`, supported `accountClass`, and raw `quantity`; the driver reads actual holdings and never overrides token balance/storage. The route's `profileHash`/fingerprint must first bind through `bindPonsControlProfile` against 039's measured reviewed snapshot.

Next action: acquire/review those missing bindings and first measured profile; run this exact pin through the authorized metered gateway, attach units/pricing/cost and ledger/checkpoint, expand diverse real matches for each size/class/delay, and independently reproduce persistent restrictions before outcome labeling. The driver saves observations even when no match gate is available; a successful process is not route acceptance. Primary 60-second entry/3,600-second observed exit, delayed sensitivities, observed-state paper paths and retained-impact replay acceptance still need actual historical states and matched truth. Never advance a failed primary exit until conditions improve or replace it with a later retry.

Checkpoint: `/private/tmp/eko-040-checkpoint.json`. All verification processes ended with the final commands at exit 0; the existing RPC-dependent contract fork test remains skipped with no RPC URL. No acquisition/Anvil process is running here. Prepared driver and fixture-tested arithmetic are available for downstream 041/042/052 integration; measured route acceptance and trading release are not claimed.
