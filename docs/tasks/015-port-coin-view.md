# Task 015 · Port the coin view (`/coin/:address`): phosphor chart, flow markers, coin card

Read `AGENTS.md` first. A **port** like tasks 008/009/014: the approved prototype is the visual and behavioural source
of truth, the spec says where the data comes from. Match the prototype 1:1 at 1512×982, 1440×900, 1280×800, 390×844.

## Sources (read only)

- Prototype: `../app/src/pages/terminal/Coin.jsx`, `terminal.css`,
  `src/components/chart/CandleChart.jsx` (the phosphor candles **and the approved interaction**: wheel/pinch zoom
  around the pointer, drag to pan, drag or scroll the price scale to stretch it, double-click to fit, `+`/`−`/`0`
  keys, the −/+/Reset group under the chart, candles at ~70% of their slot, markers outside the view hidden),
  `src/components/chart/AreaChart.jsx`, `src/lib/phosphor.js`, `src/components/common/index.jsx` (`FlowLegend`,
  `Glyph`, `Decode`, `Roll`, `Odometer`), `src/data/coins.js`. Run it with `npm run dev` in `RH Agents/app` (port
  5190) to look; don't edit it.
- Spec: `docs/eko/03-FRONTEND.md` **§3.5** (layout, chart interaction, candles + live bars, Price/MCap axis, verdict
  pill, **FlowLayer** sync and clustering, hover/focus card, the ten coin-card sections, states, acceptance), §3.6
  (the trade panel slot only), §1.2 (`ChartCore`/`ChartStage` are **Adapt**: keep their interaction and `onRedraw`,
  drop the analyst logic), §7 (design), §8 (copy). 04-BACKEND §7.7 (the Signal: five readings, "how we got this"),
  §23 CA-4 (candles), CA-31 (`signal`), FACTS §7 (`CoinCard`, `ChartMarker`, `Bar`, `Tick`).
- Already in the app: `lib/phosphor.ts` (`paintArea`, `paintBars`, `sweep`), `components/ui/charts.tsx`,
  `components/chart/chartCore.ts` + `ChartStage.tsx` (SignalOS, analyst parts already removed), the Radar coin
  inspector (`pages/terminal/RadarParts.tsx`), `lib/heat.ts`, `mocks/demo/radar.ts` (sample `CoinCard`s),
  `mocks/head.ts`, `components/ui` (`UntrustedText`, `VerdictChip`, `Tabs`, `Collapsible`, `Info`).

## Do

1. **Chart.** Restyle `ChartCore` to paint the prototype's phosphor candles and volume (port the drawing from
   `CandleChart.jsx` / `phosphor.js` into `lib/phosphor.ts`), keeping `ChartCore`'s coordinate functions
   (`xForTime`, `yForPrice`) and `onRedraw`. Implement exactly the §3.5 interaction list above, with the keyboard keys
   only while the chart has focus, and `aria-label`s on the −/+/Reset buttons. Timeframes `1s|15s|1m|5m|15m|1h|4h|1d`
   (`1`–`8` keys). Price / Market cap axis toggle. The verdict pill top-left (`DANGER · Honeypot`) opens the evidence.
2. **Data.** `GET /v1/coins/:address/candles?tf&from&to`; live bars from `coin:{address}` `tick` events aggregated
   with `bucketStart(ts, tf)` and reconciled from REST on resync; `GET /v1/coins/:address` (card) and
   `GET /v1/coins/:address/verdict` (rendered first); markers from `GET /v1/coins/:address/markers?from&to` + WS
   `flow:{address}`.
3. **FlowLayer** (`components/chart/FlowLayer.tsx`, the structure in §3.5): one `<button>` per marker anchored with
   `anchorTime`, buys below the low and sells above the high, glyph by label (humans hidden by default, a toggle shows
   them), three sizes by `sizeUsd`, greedy 15×20 px clustering with `×N`, rAF transform writes on `onRedraw` (no React
   re-render while panning), hover/focus card with the accessible name pattern from §3.5. Burn-wallet buys on our own
   token get the flame ("Daily burn" / "Launch burn") when the data says so.
4. **Page.** The prototype's head (symbol with `Decode`, heat tag, name, address, launchpad, stage, price with `Roll`,
   1h/24h, Watch / Deep Research (only with `deep_research`) / Share), the chart, tabs **Overview · Signal · Flow ·
   Trades**, the footer "As of block N · …" with DYOR. Overview carries the §3.5 card sections the prototype shows
   (verdict + playbooks + evidence, tradeability, supply, owner powers, receipt) plus the ones it doesn't (liquidity,
   identity, flow windows, swarm only when `verdict.beta`). Signal tab: the readings table, weights and the "how we got
   this" receipt; the column is **"Reading"**, never "Agent", and the panel is titled **"Signal · five readings"**;
   hide the tab when `signal` is absent. Right column: the trade panel slot (the same disabled "Trading opens with the
   guarded panel" state as Radar, `TODO(spec): M3 TradePanel`) and "Your agents". Phone: chart at 45 vh, tabs
   **Card · Flow · Trades**, the trade box docked as a sheet.
5. **States** (§3.5): unknown address → "Not indexed yet" with Scan; stale (`freshness.ageSec` > 30 s or socket
   closed) → the trade slot says "Data is stale — trading paused."; delayed tier badges.
6. **Mocks.** `mocks/demo/coin.ts`: deterministic candles for every timeframe, ticks every ~2 s on `coin:{address}`,
   markers (all four labels, all three sizes, enough to cluster) for the Radar sample coins, plus one unknown address.
7. **Tests.** `bucketStart`/`anchorTime`; clustering; marker accessible names; zoom/pan math (zoom keeps the point under
   the pointer fixed; candle width ~70% of slot at every zoom); price-scale stretch; the Signal tab copy (no "agent"
   in it). Playwright spec `e2e/coin.spec.ts` (+ config like `playwright.pairs-feed.config.ts`, port 5199): the four
   sizes; markers stay pixel-locked to their candle through pan and zoom (compare marker x to `xForTime` at 3 zooms);
   wheel over the price scale stretches it; keyboard reaches every marker; no horizontal page scroll; phone sheet
   keeps Buy/Sell visible. You can't run Playwright in your sandbox; the lead runs it.

## Don't

- Don't build the trade panel itself (M3), Deep Research pages, or Ask the Swarm. Don't edit `docs/eko/` or the
  prototype. No new dependencies. Don't restyle Radar, Pairs, Feed or Mission Control.

## Report

Files, what you couldn't match and why, `TODO(spec)` list, typecheck/test/brand:check results.
