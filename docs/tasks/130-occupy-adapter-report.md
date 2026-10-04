# Task 130 report

Candidate: base `39420c40c9b48742ca12ddcee3a5280297b9fc8c` plus the uncommitted files below. No commit, deployment, publication or live venue acceptance.

## Result and files

Delivered the packet's explicit unsupported fallback. Occupy remains an unresolved T ingestion gap. No factory, template, event ABI or quote evidence could be verified; no selector or full address was inferred from abbreviated hints.

- `packages/chain/abi/occupy/manifest.json`: unsupported status, exact empty event/call coverage, named gaps and activation evidence. Phase B's 30-day scope and 10,000-block request bound are recorded, but backfill is disabled. These fields are requirements, not implemented ingestion coverage.
- `packages/chain/src/launchpads/occupy.ts`: `LaunchpadAdapter` with empty addresses/events, no optional reads, quotes or execution. The diagnostic decoder counts every topic as unknown without asserting ABI validity.
- `packages/chain/src/index.ts`: shared export point for Occupy only. The existing indexer remains unchanged; no unverified stream is registered, seeded or marked complete.
- `packages/chain/test/fixtures/4663/occupy/provenance.json`: all attempted external URLs, transport results, request counts, null block/transaction/code pins and synthetic-fixture distinction.
- `packages/chain/test/occupy.test.ts`: four synthetic tests for unavailable coverage, unknown topics including Pons/ERC-20 topics, replay/removed/replacement-fork logs and provenance.
- `apps/engines/test/occupy-partial.test.ts`: synthetic independently seeded Occupy token; existing indexer-owned capture produces schema-valid partial identity, leaves issuer/quote/stage/fees/control/custody unknown, replays idempotently, invalidates orphan evidence and retains historic reads. This is partial-card compatibility validation, not proof of Occupy launch discovery or event ingestion.
- This report.

No dependencies, lockfile changes or migrations; reserved migration 0171 unused. No personal identifiers were ported. No existing tests were weakened, skipped or deleted; timeouts unchanged.

## Sources, coverage and cost

Acquisition date: 2026-10-03. Every attempted source is retained in the provenance JSON. Public RPC `eth_chainId` and two explorer GETs returned HTTP 403. Two `web.open` GET attempts yielded an explorer title with no usable source content and an inaccessible explorer search endpoint. No Occupy official documentation URL was established from the allowed sources. No bypass, login, keyed endpoint, transaction, signing, package install or broad block scan was attempted.

Actual request attempts: **1 RPC / 300 allowed; 4 web / 60 allowed; paid cost 0**. No log ranges fetched. Requested chain 4663 was not independently confirmed because its RPC response was blocked. Live evidence coverage is zero: block number/hash, transaction hash and code hash are absent, explicitly null or empty in provenance.

Supported Occupy launches, trades, migrations, curve state, quotes, control, custody and execution: **none**. No Pons profile inherited. Existing generic ERC-20/Uniswap support does not establish Occupy origin, quote semantics or migration links. Virtuals quote units must not be interpreted as ETH without evidence.

Spec followed: `04-BACKEND` §§4.3–4.5 (recent Phase B, verified-only decoders, adapter contract), §4.6 (registry-only addresses; TODO hints retained); `01-OVERVIEW` §06 (T ingestion gap); packets 016/024/027/029/035 (unknown-topic diagnostics, bounded public acquisition, immutable evidence and nullable V2 identity). No spec files or Guard implementation changed.

## Checks and checkpoint

| Command | Final exit | Result |
|---|---:|---|
| `pnpm --filter @eko/chain test test/occupy.test.ts` | 0 | 4 tests passed; also included in the full chain suite |
| `pnpm --filter @eko/engines test test/occupy-partial.test.ts` | 0 | 1 test passed |
| `pnpm typecheck` | 0 | All workspace typechecks passed |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | Workspace suites, builds and role-image checks passed; existing live contract fork test self-skipped because `RPC_HTTP_URL` is unset |
| `pnpm brand:check` | 0 | 38 files checked |
| `pnpm check:addresses` | 0 | 466 source files checked |
| `git diff --check` | 0 | No tracked-diff whitespace errors |

During development, new fixture assertions/read-cut construction initially failed focused tests (exit 1), and new test typings initially failed typecheck (exit 2). Corrected the tests to the existing strict contracts and obtained the final focused passes above; no application behavior or existing assertions were relaxed.

Full gate included 4 Occupy decoder tests and the Occupy partial-card integration test; chain: 27 files / 320 tests, engines: 26 files / 250 tests, indexer: 12 files / 152 tests, server: 43 files / 390 tests. Contracts: 34 passed, 0 failed, 1 existing environment-gated fork skip. No live fork result is claimed. Web/server builds and all direct/dispatcher role-image shutdown checks passed.

Local logs: `/tmp/occupy-130-chain.log`, `/tmp/occupy-130-partial.log`, `/tmp/occupy-130-typecheck.log`, `/tmp/occupy-130-test.log`. Completed checkpoint: `/tmp/occupy-130-checkpoint.json`. Full test process session `71206` completed with exit 0; typecheck session `11858` completed with exit 0. No local jobs remain running. Next action: lead reviews the uncommitted fallback; acquiring the external evidence below is required to enable Occupy ingestion.

## TODO(spec), dependencies and reproduction

New TODO in `packages/chain/src/launchpads/occupy.ts`: Occupy factory/template/event/quote evidence is unavailable; keep Phase B ingestion disabled until pinned verified sources satisfy the manifest. No other new TODO(spec).

External dependency: official full factory/curve/template/quote-asset deployments on 4663, verified ABI/source linkage and proxy implementations if applicable, pinned code hashes, canonical launch/buy/sell/migration transactions with receipts/logs, quote call fixtures and units. The manifest lists these explicitly. Control, custody and execution need their own verified evidence; none is inferred from launchpad identity.

When evidence is available, implement only its verified mappings, then connect bounded recent ingest through indexer-owned natural keys and add real-log replay/reorg fixtures before enabling coverage. Until then no Occupy backfill reproduction command is advertised as supported.

Reproduce local validation with the exact commands in the checks table. All tests are offline and synthetic for Occupy. The unsupported fallback is built/tested/prepared locally; venue ingestion is neither verified nor enabled.
