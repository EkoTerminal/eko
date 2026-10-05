---
title: Frontend
subtitle: The complete client build spec for EKO's web app, built by extending the SignalOS React 19 + Vite codebase. The app has two workspaces, the trench terminal and Mission Control. This spec covers what we keep and remove from SignalOS, every route with its ship stage, and screen-by-screen specs with data, states and acceptance criteria. It also covers the guarded trade, approval, kill and trial flows, realtime, wallet and SIWE handling, the design system, disclaimer placement, client security, feature flags for the Drops, analytics, performance and PWA, testing, and the build order to T (~Oct 13), D0 (~Oct 20) and the weekly Drops.
suite: 3 of 5 · Frontend
version: v2.1
date: 2026-09-30
target: Robinhood Chain (4663)
---

> **v2.1 (2026-09-30): renamed to EKO.** Ticker `$EKO`. Tiers are Listener / Reader / Oracle / Source; verdicts are Clear / Monitor / Danger; scam call-outs are Ghost Reports; product credits are EKO Points; the look follows the EKO site (noise into signal, echo rings, teal-navy and pale cyan). Also aligned: the Claude connector path (Customize → Connectors), the daily burn time (20:00 UTC, proposed), the bug bounty (live from T) and the burn wallet (hardware #6 or a 2-of-3 Safe).

> **v2, 2026-09-30: owner decisions applied (FACTS v2 wins on any conflict).**
> - **Burns at launch are manual and daily** from a public burn wallet. The Burn Board runs in manual mode (§3.10). The automated Burn Engine is a Drop 7 target, gated on review, behind the `burn_engine` flag (§3.10.1).
> - **Fees:** the token's fee is 2% total (Pons 1% + a fixed 1% creator tax). From D0, the terminal fee on Uniswap-routed trades goes to the burn wallet. Pons-curve trades carry no terminal fee at launch.
> - **Claude Desktop and claude.ai are targeted for T** through Anthropic's official custom connectors (§3.17). The fallback is D0.
> - **The team is anonymous,** so there's no team page or team section. SignalOS is merged fully and its brand is retired. It's named here only as code heritage, and never in public copy.

## 1. Stack and repo

### 1.1 Conventions

- **Name.** The product and token are **EKO** (ticker `$EKO`). In code, every user-facing mention still comes from `APP_NAME = 'EKO'` and `TICKER = 'EKO'` in `src/copy/brand.ts`, never hard-coded. The brand look comes from the EKO site (§7). Unset values keep their placeholders:
  - `{{DOMAIN}}`, `{{MAIN_HANDLE}}`, `{{BOT_HANDLE}}`
  - `{{TIER_AMOUNTS}}`: ≈ $50 / $250 / $1,000 of the token, set at D0+1 and only ever lowered
  - `{{BUYBACK_SLICE}}`: tentatively 25%, locked at creation
- **Stages:**
  - **T:** product launch, ~Oct 13, no token.
  - **D0:** token day, ~Oct 20, gate-based.
  - **D0+1:** tiers switch on.
  - **Drop N:** one per week after D0, from Drop 1 (~Oct 27) to Drop 9 (~Dec 22–29).
- **Contracts.** Types and endpoints are the shared contract (FACTS §7), with its source of truth in `packages/shared`. Anything else this spec needs is tagged **[CA-n]** and listed in §15. The frontend builds against those shapes behind mocks until the backend confirms them.
- **SignalOS paths** are relative to the SignalOS repo root (now `eko/`, Backend §2.1), e.g. `apps/web/src/lib/instantFlow.ts`.

### 1.2 Kept, adapted and removed

SignalOS already has most of what a guarded, non-custodial terminal needs: a pixel-locked DOM chart overlay, a one-tap live trade flow with exact approvals and idempotency, SIWE, EIP-6963 wallets, a resilient WebSocket, onboarding, and Playwright suites including a mainnet fork. We extend it; we don't rewrite it.

| SignalOS asset (`apps/web/src/…`) | Decision | Becomes |
|---|---|---|
| React 19.3, Vite 8, TS, zustand 5, TanStack Query 5, zod 4, lightweight-charts 5.2, wagmi 3 / viem 2 | Keep | Same versions; plain CSS with tokens, no CSS framework |
| `lib/router.ts` (`usePath`, `match`, `navigate`) | Adapt | Add `useSearch()`, `<Link>` and a typed route table (§2.3) |
| `lib/api.ts` (`api()`, `ApiError`) | Adapt | `VITE_API_BASE`, `credentials: 'include'`, standard error body [CA-8] |
| `lib/ws.ts` `SignalSocket` (backoff with jitter, ping RTT, clock sync, `onReconnect`) | Adapt | `lib/realtime.ts` channel client (§5) |
| `lib/instantFlow.ts` `runLive` | Adapt | `lib/tradeFlow.ts` `runGuarded` (§4.3) |
| `lib/instant.ts` `useInstantTrade` (double-tap lock, latest-run ownership, settle via the order stream) | Adapt | `lib/useGuardedTrade.ts` |
| `lib/trade.ts`: `siweSignIn`, `ensureChain`, `approveToken` (exact), `signAndSubmit`, `flushPendingReports`, `newIdempotencyKey`, `isUserRejection` | Keep | New SIWE statement and endpoints; calldata allowlist check (§6) |
| `lib/wallet.ts` (viem `robinhood` chain, `injected()` = EIP-6963) | Keep | Mainnet only in prod; WalletConnect from D0, on with the `approvals` flag (§10) |
| `components/chart/chartCore.ts` (`ChartCore`, `RedrawTap`, `xForTime`/`yForPrice`), `ChartStage.tsx` | Adapt | The coin chart; the analyst logic is removed |
| `components/chart/SignalLayer.tsx` (DOM markers, rAF sync, greedy clustering, pointer isolation), `signalMath.ts` | Pattern | `FlowLayer.tsx` robot and crew markers, `markerMath.ts` (§3.5) |
| `components/trade/TradeContext.tsx`, `TradePanel.tsx` (pinned trade box), `outcome.ts` | Adapt | The guarded trade panel |
| `components/onboarding/*` (Tour, Checklist, HelpCenter, `Term`, `useDialog`), `store/onboarding.ts` (OR-merged progress) | Keep | New steps (§3.21) |
| `Command.tsx`, `Shell.tsx` (Toasts), `Header.tsx` `WalletButton`, `icons.tsx`, `hooks.ts` | Adapt | The sidebar shell (§2.1) replaces the header, sub-nav and StatusBar; new icons |
| `pages/Settings.tsx` scaffolding; `pages/QuantLab.tsx` `BacktestResults`/`MetricRow`/`HowItWorks`; `components/lab/EquityChart.tsx` | Adapt | Settings, Rule Lab results, Scoreboard charts |
| `main.tsx` split (marketing chunk without wagmi or the stream) | Keep | Landing, legal pages, embeds |
| `lib/telemetry.ts`, `lib/clock.ts` (`serverNow`), `lib/useMedia.ts` | Keep | Also carries analytics events (§11) |
| `e2e/mockWallet.ts` (EIP-6963 test wallet), `helpers.ts`, `run-fork.sh`, `playwright.config.ts` | Keep | Extended suites (§13) |
| `public/brand/fonts` (Geist, Geist Mono, Bricolage Grotesque; all OFL) | Keep | The type system (§7) |

**Remove before T:**
- **Coinbase feed UI:** `Markets.tsx`, `MarketHeader.tsx`, order books, sparklines, tickers, and the `health.marketData` status.
- **"Analyst calls" framing:**
  - `analyst.ts`, `trade/signals.ts`, `AiSetup.tsx`, `BotAvatar`, the BotShop and BotDetail pages, and chart BUY/SELL tags.
  - `WhyDetail` is reused for verdict evidence; "Ask" returns as Ask the Swarm in Drop 4.
- **Paper trading in the terminal:** the Paper/Live switch, `runPaper`, `/portfolio` and `PositionsPanel`. The paper engine stays server-side for Beat the Swarm and the Arena.
- **Parked** (out of the build; neither has a `FlagName` yet): `Publish.tsx` (community personas) and `ReplayBar` (Drop 2 crew replays).
- **Old brand:** `BrandKit.tsx`, `/brand`, the Anton font and SignalOS copy. AI diagnostics move to an internal admin build.

**New dependencies:** `@tanstack/react-virtual`, `vite-plugin-pwa`, the wagmi `walletConnect` connector (D0, flagged), `d3-force` (Drop 2) and `@axe-core/playwright` (dev). No UI kit, icon library or markdown renderer.

### 1.3 Folder structure

```
apps/web/src/
  main.tsx  App.tsx  routes.ts        # static chunk (landing, legal, embeds) vs app; typed route table
  copy/      brand disclaimers guard guardrails playbooks labels tiers errors robinhood   # ALL user-facing strings
  lib/       api router realtime wallet siwe trade tradeFlow useGuardedTrade flags untrusted share csv telemetry analytics clock
  store/     app.ts (boot, /config, /me, realtime state, toasts)  ui.ts (eko.ui prefs)  onboarding.ts
             terminal.ts (radar, pairs, feed; stream-fed)  mission.ts (agents, approvals count; stream-fed)
  components/common/  UntrustedText Address VerdictChip LabelGlyph FlowBar StaleBadge GateCard Disclaimer BetaTag Countdown Mascot
                      Sidebar Inspector Collapsible DensityToggle
  components/chart/   chartCore ChartStage FlowLayer markerMath
  components/coin/    CoinCard sections/* PlaybookList EvidencePanel
  components/trade/   TradeContext TradePanel GuardResult FeeLines outcome
  components/mission/ AgentRow AgentInspector NeedsYou JournalTimeline PolicyForm ApprovalCard KillDialog McpConfig
  pages/     Radar Feed Pairs Coin ScanResult Bags BagShare Watch Scoreboard Receipt Census Burn Perps Settings Plan Drops
             mission/{Agents,AgentDetail,Approvals,Approve,Connect,Launcher} lab/LoopLab research/Research
             drops/{Afi,Crews,Arena,Desk,Inside,Swarm}
  marketing/ Landing Legal            # no wagmi
  embed/     VerdictWidget ClearBadge AfiEmbed   # tiny, frameable
  sw.ts                               # service worker
```

The shared package is renamed from `@signalos/shared` to `@eko/shared` (internal only).

### 1.4 State management

This follows SignalOS's split.

1. **zustand for session and stream state.**
   - `store/app.ts` mirrors SignalOS's `start()`, `onMessage()` and `onReconnect`.
   - `terminal.ts` and `mission.ts` are patched from realtime handlers with `setState`.
   - Components select narrowly, as in `useApp((s) => s.x)`.
2. **High-frequency chart data bypasses React.** Ticks and markers use listener sets (SignalOS's `onCandle` pattern) and go straight into `ChartCore.update()` and `FlowLayer`.
3. **TanStack Query** (already mounted in `main.tsx`) handles paged REST: journal, scoreboard, approvals history, loops, research, burn events. WebSocket events patch caches (`setQueryData`) or invalidate them.
4. **`store/ui.ts`** holds per-device prefs (localStorage `eko.ui`, with SignalOS's guarded read/write). Cross-device prefs go to `/me/preferences` [CA-10].
5. **The only context is `TradeProvider`,** so the Buy button, the chart pill and card quick-trades share one lock.

### 1.5 Environment variables

All are public build-time values; no secret ships to the client (§9).

| Var | Prod value | Notes |
|---|---|---|
| `VITE_API_BASE` | `https://api.{{DOMAIN}}/v1` | Dev: `/v1` proxied by Vite (`EKO_API`, was `SIGNALOS_API`) |
| `VITE_WS_URL` | `wss://api.{{DOMAIN}}/v1/ws` | |
| `VITE_MCP_URL` | `https://mcp.{{DOMAIN}}/mcp` | Fills `{{MCP_URL}}` only if a `/packs` `configTemplate` still carries it; never used to hand-build a snippet (§3.17) |
| `VITE_APP_ORIGIN` | `https://{{DOMAIN}}` | Share links |
| `VITE_RPC_URL` | keyless read RPC [CA-25] | Replaces `VITE_RH_MAINNET_RPC_URL`; never a keyed URL |
| `VITE_EXPLORER_URL` | `https://robinhoodchain.blockscout.com` | |
| `VITE_WC_PROJECT_ID` | WalletConnect project id | Public by design; used only once WalletConnect is on (with `approvals`, §10) |
| `VITE_ENV` / `VITE_BUILD_SHA` | `prod` / CI commit | Flag overrides only outside prod (§10) |

## 2. Information architecture

### 2.1 Navigation model

- **One site:** the landing is served at `/` and the terminal at every other path. The landing's header gains "Terminal", and its signal desk gains "Open in the terminal" (the desk's token). Both leave with the desk's expanding square.
- **Header** (68 px, full width, like the landing's): the EKO mark (back to the landing), the breadcrumb in mono caps, and the live dot, head block and UTC time.
- **One left sidebar** (236 px, below the header) holds all navigation. It replaces SignalOS's second-row sub-nav and StatusBar. Top to bottom:
  - the scan box ("Search or paste a CA"; `/` focuses it, `⌘K` opens the palette)
  - **Terminal:** Radar · New pairs · Feed · Bags · Watchlist · Perps
  - **Mission Control:** Overview · Approvals (count badge) · Connect an agent · Rule Lab · Research (shown only when `deep_research` is on; opens `/research`, the list of your notes)
  - **Public record:** Scoreboard · Burn Board · Census
  - the footer: the plan card (tier, or the trial countdown with a draining bar), the risk mode (Safe / Balanced / Degen, which replaces SignalOS's Paper/Live switch), the wallet, the Burn ticker slot (D0), links to Drops and Legal, and the non-affiliation line.
- **Wide screens:** the shell is a centred frame up to 1880 px, so on ultrawide monitors the sidebar, content and inspector stay together.
- **Navigation recedes:** items are dimmed, one weight, one size; the current item carries a sliding highlight. The coin view counts as Radar and an agent's page as Overview.
- **List + inspector pattern:** screens that list many things (Radar, Mission Control) open the selected item in an **inspector** on the right (392 px) instead of leaving the page. It has "Open the full page" (a square grows from the inspector to the page, as the landing's desk opens) and Close (`Esc`; focus returns to the row). Arrow keys, Home and End move the selection. At ≥ 1480 px it is a column and opens with the remembered (or first) item; below that a column would squeeze the list, so it slides over a dimmed page and only opens on a tap.
- **Collapsible sections:** "Needs you", "How it works", "Recent activity" and the glossary fold away. The heading holds the toggle (`aria-expanded`), the choice is remembered per section (`eko.open.<id>`), and a folded body is `inert`.
- **Phones (< 900 px):**
  - A bottom tab bar: **Radar · Pairs · Scan · Mission (badge) · More**.
  - "More" holds Feed, Bags, Watchlist, the trust pages, Settings and Legal.
  - A slim top bar holds the logo, plan chip and wallet.
- **Deep links:** every coin, scan, receipt, approval and agent has a stable URL. Share routes render without a wallet.

### 2.2 Route map

Auth: **public** means no wallet needed. **siwe** means a signed-in wallet; without one, the page shows an inline connect card, not a redirect.

| Route | Screen | Stage | Flag | Auth |
|---|---|---|---|---|
| `/` | Landing, "paste any contract address" | T | — | public |
| `/scan` | The same Scan landing. While the host serves the EKO scroll-story site at `/` (its own project), this is where the paste-a-CA landing lives; the story links here | T | — | public |
| `/radar` | Radar (terminal home) | T | — | public |
| `/feed` | Feed | T | — | public |
| `/pairs` | New pairs | T | — | public |
| `/coin/:address` | Coin view | T | — | public; trading siwe |
| `/scan/:id` | Scan result (share target) | T | — | public |
| `/bags`, `/bags/r/:id` | Scan my bags; shared bag report | T | — | siwe; public |
| `/watch` | Watchlist and alerts | T | — | siwe |
| `/scoreboard`, `/receipt/:id` | Scoreboard; receipt verify | T | — | public |
| `/census` | Census (gated state) | T | — (numbers only when `GET /census` returns `gated: false`) | public |
| `/drops` | Public Drop calendar (demoed drops only) | T | — | public |
| `/mission` | Mission Control overview: Needs you, the last 24 hours, agent rows with the inspector | T (harness preview), D0 v1 | — (kill controls: `mission_kill`) | siwe |
| `/mission/agents/:id` | Agent detail: Activity and Connection (T); unchecked orders, Limits, kill (D0) | T / D0 | — (D0 parts: `unchecked_orders`, `policy_editor`, `mission_kill`) | siwe |
| `/mission/connect` | Connect an agent: Claude Code + generic MCP (T); Claude Desktop and claude.ai custom connector (T, with D0 as the fallback if the OAuth check after the MCP deploy fails); ChatGPT, OpenClaw, on-chain, perp venue (D0) | T / D0 | — (D0 parts: `packs_chatgpt_openclaw`, `onchain_guardrails`, `perps_panel`) | siwe |
| `/mission/approvals`, `/approve/:id` | Approvals queue; single approval | D0 | `approvals` | siwe |
| `/lab`, `/lab/:loopId` | Rule Lab | D0 | `loop_lab` | siwe |
| `/research` | Your Deep Research notes (list) | D0 | `deep_research` | siwe |
| `/research/:id` | Deep Research | D0 | `deep_research` | siwe |
| `/perps` | Perps panel | D0 | `perps_panel` | public |
| `/burn` | Burn Board (manual mode: the burn wallet and its daily burns) | D0 | `burn_board` | public |
| `/swarm`, `/embed/clear/:address` | Beat the Swarm; Clear badge | D0 | `beat_the_swarm`, `clear_badge` | public |
| `/settings`, `/settings/plan` | Settings; tier, trial, referral | T (plan active D0+1) | `tiers_active` | mixed |
| `/legal/:doc` | Terms, privacy, risk, AI disclosure, team trading and KOL policies | T | — | public |
| `/afi`, `/embed/afi` | Agent Flow Index | Drop 1 | `afi` | public |
| `/crews`, `/crews/:id`, `/leaderboards` | Rug Ring Radar; leaderboards | Drop 2 | `rug_ring_radar`, `leaderboards` | public |
| `/arena` | The Arena | Drop 3 | `arena` | public |
| `/desk/:runId` | Desk live transcript | Drop 4 | `desk_live` | public |
| `/mission/launcher` | Agent Launcher | Drop 5 | `agent_launcher` | siwe |
| `/inside`, `/embed/verdict/:address` | EKO Inside docs and widget | Drop 7 | `eko_inside` | public |

### 2.3 Route table in code

```ts
// src/routes.ts
export type Stage = 'T' | 'D0' | 'D0+1' | `Drop ${1|2|3|4|5|6|7|8|9}`;
export interface RouteDef {
  path: string; stage: Stage; flag?: FlagName /* the one union, from @eko/shared (§10) */; auth: 'public' | 'siwe';
  workspace: 'terminal' | 'mission' | 'trust' | 'static';
  load: () => Promise<{ default: React.ComponentType<{ params: Record<string, string> }> }>;
}
// App resolves with match() from lib/router.ts. A route whose flag is off renders NotFound with no nav link.
```

## 3. Screen-by-screen specs

### 3.0 Shared components and states

| Component | Rules |
|---|---|
| `VerdictChip` (`Verdict['level']` or `info`) | Icon, word and colour together; sizes sm/md/lg. Two neutral states that are never Clear (CA-35): **Scanning…** while no verdict exists yet (`verdictPending`), and **Not fully checked** for the `pending` level (a verdict exists, but required checks such as the buy-then-sell simulation haven't run); its tooltip names the missing checks. A row field listed in `unavailable` reads "not checked yet", never 0 |
| `UntrustedText` (`Untrusted`) | Text node only, sanitised and clamped; chips for the `agent_bait`, `link` and `impersonation` flags (§9) |
| `LabelGlyph` (`WalletLabel` + confidence) | Solid robot = declared agent; outline robot = likely agent; linked rings = crew; person = human |
| `FlowBar` (`CoinCard['flow']`) | Agent / crew / human stacked bar, a wash hatch, and the percentages as text. Whenever `flow.beta` is set (Watcher label precision is still under 90%), it shows the `BetaTag` and the confidence beside the bar. This applies to every flow display: Radar cards, Pairs mini-bars, the coin card and scan results |
| `StaleBadge` | `Live` · `Delayed ~60 s` (Listener) · `Reconnecting` · `Stale · 34 s` |
| `GateCard`, `Disclaimer`, `BetaTag`, `Address`, `Countdown` | §4.6, §8, the explorer allowlist, and `serverNow()` |

**Standard states** (each screen lists only what differs):
- **Loading:** skeletons shaped like the content (SignalOS `.skel`).
- **Empty:** the mascot, one line, one action.
- **Error:** what failed, whether anything was sent, and Retry.
- **Stale:** a `StaleBadge`, and trading disabled where a trade depends on the data.
- **Gated:** a `GateCard`.
- **Trial:** full access plus the plan-chip countdown.

### 3.1 Landing · `/` · T

- **Purpose:** show value in 10 seconds, with no wallet.
- **Components:**
  - A hero with the scan input ("Paste any contract address or $ticker") and three example chips from `/config`.
  - A proof strip: "honeypots refused" and "honeypots missed," side by side at equal size.
  - A Radar preview (6 delayed cards); the harness pitch ("Add EKO to your Robinhood-connected agent" → `/mission/connect`); a Drops teaser; the tagline "Every move has a cause."; and a footer with every disclaimer.
  - **No team section or team page.** The team is anonymous (FACTS §0). Trust comes from the proof strip, public wallets, the Burn Board (from D0), receipts and open-source links.
- **Data:** `POST /scan {query}` [CA-5]; `GET /radar`; scoreboard counters [CA-15].
- **States:**
  - Pending new pair: "Scanning… usually under 5 s," polling `GET /scan/:id`.
  - Ambiguous ticker: a candidate list (address, age, launchpad).
  - Not found.
  - Invalid input: checked with viem `isAddress`, or `$` plus 1–20 characters.
- **Mobile:** the input stays above the fold at 390 px, and the keyboard's Go submits.
- **Acceptance:**
  1. Paste → verdict in ≤ 3 s p50 for an indexed coin.
  2. No wagmi in this chunk.
  3. The non-affiliation and DYOR lines are visible without scrolling on desktop.

### 3.2 Radar (terminal home) · `/radar` · T

- **Purpose:** every live play in one sortable table, ranked by the guard, with the hottest few pulled out on top. Tables are for many items; cards are only for the three highlights.
- **Components:**
  - The page head: title, one line of purpose, and three figures (scanned today, honeypots refused, Danger now).
  - The Ghost Report strip, when one is live.
  - **Hot right now:** up to three tiles (symbol, `HeatTag` + `VerdictChip`, sparkline, signal, last-hour volume against the usual hour, 1h): Hot coins first, then the most active Clear or Monitor coins with at least 5 trades in the hour. Danger and unscanned coins are never featured. "Unusual trading in the last hour against each coin's usual hour, then the most active. Not a recommendation." Selecting a tile opens it in the inspector.
  - Toolbar: Show (All · Hot · Clear · Monitor · Danger), stage, sort, the heat legend; mode and lens (Drop 1, `lenses`) and launchpad filters join it.
  - The Burn hero slot (D0, when promoted).
  - **The table** (virtualized): Coin (symbol via `UntrustedText`, name and age), Guard (`VerdictChip`), Watch for (top playbook and confidence), Signal, 1h, Last 8h (sparkline), Who's buying (`FlowBar` + agent %), Liquidity, Exit at $1k, and **Trade** (opens the sheet in place). Signal, 1h, Who's buying and Exit headers sort (`aria-sort`). Columns drop by container width, least important first: Liquidity, Trade, Who's buying, Last 8h, Watch for, 1h and Signal; the coin, its verdict and exit cost always stay. A Beta Ape Score column appears only when `beta` is present.
  - **Row marking:** Hot rows get a cool tint and edge plus the Hot tag; Danger rows a warm tint and edge with dimmed figures; Fading rows are dimmer. Danger always wins the tint, and every shade has a word beside it; a Danger row with unusual trading still shows the Hot tag (and appears under Show · Hot).
  - **Hot rule** (owner decision 2026-10-05: general activity, any coin; `apps/web/src/lib/heat.ts`): last-hour USD volume at least 3× the coin's usual hour (its average over up to 23 earlier hours), at least 10 trades and $1,000 in the hour, and the 1h price not falling. A coin with under an hour of earlier trading has no usual hour and needs 25 trades and $5,000 instead. Agent buying, when measured, is a second path (signal 70+, rising, agents ≥ 30% of buying). After two weeks of data, tune the thresholds so Hot marks at most ~10% of rows and red flags at most ~15%.
  - **Dithered marks** (ordered dither, the same Bayer matrix as the chart plates). A blue-white shimmer grows with the move, a low dark-red ember with the risk. Intensity is dot density, and every tier is also stated in words (tags, verdicts, the legend):
    - Shimmer 1 · warming: up 3%+ in 1h, agents 25%+ of buying, signal 60+ (no tag).
    - Shimmer 2 · Hot: the Hot rule above.
    - Shimmer 3 · surging: Hot, and up 10%+ in 1h with last-hour volume 6× the usual hour or agents 40%+.
    - Ember 1 · falling: down 8%+ in 1h with a signal under 65.
    - Ember 2 · Danger: the guard's verdict.
    - Ember 3 · red flag: Danger, and a honeypot, 75%+ exit cost at $1k, or a playbook match at 97%+.
    - Motion: tiers 1–2 step slowly through three frames; tier 3 runs eight turbulent frames at 8–10 fps. Reduced motion holds the first frame. The same marks appear on the Hot cards, New pairs cards, the Ghost Report and the coin inspector's Danger box.
  - **Small charts:** page-head figures carry 24-hour phosphor bar charts (scans in blue; refusals and Danger in warm), and the Signal column shows the five readings as tiny dithered bars.
  - **Density:** Comfortable (58 px rows, two-line coin cell) or Compact (40 px, one line), saved in `eko.ui`.
  - **Coin inspector:** symbol, verdict and heat, name, launchpad, age and CA; price with 1h and 24h; an 8-hour chart; "Watch for" with the playbook's history and an Evidence link; exit cost at $100 and $1k, liquidity and market cap; the Signal (five readings, §7.7 of the backend); who's buying; and the full guarded `TradePanel`.
- **Data:** `GET /radar?mode&lens&cursor` [CA-3]; WS `radar`.
- **States:**
  - Delayed: when `limits.realtime === false`, show `Delayed ~60 s`.
  - Stale: after 90 s with no event (150 s when delayed), the live dot turns amber.
  - Empty filter: "Nothing matches this filter right now."
- **Interactions:**
  - A live update flashes its row once (at most once per 2 s per row); rank changes animate (FLIP, 200 ms). A row under the pointer stays pinned.
  - The mode persists to `/me/preferences`.
- **Mobile:** the Hot tiles stack; the table keeps Coin, Guard and Exit; the inspector opens as a full-width sheet on tap. Pull to refresh.
- **Acceptance:**
  1. 100 rows at 5 events/s with no frame over 16 ms.
  2. Order equals the server's order unless the user picks a sort; the client never re-ranks "Rank".
  3. The Ape Score never shows without the `BetaTag`.
  4. While `flow.beta` is set, no `FlowBar` renders without its `BetaTag` and confidence.
  5. Hot never appears without its word or tag, and never on a Danger coin.

### 3.3 Feed · `/feed` · T

- **Purpose:** a live scroll of agent buys and sells, Fast Scan verdicts, playbook alerts, swarm calls (beta), and clone and wash call-outs.
- **Components:**
  - Kind filters.
  - A virtualized ring buffer (500) of rows: time, kind icon, the coin (`UntrustedText`), a one-line description built from structured fields only, and a label glyph for trades.
- **Data:** `GET /feed?cursor&kinds` + WS `feed` [CA-2].
- **States:**
  - Paused (hover, focus, or scrolled down): new items wait behind an "N new" pill.
  - Tab hidden 30 s: unsubscribe, then resync from REST on return.
- **Acceptance:**
  1. No layout shift while reading (CLS asserted).
  2. Swarm rows carry the `BetaTag`.
  3. Links are internal only.

### 3.4 New pairs · `/pairs` · T

- **Purpose:** three columns, *New*, *Near graduation* and *Migrated*; every row has its verdict and a Trade button.
- **Components:** a virtualized column of `PairRow`s (100 each): symbol, age, verdict or `Scanning…` (while `verdictPending`), curve % bar, flow mini-bar (`flow`, with its beta tag), exit cost at $100, Trade. Pons launches show the live anti-sniper tax from `antiSnipe`: "99% buy tax → 0 in 4 s".
- **Data:** `GET /pairs?stage=new|near_grad|migrated` [CA-3]; WS `pairs` (a `stage` change moves the row to the next column).
- **States:** `Scanning…` disables Trade with "Waiting for the guard's first scan." An empty column shows "Quiet right now."
- **Mobile:** a segmented control with counts.
- **Acceptance:**
  1. A new pair shows ≤ 1 s after its WS event.
  2. Trade is never enabled while `verdictPending`.
  3. The anti-snipe countdown is within ±1 s of `endsInSec`.

### 3.5 Coin view · `/coin/:address` · T

- **Purpose:** one coin: the chart with robot and crew markers, the coin card, and the guarded trade panel.
- **Layout:**
  - **Desktop:** chart and flow tabs in the centre; the card above the pinned trade box on the right. This is SignalOS's `ws-center`/`ws-right` layout without the Markets column.
  - **Mobile:** the chart (45 vh), tabs **Card · Flow · Trades**, and the trade box docked as a sheet (SignalOS `ws-sheet`; Buy and Sell never scroll away).
- **Chart interaction:** scroll or pinch to zoom around the pointer; drag to pan; drag or scroll the price scale (Price or MCap) to stretch it; double-click to fit; + and − and 0 on the keyboard. Candles fill ~70% of their slot at every zoom level. A small − / + / Reset group sits under the chart, and markers outside the view are hidden, not stacked at the edge.

**Chart:**
- **Candles:** `GET /coins/:address/candles?tf&from&to`, with `tf` ∈ `1s|15s|1m|5m|15m|1h|4h|1d` [CA-4].
- **Live bars:** `coin:{address}` `tick` events, aggregated client-side with `bucketStart(ts, tf)` and reconciled from REST on resync.
- **Axis:** a Price / Market cap toggle.
- **Verdict pill:** pinned top-left (`DANGER · Honeypot`); it opens the evidence panel.

**FlowLayer** (the SignalLayer pattern):
- **Data:** `ChartMarker[]` from `GET /coins/:address/markers?from&to` plus WS `flow:{address}`.
- **Markers:** a `<button>` per marker, anchored with `anchorTime(ts, tf)`. Buys sit below the bar low, sells above the high. The glyph is by `label` (humans hidden by default), in three sizes by `sizeUsd` (< $100, < $1k, ≥ $1k). On our own token's chart, buys from the burn wallet (`BurnStats.burnWallet.address`, or `config.wallets.burn` [CA-9]) get a flame labelled "Daily burn." The launch buy-and-burn (the `BurnEvent` with `kind: 'launch'` [CA-17]) gets a flame labelled "Launch burn."
- **Sync, as in SignalOS:**
  - `ChartCore.onRedraw` schedules one rAF that writes `transform` directly, so pan and zoom never re-render React.
  - Greedy clustering (15 × 20 px) by declared > crew > likely > human, then size, then recency, with a `×N` badge.
  - Pointer and wheel events stop at the overlay.
- **Hover/focus card:** label, confidence, size, time, wallet, crew (links to `/crews/:id` from Drop 2), and **Follow wallet** (`POST /watch`). The accessible name reads e.g. "Declared agent buy, $1,240, 12:03:41, wallet 0xab…cd."

```tsx
// components/chart/FlowLayer.tsx (structure; positioning lifted from SignalLayer.tsx)
export const FlowLayer = memo(function FlowLayer(p: { core: ChartCore; markers: ChartMarker[];
  show: Record<WalletLabel, boolean>; burnWallet?: Address; launchBurnTx?: Hex; onSelect(m: ChartMarker): void }) {
  const els = useRef(new Map<string, HTMLButtonElement>());
  const sync = useCallback(() => { /* xForTime(anchorTime) → translate3d; cluster; hide off-pane */ }, [p.core, p.markers]);
  useLayoutEffect(() => p.core.onRedraw(sync), [p.core, sync]);
  return <div className="flow-layer" aria-label="Agent and crew trades on chart">{/* one button per marker */}</div>;
});
```

**Coin card** (`GET /coins/:address`; `GET /coins/:address/verdict` renders first because it's faster):
1. **Verdict:** reasons, `PlaybookList` (level, confidence, and history such as "this deployer ran stuck-at-bonding 9 times"), and an Evidence expander (the adapted `WhyDetail`).
2. **Tradeability:** exit cost at $100/$1k/$10k, taxes, honeypot, limits, hook fee, the anti-snipe countdown. A fixed, non-raisable tax of 5% or less shows as Info. For our own token it reads "Fixed 1% creator tax (immutable)", beside the Pons 1% standard fee.
3. **Liquidity:** depth ±2/5/10%, LP status, fee tiers. A 15–95% fee tier is flagged as a fee-trap pool.
4. **Supply:** top 10, dev, bundles held, exemption wallets, fresh wallets, burned, circulating. A dev buy that was burned right away shows as "dev buy → burned" (for example, our own $100 launch buy-and-burn).
5. **Control:** each owner power as yes/no.
6. **Flow:** 5m/1h/24h via `GET /coins/:address/flow?window`, and the wash estimate. The beta tag and confidence show while `flow.beta` is set.
7. **Identity:** name and symbol (`UntrustedText`), deployer with a history link, launchpad, stage, quote asset, pools, and the clone notice linking to the original.
8. **Swarm (Beta):** rendered only when `verdict.beta` exists.
9. **Receipt:** hash, block, and **Verify**.
10. **Footer:** "as of block N · 3 s ago" plus DYOR.

Also on the screen: Deep Research (D0), Watch, Share, a perps link-out (majors), and Ask the Swarm (Drop 4).

- **States:**
  - Unknown address: "Not indexed yet," with Scan.
  - Stale (`freshness.ageSec` > 30 s, or the socket closed): the trade box shows "Data is stale — trading paused."
  - Delayed tier: the chart and card are badged; trading still quotes live.
- **Acceptance:**
  1. Markers stay pixel-locked through pan, zoom and autoscale (screenshot diff at 3 zooms).
  2. 2,000 markers pan at ≥ 50 fps.
  3. Every marker is keyboard-reachable.
  4. Verdict ≤ 800 ms p50; card ≤ 2 s p50.

### 3.5a Your signals: Manual and Auto · coin view · D0 (owner request, Oct 1; in the prototype)

- **Purpose:** trade a coin from the chart using **your own** signals: buy and sell triggers from one of your Rule Lab
  rules or your connected agent. EKO never makes buy or sell calls (the SignalOS analyst tags stay removed, §1.2).
- **Strip above the chart:** "Your signals", a source picker (your rules, then your connected agents), the rule's
  one-line description, an `Info` ("Signals come from your own rules or your connected agent, never from EKO. Every order
  a signal places goes through the guard; Danger is refused whatever the rule says."), and a **Manual | Auto** switch.
- **On the chart:** each signal is a ring on the price at its bar, a dashed guide down, and a `B`/`S` tag on a rail at
  the bottom of the plot. Tags open a card with the time, the rule's reason and what happened. A "Your signals" toggle
  sits with the flow-label toggles. Signal tags never stack on flow markers (they live on the rail).
- **Manual:** the newest signal (within the last hour) shows an inline action on the chart, "Buy $50 · Skip" (or Sell).
  A quick-trade pill (amount, Buy, Sell) sits top-left in the plot. Both open the guarded trade panel (§3.6) preset to
  the side and amount, with a note naming the signal; nothing is placed without the guard and a wallet signature.
- **Auto:** turning it on opens a confirmation listing the source, the size per signal and the daily limit, the risk
  mode's guard, that orders go through a session key the user approves in their wallet (limited to these amounts; EKO
  never holds funds), and how to stop. Then: an "Auto on" line on the chart, each later signal marked placed (✓),
  blocked by the guard (✕, with the failing check) or "nothing to sell" (Auto only sells what it bought), and a status
  bar with this session's counts and **Stop Auto** (the same soft stop as §3.16 for this rule and coin).
- **Flags:** the strip needs `loop_lab` (rules) or a connected agent; Auto also needs `onchain_guardrails` (the session
  key, §14.5 of the backend). With neither, the strip is absent, not disabled.
- **Copy:** "Auto follows your rule; it isn't advice and can lose money." No win rates or returns for a rule here.
- **Data:** `GET /coins/:address/signals?source&from&to` → `RuleSignal[]` and WS `signals:{address}` [CA-33, proposed];
  Auto's orders are ordinary guarded orders tagged with the rule id, so they appear in the agent journal and receipts.
- **Acceptance:** a Danger coin's Auto buys are all blocked with the playbook named; a sell with no position shows
  "nothing to sell"; Manual never places an order without the guard panel and a signature; tags stay pixel-locked
  through zoom and pan like flow markers.

### 3.6 Guarded trade panel · coin view, Radar, Pairs · T

- **Purpose:** one-tap trading, with the fee, taxes and exit cost visible **before** the tap, and no override for hard refusals.
- **Components:**
  - Buy/Sell toggle.
  - Amount presets. Presets above `config.trading.maxTradeUsd` are disabled with "Max $X per trade during launch." The caps are $25 (team) and $100 (users) in beta, where they come from each wallet's `trading_allowlist` cap. From T the cap is $250 per trade for 72h, then $1,000. The client only displays the cap; the server enforces it.
  - Slippage.
  - `FeeLines`: you pay; terminal fee (`fee.bps`, `fee.usd`, tier, `fee.destination`); taxes; exit cost at this size; route; min received; network fee (`networkFeeUsd`). `fee.destination` is the burn wallet address, or `null` when `fee.bps` is 0 (launch week, and Pons-curve trades). When it's `null`, no destination renders.
  - `GuardResult`, the button, and the result line.
  - Fine print: "Real funds · your wallet signs every trade" plus DYOR.
- **Button colours:** Buy uses the brand blue and Sell a neutral outline. Green never means "go," so a Clear chip beside the button can't read as a recommendation.
- **Data:** `POST /trade/quote {coin, side, amountUsd, slippageBps, riskMode}` [CA-7] on preset selection. It re-quotes every 5 s while visible, and when an anti-snipe tax expires.
- **Terminal fee by route (decided; FACTS §5):**
  - **Uniswap-routed trades, from D0:** 50 bps (40/30/25 by tier from D0+1), paid to the burn wallet. `FeeLines` reads "Terminal fee 0.5% ($0.50) → burn wallet (burned daily)."
  - **Pons-curve trades:** no terminal fee at launch. `fee.bps` is 0 and `fee.destination` is `null`, and `FeeLines` reads "Terminal fee: 0% on Pons-curve trades." A reviewed curve fee route comes in a later Drop, and the client needs no change until then.
  - **Launch week (T → D0):** 0% on every route.

| `guard.decision` | Display | Button |
|---|---|---|
| `allow` | "7 checks passed" (expandable) | "Buy $100" |
| `warn` | An amber panel: each `warn` check with value vs threshold and the mode ("Balanced treats this as a warning") | "Review warnings." After "I understand — continue," it reads "Buy $100" for this quote only |
| `refuse` | A red panel, "The guard refused this trade. Nothing was sent," and each refusing check: honeypot, Danger playbook or no route in every mode, plus mode thresholds in Safe | Disabled. **No override control exists.** |

- **Other states:**
  - Not signed in: an indicative quote (`binding: false`) plus "Connect wallet to trade."
  - Wrong network, stale data, quote expired (auto re-quote), sanctioned (generic copy).
  - **Live trading paused** (`config.trading.liveEnabled === false`, or a `trading_paused` error): the backend's `trading_live` flag is the runtime kill switch and the `LIVE_TRADING_ENABLED` env var is its hard ceiling. The quote, verdict and fee lines still render. The button is replaced by "Live trading is paused. Scans and quotes still work."
  - **Not on the allowlist** (team-first and beta live trading run through `trading_allowlist`, before trading opens to everyone): the quote still renders, and the button is replaced by "Live trading is open to allowlisted wallets during the beta." The error code is in [CA-8]. An allowlisted wallet's own cap (`cap_usd`) comes back as `trade_cap_exceeded`, with the cap in the message.
  - **Quote-only venue:** `route.executable === false` on the quote [CA-7]. This covers Pons coins at T if the Pons ABIs aren't verified by Oct 2, and graduated v4 pools (graduated Pons coins included) until the v4 fork suite is green (FACTS §3, §5b). The panel shows the verdict, `GuardResult` and `FeeLines`, but no Buy or Sell. Instead it reads "Trading for this coin isn't open here yet. Open on {venue} ↗", with the link taken from the `/config` allowlist.
- **Acceptance:**
  1. Buy is enabled only with a quote ≤ 15 s old and its fee lines displayed.
  2. `refuse` never opens the wallet: the E2E asserts zero wallet requests.
  3. A warning ack is per quote; a re-quote clears it.
  4. The fee line shows the quote's `fee.bps`. It's 0 during launch week (T → D0) and on Pons-curve trades (no curve fee at launch). Otherwise, on Uniswap-routed trades, it's 50/40/30/25 by tier, with "→ burn wallet (burned daily)". With `fee.bps` at 0, `fee.destination` is `null` and no destination renders.
  5. The paused, not-allowlisted and quote-only states never open the wallet.

### 3.7 Scan result, Scan my bags and the bag report card · `/scan/:id`, `/bags`, `/bags/r/:id` · T

- **Scan result:**
  - A large verdict, top reasons, playbooks with history, exit costs, the `FlowBar`, and the receipt link.
  - CTAs: **Open coin**, **Scan my bags**, **Share** (copy link, X intent, Telegram).
  - Data: `GET /scan/:id` [CA-5]; OG image `GET /og/scan/:id.png` (§4.8).
- **Scan my bags:**
  - The aha moment: every held coin gets a verdict. It starts the 30-minute trial from D0+1.
  - Components: summary headline ("3 of your 7 coins match scam playbooks"); a verdict breakdown bar; holdings (coin, balance, value, verdict, top playbook, exit cost) with **Sell through the guard**, **Watch** and **Open**; and **Share bag report**.
  - Data: `GET /wallets/:address/bags` (BagReport [CA-6]), own wallet only, after SIWE.
  - States:
    - Not connected: a connect card explaining that only public balances are read.
    - Scanning: rows fill in progressively.
    - Empty wallet.
    - Per-row "Couldn't scan — retry."
  - Mobile: holdings as cards, with a sticky Share button.
- **Bag report share:**
  - `POST /wallets/:address/bags/share` → `/bags/r/:id` with `GET /og/bags/:id.png` [CA-6].
  - By default the wallet address and $ values are omitted. "Include values" is an opt-in toggle.
- **Acceptance:**
  1. The shared page renders with no wallet.
  2. The address is never shown unless the owner opted in.

### 3.8 Scoreboard and receipt verify · `/scoreboard`, `/receipt/:id` · T

- **Scoreboard:**
  - The "honeypots refused" and "honeypots missed" counters head the page at equal size.
  - Tabs:
    - **Calls:** verdicts and beta forecasts with a hit/miss/n.a. grade.
    - **Refused**
    - **Missed:** each with a post-mortem link. When empty it reads "0 missed since {date}"; it's never hidden.
    - **Weekly cohort:** Clear list vs all launches, median outcome and rug rate.
    - **Milestone buys** (D0).
  - Data: `GET /scoreboard?kind&cursor` [CA-15].
- **Receipt verify:**
  - Shows kind, hash, Merkle root, block, and tx (explorer).
  - The revealed payload shows in a text-only JSON tree. `harness_private` shows "Private — only the owner can reveal this."
  - **Verify** runs three client-side steps, each with a ✓ or ✗ and a plain line:
    1. Recompute the leaf hash from the payload, using the API's canonicalization version.
    2. Fold the `proof` to the root.
    3. `readContract` the root committed at `block` on the receipts contract through the keyless RPC.
  - Data: `GET /receipts/:id` plus the proof fields [CA-16].
  - Not yet committed: "Pending · receipts are committed on-chain every 5 minutes." Verify is disabled until the root lands.
- **Acceptance:** a tampered fixture fails at step 1 with a readable message.

### 3.9 Census · `/census` · T (gated until precision ≥ 90%)

- **Data:** `GET /census` → `{ gated, … }` [CA-14].
- **Gated:**
  - Headline: "Census numbers publish once wallet-label precision passes 90%."
  - The methodology and label definitions, and a Watch toggle.
  - No numbers, charts or placeholders shaped like numbers.
- **Ungated:**
  - Chain-wide agent share (24h, 7d) with a trend line; a by-coin table (agent, crew, human %, volume); the confidence tiers.
  - The qualifier "per our research, the first agent-flow metric published for Robinhood Chain."
- **Acceptance:** with `gated: true` the DOM contains no census numbers.

### 3.10 Burn Board · ticker, hero card, `/burn` · D0 (manual mode)

At launch, burns are **manual and daily** (FACTS §5):
- A public **burn wallet** receives only the terminal fee, paid API and x402 revenue, and token payments. It never receives dev fees.
- Once a day, at a scheduled time, the team buys the token with the wallet's full balance and burns it. Every transaction is posted.
- The Burn Board shows this as it is. The wording is always "burned daily from a public burn wallet; every transaction posted" (`BURN_WALLET`, §8).

**Ticker** (the sidebar footer; the More sheet on mobile):
- A flame icon and "12,430 EKO burned today" → `/burn`.
- Before the day's burn, it reads e.g. "Next burn 20:00 UTC." The time always comes from `burnWallet.nextScheduledBurnAt` and is never hard-coded. 20:00 UTC is only the proposed daily time (Go Plan §12.2).

**Hero card:**
- It's auto-promoted above the Radar grid when `pctSupplyBurned > config.burnBoard.heroPctSupply` (proposed 1%) or `burns24h.usd > heroUsd24h`.
- These are config-driven UI rules, so no redesign or deploy is needed.

**Page:**
1. **Totals:** total burned (`totalBurned`) and % of supply (`pctSupplyBurned`).
2. **Burns in the last 24h** (`burns24h`: count, tokens, USD).
3. **The burn wallet:**
   - its address (`Address`, explorer link, Copy) and its balance (`burnWallet.balanceUsd`)
   - the **next scheduled daily burn**: "Next burn: today at 20:00 UTC," with a `Countdown` to `burnWallet.nextScheduledBurnAt` (`serverNow()`)
4. **What goes in:** "Terminal fees, paid API and x402 revenue, and token payments. Never dev fees."
5. **How it burns:** "Once a day at the scheduled time, the team buys EKO with the burn wallet's full balance and burns it. Every transaction is posted here, on X and on Telegram."
6. **Pons buybacks** (`ponsBuybacks`): tokens, USD, and buys in the last 24h (`count24h`), with the line "Pons also buys back automatically on every trade of the token ({{BUYBACK_SLICE}} of the creator share)."
7. **The launch burn** (the `BurnEvent` with `kind: 'launch'`, from `GET /burn/events` [CA-17]):
   - "Launch buy-and-burn: $100, bought by the public dev wallet about a minute after creation and burned immediately."
   - It shows both tx links.
   - It renders only once the event exists.
8. **The disclosure line,** always shown (`BURN_DISCLOSURE`, §8).
9. **A live feed of burns** (`GET /burn/events?cursor` + WS `burns`, which carries the manual burn events). Each row shows the buy tx, the burn tx, tokens, USD and time; the launch burn row is labelled.

- **Data:** `GET /burn/stats` (`BurnStats`: `mode`, `burnWallet`, `ponsBuybacks`, totals; [CA-17]), `GET /burn/events?cursor`, WS `burns`.
- **States:**
  - **Scheduled** (`mode === 'manual'`, the normal state): the countdown to the next burn.
  - **Before the first daily burn** (D0, before the evening): "First daily burn: today at 20:00 UTC." The launch burn already shows.
  - **Late:** `nextScheduledBurnAt` passed more than 60 min ago with no new burn event.
    - The countdown is replaced by "Today's burn is running late. It will be posted here when it lands."
    - The ticker shows the same state.
    - A new `burns` event clears it.
    - The copy never guesses a reason; the ops post does (Go Plan §13.5).
  - **Engine** (`mode === 'engine'`): Drop 7 only, behind `burn_engine` (§3.10.1). With `burn_engine` off, the page renders manual mode and ignores any `engine` field.
  - **Flag off:** with `burn_board` off, there's no ticker, hero or page.
- **Acceptance:**
  1. The hero promotes and demotes as a fixture crosses the thresholds.
  2. The copy test passes. It has no price language, and no "trustless," "automated," "ownerless" or "audited" about burns (§8).
  3. The disclosure line and `BURN_WALLET` render on the page in every state.
  4. The next-burn countdown is within 1 s of `nextScheduledBurnAt`. A fixture more than 60 min past it with no burn renders the late state with no countdown, and a new `burns` event clears it without a reload.
  5. Every burn row links both its buy and burn transactions on the explorer; the launch burn row is labelled.
  6. With `mode: 'manual'`, no engine UI (phases, contract facts, parameters) renders, even when `engine` is present.

#### 3.10.1 Drop 7 note: the automated Burn Engine (`burn_engine`; target Drop 7, gated on review)

None of this ships at T or D0. The engine is a Drop 7 target, likely as a "Lite" variant first: capped slices, a slippage cap, and no withdraw. If its review isn't done, it moves to a later Drop and manual mode continues. The design is in Backend §14. The v1 engine UI is parked here:
- **Mode switch:** when `burn_engine` is on and `BurnStats.mode === 'engine'`, the burn-wallet panel is replaced by an engine panel reading `BurnStats.engine` [CA-17]. The totals, Pons buybacks, launch burn and burn feed carry over unchanged.
- **Phase states** (`engine.phase`):
  - `curve`: "Buying on the Pons curve."
  - `switching`: "Switching to the pool." Burns pause at graduation until anyone calls `activatePool`. The countdown becomes "Paused while switching."
  - `pool`: "Buying from the pool."
  - Acceptance: a `switching` fixture shows no countdown, and moving it to `pool` clears the state without a reload.
- **Contract facts:** address, non-upgradeable, renounced status, and tuning end (`renounced`, `tuningEndsAt`). The engine's renounce happens at this Drop, never at D+7.
- **Other surfaces:** `FlowLayer` flames engine buys (`config.contracts.burnEngine`) as "Burn Engine." The trade fee line's destination becomes the engine, and the copy says so.
- **The 3× dip mode** comes only after a proper audit, and it's never pitched as dip-buying.
- **Copy:** engine copy goes through the Drop 7 copy review. Until that review lifts a pattern for the engine alone, every forbidden burn pattern in §8 still applies.

### 3.11 Watchlist and alerts · `/watch` · T

- **Components:**
  - Watches grouped by coin, wallet and crew.
  - Alert settings (`AlertSettings`): verdict change, playbook alert, crew active (Drop 2), and agent trades above $X (`agentTradeAboveUsd`).
  - A Telegram card that opens `t.me/{{BOT_HANDLE}}?start=<code>` [CA-22].
  - The alerts drawer, opened from the sidebar.
- **Data:** `GET/POST/DELETE /watch` [CA-28], `GET/PUT /alerts/settings`, WS `alerts`.
- **Acceptance:**
  1. An alert toasts within 1 s.
  2. Removals are optimistic, with rollback.

### 3.12 Mission Control: agents · `/mission` · T harness preview, D0 v1

The Mission Control base routes (agents list, agent detail, journal, Connect) aren't flagged at T. Only the D0 sub-features are.

- **Order on the page** answers three questions: does anything need me, is everything okay, how is each agent doing.
- **Components:**
  - **Needs you** (collapsible, count in the heading, a one-line summary when folded):
    - each pending approval (`approvals`) as its own row with the countdown and **Deny** / **Approve** in place, each followed by a confirm, the same two steps as §3.15; "Details" opens the queue
    - unchecked orders in 24h (`unchecked_orders`) with "Copy instructions" and Details
    - paused agents with Resume
    - or "Nothing needs you. Your agents are inside their limits."
  - **How Mission Control works** (collapsible; open on first visit): your agent asks, EKO checks your limits, you decide.
  - **The last 24 hours:** four figures, each with the context that says whether it is good: agents running (of `limits.agents`, and how many paused), orders checked (vs the day before), blocked by your limits (share of checks, and the rule behind most of them in plain words), money at work (and today's P&L).
  - **Your agents** as rows (`AgentRow`): name and kind, status pill, checks today with the allowed / sent to you / blocked bar and an unchecked flag, money at work, today's P&L. The guardrails badge (**Advisory** or **Enforced**) comes from `Agent.guardrails` [CA-18] and is never derived client-side; on-chain agents show Advisory until the session-key module passes its contract review and the server returns `enforced` (FACTS §3).
  - **Agent inspector:** status, Pause / Resume, Edit limits, Disconnect… (`mission_kill`); the note; checks in 24h with an hourly chart; then the same four tabs as the agent page (Activity, Limits, Performance, Connection) in short form, each linking to the full tab.
  - **Recent activity** across agents (collapsible) and **What the terms mean** (collapsible, folded by default).
  - **Stop all** (`mission_kill`) in the page head.
- **Data:** `GET /agents`; WS `agents`.
- **States:**
  - Empty: the mascot with "Connect your first agent."
  - At the agent limit: a `GateCard` replaces Connect.
  - Until `mission_kill` and `approvals` are on, the kill and approval controls are absent (not disabled).
- **Acceptance:**
  1. An agent's first preflight flips it from "Waiting for first call" to "Active" live.
  2. Every non-on-chain agent shows Advisory. On-chain agents show Advisory until the server returns `enforced`.
  3. No approval is decided by one click: Approve and Deny each need the confirm.
  4. A folded section keeps its count and summary visible, and its state survives a reload.

### 3.13 Agent detail · `/mission/agents/:id` · T journal, D0 the rest

- **Header:** rename (`PATCH /agents/:id`), guardrails badge, status, kill controls (§3.16, `mission_kill`). Data: `GET /agents/:id` [CA-18].
- **Tabs:** Activity · Limits · Performance · Connection. Old links (`?tab=journal`, `policy`, `keys`) still resolve.
- **Activity** (T; the Flight Recorder journal):
  - A timeline grouped by `session_start`, with icons per `kind`.
  - Preflights show inline as allow / deny / needs approval, with reasons and `policyVersion`.
  - A `deny` with reason `approval_unavailable` means the policy called for approval but the user has no approvals feature (before D0, or on the Listener tier). It shows the `APPROVAL_UNAVAILABLE` line (§8): "This order needs approval, which is available from token day on the Reader tier and above."
  - `payload: unknown` is agent-supplied, so it renders as a text-only JSON tree (strings through `UntrustedText`, depth ≤ 6, 2 KB per string).
  - Each entry shows "Committed on-chain as a private hash" (roots are committed every 5 minutes), the `commitment`, and its `share` state.
  - Data: `GET /agents/:id/journal?cursor&kind` [CA-18]; WS `agents` `journal` events prepend.
- **Unchecked orders** (D0, `unchecked_orders`):
  - Orders from the agent's own Robinhood history with no matching preflight: instrument, side, size, time.
  - Guidance: "Your agent placed this without checking. Re-send the harness instructions, or stop the agent." Data: `GET /agents/:id/unchecked-orders` [CA-18].
- **Other tabs:** Limits (the policy editor, §3.14); Performance (P&L, closed trades, open positions); Connection (keys and grants: list and revoke [CA-18]); Settings (delete, typed confirmation).
- **Acceptance:**
  1. A payload containing `<img onerror>` or "ignore previous instructions" renders inert.
  2. Live entries keep the scroll position.

### 3.14 Policy editor with presets · agent tab · T presets, D0 fields

- **Components:**
  - Preset cards from `GET /policy-presets`: Safe / Balanced / Degen, each with its key limits. The selection shows "Custom" once a field is edited.
  - `PolicyForm` (D0, `policy_editor`), with fields exactly as in `Policy`:
    - `maxPositionUsd`, `maxPositionPct`, `maxDailyLossUsd`
    - `allowAssets` and `blockAssets` as chips
    - `blockPlaybookLevel`
    - `earningsBlackoutDays`, noted "your agent supplies the earnings date from its Robinhood connection"
    - `minLiquidityUsd`, `maxRoundTripCostPct`, `maxLeverage`, `approvalAboveUsd`. Without the approvals feature (before D0, or on Listener), `approvalAboveUsd` carries the `APPROVAL_UNAVAILABLE` line, because orders above it are denied rather than queued.
  - A diff-before-save sheet, and the version ("Saved as v12").
- **Data:** `GET/PUT /agents/:id/policy`. The PUT sends `version`; a 409 `conflict` reloads with "Policy changed elsewhere — review and save again."
- **Banner:** the `ADVISORY` line (§8) for non-on-chain agents; `ONCHAIN_ADVISORY` for on-chain agents until `guardrails === 'enforced'`.
- **Acceptance:**
  1. Negative values and percentages over 100 are blocked.
  2. "Enforced" appears only when `guardrails === 'enforced'`.
  3. The preset picker works at T with `policy_editor` off.

### 3.15 Approvals queue · `/mission/approvals`, `/approve/:id` · D0

- **Queue:**
  - Pending `ApprovalCard`s by `expiresAt`: agent, `summary` (e.g. "Agent wants to buy $2k NVDA — above your $1k approval limit and 3× its usual size"), the rule hit, a countdown, and **Approve** / **Deny**.
  - A History tab.
- **Single page:** the same card full-screen with `detail` (order, reasons, policy version) [CA-18] and the advisory line.
- **Data:** `GET /approvals?status`, `GET /approvals/:id` [CA-18], `POST /approvals/:id {decision}` with an idempotency key, WS `approvals`.
- **States:**
  - Expired (read-only: "the agent was told no").
  - Already decided elsewhere (the outcome).
  - Not the owner (403 `forbidden`).
  - No approvals feature (before D0, or on Listener): nothing is queued. The agent's preflight returns `deny: approval_unavailable` and never hangs, and the journal row shows the `APPROVAL_UNAVAILABLE` line (§3.13).
- **Acceptance:**
  1. Opening the URL never decides anything.
  2. A decision is two taps: the button, then the confirm sheet.
  3. The badge updates ≤ 1 s after a WS event.

### 3.16 Soft and hard kill · agent header, inspector, Stop all · D0 (`mission_kill`)

- **Soft stop:**
  - Dialog: "Every preflight from this agent will return *deny*, and it will be told to stop." Non-on-chain agents also see the advisory line.
  - Confirm sends `POST /agents/:id/kill {mode:'soft'}` (Stop all uses `POST /agents/kill-all` [CA-18]).
  - Status becomes soft-stopped, with **Resume** [CA-18].
- **Hard stop:** by response type [CA-18]:
  - `deeplink` (Robinhood-connected): before it responds, the server revokes the agent's harness keys and marks it `disconnected`. The dialog then reads "Harness keys revoked. Open Robinhood to disconnect this agent there too." It opens the deep link, refetches `GET /agents/:id`, and offers "I've disconnected it in Robinhood" (a note for the user, since we can't see Robinhood's side).
  - `tx` (an on-chain session key): the wallet signs the revocation, then submitted → confirmed (`signAndSubmit`).
- **Acceptance:**
  1. The soft stop reflects via WS without a reload.
  2. The hard stop never claims success before `disconnected` or a confirmed revocation, and never claims the Robinhood side is disconnected.

### 3.17 Connect an agent · `/mission/connect` · T (Claude Code, generic MCP, Claude Desktop and claude.ai), D0 (the rest)

A stepper, modelled on SignalOS's `LiveSetup` (steps, focus management, autofocus):
1. **Platform:**
   - Claude Code and a generic MCP client (T; the API key goes in the `Authorization` header).
   - **Claude Desktop and claude.ai** (T), through Anthropic's official custom connectors with MCP OAuth. They work on every Claude plan (Free allows one custom connector; on Team and Enterprise an owner adds it first in Organization settings → Connectors), and the card says so. The backend's pack id is `claude_connector`. If the OAuth check fails on Oct 2, this pack's `stage` becomes D0 and Claude Code carries T alone (FACTS §5b).
   - ChatGPT and OpenClaw (D0, `packs_chatgpt_openclaw`).
   - An on-chain agent wallet (D0). The session-key step needs `onchain_guardrails`. Until then, the wallet connects with an API key like any MCP client and stays Advisory.
   - A perp-venue agent guide (D0, with `perps_panel`; "trade-only keys with no withdrawal rights; we never execute perps").
   - The list comes from `GET /packs` [CA-19]. A platform appears only once its pack's `stage` has arrived, so the Desktop fallback needs no frontend change.
2. **Name and preset:** `POST /agents {name, kind, preset}`.
3. **API key** (skipped for Claude Desktop and claude.ai, which sign in with MCP OAuth):
   - `POST /agents/:id/keys` returns the secret once. It's shown masked, with Reveal and Copy.
   - "You won't see this again. Store it in your agent's config."
   - The secret is never written to storage.
4. **Install:** the pack's `configTemplate` from `GET /packs`, with `{{API_KEY}}` filled in client-side (and `{{MCP_URL}}` from `VITE_MCP_URL`, if the template still carries it), plus the pack instructions. **The frontend never hard-codes a snippet or the endpoint** (`https://mcp.{{DOMAIN}}/mcp`). For illustration only, the Claude Code template renders as:
   ```bash
   claude mcp add --transport http eko https://mcp.{{DOMAIN}}/mcp --header "Authorization: Bearer <YOUR_KEY>"
   ```
   - Every pack's instructions tell the user to check that Robinhood's trade approvals are on (FACTS §3).
   - **Claude Desktop and claude.ai (custom connector):** the template has no key; it carries only the connector URL. The step shows the steps below, with the URL and a Copy button taken from the pack's `configTemplate`, never hard-coded:
     1. In Claude Desktop or on claude.ai, open **Customize → Connectors → + → Add custom connector**.
     2. Paste the EKO MCP URL and add it.
     3. Claude opens our **OAuth sign-in** in the browser. It's the backend OAuth server's consent page on `mcp.{{DOMAIN}}` (Backend §9.1, BE-3).
        - The user connects the same wallet and signs in (SIWE).
        - They pick the agent created in step 2, or create one inline with a name and preset.
        - They tap **Approve**. Cancel returns `access_denied` to Claude.
     4. **OAuth return:** the browser goes back to Claude's registered callback, and the connector shows as connected in Claude.
     5. In Claude, the pack's instructions (`projectInstructions`) go into the project or chat instructions. Then the user returns to this tab for Verify.
     - If the web app is asked to render the consent page instead of the backend, it becomes a static-chunk route with the same rules [CA-19]:
       - It never approves on load; Approve is a tap plus a confirm.
       - The redirect goes only to the `redirect_uri` the server validated.
   - **On-chain, with `onchain_guardrails` on:** the path installs the session-key policy instead. `POST /agents/:id/session-key` returns a tx for the wallet to sign [CA-18].
5. **Verify:** "Waiting for your agent's first call…" on WS `agents`, then "First preflight received," with a link to the journal. For the custom connector, the wait also covers the OAuth return: the agent flips to connected when its first OAuth-authenticated call lands.

- **Always shown:** "EKO never receives your Robinhood credentials. Your agent keeps its own Robinhood connection," plus the advisory and non-affiliation lines.
- **Acceptance:**
  1. After step 3, the key is absent from all storage and from the DOM.
  2. The copied snippet equals the `/packs` template with the placeholders filled. No snippet text or MCP endpoint is hard-coded in `src/`.
  3. With the `claude_connector` pack at stage T, the card shows the Customize → Connectors → + → Add custom connector steps and the plan note. With its stage at D0, the card is absent at T, with no frontend change.
  4. The Claude Code path still issues an API key at T, and the connector path never shows or creates one.

### 3.18 Rule Lab · `/lab` · D0 (stock upload: Drop 6)

1. **Compile:**
   - A plain-English strategy (a Robinhood Loop or any standing instruction).
   - `POST /loops/compile {text}` returns a `LoopSpec` [CA-20].
2. **Spec review:**
   - Editable rules (universe, entry, exit, sizing, risk) with compiler ambiguities highlighted.
   - Banner: "Compiled by AI — review every rule before testing."
3. **Backtest:** `POST /loops/backtest {loopSpec, source}`.
   - The source is **On-chain** (crypto and Robinhood Chain) or **Your data** (flag `stocks_lane`).
   - "Your data" is a CSV/JSON drop parsed client-side by `lib/csv.ts` into `Bar {ts,o,h,l,c,vUsd}`. It's validated (monotonic time, no NaN, ≤ `config.loops.maxBars`) and previewed.
   - Copy: "Your data is used for this run and shown only to you."

- **Results:** `BacktestResults`, `MetricRow`, `EquityChart` and the adapted `HowItWorks` ("point-in-time, costs included"), plus the trades list. Every metric carries its sample and period and is labelled "backtest."
- **Also:** saved loops (`GET /loops`) and "Copy as Loop text."
- **Quota:** "Backtests today: 2 of 5" from `limits.loopBacktestsPerDay`.
- **Drop 6** adds tabs for stress tests, shadow runs and model comparison.
- **Acceptance:**
  1. Uploaded bars leave the browser only in the backtest request.
  2. There's no win-rate headline.

### 3.19 Deep Research · coin view button → `/research/:id` · D0

- **Start:** `POST /research {target}` returns a job. The button shows the day's quota (Reader 3, Oracle 10, Source 50; the trial gets 1).
- **States** [CA-21]:
  - `queued`
  - `running`: a live step list (deployer and crew history, LP forensics, playbook evidence, agent inflow, holders, swarm crowding, X context) with the mascot's magnifier
  - `done`
  - `failed`: with a refund note when the API says so
  - `quota_exceeded`: a `GateCard`
- **Polling:** `GET /research/:id` every 2 s for 30 s, then every 5 s; paused while hidden.
- **The note:** verdict, confidence, and evidence with internal links. "What X is saying" is labelled "Sentiment, not fact," and its quoted posts go through `UntrustedText` and aren't clickable. The receipt hash, and DYOR at the top and bottom.
- **Acceptance:** a reload mid-run resumes from the URL.

### 3.20 Perps, Settings, and tier, trial and referral

**Perps** · `/perps` · D0:
- An asset selector (BTC, ETH); funding and open interest per venue as a crowding signal (`GET /perps/context?asset` [CA-23]).
- "Venue links," each with its availability note (e.g. "Excludes US persons and Ontario"). Never "Express this view" or anything that prompts a leveraged trade (FACTS §6).
- A "Bring your own perp agent" card linking to Connect.
- The line "We never execute perps."
- An outbound-link test asserts no `ref`, `referral` or `aff` parameters.

**Settings** · `/settings` · T. This is the SignalOS scaffolding with these sections:
- **Trading:** default mode, slippage, presets (`NumberList`), and confirm above $X (`/me/preferences` [CA-10]).
- **Wallet & network:** SIWE state and sign out (`POST /auth/logout`).
- **Notifications:** Telegram link, web push (D0) and alert thresholds (`/alerts/settings`, [CA-22]).
- **Plan and referrals:** → `/settings/plan`.
- **Display:** theme, density, reduced motion, human markers (`eko.ui`).
- **Privacy & data:** default journal sharing and "Delete my harness data" [CA-30].
- **Help and About:** replay the tour, version, legal, and the non-affiliation line.

**Tier, trial and referral** · plan chip + `/settings/plan` · T dormant, D0+1 active:
- **Chip:** "Free during launch week" while `config.phase === 'launch_week'`, and "Tiers start tomorrow" during `token_live` (D0, before tiers switch on). From `tiers`, it shows the tier (Listener / Reader / Oracle / Source, from `config.tiers`), or "Trial · 23:41."
- **Plan page:**
  - Tier, `feeBps` and limits; the 24h minimum balance held [CA-10].
  - The next tier's requirement ("Hold ≥ {{TIER_AMOUNTS}} EKO for 24 h").
  - A tier table whose unshipped perks read "shipping in Drop N." Tier amounts are set at D0+1 (worth ≈ $50 / $250 / $1,000 of EKO at that price) and are only ever lowered, so the page never implies they can rise.
  - A neutral "View EKO on the terminal" link (our own guarded coin view; no buy CTA).
- **Trial** (`/me.trial` [CA-10]):
  - `eligible`: "Connect to start 30 minutes of full access."
  - `active`: the countdown.
  - `used`.
  - `ineligible`: "Trials need a wallet with 7+ days of history, 10+ Robinhood Chain transactions, or $20+ balance."
  - `not_open`: trials haven't opened yet (before D0+1, when everyone has full access), so no trial UI renders.
- **Trial end:** a one-time modal, "Your trial ended. Here's what it caught for you," with rugs flagged, orders stopped and alerts fired (`GET /me/trial-recap` [CA-13]), and a link to tiers.
- **Referral card:** the link `https://{{DOMAIN}}/?ref=CODE` with Copy, X and Telegram; stats from `GET /referrals` [CA-12]; and "You and your friend each get +30 minutes when they make their first guarded trade or connect an agent."
- **Acceptance:**
  1. The countdown is within 1 s of `endsAt` (`serverNow()`).
  2. An `entitlements` event updates the chip without a reload.

### 3.21 Onboarding tour · T

- **Welcome:** SignalOS's full-screen `Welcome` is removed, because value comes before any modal. After the first scan result renders, a non-blocking pill offers "Take the 40-second tour."
- **Tour anchors** (`data-tour`, on the `Tour.tsx` engine): `scan`, `verdict`, `playbooks`, `flow-markers`, `coin-card`, `fee-lines`, `trade`, `mode`, `mission`, `wallet`.
- **Checklist:** scan a coin, open the evidence, scan my bags, a first guarded trade, connect an agent.
- **Persistence:** SignalOS's `mergeProgress` OR-merges `/me/preferences.onboarding` with localStorage. `eko.onboarding=off` disables the tour in tests.

### 3.21a Simple view and tool guides · proposed (not in the prototype yet)

From the prototype review: newcomers, especially people arriving from Robinhood, find dense terminals hard to read. Two additions, to be sized before they're scheduled:

- **Simple view** (a Simple / Pro switch in the sidebar, saved in `eko.ui`; new wallets start in Simple):
  - **Radar:** the Hot strip plus plain-language rows. Each row is the coin, its verdict, one sentence ("Clean scan. Agents are buying.", "Danger: the deployer can pull the pool."), and what $100 would cost to get out of. Signal, flow, liquidity and the trend column move behind "Show details".
  - **Coin view:** the verdict sentence, the chart and the trade box first. Playbooks, supply and flow move into "How we know".
  - **Mission Control:** Needs you, then one line per agent ("Trench scout is running and stayed inside your limits today"). The figures and tabs are one tap away.
  - Nothing is hidden that changes a decision. Danger, the guard's refusal and exit cost always show in both views.
- **Tool guides** (a Learn hub at `/learn`, and a "How this works" link in every page head):
  - One short guide per tool, each about a minute long: Radar, New pairs, the coin view, the guarded trade, Scan my bags, Mission Control, connecting an agent, Rule Lab, the Scoreboard and the Burn Board.
  - Each guide is a few annotated screenshots and a "Try it" button that opens the tool with a sample coin or agent. It reuses the tour anchors above.
  - The Onboarding tour (§3.21) links to the guides at the end, and the checklist items open their guide.

### 3.22 Drops page and Drop surfaces

- **`/drops`** (T) lists only drops whose `config.drops[].status` (`'hidden'|'demo'|'live'`) is `demo` or `live`. Each has a demo `<video>` from our origin, a target date, and the wording "Built and demoed · shipping in Drop N (target Oct 27)." A drop reads "live" only when its flag is on.
- **The surfaces:** each is built behind its flag. Drops 1–3 are complete by D0; Drops 4–7 are demo-ready. Drops 1–7 have recorded demos before D0; Drops 8–9 are demoed before their release. Their data contracts are in [CA-29].

| Surface | Route | Components | States and acceptance |
|---|---|---|---|
| Agent Flow Index (Drop 1) | `/afi`, `/embed/afi` | A big number updated every block, history since genesis, window selector, methodology, iframe embed code, API link | Needs `afi` and the label gate; the embed is < 30 kB gzip |
| Rug Ring Radar (Drop 2) | `/crews`, `/crews/:id` | A `d3-force` graph on canvas (≤ 500 wallet nodes; funding and co-trade edges), a crew list with playbook history ("this crew ran 14 stuck-at-bonding launches"), "crew active" alerts | A sortable list alternative for keyboard and screen readers; nodes show addresses only |
| The Arena (Drop 3) | `/arena` | Season header, live paper leaderboard, entry (a harnessed agent or a persona), rules | Labelled "Paper results · skill-based prizes · no purchase needed" |
| Desk live transcript (Drop 4) | `/desk/:runId` | Streaming researcher → risk → executor turns, the committee outcome; start from a coin or bag (Oracle+); Ask the Swarm on the coin view (`ask_the_swarm`) | Every turn is Beta and AI-labelled and rendered via `UntrustedText`; resumes from the last `seq` |
| Agent Launcher (Drop 5) | `/mission/launcher` | Templates (trench scout, DCA Loop, Robinhood Loop companion), a preset, a generated Akash SDL or docker-compose bundle for **your own** box | "You own and pay for the box; we never operate it." The key is inserted client-side with a warning. |
| EKO Inside (Drop 7) | `/inside`, `/embed/verdict/:address` | Docs, a configurator, the snippet; the widget shows verdict, top playbook, exit cost, freshness, "Scanned by EKO" and DYOR | Frameable only under `/embed/*`; reads no cookies |
| Automated Burn Engine (Drop 7 target, gated on review; `burn_engine`) | `/burn` (engine mode), ticker, hero | The engine panel and phase states of §3.10.1 replace the burn-wallet panel | Renders only with `burn_engine` on and `BurnStats.mode === 'engine'`. If the review slips, the flag stays off and the Drop page says "shipping in a later Drop." |
| Beat the Swarm and Clear badge (D0) | `/swarm`, `/embed/clear/:address` | A paper leaderboard vs the personas; the live, revocable "EKO: Clear" badge | The badge re-checks every 60 s and shows "Clear revoked" as soon as the verdict changes |

## 4. Core flows

### 4.1 First visit → scan → connect → trial

1. The visitor lands on `/` or a shared `/scan/:id`. `?ref=` is captured (§4.7).
2. They paste a CA. `POST /scan` returns `{id, status}` and the app routes to `/scan/:id`, polling every 700 ms (up to 10 s) while pending.
3. **Scan my bags** or **Trade with the guard** opens the wallet sheet, listing the EIP-6963 wallets that wagmi `injected()` found.
4. The network switch and SIWE run (§4.2).
5. The backend decides trial eligibility on the first connect, and the client refetches `/me`. When `trial.status === 'active'`, a toast reads "30 minutes of full access started" and the chip counts down; `ineligible` shows a neutral note.
6. `/bags` loads with Share offered. When the trial ends, an `entitlements` event opens the recap modal.

### 4.2 SIWE and the network switch to 4663

This reuses `ensureChain` and `siweSignIn` from `lib/trade.ts`.

1. If `chainId !== 4663`, a banner reads "Switch to Robinhood Chain." `switchChain({chainId: 4663})` runs; wagmi adds the chain on error 4902, from viem's `robinhood` definition.
2. `POST /auth/siwe/nonce` returns `{nonce, domain, uri, issuedAt, expirationTime}` [CA-11].
3. `createSiweMessage` builds the message: chainId 4663, a 10-minute expiry, and the statement "Sign in to EKO. This proves you own this wallet. It does not authorize any transaction or spending."
4. `signMessage`, then `POST /auth/siwe/verify {message, signature, ref?}`. The response sets an HttpOnly cookie.
5. `GET /me` loads (with Entitlements), then `realtime.reconnect()` so user channels authenticate at the handshake.
6. **Wallet changes:** `accountsChanged` to another address drops user channels, shows "Wallet changed — sign in again or switch back," and blocks trading with `wallet_mismatch`.
7. **Session expiry:** a 401 `wallet_auth_required` shows an inline re-sign prompt and keeps the page state.

### 4.3 Guarded trade

`lib/tradeFlow.ts` adapts `runLive`. It stays React-free, with side effects injected so it's unit-tested with fakes (the `lib/instant.test.ts` style).

```ts
export type GuardedPhase = 'idle'|'quoting'|'needs_ack'|'refused'|'approving'|'signing'|'submitted'|'confirmed'|'failed';
export interface GuardedEnv {
  wallet: { address: Address; chainId?: number } | null; verifiedWallet: Address | null;
  riskMode: Policy['mode']; slippageBps: number; confirmAboveUsd: number; allow: CalldataAllowlist; // from /config
  api: typeof api; ensureChain(id: 4663): Promise<void>; signIn(): Promise<void>;
  approve(step: TradeQuote['approvals'][number]): Promise<Hex>;   // exact amount; awaits the receipt
  signAndSubmit(order: TradeOrder, tx: UnsignedTx): Promise<{ order: TradeOrder }>;
  settled(orderId: string): Promise<TradeOrder>;                  // resolved by the `orders` channel
  onPhase(p: GuardedPhase, interim?: GuardedResult): void;
}
```

1. **Quote before the tap:** `POST /trade/quote`. Fee lines and the guard result render. The button is enabled only when `decision !== 'refuse'`, the quote is ≤ 15 s old, and the route isn't quote-only (§3.6).
2. **Tap:**
   - `useGuardedTrade` takes the lock (a second tap returns `busy`) and mints `newIdempotencyKey()`.
   - A trade above `confirmAboveUsd` first returns `confirm_required`, as in SignalOS.
3. **Network and SIWE** if needed.
4. **Bound re-quote** for the connected wallet (the response has `binding: true`; an indicative quote has `binding: false` and can't be ordered):
   - **Hard refusal:** phase `refused`, and the flow ends. **The wallet is never opened.**
   - **Warning:** if some warning codes aren't in `acked`, phase `needs_ack` lists them with the mode. The user taps "I understand — continue," and the flow resumes.
   - **Material change** from the displayed quote (`fee.bps` changed, or exit cost or impact moved > 25% relative): show the new numbers and require another tap.
5. **Exact approvals** for each `approvals[]` step:
   - First, check `spender` is in `allow.spenders` and `amount` equals the quote's `amountIn` (never `maxUint256`).
   - Then `approveToken`, await the receipt, and re-quote (SignalOS's `approval_pending` handling).
   - v4 routes use two exact steps (ERC-20 → Permit2, then Permit2 → UniversalRouter with ≤ 30 min expiry). ETH-in curve buys need none.
6. **Order:** `POST /trade/order {quoteId, idempotencyKey, acknowledged}` returns `{order, tx}` [CA-7]. The client asserts `tx.chainId === 4663`, `tx.to` ∈ `allow.routers`, and `tx.value` equals the quote's `valueWei`. Any failure is `calldata_mismatch`, and telemetry is sent.
7. **Sign:** `signAndSubmit`.
   - A rejection sends `POST /trade/order/:id/rejected` [CA-7] and ends quietly.
   - On success, the hash is saved to `eko.pendingTx` before `POST /trade/order/:id/submitted {txHash}`.
8. **Submitted:** the tap resolves ("Submitted — waiting for confirmation"). The UI is never blocked on the chain.
9. **Confirmed or failed:** from the `orders` channel. From D0, on a Uniswap-routed trade, the result line reads e.g. "Bought 1.2M $X · fee $0.50 → burn wallet (burned daily)." Whenever `fee.bps` is 0 (launch week, or any Pons-curve trade), there's no fee clause. Failures read e.g. "Failed on-chain — no trade happened (gas was spent)."

SignalOS's `FRIENDLY` error map is kept and extended with `guard_refused`, `stale_data`, `trade_cap_exceeded`, `trading_paused`, `not_allowlisted` (403), `sanctioned`, `calldata_mismatch`, `quote_changed`, `anti_snipe_active`, `wallet_auth_required`, `conflict` (409) and `forbidden` (403).

### 4.4 Approval from a Telegram notification, completed on the web

1. `preflight` returns `needs_approval` with an `approvalId`. The backend's Telegram DM carries a generic summary and `https://{{DOMAIN}}/approve/<id>`. Telegram only notifies.
2. The link opens the browser or the installed PWA.
3. If there's no session: connect (the wallet's in-app browser, or WalletConnect from D0), then SIWE. The page state is kept.
4. `GET /approvals/:id`: the card with the countdown and the advisory line.
5. Approve or Deny, then a confirm sheet repeats the summary. `POST /approvals/:id {decision}` is sent with an idempotency key.
6. The `approvals` channel updates every open device. Expired, already decided and not-the-owner render as in §3.15. A web push (D0) follows the same path from `notificationclick`.

### 4.5 Kill switch

1. The user opens the kill dialog from the agent inspector, the agent header or Stop all (`Shift+K` in Mission Control). The dialog copy is in §3.16.
2. **Soft:** confirm sends `POST /agents/:id/kill {mode:'soft'}` (or kill-all). The `agents` event sets `soft_killed`, and a Resume banner appears.
3. **Hard:** confirm sends `{mode:'hard'}`. For a Robinhood-connected agent, the server has already revoked its harness keys and marked it `disconnected` when it returns the `deeplink`. The page refetches `GET /agents/:id`, opens the deep link so the user can disconnect it in Robinhood too, and offers a manual "I've disconnected it in Robinhood." A `tx` is signed, then submitted → confirmed. `kill_used` fires either way.

### 4.6 Tier gating and upgrade prompts

- **The server enforces.** The client reads `Entitlements.limits` for display and handles `{error:'tier_required', requiredTier}` and `{error:'quota_exceeded', retryAfterSec}` [CA-8].
- **`GateCard`:** the feature, the required tier and its 24h hold (from `config.tiers`), the fee discount, and links to `/settings/plan` and "How tiers work."
- **Gates:** the agent count; the Radar and Senses delay (a badge, not a card); backtests and Deep Research runs per day; approvals (Reader; on Listener, a preflight that needs approval returns `deny: approval_unavailable`, §3.13); and the Desk, stress and shadow runs, and Ask the Swarm (Oracle, from their Drops).
- **Before D0+1,** no gates render. During a trial, there's full access. The first gate after a trial ends shows the recap first.
- **Never gated:** guarded trading, verdicts, Scoreboard, Census and the Burn Board.

### 4.7 Referral bonus

1. `?ref=CODE` is stored first-touch as `eko.ref` (30-day TTL) and stripped from the URL with `replaceState`.
2. It's sent with SIWE verify [CA-11]; the server binds it once.
3. When the referred wallet's first guarded trade lands or it connects an agent, the server adds +30 min to both sides and emits `entitlements` on each user's `alerts` channel [CA-12]. The toast reads "+30 minutes: your referral made their first guarded trade."

### 4.8 Share cards: backend OG images, frontend meta tags

- **OG images** are backend-rendered (`/og/scan/:id.png`, `/og/bags/:id.png`).
- **Crawlers don't run JS,** so the web host injects the tags from `lib/share.ts` into the `<!--eko:head-->` marker in `index.html` for `/scan/:id`, `/bags/r/:id`, `/receipt/:id` and `/coin/:address` [CA-26].
- **In-app,** `useShareMeta()` sets the same tags and `document.title`.

```ts
export function scanMeta(s: { id: string; level: Verdict['level']; topPlaybook?: PlaybookId; coin: Address }) {
  const title = `${APP_NAME} scan: ${LEVEL_WORD[s.level]}${s.topPlaybook ? ` · ${PLAYBOOK_NAME[s.topPlaybook]}` : ''}`;
  const img = `${API_BASE}/og/scan/${s.id}.png`;
  return { title, 'og:title': title, 'og:image': img, 'og:url': `${APP_ORIGIN}/scan/${s.id}`,
    'og:description': `${shortAddress(s.coin)} on Robinhood Chain. ${DYOR}`,
    'twitter:card': 'summary_large_image', 'twitter:image': img };
}
```

Meta text never includes untrusted token names; only the sanitised image shows them. The X intent text is neutral: "EKO scan: DANGER · Honeypot. DYOR."

## 5. Realtime

- **Client:** `lib/realtime.ts` evolves `SignalSocket`. It keeps the backoff (500 ms ×2, capped at 15 s, jitter ±25%), the 10 s ping with `observeServerTime`, and `onReconnect`, and adds refcounted channels:

```ts
import type { WsEventMap } from '@eko/shared';   // the shared payload map; never redefined here
type ChannelKind = keyof WsEventMap;                     // the channel kinds (approvals, orders, feed, alerts, …) as the shared map names them
type ChannelEvent<K extends ChannelKind> = WsEventMap[K];
export interface Realtime {
  subscribe<K extends ChannelKind>(ch: Channel<K>, onEvent: (e: ChannelEvent<K>) => void, onResync?: () => void): () => void;
  state: 'connecting'|'open'|'reconnecting'|'closed'; lastEventAt(ch: string): number | null; reconnect(): void;
}
```

- **Payload types:** every event payload comes from the shared `WsEventMap` in `packages/shared`. The frontend imports it and never defines its own event shapes.
- **Envelope** [CA-1]:
  - Client: `{op:'sub'|'unsub', ch:string[]}` and `{op:'ping'}`.
  - Server: `hello {serverTime, session, delayedSec}`, `ack {ch, seq}`, `ev {ch, seq, ts, kind, data}`, `err`, `resync {ch}`, `pong`.
- **Channels:** the FACTS §7 set (`radar`, `pairs`, `coin:{address}`, `flow:{address}`, `burns`, `alerts`, `agents`, `approvals`, `orders`) plus `feed` [CA-2].
- **Subscription management:**
  - `sub` goes out on a refcount 0 → 1; `unsub` on 1 → 0 after a 2 s grace, so route changes don't churn.
  - At most 40 `coin:*` + `flow:*` channels, with least-recently-used eviction. User channels subscribe only when signed in.
  - On reconnect, every active channel re-subscribes and its `onResync` refetches the REST snapshot.
- **Gaps:** each channel tracks `seq`. A gap or a server `resync` triggers a snapshot fetch, drops buffered events with `seq` ≤ the snapshot's, and applies the rest.
- **Backpressure:**
  1. Events are coalesced into one store write per animation frame per channel, last write wins per key.
  2. Ring buffers: feed 500, pairs 100 per column, markers 5,000 per coin.
  3. When hidden for 30 s, the client drops `feed`, `pairs`, `radar`, `coin:*` and `flow:*`. It keeps `alerts`, `approvals`, `orders` and `agents`, and resyncs on `visibilitychange`.
  4. The server may drop deltas for a slow client and send `resync`.
- **Stale indicators:**
  - Global: the sidebar's live dot and the head-block lag.
  - Radar: 90 s without an event (150 s when delayed). Coin: `freshness.ageSec` > 30 s or 30 s without an event. Pairs: 60 s.
  - "Delayed" (tier) and "Stale" (fault) are separate badges.
  - Trading disables only on coin staleness or a closed socket (SignalOS's `stale_price` pattern).
- **Metrics:** `ui.ws_event_to_paint_ms` (sampled while visible), `ws.rtt_ms`, `ws.resyncs`.

## 6. Wallet

- **Discovery:** `createConfig({ chains: [robinhood], connectors: [injected()], multiInjectedProviderDiscovery: true })`. EIP-6963 lists every installed wallet with its name and icon; `WalletButton`'s de-duplication is kept. `walletConnect` is added behind its flag from D0 for phones. Testnet stays dev-only.
- **Transport:** `http(VITE_RPC_URL)`, keyless [CA-25]. Archive reads and simulations go through our API.
- **SIWE:** §4.2. The session is an HttpOnly cookie; the client never handles tokens.
- **Exact-amount approvals, never unlimited:**
  - `approveToken` passes the quote's exact `amount`.
  - A unit test and a source grep fail on `maxUint256` or `2n ** 256n`.
  - Permit2 allowances are exact, with `expiration` ≤ 30 min.
- **Idempotency:** one key per tap (`ik_${uuid}`), reused only for retries of that tap. Approval decisions have their own keys.
- **Reconnect:**
  - `flushPendingReports()` runs on socket open (as in SignalOS `App.tsx`), replaying `eko.pendingTx` to `/trade/order/:id/submitted` and dropping entries after 24 h.
  - wagmi restores the last connector.
  - A mismatch between the SIWE address and the connected account blocks user actions until the user switches back or re-signs.
- **Calldata allowlist** (`/config.trading` [CA-9]): routers (SwapRouter02; the Pons curves once their ABIs are verified; UniversalRouter once v4 is green), spenders (the same plus Permit2), and chainId 4663. It's checked before every wallet prompt.
- **Fee destination check:** whenever `fee.bps > 0`, the quote's `fee.destination` must equal the published burn wallet (`config.wallets.burn` [CA-9]). If it doesn't, the trade fails with `calldata_mismatch` and telemetry is sent. With `fee.bps` at 0, `fee.destination` must be `null`.
- **Fees:** the network fee comes from the quote's `networkFeeUsd` (the L2 fee plus L1 data). Native sells keep `GAS_RESERVE_ETH`.

## 7. Design system

### 7.1 Tokens and colour

**Style under review.** The prototype ships three styles on the same layout, switchable with `?style=`. Pick one before the build; the choice sets the radius, surface and label tokens below.
- **Desk** (the prototype's default): the site's signal desk. Black ground, 2 px corners, mono path labels with numbered sections whose rule runs to the end of the line, and scores out of 100 in the display face. Big blocks sit on a single rule, not in filled boxes. Filled, bordered accents are kept for small things you act on or read at a glance: search, the trial, inputs, chips, code, the guard box, notices, Needs you and the Hot cards.
- **Signal:** Desk's structure on the site's own navy ground and ink. See-through panels with LCD lines and cyan edges, echo rings behind page titles, and a glow on hot and selected items.
- **Soft:** graphite (not blue) cards with rounded corners and soft shadows instead of lines, and sentence-case labels. Closest to Robinhood's own app.

Extend `src/styles/tokens.css`. The ground, ink, muted and line colours come from the EKO site's `src/styles.css` so the terminal and the site read as one product. SignalOS's radii, shadows and motion tokens stay; its surfaces, brand, sky and mode tokens are replaced.

```css
:root {
  --v-clear:#4cd07d; --v-monitor:#ffb547; --v-danger:#ff4d5e; --v-info:#6cb4ff;      /* verdicts: icon + word + colour */
  --l-agent:#a996ff; --l-crew:#ff7eb6; --l-human:#8fa1b3; --l-burn:#ff8a3d;        /* labels: hue = who, fill = confidence */
  --up:#19d99f; --down:#f0445a;                                                      /* direction: candles, P&L, flow split only */
  --ground:#05121c; --ground-deep:#030b11; --ink:#e0edf1; --muted:#98b1bd; --line:#355260;  /* from the EKO site */
  --brand:#8fcbe3; --brand-hi:#cfeff7; --brand-ink:#05121c;                          /* pale cyan; Buy text uses --brand-ink */
  --mode-safe:#6cb4ff; --mode-balanced:#b4c0cc; --mode-degen:#ff4fa8;
  --font-display:Arial,Helvetica,sans-serif;                                         /* the site's face: weight 400, letter-spacing -0.035em */
  --font-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;                  /* labels: uppercase, letter-spacing 0.09-0.17em */
}
:root[data-theme='light'] { --v-clear:#137a3e; --v-monitor:#8a5200; --v-danger:#c01d33; --v-info:#1a5fc2;
  --l-agent:#5b44d6; --l-crew:#b8266f; --l-human:#4f6275; --l-burn:#b8520f; }
```

- **Colour jobs are exclusive:**
  - verdict colours on verdict chips, pills and guard rows
  - label colours on glyphs and flow bars
  - direction colours on candles, P&L and the buy/sell split
  - burn orange on Burn surfaces
  - Buy on `--brand`, and Sell neutral
- **Theme:** dark only (owner decision, Sep 30). There's no light palette and no theme toggle in Settings; revisit only if users ask.

| Verdict | Icon | Word | | Label | Glyph |
|---|---|---|---|---|---|
| Clear | shield-check | CLEAR | | Declared agent | solid robot, "Declared" |
| Monitor | eye | MONITOR | | Likely agent | outline robot + confidence % |
| Danger | octagon-x | DANGER (plus a 1 px border for 3:1) | | Crew | linked rings + crew tag |
| Info | info-circle | INFO (playbook rows, e.g. a fixed tax ≤ 5%) | | Human | person (off on the chart by default) |

### 7.2 Typography

| Role | Face | Use |
|---|---|---|
| Display | The site's sans (`--font-display`), weight 400, tight tracking (−0.035em) | Titles, the hero, big numbers |
| Wordmark | The EKO mark (echo rings, 1.25 px stroke) plus "EKO" in the site's bold sans | Header, favicon, OG images |
| UI | Geist | Everything else |
| Labels | `--font-mono`, uppercase, 0.09–0.17em tracking | Section labels ("01 / RADAR"), table headers, meta rows |
| Data | Geist Mono, tabular, slashed zero | Prices, sizes, hashes, addresses, countdowns |

**Type scale (app):** six sizes only: 12 meta · 13 labels · 14 body and tables · 16 section headings · 24 key figures · page titles in the display face at 52–76 px (Desk; they scale with the window), plus `--fs-hero: 56px` for marketing surfaces. Body copy is never below 14 px; 12 px is for timestamps and captions. This replaces the SignalOS 10–40 px scale, which left most of the interface at 12–13 px with nothing between that and the page title.

**Surfaces:** groups separate by tone (page `#000`, surface, raised) rather than a border around every box; borders are for controls and table rules. Radii: 6 controls · 8 inputs · 12 surfaces. The Anton and Bricolage imports are removed. **Keep it sleek:** the site's noise and glitch effects are for marketing surfaces only. The terminal uses at most a faint static texture on empty states; never on numbers, verdicts, the trade panel or disclaimers.

### 7.3 The mascot (the ghost in the signal)

- **Poses:** listening (default), pinging with echo rings (alerts; approvals empty), resolving from static into rings (scanning; Deep Research), faded (empty or quiet), clipboard (trial recap).
- **Asset:** inline SVG in `Mascot.tsx`, ≤ 6 KB each, `aria-hidden`, 64–160 px.
- **Where it appears:** empty states, the trial recap, 404, long jobs, onboarding.
- **Never:**
  - in the trade panel, guard results, approval cards or kill dialogs
  - beside a Clear verdict, or holding or pointing at a coin
  - animated by data changes

### 7.4 Accessibility (WCAG 2.2 AA)

- **Contrast:** text ≥ 4.5:1 (large ≥ 3:1); UI parts and marker glyphs ≥ 3:1 against both chart backgrounds. `tokens.contrast.test.ts` checks every token pair in both themes.
- **Semantics:** every verdict, label and direction carries a word. Chips, markers and pills are real buttons with descriptive labels. Approvals and trade results announce through `aria-live` (refusals use `assertive`).
- **Keyboard:** SignalOS's shortcuts (`/`, `⌘K`, `Esc`, `?`), plus `1–8` for timeframes. Visible focus rings. Targets are at least 24 × 24 px with a mouse (WCAG 2.2 AA, as the approved prototype) and at least 44 × 44 px on touch screens (`@media (pointer: coarse)`), so the desktop stays dense and phones stay tappable.

### 7.5 Motion rules

- **Tokens:** SignalOS's 120/200/360/640 ms and easings; everything goes to 0 under reduced motion (system setting or Settings via `data-motion`).
- **Allowed:** row entry (200 ms), FLIP rank changes (at most once per 2 s per card), a 360 ms value flash (at most once per 2 s per cell), one pulse on the approvals badge, countdown rings, and the dithered activity and risk marks (§3.2).
- **Changed on review (Sep 30):** the earlier rule "nothing makes one coin look more exciting than another" is relaxed for the dithered marks, at the product owner's request. Guardrails: the shimmer describes activity only, never touches the Trade button, never appears on a Danger coin, sits beside a legend saying it is not a reason to buy, and stops under reduced motion. Revisit with counsel before launch.
- **Forbidden:** celebratory motion on trades, anything on or around the Trade button, and shaking on refusals.

### 7.6 Icon set

Extend `components/icons.tsx` (24 px grid, 1.6 stroke, round caps, the existing `P` props):

| Group | Icons |
|---|---|
| Verdicts | `IconShieldCheck`, `IconTriangle`, `IconOctagonX`, `IconInfo` (exists) |
| Labels | `IconRobot`, `IconRobotOutline`, `IconCrew`, `IconPerson`, `IconFlame` |
| Terminal | `IconRadar`, `IconPairs`, `IconFeed`, `IconBag`, `IconEye`, `IconScan` |
| Mission | `IconAgent`, `IconApproval`, `IconPower`, `IconKey`, `IconJournal`, `IconFlask`, `IconResearch`, `IconPolicy` |
| Trust and utility | `IconReceipt`, `IconChainLink`, `IconBell`, `IconEcho`, `IconCopy`, `IconShare`, `IconQr`, plus the existing `IconExternal`, `IconCheck`, `IconAlert`, `IconLock`, `IconSun`, `IconMoon` |

## 8. Copy and disclaimers

All strings live in `src/copy/`.

```ts
export const DYOR = 'DYOR · Not financial advice · AI-generated analysis';
export const NON_AFFILIATION = 'Not affiliated with, endorsed by, or officially connected with Robinhood Markets, Inc.';
export const BUILT_ON = 'Built on Robinhood Chain';
export const ADVISORY = 'Advisory: your agent is told to check with EKO before every order. Robinhood’s own trade approvals, when they’re on, remain the enforced stop.';
export const ENFORCED_ONCHAIN = 'Enforced on-chain by this agent’s session-key policy.';
export const ONCHAIN_ADVISORY = 'Advisory for now: on-chain enforcement turns on after its contract review passes.';
export const APPROVAL_UNAVAILABLE = 'This order needs approval, which is available from token day on the Reader tier and above.';
export const BURN_WALLET = 'Burned daily from a public burn wallet; every transaction posted.';
export const BURN_DISCLOSURE = 'Daily burn buys pay the token’s 2% fee (Pons 1% + 1% creator tax) like any buyer; see the monthly note.';
export const FEE_TO_BURN = (pct: string) => `${pct} → burn wallet (burned daily)`;   // e.g. "0.5% → burn wallet (burned daily)"
export const FEE_CURVE_ZERO = '0% on Pons-curve trades';
export const BETA = 'Beta · forecasts are graded against all launches';
export const REAL_FUNDS = 'Real funds · your wallet signs every trade';
```

| Line | Placements |
|---|---|
| `DYOR` | Coin card footer, scan result, bag report (and the shared page), Radar and Feed footers, Deep Research note (top and bottom), trade panel fine print, the Inside widget, the Clear badge |
| `NON_AFFILIATION` + `BUILT_ON` | The sidebar footer (desktop), the More sheet (mobile), landing footer, all `/legal/*`, Connect steps 1 and 4, Settings → About, every share page |
| Fee disclosure (**before the tap**, in `FeeLines`, always from the quote's `fee`) | Launch week (T → D0): "Terminal fee: 0% during launch week." From D0, Uniswap routes: "Terminal fee 0.5% ($0.50) → burn wallet (burned daily)." With a tier: "Terminal fee 0.4% (Reader) → burn wallet (burned daily)." Pons-curve routes (no curve fee at launch): "Terminal fee: 0% on Pons-curve trades." |
| `ADVISORY` | Agent badge tooltip, the policy banner, the soft-kill dialog, the approval page, Connect step 4, and every journal preflight row for non-on-chain agents |
| `ENFORCED_ONCHAIN` | Only where `Agent.guardrails === 'enforced'` |
| `ONCHAIN_ADVISORY` | On-chain agents while `Agent.guardrails === 'advisory'` (until the session-key module's review passes): badge tooltip, policy banner |
| `APPROVAL_UNAVAILABLE` | Activity rows with `deny: approval_unavailable`; the `approvalAboveUsd` field without the approvals feature (§3.13, §3.14) |
| `BURN_WALLET` | The Burn Board page header, always; the hero card; the ticker's tooltip |
| `BURN_DISCLOSURE` | The Burn Board page, always; the hero card's detail line |
| `BETA` | Ape Score, setup grade, crowding, Feed swarm calls, Ask the Swarm, the Desk, Arena personas. The `BetaTag` and confidence also go on every flow display while `flow.beta` is set (§3.0) |
| Pre-launch wording | `/drops` and the plan page use "planned" or "shipping in Drop N"; never "live" until the flag is on |

- **Robinhood references:** "Robinhood" appears only in the factual phrases in `copy/robinhood.ts`: "Robinhood-connected agent," "your Robinhood connection," "Robinhood's own approvals," "Open Robinhood to disconnect," "Built on Robinhood Chain," and the non-affiliation line. There are no Robinhood logos, feathers or brand green, and never "Hood" or "$HOOD."
- **Forbidden phrases** (FACTS §6): `copy.test.ts` scans `src/copy/**` and `marketing/**` and fails the build on a match:

```ts
const FORBIDDEN = [/price support/i, /\bfloor\b/i, /\bbid\b/i, /our chart gets bought/i, /number go up/i,
  /strict(ly)? (guardrail|enforced)/i, /guaranteed?/i, /rug-?proof/i, /100% safe/i, /win rate/i, /\balpha\b/i,
  /never lose/i, /\bthe only\b/i, /first ever/i, /partner(ed|ship)? with Robinhood/i, /\$HOOD/i, /\bHood\b/,
  /\bHood Chain/i, /29M agents/i, /express this view/i,   // \b keeps "Robinhood Chain" legal
  /only way out/i, /only leave as a burn/i, /leaves? only as a burn/i,
  /buys? the dip/i, /speeds? up on dips?/i, /dip accelerator/i,                  // dip-buying is never pitched (FACTS §6)
  /trustless burns?/i, /automated burns?/i, /\baudited\b/i,                      // v2: launch burns are manual; no paid audit
  /ownerless/i, /(no ?one|nobody) can touch/i];                                  // v2: never said of the burn wallet (FACTS §5, §6)
// A line marked `// copy-allow: <reason>` is exempt after review (e.g. negations in /legal).
// Launch burn copy says "Burned daily from a public burn wallet; every transaction posted" (BURN_WALLET; FACTS §5, §6).
// Review wording: "AI-assisted and automated review, not a professional audit." Never "audited."
// Drop 7 engine copy (§3.10.1) gets its own copy review; until then these patterns apply to all burn copy.
// Separate assertion: "enforced" about OUR guardrails appears only under copy/guardrails.ts `onchain`;
// "the enforced stop" (Robinhood's own approvals, in ADVISORY) is the one allowlisted phrase.
```

## 9. Security on the client

- **Untrusted text** always goes through `UntrustedText`. That covers token names, symbols, descriptions, socials, X posts, agent journal payloads and model output.

```tsx
export function UntrustedText({ value, max = 64 }: { value: Untrusted; max?: number }) {
  const text = clean(value.text).slice(0, max); // strips C0/C1 controls, bidi overrides (U+202A–202E, U+2066–2069), zero-width chars
  return <span className="untrusted" translate="no">{text}{value.truncated || value.text.length > max ? '…' : ''}
    {value.flags.map((f) => <FlagChip key={f} flag={f} />)}</span>;
}
```

  - It's a React text node only: no `href`, linkify, markdown or HTML.
  - Flag chips: "Contains a link (not clickable)," "Contains text aimed at AI agents," "May impersonate another project."
  - Untrusted text never goes into `document.title` or meta tags, and reaches the clipboard only via an explicit "Copy text."
- **Forbidden APIs:** SignalOS has no ESLint, so `security.test.ts` greps `src/` and fails on `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function(`, `javascript:` and `maxUint256`. SignalOS has none today.
- **Links:** hrefs come only from `/config` allowlists (the explorer, perps venues, docs) or internal routes, with `rel="noopener noreferrer"`. Route addresses are validated with `isAddress` before any request.
- **Images:** token logos from metadata are never loaded. Coins get identicons derived from their address.
- **No secrets on the client:**
  - only `VITE_*` public values; no keyed RPCs
  - API keys shown once and never persisted
  - the service worker never caches `/v1/*`
  - localStorage holds only UI prefs, onboarding, `eko.ref` and pending tx hashes
- **Approvals and kills:** never triggered by URL parameters; always a tap plus a confirm.
- **CSP** (response header from the web host):

```
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob: https://api.{{DOMAIN}};
font-src 'self'; connect-src 'self' https://api.{{DOMAIN}} wss://api.{{DOMAIN}} <VITE_RPC_URL origin>
  [+ https://*.walletconnect.org wss://relay.walletconnect.org once WalletConnect is on]; media-src 'self'; worker-src 'self';
manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```

- **CSP notes:**
  - `/embed/*` sends `frame-ancestors *`.
  - Trusted Types (`require-trusted-types-for 'script'`) runs report-only at T and is enforced from D0 if clean.
  - React style props and lightweight-charts style through the CSSOM, which `style-src 'self'` allows. `csp.spec.ts` fails on any violation.
  - Also sent: `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and a restrictive `Permissions-Policy`.

## 10. Feature flags and Drops

- **Source:** `GET /config` returns `flags` [CA-9], read with `useFlag(name)`. `FlagName` is **one union from `packages/shared`**, with exactly the values below; the frontend never adds its own. When a flag is off, the route renders NotFound, nav links are absent, and the lazy chunk isn't fetched.
- **Flipping a flag** is a backend config change, not a deploy.

| Stage | Flags |
|---|---|
| D0 | `approvals`, `mission_kill`, `policy_editor`, `unchecked_orders`, `loop_lab`, `deep_research`, `perps_panel`, `summon_x`, `beat_the_swarm`, `clear_badge`, `burn_board`, `onchain_guardrails`, `packs_chatgpt_openclaw` |
| D0+1 | `tiers_active`, `trial`, `referrals` |
| Drop 1 | `afi`, `x402_api`, `agent_annotations`, `lenses`, `agent_flow_tools` |
| Drop 2 | `rug_ring_radar`, `leaderboards` |
| Drop 3 | `arena` |
| Drop 4 | `desk_live`, `ask_the_swarm` |
| Drop 5 | `agent_launcher` |
| Drop 6 | `loop_lab_pro`, `stocks_lane` |
| Drop 7 | `eko_score`, `eko_inside`, `burn_engine` (automated Burn Engine, gated on review; §3.10.1) |
| Drop 8 | `chain_base` (adds Base to wagmi `chains`) |
| Drop 9 | `institutional_pack`, `marketplace`, `eko_agent` |

> **v2: `burn_engine` is new.** It's added to the `FlagName` union under Drop 7. **The backend must add it too:** `FLAG_STAGES['Drop 7']` in `packages/shared/src/flags.ts` (Backend §21.4) must include it, because the frontend never adds a flag of its own. `burn_board` stays D0; in v2 it gates the manual-mode Burn Board.

**Gates that aren't flags:**
- **T has no flags.** The T surfaces, including the Mission Control base routes (agents list, agent detail, journal, Connect), are always on. Only their D0 sub-features are flagged.
- **Live trading:** the backend's `trading_live` flag is the runtime kill switch, the `LIVE_TRADING_ENABLED` env var is its hard ceiling, and `trading_allowlist(wallet, cap_usd)` admits team and beta wallets first. None of these is a client `FlagName`. The client sees the result as `config.trading.liveEnabled` and as quote errors (§3.6).
- **Phase:** `config.phase` is `'launch_week'` at T, `'token_live'` from D0, and `'tiers'` from D0+1 (with `tiers_active`).
- **Census numbers** follow `GET /census` `gated`. **v4 and Pons execution** follow the quote's `route.executable` (§3.6). **Packs** (including the Claude Desktop and claude.ai fallback to D0) follow `/packs` `stage` (§3.17). **The Burn Board's mode** follows `BurnStats.mode`, and engine mode also needs `burn_engine` (§3.10).
- **WalletConnect and web push** turn on with `approvals`, because their D0 job is answering approvals on a phone.

**Demoing hidden features:**
1. **Dev and staging:** `?flags=+arena,-burn_board` overrides flags when `VITE_ENV !== 'prod'`. The override is kept in sessionStorage with a persistent "Flag override" banner.
2. **Prod demo sessions:** for demo videos and KOL previews, a backend-signed demo link (`/demo/:token`) turns flags on for that session only [CA-9].
   - Every flagged surface shows "Demo · not live yet · shipping in Drop N."
   - Share buttons are disabled, and analytics carry `demo: true`.
3. **`/drops`** embeds the recorded demos.

A Drop's frontend is ready when its E2E suite is green with the flag on (§13).

## 11. Analytics events

- **Pipeline:** first-party only. Events are batched through the SignalOS telemetry path to `POST /telemetry {events}` [CA-24]. No third-party trackers.
- **Common props:** `ts`, `route`, `sessionId` (sessionStorage), `buildSha`, `tier`, `trial`, `demo`, `device`.
- **Never sent:** wallet addresses, untrusted text, keys, or exact amounts (only size buckets).

| GTM KPI | Events |
|---|---|
| Visitors, scans run | `landing_view`, `page_view`, `scan_submitted {source}`, `scan_result_viewed {level}` |
| Wallets connected | `wallet_connect_started`, `wallet_connected {connector}`, `network_switched`, `siwe_completed` |
| Bag reports shared | `bags_scanned {holdings, danger}`, `bag_report_shared {channel}` |
| Trial → first trade | `trial_started`, `trade_quote_viewed {decision}`, `trade_tap`, `guard_refused {checks}`, `guard_warning_ack {codes}`, `trade_submitted`, `trade_confirmed {venue, sizeBucket}`, `trade_failed {code}` |
| Trial → holder | `trial_recap_viewed`, `upgrade_prompt_viewed {feature, requiredTier}`, `plan_viewed` |
| Referrals | `referral_landing`, `referral_link_copied` |
| Agents connected | `agent_connect_started {platform}`, `agent_key_created`, `mcp_config_copied {platform}`, `first_preflight_seen {secondsSinceKey}` |
| Approvals answered | `approval_viewed {source: push/telegram/web}`, `approval_decided {decision, secondsToDecide}` |
| Rule Lab runs, kill switch uses | `loop_compiled`, `backtest_run {source}`, `kill_used {mode, scope}` |
| Retention, Drops | `alert_opened`, `watch_added {kind}`, `pwa_installed`, `push_enabled`, `drop_demo_played {drop}`, `drop_surface_viewed {drop}` |

## 12. Performance budgets and PWA

| Budget | Target | Measured by |
|---|---|---|
| Landing JS (no wagmi) / embeds | ≤ 90 kB / ≤ 30 kB gzip | Vite build report; CI fails over budget |
| App shell initial JS | ≤ 220 kB gzip (SignalOS main chunk today: 188 kB) | same |
| Route chunks | ≤ 80 kB gzip; the chart only on the coin view | same |
| LCP / INP / CLS (landing, mid-tier phone, 4G) | ≤ 2.0 s / ≤ 200 ms / ≤ 0.05 | Lighthouse CI + field telemetry |
| Paste → verdict | ≤ 3 s p50 (indexed); new pairs within Fast Scan p95 ≤ 5 s | `ui.scan_to_verdict_ms` |
| WS event → paint | ≤ 50 ms p90 (SignalOS measured 13 ms p50) | `ui.ws_event_to_paint_ms` |
| Quote round-trip / chart ready | ≤ 800 ms p50 / ≤ 300 ms after data | `ui.quote_roundtrip_ms`, `ui.chart_load_ms` (existing) |
| Radar frame with 100 cards at 5 ev/s | ≤ 16 ms | Playwright trace |
| Approval link → buttons ready (warm PWA) | ≤ 1.5 s | `ui.approval_open_ms` |

**PWA** (installable at T; push from D0):
- **Manifest:** `EKO`, `display: standalone`, `start_url: /mission?src=pwa`, background `#05121c`, icons 192/512/maskable. `shortcuts`: Approvals, Scan, Radar.
- **Service worker** (`src/sw.ts`, `vite-plugin-pwa` `injectManifest`):
  - Precache the shell; fonts cache-first.
  - `/v1/*` and OG images are network-only.
  - An offline page: "You're offline. Approvals need a connection."
- **Web push:**
  - Permission is requested only after a tap in Settings, then `POST /push/subscriptions` with `config.vapidPublicKey` [CA-22].
  - The payload is only `{type:'approval', id}` plus generic text.
  - `notificationclick` opens `/approve/:id`.
  - iOS supports push only for installed PWAs (16.4+), so iOS Safari shows "Add to Home Screen" steps first.
- **Install prompt:** `beforeinstallprompt` is offered after the first approval or from Settings, never on the first visit.

## 13. Testing

**Unit tests** (vitest, in the `lib/instant.test.ts` style with fakes):
- `tradeFlow.test.ts`: every branch of §4.3. That's allow, warn and its ack, refuse (wallet never called), a material change, approval exactness, calldata mismatch, a reported rejection, confirmed and failed, busy on a double tap, and pending-hash replay.
- `realtime.test.ts`: refcount and grace, the LRU cap, `seq` gaps → resync, backoff bounds, hidden-tab drops.
- `untrusted.test.ts`: `<img onerror>`, `javascript:`, markdown links, bidi overrides, zero-width joins, 10 KB strings and "ignore previous instructions" all render inert.
- Also: `copy`, `security`, `tokens.contrast`, `markerMath` (from `signalMath.test.ts`), `csv`, `entitlements` (tier × phase × trial) and `policyForm`.

**Playwright E2E** (extend `apps/web/e2e`, keeping `mockWallet.ts`, `boot()`, the dev-route fixtures [CA-27] and the desktop, mobile and shots projects):

| Suite | Covers |
|---|---|
| `terminal.spec.ts` (replaces `journey.spec.ts`) | Paste → verdict → coin view; injected markers; Radar updates; a Pairs graduation move; stale banner and recovery |
| `trade.spec.ts` | Refuse with zero wallet calls; warn and ack; tap → submitted → confirmed; a double tap → one order; wrong network; SIWE; paused, not-allowlisted and quote-only states with zero wallet calls; the 0% Pons-curve fee line; with the D0 config, the "0.5% → burn wallet (burned daily)" line on a Uniswap route; a `fee.destination` that isn't the burn wallet → `calldata_mismatch` with zero wallet calls |
| `burn.spec.ts` | Manual mode: the countdown to `nextScheduledBurnAt`, the late state and its clearing by a `burns` event, the launch burn row, Pons buyback totals, no engine UI with `burn_engine` off; engine mode only with `burn_engine` on (Drop 7) |
| `connect.spec.ts` | The Claude Code path (key shown once); the Claude Desktop and claude.ai connector card with the Customize → Connectors steps and no key; the connector card absent when the pack's `stage` is D0 |
| `bags.spec.ts` | Connect → report → share page renders without a wallet and without the address |
| `mission.spec.ts` | Key shown once (the storage dump has no key); first preflight; policy 409; approve and deny; expired approval; soft and hard kill |
| `mobile.spec.ts` (extends) | Bottom tabs, a docked trade sheet, `/approve/:id` on Pixel 7 |
| `onboarding.spec.ts` (rewrite) | The tour offered after the first scan; progress persists |
| `share.spec.ts` | Raw HTML for `/scan/:id` contains the og and twitter tags (`request.get`, no JS) |
| `flags.spec.ts` | Drop routes 404 with flags off, render with an override, show the demo banner |
| `a11y.spec.ts`, `csp.spec.ts` | axe on the main screens in both themes (zero serious issues); no CSP violations |

**Mainnet-fork E2E:** extend `run-fork.sh` (Anvil fork of 4663; `FORK_URL` = the paid dRPC endpoint) and `live.fork.spec.ts`. Fixtures are pinned to blocks from the eval corpus:
1. A honeypot is refused, and the mock wallet records no send.
2. A Danger playbook is refused even in Degen.
3. A Pons curve ETH buy needs no approval. **Conditional:** it runs as a buy only if the Pons ABIs are verified by Oct 2; otherwise it tests the quote-only state (`route.executable === false`, the link-out, and zero wallet requests). Once it runs as a buy, its receipt logs show no terminal fee transfer in any config, because Pons-curve trades carry no terminal fee at launch.
4. A v3 sell leaves the allowance equal to the amount after its exact approval.
5. A mutable-tax coin warns in Balanced and is refused in Safe.
6. A wallet rejection is recorded.
7. A revert shows "gas was spent" copy.
8. A reload between sign and report replays the hash to confirmed.
9. An active anti-snipe tax warns, then re-quotes automatically after decay.
10. Once v4 routes are enabled: exact two-step Permit2.
11. With the D0 config, a v3 buy's receipt logs show the 50 bps fee transfer to the burn wallet address from `/config`, and nothing else.

**Visual checks:** `toHaveScreenshot` baselines (`maxDiffPixelRatio: 0.01`, dynamic regions masked) for the verdict and label sets, the coin card, the trade sheet in allow, warn and refuse, the scan result, the bag report, the approval card and the Burn hero. Each is taken dark and light at 1440 and 390 px.

**T acceptance checklist:** all §3 T criteria and §12 budgets green in CI; fork cases 1–9 green (case 3, the Pons curve, is conditional on the Pons ABIs being verified by Oct 2; otherwise it tests the quote-only state); zero serious axe issues; the copy and security tests pass; the Census shows the gated state; the first team-wallet live trades (through `trading_allowlist`) are observed end to end before live trading opens to everyone.

**D0 acceptance checklist:** the Mission, approvals, kill, policy, Rule Lab, research, perps and burn (manual mode) suites green; fork case 11 green; push works on Android Chrome and an installed iOS PWA; Drops 1–3 green with flags on, and recorded demos for Drops 1–7 (Drops 8–9 are demoed before their release); the tier gate matrix passes with `tiers_active` toggled (a D0+1 rehearsal).

## 14. Build order and milestones

| Window | Milestone | Deliverables |
|---|---|---|
| Sep 30 – Oct 1 | **M1 Strip and skeleton** | Removals (§1.2); tokens, icons, `UntrustedText`, `VerdictChip`, `copy/` with tests; the route table, `realtime.ts`, the `api.ts` base URL; mocks for every CA shape |
| Oct 2 – 3 | **M2 Terminal read path** | Landing and scan, Radar, Pairs, Feed, the coin view (chart, `FlowLayer`, card), Scoreboard, receipt verify, the Census gated state |
| Oct 4 – 6 | **M3 Trade and harness preview** | `tradeFlow.ts` and the panel, with the paused, not-allowlisted and quote-only states; SIWE and the switch; the fork suite; Bags and share; Watch; the Mission harness preview (agents; Claude Code and generic Connect from `/packs`; the Claude Desktop and claude.ai connector card, targeted for T with a D0 fallback if the Oct 2 OAuth check fails; keys, journal, presets); Settings, including "Delete my harness data"; disclaimers; the PWA manifest |
| Oct 7 – 12 | **M4 Closed beta** | Beta build to waitlist trenchers, agent owners and partner groups; tour, analytics, CSP, a11y and perf passes; RC Oct 11; go/no-go Oct 12 |
| **~Oct 13** | **T** | The T checklist green; live trading for `trading_allowlist` wallets (team first, then beta), then everyone |
| Oct 14 – 19 | **M5 D0 surfaces** | Mission v1 (approvals, `/approve/:id`, kill, policy editor, unchecked orders); ChatGPT, OpenClaw, on-chain and perp Connect paths (plus the Claude Desktop and claude.ai connector if it fell back to D0); Rule Lab; Deep Research; perps; Burn ticker, hero and page (manual mode, with the launch burn); Beat the Swarm; Clear badge; push; WalletConnect; plan, trial and referral UI (dormant) |
| Sep 30 → D0 (spare capacity) | **Drop surfaces** | Drops 1–3 complete behind flags; Drops 4–7 demo-ready; demo videos recorded for Drops 1–7 (Drops 8–9 are demoed before their release) |
| **~Oct 20** | **D0** (gate-based) | D0 flags on when the backend gates pass; if D0 slips, the flags stay off and no UI names a date. No UI or copy ever shows the token's launch time, which is internal only |
| ~Oct 21 | **D0+1** | `tiers_active`, `trial`, `referrals` on |
| Weekly from ~Oct 27 | **Drops 1–9** | Per Drop: E2E green with the flag on, then the flag flip. A Drop that isn't green slides a week and is never shipped broken. Drop 7 adds `burn_engine` only if the engine's review is done (§3.10.1). |

## 15. Contract additions requested

These are needed by the frontend and aren't in FACTS §7. The shapes are proposals; the backend owns the final names. **Needed by** is the latest stage at which the frontend can ship without it.

| ID | Addition | Needed by |
|---|---|---|
| CA-1 | The WebSocket envelope in §5; user channels authenticate at the handshake. Payloads are typed by the shared `WsEventMap` in `packages/shared` (channels `radar`, `pairs`, `coin:*`, `flow:*`, `burns`, `alerts`, `agents`, `approvals`, `orders`, `feed`); the frontend imports it and defines no event shapes of its own. The events this spec uses (e.g. `tick`, `entitlements`, `journal`) must be in it | T |
| CA-2 | `GET /feed?cursor&kinds`, WS `feed`, a `FeedItem` type (structured fields, no free text) | T |
| CA-3 | `CoinSummary`, `RadarRow`, `PairRow` types (`PairRow` has `flow`, `antiSnipe` and `verdictPending`); every flow object carries `beta` (with its confidence) while label precision is under 90%; `/radar` and `/pairs` return `{rows, cursor, delayedSec}` | T |
| CA-4 | A `tf` enum (`1s`, `15s`, `1m`, `5m`, `15m`, `1h`, `4h`, `1d`) and a `tick {ts, price, volumeUsd, block}` event on `coin:*` | T |
| CA-5 | `POST /scan` and `GET /scan/:id` return `{id, status: ready/pending/not_found/ambiguous, card?, shareUrl, candidates?}` | T |
| CA-6 | A `BagReport` type; `POST /wallets/:address/bags/share {includeValues}` → `{id, shareUrl}`; public `GET /bags/:id`; `GET /og/bags/:id.png` | T |
| CA-7 | `TradeQuote` type: guard `{decision, checks[]}`, `fee: {bps, usd, destination}` (v2: `destination` is the burn wallet address, or `null` when `bps` is 0: launch week, and Pons-curve trades), `binding: boolean`, `amountIn`, `networkFeeUsd`, `valueWei`, `approvals[]`, route, taxes, exit cost, `expiresAt`, `asOfBlock`, and a quote-only marker with a link-out venue for routes not yet enabled for execution (Pons before its ABIs are verified; v4 before its fork suite is green) | T |
| CA-7 | `TradeOrder` type; optional `riskMode` and `account` on `/trade/quote` (no account = indicative, `binding: false`); `acknowledged[]` on `/trade/order`; `/trade/order` returns `{order, tx}`; `POST /trade/order/:id/rejected`; `GET /trade/orders/:id` | T |
| CA-8 | A standard error body `{error, message, requiredTier?, retryAfterSec?}` plus the error code list (§4.3, §4.6), including `wallet_auth_required` (401), `forbidden` (403), `conflict` (409), `trading_paused`, the not-allowlisted code and `trade_cap_exceeded` (with the wallet's `cap_usd`); `approval_unavailable` as a preflight `deny` reason | T |
| CA-9 | Public `GET /config`: `flags` (keys are the shared `FlagName`), `phase: 'launch_week' \| 'token_live' \| 'tiers'`, `tiers[]` (`minBalance` = `{{TIER_AMOUNTS}}`, `feeBps`, limits, dated perks), `trading` (`liveEnabled`, `maxTradeUsd`, `routers`, `spenders`), contracts (receipts; `burnEngine` only from Drop 7), public `wallets: { burn, dev }` (Backend v1.2, BE-6) for the fee-destination check and chart flames, Burn Board thresholds (`heroPctSupply`, `heroUsd24h`), `drops[]` (each with `status: 'hidden' \| 'demo' \| 'live'`), top-level `vapidPublicKey`, `loops.maxBars`, example scans | T |
| CA-9 | Signed demo sessions (`/demo/:token`) that turn flags on for one session only | T |
| CA-10 | A `/me` shape: account, entitlements, `trial {status: 'eligible' \| 'active' \| 'used' \| 'ineligible' \| 'not_open', reason?, endsAt?}`, `holdings.minBalance24h`, `referralCode`; `GET/PUT /me/preferences` (mode, slippage, presets, confirm threshold, onboarding) | T |
| CA-10 | `Entitlements.feeBps` is typed `50\|40\|30\|25` but must also allow `0` for launch week (T → D0, per FACTS §5) | T |
| CA-11 | SIWE nonce `{nonce, domain, uri, issuedAt, expirationTime}`; `ref?` on verify; cookie `HttpOnly; Secure; SameSite=Lax; Domain=.{{DOMAIN}}`; CORS with credentials; a WS Origin check | T |
| CA-12 | `GET /referrals` → `{code, link, referred, qualified, bonusMinutes}`; an `entitlements` event on `alerts` | D0+1 (capture at T) |
| CA-13 | `GET /me/trial-recap` → `{rugsFlagged, ordersStopped, alertsFired, items[]}` | D0+1 |
| CA-14 | A Census type: `{gated, reason?, methodologyUrl, chain[], coins[], asOf}` | T |
| CA-15 | Scoreboard `kind` enum (`calls`, `honeypots_refused`, `honeypots_missed`, `cohort`, `milestones`), row types, counters `{refused, missed, since}` | T |
| CA-16 | Receipt proof fields (`leaf`, `proof[]`, canonicalization version) and the receipts contract ABI; later, `POST /receipts/:id/reveal` (owner reveal) | T |
| CA-17 | **v2 `BurnStats`** (Backend v1.2 §23):<br>• `mode: 'manual' \| 'engine'`<br>• `burnWallet: {address, balanceUsd, nextScheduledBurnAt}`<br>• `ponsBuybacks: {tokens, usd, count24h}`<br>• the existing totals (`totalBurned`, `pctSupplyBurned`, `burns24h`, `recent`)<br>WS `burns` carries the manual burn events.<br>**Resolved in Backend v1.2 (§23):** every burn is a `BurnEvent` with `kind: 'daily' \| 'launch' \| 'engine'`, `signer`, `txHash` (the burn), `buyTxHash?`, `method`, `pctSupply` and `block`. The launch buy-and-burn is the event with `kind: 'launch'`.<br>`engine?: BurnEngineInfo` stays optional and is read only in Drop 7 engine mode (§3.10.1): `address`, `phase: 'curve' \| 'switching' \| 'pool'`, `renounced`, `tuningEndsAt`, `taxPaid?` | D0 (`engine`: Drop 7) |
| CA-18 | Keys: `GET /agents/:id/keys`, `DELETE /agents/:id/keys/:keyId`; create returns `{keyId, prefix, secret}` once | T |
| CA-18 | `GET /agents/:id`; `Agent.guardrails: 'advisory' \| 'enforced'` (on-chain agents stay `advisory` until the session-key module's review passes); `cursor` and `kind` on `GET /agents/:id/journal` | T |
| CA-18 | An `UncheckedOrder` type; `GET /approvals/:id` with `Approval.detail`; idempotent decisions | D0 |
| CA-18 | `POST /agents/kill-all`; resume via `PATCH /agents/:id {status}`; hard kill returns `{kind:'deeplink', url}` (Robinhood-connected, after the server has revoked the harness keys and set `disconnected`) or `{kind:'tx', tx}` | D0 |
| CA-18 | `POST /agents/:id/session-key` → tx; optional `GET /agents/:id/summary` (exposure, policy hits, health) | D0 |
| CA-19 | `GET /packs` → per-platform `{stage, version, configTemplate, instructions}`. Templates carry `{{API_KEY}}` (and, optionally, `{{MCP_URL}}`) placeholders and point at `https://mcp.{{DOMAIN}}/mcp`. The Claude Desktop and claude.ai pack (`claude_connector`) uses MCP OAuth (no key): its `configTemplate` carries the connector URL, plus `projectInstructions` and a plan note (Free allows one custom connector; on Team and Enterprise an owner adds it first). The OAuth consent page (SIWE plus "pick or create an agent") is served by the backend's OAuth server on `mcp.{{DOMAIN}}` (BE-3); confirm whether the web app should render it instead (§3.17). Its `stage` is T (targeted), or D0 if the Oct 2 OAuth check fails | T |
| CA-20 | `LoopSpec`, `BacktestResult` and `Bar {ts, o, h, l, c, vUsd}` types; max bars; sync vs job semantics | D0 |
| CA-21 | `ResearchJob {status, steps[], note?, receipt?, refunded?}` and the note schema | D0 |
| CA-22 | `POST /telegram/link` → deep link (T); `POST`/`DELETE /push/subscriptions` (D0) | T / D0 |
| CA-23 | A perps context type with a venue list (URL, availability note) | D0 |
| CA-24 | `POST /telemetry {events[], samples[], error?}` (extends SignalOS `/api/telemetry`) | T |
| CA-25 | A keyless read-only RPC proxy (`/v1/rpc`, allowlisted methods), or confirmation that the public RPC suffices | T |
| CA-26 | The web host injects share meta into `<!--eko:head-->` and sets the §9 headers per path | T |
| CA-27 | Dev-only fixture routes (card, verdict, marker, pair, feed, journal, approval, order, burn), as SignalOS's `/api/dev/signals/inject` | T (week 1) |
| CA-28 | The watch body `{kind: coin/wallet/crew, target}` and the `AlertSettings` schema (including `agentTradeAboveUsd`) | T |
| CA-29 | Drop endpoints before each flag flips: AFI (`/afi`, history, WS `afi`), crews and graph, Arena, Desk runs and WS `desk:{runId}`, Launcher bundles, Inside config and partner keys, Beat the Swarm, Clear badge status | per Drop (Swarm and Clear badge at D0) |
| CA-30 | `DELETE /me/data` (harness data deleted on request) | T |
| CA-31 | Accepted (definition: 04-BACKEND §7.7): optional `signal` (five readings + composite, beta) on `RadarRow` and `CoinCard`, `RadarRow.spark8h` and `change24hPct`, and `flow.declaredAgentPct`/`likelyAgentPct`, so Radar, the inspector and the coin view can show what the approved prototype shows; the UI hides each when absent | T |
