# Task 102 report

Candidate: base `ec90a407e5090006674538b5223719250463ba88` plus the uncommitted task 102 changes in this worktree. The 26 changed/new source, migration, and test files (excluding this report) have combined SHA-256 `a99bc829d1654a9916c113d35cd36cea2964c405e1d7d86c27f4cf1b64b76e3c` when sorted by relative path and hashed as path, NUL, contents, NUL. Prepared and locally tested; not committed, pushed, deployed, live-verified, or approved for publication.

## Implementation

- `apps/engines/src/watcher/flow.ts`: pure 5m/1h/24h buy-USD mix, declared/likely split, confidence from persisted tiers, disjoint actor/qualified-crew round trips, point-in-time label precedence, and markers. Unresolved sender, price, labels, and crew coverage carry availability masks rather than human/zero measurements.
- `apps/engines/src/watcher/flow-store.ts`, `worker.ts`, `index.ts`, and `card.ts`: Watcher persistence and worker replay/poll wiring, inheriting the configured fingerprint generation; one-second incremental debounce; original-block marker labels; corrections rebuild from the earliest dirty source time, including historical markers. Qualified crew membership and finalized complete-ingest cuts are typed inputs, unavailable by default. Structural engine card flow includes beta/confidence.
- `packages/db/drizzle/0158_watcher_flow.sql`, `0159_watcher_flow_invalidation.sql`: reserved engine migrations only. Flow windows/events, model state, evaluation rows, finalized Census snapshots, and source invalidation. Partitioned swaps use an explicit trigger source argument. Source corrections hide old results until rebuilt and remove stale Census snapshots.
- `packages/db/src/flow-read.ts`, `flow-schema.ts`, `engines-migrate.ts`, `index.ts`, `client.ts`, `bus.ts`: canonical, current-model reads, latest evaluation gate, metadata-only gated Census responses, marker availability, and committed flow notifications.
- `apps/server/src/read/{store,coins,feed,live,scan}.ts`, `http/v1/reads.ts`: measured card/list/window reads, marker lists, structured agent/crew Feed events, typed/coalesced flow WS, and public `GET /v1/census`. API consumers honor dirty state and return beta/confidence before the gate. Flow WS retains availability metadata in the shared contract.
- `packages/shared/src/contracts/{api,coin,feed,ws}.ts`: additive model/beta fields, Feed confidence, gate Wilson lower bound/recall, and flow WS availability metadata.
- `apps/engines/test/watcher-flow.test.ts`, `apps/server/test/flow-census.test.ts`, `packages/db/test/merge-migrations.test.ts`: pure boundaries, unresolved enrichment, label split/precedence, persisted tiers, partial crew coverage, card/list/marker/Feed reads, gate/model/finality, historical corrections, WS coalescing, partition invalidation, reorgs, debounce, and fresh/upgrade/idempotent migrations. Existing tests and assertions are retained; the migration ledger expectation adds the two reserved migrations.

No dependencies, lockfile changes, server migrations, Guard logic, spec edits, personal identifiers, real secrets, or MCP edits. No identifiers were ported from another source.

## Spec and interpretation

Followed BACKEND §§3.4, 5.5–5.7, 15.3, 23 CA-3/14 (with CA-31/34/35 availability semantics); FRONTEND §§3.0, 3.5, 3.9; FACTS §7; MARKETING §04 claims rules. No spec/code conflict requires overriding an existing rule.

New `TODO(spec)` notes:

1. `watcher/flow.ts`: window endpoints are unspecified; use `(asOf-duration, asOf]`, also excluding future blocks.
2. `watcher/flow.ts`: the wash net threshold has no denominator; use `abs(buyUSD-sellUSD)/(buyUSD+sellUSD) < 0.10`, with disjoint round trips within 300 seconds.
3. `watcher/flow-store.ts`: this revision has no persisted finalized-tag/complete-ingest certificate. Require an upstream typed cut; never substitute the head.
4. `flow-read.ts`: methodology URL and Census coin selection are unspecified. Link `/census#methodology`; publish finalized chain windows and leave `coins` empty rather than mix head Radar rows into finalized data.

Retained relevant earlier ambiguities: shared `FlowEvent` uses the existing minimal ChartMarker-plus-coin/block shape; ReadStore retains its existing structural price placeholder mask and observed-total-supply market-cap interpretation. The qualified graph remains an upstream dependency as requested.

## Checks

- `pnpm typecheck`: exit 0 on the final source candidate.
- `VITEST_MAX_WORKERS=2 pnpm test`: initial full attempt exited 1 on the existing policy p95 performance assertion (53.9 ms versus 30 ms) under concurrent workspace load. No assertion or timeout changed.
- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/policy test test/performance.test.ts`: isolated rerun exited 0.
- `npm_config_workspace_concurrency=1 VITEST_MAX_WORKERS=2 pnpm test`: exit 1 after 277/277 engine tests passed and 152/153 indexer tests passed. The existing captured-block benchmark timed out at its unchanged 20-second limit. pnpm did not apply the requested workspace concurrency environment setting; package scheduling remained the default.
- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/indexer test test/performance.test.ts`: isolated rerun exit 1; 12/13 tests passed, same captured-block timeout. This is a persistent verification blocker; indexer application code and tests are unchanged by this packet.
- `pnpm_config_workspace_concurrency=1 VITEST_MAX_WORKERS=2 pnpm test`: a further full retry was started before reading the isolated result, then stopped with exit 130 once that result confirmed the same blocker. It is not pass evidence.
- `pnpm brand:check`: exit 0.
- `pnpm check:addresses`: exit 0.

Server/MCP/role-image gates were run independently because root stopped before reaching them. MCP completed with exit 0 (24 tests). The first server run exited 1 (352/353 passed) on an existing exact card equality assertion: an extra `flow.meta` field survived the direct read while negotiated schema parsing removed it. Fixed the packet-owned card projection to place metadata only in `card.meta.flow`; the original assertion is unchanged. `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/guard-card-api.test.ts test/flow-census.test.ts` then exited 0, 19 tests, including the final worker model-selection path. Final server/role-image checks passed on the corrected candidate. No full root test pass is claimed.

Focused commands completed before the full gate:

- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/engines test test/watcher-flow.test.ts test/wallet-fingerprints.test.ts`: exit 0, 27 tests; before the final persisted-tier case. The final pure rerun, `VITEST_MAX_WORKERS=2 pnpm --filter @eko/engines test test/watcher-flow.test.ts`, exited 0 with 8 tests.
- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/flow-census.test.ts`: exit 0, 7 tests after the partition/historical correction fix; the final focused API/Guard card check (19 tests, exit 0) covers the subsequent tier, shared WS, generation selection, and card shape fixes.
- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/flow-census.test.ts test/v1-reads.test.ts`: existing v1 reads passed all 4 tests; the added historical test initially exposed the partition trigger issue, subsequently corrected and reproduced successfully.
- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/db test test/merge-migrations.test.ts`: exit 0, 3 tests.
- `pnpm brand:check`: exit 0.
- `pnpm check:addresses`: exit 0.

Initial implementation checks caught a reserved SQL column name, missing fixture block field, empty-range availability, and the partition trigger issue; these were corrected without removing or weakening assertions or changing timeouts. No incomplete run is counted as a full pass.

Latest validation details:

- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/flow-census.test.ts`: final generation fixture exited 0, 8 tests.
- Full engine suite: 277/277 passed before the last worker generation-selection addition; the final 8-test API fixture exercises its changed replay/model gate path. Flow math and storage are unchanged since that engine suite passed.
- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/mcp test`: exit 0, 24 tests; MCP code unchanged.
- `pnpm test:role-image`: first and final runs exited 0; final build/role verification includes the last server projection fix.
- Final `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test`: exit 0, 41 files / 354 tests.
- Final `pnpm typecheck`: exit 0.
- Final `pnpm test:role-image`: exit 0; server/web builds and role fixture checks passed.
- Post-build `pnpm brand:check`: exit 0, 154 files.
- Final `pnpm check:addresses`: exit 0, 443 source files.
- `git diff --check`: exit 0.

The completed root attempts preceded the last generation-selection/card-shape refinements. Final focused/API/server/typecheck/role checks cover those changes; no final root pass is claimed. The unchanged indexer benchmark remains the blocker. Existing fork tests reported their pre-existing missing-RPC skip; this packet did not add, change, or suppress skips.

## Dependencies and reproduction

Guard 046/047 must supply `FlowOptions.crewAt` with a qualified point-in-time member or an explicitly covered absence. Missing coverage stays `{status:'unavailable'}`. Graph revisions must trigger a refresh at their original affected cuts, including the optional `refreshCoinFlow` source-time bound for corrections older than 24 hours. The upstream indexer must supply `FlowOptions.finalized` only for a finalized, completely ingested cut. Accepted current-model evaluations must populate `eval_gates`; no fixture evaluation is shipped as live evidence. Until these inputs are present, public Census headlines stay gated and incomplete flow/list coverage stays unavailable. The lead wires the task 094 `census_summary` tool after merge; `apps/mcp` and Drop 1 tool exposure remain untouched.

Reproduce with the focused commands above, then `pnpm typecheck`, `VITEST_MAX_WORKERS=2 pnpm test`, `pnpm brand:check`, and `pnpm check:addresses`. No network or listening port is required by the new tests; API requests use Fastify injection and WS uses an in-memory socket.

All task processes have completed or were explicitly stopped. Checkpoint: `/tmp/eko-102-checkpoint.md`. Final typecheck log/exit: `/tmp/eko-102-typecheck.log`, `/tmp/eko-102-typecheck.exit`; root attempts: `/tmp/eko-102-test.log`, `/tmp/eko-102-test-serial.log`; isolated benchmark: `/tmp/eko-102-indexer-performance.log`; final server: `/tmp/eko-102-server-final.log`; MCP: `/tmp/eko-102-mcp-full.log`; final role check: `/tmp/eko-102-role-final.log`; final brand: `/tmp/eko-102-brand-final.log`. Corresponding `.exit` files record completed check results. Paid-run cost: zero. Evidence covers synthetic fixtures and local migration/read behavior, not live-chain precision, qualified crew acceptance, or deployment. No local job remains running. Next concrete option for the lead: rerun the unchanged indexer performance file on a quieter runner, then the complete root gate before acceptance/merge. Do not raise the benchmark timeout or treat the individual passing packages as a root pass.
