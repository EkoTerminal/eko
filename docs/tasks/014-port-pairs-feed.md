# Task 014 · Port New pairs and Feed from the approved prototype

Read `AGENTS.md` first. Like task 008 (Radar), this is a **port**: the approved prototype is the visual and
behavioural source of truth; the spec says where the data comes from. Match the prototype 1:1 at 1512×982, 1440×900,
1280×800 and 390×844. Radar (task 008) is merged: reuse its parts rather than copying them.

## Sources (read only)

- Prototype: `../app/src/pages/terminal/Pairs.jsx`, `Feed.jsx`, `secondary.css`, `terminal.css`,
  `src/data/coins.js` and `src/data/terminal-extra.js` (sample pairs and feed items), `src/lib/heat.js`,
  `src/components/common/index.jsx`, `src/components/chart/*` (`MiniBars`, `Spark`), `src/styles/themes.css` (Desk).
  Run it with `cd ../app && npm run dev` (port 5190) to look; don't edit it.
- Spec: `docs/eko/03-FRONTEND.md` **§3.4** (New pairs: three columns, `PairRow` fields, `Scanning…`, anti-snipe
  countdown, mobile segmented control, acceptance), **§3.3** (Feed: kinds, ring buffer of 500, "N new" pill while
  paused, tab-hidden resync, acceptance), §3.0 (shared states), §2.1 (list + inspector, expanding square), §7.
  FACTS §7 and 04-BACKEND §23 CA-2, CA-3 (`PairRow`, `FeedItem`, `antiSnipe`, `verdictPending`).
- Already in the app: `pages/terminal/RadarParts.tsx` (`FlowBar`, `HeatLegend`, the coin inspector), `lib/heat.ts`,
  `components/ui` and `components/ui/charts.tsx`, `lib/realtime.ts` + `RealtimeContext`, `lib/api.ts`, the mocks
  (`mocks/demo/radar.ts`, `mocks/head.ts` for the demo block number).

## Do

1. **New pairs** (`/pairs`): the prototype's three columns (*New*, *Near graduation*, *Migrated*), each a virtualized
   list of up to 100 `PairRow`s with symbol (`UntrustedText`), age, verdict or `Scanning…`, curve % bar, flow
   mini-bar with its beta tag, exit cost at $100, and Trade. Pons rows show the live anti-snipe tax ("99% buy tax → 0
   in 4 s") counting down from `antiSnipe.endsInSec` (±1 s). Trade is disabled with "Waiting for the guard's first
   scan." while `verdictPending`; otherwise it opens the same disabled trade drawer as Radar (`TODO(spec): M3
   TradePanel`). Empty column: "Quiet right now." Selecting a row opens the shared coin inspector; "Open the full
   page" uses the expanding square to `/coin/:address`. Phone: a segmented control with counts.
2. **Feed** (`/feed`): kind filters, a virtualized ring buffer of 500 rows (time, kind icon, coin via
   `UntrustedText`, a one-line description built from structured fields only, a label glyph for trades). Paused while
   hovered, focused or scrolled down: new items wait behind an "N new" pill. Tab hidden 30 s → unsubscribe, then
   resync from REST on return. Swarm rows carry the beta tag. Links are internal only.
3. **Data:** `GET /v1/pairs?stage=…` and WS `pairs` (a `stage` change moves the row to the next column; a new pair
   appears within 1 s of its event); `GET /v1/feed?cursor&kinds` and WS `feed`. Parse with the shared schemas.
4. **Mocks:** `mocks/demo/pairs.ts` and `mocks/demo/feed.ts` port the prototype's sample data into valid `PairRow` /
   `FeedItem` objects (deterministic, demo block numbers from `mocks/head.ts`); the mock socket emits a new pair and a
   stage change every few seconds and feed items every ~2 s while subscribed, and stops on unsubscribe. Keep the
   Radar and Mission mock behaviour intact.
5. **Tests:** column assignment and stage moves; `Scanning…` never enables Trade; countdown math; ring buffer cap and
   the "N new" pill; tab-hidden resync; mock rows validate against the schemas. Add Playwright specs next to
   `e2e/radar.spec.ts` (`playwright.pairs-feed.config.ts` or extend the existing config) for both pages at the four
   sizes, the phone tab bar clearance, and no layout shift while the feed is paused. You can't run Playwright in your
   sandbox; the lead runs it.

## Don't

- Don't build the coin page (`/coin/:address`) or the trade panel. Don't edit `docs/eko/` or the prototype. No new
  dependencies. Don't restyle Radar or Mission Control.

## Report

Files, what you couldn't match and why, `TODO(spec)` list, typecheck/test/brand:check results. The lead compares your
screens with the prototype in a browser.
