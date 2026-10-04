# Task 113 implementation report

Candidate: base revision `ecd48317cd79a6103295f522951c29db0656ba57` plus the uncommitted changes listed below. Source manifest SHA-256: `185b305ed48bccd90c632f4cc35fac27fc62d122d3159404577e8fb0d1ccd412` (sorted changed/new source paths and bytes, separated by NUL; excludes this report). Nothing was committed, pushed, published or deployed. Paid cost: $0. No migration.

Followed AGENTS.md including rule 9, packet 113, FRONTEND §3.8 and CA-15/16/25, BACKEND §13, FACTS §7 and MARKETING claims rules. The prototype was read and left unchanged. No prototype sample track record, personal identifiers or secrets were ported. Specs and Guard-owned logic/fixtures were left unchanged.

## Changes

- `apps/web/src/pages/trust/Scoreboard.tsx`, `scoreboardModel.ts`, `trust.css`: API-backed public record with equal refused/missed headlines, explicit unavailable coverage, observed-zero dates, misses first, wrong graded calls before other calls, post-mortem status/validated links, original/correction receipt links, tabs and cursor pagination. Cohorts retain measured counts, denominators, actual horizons, immature/censored/ungraded states and unavailable metrics. No fabricated chart, live feed, forecast grade or milestone evidence.
- `apps/web/src/pages/trust/Receipt.tsx`: public receipt lookup with identity binding, unknown/error/loading/refresh states, pending disabled verification, exact receipt metadata and transaction explorer links, text-only JSON and private commitment-only wording. Async results are discarded on navigation/refresh.
- `packages/receipts-verifier/`: private workspace package prepared for public verifier packaging, with source exports, README, copied published ABI checked for equality, and 29 tests. Reuses the existing shared JCS/V1/V2 codec. Verification independently recomputes payload hash/leaf, folds the proof, reads the historical registry batch, and binds chain, root, batch ID, successful transaction, canonical block/hash, registry emitter, exact event index, leaf count and committer. Pending items do no reads; unrevealed items never claim a checked payload. No API verification verdict is consumed.
- `apps/web/src/lib/receipt-verifier.ts`, `receipt-registry.ts`, `wallet.ts`: browser package entry point, unresolved trusted deployment pin, and separate connector-free receipt read configuration using the public chain RPC directly, with credentials omitted, retries/batching disabled and no paid endpoint. The existing wallet proxy remains the wallet read path. Receipt verification remains unavailable while the published registry address is unresolved.
- `Dockerfile`: copies the new workspace package manifest before frozen image installation; the existing roles invariant caught and verified this integration requirement.
- `apps/web/src/routes.ts`, `apps/web/package.json`, `pnpm-lock.yaml`: real lazy routes and workspace wiring. Only the spec-named verifier package and already locked shared/viem dependencies were declared; no version upgrades.
- `apps/web/src/pages/trust/trust.test.tsx`: 9 UI/model tests for routes, equal counters/coverage, miss ordering, receipt/correction/post-mortem links, measured cohorts, pending/private states, inert JSON, unknown/swapped lookup and responsive CSS. Existing browser V1/V2 test also passes.
- `apps/web/src/lib/wallet-rpc.test.ts`: updated receipt routing expectations to the user-required direct public RPC and historical block. Retained credential/cookie/authorization/no-batch assertions and exact wallet proxy routing; no assertion was skipped or weakened.
- `apps/web/src/pages/trust/layout.check.tsx`, `apps/web/trust-layout.config.ts`: separately runnable offline Chrome layout check of actual component markup/CSS at 390px and 1440px, using the browser pipe and no listening server. The sandbox aborted Chrome before layout assertions ran.

## Checks and evidence

All script checks used process-local `pnpm_config_verify_deps_before_run=false` so pnpm did not attempt an automatic reinstall of the locally restored dependencies. This changes no test assertions, timeouts, lint checks or persistent configuration.

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm --filter @eko/receipts-verifier test test/verifier.test.ts` | 0 | 29 tests passed |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test src/lib/wallet-rpc.test.ts` | 0 | 2 tests passed, failing file rerun alone after updating the required routing behavior |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test src/pages/trust/trust.test.tsx src/lib/receipt-verifier.test.ts` | 0 | 10 tests passed |
| `pnpm --filter @eko/web exec vitest run --config trust-layout.config.ts` | 1 | Chrome aborted before assertions (`SIGABRT`, process kill `EPERM`); visual check remains unverified |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/roles.test.ts` | 0 | 24 tests passed after the Docker manifest fix |
| `pnpm typecheck` | 0 | Entire workspace passed |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | Full scripted/workspace gate passed, including 703 web, 463 server, 57 MCP tests, web/server builds and built role-image fixture checks |
| `pnpm brand:check` | 0 | Passed, 47 files checked |
| `pnpm check:addresses` | 0 | Passed, 528 source files checked |
| `git diff --check` | 0 | Passed |

Earlier checks identified the raw RPC transport outside the centralized browser transport file and the prior receipt-proxy expectation. Both were corrected before the final candidate checks. A subsequent full run caught the missing Docker workspace manifest; its one-line fix passed all 24 roles tests alone before restarting the comprehensive final gate. An initial private test setup needed its event leaf count to match the V1 fixture; the corrected verifier file passed alone. No tests were deleted or skipped, and no timeouts were raised.

Dependency preparation: `CI=true pnpm install --offline --no-frozen-lockfile` exited 1 because the local store lacks the Bricolage Grotesque tarball. `CI=true pnpm install --offline --no-frozen-lockfile --lockfile-only` exited 0 and updated only the two workspace importers. Installed dependencies were restored locally from an existing checkout, with local workspace links for the verifier. A subsequent frozen lockfile-only attempt tried registry policy metadata despite offline mode; it was stopped (exit 130) when DNS failed. Clean-checkout installation is not claimed verified; reproduce `pnpm install --frozen-lockfile` where the existing locked tarballs and policy metadata are available.

Fixture evidence: all chain reader tests use fake transport/receipts/events, and V1/V2 fixtures remain Guard-owned. No successful live chain request or deployment acceptance was performed. The web and server builds passed inside the full gate, including the browser verifier in the web bundle. Built/tested workspace source and prepared packaging are distinct from a published package or approved deployment.

## Remaining dependencies and ambiguities

- `TODO(address)` in `apps/web/src/lib/receipt-registry.ts`: registry deployment is still `TODO` in the chain address registry. Publish/verify that deployment and set the independent browser pin before enabling verification. Do not substitute a receipt/API-selected address. Direct RPC historical-call availability/CORS still needs separately authorized live acceptance.
- The only new `TODO(spec)` is in `apps/web/src/pages/trust/Scoreboard.tsx`: CA-15 `correctionOf` may identify a verdict or a row, without a receipt lookup by revision. Original/correction receipts link when their corresponding rows are loaded; otherwise the original identity remains visible as text. Cross-page unresolved references require an API mapping in its owning packet.
- Run the offline layout command above outside this sandbox to verify visual mobile/desktop geometry. Markup and responsive CSS assertions passed here; browser visual acceptance did not.
- Public verifier publication remains a separately authorized release. README describes packaging the workspace source/shared dependency, choosing supported distribution targets and reviewing the deployment pin. No package was published.

Process checkpoint: `/tmp/eko-task113-checkpoint.json`. Final gate logs: `/tmp/eko-task113-typecheck.log`, `/tmp/eko-task113-test.log`, `/tmp/eko-task113-brand.log`, `/tmp/eko-task113-addresses.log`. Final typecheck session `61636` and full-test session `21619` both completed with exit 0; no gate process remains running. Next acceptance actions are the registry pin, live keyless-RPC acceptance and the browser layout reproduction outside the sandbox. No percentage coverage run was requested or performed.
