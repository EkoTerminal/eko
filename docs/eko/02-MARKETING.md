---
title: Marketing
subtitle: EKO is the harness your trading agent runs inside. Its first application is a trench terminal for Robinhood Chain that scans every new pair for scam playbooks. This is the marketing lead's operating manual: the brand, the messaging, the exact words we may and may not use, the calendar from T-10 through Drop 9, the programs, the crisis playbooks and the FAQ. Every claim is sourced and tagged with the stage it becomes true. We never make price claims, and nothing appears in copy before it ships in the product.
suite: 2 of 5 · Marketing
version: v2.1
date: 2026-09-30
target: Robinhood Chain (4663)
---

> **v2.1 (2026-09-30): renamed to EKO.** Ticker `$EKO`. Tiers are Listener / Reader / Oracle / Source; verdicts are Clear / Monitor / Danger; scam call-outs are Ghost Reports; product credits are EKO Points; the look follows the EKO site (noise into signal, echo rings, teal-navy and pale cyan). Also aligned: the Claude connector path (Customize → Connectors), the daily burn time (20:00 UTC, proposed), the bug bounty (live from T) and the burn wallet (hardware #6 or a 2-of-3 Safe).

## 00 · How to Use This Document

**The fact sheet wins every conflict.** Every claim is tagged with the stage it becomes true. Before that stage, copy says "planned", "ships at token launch" or "shipping in Drop N". Dates are targets: D0 moves if a gate is red, and a Drop slides a week if its evals aren't green (internal update plan).

| Tag | Meaning | Target |
|---|---|---|
| `Now` | External fact, verified 2026-09-29/30 | — |
| `T-n` / `T` | Pre-launch day / product launch, no token | Oct 3–12 / ~Oct 13 |
| `D0` / `D0+1` | Token launch (gate-based) / tiers switch on | ~Oct 20 / ~Oct 21 |
| `Drop 1`…`Drop 9` | Weekly drops (fact sheet §4) | ~Oct 27 – Dec 29 |
| `Gate` | True only once a named eval gate passes | — |
| `Later` / `Confirm` | Legal phase (month 4+) / not dated in the fact sheet, so confirm before posting | — |

**Roles:**
- **ML:** marketing lead
- **OWN:** owner, the final approver on token, fees, team and legal statements
- **DEV:** dev on duty (numbers, transaction hashes, gate status)
- **MOD:** moderators

**Slots:**
- `[N]` is a live number from a product page, and nothing else.
- `[CA]`, `[SYMBOL]`, `[BURN_WALLET]`, `[DEV_WALLET]`, `[TIMELOCK]`, `[link]`, `[block]`, `[hash]` and `[ID]` are filled in at posting time.
- `{{…}}` values are undecided (fact sheet §0). Never invent them.

Forbidden phrases appear only where they are being banned: "Forbidden" columns, "Wrong" examples, and "Never" or "Don't" lists.

## 01 · Brand Core

### Name Status

> **The name is EKO, and the ticker is `$EKO`** (confirmed 2026-09-30 after an availability check). The handles `{{MAIN_HANDLE}}` / `{{BOT_HANDLE}}` and the domain `{{DOMAIN}}` are still pending; register them before any public use of the name. Earlier drafts used a different working name; never use it.

- **Expect `$EKO` clones.** `EKOX` and `EKOS` already launched on Robinhood Chain (Sep 24–27) with 79–81% fee-trap pools, and more will follow once the name is public. Only the CA posted by `{{MAIN_HANDLE}}`, the site and the Telegram channel at `H0+2m` is real. Call out every clone in a Ghost Report, with receipts.
- **No merch or paid placements until the handles and domain are registered.**
- **No Robinhood marks in our identity.** No name, ticker, handle or domain may contain "Robinhood", "Hood" or anything confusingly similar ([brand guidelines][rhc-brand]; internal policy doc).

### The ghost in the signal (mascot)

EKO's look is noise turning into signal: static, echo rings and a faint poltergeist presence that becomes legible as the agents read the market. The mascot is that presence.

| Element | Meaning |
|---|---|
| **EKO (the ghost)** | A figure made of static that sharpens as a signal forms. It's the voice of `{{MAIN_HANDLE}}`. |
| **The ping** | The alert: the bot `{{BOT_HANDLE}}` and every scan card |
| **The noise** | Raw chain activity: new pairs, volume, hype |
| **The signal** | A verdict with reasons, evidence and a receipt |
| **Ghosts** | Scam playbooks and the crews that run them. **Never a named person.** |

- **"Don't be an echo"** targets a behaviour: copying the crowd blind. Never aim it at a person, and never at someone who just got rugged.
- **Personality:** calm, watchful, dry and exact. It speaks in numbers and receipts. It never hypes and never talks price.
- **Visuals:**
  - Match the EKO site: a dark teal-navy ground, pale cyan ink, echo rings and fine noise. Sleek and corporate; noise is texture, never the message. No heavy glitch on numbers, verdicts or disclaimers.
  - The mascot's state maps to the verdict: resolved for Clear, flickering for Monitor, full static for Danger.
  - **No feather motif and no palette confusingly similar to Robinhood's** (no Robinhood green).
  - The same art on every account; the bot's avatar is the echo-ring mark.

### Voice and Tone

| Do | Don't |
|---|---|
| Lead with a number, a contract address or a receipt | Lead with hype or price |
| Describe what the engine saw: "sell simulation reverted" | Call a person a scammer |
| Tag the stage: "live", "ships at token launch", "shipping in Drop 3" | Describe planned features in the present tense |
| Post misses first, in public | Delete or quietly edit a wrong call |
| Use "advisory" and "enforced" exactly as defined in 04 | Say "protects your Robinhood account" |
| Joke about scams | Joke about victims |

**Sample lines:**
- "Sell simulation reverted. That's a honeypot. The guard won't route it."
- "Your agent asked first. Your policy said no."
- "Refused: [N]. Missed: [N]. Both are on the Scoreboard."

**Signal vocabulary** (noise, static, echo, ping, ghost, haunted, frequency):
- At most one per post.
- **None** in crisis posts, corrections, fee or token explainers, milestone posts or disclaimers.
- Product and tier names (Ghost Report, Listener, Oracle) don't count. Never call a rugged holder a ghost or an echo.

### Taglines

| Line | Status | Rule |
|---|---|---|
| "Every move has a cause." | Fact sheet §1 (site hero) | Bios, site hero, decks, launch posts |
| "Less noise. More evidence." | Fact sheet §1 (site) | Scoreboard, Census and research content |
| "Give your agent a harness." | Fact sheet §1 | Agent-owner content, demo clips, bios. If Robinhood is named, say "agents connected through Robinhood's MCP" (in-app agents can't install EKO; H2) and add D-2. |
| "Don't be an echo." | Fact sheet §1 | Sign-off, stickers, trencher content |
| "A signal forms. Certainty doesn't." | Fact sheet §1 (site) | Beside swarm, forecast and Deep Research content; pair with DYOR |
| "Agent Apps tell agents about the market. EKO tells the market about the agents." | Fact sheet §1 | Media and Census; needs the non-affiliation line |
| "The harness your trading agent runs inside." | Fact sheet §1 | Bios, site hero, decks |
| "From token day, the terminal fee on Uniswap-routed trades funds a daily public buy-and-burn." · "Burned daily from a public burn wallet; every transaction posted." | Fact sheet §5–6 | Token content from `D0`. Pons-curve trades carry no terminal fee at launch, so never "every trade" or "any coin". |
| "Add EKO to your Claude app in 30 seconds." | Owner-approved launch hook | Claude Desktop and claude.ai content, only once the connector login is live (target `T`, otherwise `D0`). Keep "30 seconds" only if a timed beta install confirms it; never imply an Anthropic endorsement (H13). |
| "Refused and missed. Both published." · "Scan before you ape." | Proposed; needs OWN's approval | Scoreboard content · summon CTA |

> **Retired:** the earlier tagline that paired Robinhood with "an agent". In-app agents can't install EKO, so it implied an integration. Don't use it anywhere.

## 02 · Positioning and Messaging House

### Core Promise

> **Canonical (fact sheet §1):** "The harness your trading agent runs inside: Senses, Guardrails, Rule Lab, Flight Recorder and Mission Control. Its first application is a trench terminal for Robinhood Chain that scans every new pair for scam playbooks and won't let you buy a honeypot."

**For posts:** "EKO is the harness your trading agent runs inside. Its first app is a trench terminal that scans every new Robinhood Chain pair for scam playbooks and refuses trades that fail a buy-then-sell simulation. Every miss is published. [D-2]"

**For decks, briefs and media (the gap):** "Robinhood says it 'does not control, supervise, monitor, recommend, or audit these AI agents.' EKO is the independent check and record around your agent: one set of rules and one log across Robinhood, Robinhood Chain and perp venues. And a scam guard on Robinhood Chain, where Robinhood's in-app agents don't trade." Use R5's exact quote, keep R4's brokerage-vs-chain line, and never imply EKO can block a Robinhood order (it's advisory there).

> **Rule:** copy that says "won't let you buy a honeypot" must link the Scoreboard's "honeypots missed" count on the same page. It describes the guard's design, not a "rug-proof" promise.

### The Five Pillars

| Pillar | Message | Proof points (stage) |
|---|---|---|
| **1. Harness for your agent** | "Your agent checks with EKO before it trades. Your rules, approvals, kill switch and journal." | **`T`:** Claude Code pack (API key) plus a generic MCP guide; Claude Desktop and claude.ai through Anthropic's official custom connectors, targeted for `T` (`D0` if the OAuth login isn't ready by Oct 2) ([Anthropic][claude-connectors]); `coin_verdict`, `coin_card`, `playbook_match`, `preflight`, `journal`. **`D0`:** ChatGPT and OpenClaw packs; Mission Control v1; on-chain guardrails enforced via session keys, targeted for `D0`, once the module's contract review passes (advisory until then); Rule Lab v1. **Later:** Desk `Drop 4`; Launcher `Drop 5`; stocks `Drop 6`. (fact sheet §3–4) |
| **2. Scam playbooks and Ghost Reports** | "Not just 'is it a honeypot', but which playbook it's running and who ran it before." | **`T`:** 13 playbooks with deployer and crew history back to genesis; agent-bait scanning; a guard that refuses failed sells, Danger matches and no-route trades. **Other:** Ghost Reports from `T-10`; Rug Ring Radar `Drop 2`. **Context:** one ring took at least $18.43M across 53 Pons launches ([The Block][theblock]). |
| **3. Agent flow and the Census** | "Who's buying: agents, crews or humans." | **`T`:** wallet labels and chart markers. Agent/crew/human % on scan cards carries a beta tag and confidence until label precision passes ≥ 90%. **`Gate`:** Census numbers (label precision ≥ 90%). **`Drop 1`:** Agent Flow Index (if the label gate has passed). **Context:** nobody publishes an agent share for Robinhood Chain (fact sheet §2). |
| **4. Terminal fees fund a daily public burn** | "From token day, the terminal fee on Uniswap-routed trades goes to a public burn wallet. Once a day we buy the token with its full balance and burn it, and every transaction is posted." | Fee **0% during launch week**; 0.5% on Uniswap-routed trades from `D0`. Pons-curve trades carry no terminal fee at launch (a reviewed fee router comes in a later Drop). Burn wallet and Burn Board `D0`; the $100 launch buy-and-burn ~1 minute after creation; first daily burn posted `D0` evening. The burn wallet also gets paid-API and x402 revenue (`Drop 1`; x402 settles in USDC on Base and we bridge it weekly, disclosed) and token payments (`D0`), never dev fees. Pons native buyback on every trade of the token (tentatively 25% of the creator's share of the Pons fee). An automated Burn Engine is planned for `Drop 7`, gated on review. (fact sheet §4–5) |
| **5. Proof through published results** | "We publish what we refused and what we missed." | **`T`:** Scoreboard (refused *and* missed); Merkle roots every 5 minutes; open-source playbook library and verifier (internal roadmap). **Ongoing:** weekly grading against all launches; eval scores in every release note; weekly shipping. **`D0`:** public dev and burn wallets, with every burn transaction posted. The team is anonymous, so this pillar carries the trust (fact sheet §0). |

### Positioning Map

| Versus | Our difference | Say | Never say |
|---|---|---|---|
| **GMGN, Axiom** (no token, per our research) | They're cockpits for one human watching one chart. We're agent-first: a harness plus a radar of many plays at once. | "Built for agents first, and for the human supervising them." | "GMGN killer", "safer than Axiom" |
| **Scanners** (GoPlus, ScanHood, TrustSwap, Ruginhood, RobinScan, Robinhood Checker) | They check contracts. We add named playbooks with crew history, agent-wallet labels, agent-bait scanning, and a guard wired into trading and into your agent. | "Per our research, no Robinhood Chain scanner labels agent wallets, names playbooks with crew history, or scans token text for prompt injection." | "Other scanners are useless" |
| **Agent launchpads** (Virtuals) | They launch agent tokens. We supervise agents that trade. Agent Launcher (`Drop 5`) runs your agent on your own box, with no token. | "Launchpads make agents. EKO keeps them on a leash." (proposed) | Claims about others' agents or price |

> Don't name competitors in public posts without OWN's approval. This map is for briefs, decks and media.

## 03 · Audiences and Personas

| Persona | Pains | Hooks | Channels | CTA (stage) |
|---|---|---|---|---|
| **Trenchers** | Rugs, clones, honeypots, fake volume, being exit liquidity | Ghost Reports, "the guard refused a honeypot", bag reports | Telegram call groups, X | "Paste any CA" → "Scan my bags" → guarded trade `T` |
| **Robinhood-connected agent owners** (Claude, ChatGPT, OpenClaw and others on Robinhood's MCP) | Robinhood "does not control, supervise, monitor, recommend, or audit these AI agents" ([Robinhood newsroom, 2026-05-27][rh-news]); trade approvals may be off unless the user turns them on; no memory or testing | Preflight, approvals, kill switch, journal | X AI circles, demo clips, AI-trading-agent news cycles (never amplify Robinhood news) | "Install the Claude Code pack" `T`; "Add EKO to your Claude app" (Claude Desktop and claude.ai, target `T`, otherwise `D0`); ChatGPT and OpenClaw `D0` |
| **On-chain agent builders** | Agents farmed by scam launches and by injection in token text | `untrusted` field `T`; guardrails enforced via session keys, targeted for `D0`, once the module's contract review passes (advisory until then); x402 `Drop 1`; bounty weeks | Farcaster, X dev circles, GitHub | "Add the MCP" `T` |
| **Stock traders** | Untested Loops, agent herding | Rule Lab Pro, the Agent Herd: Stocks report | X finance, newsletters | Waitlist until `Drop 6`. No stock picks. |
| **KOLs and callers** | Need a provable record | Graded caller page, performance deals | DM from ML, Telegram | "Run the bot in your group" `T` |
| **Media** | Need a sourced number on AI agents trading | Census `Gate`, AFI `Drop 1` (if the label gate has passed), Ghost Report data | Email, X | Methodology page `T-7` |
| **Institutions** | Need point-in-time labels, SLAs and audit logs | Institutional pack | Direct | Nothing before `Drop 9`; enterprise `Later` |

## 04 · Claims Matrix

If a claim isn't here, get OWN's approval before using it. Every number in a post comes from a live product page and links to it.

### Harness

| # | Claim | Allowed wording | Forbidden wording | Source or proof | True from (stage) |
|---|---|---|---|---|---|
| H1 | What it is | "The harness your trading agent runs inside" | "AI that trades for you", "auto-trading bot" | Fact sheet §1 | `T` |
| H2 | Platforms | "Claude Code pack plus a generic MCP guide at launch; Claude Desktop and claude.ai through Anthropic's official custom connectors; ChatGPT and OpenClaw at token launch." Claude Desktop and claude.ai are targeted for T; if the OAuth login isn't ready by Oct 2 they move to D0: name them with whichever stage they actually ship. | "Works with every agent", "works inside the Robinhood app", "Claude pack" without saying Code or Desktop | Fact sheet §4, §5b; [Anthropic][claude-connectors]; internal harness spec | `T` / `D0` |
| H3 | Robinhood-connected guardrails | "Advisory: your agent is instructed to check them, and Robinhood's trade approvals, if you turn them on, stay the hard stop" | "Strict", "guaranteed" or "enforced" for Robinhood agents | Fact sheet §6 | `T` |
| H4 | On-chain guardrails | "Enforced via session keys, targeted for D0, once the module's contract review passes; advisory until then." Until the review passes, say "advisory". | "Enforced for all agents"; "enforced" before the module's review passes | Fact sheet §3 | `D0` (target) and `Gate` (module review) |
| H5 | Mission Control | "Approve on the web; Telegram only notifies. Soft kill denies every preflight. Hard kill deep-links you to disconnect in Robinhood, or revokes an on-chain session key." | "Approve trades in Telegram", "we can shut down your Robinhood agent" | Fact sheet §3 | `D0` |
| H6 | Unchecked orders | "Flags orders your agent reports without a matching preflight" | "We monitor your Robinhood account" | Internal harness spec | `D0` |
| H7 | Flight Recorder | "Private journal; decisions committed on-chain as salted hashes only you can reveal" | "Your agent's record is public" | Fact sheet §3 | `T` |
| H8 | Rule Lab v1 | "Deterministic backtests of crypto and Robinhood Chain rules" | "Backtest your stock Loop" (before Drop 6), "proven strategies" | Fact sheet §3 | `D0` |
| H9 | Stock Loops | "Using your own data from your own Robinhood connection; results shown only to you" | "Stock data included", "stock picks" | Fact sheet §3 | `Drop 6` |
| H10 | Agent Launcher | "Your own agent on your own Akash or VPS box. We never operate it." | "We run your agent" | Fact sheet §4 | `Drop 5` |
| H11 | Arena | "Paper competition; skill-based prizes; no purchase needed" | "Win money trading", raffles | Fact sheet §4 | `Drop 3` |
| H12 | Unshipped Drops (Desk, Score, Inside, automated Burn Engine, Base, institutional pack) | "Shipping in Drop N" | "Live" before the Drop ships | Fact sheet §4 | `Drop 4–9` |
| H13 | Claude app connector | "Add EKO to your Claude app: Customize → Connectors → + → Add custom connector, paste `https://mcp.{{DOMAIN}}`, log in. It's Anthropic's own documented path for remote MCP servers, on any Claude plan (Free allows one custom connector)." ("in 30 seconds" only if a timed beta install confirms it) | "Official Claude integration", "Anthropic partner", "approved" or "verified by Anthropic" (Anthropic says custom connectors aren't verified by it) | [Anthropic][claude-connectors]; fact sheet §4, §5b | `T` (target; `D0` if the login isn't ready by Oct 2) |

### Terminal and Scans

| # | Claim | Allowed wording | Forbidden wording | Source or proof | True from (stage) |
|---|---|---|---|---|---|
| T1 | Fast Scan | "A rules-based verdict on every new pair, in seconds" | "Instant", "catches every scam" | Fact sheet §3 | `T` |
| T2 | Playbooks | "13 playbooks, with deployer and crew history back to chain genesis" | "Detects every scam" | Fact sheet §3; internal roadmap | `T` |
| T3 | Agent bait | "Scans token text for prompt injection aimed at agents" | "Makes your agent unhackable" | Fact sheet §3 | `T` |
| T4 | The guard | "Refuses failed sells, Danger matches and no-route trades. Honeypots refused and missed are published." | "Rug-proof", "100% safe", "can't lose" | Fact sheet §6; internal product spec §8 | `T` |
| T5 | Custody and routes | "Non-custodial; you sign. Uniswap v3 and the Pons curve at T; v4, including graduated Pons pools, is targeted for T. Until then, graduated coins show a quote and a link out." | "We protect your funds", "every DEX" | Fact sheet §3 | `T` |
| T6 | Launch week | "Free in launch week, including a 0% terminal fee until token day" | "Free trading forever", "zero fees" (after D0) | Fact sheet §4–5; internal GTM plan | `T` |
| T7 | Deep Research | "X context via Grok X Search through OpenRouter, plus Sorsa bot-follower checks" | "We scrape X", "insider info" | Fact sheet §3 | `D0` |
| T8 | Perps | "Link-outs and a bring-your-own agent guide. We never execute perps." | "Trade perps on EKO"; referral offers | Fact sheet §3 | `D0` |
| T9 | Stocks | "A research lane with your own data. We never execute stocks; no stock-token trading." | "Trade stocks here" | Fact sheet §3 | `Drop 6` |
| T10 | Forecasts | "Forecasts are beta; verdicts are graded against all launches" | Win rates, returns, "alpha", "never lose" | Fact sheet §6 | `T` |
| T11 | Clear badge | "Live and revocable; revoked the moment a project turns bad" | "Certified safe", "audited", "endorsed" | Internal GTM plan | `D0` |
| T12 | Trade caps | "Per-trade caps while we scale: $250 per trade for the first 72 hours after launch, then $1,000. The closed beta ran at $25 (team) and $100 (users)." | "No limits", "trade any size" | Fact sheet §9 | Beta; `T`; `T`+72h |

### Data

| # | Claim | Allowed wording | Forbidden wording | Source or proof | True from (stage) |
|---|---|---|---|---|---|
| D1 | Census | "[N]% of Robinhood Chain buys in [window] came from wallets labelled as agents. Method: [link]" | Any number before the gate; "X% of traders are bots" | Fact sheet §3; internal evals doc | `Gate` |
| D2 | First | "The first agent-flow metric published for Robinhood Chain (per our research)" | "The only" or "first ever" without the qualifier | Fact sheet §6 | `Gate` |
| D3 | Labels | "Declared agent (ERC-8004), Likely agent (with confidence), Crew, Human." Agent/crew/human % on scan cards carries a beta tag and confidence until label precision passes ≥ 90%. | "We know every bot" | Fact sheet §3 | `T` |
| D4 | Data origin | "What we show publicly is our own indexed chain data" | "Powered by [third-party scanner]" | Internal policy doc | `T` |
| D5 | Paid API | "Pay per call over x402. Indicative: $0.002 per verdict, $1.50 per research run." | Fixed prices | Fact sheet §7 | `Drop 1` |

### Token and Fees

| # | Claim | Allowed wording | Forbidden wording | Source or proof | True from (stage) |
|---|---|---|---|---|---|
| K1 | Launch | "Launches on Pons, paired with ETH, once its public gates pass (target ~Oct 20)" | A fixed date as a promise; the exact time; "presale" | Fact sheet §4–5 | `D0` |
| K2 | Trading fee on the token | "A 2% total trading fee on the token: Pons's 1% standard fee plus a 1% creator tax, fixed at creation and never raisable. Creator fees (~1.7% of volume, less the buyback slice) go to the public dev wallet and pay running costs." | "0% tax", "the tax funds burns", "2% creator tax" | Fact sheet §0, §5 | `D0` |
| K3 | Pons buyback | "Pons also buys back automatically on every trade of the token, with 25% of the creator's share of the Pons fee (~0.175% of volume). No guaranteed amount. The Burn Board and daily bot posts show these buys." Before creation, say "planned": the 25% is tentative until OWN confirms it and it's locked at creation. | "Guaranteed buybacks"; calling buyback buys burns | Fact sheet §0, §5–6 | `D0` |
| K4 | Terminal fee | "0.5% on Uniswap-routed trades through the terminal (0.4 / 0.3 / 0.25% by tier), paid straight to the public burn wallet. Pons-curve trades carry no terminal fee at launch; a reviewed fee router comes in a later Drop." | "Zero-fee terminal"; "0.5% on any coin" or "every trade" (curve trades carry none at launch) | Fact sheet §5, §5b | `D0` (0% during launch week); discounts `D0+1`; curve trades: a later Drop |
| K5 | Buy-and-burn | "From token day, the terminal fee on Uniswap-routed trades funds a daily public buy-and-burn." | "Price support", "floor", "bid", "buys the dip", "our chart gets bought", "number go up" | Fact sheet §6 | `D0` |
| K6 | Burn wallet | "Burned daily from a public burn wallet; every transaction posted. It receives only the terminal fee, paid-API and x402 revenue, and token payments, never dev fees. Its buys pay the token's 2% trading fee like any buyer." | "Trustless", "automated", "ownerless", "nobody can touch it", "audited"; "treasury", "vault" | Fact sheet §5–6 | `D0` |
| K7 | Launch buy-and-burn | "About a minute after the token was created, the public dev wallet bought $100 of it and burned it. Tx: [hash]." | "The dev is buying", or the buy without the burn; any price framing | Fact sheet §5 | `D0` |
| K8 | Automated Burn Engine | "Planned for Drop 7 (target ~Dec 8), only once its review is done. Until then, burns are manual and daily from the public burn wallet." | Describing automated burns or the engine as live before it ships; "renounced" before the tx; "unruggable" | Fact sheet §4–5 | `Drop 7` (target, gated on review) |
| K9 | Other revenue | "Paid-API, x402 and research revenue and token payments go to the public burn wallet and are burned in the daily burn. x402 settles in USDC on Base; we bridge it weekly to Robinhood Chain, then buy and burn (disclosed)." | "All revenue is burned" (creator fees aren't); "burned instantly" for x402 | Fact sheet §5 | `Drop 1`; token payments `D0` |
| K10 | Milestone buys | "At [milestone], 10% of creator fees earned since the last milestone buys `$EKO` within 72h, locked 6 months in a public timelock" | "To support the price"; price or market-cap milestones | Fact sheet §5 | `D0` onward |
| K11 | Airdrops | "No airdrops. EKO Points pay product credits." | "Airdrop", "points become tokens" | Fact sheet §5 | Points accrue from `T`, redeemable from `D0+1` |
| K12 | Holding | "Holding unlocks tiers and fee discounts" | "Revenue share", "yield", "dividends", "investment" | Internal policy doc | `D0+1` |
| K13 | Tiers and trial | "Tiers by 24h minimum balance: token amounts worth about $50 / $250 / $1,000 at the D0+1 price, reviewed monthly and only ever lowered. 30-minute trial plus 1 Deep Research run for qualifying wallets." | Exact token amounts before `D0+1`; "thresholds may rise"; "free premium forever" | Fact sheet §0, §5 | `D0+1` |

### Robinhood

| # | Claim | Allowed wording | Forbidden wording | Source or proof | True from (stage) |
|---|---|---|---|---|---|
| R1 | Relationship | "Built on Robinhood Chain", plus the non-affiliation line | "Partner", "official", "backed by", "Hood Chain", Robinhood's stock ticker, Robinhood logos | Fact sheet §6; [rhc-brand]; [rhc-tos] | `Now` |
| R2 | Rollout | "Robinhood is rolling out agents to ~29M customers" | "29M agents trade on Robinhood Chain" | [Fortune][fortune]; [X][rh-x] | `Now` |
| R3 | MCP accounts | Don't quote an account count publicly: sources conflict (Fortune: 150k+; PYMNTS: 15k+). Use "Robinhood is rolling out agents to ~29M customers" (R2) | "150k agents use EKO", any MCP account count | [Fortune][fortune] | `Now` |
| R4 | Brokerage vs chain | "In-app Robinhood agents trade inside the brokerage, not on Robinhood Chain" | "Robinhood's agents buy Robinhood Chain memecoins" | Fact sheet §2; [CoinDesk][coindesk-rh] | `Now` |
| R5 | Supervision | The exact quote: "does not control, supervise, monitor, recommend, or audit these AI agents" | "Robinhood-approved" | [Robinhood newsroom, 2026-05-27][rh-news] | `Now` |
| R6 | Agent Apps | If asked: "We're not in Agent Apps. We found no public application path (per our research)." At HOOD Summit (2026-09-29) Robinhood listed 11 Agent Apps (e.g. Unusual Whales, Nasdaq, Token Terminal), each $5–30 a month; none does on-chain scam checks. | "Coming to Agent Apps" | [X][rh-apps-x]; our research | `Later` |
| R7 | News and stats | Talk about AI trading agents generally | Amplifying Robinhood news; mixing Robinhood brokerage stats with Robinhood Chain stats in public posts | [Brand guidelines][rhc-brand] | `Now` |

### Security, Trust and Team

| # | Claim | Allowed wording | Forbidden wording | Source or proof | True from (stage) |
|---|---|---|---|---|---|
| S1 | Credentials | "We never receive your Robinhood credentials" | — | Internal policy doc | `T` |
| S2 | Harness data | "Opt-in, encrypted per user, deletable on request" | "Anonymous", "we store nothing" | Internal policy doc | `T` |
| S3 | Injection | "Token text reaches your agent only in a marked untrusted field" | "Injection-proof" | Internal harness spec | `T` |
| S4 | Receipts | "Merkle roots on-chain every 5 minutes; harness decisions stay private" | "Every call is public" | Fact sheet §3 | `T` |
| S5 | Contract review | "AI-assisted and automated review, not a professional audit: AI multi-agent review, Slither and Aderyn, Foundry fuzz and fork tests, and a public code-review window, plus a bug bounty up to $500 paid from creator fees. The token gate is that review of the receipts contract, which holds no funds. A paid audit comes later, funded by fees." | "Audited", "externally audited", "professionally reviewed" | Fact sheet §4, §8 | `D0` |
| S6 | Open source and sanctions | "The playbook library and receipts verifier are open source. Trades are screened against the OFAC SDN list." | — | Internal roadmap; internal policy doc | `T` (contracts `Confirm`) |
| M1 | Team | "We're an anonymous team. Trust comes from what anyone can check: the public dev and burn wallets, daily public burns, public receipts, open-source code and weekly shipping." | Names, prior projects, "doxxed", hints at any other project by the team | Fact sheet §0 | `T` |
| M2 | Team trading | "No trading ahead of our outputs; blackout windows; project wallets (dev, burn, timelock) public" | "The team holds nothing" (unless confirmed) | Internal policy doc; fact sheet §0 | `T` |
| M3 | Dev wallet | "Public dev wallet, separate from the burn wallet; creator fees pay running costs (~$1.5–2.5k/mo); monthly note" | — | Fact sheet §5, §9 | `D0` |
| M4 | Team tokens | "If any are bought at launch, they're disclosed and locked on the same timelock" | "No team tokens" (unless confirmed) | Internal GTM plan | `D0` |

### Market Context

| # | Claim | Allowed wording | Forbidden wording | Source or proof | True from (stage) |
|---|---|---|---|---|---|
| X1 | Rug ring | "One rug ring took at least $18.43M across 53 Pons launches using anti-sniper exemption wallets" | "EKO caught the ring" (unless DEV confirms the backfilled cards show it) | [The Block][theblock]; [Yahoo][yahoo] | `Now` |
| X2 | Pons scale | "Pons: ~25k launches on its peak day (2026-09-02); top-4 fees in crypto that day" | — | [CoinDesk][coindesk-pons] | `Now` |
| X3 | Terminals | "GMGN and Axiom have no token (per our research). On 2026-08-31, Pons and GMGN took about 70% of all launchpad and trading-bot fees across crypto (crypto.news)." | "The top terminals are dying" | Our research; [crypto.news][cryptonews] | `Now` |
| X4 | Agent share | "Nobody publishes an agent share of buying for Robinhood Chain" | The unsourced Solana "34%" figure | Fact sheet §2; [Blockonomi][blockonomi] | `Now` |
| X5 | ERC-8004 | "~6.5k agents in the ERC-8004 IdentityRegistry on Robinhood Chain" | "6.5k agents trading" | [Explorer][erc8004] | `Now` |
| X6 | Chain | "Chain ID 4663, built on Arbitrum technology. ~100 ms blocks and ~1¢ typical transactions (our on-chain measurements). The gas subsidy ended around 2026-09-29." | — | [Chain docs][rhc-connect] (chain ID); our on-chain measurements; [KuCoin][kucoin] and [crypto.news][cryptonews] (subsidy) | `Now` |

### Wrong vs Right

| # | Wrong | Right |
|---|---|---|
| 1 | "EKO is the safety layer for Robinhood's AI agents." | "A harness for the agent you've connected to Robinhood through its MCP. Built on Robinhood Chain. Not affiliated with, endorsed by, or officially connected with Robinhood Markets, Inc." |
| 2 | "Our guardrails lock down your Robinhood agent." | "For Robinhood-connected agents, preflight is advisory: your agent is instructed to check it, Robinhood's trade approvals, if you turn them on, stay the hard stop, and Mission Control flags orders that skipped it. [D-2]" |
| 3 | "Rug-proof trading is live." | "Every trade is simulated buy-then-sell before you sign, and failed sells are refused. Refused: [N]. Missed: [N]. [link]" |
| 4 | "Terminal volume = a constant bid under our chart." | "From token day, the terminal fee on Uniswap-routed trades funds a daily public buy-and-burn. Today's burn: [N] `$EKO`. Tx: [hash]." |
| 5 | "29M Robinhood users are about to ape Robinhood Chain with agents." | "Robinhood is rolling out agents to ~29M customers. Those in-app agents trade inside the brokerage, not on Robinhood Chain. [D-2]" |
| 6 | "Our AI called 8 of 10 winners this week." | "This week the Danger list rugged at [N]% vs [N]% for all launches. Forecasts are beta. Full record: [link]" |
| 7 | (at `T`) "Mission Control is live: approve from your phone." | "Mission Control ships at token launch: approvals on the web, notifications on Telegram." |
| 8 | "Milestone buy incoming, get in before the pump." | "Milestone: 1,000 wallets connected. As committed, 10% of creator fees earned since launch buys `$EKO` within 72h, into the public 6-month timelock. The tx will be posted here." |
| 9 | "EKO: CLEAR. Safe to ape." | "Clear: no playbook matches, sell simulation clean, exit cost [N]% at $1k. Live status; it can change. DYOR · Not financial advice · AI-generated analysis" |
| 10 | "Hold `$EKO` and earn from every trade." | "Holding lowers your fee (down to 0.25%) and unlocks more agents and research runs. Nothing is paid to holders." |
| 11 | "Trustless, automated burns. Nobody can touch the burn wallet." | "Burned daily from a public burn wallet; every transaction posted. Today's burn tx: [hash]. An automated Burn Engine is planned for Drop 7, once reviewed." |
| 12 | "Built by the team behind [project]." | "We're an anonymous team. Check the work instead: dev wallet [DEV_WALLET], burn wallet [BURN_WALLET], every burn tx, the Scoreboard and our open-source code." |
| 13 | "Audited contracts." | "AI-assisted and automated review, not a professional audit. The code is public and the bug bounty is live: [link]." |
| 14 | "0.5% of every trade, on any coin, is burned." | "The terminal fee on Uniswap-routed trades (0.5%, less by tier) goes to the public burn wallet and is burned daily. Pons-curve trades carry no terminal fee at launch." |

## 05 · Required Disclaimers and Where They Go

**The three required texts (fact sheet §6):**
- **D-1:** "DYOR · Not financial advice · AI-generated analysis"
- **D-2:** "Not affiliated with, endorsed by, or officially connected with Robinhood Markets, Inc."
- **D-3:** "#ad"

> **Rule of thumb:** if "Robinhood" appears in a post or its image, D-2 appears in the post or its image. If a post shows analysis (a verdict, card, Census number or research note), D-1 appears.

| Location | Required | Notes |
|---|---|---|
| X main bio | D-2 | "The harness your trading agent runs inside. Built on Robinhood Chain. Not affiliated with, endorsed by, or officially connected with Robinhood Markets, Inc." (156 characters) |
| X bot bio | D-1 | "Automated scan cards. Summoned only." plus D-1. X's automated label names the operator. |
| Pinned posts (X, Telegram, Farcaster) | D-1, D-2 | Plus official links and "we never DM first" |
| Every scan card image | D-1, D-2 in the footer | Plus block height, receipt ID and "live status; can change" |
| Token posts (launch, burns, milestones, fees) | "Not financial advice."; D-2 if Robinhood is named | Never price, chart or market cap |
| Paid KOL posts | D-3 as the **first** line, not buried in hashtags ([FTC][ftc]); D-2 if Robinhood is named | The KOL's holdings disclosed |
| Demo videos | D-1 on the end card; D-2 if Robinhood appears | Pre-release builds carry "Pre-release: [feature] ships [stage]" on screen |
| Spaces and streams | D-1 and D-2, spoken at the start | |
| Website | D-2 in the footer; D-1 on every verdict, note and Census page | Policies linked |
| Telegram bot | D-1 and D-2 in the description and `/start` | |

## 06 · Channel Setup (Content Side)

### X: Two Accounts

| | Main: `{{MAIN_HANDLE}}` | Bot: `{{BOT_HANDLE}}` |
|---|---|---|
| **Run by** | Humans (ML; OWN approves token, team and crisis posts) | Automation, labelled "Automated by `{{MAIN_HANDLE}}`" |
| **Posts** | Announcements, threads, Ghost Reports, Census, Drops, Spaces, KOL relations, quote-posts of the bot's best cards, milestones, the weekly burn report, crisis statements | Summoned scan replies `D0`; every burn tx (the launch buy-and-burn and each daily burn) and the Pons buyback totals `D0`; Census numbers `Gate`; milestone-buy txs |
| **Writing** | Humans. LLM drafts need human approval (internal GTM plan). Scheduling through X's native scheduler. | Deterministic templates plus a card image. No LLM text (internal policy doc). |
| **Premium** | X Premium | X Premium |
| **Pinned** | Waitlist (`T-10`); "Paste any CA" (`T`); the official CA and "Tag `{{BOT_HANDLE}}` scan [CA]" (`D0`) | How to summon, plus D-1 and D-2 |

**Bot behaviour rules** (internal policy doc; [X developer guidelines][x-dev]):
1. **Summoned only.** It replies only when @mentioned or quoted.
2. **One reply per interaction.**
3. **A card image, never a link.** Scan links shared by users unfurl as cards on their own.
4. **Deterministic templates only.** No LLM text.
5. **It never tags or mentions anyone unprompted.** No DMs.
6. **Rate-limited.** Tell users to summon with a CA, because tickers are ambiguous on a chain full of clones.
7. **If it's suspended,** never open a replacement account (see 12).

### Telegram

| Surface | What | From |
|---|---|---|
| Announcement channel (read-only) | Launches, Drops, burn recaps, milestone buys, incident notices. The only place besides main that posts our CA. | `T-10` |
| Community group | Moderated per 11; the scan bot is inside | `T-10` |
| Group scan bot | Paste a CA or $ticker to get a verdict card plus a link to its record | `T` |
| DMs | Alerts `T`; approval notifications `D0` (approve on the web) | `T` / `D0` |

**Never in Telegram:** trading, Mini Apps, wallet connect or sales. Telegram has acted against trading bots before, and digital goods sold inside Telegram need Stars ([bot terms][tg-bot]).

**Group scan bot program (call-group admins):**
- **Recruit:** 10+ groups for the beta, 50 by day 30 (fact sheet §9).
- **Offer:** free group premium: a caller leaderboard with receipts and a "Scanned by EKO" badge (`T`).
- **Admin rules (proposed):** pin D-1 and D-2, and never sell promotions for Danger-flagged coins. Breaking them loses the badge.

### Farcaster and Mascot Presence

- **Farcaster:** a summon bot via Neynar or our own node `D0`, with the same card and the same rules. The main presence cross-posts Drops and Census posts.
- **Mascot:** the same ghost and echo-ring mark on every account, the favicon and the OG images, plus a Telegram sticker pack `T`.
  - Content speaks in the mascot voice.
  - **Crisis, legal, fee and team statements use the company voice.**
  - The mascot's own ERC-8004 identity is planned (internal GTM plan) `Confirm`.

## 07 · Content Engine

### Cadence

| When | Post | Account | From |
|---|---|---|---|
| Daily AM | Stats card | Main | `T+1` |
| Daily | Ghost Report (1–2 max) | Main | `T-10` |
| Daily | Harness tip or demo clip | Main | `T-9` |
| Daily | Census number | Bot, quoted by main | `Gate` |
| Daily, after each burn | Burn post: the daily burn tx, plus Pons buyback totals | Bot | `D0` (first one on `D0` evening) |
| Weekly | Burn report: the week's burns, burn-wallet inflows by source, Pons buyback totals | Main | `D+7` (~Oct 27) |
| Mon | Scoreboard weekly: Clear list vs all launches, Danger-list rug rate, misses | Main | After `T+7` |
| Sun / Tue | Drop teaser (48h ahead) / Drop day | All | `Drop 1`+ |
| Wed / Sat | Agent Wrapped / agent obituaries | Main | After `D0` |
| Fri | Beat the Swarm (`D0`); Arena (`Drop 3`) | Main | `D0` |
| Monthly (first working day) | Dev-wallet note: fees earned, costs paid, milestone buys, and the trading fee paid by the daily burn buys | Main | Mon Nov 2 |

### Ghost Report

> **Template:** "[Playbook] on Robinhood Chain. Coin: [CA]. What the engine saw: [evidence]. History: this deployer or crew has run it [N] times. [card]"

**Rules:**
- Contracts and wallets only, never people. DEV verifies the evidence.
- The team trading blackout applies.
- Posts before `T` say "from our pre-release engine".

**Examples:**
1. "Clone swarm. [N] tokens named $[SYMBOL] launched within [N] minutes of the original, each with one buyer and one seller. The original is [CA]. Check the contract, not the ticker."
2. "Exemption-wallet insiders. [N] wallets exempt from the anti-sniper tax bought [N]% of supply in block one. It's the playbook one ring used to take at least $18.43M across 53 Pons launches ([The Block][theblock])."
3. "Agent bait. $[SYMBOL]'s description contains instructions aimed at AI agents. If your agent reads token text, this was written for it."

### Census Post (only after the label gate)

> **Template:** "Agent Census, [window]: [N]% of Robinhood Chain buys came from wallets labelled as agents (Declared [N]% · Likely [N]%). Crews [N]%. Humans [N]%. Method: [link]. [D-1] [D-2]"

1. The daily number, in the template above (with D-1 and D-2).
2. "AI trading agents keep making headlines. Here's the on-chain view: today [N]% of Robinhood Chain buys came from labelled agent wallets. Method: [link]. [D-1] [D-2]"
3. "The most agent-heavy coins this week: [list]. Agent-heavy isn't a verdict: [N] of these are flagged Monitor. [D-1] [D-2]"

> Before the gate, only the methodology page and "labels in calibration" may be posted. Don't amplify Robinhood news, and don't mix Robinhood brokerage stats with Robinhood Chain stats in public posts (R7).

### Burn Post (stats only)

> **Template (bot):** "Daily burn: [N] `$EKO` bought with the burn wallet's full balance and burned. Tx: [hash]. Funded by terminal fees [N] · API and x402 revenue [N] · token payments [N]. Total: [N] ([N]% of supply). Burn wallet: [BURN_WALLET]. Not financial advice."

1. The daily post, in the template above.
2. "Pons buyback, last 24h: [N] `$EKO` across [N] buys. Full list: [link]. Not financial advice."
3. Weekly (main, from `D+7`): "Week [N] burn report: [N] burns · [N] `$EKO` · [N]% of supply to date. Burn-wallet inflows: terminal fees [N] · API and x402 [N] · token payments [N]. Pons buyback: [N]. Every tx: [link]. Not financial advice."
4. "[N]% of supply burned since launch. Every burn tx: [link]. Not financial advice."

> **Never:** price, charts, market cap, "bid", "support", "floor" or "pump". Don't answer price replies.

### Scan Card Replies (bot, `D0`)

> **Template:** "[Verdict] · $[SYMBOL] · [top reason]. Receipt [ID]." plus the card image, whose footer carries D-1, D-2 and the block height.

1. "Danger · $[SYMBOL] · Sell simulation reverted (honeypot). Receipt [ID]."
2. "Monitor · $[SYMBOL] · Owner can change the tax. Exit cost at $1k: [N]%. Receipt [ID]."
3. "Clear · $[SYMBOL] · No playbook matches at block [block]. Receipt [ID]."

### Drop Teaser, Launch and Recap

Every Drop gets a 48h teaser, a demo video, a release note (what shipped, eval scores, known limits) and a mascot post (internal update plan).

| Drop | Teaser | Launch | Recap |
|---|---|---|---|
| **1** | "Tuesday: the number nobody publishes for Robinhood Chain becomes a live index. [D-2]" (only if the label gate has passed) | "Drop 1 is live: the Agent Flow Index, x402 API, annotations and lenses. Release note: [link]" (the Agent Flow Index only if the label gate has passed; otherwise drop it from both posts) | "One week in: [N] API calls. Known limits: [list]." |
| **3** | "Your agent wants a fight. Tuesday." | "The Arena, Season 1: agents and swarm personas, on paper. Skill-based prizes, no purchase needed." | "[N] agents entered. Leaderboard: [link]." |
| **5** | "Your agent. Your box. Tuesday." | "Agent Launcher: your own agent on your own Akash or VPS box. We never operate it." | "[N] agents running on their owners' boxes." |
| **7** | "Daily burns are about to run themselves. Tuesday." (only if the Burn Engine's review is done; otherwise tease Score and Inside only) | "Drop 7: the automated Burn Engine replaces our manual daily burns. Contract: [link]. Review: [link]. Renounce tx: [hash]." (post "renounced" only with the tx) | "First week of automated burns: [N] burns, [N] `$EKO`. Every tx: [link]." |

**Slide template:** "Drop [N] slides a week. [Feature] hasn't passed [eval] yet, and we don't ship broken."

### Agent Wrapped, Obituaries, Arena (after `D0`)

- **Wrapped:** personal cards only from opt-in `share` journals.
- **Obituaries:** public ERC-8004 agents or owner-submitted ones only. Never name the owner. The lesson, not mockery.
- **Arena:** rank by season score, never "% return".

| Format | Example 1 | Example 2 | Example 3 |
|---|---|---|---|
| **Wrapped** | "[N] agents, [N] preflights, [N]% denied. Top reason: position cap." | Opt-in card: "My agent's week: [N] preflights · [N] denied · [N] asked me first." | `Drop 1`+: "The [N] most active declared agents bought [N] Danger-flagged coins this week." |
| **Obituary** | "RIP agent #[ID]. It bought $[SYMBOL] whose sell simulation had reverted since block [block]. Lesson: simulate the sell." | "RIP a DCA Loop that averaged into a coin stuck at bonding for [N] days." | "RIP [name], submitted by its owner. It had no daily loss limit." |
| **Arena** (`Drop 3`) | "Season 1 is open. Paper only, skill-based prizes, no purchase needed." | "Week [N]: [agent] leads on season score. [link]" | "Persona [name] got farmed by clone swarms [N] times this week." |

### Harness Demo Clips (20–45 seconds)

Each clip shows the problem, then the preflight result, the human's decision and the journal entry. The stage tag and D-1 are on screen, plus D-2 where Robinhood appears.

1. `T`: "Your agent tries to buy $[SYMBOL]. Preflight: deny, because it matches the honeypot playbook. Journaled."
2. `D0`: "Your agent wants $2k of a coin, and your approval limit is $1k. Needs approval. You approve on the web."
3. `D0`: "Soft kill: every preflight returns deny. Hard kill: a deep link to disconnect the agent in Robinhood."

## 08 · Launch Campaign, Day by Day

| Day | Beat | Channel | Asset | Owner | Copy |
|---|---|---|---|---|---|
| `T-10` Oct 3 | Accounts live; mascot teaser; first Ghost Report (pre-release engine); Telegram opens; waitlist | X, Telegram | Static silhouette, Ghost Report card | ML; DEV verifies | "Something has been listening to the chain. Don't be an echo." |
| `T-9` Oct 4 | Harness demo #1 | X | 30s clip | ML, DEV | "My agent tried to buy a coin matching a scam playbook. EKO said no. Then it hit my size limit and had to ask me. (Pre-release; approvals ship at token launch.)" |
| `T-8` Oct 5 | Ghost Report #2; recruit 10–20 callers and KOLs, and 10+ group admins | X, DMs | Outreach script | ML | Ghost Report template (07) |
| `T-7` Oct 6 | Mascot reveal; Census method page | X, Telegram, site | Full mascot | ML, DEV | "Meet EKO. It listens to who's buying: agents, crews or humans. Numbers come once our labels pass 90% precision." |
| `T-6` Oct 7 | Closed beta (Oct 7–12) | Telegram, email | Invite | ML | "Closed beta: trenchers, 20–50 agent owners, 10+ groups." |
| `T-5`→`T-2` | Daily Ghost Report; testers' bag cards (with consent); KOL previews; Space announced | X, Telegram | Space card | ML | "Launch Space Tuesday: we scan launches live." |
| `T-1` Oct 12 | Launch-eve thread | X, Telegram | Scope graphic | ML; OWN | "Tomorrow: terminal, guard, Scan my bags, Claude Code pack, Scoreboard. No token until four public gates pass." Add "EKO in your Claude app" only if the connector login is live. |
| **`T`** Oct 13 | Launch thread; beta recap; group bot live; policies published; Space AMA; live Radar stream | All | Launch video, pinned post | ML, DEV, OWN | "EKO is live on Robinhood Chain. Paste any CA. Scan your bags. Trade behind the guard. Free all launch week, including a 0% terminal fee until token day. No token. [D-1] [D-2]" |
| **`T`** Oct 13 (target) | Claude app connector clip (only once the login is live; otherwise it moves to `D0`) | X | 30s setup clip | ML, DEV | "Add EKO to your Claude app: Customize → Connectors → + → Add custom connector, paste `https://mcp.{{DOMAIN}}`, log in. [D-1]" (H13) |
| `T+1`→`T+6` | Daily stats; Ghost Report; gate tracker; public code-review window for the receipts contract | X, Telegram | Stats card | ML, DEV | Below |
| `D0-1` Oct 19 | Gate status: go or slide | X, Telegram | Gate card | OWN | Run-of-show |
| **`D0`** Oct 20 | Token launch; $100 launch buy-and-burn; burn wallet live; contract review summary published; first daily burn posted in the evening | All | Run-of-show | All | Run-of-show |
| `D0+1` Oct 21 | Tiers, trial, referrals | X, site | Tier card | ML | "Tiers are on: [N] / [N] / [N] `$EKO` for Reader / Oracle / Source (about $50 / $250 / $1,000 when set today), by 24h minimum balance. Reviewed monthly; only ever lowered. Nothing is sold before it ships." |
| `D0+2`→`+6` | Daily burn posts, Ghost Report, Census (if gated); Beat the Swarm S1; Drop 1 teaser (Oct 25) | X, bot | Burn card | ML, DEV | Burn post template (07) |
| **`Drop 1`** Oct 27 | AFI (if the label gate has passed), x402, annotations, lenses; **first weekly burn report (`D+7`)**; Bounty Week #1 | All | Demo, note, burn report card | ML, DEV, OWN | Drop table (07); weekly burn report (07) |
| Mon Nov 2 | First monthly note (covers Oct 20–31) | X, Telegram | Note card | OWN | "October: creator fees [N]; costs [N]; milestone buys [N]; trading fee paid by the daily burn buys [N]; Pons buyback [N]. Wallets: [DEV_WALLET] · [BURN_WALLET]" |
| `Drop 2` Nov 3 | Rug Ring Radar, leaderboards; first media pitch (two weeks of gated Census data) | X, email | Crew graph clip | ML | "This crew has run stuck-at-bonding [N] times. Now you can see every crew." |
| `Drop 3` Nov 10 | The Arena, Season 1 | All | Trailer | ML | Drop table (07) |
| `Drop 4` Nov 17 | The Desk, Ask the Swarm | X, stream | Transcript clip | ML | "Watch AI agents argue about your bag." |
| `Drop 5` Nov 24 | Agent Launcher | All | Demo | ML | Drop table (07) |
| `Drop 6` Dec 1 | Rule Lab Pro and stocks; Agent Herd: Stocks weekly | X, newsletters | Demo | ML | "Test your stock Loop on your own Robinhood data before you fund it. [D-1] [D-2]" |
| `Drop 7` Dec 8 | EKO Score (ERC-8004), Inside; the automated Burn Engine replaces manual burns (if its review is done), with its renounce | X, partners | Widget demo; engine explainer | ML, OWN | "Agent reputation, written to the ERC-8004 registry." Engine copy in the Drop table (07), only if it ships. |
| `Drop 8` Dec 15 | Base | X, Farcaster | Demo | ML | "Radar, guard, playbooks and harness, now on Base." |
| `Drop 9` Dec 22–29 | Institutional pack, marketplace, EKO as an agent | X, direct | Whitepaper | ML, OWN | "Point-in-time dataset, methodology, SLA page." |

### Beta-Week Public Stats Posts

**At `T`:**
> "Closed beta, Oct 7–12: [N] testers, [N] verdicts, [N] honeypots refused, [N] missed, [N] agents connected, [N] preflights. Log: [link]. [D-1]"

**From `T+1` to `T+6`:**
> "Day [N]. Verdicts: [N]. Honeypots refused [N] · missed [N]. Agents [N] · preflights [N]. Wallets [N]. Census: [labels in calibration / N%]. Every number: [Scoreboard link]"

**Rules:** if misses are above zero, that line goes first. The unchecked-order rate joins at `D0`. At `D0`, post the week in numbers before the CA.

### Token-Day Run-of-Show (content side)

| Time | Action | Owner | Copy or check |
|---|---|---|---|
| `D0-1` | Post only if all four gates are green (fact sheet §4) | OWN | "All four token gates are green: zero honeypot fills, eval gates green, contract review done (AI-assisted and automated, not a professional audit; the summary publishes on token day), bug bounty live, up to $500 ([link]). The CA will be posted only here, on Telegram and on `{{DOMAIN}}`." If any gate is red: "One gate isn't green: [gate]. The token waits." **Never post the launch time.** |
| H0 | Token created on Pons: 1% creator tax (fixed, never raisable) on top of Pons's 1% standard fee (2% total); native buyback on at the slice OWN confirmed (tentatively 25% of the creator's Pons-fee share), locked at creation; paired with ETH | OWN; DEV confirms the CA | — |
| H0+1m | Launch buy-and-burn: after the anti-sniper tax window, the public dev wallet buys $100 of the token and burns it immediately | OWN; DEV confirms the tx | — |
| H0+2m | CA posted on main, the channel and the site at the same time; pinned | ML | "`EKO` (`$EKO`) is live on Pons. Official CA: [CA]. This post, our Telegram channel and `{{DOMAIN}}` are the only sources. Not financial advice." |
| H0+2m | Launch buy-and-burn post (bot; main quote-posts) | Bot, ML | "Launch buy-and-burn: the public dev wallet [DEV_WALLET] bought $100 of `$EKO` and burned it. Tx: [hash]. Scanners show it as dev buy → burned. Not financial advice." |
| H0+5m | Burn wallet goes live | ML; OWN | The "burn wallet is live" post (below) |
| H0+10m | Self-scan | ML | "We scanned our own token with the same engine. It's ours, so judge it yourself: [card]. It shows "Fixed 1% creator tax (immutable)" as Info, alongside Pons's 1% standard fee, and the launch buy as dev buy → burned." |
| H0+20m | Fee-routing thread | ML; OWN | 2% total trading fee = Pons 1% + 1% creator tax (fixed, never raisable); creator fees to [DEV_WALLET] (~1.7% of volume, less the buyback slice); Pons buyback on (tentatively 25% of the creator's Pons-fee share; shown on the Burn Board and in daily bot posts); terminal fee on Uniswap-routed trades, paid-API and x402 revenue and token payments to [BURN_WALLET], bought and burned daily with every tx posted; Pons-curve trades carry no terminal fee at launch (a reviewed fee router comes later); milestones to [TIMELOCK]; no airdrops; automated Burn Engine planned for Drop 7, once reviewed |
| H0+40m | Go-live thread | ML | The `D0` feature list (fact sheet §4), plus the contract review summary ([link]; AI-assisted and automated review, not a professional audit) |
| H+1 | KOL posts, staggered; ML checks D-3 and D-2 on each | ML | Brief in 10 |
| H+2 | X Space with spoken disclaimers | OWN, DEV, ML | — |
| `D0` evening | First daily burn: the team buys and burns the burn wallet's full balance | Bot; main quote-posts | Burn post template (07) |

**Never on token day:** price, charts, market cap, "wen pump" replies, reposting holders' price posts, or deleting criticism.

### Burn Wallet Live, and the Daily Burn

- **`D0`, burn wallet live** (company voice; OWN approves):
  > "The burn wallet is live: [BURN_WALLET]. It receives only the terminal fee on Uniswap-routed trades, paid-API and x402 revenue, and token payments, never dev fees. Once a day we buy `$EKO` with its full balance and burn it, and every transaction is posted here, on Telegram and on the Burn Board. First burn: this evening. Not financial advice."
- **Every day from `D0`:** the bot posts each burn tx (Burn Post, 07). If a burn is late, see "Missed or late daily burn" (12).
- **`D+7` (~Oct 27):** the first weekly burn report (07).
- **Wording:** "burned daily from a public burn wallet; every transaction posted" (K6). The launch burns are manual, so never describe them with K6's forbidden words.
- **Later (`Drop 7`, target ~Dec 8, only if its review is done):** the automated Burn Engine replaces the manual burns, and its renounce happens then. Tease it only once it's on the public roadmap page (Drop table, 07; K8).
- **Record:** every burn tx is logged on the Burn Board.

### Milestone-Buy Announcements

**Milestones** (fact sheet §5):
- 1,000 wallets connected
- 100 agents connected
- $1M cumulative terminal volume
- 30 days with zero honeypot fills
- $10M cumulative terminal volume

| Step | Copy |
|---|---|
| Hit (DEV confirms with a public link) | "Milestone: [milestone] ([link]). As committed, 10% of creator fees earned since [launch / the last milestone] buys `$EKO` within 72h from the public dev wallet, locked for 6 months in [TIMELOCK]. Not financial advice." |
| Executed (bot posts; main quote-posts) | "Milestone buy executed: [N] `$EKO` to [TIMELOCK]. Tx: [hash]. Logged on the Scoreboard." |
| Burn variant (OWN's choice) | "Milestone buy executed and burned instead of locked: [N] `$EKO`. Tx: [hash]." |

**Never:** tease a milestone as a catalyst, or write "almost there, get in".

## 09 · Growth Loops and Programs

| Program | How it works | Integrity rule | From |
|---|---|---|---|
| **Bot in every group** | Free group premium: a caller leaderboard with receipts and the "Scanned by EKO" badge | Badge removed if a group sells promotions for Danger-flagged coins | `T` (bot, caller leaderboard and badge) |
| **Bag reports** | Scan my bags makes a shareable card ("3 of your 7 coins match scam playbooks") | The user chooses whether to share | `T` |
| **Clear badge** | Clean launches post a live "EKO: Clear" card | **Revoked live, the moment a project turns bad,** and revocations are posted. Never sold. Not an endorsement. | `D0` |
| **Verified caller** | A public graded page and badge | Graded against all launches, misses included. Never sold. | `Confirm` |
| **Referrals** | +30 min of trial for both sides when the referred wallet trades through the guard or connects an agent | Qualifying wallets only; one trial per X/Telegram account | `D0+1` |
| **Bounty weeks** | Builders ship on the API; token prizes | Skill-judged, public criteria, no purchase; prize source disclosed (`Confirm`) | Around `Drop 1` |
| **Beat the Swarm / Arena** | Paper leaderboards against personas / weekly seasons | Skill-based prizes, no purchase, no random draws | `D0` / `Drop 3` |
| **EKO Points** | Credits for terminal trades, scans others use, confirmed Ghost Report tips, and leaderboard and bounty wins | Product credits, not tokens. Never put "points" next to "airdrop". | Accrue from `T`; redeemable from `D0+1` |

## 10 · KOL Program

### Deal Structure

- **Performance deals:** pay per verified trial activation or first guarded trade, tracked by referral links. No flat fees for single posts (internal GTM plan).
- **Payment:** crypto from dev fees; the asset is OWN's call. Dev fees start at `D0`, so pre-`D0` deals need OWN's sign-off on funding. Any token compensation must be disclosed.
- **Disclosure:** #ad on every paid post ([FTC][ftc]; internal policy doc).
- **Never pay for:** price calls, raids, engagement pods or follower boosts.

### Brief Template

```
Campaign: [name] · Stage: [T / D0 / Drop N] · Tracking link: [link]
Show on screen: paste a CA → verdict card | Scan my bags | agent preflight deny
One key message: harness for your agent | scam playbooks | terminal fees fund a daily public burn
Must include: "#ad" as the first line; D-2 if you name Robinhood; D-1 if you show analysis
Only features live at this stage. Draft to ML 12h ahead. Takedown or fix within 1h on request.
Pay: per [activation / first trade], in [asset], weekly
```

### KOL Do / Don't

| Do | Don't |
|---|---|
| Put #ad first | Talk price or "100x" |
| Show the product live | Say "safe", "rug-proof" or "guaranteed" |
| Use your own words | Say "Robinhood-backed", or use Robinhood logos |
| Say guardrails are advisory for Robinhood agents | Say we control Robinhood agents |
| Use the official CA from `{{MAIN_HANDLE}}` only | Hint at the token before `D0`, or describe Drops before they ship |

### Vetting Checklist

- [ ] Run their last 30 calls through our engine. How many matched Danger?
- [ ] Bot-follower check (Sorsa)
- [ ] Past #ad behaviour; no paid-pump or undisclosed-shill history
- [ ] Audience fit: Robinhood Chain trenchers, agent builders or AI traders
- [ ] Payout wallet screened against the OFAC SDN list
- [ ] Accepts performance pay, the brief and the 1-hour takedown rule

## 11 · Community Management

### Moderation Rules (pinned)

1. **The team and mods never talk price or make predictions.**
2. **Only the channel and main account post our CA.** Other "official" CAs are removed.
3. **Admins never DM first.**
4. **No shilling without a scan card.** Shills for Danger-flagged coins are removed.
5. **No harassment, doxxing or calling people scammers.** Point to the playbook evidence.
6. **No raids, engagement farming or referral spam.**

### FAQ Macros

| Command | Reply |
|---|---|
| `/wentoken` (before `D0`) | "Product first. The token launches on Pons once four public gates pass: zero honeypot fills, eval gates green, contract review done (AI-assisted and automated, not a professional audit), bug bounty live. Target ~Oct 20, gate-based. The CA comes only from our channel, main account and site." |
| `/wentoken` (after `D0`) | "Official CA: [CA]. That's the only one." |
| `/wenpump` | "We don't talk price. What we can show you: burns [link], the Scoreboard [link], the next Drop [date]. Not financial advice." |
| `/robinhood` | "Built on Robinhood Chain. Not affiliated with, endorsed by, or officially connected with Robinhood Markets, Inc." |
| `/safe` | "No tool makes trading safe. The guard refuses trades whose simulated sell fails, and we publish every miss: [link]. DYOR." |
| `/fees` | "Terminal: 0% until token day. From then, 0.5% on Uniswap-routed trades (less by tier), paid to the public burn wallet and burned daily. Pons-curve trades carry no terminal fee at launch. Token: a 2% total trading fee, which is Pons's 1% standard fee plus a 1% creator tax that's fixed at creation and can never be raised. Creator fees go to the public dev wallet and pay running costs; Pons buys back automatically with part of them." |
| `/burns` | "Burned daily from a public burn wallet; every transaction posted: [link]. It receives the terminal fee, API revenue and token payments, never dev fees. Not financial advice." |
| `/audit` | "No paid audit yet. Our contracts get AI-assisted and automated review, not a professional audit, plus a public code-review window and a bug bounty up to $500: [link]. A paid audit comes later, funded by fees." |
| `/team` | "We're an anonymous team. Check the work instead: dev wallet, burn wallet, daily burns, receipts, open-source code and a Drop every week: [link]." |
| `/airdrop` | "No airdrops. EKO Points pay product credits." |

### Scam Impersonators

- **Before `D0`:** "There is no token yet. Anything using our name isn't ours."
- **Clones after `D0`:** call them out in a Ghost Report: "Clone alert: [N] tokens copying `$EKO`. Ours is [CA]."
- **Fake accounts and support bots:**
  - report them on X and Telegram
  - list the official handles on the site
  - repeat "we never DM first"
- **Fake Clear badges:** the real badge is live and links to the card. A screenshot isn't a badge.
- **Presales:** once OWN confirms there's none (`Confirm`), add "There is no presale" to the macros.

## 12 · Crisis Comms Playbooks

**Every incident, first hour:**
1. ML pauses scheduled posts, and DEV pauses any affected bot templates.
2. DEV confirms the facts, and OWN approves the statement.
3. The holding statement goes out on main and the channel within 60 minutes, in the company voice.
4. No price talk, no deleting, no blame.
5. Updates at a stated interval, then a post-mortem.

| Incident | First-hour steps | Holding statement |
|---|---|---|
| **Honeypot missed by the guard** | DEV pauses live trading (internal runbook); log it under "honeypots missed"; support contacts the user (never asking for keys). Before `D0`, the gate fails and the token waits. After `D0`, the zero-fills milestone clock resets. | "A trade through the EKO guard filled on a coin that turned out to be a honeypot. We've paused live trading while we investigate. It's logged under 'honeypots missed' on the Scoreboard, with a post-mortem within 24 hours." |
| **Wrong verdict** | Correct it on the Scoreboard (never delete). A wrong Ghost Report gets a correction quoting it, pinned for 24h. A wrong Clear badge is revoked live. Contact the project. | "We got $[SYMBOL] wrong. Our [verdict] at block [block] was wrong because [reason]. The record stays on the Scoreboard with a correction, and the rule is being fixed." |
| **Bot suspended** | Post the notice from main; the Telegram and Farcaster bots keep running; appeal through X; DEV audits 48h of bot actions. **No replacement account.** | "`{{BOT_HANDLE}}` is suspended on X and we're appealing. Scans still work at `{{DOMAIN}}`, in Telegram and on Farcaster." |
| **Robinhood trademark complaint** | OWN complies the same day; remove or rename the asset; audit everything against [rhc-brand]; no public argument. | Only if asked: "We received a brand request and we're complying. EKO is built on Robinhood Chain and is not affiliated with, endorsed by, or officially connected with Robinhood Markets, Inc." |
| **Rug accusation against us** | Pin a facts post with on-chain links; scan our own token publicly; reply once; don't delete critics. | "Everything is on-chain: token [CA] (2% total trading fee: Pons's 1% plus a 1% creator tax that can never be raised); dev wallet [DEV_WALLET]; burn wallet [BURN_WALLET] (every daily burn tx: [link]); launch buy-and-burn [hash]; timelock [TIMELOCK]. If you see something we missed, send the tx." |
| **Missed or late daily burn** | DEV confirms the burn wallet's balance is untouched; post the reason; run the burn as soon as possible and post the tx; note the gap on the Burn Board. (From `Drop 7`, if the automated Burn Engine ships, this row also covers engine bugs: pause burn posts, no loss figures until DEV confirms, and fix with a new, reviewed engine.) | "Today's burn is late: [reason]. The burn wallet's balance hasn't moved ([BURN_WALLET]), and it will be bought and burned in full; the tx will be posted here." |
| **Data outage** | Post a status update; note the window on the Scoreboard; disclose any receipts gap. When simulations fail the guard refuses trades, and Fast Scan runs rules-only if the AI is down (internal architecture doc). | "EKO data is delayed since [time UTC]. While simulations are down, the guard refuses trades rather than letting them through. Cards show their block height, so treat older ones as stale." |
| **Team or wallet question** | OWN answers in the company voice. The team is anonymous, so point to what anyone can check: the dev and burn wallets, every burn tx, the receipts, the open-source code and the monthly note. Never name or hint at team members or other projects (M1). If a project wallet broke policy: admit it, disclose it, state the remedy. | "We're an anonymous team, so we don't ask you to trust names. What you can check: the dev wallet [DEV_WALLET] (creator fees in, running costs out, monthly note); the burn wallet [BURN_WALLET] (every daily burn posted); receipts [link]; our open-source code [link]. Policy: no trading ahead of our outputs, blackout windows." |

## 13 · Asset Checklist

| Asset | Spec | Needed by | Owner |
|---|---|---|---|
| Brand kit | EKO wordmark and echo-ring mark; palette not confusingly similar to Robinhood's | `T-10` | ML |
| Mascot poses | Neutral, listening, resolved/flickering/static (verdict states), Ghost Report (lantern), Mission Control (with phone), fire, Wrapped, obituary, Arena | `T-7` | ML |
| Card templates | Scan, bags, stats, Ghost Report (`T`); daily burn, launch buy-and-burn, weekly burn report, milestone, Clear badge, tier (`D0`); Census (`Gate`). Every footer carries D-1, D-2, block height and receipt ID. | Per stage | ML, DEV |
| Demo videos | Harness #1 (`T-9`); bags, guard refusal, Claude Code install, Claude app connector setup (`T`, or `D0` if the login slips); Mission Control, Rule Lab, Deep Research (`D0`); one per Drop: Drops 1–7 have recorded demos before `D0`; Drops 8–9 are demoed before their release (internal update plan) | Per stage | ML, DEV |
| OG images | Site, scan pages, Census, Scoreboard, Burn Board, Drops | `T` / `D0` | DEV |
| Pinned posts | Main (`T-10`, `T` and `D0` versions); bot; Telegram | Per stage | ML |
| One-pager and media kit | Pillars, stage table, disclaimers, method page, sourced fact sheet | `T-7` | ML |
| Group-admin kit, sticker pack | Setup guide, demo GIF, admin FAQ | `T-8` / `T` | ML |
| Policy links | ToS, privacy, risk and AI disclosures, team trading policy, KOL disclosure policy | `T` | OWN |
| Crisis statements | All 8, pre-approved | `T-3` | OWN |

## 14 · FAQ

**Basics**
1. **What is EKO?** The harness your trading agent runs inside. Its first app is a trench terminal for Robinhood Chain (fact sheet §1).
2. **What's live at `T`?** Radar, new pairs, guarded trading, Scan my bags, alerts, the Scoreboard, the Telegram bot, and the Claude Code pack plus a generic MCP guide (Claude Desktop and claude.ai through Anthropic's custom connectors too, if the login is ready; otherwise at `D0`). Access is free all launch week, with a 0% terminal fee until `D0`.
3. **What comes at `D0`?** The token, the public burn wallet with daily burns, Mission Control, on-chain guardrails (enforced via session keys once the module's contract review passes; advisory until then), more agent packs, Rule Lab v1, Deep Research, perps links, summon bots and the Clear badge (fact sheet §4).
4. **Does it trade for me?** No. There's no custody and no auto-trading. You or your own agent trade.

**Robinhood**

5. **Is this Robinhood?** No. Built on Robinhood Chain. Not affiliated with, endorsed by, or officially connected with Robinhood Markets, Inc.
6. **Can I add it to my Robinhood agent?** Yes, if it's an external agent on Robinhood's MCP. Claude Code pack plus a generic MCP guide at `T`. In Claude Desktop or claude.ai, use Anthropic's official custom connectors: Customize → Connectors → + → Add custom connector, paste `https://mcp.{{DOMAIN}}`, log in (any Claude plan; Free allows one custom connector; targeted for `T`, otherwise `D0`) ([Anthropic][claude-connectors]). ChatGPT and OpenClaw at `D0`. Robinhood's in-app agents can't install it.
7. **Do Robinhood's agents trade on Robinhood Chain?** No. In-app agents trade inside the brokerage (fact sheet §2).
8. **Do you need my Robinhood login?** No, never.
9. **Are you in Agent Apps?** No. We found no public application path (per our research).

**Safety and the harness**

10. **Is it safe?** No tool makes trading safe. The guard simulates a buy and a sell before you sign and refuses failed sells. It can miss: every miss is published, with a post-mortem within 24h. Trades are also capped while we scale: $250 per trade for the first 72 hours after launch, then $1,000 (`T`).
11. **What does the guard refuse?** Failed sells, Danger matches and trades with no route, in every mode (`T`; internal product spec §8).
12. **What are the playbooks?** 13 patterns, from honeypots to clone swarms, exemption-wallet insiders and agent bait (fact sheet §3).
13. **What's agent bait?** Token text written to steer AI agents. We flag it and pass it on only in a marked untrusted field (`T`).
14. **How do guardrails work?** You set a policy once. Before each order your agent calls `preflight` and gets allow, deny or needs-approval, with the reasons journaled (`T`; internal harness spec).
15. **Advisory or enforced?** Advisory for external agents, including Robinhood-connected ones; Robinhood's trade approvals, if you turn them on, stay the hard stop. Enforced for on-chain agents via session keys, targeted for `D0`, once the module's contract review passes; advisory until then.
16. **Kill switch?** A soft kill denies every preflight. A hard kill deep-links you to disconnect in Robinhood, or revokes an on-chain session key (`D0`).
17. **Rule Lab?** Deterministic backtests of your strategy: crypto and Robinhood Chain from `D0`, stocks with your own data from `Drop 6`.

**Token and fees**

18. **Is there a token?** Not before `D0`. It launches on Pons, paired with ETH, once its gates pass. The CA comes only from our main account, Telegram channel and site.
19. **What are the gates?** Zero honeypot fills, eval gates green, a contract review of the receipts contract (it holds no funds; AI-assisted and automated review, not a professional audit), and a live bug bounty (up to $500).
20. **What does the token do?** It unlocks tiers and fee discounts, and it pays for research runs and premium features (those payments go to the burn wallet and are burned in the daily burn). There's no revenue share (`D0`; tiers `D0+1`).
21. **What are the fees?** Terminal: 0% during launch week, then 0.5% on Uniswap-routed trades (0.4 / 0.3 / 0.25% by tier); Pons-curve trades carry no terminal fee at launch. Token: a 2% total trading fee, which is Pons's 1% standard fee plus a 1% creator tax (terminal fee `D0`, 0% during launch week; discounts `D0+1`; token fee `D0`).
22. **Why a 2% trading fee?** It's Pons's 1% standard fee plus our 1% creator tax, which is fixed at creation and can never be raised. The creator side receives ~1.7% of volume, less the buyback slice; it goes to the public dev wallet, which pays running costs, and the monthly note shows every dollar in and out. Our own scanner shows the tax as "Fixed 1% creator tax (immutable)" at Info, alongside Pons's 1% fee (fact sheet §3, §5).
23. **Where do the fees go?** Creator fees (the 1% tax plus ~0.7% of the Pons fee, less the buyback slice) go to the public dev wallet. The terminal fee, paid-API and x402 revenue, and token payments go to a separate public burn wallet, which never receives dev fees. The rest of the Pons fee goes to the Pons protocol (fact sheet §5).
24. **How do burns work?** Once a day, at a scheduled time, the team buys the token with the burn wallet's full balance and burns it. Every transaction is posted to the Burn Board, the X bot and Telegram. The burn buys pay the token's 2% trading fee like any buyer. On token day, the dev wallet also buys $100 of the token about a minute after launch and burns it. Burns at launch are manual; an automated Burn Engine is planned for `Drop 7`, once reviewed (`D0`).
25. **Can the team take the burn wallet's balance?** It's an ordinary wallet the team controls, which is why every inflow and every burn is posted and its balance shows on the Burn Board. The full balance is burned daily, so anything else would show on-chain. The automated Burn Engine, planned for `Drop 7` once reviewed, is meant to replace this manual step.
26. **Is it audited?** No. There's no paid audit yet. Our contracts get AI-assisted and automated review, not a professional audit: AI multi-agent review, Slither and Aderyn, Foundry fuzz and fork tests, a public code-review window and a bug bounty up to $500. The contract gated for token launch, the receipts contract, holds no funds. A paid audit comes later, funded by fees (fact sheet §8).
27. **Pons buyback?** Pons automatically buys back on every trade of the token with 25% of the creator's share of the Pons fee (tentative until confirmed; locked at creation). There's no guaranteed amount. Charts may show these as ordinary buys, so the Burn Board and daily bot posts list them (`D0`).
28. **Milestone buys?** At five product milestones, 10% of creator fees earned since the last one buys the token within 72h, locked for 6 months. Never tied to price (`D0` onward).
29. **Airdrop?** No. EKO Points pay product credits. Points accrue from `T` and are redeemable from `D0+1`.

**Access and coverage**

30. **Tiers?** Listener (free), Reader, Oracle and Source, set by 24h minimum balance: token amounts worth about $50 / $250 / $1,000 at the `D0+1` price, reviewed monthly and only ever lowered (`D0+1`).
31. **Trial?** 30 minutes of full real-time access plus 1 Deep Research run. Wallets qualify with ≥ 7 days of age, ≥ 10 Robinhood Chain transactions or ≥ $20 balance. One per X or Telegram account (`D0+1`).
32. **Referrals?** +30 minutes for both sides per qualifying referral (`D0+1`).
33. **Which chains?** Robinhood Chain (4663) now; Base in `Drop 8`.
34. **Stocks?** A research lane in `Drop 6`, with your own data. We never execute stocks, and there's no stock-token trading.
35. **Perps?** Link-outs and a bring-your-own agent guide (`D0`). We never execute perps. We take no referral fees.

**Data, proof and team**

36. **Data sources?** Our own chain indexer. X context comes from Grok X Search via OpenRouter, plus Sorsa. Stock data is your own (`T`; X context `D0`; fact sheet §8).
37. **Privacy?** Harness data is opt-in, encrypted per user and deletable on request (`T`; internal policy doc).
38. **Receipts?** A Merkle root of our outputs goes on-chain every 5 minutes. Harness decisions stay private (`T`).
39. **Forecasts?** Beta. Verdicts are graded weekly against all launches. No win rates (`T`).
40. **Why no Census number yet?** It publishes only once label precision passes 90% (`Gate`; internal evals doc).
41. **Who's the team?** An anonymous team. Trust comes from what anyone can check: the public dev and burn wallets, daily public burns, public receipts, open-source code and weekly shipping. The team doesn't trade ahead of our outputs (fact sheet §0).
42. **Roadmap?** Nine weekly Drops, ~Oct 27 to ~Dec 29 (fact sheet §4). A Drop that isn't ready slides a week.
43. **X bot and Telegram?** From `D0`, tag `{{BOT_HANDLE}}` with a CA to get one card reply. In Telegram (`T`), paste a CA into the group bot. Approvals happen on the web, and there's no trading in Telegram.

## 15 · KPIs and Reporting

**Day-30 targets (fact sheet §9).** These are internal. **Never post them as promises.**

| Metric | Target | Metric | Target |
|---|---|---|---|
| Wallets connected | 3,000 | Terminal volume | $250k/day avg |
| Bag reports shared | 1,000 | Honeypot fills through the guard | 0 |
| Telegram groups with the bot | 50 | Precision (playbooks, labels) | ≥ 90% |
| Agents connected | 300 | Clear cohort beats all launches | ≥ 3 of 4 weeks |
| Preflights per day | 1,500 | Holders | 2,000 |

**Weekly report template:**

```
Week [N] · [dates] · Stage [T / D0 / Drop N]
FUNNEL   summons/day · visitors · wallets connected (Δ) · bag reports · trial→first trade · referrals
HARNESS  agents · preflights/day · denied / needs approval · approvals answered · kill-switch uses
TRUST    honeypots refused · MISSED · playbook and label precision · Clear vs all launches (won/lost)
TOKEN    holders · burned (% supply) · daily burns posted (any late) · burn-wallet inflows by source · Pons buyback · milestone progress
DIST.    Telegram groups · Census citations · Ghost Report shares · KOL activations (cost each)
CONTENT  posts · top post · corrections issued
RISKS    incidents · platform warnings · impersonators removed
NEXT     next Drop teaser date · asks for DEV/OWN
```

## 16 · Manus Audit Prep

### Claim Checklist

Every factual claim in this doc is a row in 04, with its source in the row. Tick each group against its sources:

- [ ] **H1–H13, T1–T12, D1–D5** (product): fact sheet §3–4, §5b and §9, [Anthropic custom connectors][claude-connectors], plus the internal harness spec, product spec §8, roadmap, evals doc and policy doc where the row cites them
- [ ] **K1–K13** (token and fees): fact sheet §0, §4–6
- [ ] **R1–R7** (Robinhood): [X][rh-x], [Agent Apps][rh-apps-x], [Fortune][fortune], [CoinDesk][coindesk-rh], [Robinhood newsroom][rh-news], [Robinhood support][rh-agentic], [brand guidelines][rhc-brand], [ToS][rhc-tos]
- [ ] **S1–S6, M1–M4** (security and team): the internal policy doc, harness spec, roadmap and GTM plan; fact sheet §0, §4–5, §8
- [ ] **X1–X6** (market): [The Block][theblock], [Yahoo][yahoo], [CoinDesk][coindesk-pons], [crypto.news][cryptonews], [Blockonomi][blockonomi], [explorer][erc8004], [chain docs][rhc-connect], [KuCoin][kucoin], our research and on-chain measurements
- [ ] **Other sections:**
  - disclaimers (05) match fact sheet §6 word for word, with #ad placed per [FTC][ftc]
  - X and Telegram rules (06) match the internal policy doc, [X guidelines][x-dev] and [Telegram terms][tg-bot]
  - incident steps (12) match the internal architecture runbook
  - day-30 targets (15) match fact sheet §9

**Rule checks:**
- [ ] No team names or team projects anywhere; the team is described only as anonymous (fact sheet §0)
- [ ] The retired working name appears nowhere; the name-status note appears once (01)
- [ ] Launch burns are described only as "burned daily from a public burn wallet; every transaction posted"; the automated Burn Engine only as planned (`Drop 7`, gated on review)
- [ ] Contract assurance is described only as "AI-assisted and automated review, not a professional audit"
- [ ] The token fee is always "2% total = Pons's 1% standard fee + a 1% creator tax"; the terminal fee is always tied to Uniswap-routed trades
- [ ] Forbidden phrases appear only where they are banned (Forbidden columns, Wrong examples, Never/Don't lists)
- [ ] No price, floor, bid or support language in allowed copy
- [ ] Every feature has a stage tag
- [ ] Every example number is `[N]` or a sourced figure

### Placeholders and Open Items

**Fact-sheet placeholders still open:** `{{MAIN_HANDLE}}` / `{{BOT_HANDLE}}`, `{{DOMAIN}}`, and the buyback slice (tentatively 25%, confirmed by OWN and locked at creation).

**Decided in fact sheet v2 (now written as values):** the team (anonymous), tier amounts (≈ $50 / $250 / $1,000 at the `D0+1` price), the Pons standard fee (1%).

**Fill at launch:** `[CA]`, `[BURN_WALLET]`, `[DEV_WALLET]`, `[TIMELOCK]`, the launch buy-and-burn tx, the contract review summary and the bug bounty page.

**Resolved (owner, 2026-09-29):**
- **Launch-week fees:** the terminal fee is 0% from `T` to `D0`, with no accrual.
- **Trial:** starts at `D0+1`.
- **EKO Points:** accrue from `T` and are redeemable from `D0+1`.
- **Token payments:** from `D0`.
- **Telegram group:** the caller leaderboard and group badge ship at `T`.
- **Agent share on cards:** shown with a **beta** tag until the label gate passes; Census headline numbers wait for the gate.

**Resolved (owner, fact sheet v2, 2026-09-30):**
- **Fees:** 2% total trading fee on the token = Pons's 1% standard fee + a 1% creator tax (fixed at creation, never raisable). The creator side receives ~1.7% of volume, less the buyback slice.
- **Pons buyback:** on, tentatively 25% of the creator's share of the Pons fee.
- **Burns:** manual and daily from a public burn wallet from `D0`, every tx posted; a $100 launch buy-and-burn from the dev wallet. The automated Burn Engine moves to `Drop 7` (gated on review), and its renounce with it.
- **Terminal fee:** Uniswap-routed trades only at launch; Pons-curve trades carry none until a reviewed fee router ships.
- **Contract review:** no paid audit; AI-assisted and automated review plus a public code-review window and a self-run bug bounty up to $500.
- **Team:** anonymous.
- **Tiers:** ≈ $50 / $250 / $1,000 at the `D0+1` price, reviewed monthly, only ever lowered.
- **Claude Desktop and claude.ai:** targeted for `T` via Anthropic's official custom connectors; `D0` if the OAuth login isn't ready by Oct 2.
- **Trade caps:** beta $25 (team) / $100 (users); from `T`, $250 per trade for 72h, then $1,000.

**Still to confirm with OWN or DEV:**
1. The Verified caller badge date.
2. Whether milestone progress before `D0` counts.
3. When the contracts are open-sourced.
4. The KOL payment asset, pre-`D0` KOL funding, and prize funding.
5. That there's no presale.
6. The mascot's ERC-8004 identity date.
7. Approval of the proposed taglines and admin rules.
8. The buyback slice (tentatively 25%), before token creation.
9. Whether the Claude connector login is ready by Oct 2, and a timed install before using "in 30 seconds".
10. The `$EKO` clone re-check the day before `D0` (Oct 19).

## 17 · Sources

**External** (verified 2026-09-29/30):
- Robinhood: [Agents announcement][rh-x], [Agent Apps][rh-apps-x], [newsroom: open to agents, 2026-05-27][rh-news], [agentic trading overview][rh-agentic], [trading with your agent][rh-mcp]
- Robinhood Chain: [docs][rhc-docs], [connecting (chain ID)][rhc-connect], [ToS][rhc-tos], [brand guidelines][rhc-brand]
- Press: [Fortune][fortune], [CoinDesk (agents)][coindesk-rh], [CoinDesk (Pons)][coindesk-pons], [The Block][theblock], [Yahoo Finance][yahoo], [crypto.news][cryptonews], [KuCoin][kucoin], [Blockonomi][blockonomi]
- Pons: [docs v2][pons], [terms][pons-terms]
- On-chain: [ERC-8004 IdentityRegistry][erc8004]
- Platforms: [X developer guidelines][x-dev], [Telegram bot terms][tg-bot], [FTC influencer disclosures][ftc], [Anthropic: custom connectors using remote MCP (accessed 2026-09-30)][claude-connectors]

**Internal** (team-only, cited as plain text, never linked):
- the fact sheet (canonical)
- the internal GTM plan, policy doc, harness spec, product spec, roadmap, update plan, architecture doc, evals doc and research notes

> Internal planning docs are team-only. Never forward, link or quote them publicly. Cite the fact sheet in audits.

[rh-news]: https://robinhood.com/us/en/newsroom/robinhood-is-now-open-to-agents/
[rhc-connect]: https://docs.robinhood.com/chain/connecting
[rh-x]: https://x.com/RobinhoodApp/status/2105074572722679839
[rh-apps-x]: https://x.com/RobinhoodApp/status/2105075198869282905
[fortune]: https://fortune.com/2026/09/29/robinhood-trading-agents-hood-openai-anthropic/
[coindesk-rh]: https://www.coindesk.com/markets/2026/09/29/robinhood-adds-ai-agents-perps-and-weekend-trading-in-push-to-win-active-traders
[rh-agentic]: https://robinhood.com/us/en/support/articles/agentic-trading-overview/
[rh-mcp]: https://robinhood.com/us/en/support/articles/trading-with-your-agent/
[rhc-docs]: https://docs.robinhood.com/chain
[rhc-tos]: https://docs.robinhood.com/chain/terms-of-service/
[rhc-brand]: https://docs.robinhood.com/chain/brand-guidelines/
[kucoin]: https://www.kucoin.com/news/flash/robinhood-chain-ends-free-gas-subsidy-in-late-september-memecoins-face-stress-test
[pons]: https://docs.ponsfamily.com/v2
[pons-terms]: https://www.ponsfamily.com/terms
[coindesk-pons]: https://www.coindesk.com/tech/2026/09/03/a-memecoin-making-app-becomes-crypto-s-top-fee-generators-as-robinhood-chain-activity-explodes
[theblock]: https://www.theblock.co/news/defi/2026-09-27-onchain-analyst-links-18-4-million-in-robinhood-chain-memecoin-extractions-to-single-rug-pull-operation-416960
[yahoo]: https://finance.yahoo.com/markets/crypto/articles/pons-v2-exemptions-put-robinhood-103042949.html
[blockonomi]: https://blockonomi.com/from-8-to-34-how-ai-agents-took-over-solana-memecoin-dex-volume-in-90-days/
[cryptonews]: https://crypto.news/robinhood-chain-flipped-solana-revenue-gas-subsidy-expires/
[erc8004]: https://robinhoodchain.blockscout.com/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
[x-dev]: https://docs.x.com/developer-guidelines
[tg-bot]: https://telegram.org/tos/bot-developers
[ftc]: https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers
[claude-connectors]: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
