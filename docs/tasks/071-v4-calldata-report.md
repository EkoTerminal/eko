# Task 071 implementation report

Candidate: base `cc5c440bb8644e928359590ab9c09d10abc2389a` plus the uncommitted files below. Source/test manifest SHA-256: `1281f38e8bb6e34d1fbabc16e583139136f8fca15c5cb692a41b05e12aeff8eb` (sorted relative paths followed by NUL, file bytes, NUL; excludes this report). No commit, deployment, publication, live chain call or paid run occurred.

Follows BACKEND §§12.1–12.4, 20 and FACTS §§3, 5b. BACKEND §2.3 identifies the permitted SDK packages. Dependencies 070, 042 and 052 were inspected; their acquisition, custody and Guard logic remain unchanged.

## Result and changed files

- `packages/chain/src/execution/v4.ts`: exports `UniswapV4Adapter` and `v4ExecutionCapability()` for task 075. Both SDK packages are absent and offline resolution failed. This packet therefore implements the explicitly permitted **quote-only fallback**, with `binding=false`, `route.executable=false`, `candidate=null` and no orderable approvals. The adapter can retain a review intent but never returns a UniversalRouter swap transaction. Installing a package or supplying fork envelopes cannot activate execution.
- The same file binds account, recipient, coin, side, raw input, expected output, minimum, value, slippage, cursor, route/profile/state/policy hashes, order hash, Guard receipt and deadlines to trusted retained quote terms. The router/Permit2 review is separate from 070's direct PoolManager probe. Only the existing native-ETH/token profile is supported. Buy value equals raw input; sell value is zero. No terminal fee leg is built at T (`fee.bps=0`, `destination=null`). This intent validation does not replace 052's actual-account simulation, freshness or policy checks.
- Exact approval review bytes encode ERC-20 → Permit2 and Permit2 → UniversalRouter. Both amounts equal the raw sell input; expiration is positive, unexpired, at least the swap deadline and at most 1,800 seconds from the supplied preparation clock. The Permit2 max-uint160 infinite-allowance sentinel and the ERC-20 max-uint256 amount are rejected. Native buys have no approval review. These are unsigned review artifacts, not activated order responses; their deployed behavior remains unverified.
- Fork diagnostics check matched predicted/actual input and output, output minimum, recipient output delta, input debit, gas-adjusted sender native delta, exact pre-spend ERC-20/Permit2 allowances and expiration, zero terminal fee, matching intent/route hashes, unique cases and both buy/sell directions for EOA/smart-account classes. These diagnostics do not accept a deployment. Supplied booleans/evidence labels are trusted acquisition inputs, not an implemented router command decoder or independently acquired proof.
- `packages/chain/src/index.ts`: exports the adapter, intent/approval helpers and capability contract.
- `packages/chain/test/v4-calldata.test.ts`: six fixture tests covering unsigned fallback, decoded approval bytes, exact allowances/expiry bounds, changed checked inputs, unsupported routes/terms, immutable review snapshots, configuration-owned venue links and adversarial fork envelopes.
- `docs/tasks/071-v4-calldata-report.md`: this report.

No dependencies were declared, no lockfile changes survived the failed offline attempts, and no migration was needed. Reserved migration 0152 was unused. No personal identifier was introduced or ported. No existing test was weakened, deleted, changed to skip or given a larger timeout.

## Checks and reproduction

| Exact command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/chain exec node --input-type=module -e 'for (const p of ["@uniswap/v4-sdk", "@uniswap/universal-router-sdk"]) { try { console.log(p, import.meta.resolve(p)); } catch { console.log(p, "not installed"); } }'` | 0 | Both SDKs reported not installed |
| `pnpm --filter @eko/chain add @uniswap/v4-sdk @uniswap/universal-router-sdk --offline --save-exact --lockfile-only` | 1 | `ERR_PNPM_NO_OFFLINE_META` for v4 SDK; no source/manifest/lockfile mutation |
| `pnpm --filter @eko/chain add @uniswap/universal-router-sdk --offline --save-exact --lockfile-only` | 1 | Independent UniversalRouter SDK resolution also returned `ERR_PNPM_NO_OFFLINE_META` |
| `pnpm --filter @eko/chain exec vitest run test/v4-calldata.test.ts test/v4-reference.test.ts` | 0 | Final candidate: 15 tests across two files passed |
| `pnpm typecheck` | 0 | Final source candidate, all workspace packages |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | All workspace suites, contracts, web/server builds and role-image checks passed; existing contract fork case skipped because `RPC_HTTP_URL` is unset |
| `pnpm brand:check` | 0 | Final post-build run: 154 served/configured files checked |
| `pnpm check:addresses` | 0 | 436 source files checked |
| `git diff --check` | 0 | Tracked diff whitespace; separate changed-file whitespace check also passed |

The initial focused run exited 1 because viem returned a checksummed decoded fixture address while the expectation used lowercase. The expectation now uses `getAddress`; approval amounts, targets and expiry assertions were preserved. The final focused run passed.

## Capability and remaining dependencies

Actual SDK capability: **unavailable offline** for both spec-named packages. Swap encoding with `V4Planner`/`RoutePlanner`, UniversalRouter command decoding/settlement, deployed Permit2 approval behavior and the matched buy/sell executable fork suite were **not run**. No hand-coded substitute or guessed SDK version was installed. An Initialize fixture, reference quote, direct PoolManager probe or diagnostic envelope never authorizes execution.

All added test inputs and fork envelopes are synthetic fixtures, including envelopes marked `origin=measured` to exercise validation. They are not measured chain evidence. Actual live/archive/fork request units: **0**; paid cost: **$0**; accepted live v4 execution cases: **0**. Six new unit cases and nine existing reference cases passed; live fork coverage is zero. This is built and fixture-tested preparation, not deployed or approved execution.

Remaining work before executable v4: provision exact deployment-matched SDK versions and offline package metadata; declare them and update the lockfile per rule 6; verify UniversalRouter/Permit2 deployed ABI/code/config together with the supported pool/hook and 042 successor evidence; implement planner swap/settlement and independent command decoding; acquire matched buy/sell balance/allowance artifacts through the authorized metered fork gateway; connect 052's actual-account revalidation. Its current single ERC-20 approval binding cannot attest the additional Permit2 approval transaction, so this packet neither changes that shared Guard contract nor claims an executable handoff. WETH and arbitrary hook profiles remain unsupported as in 070. After SDK provisioning, use `CI=true pnpm install --offline --no-frozen-lockfile` when updating dependencies, then verify a clean frozen-lockfile install and rerun the checks above.

One new `TODO(spec)` in `packages/chain/src/execution/v4.ts`: **executable v4 fork sizes/counts are unspecified**. The checker requires both directions and account classes as a diagnostic minimum; it grants no acceptance. Existing 070 venue-link configuration remains unchanged; absent or unallowlisted Pons configuration yields a null link.

## Checkpoint

Checkpoint: `/private/tmp/eko-071-checkpoint.json`. Logs: `/private/tmp/eko-071-{focused,focused-final,typecheck,typecheck-final,test,brand,brand-final,addresses,addresses-final}.log`. Full-test tool session `82846` completed with exit 0; no process remains running. The source manifest was rechecked after the gates. Next action: lead review/commit, then separate authorized SDK provisioning and evidence acquisition. No continuation, paid job, release or deployment is authorized by this handoff.
