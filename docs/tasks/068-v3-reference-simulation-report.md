# Task 068 implementation report

Candidate: base `95b345c194749b151d052f99a7b9216f9f0cf4e0` plus the uncommitted worktree changes. Source manifest SHA-256 (changed source/test/config files, excluding this report): `3ac0e0beb4aa003a82fe02e66b69dede343970eff19c0077da02df901da2e9ae`. No commit, deployment, publication, external message or paid job was performed.

Implemented against BACKEND §§6.1–6.2, 6.5, 20 and Guard 2.0 §§3.4, 9.1. Also preserves BACKEND §3.2 writer ownership and FACTS §7 legacy card contracts. The acquired-position classification uses Guard's independent post-buy no-tax output denominator; severe thin-liquidity cost alone does not become a confirmed blocked exit. Pons reference execution and V2 policy/scoring/receipt ownership remain with their existing packets.

## Changed files

- `packages/chain/probe/{BwProbe.sol,foundry.toml,build.mjs,test/BwProbe.t.sol}`: never-deployed probe source, deterministic offline compiler check and local EVM balance-delta fixtures. The fixtures inject the probe runtime with `vm.etch`.
- `packages/chain/src/simulation/{types,v3,reference,anvil,probe-runtime}.ts` and `packages/chain/src/index.ts`: adapter boundary, native v3 entry/exit including verified multi-hop paths, exact acquired-amount calldata patching, metered archive trace acquisition, pinned reorg checks, two deterministic EOA confirmations, shared exclusive fork-reset leases and matched-fidelity gate. Only native funding/probe code are overridden; no token storage or restrictions are altered.
- `packages/chain/test/{reference-fixtures,reference-simulation.test,reference-anvil.test}.ts`: synthetic transport/accounting, route patching, provider failure, caps, cooldown, restriction, near-zero return and serialization checks.
- `packages/db/drizzle/0121_v3_reference_simulation.sql`, `packages/db/src/engines-migrate.ts`, `packages/db/test/merge-migrations.test.ts`: normalizer-owned `sim_runs`, permanent normalized summaries/digests and 30-day full-trace retention. Migration-union expectations now include the additive migration; existing upgrade/data-retention assertions remain, with an additional table assertion.
- `apps/engines/src/{reference-simulation,sources,card,worker,outcomes,index}.ts`, `apps/engines/test/reference-simulation.test.ts`: independent pinned $100/$1k/$10k acquisition with rational ETH-USD conversion, immutable acquisition revisions, retention/retrieval and indexed idle-poll expiry, best-proceeds selection per size, tax/card/playbook input refresh, explicit live-worker acquisition hook and retrospective exclusion. All nested EOA traces are removed from permanent summaries and retained only in the expiring trace column.
- `packages/playbooks/src/{types,rules}.ts`: classified non-Pons confirmation inputs, unknown setter mutability and effective-tax evidence. Existing heritage/Pons inputs retain their behavior; classified severe cost without a confirmed restriction does not acquire a honeypot match.

## Verification

All checks below are offline. Synthetic fork-match records exercise the acceptance mechanism; they are not acquired fork evidence.

| Exact command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/chain exec vitest run test/reference-simulation.test.ts test/reference-anvil.test.ts` | 0 | 12 tests, two files |
| `pnpm --filter @eko/engines exec vitest run test/reference-simulation.test.ts` | 0 | Six tests, including nested trace expiry and live/replay boundaries |
| `pnpm --filter @eko/db exec vitest run test/merge-migrations.test.ts` | 0 | Three migration/upgrade tests |
| `forge test --root packages/chain/probe --out /private/tmp/eko-068-probe-out --cache-path /private/tmp/eko-068-probe-cache` | 0 | Seven local EVM fixtures, actual native/token deltas; no chain fork |
| `node packages/chain/probe/build.mjs --check` | 0 | solc 0.8.26, Cancun, optimizer 10,000; checked-in runtime matches source |
| `pnpm typecheck` | 0 | Final source candidate |
| `pnpm test` | 0 | Full workspace gate and built-role checks; existing RPC-dependent contract fork test skipped with RPC URL unset |
| `pnpm brand:check` | 0 | 124 files after build |
| `pnpm check:addresses` | 0 | 316 source files |
| `git diff --check` | 0 | Tracked diff whitespace |

An earlier full test attempt exited 1 because the migration-union test listed the pre-packet ledger. That expectation was updated to include the new migration, preserving and strengthening its assertions. The final gate follows the nested-trace correction, idle-poll cleanup and final debit validation.

## TODO(spec), dependencies and availability

Two new TODO(spec) notes:

1. `packages/chain/src/simulation/anvil.ts`: upstream metered Anvil gateway configuration is unspecified. `SerializedMeteredForkLease` requires a reset callback supplied by that gateway; it does not accept a direct paid fork URL. Anvil's archive reads must all pass through task 024 metering before any authorized live run.
2. `apps/engines/src/reference-simulation.ts`: legacy replay has no acquisition availability cut. Retrospective runs exclude simulations rather than import later observations; integration with the explicit Guard availability cut belongs to the shared storage/consumer boundary.

Operational dependencies: configured verified routes from 067, pinned ETH-USD provenance from WETH/USDG, a verified cooldown/temporary-restriction resolution, a metered local fork lease and acquired matched-fidelity evidence. The exported `ReferenceRoute`, `RoundTripAmounts`, `DeepEvidence` and lease interfaces are available for 040 coordination; no Pons implementation is replaced. Route wiring and smart-account-specific execution must be established by their owning adapters. Success of a fresh EOA or the injected contract cannot certify an arbitrary agent account.

No production collector is automatically started. Configure `WorkerOptions.referenceSimulation` with `runV3References` only once the route, metered gateway and evidence dependencies are available. The worker runs this hook before card assembly and never during retrospective replay. Missing confirmation/matches, unresolved cooldown, provider failure and unsupported routes remain incomplete. A known entry cap is recorded separately and completes only with corresponding EOA proof; an entirely unavailable reference entry cannot yield a completed low-risk card. $10k is supplementary; $100/$1k determine the reference check.

Live/archive request units: **0**. Actual paid acquisition cost: **$0**. Live fork cases and accepted real matches: **0**. This is built and fixture-tested work, not deployed, approved or a completed Normalizer/Guard launch acceptance gate. Per-size/class live fidelity still needs at least 30 diverse matched cases with exact debit, ≤1% positive-return relative error and no blocked/hurt classification reversals; the broader 200+ labelled-coin gate is not demonstrated here. L1/network cost and delayed benchmark trajectories are not certified by these immediate round-trip fixtures.

Checkpoint: `/private/tmp/eko-068-checkpoint.json`. Completed final gate logs: `/private/tmp/eko-068-typecheck-final.log`, `/private/tmp/eko-068-test-final.log`; focused and probe logs use the same `eko-068` prefix in `/private/tmp`. Reproduction uses the exact commands above. The next external action is acquiring authorized fork evidence through the metered gateway, not starting a paid run from this report.
