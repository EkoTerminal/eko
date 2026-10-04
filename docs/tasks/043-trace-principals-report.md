# 043 implementation report

Source revision: `0ed7130f1c76c76837a6e5243f2f563a89e80515`.
Candidate: uncommitted working tree, trace method `2.1.0`; SHA-256 of the ten changed source/test files, sorted by relative path with NUL-separated path/content pairs: `2d62553e06a670adeeaa4491d7e10d9ad55069208df82d7a40adb3e0e9db02b9`.

## Changes and scope

- `packages/chain/src/launchpads/trace-acquisition.ts`: bounded shared block/transaction acquisition through `createMeteredClients`' archive client; full transaction inputs, receipts, positioned callTracer logs, numeric merged execution ordinals, ancestor-revert filtering, receipt reconciliation, canonical-hash recheck, delegation marker and bigint authorization-signature decoding. Concurrent consumers reuse the same promise, including unavailable results. Meter stop/budget errors propagate.
- `packages/chain/src/launchpads/trace-principals.ts`: exact input-operation hashes and successful receipt events bind reviewed ERC-4337 v0.6/v0.7 execution subtrees. Signed delegated self-execution is separate from code authorization and sponsorship. Economic debits, recipients, creation costs and per-event private batch roles remain separate from control.
- `packages/chain/src/launchpads/principal-services.ts`: versioned reviewed service registry; exact 20-launch/10-principal/80%-pair candidate boundaries; complete launch enumeration required for the pair denominator. Hub degree includes its covered interval and bound status; 500 or more prompts review. Infrastructure expansion stops while private batch exposure remains. Effective owner-quorum/module/delegated permission paths require complete supplied state and verified economic permissions.
- `packages/chain/src/launchpads/launch-roles.ts` and `packages/chain/src/index.ts`: additive capture/export integration. Acquired raw and normalized observations are retained with append-only, hashed role evidence and availability cuts. Existing 029 capture remains compatible.
- `apps/engines/src/identity-v2.ts`: read-only service metrics with exact ratio quantities, measurement/effective cursors and coverage-qualified counts; exposes economic roles without creating owner unions.
- Fixtures/tests: `packages/chain/test/fixtures/trace-principals.ts`, `packages/chain/test/trace-principals.test.ts`, `packages/chain/test/principal-services.test.ts`, `apps/engines/test/trace-principals.test.ts`.

Follows Guard 2.0 §§2.1–2.3, 3.1, 7.1–7.3 and 8.1–8.2, and the service/delegation/hub and attribution resolutions in `docs/guard/changes.md`. No packet-033 evaluator/scoring changes, dependencies, lockfile changes, live acquisitions, schema migrations or registry address seeds. Fixtures use neutral generated identifiers; no personal identifiers were ported.

## Verification and reproduction

| Exact command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/chain exec vitest run test/trace-principals.test.ts test/principal-services.test.ts` | 0 | 17 tests; `/tmp/eko-043-chain-focused.log` |
| `pnpm --filter @eko/engines exec vitest run test/trace-principals.test.ts test/launch-roles.test.ts` | 0 | 13 tests; `/tmp/eko-043-engines-focused.log` |
| `pnpm typecheck` | 0 | `/tmp/eko-043-typecheck.log` |
| `git diff --check` | 0 | No whitespace errors |
| `pnpm --filter @eko/indexer exec vitest run test/backfill-limits.test.ts test/phase-b.test.ts` | 0 | 19 tests; `/tmp/eko-043-indexer-focused.log` |
| `node scripts/brand-check.mjs --self-test` | 0 | Brand scan self-test |
| `pnpm check:addresses` | 0 | 287 source files |
| `pnpm test` | 1 | Existing indexer 5-second test timeouts; `/tmp/eko-043-test.log` |
| `pnpm -r --workspace-concurrency=1 test` | 130 | Existing indexer timeouts; interrupted after output stalled; `/tmp/eko-043-test-serial.log` |
| `pnpm -r --workspace-concurrency=1 test --maxWorkers=1` | 1 | Existing policy performance test exceeded 5 seconds; `/tmp/eko-043-test-single-worker.log` |

The focused commands reproduce unrelated UserOps, ambiguous subtree/input hashes, ancestor failures, unsupported log positioning, shared implementation, sponsor versus controller, public-tool customers, a private payer batch through 501-counterparty camouflage, quorum/module permissions and expiry, exact service/window boundaries, actual token sell debit, creation-cost reconciliation, immutable capture/replay and reorg invalidation.

`pnpm test` on the final candidate exited 1: two existing indexer PGlite tests exceeded their unchanged 5-second timeout while workspace tests overlapped. The same two files passed in isolation (19 tests, exit 0). All chain and engine tests in that run passed. `pnpm -r --workspace-concurrency=1 test` still had concurrent Vitest-file timeouts in indexer, then stopped producing output; it was interrupted (exit 130). Serializing Vitest workers as well exited 1 at `packages/policy/test/performance.test.ts`: its outer test exceeded the unchanged 5-second timeout. No assertions or timeouts were relaxed, and no tests were skipped. The full gate is **not green**. Diagnosis stopped after these two runner changes; source/test contents remained unchanged throughout.

## Acquisition, cost and checkpoint

All acquisition validation uses in-memory fake transports admitted through the task-024 meter. A complete synthetic shared block acquisition records **4 fake request units** at default unit weights: two block reads (one input read and one canonical-hash recheck), one receipt request and one callTracer request. Simultaneous/repeated consumers add **0** requests while that cache entry is retained. At the specification's nominal $6/million units, four units would be $0.000024; **actual live requests, paid units and charged cost are all 0**. This is fixture metering, not provider measurement or verified provider pricing.

Coverage is complete only for the supported fixture transaction/input/receipt/log/subtree shapes. No live-chain, native funding-history, degree-enumeration, service-precision or calibration coverage was measured. The 500-counterparty and service thresholds remain CALIBRATE candidates.

Candidate checkpoint: `/tmp/eko-043-candidate.sha256`. All verification processes have ended. Logs above distinguish completed focused checks from failing full gates. Next reproduction step in an environment with sufficient test capacity: `pnpm --filter @eko/policy exec vitest run test/performance.test.ts --maxWorkers=1`, followed by the complete `pnpm test` gate. Resource contention is a plausible explanation, not a measured diagnosis. No acquisition worker, background job, deployment or release was started.

## Remaining gaps and choices

- `TODO(spec)` notes freeze finite supplied envelopes for reviewed EntryPoint profiles/creation-cost evidence and effective-permission observations; the spec does not define those adapter wire records. These observations are retained in source evidence. Existing 029's missing-job envelope remains unchanged.
- Unsupported/missing log positions, failed receipt reconciliation, ambiguous subtrees, unreviewed EntryPoint code/layouts, aggregated operations and EntryPoint v0.8/v0.9 remain unresolved. They do not fall back to outer signer, nonce or implementation identity.
- A 7702 signature establishes code authorization only; application of authorization and sponsored delegated-action permissions need the account-specific effective-state adapter. Safe/module permissions are resolved from complete supplied observations; this packet does not invent an on-chain configuration reader.
- Economic routing supports exact conserved paths; split amounts, unexplained fees, competing sources and other unsupported settlement layouts remain missing. Creation payment requires acquired fee decomposition rather than equating transaction value with launch cost.
- The bounded acquisition cache is process-local. Callers must share it across consumers and release completed blocks deliberately; retained raw/normalized evidence supports replay without a new acquisition. This packet does not install a live queue or promise restart-wide acquisition deduplication.
- Prepared and fixture-tested work only: no commit, push, live validation, calibration promotion or production release. The required full-suite gate remains a verification blocker as detailed above.
