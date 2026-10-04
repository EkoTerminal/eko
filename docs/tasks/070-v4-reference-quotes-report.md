# Task 070 implementation report

Candidate: base `add2dd5502fedfb54ee31141ff0d4ce3c6200776` plus this uncommitted worktree diff. Source/test/migration manifest SHA-256: `d35f0d1de91c3422d3dd901c7ae739cf50a742afa8397ccb7ac0fa2360392ae7` (sorted relative paths, each followed by NUL, file bytes, NUL; excludes this report). No commit, deployment, paid job, live chain call or publication was performed.

Follows BACKEND §§6.1–6.2, 12.1, 20; FACTS §§3, 5b; Guard 2.0 §3.4. Hook anomalies remain diagnostics rather than a new Guard dispatch rule. The injected contract probe cannot complete the EOA/smart-account/fidelity manifest or prove an executable UniversalRouter route.

## Changed files

- `packages/chain/src/simulation/v4.ts`, `packages/chain/src/index.ts`: verified-profile-bound native-ETH/token route, canonical PoolKey hash, V4Quoter ABI and buy/sell encoding, reviewed hook/config/code pins, current PoolId state/liquidity reads, metered archive acquisition and reorg checks. Unknown hooks, mismatched keys and missing per-pool Pons custody are unsupported. Quote gaps use exact integer thresholds; effective fees require a separately supplied, matched independent no-tax baseline. All results expose `route.executable=false`, `complete=false`, `honeypotConfirmed=false`.
- `packages/chain/probe/V4Probe.sol`, `packages/chain/src/simulation/v4-probe-runtime.ts`, `packages/chain/probe/build.mjs`: never-deployed runtime and reproducible compiler check. Both legs invoke PoolManager unlock/swap and therefore the supplied hook; sell quoting occurs after the buy in a separate unlock context. Native/token balance deltas measure actual debit/refund and return. Token settlement requires exact acquired-quantity debt; no security/allowance/token-storage overrides or terminal fee leg. Existing BwProbe runtime remains unchanged.
- `packages/chain/probe/test/V4Probe.t.sol`, `packages/chain/test/v4-reference-fixtures.ts` and `packages/chain/test/v4-reference.test.ts`: local EVM and synthetic metered-client fixtures for clean hooks, quote mismatch, asymmetric fees, sell restriction, missing successor state, code/hash changes, reorgs, callback authorization, exact diagnostic boundary and config-origin link refusal. No live evidence is embedded.
- `apps/engines/src/v4-reference.ts`, `apps/engines/src/{index,worker}.ts`, `apps/engines/test/v4-reference.test.ts`: explicit opt-in $100/$1k/$10k collection on independent trace state, rational pinned ETH-USD conversion, canonical retrieval, immutable acquisition revisions, digest checks and idle-poll trace expiry. Normalized hook/cost/status evidence persists; full traces expire after 30 days. No automatic collector, public trade endpoint or Guard scoring integration is enabled.
- `packages/db/drizzle/0137_v4_reference_simulation.sql`, `packages/db/src/engines-migrate.ts`, `packages/db/test/merge-migrations.test.ts`: normalizer-owned evidence table and additive engines migration **0137**; fresh/upgrade/idempotence migration assertions remain intact.

## Verification

All acquisition and hook data in tests are fixtures. Local Solidity tests run an actual EVM with synthetic manager/hook/quoter contracts, not a chain fork.

| Exact command | Exit | Result |
|---|---:|---|
| `pnpm --filter @eko/chain exec vitest run test/v4-reference.test.ts` | 0 | 9 tests |
| `pnpm --filter @eko/engines exec vitest run test/v4-reference.test.ts` | 0 | 3 persistence/acquisition tests |
| `pnpm --filter @eko/db exec vitest run test/merge-migrations.test.ts` | 0 | 3 migration-union tests |
| `forge test --root packages/chain/probe --out /private/tmp/eko-070-probe-out --cache-path /private/tmp/eko-070-probe-cache` | 0 | 21 local EVM tests, including 5 new v4 tests |
| `node packages/chain/probe/build.mjs --check` | 0 | solc 0.8.26, Cancun, optimizer 10,000; checked-in runtimes match source |
| `pnpm --filter @eko/policy exec vitest run test/performance.test.ts` | 0 | Isolated diagnosis of first full-run timing failure |
| `pnpm typecheck` | 0 | Final source candidate |
| `pnpm test` | 1 | Existing policy timing test: p95 54.64 ms versus <30 ms under concurrent package/check load |
| `pnpm_config_workspace_concurrency=1 pnpm test` | 1 | Indexer captured-block benchmark exceeded its existing 20-second timeout; process finished naturally |
| `VITEST_MAX_WORKERS=1 pnpm --filter @eko/indexer exec vitest run test/performance.test.ts -t 'benchmarks full captured blocks'` | 0 | Focused reproduction: one case passed in a 6.17-second run; 12 other cases not selected |
| `VITEST_MAX_WORKERS=1 pnpm_config_workspace_concurrency=1 pnpm test` | 0 | Full workspace, contracts and built-role checks; existing contract fork case skipped because RPC_HTTP_URL is unset |
| `pnpm brand:check` | 0 | 145 files after role-image build |
| `pnpm check:addresses` | 0 | 386 source files |
| `git diff --check` | 0 | Tracked diff whitespace |

## Capability, TODO(spec) and dependencies

Actual offline ABI capability: the compiler and viem agree on the full PoolKey/quoter/probe tuples; local EVM hook callbacks, settlement and balance deltas passed. **Deployed v4 core/quoter/hook ABI capability and live fork acceptance remain unverified.** A PoolManager Initialize fixture and a quote never grant execution. There is no configured production v4 route/profile supplied by this packet.

One new TODO(spec), in `packages/chain/src/simulation/v4.ts`: canonical graduated-Pons URL/query binding is unspecified. The fallback defaults to null; a caller must supply reviewed venue configuration with an exact HTTPS origin allowlist. URLs never come from token metadata. No production venue destination is invented.

Remaining dependencies: reviewed deployed core/quoter/StateView/hook code and ABI/config evidence at the exact block; a supported native-ETH pool with live liquidity; per-PoolId successor custody from 042 for Pons; pinned price provenance; independent post-buy no-tax baselines to decompose effective fees; separate account/fidelity confirmations and task 071's unsigned UniversalRouter/Permit2 executable fork gate. WETH and arbitrary hooks are unsupported by this narrow adapter. The direct PoolManager contract probe does not certify an EOA, an arbitrary agent account, router-specific hook behavior or all-in execution/L1 fees.

Reproduce offline with the commands above. Authorized future acquisition uses `V4ReferenceSimulation` with task 024's metered archive clients and `runV4References`; no socket, raw RPC transport, paid runner or deployment command is added. Apply the engines migrations before using the collector/worker. These exports prepare integration for 071/075 without granting live trading or V2 acceptance.

Live/archive request units: **0**; actual paid cost: **$0**; live fork cases/accepted real matches: **0**. The 200+ labelled-coin Normalizer gate and separate executable route gate are not demonstrated. This is built and fixture-tested work, not deployed or approved.

Checkpoint: `/private/tmp/eko-070-checkpoint.json`. Logs: `/private/tmp/eko-070-{chain-test,engines-test,db-test,probe-build,probe-test,probe-check,policy-focused,indexer-focused,typecheck,typecheck-final,test,test-final,test-serial,brand,addresses}.log`. Final gate tool session `3797` completed with exit 0; no process remains running. Source manifest was rechecked after all gates. Next action: lead review/commit and separate authorized evidence acquisition; execution remains unavailable until its owning gate passes.
