# Task 133 implementation report

Base revision: `add2dd5502fedfb54ee31141ff0d4ce3c6200776`. Candidate is the uncommitted worktree. Source/test/migration candidate SHA-256: `f3e65a658ab15d2bcee77626f7569428ef0888127ca437d81440a46f742453d7` (sorted relative paths and file contents, each NUL-separated; report excluded).

## Changes

- `apps/indexer/src/wallet-protocol.ts`: collects already-acquired raw EntryPoint events, 7702 authorizations, completed code observations and scoped coverage. Uses 043's pinned profile lifetime/availability gate, authorization recovery and exact operation-subtree bindings. Sender, sponsor, outer signer and implementation remain separate. Per-log operation bindings are retained for future Watcher consumers. No transport or trace acquisition was added.
- `apps/indexer/src/decode.ts`: stages protocol rows with ordinary block rows and uses supplied 043 bindings for complex actors. Unsupported UserOps and externally called delegated accounts have null actors. Shared code reads retain their original observation block, including concurrent consumers; TTL reuse cannot claim fresh delegation evidence.
- `apps/indexer/src/types.ts`, `backfill.ts`, `log-head.ts`, `enrich.ts`, `index.ts`: distinguish full transactions from receipt-derived inputs and synthetic receipts; retain protocol context in the existing scoped paths; flush protocol evidence during sender enrichment. No additional live RPC calls or background job.
- `packages/chain/src/launchpads/trace-acquisition.ts`, `trace-principals.ts`: export existing 043 authorization recovery and profile validation for reuse. Authorization validity enforces low-s signatures; authorization application remains unknown. Trace acquisition and principal binding stay owned by 043.
- `packages/db/drizzle/0136_wallet_protocol.sql`, `packages/db/src/wallet-protocol-schema.ts`, `client.ts`, `index.ts`: add indexer-owned `userops`, `delegations_7702` and `wallet_protocol_coverage`, indexed by chain/account/block. Migration 0136 is registered only in the indexer ledger. Natural keys make evidence replay idempotent; content-keyed coverage preserves later improved inputs; canonical rollback removes all three tables' affected rows.
- Tests: `apps/indexer/test/wallet-protocol.test.ts`, `indexer.test.ts`, `log-head.test.ts`, `packages/db/test/merge-migrations.test.ts`. Two legacy heuristic actor expectations were replaced with explicit missing-attribution assertions. Existing chain-fact equivalence assertions remain; scoped protocol coverage is separately tested because full-block and logs-first inputs differ. No test source was skipped, assertions weakened, or timeouts raised.

Follows BACKEND §§4.3–4.4 and 5.1–5.2, Guard 2.0 §2.1 and 043's §2.2 attribution rules. The stricter Guard principal bindings supersede BACKEND §4.4's heuristic receipt segmentation for complex execution. ERC-8004 acquisition remains exclusively task 100; no Watcher scoring, trace acquisition, release flags, dependencies, lockfile or read-only spec edits.

## Verification

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/indexer exec vitest run test/wallet-protocol.test.ts --maxWorkers=1` | 0 | Initial 8 protocol tests; `/tmp/eko-133-focused.log` |
| `pnpm --filter @eko/indexer exec vitest run test/wallet-protocol.test.ts test/indexer.test.ts --maxWorkers=1 --reporter=verbose` | 0 | 26 tests; `/tmp/eko-133-indexer-core.log` |
| `pnpm --filter @eko/chain exec vitest run test/trace-principals.test.ts test/principal-services.test.ts --maxWorkers=1` | 0 | 17 tests; `/tmp/eko-133-chain.log` |
| `pnpm --filter @eko/db exec vitest run test/merge-migrations.test.ts --maxWorkers=1` | 0 | 3 tests; `/tmp/eko-133-migrations.log` |
| `pnpm --filter @eko/indexer typecheck` | 0 | `/tmp/eko-133-focused-typecheck.log` |
| `pnpm typecheck` | 0 | `/tmp/eko-133-typecheck.log` |
| `pnpm brand:check` | 0 | 36 files; `/tmp/eko-133-brand.log` |
| `pnpm check:addresses` | 0 | 385 source files; `/tmp/eko-133-addresses.log` |
| `git diff --check` | 0 | No whitespace errors |
| `pnpm --filter @eko/indexer exec vitest run test/log-head.test.ts test/phase-b.test.ts --maxWorkers=1 --reporter=verbose` | 1 | 47 passed; existing enrichment test exceeded direct Vitest's 5-second default; `/tmp/eko-133-indexer-scoped.log` |
| `pnpm test` | 1 | Existing engine CLI SIGINT shutdown exceeded its explicit 20-second timeout; `/tmp/eko-133-test.log` |
| `npm_config_workspace_concurrency=1 VITEST_MAX_WORKERS=1 pnpm test` | 0 | All workspace tests, web/server builds and role-image checks; `/tmp/eko-133-test-serial.log` |
| `pnpm --filter @eko/engines exec vitest run test/cli.test.ts --maxWorkers=1` | 0 | Both SIGINT/SIGTERM cases passed in isolation; `/tmp/eko-133-cli-repro.log` |
| `pnpm --filter @eko/indexer exec vitest run test/log-head.test.ts -t 'defers bars for unknown decimals' --maxWorkers=1` | 1 | Same 5-second timeout; selected reproduction only; `/tmp/eko-133-enrich-repro.log` |

The final complete gate passed with one Vitest worker per package. All 127 indexer tests, 184 chain tests, 193 engine tests, 272 server tests and 14 MCP tests passed, along with the remaining workspace suites, web/server builds and role-image checks. The existing package-declared timeouts were retained. The original default-concurrency full command exited 1; it is not mislabeled as passing. Both CLI shutdown cases subsequently passed in isolation and in the final gate. The cause of the original timeout was not independently measured.

Earlier focused runs precede the last low-s/coverage refinements; the final complete gate validates the source candidate hash above. All validation processes have ended. Checkpoint: `/tmp/eko-133-checkpoint.json`. The complete gate's log is `/tmp/eko-133-test-serial.log`; there is no running gate to resume.

Earlier typecheck failures were corrected fixture quantity types. An earlier four-file focused run stopped producing output and was interrupted (exit 130); it is not passing evidence. Narrowed verbose runs completed and exposed the specific default-timeout failure. Diagnosis of the unchanged five-second command ended after its focused reproduction; it is not being repeated. The final comprehensive gate uses declared repository settings.

## Coverage, cost and remaining dependencies

All new protocol acceptance evidence is synthetic. Existing checked-in captured chain fixtures exercise regression equivalence offline; no new live chain evidence was acquired. The shared 043 fake acquisition makes four metered requests; repeated protocol collection adds zero. Logs-first benchmarks retain their existing RPC call bounds. Actual live requests, paid runs, charged cost and deployments: **0**. This candidate is implemented and fixture-tested, not committed, deployed, live-verified or release-approved.

All three checked-in EntryPoint registry addresses remain TODO. No pinned chain-4663 deployment evidence was available, so none were resolved or enabled. Supplied verified v0.6/v0.7 profiles can persist receipt events; per-log attribution additionally requires 043's reconciled operation subtree. Unreviewed deployments/layouts, including v0.8, remain named missing inputs. Supply reviewed profiles and existing 043 observations through `prepare(..., {walletProtocol})` or the exported collector; it never fetches traces itself.

Receipt-derived inputs cannot contain third-party authorization lists. Full-block callers persist those authorizations, but a recovered signature does not prove application. Completed observed code snapshots show delegation state independently, including changes/revocation; stale or absent state stays missing. Scoped receipt coverage does not claim a complete chain-wide UserOp or 14-day wallet history. Full Phase C acquisition and effective delegated-action permissions remain external inputs under existing ownership.

`TODO(spec)` inventory in changed source files:

- New: `wallet-protocol.ts` — the spec defines no persisted Watcher coverage wire envelope; use the finite scoped manifest documented by this collector.
- Retained: `decode.ts` — receipt-only paths lack third-party 7702 authorizations; TTL/Phase C cannot establish unobserved current changes. This candidate records those gaps rather than treating cached code as fresh.
- Retained: `decode.ts` — USD conversion for quote assets other than native ETH/WETH remains undefined for this packet.
- Retained from 043: `trace-principals.ts` — supplied effective EntryPoint profiles/fee evidence have no specified adapter wire envelope; unsupported layouts remain missing.

No personal identifiers or real secrets were added or ported. Reproduction commands are the exact commands above; the completed gate evidence can be reused without restarting it. Next action is lead review/commit of this candidate. Deployment, paid acquisition and EntryPoint verification remain separately authorized operations.
