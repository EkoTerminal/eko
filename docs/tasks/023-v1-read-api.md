# Task 023 · `/v1` read routes and live channels from the real tables; the web leaves its mocks

Read `AGENTS.md` first (rule 9 included). The indexer (017/021) fills the chain tables and the engines (022) write
verdicts and coin cards. This task serves them to the screens. Spec: `docs/eko/04-BACKEND.md` **§15.1–15.3**
(conventions, services, WebSocket), §21.1 (bus topics: `NOTIFY eko_<topic>` with ids only; consumers read rows), §3.2
(table ownership: the API only reads chain and engine tables), §6.5 (cards), §7.4 (verdicts), FACTS §7 and the API
table (`GET /radar?mode&lens&cursor`, `GET /pairs?stage`, `GET /coins/:address`, `/verdict`, `/candles?tf&from&to`,
`/markers?from&to`, `/flow?window`), §23 CA-1 (WS map), CA-3 (list envelope), CA-31, CA-32, CA-34, and **CA-35 (new)**.
`docs/eko/03-FRONTEND.md` §3.2 (Radar), §3.3 (Feed), §3.4 (Pairs), §3.5 (coin view) and the `VerdictChip` row.

The web already talks to `/v1` through `apps/web/src/lib/api.ts` and only uses `mocks/transport.ts` when
`VITE_MOCKS=1`. Mirror the routes and shapes the mocks serve, parsed by the shared zod schemas, so the screens work
unchanged against the real server.

## Honesty first (CA-34, CA-35)

Simulation, exit costs, owner-power analysis and wallet labels (agent/crew/human flow) don't exist yet. Cards carry
placeholder zeros for them with `meta.<section>.unavailable`. **The API must never present a placeholder as a
measurement:**
- Rows (`RadarRow`, `PairRow`, scan candidates) set `unavailable` (CA-35) for every field without real data: today
  `exitCost` and `flow` always, `liquidity` when the card's liquidity section is unavailable, `signal` when absent,
  `change` when there's no prior price, `marketCap` when supply is unknown.
- `verdictPending` is true only while a coin has no verdict row yet. A coin with a verdict at level `pending` is not
  "Scanning…".
- Lists with a whole-list gap (for example `markers`, which need labels) return `{ rows: [], cursor: null,
  unavailable: ['labels'] }`, not invented markers.

## Do

1. **Read services** in `apps/server` over `@eko/db` (Postgres when `DATABASE_URL` is set, PGlite otherwise), one
   service per area as §15.2. Read-only on chain and engine tables. Use `@eko/db`'s existing helpers (`market.ts`
   candles and holders) instead of new SQL where they fit.
   - `GET /v1/radar?cursor` → `RadarRow[]` from `coin_card_latest` + `tokens` + swaps/bars: price, 1 h and 24 h change,
     `spark8h` (≤ 48 points from `bars_1m`), liquidity, market cap (CA-31), verdict and top playbook, signal, age.
     Rank as §15.2: verdict tier, then the available §15.2 keys (skip unavailable ones), then 1 h USD volume, then
     address for a stable order. Tier order: clear, monitor, pending, danger (`TODO(spec)` for pending's place).
     Coins idle 7 days drop out. Cursor pagination, 100 per page.
   - `GET /v1/pairs?stage=new|near_grad|migrated` → `PairRow[]` (100 per column): `new` = on the Pons curve below the
     near-graduation line, `near_grad` = curve progress ≥ 75% (`TODO(spec)`: the owner tunes it), `migrated` =
     graduated, newest first. `buyers` = distinct buyers; `antiSnipe` from the card when known.
   - `GET /v1/feed?kinds&cursor` → `FeedItem[]` newest first, from rows that exist today: `new_pair` (tokens/pools),
     `verdict` (`verdict_events` created; `firstVerdictMs` from the first block to the first verdict), `playbook`
     (`playbook_matches` at ≥ Monitor, with `matchPct`), `wash` (the wash playbook), `graduation` (the marker).
     `agent_trade`, `crew_trade`, `swarm`, `clone` and `burn` wait for later tasks; leave them out, never fake them.
     Names and symbols through `toUntrusted`.
   - `GET /v1/coins/:address` → the latest `CoinCard`; `404 not_found` for an address that isn't indexed.
     `/verdict` → the current verdict with `evaluatedPlaybooks`; `/candles?tf&from&to` → `Bar[]` from `bars_1m`
     rolled up per `tf` (1m, 5m, 15m, 1h, 4h, 1d; `TODO(spec)` for 1s/15s); `/markers` → empty with
     `unavailable: ['labels']`; `/flow?window` → the card's flow section with its `meta` (unavailable today).
   - `GET /v1/scan?q=` for an address, `$TICKER` or name among indexed tokens: one match → `ready` with the card,
     several → `ambiguous` with candidates, an unindexed address → `not_found` (`TODO(spec)`: the Fast Scan queue).
   - `delayedSec: 0` everywhere (everyone is real time before D0+1). Errors and envelopes per §15.1 and CA-3.
     Rate limits as §15.1 (the existing 600/min per session or IP; scan 30/min).
2. **Live channels** (§15.3, CA-1): `radar`, `pairs`, `feed` and `coin:<address>` on the existing hub
   (`apps/server/src/ws/hub.ts`), typed by `WsEventMap`. A bus consumer listens to `card_updated`, `verdict_created`,
   `pair_created` and `swap` (Postgres `LISTEN` in production; the in-process bus for PGlite and tests), reads the rows
   by id and publishes `row_upsert` / `rerank` / `pair_upsert` / `item` / `card` / `verdict` / `tick`. Coalesce bursts
   (at most one rerank per second, one tick per coin per second). Keep the hub's backpressure and `resync`.
3. **One process for local PGlite.** PGlite allows a single process per directory. Add a dev role that runs the
   indexer head follower, the engines worker and the API in one process over one PGlite (`APP_ROLE=dev`, documented
   as local only), and make each process refuse to open a PGlite directory already held by another (a lock file with
   the PID; stale locks from dead PIDs are cleared). Production uses Postgres with one role per process.
4. **Web:** the two neutral states from the `VerdictChip` row (CA-35): "Scanning…" only while `verdictPending`, and
   **Not fully checked** for the `pending` level, with a tooltip naming the missing checks (from
   `evaluatedPlaybooks` and the card's `meta`). Any field in a row's `unavailable` renders "not checked yet" in the
   cell, and its column header doesn't sort by it. The coin view's sections with `meta.unavailable` say so instead of
   showing zeros (exit costs, flow, owner powers). All copy goes in `copy/`. Trade stays disabled only while
   `verdictPending`. When a coin is `pending`, the trade panel shows the not-fully-checked line next to the order.
5. **Tests:** route tests on PGlite with rows produced by the real engine code from the indexer fixtures plus
   synthetic cases: every route parses with its shared schema; unavailable fields are listed and never 0-as-data; rank
   order; pagination; `verdictPending` vs `pending`; WS events arrive in order with `seq` and coalesce; the PGlite lock.
   Web: unit tests for the chip states and the "not checked yet" cells; a Playwright run of Radar, Pairs, Feed and a
   coin page against the real server over a seeded PGlite (not mocks), at 1440 and 390, with no console errors.

## Don't

- No writes from the API to chain or engine tables. No simulation, labels, MCP or Fast Scan queue (later tasks). Don't
  edit `docs/eko/`. No new dependencies. Rule 9. Don't remove the mocks (`VITE_MOCKS=1` stays for offline work).

## Report

Files, routes and channels with their sources, what each row marks `unavailable` today, `TODO(spec)` list,
typecheck/test/brand:check/check:addresses results, and the commands for the lead to run the dev role against a
local PGlite filled by the indexer and engines, and the web against it.
