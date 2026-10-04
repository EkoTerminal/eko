# Task 131 report — Flap unsupported manifest

Status: prepared, unsupported. No Flap launch, trade, migration, backfill, quote, control, custody or execution capability is enabled. Nothing was committed, deployed or approved.

## Candidate and scope

Base revision: `39420c40c9b48742ca12ddcee3a5280297b9fc8c`; candidate is the uncommitted worktree. Implementation/test/provenance file-set SHA-256: `ab0246c8f066cfb56b623db752f7885da2f4b24014a507f1770795f4d44dcfb9` (sorted path-to-content-SHA-256 JSON, compact separators; excludes this report).

Changed files:

- `packages/chain/src/launchpads/flap.ts`: implements the existing `LaunchpadAdapter` boundary with no accepted emitters, decoded events or optional methods; exports the unsupported manifest and diagnostic decoder result.
- `packages/chain/src/index.ts`: shared package export for Flap only.
- `packages/chain/abi/flap/manifest.json`: explicit capability refusal, evidence dependencies and provenance reference; no inferred ABI fragments or registry addresses.
- `packages/chain/test/flap.test.ts`: unsupported capability, observed-topic rejection, malformed/unknown/emitter/removed-log rejection, replay/order/replacement input neutrality and provenance bounds.
- `packages/chain/test/fixtures/flap/provenance.json`: live public evidence summaries, every requested source URL, RPC method/parameters, response digests, block/transaction pins and deployment code hashes.
- `docs/tasks/131-flap-adapter-report.md`: this report.

No indexer or Guard logic, address registry, database migration, dependencies, lockfile, other launchpads or specification files changed. Migration 0172 was not needed. Source content was summarized without copying token text, participant identities, account handles, authors or personal paths; test actors and emitters are neutral synthetic addresses.

## Evidence and unsupported decision

Followed BACKEND §§4.3–4.5 and OVERVIEW §06, plus the packet's verification exception and unsupported fallback. Reviewed dependency packets 016/024/027 and partial-card packets 029/035. Optional adapter methods remain absent, and missing observations cannot supply identity, control, custody or quote evidence to partial cards.

Live verification used **8 public RPC requests and 13 public GET requests**, against limits of 300/60. No paid requests, signing, transactions, keyed services, package installations or operational indexer runs; actual service cost **$0**.

Pin: chain 4663, block **79,253,769**, block hash `0xaf3adac9077c36ba3bf844c09bbe6c0d431ba89162e843d348220ff148ca25c6`. Flap's deployment list and Robinhood integration guide identify Portal/VaultPortal proxies and two token templates. Each had nonempty code at the pin; provenance records byte lengths and keccak256 runtime hashes. Code presence does not establish implementation binding or reviewed token controls.

A single address-filtered 10,000-block Portal window, **79,243,770–79,253,769**, returned 718 logs. Documented `TokenBought`, `TokenSold` and `LaunchedToDEX` selectors/layouts matched observed logs (57/7/1 respectively). Sample transaction hashes, block hashes, log indices and data digests are pinned in provenance. This corroboration is retained without enabling decoders or asserting canonical receipt verification.

The official launch-event page describes `TokenCreated` field meanings but omits ABI types and indexed flags. The chain explorer verified-contract API returned **HTTP 403, Cloudflare challenge**. No implementation ABI, exact launch fragment or launch/template binding was acquired; no launch selector was guessed and no challenge bypass was attempted. Therefore the adapter exposes `addresses() = []`, `decode() = []`, all manifest capabilities false and `liveApproved = false`. Documented deployment candidates remain provenance observations rather than accepted registry entries.

This fulfills the packet's explicit unsupported fallback. It does **not** certify launch-before-trade persistence, idempotent indexer writes, reorg rollback or recent leased backfill coverage. Those require verified launch evidence and integration fixtures before implementation. Existing Guard ownership and nullable partial-card behavior are preserved.

## Checks

- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/chain test test/flap.test.ts test/abi-pull.test.ts` — exit **0**, 2 files / 10 tests passed.
- `pnpm typecheck` — exit **0**; log `/tmp/131-typecheck.log`.
- `VITEST_MAX_WORKERS=2 pnpm test` — exit **0**, including repository tests and web/server builds plus role-image checks; log `/tmp/131-test.log`. Chain: 321 tests; indexer: 152; engines: 249; server: 390; MCP: 24. The existing contract suite reported 34 passed and 1 skipped; this packet changed no skips.
- `pnpm brand:check` — exit **0**.
- `pnpm check:addresses` — exit **0**, 466 source files checked.
- `git diff --check` — exit **0**.

Checkpoint: `/tmp/131-checkpoint.json` records candidate content hashes, completed checks, process sessions, log locations, scope and cost. Both processes finished with exit 0. No local job remains running. Next action: lead review of this unsupported candidate; operational enablement awaits the evidence listed below. No test assertion or timeout was changed, and no test was removed or skipped by this packet.

## TODO(spec) and remaining dependencies

One new `TODO(spec)` in `packages/chain/src/launchpads/flap.ts`: enable Flap only after its Portal launch ABI and implementation binding, canonical fixtures and recent leased backfill ordering/reorg checks are verified.

Required next evidence: a public verified chain-4663 Portal implementation ABI with exact `TokenCreated` types/indexing and runtime binding; pinned launch transaction/receipt and token-template/quote-asset configuration; canonical launch/trade/migration fixtures. Then implement only verified events using the indexer's leased recent streams and natural-key writes, with integration ordering/dedup/reorg checks. V2 migration mapping also needs the corresponding pool contract evidence; a migration topic alone does not define an accepted `PoolRef`. Quotes/control/custody remain unavailable independently.

Reproduce checks with the commands above. For read-only evidence reproduction, GET the official URLs listed in provenance, then use its exact RPC requests against `https://rpc.mainnet.chain.robinhood.com`; keep the log query to the recorded 10,000-block range. `pnpm --filter @eko/chain abi:pull flap` remains unavailable and cannot bootstrap verified evidence from inferred addresses. No live backfill command is supplied while the capability is unsupported.
