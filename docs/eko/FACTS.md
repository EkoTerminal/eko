# Canonical facts and shared contracts (source of truth for the handoff suite)

> **Owner decisions 2026-10-05 override this sheet wherever they conflict:** no token burns, buybacks or milestone buys (no burn wallet, daily burn, launch buy-and-burn, Burn Board, Burn Engine or milestone timelock); no bug bounty; Terms and Privacy approved; policy and privacy questions go to the official X and Telegram accounts listed on `/official`; no closed beta (public launch Tue Oct 13). See the block at the top of `05-GO-PLAN.md`.

> **v2.1, 2026-09-30: owner decisions applied, and the name is EKO** (§0–§1).
> - **Fees:** 2% total = Pons 1% standard fee + 1% creator tax.
> - **Burns:** manual daily burns from a public burn wallet at launch; the automated Burn Engine is a later Drop.
> - **Team:** anonymous.
> - **Contract review:** AI plus automated, with no paid audit.
> - **Claude Desktop:** targeted for T via official custom connectors.
>
> This supersedes earlier text where they conflict.

Every handoff document must match this sheet exactly. If it conflicts with anything else, this sheet wins. The detailed source docs are in `../docs/ (outside this repo)`.

## 0. Placeholders (never invent values for these)

| Placeholder | Meaning |
|---|---|
| Name | **Decided (2026-09-30): EKO.** Product and token share the name. Brand: noise turning into signal (static, echo rings, a faint poltergeist presence), matching the EKO site. Earlier drafts used a different working name; it's retired. |
| Ticker | **Decided: `$EKO`.** Collision check 2026-09-30: no live `$EKO` of note, only unrelated dust tokens on Solana and PulseChain. **Copycats already exist on Robinhood Chain:** `EKOX` and `EKOS` (launched Sep 24–27, 79–81% fee-trap pools). Expect more clones once the name is public; they're Ghost Report material. Re-check the day before D0. |
| `{{MAIN_HANDLE}}` / `{{BOT_HANDLE}}` | X handles, pending availability (register now that the name is set) |
| `{{DOMAIN}}` | Undecided |
| `{{TEAM_BLURB}}` | **Decided: fully anonymous team.** There's no team section. Trust comes from public wallets, daily public burns, public receipts, open-source code and weekly shipping. Public-facing docs must never name the team, "SignalOS", "EkoFinance", or any other project by the team. |
| `{{TIER_AMOUNTS}}` | **Decided:** token amounts worth ≈ $50 / $250 / $1,000 at the D0+1 price; reviewed monthly and only ever lowered |
| `{{BUYBACK_SLICE}}` | Pons native-buyback share of the creator's cut of the Pons 1% fee. **Tentative: 25%** (~0.175% of volume, ~$175 per $100k). The team confirms it, and it's locked at creation. |
| `{{PONS_FEE_PCT}}` | **The Pons standard fee is 1%**, split ~70/30 creator/protocol. That's consistent with the owner's real receipts: ~$1,700–2,000 per $100k of volume. |

## 1. One-liners

- **Product:** *The harness your trading agent runs inside:* Senses, Guardrails, Rule Lab, Flight Recorder and Mission Control. Its first application is a trench terminal for Robinhood Chain that scans every new pair for scam playbooks and won't let you buy a honeypot.
- **Tagline options:** "Every move has a cause." · "Less noise. More evidence." · "Give your agent a harness." · "Don't be an echo." · "A signal forms. Certainty doesn't." · "Agent Apps tell agents about the market. EKO tells the market about the agents."
  - **Retired:** "Robinhood gave you an agent…". In-app agents can't install EKO, so it implies an integration. Also retired with the old name: every sheep, flock and bell line.
- **Brand names:** tiers **Listener / Reader / Oracle / Source**; verdicts **Clear / Monitor / Danger** (plus Info on playbook rows); public scam call-outs are **Ghost Reports**; product credits are **EKO Points**; reputation is the **EKO Score**; the partner widget is **EKO Inside**.
- **Positioning vs GMGN and Axiom:** those are cockpits for one human watching one chart. EKO is agent-first: a harness for your agents, plus a radar of many plays at once.

## 2. Verified external facts (as of 2026-09-29/30; always cite)

| Fact | Source |
|---|---|
| Robinhood announced Robinhood Agents at its annual summit on 2026-09-29 (never write "HOOD" in public copy; brand guidelines): build an agent in the app, Loops (standing 24/7 instructions), a dedicated account, trade approvals. **Rolling out** to its ~29M customers (the tweet says "coming soon"). | x.com/RobinhoodApp/status/2105074572722679839; Fortune 2026-09-29; CoinDesk 2026-09-29 |
| In-app agent model choices: GPT-6 Luna (free through end of 2026), GPT-6 Sol, Claude Opus 4.8 | Fortune 2026-09-29 |
| 150k+ agentic accounts opened through Robinhood's Trading MCP since May 2026 (internal only: PYMNTS reports 15k+; never quote publicly) | Fortune |
| External agents supported on Robinhood's MCP include Claude Code, Claude Desktop, ChatGPT, Codex, Cursor, Grok, Perplexity, OpenClaw, Replit and localhost, among others | robinhood.com/us/en/support/articles/agentic-trading-overview/ |
| Robinhood "does not control, supervise, monitor, recommend, or audit these AI agents" | Robinhood newsroom, 2026-05-27: robinhood.com/us/en/newsroom/robinhood-is-now-open-to-agents/ |
| **Robinhood trade approvals are turned OFF by default for MCP (external-agent) accounts**; the user can turn them on | Robinhood support (agentic trading) |
| Robinhood's MCP market data covers any ticker: quotes (20 per call), OHLCV bars over a range, index history, options OHLC, fundamentals, financials over time, analyst targets, Level 2, indicators, earnings history, estimates and upcoming dates, call transcripts, SEC filings, politician trades, news. Lookback and rate limits aren't documented. | robinhood.com/us/en/support/articles/trading-with-your-agent/ |
| **In-app Robinhood agents trade inside the brokerage, not on Robinhood Chain** | Robinhood support; CoinDesk |
| Agent Apps: a marketplace of datasets and tools for agents. The tweet names Quiver, Nasdaq and Unusual Whales. Mobile-only (Robinhood support: /support/articles/agent-apps/). About 9 live and **no public application path found** (per our research). | x.com/RobinhoodApp/status/2105075198869282905; Robinhood support |
| Robinhood Chain: built on Arbitrum technology ("Arbitrum Dedicated Blockchains"), chain ID 4663, first-come first-served ordering, and the sequencer filters sanctioned addresses. Public mainnet since 2026-07-01. ~100 ms blocks and ~1¢ typical transactions are **our on-chain measurements**. The gas subsidy ended around 2026-09-29. | docs.robinhood.com/chain/connecting (chain ID); /chain/differences-from-ethereum (sequencer); KuCoin and crypto.news (mainnet date, subsidy) |
| Pons is the chain's main launchpad (pump.fun-style): ~25k launches on its peak day (2026-09-02), top-4 fees in crypto that day. Creator tax is fixed at creation and can't be raised. Same rate on the curve and in the pool. Native creator buyback is optional. | docs.ponsfamily.com/v2; CoinDesk 2026-09-03 |
| One rug ring took **at least $18.43M across 53 Pons launches** using anti-sniper exemption wallets (per on-chain analyst Wazz) | The Block 2026-09-27; Yahoo/Cryptonomist |
| Nobody publishes an agent share of buying for Robinhood Chain. A widely repeated Solana "34% AI wallets" figure has no source. | Research; Blockonomi |
| ERC-8004 IdentityRegistry is live on 4663 (`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, ~6.5k agents); a ReputationRegistry is also live | On-chain check |
| Existing Robinhood Chain scanners: GoPlus, ScanHood, TrustSwap, Ruginhood, RobinScan, Robinhood Checker. **None** labels AI-agent wallets, names playbooks with crew history, or scans token text for prompt injection. | Tools survey (RESEARCH.md) |
| On 2026-08-31, Pons and GMGN took ~70% of all launchpad and trading-bot fees **across crypto** (crypto.news). GMGN and Axiom have no token (per our research). | crypto.news; research |

## 3. Product (what exists at which stage)

**Engines (L0):**
- **Watcher:** wallet labels (Declared agent / Likely agent / Crew / Human) and flow mix.
- **Normalizer:** coin card; buy-then-sell simulation.
- **Playbooks:** a 13-pattern scam library with deployer and crew history.
- **Swarm:** LLM personas using the naive view; beta until gated.
- **Receipts:** Merkle roots committed on-chain **every 5 minutes** (~$90/mo gas); public items revealed after their window; harness items private and salted.
- **Execution:** guarded, non-custodial.

**Harness (L1):**
- **Senses:** MCP tools.
- **Guardrails:** `preflight`.
  - **Advisory** for external agents.
  - **Enforced** for on-chain agents via session keys, targeted for D0. This ships **only after its contract review passes**; until then on-chain guardrails are advisory.
  - **Approval-required outcomes when the user has no approvals feature** (before D0, or on the Listener tier) return `deny: approval_unavailable`. They never hang.
- **Rule Lab:** compile plus deterministic backtest. Crypto and Robinhood Chain data is ours; **stock data is bring-your-own** via the user's Robinhood MCP.
- **Flight Recorder:** a private journal plus unchecked-order detection.
- **Desk:** multi-agent (Drop 4).

**Mission Control (L2):** agents, web approvals (Telegram only notifies), soft kill (all preflights deny) plus hard kill (deep link to disconnect in Robinhood, or revoke an on-chain session key), policy editor with Safe/Balanced/Degen presets.

**Robinhood's own trade approvals are the enforced stop.** Robinhood's help pages don't state the default for external (MCP) agents, and its in-app Robinhood Agents ship with approvals on (HOOD Summit, 2026-09-29). The harness pack setup tells users to **check they're on**. Once on, they are the enforced hard stop; our preflight is advisory on top.

**Scan-card flow shares** (agent / crew / human %) show with a **beta** tag and confidence until Watcher label precision passes ≥ 90%. Census headline numbers wait for that gate.

**Telegram group bot** at **T**: group scans, caller leaderboard, "Scanned by EKO" group badge.

**Terminal (first application):**
- Radar (ranked by verdict, flow and exit cost), Feed
- new pairs (new / near graduation / migrated)
- coin view (robot and crew markers plus card)
- guarded one-tap trading. Uniswap v3 and the Pons curve at T. **v4, including graduated Pons pools, is targeted for T**; if its fork suite isn't green, graduated coins show quote-only plus a link out until it is.
- Scan my bags, wallet tracking and alerts
- Scoreboard ("honeypots refused" *and* "honeypots missed"), Census (numbers only after label precision ≥ 90%)
- Burn Board, perps panel (link-outs, from token day)

**Scam playbooks (13):**
1. honeypot
2. tax trap (fixed, non-raisable taxes ≤ 5% show as Info)
3. fake or removable liquidity
4. fee-trap pools (15–95% fee tiers)
5. stuck at bonding
6. wash volume to trend
7. clone swarm
8. exemption-wallet insiders (`SnipeTaxExempted`)
9. bundle-and-dump
10. migration dump
11. malicious v4 hook
12. agent bait (prompt injection in token text)
13. serial deployer or crew

**Lanes:**
- **Fast Scan:** seconds, every new pair, rules-based verdict first.
- **Deep Research:** minutes. X context via Grok X Search through OpenRouter, plus Sorsa for bot-follower detection.
- **Stocks lane:** Drop 6; bring-your-own data.

**Perps:** link-outs only, plus a bring-your-own perp agent guide (trade-only keys). No referral fees yet. **We never execute perps.**

**Never:**
- custody, pooled vaults, copy-trading, or auto-trading for others
- personalised advice
- stock-token trading
- hosted perps
- trading inside Telegram
- Robinhood or Hood branding
- the team trading ahead of outputs

## 4. Launch sequence and drops

| Date | Event |
|---|---|
| Sep 30 – Oct 6 | Build week. Day-1 contracts frozen. Backfill of chain history since genesis. |
| Oct 7 – 12 | **Closed beta** (waitlist trenchers, 20–50 agent owners, 10+ Telegram groups) |
| **~Oct 13 (T)** | **Product launch, no token.** Terminal, guarded trading, Scan my bags, harness preview (Claude Code pack, plus Claude Desktop if MCP OAuth is ready, otherwise at D0; tools `coin_verdict`, `coin_card`, `playbook_match`, `preflight`, `journal`), Scoreboard, Telegram group bot, published policies. **Free for launch week, including a 0% terminal fee until D0.** |
| **~Oct 20 (D0, gate-based)** | **Token launch on Pons.**<br>**Gates:** zero honeypot fills, eval gates green, the AI-plus-automated review of the receipts contract done (it holds no funds), bug bounty (up to $500) live.<br>**Also live:** the burn wallet with daily public burns, the $100 launch buy-and-burn, Mission Control v1, enforced on-chain guardrails, ChatGPT and OpenClaw packs, Rule Lab v1, Deep Research, perps panel, summon bots (X via the X API; Farcaster; Telegram), Beat the Swarm, Clear badge.<br>Tiers switch on the next day. |
| ~Oct 27 (D+7) | **Drop 1:** Agent Flow Index, x402 paid API, `agent_flow`/`wallet_label`, agent annotations, lenses. |
| ~Nov 3 | **Drop 2:** Rug Ring Radar (crews), leaderboards |
| ~Nov 10 | **Drop 3:** The Arena, Season 1 (paper, skill-based prizes, no purchase needed) |
| ~Nov 17 | **Drop 4:** The Desk live, Ask the Swarm |
| ~Nov 24 | **Drop 5:** Agent Launcher (your own agent on *your own* Akash or VPS box) |
| ~Dec 1 | **Drop 6:** Rule Lab Pro (shadow, stress, model comparison) plus the stocks lane |
| ~Dec 8 | **Drop 7:** EKO Score (ERC-8004) plus EKO Inside (widget and partner API), plus the **automated Burn Engine** if its review is done (otherwise it moves to a later drop) |
| ~Dec 15 | **Drop 8:** Base expansion |
| ~Dec 22–29 | **Drop 9:** institutional pack, marketplace, EKO as an agent (ERC-8183) |
| Month 4+ | Legal phase: entity, counsel, Agent Apps partnership, enterprise, fiat, X Money |

## 5. Token and fees

| Item | Value |
|---|---|
| Launch venue | Pons, paired with ETH |
| Total trading fee on the token | **2% = Pons standard fee 1% + creator tax 1%.** The creator tax is fixed at creation and can never be raised. Same rate on the curve and in the pool. **The creator receives ~1.7% of volume** (~$1,700 per $100k: $1,000 from the tax plus ~$700 creator share of the Pons fee), less any buyback slice. |
| Pons native buyback | **On, tentatively 25%** of the creator's ~0.7% share (~0.175% of volume). Automatic, no guaranteed amount. On-chain buys; GMGN likely shows them as plain buys, so **the Burn Board and daily bot posts surface them**. |
| Dev wallet | Receives creator fees (1% tax plus the ~0.7% share, less the buyback slice). Public address, and **never connected to any burn automation**. Pays running costs (~$1.5–2.5k/mo). |
| **Burn wallet** (new) | A separate public wallet that receives **only** the terminal fee and paid-API/x402 revenue. **The team manually buys and burns its full balance daily,** posting every transaction (Burn Board plus bot). It never receives dev fees. It's replaced by the automated Burn Engine in a later Drop, once reviewed. |
| **Launch buy-and-burn** | ~1 minute after token creation (after the anti-sniper tax window), the public dev wallet buys **$100** of the token and burns it immediately, and the transaction is posted. Scanners show "dev buy → burned". |
| Terminal fee | **0% during launch week (T → D0).** From D0: **0.5% (50 bps)** on Uniswap-routed trades through EKO, paid straight to the **burn wallet**. Tier discounts: 40 / 30 / 25 bps. **Pons-curve trades carry no terminal fee at launch** (a reviewed fee router comes later). |
| Paid API, x402 and research revenue | **Burn wallet.** x402 settles in Base USDC; the team bridges it weekly to Robinhood Chain, then buys and burns (disclosed). |
| Token payments (research runs, quotas, premium) | Sent to the burn wallet and burned in the daily burn. Available from **D0**. |
| Milestone buys | At product milestones (1,000 wallets connected; 100 agents connected; $1M cumulative terminal volume; 30 days with zero honeypot fills; $10M volume), **10% of creator fees earned since the last milestone** buys the token. **Buy-and-lock** in a public 6-month timelock by default (burn is optional). Executed within 72h. |
| Airdrops | None. **EKO Points** pay product credits (research runs, quotas, roles). Points accrue from **T**; redeemable from **D0+1**. |
| Tiers (24h minimum balance; switch on at D0+1) | **Listener** (0): 1 agent, preflight and journal, delayed Senses and Radar, 0.5%<br>**Reader:** 3 agents, real-time, Rule Lab 5 a day, approvals, 3 Deep Research runs a day, 0.4%<br>**Oracle:** 10 agents, annotations, Desk, stress and shadow, Ask the Swarm, 10 runs a day, 0.3%<br>**Source:** unlimited agents (fair use), API credits, early features, 50 runs a day, 0.25% |
| Trial (from **D0+1**, when tiers switch on; launch week is free for everyone) | 30 minutes of full real-time access plus 1 Deep Research run on first connect. Qualifying wallets need ≥ 7 days age, or ≥ 10 Robinhood Chain transactions, or ≥ $20 balance. One per X/Telegram account. +30 minutes for both sides per referral. |

**Burns at launch (manual, owner decision):**
- The burn wallet's full balance is bought and burned **once a day**, at a scheduled time, by the team: **20:00 UTC (proposed; the owner fixes it before D0)**, first burn on D0 evening. "Late" means 60 minutes past that time, and the Burn Board says so. The wallet is a hardware wallet (#6) or a 2-of-3 Safe, decided by Oct 4 because the published address depends on it.
- **Bug bounty:** up to $500 from creator fees, self-run, live from **T (Oct 13, 13:00 UTC)** so it covers the 72h public code-review window.
- Each burn transaction is posted automatically: Burn Board, X bot, Telegram.
- The Burn Board shows total burned, % of supply, burns in the last 24h, the burn wallet balance and the Pons buyback totals.
- **Wording:** "burned daily from a public burn wallet". **Never** "trustless", "automated", "ownerless" or "nobody can touch it" for the burn wallet.

**Automated Burn Engine (later Drop, target Drop 7, gated on review):**
- A contract replaces the manual burns.
- The design is in Backend §14. It's likely the "Lite" variant first: capped slices, slippage cap, no withdraw; the 3× dip mode only after a proper audit.
- The renounce event happens then, not at D+7.

## 5b. Launch dependencies (verify first; fallbacks are defined)

| Dependency | Verify by | Fallback |
|---|---|---|
| Pons curve, hook and event ABIs (including `SnipeTaxExempted`) | **Verified on-chain Oct 1** (curve, hook, `SnipeTaxExempted(address indexed)`, `currentSnipeTaxBps`); graduation events still to observe | Pons coins quote-only at T; the `exempt_insiders` and `stuck_at_bonding` playbooks ship when decoders are verified |
| dRPC on 4663 (owner's plan): **verified Oct 1**: `eth_getBlockReceipts`, archive state, `debug_traceCall` with state overrides, `debug_traceBlockByNumber` (callTracer), `eth_getLogs` over 100k-block windows, WebSocket `newHeads`. `trace_filter` and `trace_block` are **not available** on 4663, so funding edges come from `debug_traceBlockByNumber` or the Blockscout API. Backfill pricing: owner | **Done Oct 1** (pricing open) | Local node or fork for simulations; backfill limited to 7 days plus candidate funding wallets |
| Terminal fee on Pons-curve trades | **Decided:** no fee at launch | A `PonsFeeRouter` ships in a later Drop after review |
| MCP OAuth for Claude Desktop and claude.ai custom connectors (the official, documented Anthropic path: **Customize → Connectors → + → Add custom connector**; the Free plan is limited to one connector; on Team and Enterprise an owner adds it in Organization settings first; source: support.claude.com/en/articles/11175166) | **Target T** (checked once the MCP server is deployed, ~Oct 5–6; moved from Oct 2 because the check needs a live server). A custom connector needs **no Anthropic review**: the user (or a Team/Enterprise Owner) adds its URL. A Connectors Directory listing is optional and reviewed. Claude's OAuth client supports DCR and the 2025-03-26, 2025-06-18 and 2025-11-25 authorization specs; redirect `https://claude.ai/api/mcp/auth_callback`; transport Streamable HTTP. Static header credentials on hosted surfaces need Anthropic's approval per header name, so the hosted connector uses OAuth only (source: claude.com/docs/connectors/building) | Claude Desktop moves to D0 |

## 6. Claims rules (the Manus audit will check these)

| ✅ Allowed | ❌ Forbidden |
|---|---|
| "From token day, the terminal fee on Uniswap-routed trades funds a daily public buy-and-burn." "Pons also buys back automatically on every trade of the token (25% of the creator share)." | "Price support," "floor," "bid" (including the lens name: use **"Robot-heavy"**, not "Robot bid"), "buys the dip," "speeds up on dips," "our chart gets bought," "number go up" |
| "Guardrails for Robinhood-connected agents are advisory; on-chain agent guardrails are enforced." "Robinhood's trade approvals, if you turn them on, stay the hard stop." | "Strict," "guaranteed," or "enforced" guardrails for Robinhood agents; "Robinhood's approvals are the hard stop" (without the 'if you turn them on' qualifier) |
| "Built on Robinhood Chain" plus the non-affiliation line | Implying a Robinhood partnership or endorsement; using the Robinhood, Hood or $HOOD marks |
| "Robinhood is rolling out agents to ~29M customers" | "29M agents trade on Robinhood Chain" |
| "Forecasts are beta; verdicts are graded against all launches" | Win rates, returns, "alpha," "never lose" |
| "The first agent-flow metric published for Robinhood Chain (per our research)" | "The only" or "first ever" claims without a qualifier |
| "Honeypots refused and honeypots missed are published" | "Rug-proof" or "100% safe" |
| Pre-launch: "planned," "shipping in Drop N" | Describing unshipped features as live |
| "Burned daily from a public burn wallet; every transaction posted" | "Trustless", "automated", "ownerless", "no one can touch it" about the launch burns; "audited" (we have an AI-plus-automated review, not a paid audit) |
| "Venue links" for perps | "Express this view", or anything prompting leveraged trades |
| "Harness preview" (T) | "Harness alpha" (uses the banned word "alpha") |
| Talking about AI trading agents generally | Amplifying Robinhood news, or mixing Robinhood brokerage stats with Robinhood Chain stats in public posts (Robinhood Chain brand guidelines) |
| "We're non-custodial and never hold funds or credentials" | "We launch with no KYC/KYB or approvals" (true internally, but a bad public line) |
| Internal audit scores | Publishing internal audit scores as marketing |

**Required disclaimers:** "DYOR · Not financial advice · AI-generated analysis" · "Not affiliated with, endorsed by, or officially connected with Robinhood Markets, Inc." · paid KOL posts marked #ad.

## 7. Shared API contracts (Frontend and Backend must match)

**Base URL:** `https://api.{{DOMAIN}}/v1`
- REST returns JSON.
- WebSocket at `wss://api.{{DOMAIN}}/v1/ws`.
- Auth is SIWE (EIP-4361) session cookies.
- The MCP server lives at `https://mcp.{{DOMAIN}}` and authenticates with harness API keys. Public paid calls use x402.

### Core types (TypeScript; source of truth lives in `packages/shared`)

```ts
type Address = `0x${string}`;
type Level = 'clear' | 'monitor' | 'danger' | 'info';
type WalletLabel = 'declared_agent' | 'likely_agent' | 'crew' | 'human';

interface Untrusted { text: string; truncated: boolean; flags: ('agent_bait'|'link'|'impersonation')[] }

interface PlaybookMatch { id: PlaybookId; level: Level; confidence: number; evidence: EvidenceRef[];
  history?: { deployerRuns: number; crewId?: string; crewRuns?: number } }
type PlaybookId = 'honeypot'|'tax_trap'|'removable_liquidity'|'fee_trap_pool'|'stuck_at_bonding'|
  'wash_to_trend'|'clone_swarm'|'exempt_insiders'|'bundle_dump'|'migration_dump'|'malicious_hook'|
  'agent_bait'|'serial_deployer';

interface Verdict { coin: Address; level: Exclude<Level,'info'> | 'pending' /* CA-34: some required checks haven't run; never treated as clear */; evaluatedPlaybooks?: PlaybookId[]; reasons: string[]; playbooks: PlaybookMatch[];
  beta?: { apeScore?: number; setupGrade?: 'A'|'B'|'C' }; receipt: ReceiptRef; schemaVersion: string; asOfBlock: number }

interface CoinCard {
  identity: { address: Address; name: Untrusted; symbol: Untrusted; deployer: Address; createdAt: string;
    launchpad: 'pons'|'occupy'|'flap'|'klik'|'other'; stage: 'curve'|'graduated'; curvePct?: number;
    quoteAsset: 'ETH'|'USDG'|'stock_token'|'other'; pools: PoolRef[] };
  clone?: { isClone: boolean; originalAddress?: Address };
  tradeability: { exitCostPct: { usd100: number; usd1k: number; usd10k: number }; buyTaxPct: number; sellTaxPct: number;
    honeypot: boolean; limits?: { maxTxUsd?: number; maxWalletPct?: number }; hookFeePct?: number;
    antiSnipe?: { taxPct: number; endsInSec: number } };
  liquidity: { depthUsd: { pct2: number; pct5: number; pct10: number }; lpStatus: 'burned'|'locked'|'removable'|'pons_locked'; feeTiers: number[] };
  supply: { top10Pct: number; devPct: number; bundlesHeldPct: number; exemptWalletsHeldPct: number; freshWalletsPct: number; burnedPct: number; circulating: string };
  control: { owner?: Address; canChangeTax: boolean; canBlacklist: boolean; canPause: boolean; canMint: boolean; upgradeable: boolean };
  flow: { window: '5m'|'1h'|'24h'; agentPct: number; crewPct: number; humanPct: number; washEstPct: number };
  playbooks: PlaybookMatch[]; verdict: Verdict; freshness: { block: number; ageSec: number } }

interface ChartMarker { ts: number; side: 'buy'|'sell'; sizeUsd: number; label: WalletLabel; confidence: number; wallet: Address; crewId?: string }

interface Policy { mode: 'safe'|'balanced'|'degen'; maxPositionUsd?: number; maxPositionPct?: number; maxDailyLossUsd?: number;
  allowAssets?: string[]; blockAssets?: string[]; blockPlaybookLevel: 'danger'|'monitor'|null; earningsBlackoutDays?: number;
  minLiquidityUsd?: number; maxRoundTripCostPct?: number; maxLeverage?: number; approvalAboveUsd?: number; killed: boolean; version: number }

interface PreflightRequest { agentId: string; clientOrderRef: string;
  order: { venue: 'robinhood'|'rhc'|'base'|'perp'; instrument: string; side: 'buy'|'sell'; qty?: number; notionalUsd?: number;
    orderType: 'market'|'limit'; limitPrice?: number; leverage?: number };
  context?: { positions?: { instrument: string; qty: number; valueUsd: number }[]; cashUsd?: number; dailyPnlUsd?: number;
    earningsDate?: string; reportedAt: string } }

interface PreflightResult { preflightId: string; decision: 'allow'|'deny'|'needs_approval'; reasons: string[];
  policyVersion: number; approvalId?: string; senses?: { verdict?: Verdict }; journalId: string }

interface JournalEntry { id: string; agentId: string; ts: string; kind: 'session_start'|'decision'|'order'|'outcome'|'note';
  payload: unknown; preflightId?: string; share: boolean; commitment: string /* salted hash, private */ }

interface Approval { id: string; agentId: string; preflightId: string; summary: string;
  status: 'pending'|'approved'|'denied'|'expired'; expiresAt: string }

interface Agent { id: string; name: string; kind: 'robinhood_mcp'|'onchain'|'perp_venue'|'other'; wallet?: Address;
  status: 'active'|'soft_killed'|'disconnected'; lastSeen?: string; uncheckedOrders24h: number }

interface Receipt { id: string; kind: 'verdict'|'forecast'|'harness_private'; hash: string; merkleRoot: string;
  block: number; txHash: string; revealed?: unknown; grade?: 'hit'|'miss'|'n/a' }

interface BurnStats { totalBurned: string; pctSupplyBurned: number; burns24h: { count: number; tokens: string; usd: number };
  nextBurnEtaSec: number; engineBalanceUsd: number; recent: { txHash: string; tokens: string; usd: number; ts: string }[] }

interface Entitlements { tier: 'listener'|'reader'|'oracle'|'source'; trial?: { endsAt: string };
  limits: { agents: number; deepResearchPerDay: number; loopBacktestsPerDay: number; realtime: boolean }; feeBps: 0|50|40|30|25 }
```

### REST endpoints

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/siwe/nonce` · `POST /auth/siwe/verify` · `POST /auth/logout` · `GET /me` (includes Entitlements) |
| Radar and coins | `GET /radar?mode&lens&cursor` · `GET /pairs?stage=new\|near_grad\|migrated` · `GET /coins/:address` (CoinCard) · `GET /coins/:address/verdict` · `GET /coins/:address/candles?tf&from&to` · `GET /coins/:address/markers?from&to` · `GET /coins/:address/flow?window` |
| Scan | `POST /scan {query}` → `{ card, shareUrl }` · `GET /scan/:id` · OG image `GET /og/scan/:id.png` · `GET /wallets/:address/bags` (BagReport; own wallet after SIWE) |
| Trust | `GET /census` (`{ gated: boolean, ... }`) · `GET /scoreboard?kind&cursor` · `GET /receipts/:id` · `GET /burn/stats` · `GET /burn/events?cursor` |
| Trading | `POST /trade/quote {coin, side, amountUsd, slippageBps}` → quote with guard result, exit cost, fees, route · `POST /trade/order {quoteId, idempotencyKey}` → unsigned calldata · `POST /trade/order/:id/submitted {txHash}` · `GET /trade/orders` |
| Watch and alerts | `GET/POST/DELETE /watch` · `GET/PUT /alerts/settings` |
| Harness (web) | `GET/POST /agents` · `PATCH/DELETE /agents/:id` · `POST /agents/:id/keys` · `GET /agents/:id/journal` · `GET /agents/:id/unchecked-orders` · `GET/PUT /agents/:id/policy` · `GET /policy-presets` · `GET /approvals?status` · `POST /approvals/:id {decision}` · `POST /agents/:id/kill {mode: soft\|hard}` (hard → deep link) |
| Rule Lab and research | `POST /loops/compile {text}` · `POST /loops/backtest {loopSpec, source: 'onchain' \| {bars}}` · `GET /loops` · `POST /research {target}` → job · `GET /research/:id` |
| Perps | `GET /perps/context?asset` |

**WebSocket channels:** `radar` · `pairs` · `coin:{address}` · `flow:{address}` · `burns` · `alerts` (user) · `agents` (user) · `approvals` (user) · `orders` (user)

**MCP tools and their ship stage** (SPEC §10):
- **T:** `coin_verdict`, `coin_card`, `playbook_match`, `preflight`, `journal`, `census_summary`, `receipts_lookup`
- **D0:** `request_approval`, `kill`, `recall`, `review`, `loop_compile`, `loop_backtest`, `x_context`, `perp_context`, `deep_research`
- **Drop 1:** `agent_flow`, `wallet_label`, `crowding` and `ape_score` (beta)
- **Drop 2:** `crew_moves`
- **Drop 4:** `desk_run`, `committee`
- **Drop 6:** `loop_stress`, `loop_shadow`, `stocks_herd`

**Indicative x402 prices:**

| Call | Price |
|---|---|
| Card or verdict | $0.002 |
| `playbook_match`, `agent_flow` | $0.005 |
| `x_context` | $0.05 |
| `deep_research` | $1.50 |

## 8. Crypto-only vendor stack

| Need | Vendor |
|---|---|
| Models | OpenRouter (USDC) and PPQ (BTC, Lightning) |
| X research | Grok X Search via OpenRouter; Sorsa |
| RPC | dRPC (paid plan plus a local Anvil fork) |
| Scam and market cross-checks | GoPlus, ScanHood, Birdeye, Nansen (x402) |
| Stocks | Bring your own data via the user's Robinhood MCP, plus EDGAR. Massive x402 for internal R&D only. |
| Hosting | Vultr (BitPay USDC) or BitLaunch; Akash for user-owned Launcher agents |
| Contract review | **No paid audit (owner budget).** AI multi-agent review plus Slither/Aderyn plus Foundry fuzz/fork tests, a public code-review window, and a bug bounty up to $500 paid from creator fees. Wording: "AI-assisted and automated review, not a professional audit." A paid audit comes later, funded by fees. |
| X API | Pay-per-use: summoned reply $0.010, post $0.015, post with link $0.20, read $0.005. **Replies attach a card image, not a link.** Try the Developer Console with the USDC wallet X Premium accepts, otherwise a card. **Two accounts:** main (human) plus bot ("Automated by" main). X Premium on both. Grok can't post for us. |
| Farcaster | Summon bot via Neynar (crypto accepted) or our own node |
| Telegram | Bot API (free) |

## 9. Numbers people will quote (with context)

- Running costs ~$1.5–2.5k/mo at launch. Trade caps: beta $25 (team) / $100 (users); from T, $250 per trade for 72h, then $1,000. Token launch time is 16:00 UTC (internal, never posted). Swarm ~$700–1,000/mo.
- **Day-30 targets** (measured at **D+30, ~Nov 19**):

| Metric | Target |
|---|---|
| Wallets connected | 3,000 |
| Bag reports shared | 1,000 |
| Telegram groups running the bot | 50 |
| Agents connected | 300 |
| Preflights per day | 1,500 |
| Terminal volume | $250k/day average |
| Honeypot fills through the guard | 0 |
| Precision (playbooks, labels) | ≥ 90% |
| Clear cohort beats all launches | ≥ 3 of 4 weeks |
| Holders | 2,000 |

- Audit v2 score path: 4.5 as written → ~5.5 after fixes → ~8 at launch with the pre-built drops, if the beta numbers are strong.
