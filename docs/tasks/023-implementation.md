# Task 023 implementation and handoff

Sources followed: BACKEND §15.1–15.3, §21.1 and §23 CA-1/3/31/32/34/35; FACTS §7; FRONTEND VerdictChip and §3.2–3.5. No files in `docs/eko/` were changed.

## Files and routes

`apps/server/src/read/` contains separate Radar, Pairs, Feed, Coins and Scan services plus their shared database reader, pagination and live consumer. `http/v1/reads.ts` validates inputs and registers the routes; `app.ts` uses one `@eko/db` connection for the heritage schema and chain/engine tables.

| Route | Source |
| --- | --- |
| `GET /v1/radar?cursor` | tokens, latest cards/verdicts, swaps for activity, minute bars for USD price/change/volume and ≤48 ten-minute spark samples |
| `GET /v1/pairs?stage&cursor` | Pons tokens, cards, graduation blocks, distinct swap buyers; 100 per column |
| `GET /v1/feed?kinds&cursor` | tokens/pools, created verdict events, Monitor/Danger playbook matches, graduation blocks; block timestamps from engine/chain clocks |
| `GET /v1/coins/:address` | latest engine card, with current freshness age |
| `/verdict` | latest non-orphaned verdict, including evaluated playbooks |
| `/candles?tf&from&to` | existing `@eko/db` candle helper over minute bars |
| `/markers?from&to` | empty list with `unavailable: ['labels']`; legacy `markers: []` alias retained |
| `/flow?window` | card flow plus section metadata |
| `GET /v1/scan?q=` | indexed token identity, latest card when present |

All read routes have zero delay and make no RPC requests. Feed timestamps are milliseconds, matching the web; candle/tick timestamps are seconds. Current Feed sources omit agent/crew trades, swarm, clone and burn events. Pending verdict events omit the optional Feed `level`, whose existing schema does not allow pending.

Identity-only tokens: search returns `pending` with indexed candidates and an explanatory message; `/coins/:address` returns `404 not_found` explaining that no card is available. There is no fabricated CoinCard or deployer. Unknown searches return `not_found`.

`ws/hub.ts` adds typed public channels and per-channel sequences while retaining legacy streams. `read/live.ts` consumes card_updated, verdict_created, pair_created and swap ids from Postgres LISTEN or the shared in-process bus. It publishes Radar upserts/removals/reranks, Pairs upserts/removals, Feed items, and coin cards/verdicts/ticks. Reranks and ticks coalesce to at most one per second; tick volume accumulates distinct swaps. Slow clients receive resync.

`packages/db/src/lock.ts` protects disk PGlite directories with PID ownership, rejects second opens and clears dead-PID locks. `apps/server/src/dev.ts` runs the existing head follower and engines against the API's same handle and spend meter. The server build includes the chain SQL migrations.

The web changes cover the chip, Radar/Pairs cells and sorts, inspector, coin sections, and GET search. Pending chips are calm and stationary, with missing checks in their tooltip; Scanning is used only before the first verdict. Trade openers no longer treat an existing pending verdict as an ongoing scan. The existing guarded execution panel remains the M3 placeholder; its pending-order explanation is included.

## Availability and spec gaps

Rows always mark `exitCost` and `flow` unavailable. They mark liquidity when unavailable or measured depth is missing, signal when absent, change when the prior hourly price is missing (24-hour change is omitted if its prior price is absent), and marketCap when supply or price is unknown. `priceUnavailable` also masks the required structural price value before the first priced swap. Existing `verdictPending` on Pairs is additive on summaries; evaluatedPlaybooks/missingChecks carry row tooltip context. Flow responses add section metadata; scan responses add an explanatory message. No external dependencies were added; the lockfile records workspace dependencies.

TODO(spec) decisions:

- Pending ranks after Monitor and before Danger; available flow/exit keys precede hourly USD volume and address. Signal never ranks.
- Near graduation uses 75%. Current engine cards omit curvePct, so unknown progress remains in New and reads “not checked yet”. Migrated pairs sort by graduation block.
- Market cap uses observed total supply, matching `market.ts`; circulating supply accounting remains incomplete.
- Row tooltip context uses additive evaluatedPlaybooks/missingChecks fields until that context is frozen in the row contract.
- Required pre-price numbers need additive availability metadata; priceUnavailable masks them.
- 1s/15s candles return no bars and `unavailable: ['subMinuteBars']`; this task does not synthesize them from minute bars.
- The Fast Scan queue is deferred; unindexed addresses are not_found.

## Local commands

Run from the repository root. Use one absolute PGLITE_DIR for all sequential seed/backfill/replay commands and the dev role. Stop standalone indexer/engine processes before opening that same directory in the API.

```sh
# Existing indexed/replayed local directory, with provider URLs supplied via the local environment:
APP_ROLE=dev MARKET_DATA_SOURCE=onchain RUN_WORKER=false \
  PGLITE_DIR="$PWD/.data/indexer" pnpm --filter @eko/server dev

# In a second terminal; Vite proxies /v1 and its WebSocket to the server:
VITE_MOCKS=0 EKO_API=http://localhost:8710 pnpm --filter @eko/web dev

# API only over an existing directory (no head follower / engine workers):
APP_ROLE=api MARKET_DATA_SOURCE=onchain RUN_WORKER=false \
  PGLITE_DIR="$PWD/.data/indexer" pnpm --filter @eko/server dev

# Optional deterministic seed, built by real indexer/engine code without RPC:
PGLITE_DIR="$PWD/.data/read-e2e" pnpm --filter @eko/server exec tsx test/seed-read-cli.ts

# Lead's browser check: real seeded in-memory PGlite, VITE_MOCKS=0, 1440 and 390:
pnpm --filter @eko/web exec playwright test --config playwright.read.config.ts
```

The dev role requires RPC_HTTP_URL and RPC_WS_URL, refuses production and DATABASE_URL, and performs only its normal metered ingest/engine RPC work. Production uses APP_ROLE=api and DATABASE_URL for the API, with separate indexer and engines processes.

## Verification

- `pnpm typecheck`: passed. The final web typecheck also passed after the last cell/copy changes.
- `pnpm test`: passed across the workspace, including the real-fixture route tests and PGlite lock test. Route checks also cover measured hourly change when 24-hour history is absent. The existing Foundry fork suite reports one pre-existing skip; no tests were deleted, skipped or weakened for this task. The web suite passed again on the final cell/copy changes (31 files, 415 tests).
- `pnpm brand:check`: passed. `pnpm check:addresses`: passed. `git diff --check`: passed.
- Server build: passed. The real-server Playwright configuration lists two tests, one for each requested viewport. Browser execution is deferred to the lead because the sandbox cannot open ports.
- Offline install: the prescribed command failed because the store lacks the existing font tarball; the lockfile-only update succeeded and only workspace links changed. Frozen lockfile-only verification was stopped when pnpm's supply-chain verifier attempted unavailable registry requests despite `--offline`. A clean frozen install is therefore not verified in this sandbox. Local checks used dependency files already available in the adjacent checkout and `--config.verify-deps-before-run=false` to avoid triggering another install.

Existing tests that expected onchain startup to be rejected were replaced with indexed-read startup checks. Pending presentation tests now check CA-35's two distinct states and pending trade-opener behavior. No personal identifiers were copied into source or fixtures.
