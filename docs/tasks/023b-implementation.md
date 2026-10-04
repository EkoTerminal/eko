# 023b implementation report

Implemented the twelve review items against BACKEND §15 and §23 (CA-34, CA-35, CA-36), FRONTEND VerdictChip and §3.2–3.5, and task 023. No dependencies, lockfile changes, chain requests, ports, or edits to `docs/eko/`. No personal identifiers were added or ported.

## Review items and resulting states

1. **Read performance.** Migration `0113_v1_reads.sql` adds transactionally maintained coin, buyer, feed, and first-verdict projections, ordered cursor indexes, covering bar indexes, UTC evaluation indexing, and indexed identity search. Radar, Pairs, and Feed select at most 101 events/coins before enrichment. Feed filters use bounded branches for each kind. Clock enrichment uses explicit selected block keys; it no longer walks the block history. Volume refresh uses the indexed current-hour bar range once per minute. All measured routes pass 300 ms on the seed below. The migration backfills existing data once; source updates and deletes maintain projections through database triggers.
2. **Radar totals.** The shared response carries global live-coin totals and distinct coins evaluated since 00:00 UTC. Danger now and Scanned today use these totals, including when the first page contains no Danger coins. Honeypots refused displays a dash and “not checked yet”. A regression fixture has five Danger coins outside the first 100 rows.
3. **Feed availability.** Trades, Ghost Reports, Swarm calls, and Burns show accessible dashes with “Not tracked yet”, including their last-five-minute rows. Produced kinds retain numeric counts. Observed wash alerts belong to Playbook alerts; they do not imply a Ghost Reports source.
4. **Identity-only tokens.** Tokens without deployer/card are excluded from Radar and Pairs, including live updates. Search retains their indexed identity with `status: 'pending'` candidates. `/coins/:address` returns `not_found` with a message that identity exists but no card is indexed; it never creates a card. Genuine Pons launches with a deployer can still appear as Scanning before their first card. Pons wording requires `launchpad === 'pons'`.
5. **Curve inventory.** Engine sources calculate sold share from the earliest positive transfer into the Pons curve and its remaining inventory. Current evaluation uses balances; historical evaluation/replay reconstructs the balance at that block. Cards and rows carry `curvePct`, and the 75% boundary selects Near graduation. Latest-card migration backfill respects each card's evaluation block and preserves hashed historical cards. Tests cover 0%, 75%, a return to 65%, live/replay parity, historical backfill, and 74.99% remaining below the boundary.
6. **Unavailable cells.** Radar/Pairs cells render muted em dashes with accessible name and tooltip “Not checked yet”. The legend reads “— not checked yet: exit costs and buyer mix arrive with the trade simulation and wallet labels”. Pairs values sit below their labels. Coin sections keep full wording.
7. **Pending copy.** Pairs renders “Not fully checked” once, in its calm verdict chip; the repeated explanatory line is removed.
8. **Symbols.** Radar, Pairs, Feed, coin headings, and inspectors use a single line, ellipsis, and full sanitized symbol in the title.
9. **Radar width.** Columns drop by the table container's width, in the specified order. Fixed column widths and the flexible coin column retain the Trade buttons at desktop widths; phones retain Coin, Guard, and Exit. Browser assertions cover document/container overflow at 1440, 1280, and 390.
10. **Coin empty charts.** Loaded empty candles show “No trades in this window · last trade 10 h ago” for the captured fixture, with Show full history when indexed trades exist. Full history includes the first trade's minute. An empty result leaves loading state. Wallet-label toggles are disabled with “Wallet labels arrive later”; no label marker layer is mounted. Sub-minute intervals retain their distinct unavailable state.
11. **Browser coverage.** The phone assertion selects the visible exit cell. The expanded real-server Playwright suite checks totals, unavailable counters/cells, identity exclusion/search, curve progress, single pending copy, symbol truncation, card label geometry, chart history, disabled labels, console errors, overflow, and route latency in both desktop and phone projects. Four tests register successfully. Browser execution is deferred to the lead because this sandbox cannot open ports.
12. **API-only RPC.** The caller was legacy health probing at startup and on its 20-second interval. Probes now require a worker or enabled live trading. A startup/timer regression runs API mode with worker/trading off and legacy routes enabled; no health probe occurs, and RPC usage remains empty with zero session units. Read services use only indexed database state.

## Route timings and query plans

Offline PGlite/Fastify injection against 2,475 carded Pons coins (280 Danger), 2,683 identity-only tokens, 120,001 engine runs, 400,001 swaps, 120,001 verdict events, 12,000 playbook matches, and 200,001 block timestamps in each clock table. Initial routes have six samples: the first request and five warmed requests. Warm p95 is the largest of those five samples. Next-page routes have one sample. “First” is after seeding/analyzing the database, not a disk-cold production restart. Verification ran concurrently during this capture.

| Route | First ms | Warm p95 ms | Maximum ms |
|---|---:|---:|---:|
| `/v1/radar` | 142.05 | 87.72 | 142.05 |
| `/v1/pairs?stage=new` | 55.41 | 63.80 | 63.80 |
| `/v1/pairs?stage=near_grad` | 56.01 | 58.71 | 58.71 |
| `/v1/pairs?stage=migrated` | 67.35 | 58.90 | 67.35 |
| `/v1/feed` | 10.62 | 12.56 | 12.56 |
| `/v1/feed?kinds=verdict` | 13.65 | 13.54 | 13.65 |
| `/v1/feed?kinds=new_pair` | 5.74 | 6.85 | 6.85 |
| `/v1/feed?kinds=playbook,wash` | 10.80 | 8.75 | 10.80 |
| `/v1/feed?kinds=burn` | 1.52 | 1.44 | 1.52 |
| `/v1/coins/:address` | 2.87 | 2.29 | 2.87 |
| `/v1/coins/:address/verdict` | 3.75 | 2.46 | 3.75 |
| `/v1/coins/:address/flow` | 3.10 | 3.56 | 3.56 |
| `/v1/coins/:address/candles` (5m, six-hour window) | 7.66 | 6.23 | 7.66 |
| `/v1/coins/:address/markers` | 1.27 | 1.80 | 1.80 |
| `/v1/scan?q=:address` | 3.24 | 4.16 | 4.16 |
| `/v1/scan?q=$POOL` | 7.66 | 5.93 | 7.66 |
| Radar next page | 75.67 | — | 75.67 |
| New Pairs next page | 53.48 | — | 53.48 |
| Feed next page | 11.88 | — | 11.88 |
| Verdict Feed next page | 10.97 | — | 10.97 |

[Query-plan evidence](023b-query-plans.json) contains all 54 `EXPLAIN ANALYZE` captures, including cursor pages and the four minute-refresh statements. It preserves SQL, execution/planning times, indexes, actual rows/loops, and plan structure without expanded bound values. The benchmark writes the full `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` output to `/private/tmp/eko-read-query-plans.json`.

Feed page selection reads 101 indexed events; first-verdict lookup reads only selected coins; clock lookup reads at most 203 keys per clock table in these plans. Radar/Pairs use their ordered cursor indexes and selected-coin covering bar reads. Evaluation totals use the timestamp index on today's engine runs. The planner deliberately scans the compact 2,475-row current coin projection for global totals and some joins/updates, and the one-row refresh clock; these are not scans of swap/verdict/header history. No row-by-row correlated history queries serve the page enrichment.

These are real-shaped seed measurements, not measurements of the lead's replay database or browser-to-server network latency. The lead must rerun latency and browser geometry against that database after applying the migration.

Reproduce the offline benchmark from `apps/server`:

```sh
node --import tsx test/read-benchmark.ts
```

Run the real-server browser suite from the repository root in the lead environment:

```sh
pnpm --filter @eko/web exec playwright test --config playwright.read.config.ts
```

## Verification and remaining scope

- Root `pnpm typecheck`: passed, exit 0.
- Root `pnpm test`: passed, exit 0, including 83 server tests, 66 engine tests, and 417 web tests. Foundry's existing optional fork test remains skipped; no tests were newly skipped or weakened.
- Final web checks after full-history refinements: typecheck and all 417 tests passed.
- `pnpm brand:check`: passed.
- `pnpm check:addresses`: passed.
- `git diff --check`: passed.
- Offline latency benchmark: passed, exit 0.
- Playwright discovery: four tests registered; browser checks were not executed here.

Commands use `--config.verify-deps-before-run=false` locally to avoid pnpm's environment dependency verification; no installation or dependency changes were needed. Existing shape expectations were updated for CA-36 totals and the produced wash-alert category.

Inherited `TODO(spec)` choices remain: Pending ranks between Monitor and Danger; Near graduation uses 75% until configured otherwise; required pre-price row fields remain masked as unavailable; market cap uses observed total supply until circulating supply is indexed; unknown-address Fast Scan queuing and sub-minute candles await later contracts. Simulation and wallet labels remain explicitly unavailable. The earlier report's curve-progress deferral is resolved by this change. No screenshots or live/browser verification are claimed.
