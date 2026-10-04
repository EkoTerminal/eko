# Task 008 · Port the Radar screen from the approved prototype

Read `AGENTS.md` first. This is a **port**: the approved prototype is the visual and behavioural source of truth; the
spec says where the data comes from. Match the prototype 1:1 at 1512×982, 1440×900, 1280×800 and 390×844.

## Sources (read only)

- Prototype: `../app/src/pages/terminal/Radar.jsx`, `terminal.css`, `src/lib/heat.js`
  (`heatOf`, `marking`, `markClass` — the dither tiers), `src/lib/dither.js`, `src/components/common/index.jsx`
  (`HeatLegend`, `Decode`, `Roll`, `Inspector`, `useSelection`, `onListKeys`), `src/styles/themes.css` (Desk rules).
  Run it with `cd ../app && npm run dev` (port 5190) if you need to see it; don't edit it.
- Spec: `docs/eko/03-FRONTEND.md` §3.2 (Radar: the Hot strip, table columns and sorting, row marking and the dither
  tiers, density, inspector, states, acceptance), §2.1 (list + inspector pattern, expanding square), §7 (design);
  FACTS §7 + 04-BACKEND §23 CA-3 and **CA-31** (`RadarRow.signal`, `spark8h`, `change24hPct`, flow split — optional:
  hide each element when its field is absent).
- Already in the app: Desk tokens and `components/ui` (VerdictChip, UntrustedText, HeatTag, Info, Collapsible, Seg,
  Tabs, Button), `components/ui/charts.tsx` (`Spark`, `MiniBars`), `lib/phosphor.ts`, `lib/dither.ts`, the shell
  with its inspector, `lib/api.ts` (`fetchParsed`), `lib/realtime.ts`, mocks.

## Do

1. **Data**: `GET /v1/radar` → `{rows, cursor, delayedSec}` parsed with `RadarRowSchema`; WS `radar` updates flash the
   changed row once (no remount). Inspector detail from `GET /v1/coins/:address` (`CoinCard`).
2. **Mocks**: `apps/web/src/mocks/demo/radar.ts` — port the prototype's 30 sample coins (`app/src/data/coins.js`)
   into valid `RadarRow`/`CoinCard` objects (deterministic; include CA-31 `signal`, `spark8h`, declared/likely split),
   and route `/v1/radar` and `/v1/coins/:address` to them in the mock transport. Keep the Ghost Report ($EKOX) case.
3. **Marking**: port `heatOf`/`marking` to `apps/web/src/lib/heat.ts` (typed, tested) using RadarRow fields; when
   `signal` is absent, apply only the parts of each tier that don't need it and leave `TODO(spec)`.
4. **Screen**: page head (title, purpose line, three figures with `MiniBars`), Ghost Report strip with the ember mark,
   "01 / HOT RIGHT NOW" tiles (dither glow, score out of 100), "02 / ALL COINS" table (columns, sortable headers with
   `aria-sort`, five-reading bars in Signal, `Spark` in Last 8h, flow bar, exit cost), filters (Show, Stage, Sort),
   heat legend with its `Info`, Comfortable/Compact density (remembered), live indicator, container-query column
   dropping, the tiered dither marks on rows (blue shimmer / dark-red ember, 3 tiers, tier 3 turbulent; reduced
   motion holds still).
5. **Inspector**: the prototype's coin inspector (price, 8h chart, Watch for + Evidence, exit costs, five-agent
   signal bars, who's buying + legend). **Trade**: keep the button and drawer slot but the guarded trade panel is
   milestone M3 — render the prototype's panel layout in a disabled "Trading opens with the guarded panel" state and
   leave `TODO(spec): M3 TradePanel`. "Open the full page" uses the expanding square to `/coin/:address`.
6. **Behaviour**: keyboard list navigation (arrows, Home, End), Esc closes and returns focus, selection remembered on
   wide screens only (≥ 1480px column, slide-over below with a dimmed backdrop), symbols via `UntrustedText`.
7. **Tests**: heat/marking tiers; row sorting; column dropping by width; mock rows validate against `RadarRowSchema`;
   inspector open/close and focus return.

## Don't

- Don't build Pairs, Feed or the coin page (other tasks). Don't edit `docs/eko/` or the prototype. No new deps.

## Report

Files, what you couldn't match and why, `TODO(spec)` list, typecheck/test/brand:check results. The lead will compare
your screen with the prototype in a browser.
