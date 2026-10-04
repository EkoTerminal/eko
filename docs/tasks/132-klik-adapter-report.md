# Task 132 · Klik adapter report

Candidate: base `39420c40c9b48742ca12ddcee3a5280297b9fc8c` plus the uncommitted Task 132 changes listed below. Nothing committed, pushed, deployed or live-enabled.

## Result and scope

Delivered the packet's explicit unsupported fallback. Klik's factory, event ABI and emitter roles could not be verified from the permitted sources. No selectors, addresses, risk measurements or execution routes were inferred. Klik launch/trade/migration ingestion and recent backfill remain unavailable, with incomplete coverage. This is an unresolved T ingestion dependency, not complete launchpad coverage.

Followed `04-BACKEND` §§4.3–4.5 and `01-OVERVIEW` §06: pure adapter contract, verified-emitter/ABI prerequisite, explicit backfill gap, and neutral unknown risk inputs. Reused 029/035 launch-role and card projections without changing Guard logic. The overview's stated Klik decoding coverage is not supported by this candidate's evidence.

Changed files:

- `packages/chain/abi/klik/manifest.json`: unsupported capabilities, empty event ABI/address/filter lists, evidence requirements and provenance reference.
- `packages/chain/src/launchpads/klik.ts`: adapter with no emitter addresses, reads, quotes or execution methods; unknown logs yield no events.
- `packages/chain/src/index.ts`: shared package export for the Klik adapter and support manifest.
- `packages/chain/test/fixtures/4663/klik-provenance.json`: selected public responses and every requested source URL/method; pinned block and explicit null deployment/transaction/code hashes.
- `packages/chain/test/klik.test.ts`: unsupported contract, unknown ABI/emitter rejection, duplicate/removed/replacement-log behavior and provenance checks.
- `apps/server/test/klik-adapter.test.ts`: neutral partial Klik cards, no inherited Pons profile, no manufactured V1 issuer, and shared V1 response masks.
- `docs/tasks/132-klik-adapter-report.md`: this handoff.

No dependency, lockfile, registry address, migration, indexer writer or other launchpad changes. No personal identifiers were copied into the new fixtures.

## Live evidence versus fixtures

The public RPC returned chain ID `0x1237` (4663) and head block **79,253,000**, pinned with `eth_getBlockByNumber`. Its block hash is `0x36768df49523d0570850da84e8346f154ce38928fefc56f54f4c697834657a3d`.

All sources and their responses are recorded in `klik-provenance.json`:

- `https://rpc.mainnet.chain.robinhood.com`: `eth_chainId`, `eth_blockNumber`, `eth_getBlockByNumber` only.
- `https://robinhoodchain.blockscout.com/api/v2/search?q=Klik`: HTTP 403; no results acquired.
- `https://robinhoodchain.blockscout.com`: public HTML, without Klik deployment evidence.
- `https://robinhoodchain.blockscout.com/search-results?q=Klik`: public HTML with server-rendered `apiData: null`, without deployment evidence.

Actual acquisition: **3 RPC requests / 300 allowed; 3 web GETs / 60 allowed; zero log ranges, paid/keyed requests or transactions**. Paid endpoint cost: **$0**. No pricing for public infrastructure was assumed. No trusted Klik documentation URL or pinned Klik source was supplied in the packet/repository. No bot-check bypass was attempted.

Verified Klik deployments/events/code hashes/transactions: **zero**. Null transaction and code hashes mean evidence is missing. This does not establish that Klik has no deployment. Test emitter addresses, ABI-negative cases, replay/reorg inputs, issuer prerequisites and assessments are synthetic; they do not validate live Klik events. Replay/reorg checks prove only that the unsupported adapter emits no rows; supported-event replay/reorg persistence is deferred with ingestion.

## Checks and checkpoint

| Command | Exit code | Evidence |
|---|---:|---|
| `pnpm --filter @eko/chain test test/klik.test.ts` | 0 | 4 tests; final focused run in `/tmp/132-klik-focused-chain-final.log` |
| `pnpm --filter @eko/server test test/klik-adapter.test.ts` | 0 | 2 tests; `/tmp/132-klik-focused-server.log` |
| `pnpm typecheck` | 0 | `/tmp/132-klik-typecheck-final.log` |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | `/tmp/132-klik-test.log`; completed process session 29676, including builds and role-image gate |
| `pnpm brand:check` | 0 | `/tmp/132-klik-brand.log` |
| `pnpm check:addresses` | 0 | `/tmp/132-klik-addresses.log` |
| `git diff --check` | 0 | Whitespace check |

Initial `pnpm typecheck` and diagnostic `pnpm --filter @eko/chain typecheck` exited 2 on new test/adapter type annotations and an insufficiently narrowed ABI element; these were corrected without changing assertions or timeouts. The final focused decoder run and final full typecheck passed. The full suite passed, including chain (27 files, 320 tests), engines (25 files, 249 tests), indexer (12 files, 152 tests), server (44 files, 392 tests) and MCP (2 files, 24 tests). Existing contract tests reported 34 passed and one pre-existing conditional fork skip (`RPC_HTTP_URL` unset); no test was deleted, weakened or newly skipped.

Checkpoint: all required commands completed, web/server builds and built role fixture checks passed, no process remains running for this task. The role-image gate exercised fixture boot/injected routes without ports or deployment evidence. Logs remain in the listed task-specific `/tmp` files. No duplicate full suite was started. Next action is lead review of the uncommitted candidate and acquisition of the missing Klik evidence, not deployment.

## TODO(spec), dependencies and reproduction

One new `TODO(spec)` in `packages/chain/src/launchpads/klik.ts`: verify Klik's 4663 deployment, event ABI, emitters and pinned receipts before enabling decoding or address/topic-filtered `logs:klik` backfill (§§4.3–4.5).

To enable support, supply an authoritative Klik deployment source for chain 4663, verified event fragments with emitter roles, runtime code hashes at a pinned block, and real launch/trade/migration receipts. Only then add registry entries, decoder mappings and bounded recent leased backfill using indexer-owned idempotent writes. Quotes, control, custody and execution require their own evidence; there is no inherited Pons profile or automatic execution route.

Reproduce locally with the exact six package/root commands in the table. Tests perform no network I/O. Live acquisition is recorded as a bounded verification attempt; no background acquisition or deployment remains authorized or scheduled.
