# Task 135 implementation report

Candidate: base `1b9bdfcb4a8bbe8f7615f9582691412347dffee1` plus the uncommitted changes listed below. Source candidate SHA-256: `2b646df8e0e47cff04cdfa9b63d064c6c203993022ff7ad4cd1cdca327bb5638` (sorted relative source/test filenames, NUL, file bytes, NUL; excludes this report). No commit, push, deployment, publication, paid job or live chain request was performed. No dependencies or lockfile changes.

## Changes and scope

- `apps/server/src/read/coins.ts`: serve 1s/15s using the existing database aggregator and injected clock. Keep 1m+ behavior and the aggregator's bar-derived `asOfBlock`; no replacement with current head.
- `packages/db/src/market.ts`: bound sub-minute raw reads and history metadata to the last six hours; use `[from,to)` timestamps and existing venue/graduation eligibility. Keep gaps unfilled. Mark missing retained raw history, clipped-away ranges and missing/pending pricing as `unavailable: ['subMinuteBars']`; expose retained-window first/last trade timestamps. An empty query inside an observed raw-history window remains a measured database empty interval, not an assertion of complete chain acquisition. Archived minute bars alone do not establish raw history availability.
- `apps/server/test/subminute-candles.test.ts`: six isolated PGlite/Fastify-injection tests covering UTC/exclusive boundaries, same-second block/log ordering, OHLC/volume, row-pinned blocks, empty versus unavailable history, six-hour clipping, bounded SQL, minute behavior, incomplete prices, invalid requests, and incremental inserted swaps/typed coin ticks. Meter usage is unchanged across candle requests.
- `apps/web/src/components/chart/coinMath.ts`, `apps/web/src/pages/terminal/useCoin.ts`: reconcile buffered ticks at REST's exclusive `to` boundary, including ticks exactly at `to`.
- `apps/web/src/pages/terminal/Coin.tsx`, `apps/web/src/copy/availability.ts`: show incomplete-history warnings alongside partial bars.
- `apps/web/src/components/chart/coinMath.test.ts`, `apps/web/src/pages/terminal/Coin.test.tsx`: short-interval snapshot/tick and UI presentation tests. UI evidence uses parsed fixtures, pure aggregation and server rendering, not a browser run.
- `docs/tasks/135-implementation.md`: this report.

Followed FRONTEND §3.5, BACKEND §23 CA-4 and existing task 021 aggregation conventions. The packet cites BACKEND §4.9, but that section is absent in this checkout (the §4 headings end at §4.6); no read-only spec was edited. Read T-GAP-ANALYSIS for ownership context and MARKETING claims rules before changing availability copy. Guard, prototype, chain acquisition and other packets remain outside scope.

## TODO(spec) and dependencies

New TODO in `packages/db/src/market.ts`: CA-4 does not define a raw-history completeness watermark. Availability measures retained observations, not certified chain coverage. A future acquisition-coverage contract must resolve that distinction; no completeness gate is claimed here.

Removed the CoinsService TODO that blocked all sub-minute requests. Existing TODOs retained in changed source files:

- `packages/db/src/market.ts`: observed holder balances need genesis/archive opening balances; market-cap projection uses sampled total supply because locks, vesting, burn-wallet inventory and historical supply are absent.
- `apps/web/src/pages/terminal/Coin.tsx`: PublicConfig lacks an own-token address; ChartMarker lacks transaction identity for launch flames; CoinCard lacks price/change fields; guarded TradePanel is a separate packet.

Tasks 021/023 are implemented dependencies used here. Serving useful candles still requires retained indexed swaps and USD pricing/token decimals; missing evidence is marked unavailable. No schema/dependency migration, paid acquisition or remote action is needed for this diff. Browser QA and live completeness are not established by these fixture tests; no ports or network were used by the new tests.

## Validation and reproduction

Run from the repository root. Logs are local, outside the repository; paths below contain no personal identifiers.

| Exact command | Exit | Evidence / log |
|---|---:|---|
| `pnpm --filter @eko/server exec vitest run test/subminute-candles.test.ts --testTimeout=30000 --hookTimeout=30000` | 0 | 1 file, 6 tests; `/tmp/eko-135-focused-server.log` |
| `pnpm --filter @eko/web exec vitest run src/pages/terminal/Coin.test.tsx src/components/chart/coinMath.test.ts --testTimeout=30000 --hookTimeout=30000` | 0 | 2 files, 20 tests; `/tmp/eko-135-focused-web.log` |
| `pnpm --filter @eko/indexer exec vitest run test/phase-b.test.ts --testTimeout=30000 --hookTimeout=30000` | 0 | 1 file, 8 tests; `/tmp/eko-135-focused-indexer.log` |
| `pnpm typecheck` | 0 | final source check passed; `/tmp/eko-135-typecheck.log` |
| `pnpm test` | 0 | complete required workspace gate, 1680 tests passed; `/tmp/eko-135-test.log` |
| `pnpm brand:check` | 0 | 15 files; `/tmp/eko-135-brand.log` |
| `pnpm check:addresses` | 0 | 274 source files; `/tmp/eko-135-addresses.log` |
| `git diff --check` | 0 | no whitespace errors |

Initial UI-focused run exited 1 because the new server-render test needed the existing media-hook mock convention; after adding that test-only mock, the same focused command passed. No application code was changed to accommodate that runner failure; no tests were weakened or skipped.

Final checkpoint: source implementation is stable at the digest above. Required `pnpm test` completed in process session 38099 with exit 0, log `/tmp/eko-135-test.log`; final `pnpm typecheck` completed in process session 4722 with exit 0, log `/tmp/eko-135-typecheck.log`. All listed checks have completed; no job remains running. Actual paid cost: 0; no paid job was launched (paid-provider labels in existing meter tests refer to mocked providers). All new acquisition evidence is isolated database/fixture evidence, not live evidence. Implementation is prepared and tested locally as recorded; no build artifact, deployment or release approval is claimed. Next external action, if desired: review this candidate; live/browser validation and release authorization remain separate.
