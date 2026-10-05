---
title: Go Plan
subtitle: The operational launch plan and setup runbook for EKO, from the first build day (Sep 30) to the end of the Drop run (D+70). It covers accounts, infra, wallets and contracts; the gates between build, beta, product launch and token day; hour-by-hour run-of-shows; incident runbooks; and one dated master checklist, with every owner decision dated.
suite: 5 of 5 · Go Plan
version: v2.1
date: 2026-09-30
target: Robinhood Chain (4663)
---

> **Owner decisions 2026-10-05 (these override this plan wherever they conflict):**
> 1. **No token burns, buybacks or milestone buys.** EKO does not encourage holding its token for financial benefit. Dropped: the burn wallet receiving fees and burning daily, the launch buy-and-burn, the Burn Board, the Burn Engine, Pons buybacks presented as EKO policy, milestone buys and the milestone timelock, and anything implying the token gains value from EKO's actions.
> 2. **No bug bounty.** No rewards, payments, funding or payouts. Private reporting stays open: GitHub private vulnerability reporting on `EkoTerminal/eko` and the existing `security.txt` contact.
> 3. **Terms and Privacy approved** by the owner on 2026-10-05.
> 4. **Policy and privacy questions** go to the official EKO X and Telegram accounts, as listed on `/official`.
> 5. **No closed beta.** The product launches publicly on Tue Oct 13.
>
> Sections that planned these items carry a "Dropped 2026-10-05" note. The rest of this plan is unchanged.

> **v2.1 (2026-09-30): renamed to EKO.** Ticker `$EKO`. Tiers are Listener / Reader / Oracle / Source; verdicts are Clear / Monitor / Danger; scam call-outs are Ghost Reports; product credits are EKO Points; the look follows the EKO site (noise into signal, echo rings, teal-navy and pale cyan). Also aligned: the Claude connector path (Customize → Connectors), the daily burn time (20:00 UTC, proposed), the bug bounty (live from T) and the burn wallet (hardware #6 or a 2-of-3 Safe).

> **Internal document.** The name is **EKO** and the ticker **$EKO** (decided 2026-09-30; it replaces the earlier working name). Values in `{{...}}` are open owner decisions (§2); never guess them. SignalOS is merged fully and its brand is retired. This plan names it only for the merge logistics, and public docs never do.

> **v2, 2026-09-30: owner decisions applied (FACTS v2 wins on any conflict).**
> - **Burns at launch are manual and daily** from a public **burn wallet** (§12.2). The automated Burn Engine moves to Drop 7, gated on review (§6.5).
> - **No paid audit.** Contracts go through a review on a budget (§6.2). The only new contract at D0 is the ReceiptsRegistry, which holds no funds.
> - **Fees:** the token's fee is 2% (Pons 1% + a fixed 1% creator tax). Pons-curve trades carry no terminal fee at launch.
> - **Also decided:** the team is anonymous; Claude Desktop and claude.ai are targeted for T; launch is at 16:00 UTC (internal).
> - **The full list is in §2.**

| Role | Owns |
|---|---|
| **Dev A** | Backend, workers, contracts, keys, infra, evals. Lead session and release manager. |
| **Dev B** | Terminal and Mission Control front end, share cards, bot UX, status page |
| **Marketing** | Public accounts, comms beats (per the Marketing doc), beta recruiting, KOLs, moderation |
| **Owner** | Decisions, vendor payments, cold-wallet custody, go/no-go, policy sign-off |

**Conventions**
- Times are UTC. **L** is the launch hour: **16:00 UTC for both T and D0 (decided).** **The D0 hour is internal:** it lives in the run-of-show only, and public posts say "today," never the time (§11.6).
- **[KYC flag]** marks a step where a vendor may ask for ID. **No KYC/KYB before month 4.** If a vendor asks, take the listed alternative; nobody submits ID without an Owner decision.
- **[Card exception]**: the only allowed non-crypto payment is X (the API, and Premium if USDC isn't offered). **Decided:** if the USDC wallet doesn't work in the X Developer Console (or Premium checkout), pay by card. No further approval is needed, and each card payment is marked in the monthly note.

## 1. Timeline at a glance

> **Dropped 2026-10-05:** the closed beta, the bug bounty, the burn wallet, the launch buy-and-burn, the daily and weekly burns and the Burn Engine in this table. See the owner decisions block at the top.

| Dates | Phase | Exit gate |
|---|---|---|
| Wed Sep 30 – Tue Oct 6 | **Build week.** Day-1 contracts frozen; accounts, infra, backfill, evals, policies. Ghost Reports start Oct 3 (T-10); mascot reveal Oct 6 (T-7). | **Gate B, Oct 6 (Dev A):** staging green; guard and Normalizer suites at 100% on fork; backfill verified; policies approved; restore drill passed |
| Wed Oct 7 – Mon Oct 12 | **Closed beta.** Paper trading plus capped live trades, team wallets first | **Gate T, Oct 12 (Owner, Dev A):** zero honeypot fills; T-scope evals green; Fast Scan p95 ≤ 5 s |
| **Tue Oct 13 (T)** | **Product launch, no token.** Free for launch week. | — |
| Oct 14 – 19 (T+1 → T+6) | Daily public stats; the 72h public code-review window (Oct 13–16); ReceiptsRegistry review done; bug bounty live | **Gate D0, go/no-go Sun Oct 18 (Owner):** zero honeypot fills, eval gates green, the ReceiptsRegistry review on a budget done (§6.2), bug bounty (up to $500) live, burn wallet ready |
| **Tue Oct 20 (D0)** | **Token on Pons**; the $100 launch buy-and-burn at ~L+1m; burn wallet published; the first daily burn that evening; D0 features | — |
| Wed Oct 21 (D0+1) | Tiers switch on | Tier amounts set |
| Tue Oct 27 (D+7) | **First weekly burn report**; **Drop 1** | Drop 1 evals |
| Nov 3 → Dec 29 (D+70) | Drops 2–9, one each Tuesday: Rug Ring Radar, Arena, Desk, Launcher, Rule Lab Pro and stocks, Score and Inside (plus the **automated Burn Engine at Drop 7, ~Dec 8, if its review is done**; §6.5), Base, the institutional pack | Each drop's eval gate; for the engine, its review |
| Thu Nov 19 (D+30) | Day-30 KPI checkpoint (§14) | — |
| Month 4+ (~Jan 2027) | Legal phase (§15) | — |

> **The token moves on gates, not dates.** If a gate fails, token day slips a week; the product and daily comms carry on.

## 2. Owner decisions

### 2.1 Still open

| # | Decision | Proposal | Deadline |
|---|---|---|---|
| 1 | **Name** | ✅ **Decided 2026-09-30: EKO.** Confirmed not publicly linked to the team. Still run a free USPTO/EUIPO search before merch. No Robinhood or Hood marks. | Done |
| 2 | **Token name and ticker** | ✅ **Decided: EKO / `$EKO`.** Availability check 2026-09-30: no live `$EKO` of note (dust only on Solana and PulseChain). **Copycats `EKOX` and `EKOS` already exist on Robinhood Chain** (Sep 24–27, 79–81% fee-trap pools). Re-check Pons, the explorer and the X cashtag on Oct 19. | Re-check **Oct 19** |
| 3 | **Domain and handles** (`{{DOMAIN}}`, `{{MAIN_HANDLE}}` / `{{BOT_HANDLE}}`) | **Now that the name is set:** a short domain with no Robinhood or Hood, and the same handles on X, Telegram and Farcaster. Register everything the same day. | **Oct 2**, so they're live before beta (Oct 7) |
| 4 | Team token buys at launch | None, or amounts per disclosed wallet, timelocked 6 months. **Not covered by the v2 decisions**, so it's still needed. | **Oct 18** |

### 2.2 Resolved (v2, Sep 30)

> **Dropped 2026-10-05:** R2 (Pons buyback as EKO policy), R3 (daily burns), R4 (launch buy-and-burn), R5's "paid to the burn wallet" and R12 (bug bounty). Any terminal fee from token day is published before it starts, with no destination promise.

| # | Decision | Answer |
|---|---|---|
| R1 | **Fees** | The token's fee is **2% total = Pons 1% standard fee + a 1% creator tax**, fixed at creation and never raisable. The creator receives ~1.7% of volume. Our scanner shows "Fixed 1% creator tax (immutable)" as Info. |
| R2 | **Pons buyback** (`{{BUYBACK_SLICE}}`) | **25%, tentative**: 25% of the creator's share of the Pons fee (~0.175% of volume). **The team confirms by Oct 18.** It's locked at creation. |
| R3 | **Burns at launch** | **Manual and daily** from a public burn wallet, which receives terminal fees, paid API and x402 revenue, and token payments only, never dev fees. The team buys and burns the full balance once a day at a scheduled time, and every transaction is posted (§12.2). The automated Burn Engine is a Drop 7 target, gated on review (§6.5). |
| R4 | **Launch buy-and-burn** | ~1 minute after token creation (after the anti-sniper window), the public dev wallet buys **$100** of the token and burns it immediately. The transaction is posted (§11.3). |
| R5 | **Terminal fee** | 0 bps from T to D0. From D0, 50/40/30/25 bps on **Uniswap-routed** trades, paid to the burn wallet. **Pons-curve trades: no terminal fee at launch.** A reviewed curve fee router is a later Drop. |
| R6 | **Tiers** (`{{TIER_AMOUNTS}}`) | ≈ **$50 / $250 / $1,000** of the token, set at **D0+1** (Oct 21, 12:00) from the price then, and only ever lowered |
| R7 | **Team** | **Fully anonymous.** There's no team blurb. No team page or team section. Trust comes from public wallets, daily public burns, receipts, open-source code and weekly shipping. |
| R8 | **SignalOS** | Merged fully, and its brand is retired. The logistics are below. |
| R9 | **X card fallback** | If the USDC wallet doesn't work in the Developer Console, pay by card (§3.2) |
| R10 | **Trade caps** | Beta: $25 per trade (team) and $100 (users). From T: $250 per trade for 72h, then $1,000 (Oct 16, 16:00, if clean). |
| R11 | **Contract reviewer** | **None paid** (owner budget). We run a review on a budget: AI multi-agent review, Slither/Aderyn, Foundry fuzz/invariant/fork tests and a 72h public window (§6.2). The wording is "AI-assisted and automated review, not a professional audit." |
| R12 | **Bug bounty** | **Up to $500**, paid from creator fees, and **self-run** with no platform (§6.3) |
| R13 | **Launch time** | **16:00 UTC** for T and D0. It's internal only and never posted. |
| R14 | **Claude Desktop and claude.ai** | **Targeted for T** via Anthropic's official custom connectors (Customize → Connectors → + → Add custom connector → paste the MCP URL → OAuth login; any Claude plan, with Free limited to one custom connector; on Team and Enterprise an owner adds it first in Organization settings → Connectors). If the Oct 2 OAuth check fails, they fall back to D0. Claude Code uses an API key at T. |

**SignalOS merge logistics (Owner and both devs):**
- [ ] A written co-owner agreement: shared IP, who "the dev" is for creator fees, and what happens if someone leaves.
- [ ] The SignalOS repo moves into the new GitHub org, with its history.
- [ ] A licence (Apache-2.0 or MIT) for the open-sourced repos.
- [ ] The Coinbase data path and consumer AI "calls" are removed. **Every SignalOS secret is rotated.**
- [ ] **Retire the SignalOS brand:** take down or park its site and accounts, with no redirect that links the brands in public. Tell its users. Migrate no user data without consent.

## 3. Accounts and identity setup

> Every account gets a role email, app- or key-based 2FA, credentials in the team vault (§4.6), and two admins where the platform allows. Where a phone number is needed, use one dedicated team number, never a personal one.

### 3.1 Domain and email (Owner, Sep 30)
- [ ] Register `{{DOMAIN}}` with a crypto-accepting registrar (e.g. Njalla), with WHOIS privacy and a registrar lock.
- [ ] DNS on Cloudflare's free plan, with DNSSEC. Subdomains: `app.`, `api.`, `mcp.`, `status.`, `docs.`.
- [ ] Proton Mail (paid in crypto) with SPF, DKIM and DMARC. Addresses: `ops@`, `security@`, `legal@`, `press@`, plus one per platform account. Publish `security.txt`.

### 3.2 X (Marketing, Dev A; Sep 30 – Oct 2)
- [ ] **Main** (`{{MAIN_HANDLE}}`, run by humans): the bio says "Built on Robinhood Chain" and carries the non-affiliation line.
- [ ] **Bot** (`{{BOT_HANDLE}}`): from the bot, go to Settings → Your account → Account information → **Automation**, and set the managing account to main. The profile then reads "Automated by `{{MAIN_HANDLE}}`". Bio: "Tag me with scan $X or a CA. Replies only when summoned. DYOR · Not financial advice · AI-generated analysis."
- [ ] **X Premium on both**, paid in USDC if the checkout offers it, otherwise a [Card exception]. **[KYC flag]** X may ask for phone verification. ID verification is optional, so skip it.
- [ ] **Developer Console:**
  - Sign in as the **bot**, so any enforcement stays away from main.
  - Describe the use exactly: summoned replies only, one per interaction, deterministic card images, no LLM text, no links.
  - Create the app with read and write access; store the bot's OAuth tokens in secrets.
- [ ] **Pay-per-use credits:** try the **USDC wallet** (the one X Premium accepts) first. **Decided:** if it doesn't work in the Developer Console, pay by card ([Card exception]), logged in the monthly note.
- [ ] Set a **$400 monthly spending limit** with alerts at 50% and 80%, plus code-side caps on replies per hour, one reply per interaction, and reads per day (the ceiling is 3M a month). Prices: reply $0.010, post $0.015, post with a link $0.20, read $0.005.
- [ ] **The bot stays off until D0.**

### 3.3 Telegram (Marketing, Dev B; Oct 1–3)
- [ ] A team account owns the bot, channel and group, with a 2FA password and a second admin.
- [ ] **BotFather:**
  - `/newbot`, `/setdescription`, `/setabouttext` (disclaimers and non-affiliation), `/setuserpic`
  - `/setcommands` (`scan`, `bags`, `alerts`, `help`), `/setjoingroups` on
  - `/setprivacy` **disabled**, so pasted CAs are seen. The privacy policy says messages are checked for addresses only and not stored.
- [ ] Put the token in secrets and point the webhook at `api.{{DOMAIN}}`.
- [ ] **Scans, alerts and approval notifications only.** No trading, wallet connect, Mini App or payments.
- [ ] Create the announcement channel and a linked community group (slow mode, anti-spam, pinned "Official links" and "Admins never DM first"), plus a private ops group for alerts.

### 3.4 Farcaster and Neynar (Dev B; ready Oct 16, live D0)
- [ ] Register the bot account, with its custody address on hardware wallet #5 (§5). The profile discloses it's a bot and names the operator: the main account, never a person, because the team is anonymous.
- [ ] Neynar (crypto accepted): an app, a managed signer approved by the bot's FID, and a mentions webhook → API → card reply. Neynar holds the signer key; we store only `NEYNAR_SIGNER_UUID`. Same rules as X.

### 3.5 GitHub (Dev A, Sep 30)
- [ ] A **Free** org (paid plans take cards only), with 2FA required.
- [ ] `app` is the private monorepo. **Public from T:**
  - `contracts`: the ReceiptsRegistry, the milestone timelock configuration (a standard audited template), the Safe plus Zodiac Roles guardrail configuration, fork tests, the daily-burn script (`scripts/daily-burn.ts`, §12.2), and `review/`, which holds the findings log and tool output (§6.2). The review report is completed on D0.
  - `receipts-verifier` and `playbooks`.
  - Opening them at T also opens the 72h public code-review window.
- [ ] `main` is protected by the eval-gate check. Secret scanning with push protection; a self-hosted Actions runner; signed release tags.

### 3.6 Status page (Dev B, by Oct 6)
- [ ] Uptime Kuma on a BitLaunch VPS at `status.{{DOMAIN}}`, tracking the web app, API, MCP (including its OAuth server), the guard, Fast Scan latency, the bots and the committer. From D0 it also tracks the **daily burn**, which turns red if no burn transaction lands within 60 min of the scheduled time.

## 4. Infra provisioning (Dev A; the Owner pays)

> Everything is paid in crypto. Before D0 the Owner pays from a **launch float**. From D0 the public dev fee wallet pays, and every payment appears in the monthly note.

### 4.1 Hosting
- [ ] **Vultr**, paid through **BitPay in USDC**, with **each payment under $3k** (bigger ones trigger ID checks). **[KYC flag]** If Vultr asks for extra verification, move to **BitLaunch** (crypto-only, email only) instead of sending ID.
- [ ] **Hosts:**
  - `app-1`: API, WebSocket, MCP and its OAuth server, web, and the x402 facilitator from Drop 1
  - `work-1`: ingest, engines, committer, Anvil fork, CI runner
  - `swarm-1`: swarm and Deep Research
  - `ops-1` (BitLaunch): monitoring, the vault, the status page, backups, and the x402 sweep from Drop 1
  - Drop VMs are added per drop, including the Drop 7 engine's hosts if it ships (§6.5).

### 4.2 Postgres
- [ ] Vultr Managed Postgres with daily backups and point-in-time recovery, plus a nightly encrypted `pg_dump` to `ops-1` (14 daily and 8 weekly copies).
- [ ] A **restore drill before Gate B**, then monthly. One writer per table.

### 4.3 RPC
- [ ] A **dRPC paid plan** in stablecoins (API key via x402, 5 USDC), with archive, `debug_*` and `trace_*`, and a spending cap.
- [ ] **Today (Sep 30):** confirm that `debug_traceCall` with state overrides and `eth_getBlockReceipts` work on 4663, and price the backfill (FACTS §5b). If either call fails, simulations run on our own node or the Anvil fork. If the backfill is too costly, limit it to 7 days, plus candidate funding wallets and a Pons-events-only history scan (§7).
- [ ] The official RPC is a failover for reads and broadcasts only, **never for simulations.** If simulations fail, the guard refuses trades.
- [ ] A local Anvil fork with ArbSys mocked. The backfill is throttled below live ingest.

### 4.4 Models and data
- [ ] **OpenRouter:** USDC from a self-custody wallet (5% fee), with separate capped keys for the swarm, Deep Research and evals. **[KYC flag]** If the checkout pushes you to an exchange login, pay by wallet instead.
- [ ] **PPQ** (BTC or Lightning) as the fallback in `ProviderRegistry`. Set `AI_DAILY_BUDGET_USD` and the per-coin caps.
- [ ] **Sorsa** (from $49/mo, crypto). **GoPlus and ScanHood** credits over x402, for eval second opinions only.

### 4.5 Monitoring and alerts
- [ ] Prometheus, Grafana and Alertmanager on `ops-1`, alerting to the ops group and the on-call phones.

| Sev | Alerts (initial thresholds) |
|---|---|
| **1** | A sell check after a fill fails; an unexpected outflow from a published wallet; **any burn-wallet outflow that isn't a daily burn** (a buy of our token, then its burn); **a burn-wallet buy of any token other than ours** |
| **2** | Simulation failures > 5% for 5 min; RPC lag > 5 s; new pair → verdict p95 > 5 s; the committer misses 2 windows (10 min); **no daily burn transaction within 60 min of the scheduled time** (from the first daily burn on D0 evening) |
| **3** | Preflight p95 > 150 ms; AI spend at 80% of budget; X spend at 50% or 80% of its cap; a backup fails |

### 4.6 Secrets
- [ ] **SOPS plus age** encrypted env files, one key per environment. Team logins in self-hosted **Vaultwarden**.
- [ ] Only these keys live on servers (§5):
  - the **committer** (gas only)
  - the **preflight/attestation signer** (signs only; holds nothing)
  - from Drop 1, the **x402 payTo/sweep key** (`SWEEP_KEY`, one key: its own Base address is the x402 `payTo`, so it holds ≤ 7 days of revenue, gas on Base and 4663, and the in-transit balance)
  - from Drop 1, the **x402 facilitator key** (`X402_FACILITATOR_KEY`: gas on Base only, to submit settlements for our self-hosted facilitator on `app-1`)
- [ ] Cold and hardware keys never touch a server: the ReceiptsRegistry owner, the dev fee wallet, the **burn wallet** and the Farcaster bot's custody address. The daily-burn script only builds transactions, and a person signs them on the burn wallet's device (§12.2). The Farcaster bot posts through a Neynar managed signer, so no Farcaster key sits on our servers either (only `NEYNAR_SIGNER_UUID` and the API key).
- [ ] Dev B holds web and bot secrets only. Harness API keys are stored hashed. Rotate on team changes, on any suspected leak, and quarterly.

### 4.7 Cost table

| Item | Vendor and payment | ~$/month |
|---|---|---|
| Swarm | OpenRouter (USDC, +5%) / PPQ | 700–1,000 |
| Deep Research | The same, plus Grok X Search (~$0.30 a run) | Quota-capped; the $1.50 x402 price covers a run |
| X API | USDC wallet, otherwise a card | 50–400 |
| X Premium × 2 | X (USDC if offered) | List price |
| Sorsa | Crypto | From 49 |
| RPC | dRPC (stablecoins) | 100–300 |
| Hosting, Postgres, ops | Vultr (BitPay USDC) / BitLaunch | 100–300 |
| Receipts commits | ETH (288 a day, one every 5 minutes, at ~1¢) | ~90 |
| Daily burn gas | ETH on 4663, from the burn wallet (about two transactions a day at ~1¢) | < 1 |
| Contract review (§6.2) | AI reviews on the existing OpenRouter keys; Slither, Aderyn and Foundry are free | **~$0** |
| Bug bounty (§6.3) | Creator fees, only when a valid report is paid | Up to $500 |
| Credits, domain, email, Neynar | Crypto / x402 | Small |
| **Total** | | **~$1.5–2.5k/mo**, from creator fees |

> Receipts gas (~$90/mo at one commit every 5 minutes) isn't itemised in ARCHITECTURE. **There's no paid audit:** the review costs ~$0 plus the bounty. **The launch float** (one-off, before D0) covers:
> - hardware wallets, including the burn wallet's
> - the first month of infra, the X credits and the domain
> - the dev wallet's **$100 launch buy-and-burn** plus gas
> - any bounty payout before creator fees arrive
>
> The Drop 7 engine's running costs are in §6.5.

## 5. Wallets and keys

> **Dropped 2026-10-05:** the burn wallet and milestone timelock rows, and the dev fee wallet's bounty and buy-and-burn duties.

| Wallet | Purpose | Custody | Holds | Public |
|---|---|---|---|---|
| **Deployer** | Deploys the ReceiptsRegistry (week 1), then the milestone timelock from a standard audited template (D0). There's no other D0 contract. | Hardware #1 | Gas | Yes |
| **ReceiptsRegistry owner** | Cold owner of the receipts contract (ReceiptsRegistry), set at deploy or transferred from the deployer at once. Admin calls only, such as rotating the committer. | Hardware #4, its own seed | Nothing | Yes |
| **Dev fee wallet** | Pons creator and fee recipient (the 1% creator tax plus the creator's ~0.7% share of the Pons fee, less the buyback slice). Pays costs, pays bounty rewards, and makes milestone buys. Makes the **$100 launch buy-and-burn** at ~L+1m (§11.3). **Never connected to any burn automation, and never sends dev fees to the burn wallet.** | Hardware #2 (Owner) | Creator fees | **Yes** |
| **Burn wallet** (new) | Receives **only** the terminal fee (Uniswap routes, from D0), paid API and x402 revenue, and token payments; **never dev fees**. Once a day at the scheduled time, the team buys the token with its full balance and burns it, and every transaction is posted (§12.2). | Hardware #6, its own seed; the **daily signer** (one signer plus a four-eyes read-back, or a 2-of-3 Safe if we want two signers; decide before D0, because the published address depends on it) | About a day of inflows, plus gas | **Yes** (transparency page, explorer label, Burn Board) |
| **Milestone timelock** | Locks milestone buys and team tokens for 6 months per deposit | Contract | Locked tokens | **Yes** |
| **Team wallets** | Beta live trades and any team holdings | Each member's hardware wallet | Personal | **Disclosed**; the trading policy applies |
| **Receipts committer** | Merkle root every 5 minutes | Hot (SOPS) | Gas | Yes |
| **Preflight/attestation signer** | Signs preflight results and attestations so they can be verified | Hot (SOPS), `app-1` only | Nothing | Yes (so signatures verify) |
| **x402 payTo / sweep key** (`SWEEP_KEY`, Drop 1) | One key: its own Base address is the x402 `payTo`, so it receives x402 payments in Base USDC. The weekly sweep bridges that balance to the same address on Robinhood Chain and sends it to the **burn wallet**, which burns it in the next daily burn. Once USDG x402 on 4663 passes tests, `payTo` becomes the burn wallet itself | Hot (SOPS), `ops-1` only | ≤ 7 days of revenue, gas on both chains, and the in-transit balance (disclosed) | Yes |
| **x402 facilitator** (`X402_FACILITATOR_KEY`, Drop 1) | Submits x402 settlements on Base for our self-hosted facilitator. Payments name `payTo`, so this key can't redirect them | Hot (SOPS), `app-1` only | Gas on Base | Yes |
| **Farcaster bot custody** | Owns the bot's FID; approves, and can revoke, the Neynar managed signer that posts its replies (Neynar holds the signer key) | Hardware #5, its own seed | Nothing (gas only for FID and signer transactions) | Yes (custody address and signer public key) |

**Moved to Drop 7 (§6.5):** the engine owner (hardware #3, reserved) and the engine's hot keys. Neither exists at T or D0.

**Custody practices:**
- [ ] Buy hardware from the manufacturer and generate seeds on the device. Never type, photograph or upload a seed.
- [ ] One device and seed per cold role. Metal backups in two places.
- [ ] **Four-eyes on every cold signature:** one person signs, the other reads the tx back from the device screen. This includes every daily burn (§12.2), and the read-back checks the token address.
- [ ] Hot keys hold gas only (the payTo/sweep key also holds at most a week of x402 revenue plus the in-transit balance), with minimum and maximum balance alerts.
- [ ] Every published address is on the alert watch list.
- [ ] **Publish** all of the above on `{{DOMAIN}}/transparency`, pin it, and request explorer labels. Never custody user funds: users sign their own trades, with exact approvals.

## 6. Contracts

> **v2: no paid audit (owner budget).**
> - **The only new contract at D0 is the ReceiptsRegistry,** which holds no funds.
> - **Not new code:** the milestone timelock comes from a standard audited template, and on-chain guardrails use audited **Safe plus Zodiac Roles** where possible.
> - **The automated Burn Engine** is a Drop 7 target (§6.5).

### 6.1 Deployment sequence

> **Dropped 2026-10-05:** the bug bounty going live, the milestone timelock deployment and the $100 launch buy-and-burn.

| When | Step (owner) |
|---|---|
| Oct 1 | ReceiptsRegistry deployed and verified; committer running (Dev A) |
| Oct 4 | Code frozen at tag `review-1` (Dev A) |
| Oct 4 – 6 | Review round 1: three AI reviews, Slither/Aderyn, and the Foundry fuzz, invariant and fork suites; the findings log starts (§6.2) (Dev A, Dev B) |
| T, Oct 13, 13:00 | `contracts` repo public; the **72h public code-review window** opens; bug bounty live (§6.3) (Dev A, Owner) |
| Oct 16, 13:00 | Public window closes (Dev A) |
| Oct 17 | Every High and Critical finding fixed and re-checked; final commit hash recorded; review report drafted (Dev A) |
| D0, 12:00 | Milestone timelock deployed from its standard template and verified (Dev A) |
| D0, L | Token created on Pons (§11.1) (Owner) |
| D0, ~L+1m | The $100 launch buy-and-burn from the dev wallet (§11.3) (Owner, Dev A) |
| D0, 16:35 | Review report published beside the ReceiptsRegistry address and its commit hash (Dev A) |

> **Receipts timing.** AUDIT says to review contracts before deploying them; ROADMAP puts receipts live in week 1. The receipts contract holds no funds, so v1 ships in week 1 and the review runs in parallel. If the review finds anything, deploy v2, and the verifier checks both.

### 6.2 Contract review on a budget (no paid audit)

**Scope:**
- **The ReceiptsRegistry:** the only new contract at D0.
- **The Zodiac Roles permission configuration** for on-chain guardrails. This is configuration on audited Safe and Zodiac Roles contracts, not new code. A custom module is written only where Roles can't express a rule, and it then joins this scope.
- **The milestone timelock's deployment parameters.** The template itself is standard and audited.

**Process** (who runs what, when, and where it's published; every output goes in `contracts/review/`):

| # | Step | Who | When | Output |
|---|---|---|---|---|
| 1 | **Freeze** the code at a tag, with the spec (FACTS §3, §7) and a threat list | Dev A | Oct 4 | The tag and `SCOPE.md` |
| 2 | **AI multi-agent review:** three independent reviews. Each runs in a fresh session with no shared context, on a different model where possible (OpenRouter), and gets the code, the spec and the threat list. | Dev A runs them; Dev B triages | Oct 4 – 5 | `ai-review-1.md`, `ai-review-2.md`, `ai-review-3.md` |
| 3 | **Findings log:** every finding from every source, with an ID, severity, source, status (fixed; won't fix, with a reason; duplicate) and fix commit | Dev B keeps it; Dev A fixes | From Oct 4 until D0 | `findings.md` |
| 4 | **Static analysis:** Slither and Aderyn. Every High and Medium is triaged in the log. Both also run in CI on every PR. | Dev A | Oct 4, then every PR | `slither.txt`, `aderyn.md` |
| 5 | **Foundry tests:** unit, fuzz and invariant tests, plus fork tests on 4663. The invariants include: only the committer commits; roots are append-only; only the owner rotates the committer. | Dev A | Green by Oct 6 (Gate B), then in CI | The suite and a coverage report |
| 6 | **72h public code-review window:** the repo goes public with the findings log. Anyone can open an issue, and the bug bounty applies. | Marketing announces; Dev A answers within 24h | Oct 13, 13:00 → Oct 16, 13:00 | Issues on the public repo, each added to the log |
| 7 | **Re-check:** rerun steps 4 and 5, plus one AI review of the fix diff, on the fix commits; record the final hash | Dev A | Oct 17 | The log closed; `FINAL_HASH` |
| 8 | **Publish** the report: the log, the tool output and the test results, headed "AI-assisted and automated review, not a professional audit" | Dev A | D0, 16:35 | `REPORT.md`, linked from the transparency page |

- [ ] **Gate:** no open High or Critical finding, and the deployed bytecode matches the final hash. Otherwise D0 slips (§10).
- [ ] **On-chain guardrails are enforced once reviewed, and advisory until then.** If the Roles configuration hasn't passed this process by D0, the guardrails ship advisory and the D0 comms say so.
- [ ] **Wording:** "AI-assisted and automated review, not a professional audit." Never say "audited" (FACTS §6). A paid audit comes later, funded by fees (§15).

### 6.3 Bug bounty (self-run, up to $500)

> **Dropped 2026-10-05:** the bug bounty. There are no rewards, payments, funding or payouts. Private reporting stays open: GitHub private vulnerability reporting on `EkoTerminal/eko` and the `security.txt` contact.

- [ ] **Self-run, with no platform:**
  - The terms are in `SECURITY.md` in each public repo.
  - Reports go to `security@{{DOMAIN}}`, which is published in `security.txt`.
  - Rewards are paid in USDC or ETH to the reporter's wallet, with no ID asked.
- [ ] **Rewards:** up to **$500**, by severity, with the table in `SECURITY.md`. They're paid from creator fees; the launch float covers any payout before D0. Every payout goes in the monthly note.
- [ ] **Scope:**
  - the ReceiptsRegistry (at its deployed address)
  - **any guard bypass that lets a honeypot fill (Critical)**
  - the receipts verifier, SIWE, harness keys and the MCP OAuth server
  - the Zodiac Roles guardrail configuration
  - **Excluded:** the Pons, Uniswap, Safe and Zodiac contracts themselves; social engineering; DoS.
- [ ] Every report goes into the findings log (§6.2). Dev A acknowledges it within 48h.
- [ ] **Live at T (Oct 13, 13:00),** together with the public repos and the 72h window.

### 6.4 Explorer verification

> **Dropped 2026-10-05:** the milestone timelock, the burn wallet, the launch buy-and-burn and the burn wallet history.

- [ ] Verify the ReceiptsRegistry and the milestone timelock on robinhoodchain.blockscout.com, with the source commit.
- [ ] Request labels: "receipts," "milestone timelock," "dev fee wallet," "burn wallet."
- [ ] Publish a "check it yourself" page covering:
  - the ReceiptsRegistry's `owner()` and committer
  - the dev wallet's launch buy-and-burn
  - the burn wallet's full history (each daily buy and burn)

### 6.5 Drop 7: the automated Burn Engine (target; gated on review)

> **Dropped 2026-10-05:** the Burn Engine. EKO plans no token burns.

**Nothing in this section happens at T or D0.** At launch, burns are manual and daily from the burn wallet (§12.2).
- The engine is a Drop 7 target (~Dec 8), likely a "Lite" variant first: capped slices, a slippage cap, and no withdraw.
- The design is in Backend §14.
- If its review isn't done by Drop 7, it moves to a later Drop and the manual burns continue.
- The v1 D0 engine plan is parked here.

**Gate:**
- [ ] **The §6.2 process on the engine.** Its buy venues are in scope: the Pons curve before graduation, the graduated pool through the Pons v4 burn venue (ETH- and WETH-paired), and the `activatePool` switch. It gets its own 72h public window, and the bounty is extended to it. A paid audit comes first if fees can fund one by then.
- [ ] **The 3× dip mode ships only after a proper (paid) audit.** It's never pitched as dip-buying.
- [ ] **Engine copy gets a Drop 7 copy review.** Until then, the forbidden burn wording (FACTS §6) applies to everything.

**Deploy blockers** (all must pass before any fee is pointed at the engine):
1. An `eth_call` of `token.burn(1)` from a holder of our token succeeds.
2. A transfer to the dead address delivers 100%, with no tax skimmed.
3. A fork buy on a real graduated Pons pool through the Pons v4 burn venue succeeds, for both an ETH-paired and a WETH-paired pool.
4. The hostile-pool fork test for `activatePool` passes: a spoofed or manipulated pool can't be activated.
5. A fork `buyOnCurve` buy on a live pre-graduation Pons token succeeds, with `curveSpotX96` within 0.5% of the curve quote, and `isGraduated` flips at a real graduation block.
6. The engine test suite is at 100%, including the hostile-pool, sandwich and taxed-transfer fork tests.
7. The deployment matches the registry: bytecode verified, constructor arguments equal to `addresses.4663.yaml`, and `owner()` is the engine owner (hardware #3).

**Keys and running** (Drop 7 only):
- **Engine owner:** hardware #3, with its own seed (reserved now). It does bounded tuning for 7 days after deploy, then renounces.
- **Keepers:** hot keys (SOPS, gas only; ~$90/mo) on two hosts.
  - They make randomised `burn()` and `poke()` calls, and call `activatePool` at graduation (anyone can call it).
  - `poke()` right after deploy starts the 30-min warm-up. `burn()` isn't used for this, because it reverts `TooSoon` within 60 s of deploy.
- **Monitoring:** the status page and alerts add the engine checks: no burn for 30 min once burns have started; still switching 10 min after graduation; the balance moving without a burn.
- **Switching to the pool:** at graduation, burns pause until `activatePool` is called, followed by a fresh 30-min warm-up. The 3× rate needs 24h of pool history, as well as the audit above.

**Cut-over from the manual burns:**
- [ ] The burn wallet makes a final daily burn.
- [ ] Every inflow (terminal fee, x402 sweep, token payments) is repointed to the engine, which is a config change.
- [ ] The burn wallet is retired, and its final state is posted.

**Tuning window and renounce** (at Drop 7, never at D+7):
- [ ] **Tuning:**
  - Only the bounded parameters can change, within hard-coded limits. There's no upgrade, no withdraw and no pause.
  - Each change is four-eyes signed and posted with its tx hash and reason within 1h.
  - The window closes 7 days after deploy.
- [ ] **Renounce:**
  - Reviewer sign-off: the bytecode matches, the parameters are in bounds, 7 days of burns behaved as expected, and there's no withdraw path.
  - A fork run against a real graduated Pons pool, including the 3× rate if it's enabled.
  - A fork dry run of `renounce()`: `owner()` must be zero and `burn()` must still work.
  - Then sign it live (four-eyes), confirm it on the explorer, and post it after a public countdown, with the wording from the copy review.
  - **No sign-off, no renounce.**
- [ ] **Engine anomaly runbook** (carried over from v1):
  - **Stuck switching:** call `activatePool` with the graduated pool's key from any funded wallet (it's permissionless).
  - **Otherwise:** stop our keepers. In the tuning window, tighten the bounded parameters.
  - **If the code is at fault:** repoint fees to the burn wallet (manual burns resume) or set the terminal fee to 0 bps. The old balance can only leave through `burn()`.

**Also later (same review gate, a later Drop):** the `PonsFeeRouter`, a reviewed fee router that adds the terminal fee to Pons-curve trades.

## 7. Build week plan (Sep 30 – Oct 6)

**Day-1 frozen contracts** (Dev B signs off on Sep 30; versioned in `packages/shared`, changed only through Dev A, and matching FACTS §7): `CoinCard`; `FlowEvent` and the label tiers; `Verdict`, `Forecast` and `Receipt` with their hashed version fields; `PlaybookMatch`; `Agent`, `Policy`, `PreflightRequest`/`PreflightResult`, `JournalEntry` and `Approval`; the event-bus topics; and table ownership (one writer per table).

| Day | Dev A | Dev B | Marketing | Owner |
|---|---|---|---|---|
| **Wed Sep 30** | Freeze contracts; merge branch; start the streams; Vultr, dRPC, Postgres; **dRPC checks and backfill pricing** (below); Slither, Aderyn and Foundry fuzz/invariant runs in the `contracts` CI (§6.2) | Rebrand the SignalOS shell; routes | Check handle availability for EKO | **Name decided: EKO** (decision 1); register the domain and handles; co-owner agreement; SignalOS merge logistics |
| **Thu Oct 1** | Receipts live; decoders (Pons, v3, v4, Occupy, Flap, Klik); **backfill starts** (full or limited, per the pricing) | Radar, Feed, new pairs | Waitlist; recruiting | X credits (USDC first, card if the Developer Console won't take it); fund the model providers |
| **Fri Oct 2** | **Eval fixtures and nightly runner live**; Normalizer simulations; **Pons ABIs verified (done Oct 1)**; MCP OAuth built (its real-connector check moves to after the MCP deploy, ~Oct 5–6) | Coin view and card; share and OG cards | Ghost Report drafts from real engine output; claim the EKO handles | **Domain, DNS, email and handles registered**, all the same day (decision 3) |
| **Sat Oct 3** | Playbooks v1; v4 and Pons adapters; guard on a fork; Pons-curve quotes at 0 bps (no curve fee at launch) | Trade flow: quote → guard → fee → sign → reconcile, plus the paused, allowlist and quote-only states | **First Ghost Reports** | Review the policy drafts |
| **Sun Oct 4** | `preflight`, `journal`, the Claude Code pack (API key) and the Claude Desktop and claude.ai connector pack (OAuth); scripted Robinhood MCP sessions; **code frozen at `review-1`; three AI reviews start** (§6.2) | Scan my bags; journal page; Telegram flows; triage the AI review findings | Onboarding scripts | Decide one signer or a 2-of-3 Safe for the burn wallet (§5) |
| **Mon Oct 5** | Backfill verified; label eval; **review round 1 done** (three AI reviews, Slither/Aderyn triaged, findings log started); the daily-burn script on a fork | Scoreboard; Census methodology and policy pages; status page | Reveal assets | **Policies approved** |
| **Tue Oct 6** | Staging; restore drill; `trading_allowlist` seeded with team wallets and caps ($25 team, $100 beta); Foundry fuzz, invariant and fork suites green; **Gate B** | Mobile; Playwright green | **Mascot reveal**; Census methodology page; invites | Hardware wallets set up (#1, #2, #4, #5, and #6 for the burn wallet) |

The Drop streams run on spare build-agent capacity behind flags. Drops 1–7 have recorded demos before D0; Drops 8–9 are demoed before their release.

**Launch dependencies (FACTS §5b; verify first, fallbacks defined):**

| Dependency | Verify by (owner) | Fallback |
|---|---|---|
| dRPC on 4663: `debug_traceCall` with state overrides, and `eth_getBlockReceipts` | **Today, Sep 30** (Dev A) | Simulations on our own node or the Anvil fork |
| Backfill pricing on dRPC | **Today, Sep 30** (Dev A; the Owner approves the spend) | If too costly: 7 days of full history, plus candidate funding wallets and a Pons-events-only history scan |
| Pons curve, hook and event ABIs (including `SnipeTaxExempted`) | **Verified on-chain Oct 1** (see the repo's `docs/tasks/VERIFIED-pons-2026-10-01.md`): curve, hook, `SnipeTaxExempted(address indexed)` and `currentSnipeTaxBps`; graduation events still to observe (Dev A) | Pons coins are quote-only (with a link out) at T; the `exempt_insiders` and `stuck_at_bonding` playbooks ship once their decoders are verified |
| MCP OAuth for Claude Desktop and claude.ai custom connectors (the official path: Customize → Connectors → + → Add custom connector; any Claude plan, with Free limited to one custom connector). **Targeted for T** (decided). No Anthropic review is needed for a custom connector; a directory listing is optional. | **After the MCP deploy, ~Oct 5–6** (moved from Oct 2; needs a live server) | The Claude Desktop and claude.ai pack moves to D0; Claude Code (API key) ships alone at T |
| Terminal fee on Pons-curve trades | **Decided:** no terminal fee on Pons-curve trades at launch | A reviewed curve fee router in a later Drop (§6.5) |

**History backfill (Dev A):**
- [ ] Genesis (2026-07-01) → head: logs → decoders → FlowEvents → point-in-time labels (never rewritten) → playbook history and the crew graph.
- [ ] **If the Sep 30 pricing says it's too costly:** limit it to 7 days of full history, plus candidate funding wallets and a Pons-events-only history scan since genesis. The ring check below still runs on the Pons-events scan.
- [ ] **Verify:**
  - the **$18.43M, 53-launch ring** (`SnipeTaxExempted`) reproduces
  - the MCPLT and ORBIO clones get flagged
  - a hand check of 50 deployer histories agrees
- [ ] Done by Oct 5.

**Eval fixtures (Dev A):**
- [ ] **200+ labelled coins pinned to blocks:** honeypots, tax traps, hooks, fee traps, clones, wash, and clean v3/v4/Pons coins. Nightly batch runs: Luna grades, Opus spot-audits ~5%, and a morning report goes to Dev A.
- [ ] **Gates for T:** Normalizer truth, Execution guard, Receipts and Harness at 100%; Playbooks ≥ 90% precision at Danger; no injection regression; Fast Scan p95 ≤ 5 s; Product green.
- [ ] **Other gates:** Watcher labels ≥ 90% gates Census numbers. Access at 100% and a green fork run of the daily-burn script (buy with the full balance → burn → post payload) gate D0.

**Policies drafted** (from templates; the Owner approves Oct 5; live for beta; published at T; counsel reviews in month 4+):
- [ ] **Terms of service:** non-custodial, the user signs, not advice, the 0.5% terminal fee on Uniswap-routed trades (paid to the burn wallet and burned daily; 0% on Pons-curve trades) and tiers, no stock tokens, sanctions screening, non-affiliation.
- [ ] **Privacy policy:** SIWE; the journal is opt-in, encrypted and deletable; Telegram scanning checks for addresses only; **we never receive Robinhood credentials.**
- [ ] **Risk and AI disclosures:** guardrails are advisory for Robinhood-connected agents, and Robinhood's trade approvals, if you turn them on, stay the hard stop; on-chain agent guardrails are enforced once reviewed (targeted for D0; Safe plus Zodiac Roles where possible) and advisory until then; "honeypots missed" is published; "DYOR · Not financial advice · AI-generated analysis"; forecasts are beta.
- [ ] **Team trading policy:** no trading ahead of outputs, blackout windows, disclosed wallets.
- [ ] **KOL policy:** #ad on every paid post; performance deals paid in crypto.

## 8. Closed beta (Oct 7–12)

> **Dropped 2026-10-05:** the closed beta. The product launches publicly on Tue Oct 13.

**Recruiting (Marketing), in waves on Oct 7, 9 and 11:**
- **Waitlist trenchers**
- **20–50 agent owners:** Claude, ChatGPT and OpenClaw users on Robinhood's MCP
- **10+ Telegram call groups:** offered free premium, a caller leaderboard and a "Scanned by EKO" badge

**Onboarding scripts:**
- **Trencher (10 min):** paste a CA with no wallet → connect and run Scan my bags → share the card → paper trade → a capped live trade (if allowlisted) → report any wrong verdict.
- **Agent owner (20 min):** add the EKO MCP (`https://mcp.{{DOMAIN}}/mcp`, from the pack's template) next to Robinhood's → install the Claude Code pack (API key), or add EKO as a custom connector in Claude Desktop or claude.ai (Customize → Connectors → + → Add custom connector → paste the MCP URL → OAuth login; any Claude plan, with Free limited to one custom connector) → turn on Robinhood's trade approvals → pick a preset → a scripted session (`preflight` before every `place_order`, the journal, a forced deny, the unchecked-order flag). The script says plainly that guardrails are **advisory** here, and Robinhood's approvals, once turned on, are the enforced stop.
- **Telegram admin (5 min):** add the bot → paste a CA → check the leaderboard and badge → leave feedback.

**Measured every day:** honeypot fills (must be 0); refusals and their reasons; disputed verdicts; verdict and preflight p95; unchecked-order detection; simulation failures; agents and preflights; scans and bag cards; spend; errors; label precision.

**Daily beta review** (17:00, 30 min, Dev A chairs): the gate metrics, the top bugs, disputes, spend, and whether to raise caps. It ends with a five-line note in the ops group.

**Live trading** (the `trading_live` flag is the runtime kill switch; the `LIVE_TRADING_ENABLED` env var is the hard ceiling above it; `trading_allowlist(wallet, cap_usd)` says who may trade live and how much):
- **Oct 7:** `LIVE_TRADING_ENABLED` and `trading_live` on, with only team wallets in `trading_allowlist` at the team cap ($25 per trade). Each trade is watched end to end, from quote to the sell check after the fill.
- **From Oct 8:** beta wallets are added to `trading_allowlist` at the beta cap ($100 per trade). Paper trading is open to every tester.
- **Any honeypot fill** turns `trading_live` off (§13.1) and fails Gate T.

## 9. T: product launch (Tue Oct 13) run-of-show

**T-1:** Gate T meeting at 17:00; code freeze at 12:00 (with the hot-fix lane open); release tag cut; comms staged (Marketing doc); on-call rota posted.

| Time | Action | Owner |
|---|---|---|
| 08:00 | On-call starts; dashboards green | Dev A |
| 09:00 | Deploy the release tag (API, workers, web, bots); trading still team-only | Dev A, Dev B |
| 10:00 | Smoke tests | Dev A, Dev B |
| 12:00 | Go/no-go: smoke tests and nightly evals green; no open Sev 1 or 2 | Owner |
| 13:00 | Policies, Scoreboard and Census methodology public; the three repos public; the **72h public code-review window** opens and the **bug bounty** goes live (§6.2, §6.3) | Dev A, Owner |
| 14:00 | Bot added to the partner groups | Marketing |
| 15:00 | Final live team trade on production | Dev A |
| **16:00 (L)** | **Launch:** site public; live trading opens to every wallet at the T cap of $250 per trade (the `trading_allowlist` is no longer required; `trading_live` stays the kill switch); announcement beats | All |
| 16:30–20:00 | Radar live-stream; X Space AMA; war room with 30-min check-ins | All |
| 20:00 | Day report; night on-call (Sev 1 only) | Dev A |

**Smoke tests:**
- [ ] SIWE sign-in; `GET /me` returns entitlements. A new pair gets its verdict within 5 s over WebSocket.
- [ ] `POST /scan` is right on a clean fixture and a honeypot fixture, and the share URL unfurls as a card on X.
- [ ] `POST /trade/quote` refuses the honeypot; the clean quote shows exit cost, taxes and the fee.
- [ ] The seven T MCP tools (`coin_verdict`, `coin_card`, `playbook_match`, `preflight`, `journal`, `census_summary`, `receipts_lookup`) work from Claude Code at `https://mcp.{{DOMAIN}}/mcp`, set up from the `/packs` template, and from Claude Desktop and claude.ai through the custom connector and OAuth (unless the Oct 2 check moved them to D0), with untrusted text only in `untrusted`. The receipts root is on-chain and verifies.
- [ ] If the Pons ABIs missed Oct 2, a Pons coin shows quote-only with a link out. A Pons-curve quote shows a 0% terminal fee (no curve fee at launch).
- [ ] `DELETE /me/data` removes a test account's harness data.
- [ ] Telegram scans and DMs work; the test alert reaches the phones; rollback takes under 10 minutes.

**Live-trading rollout:** fork only in build week (`LIVE_TRADING_ENABLED` off, as the ceiling) → team wallets in `trading_allowlist` (Oct 7) → plus beta wallets (Oct 8) → every wallet at the T cap of $250 per trade (T, 16:00) → the cap rises to $1,000 per trade 72h later (Oct 16, 16:00) if there have been zero fills and no Sev 1. With `trading_live` off (or the env ceiling off), every quote returns "live trading paused," while scans and paper trading stay up.

**Comms:** the beats are in the Marketing doc. The token is only ever "planned." Pin "We have no token yet; any token claiming to be us is fake."

**On-call:**
- **T → T+3:** two people reachable around the clock (Dev A days, Dev B evenings, alternating nights). Marketing moderates 12 hours a day.
- **Severity:**
  - **Sev 1** (guard miss, key compromise, a burn-wallet outflow that isn't a daily burn or a wrong-token buy, any other wallet outflow): everyone, now.
  - **Sev 2:** on-call within 15 minutes.
  - **Sev 3:** the next working day.

## 10. Beta-week public stats (T+1 → T+6) and the token gate review

> **Dropped 2026-10-05:** the gate items for the bug bounty, the burn wallet, the launch buy-and-burn and the buyback slice.

**Daily stats card** (15:00, Oct 14–19): a deterministic template posted from main and the Telegram channel, with numbers from Dev A.

| Stat | Source |
|---|---|
| Verdicts served | Verdict records |
| Honeypots refused | Guard refusals on `trade/quote` |
| **Honeypots missed** | Post-fill sell checks and reports; the Scoreboard |
| Agents connected; preflights | `agents` table; journal |
| Unchecked-order rate | Flight Recorder |
| Scans; bag cards; Telegram groups | Scan and share events; bot memberships |
| Census | **Only if label precision is ≥ 90%** |

Show numbers only, with misses next to refusals. The token is "planned; it launches when its gates pass."

**Go/no-go meeting: Sun Oct 18, 17:00**, reconfirmed Mon Oct 19. The Owner decides; Dev A can veto on contracts and the guard.
- [ ] **Zero honeypot fills** through the guard, in beta and since T.
- [ ] **Eval gates green** three nights running, including Access at 100% and the daily-burn script's fork run.
- [ ] **ReceiptsRegistry review on a budget done** (§6.2):
  - three AI reviews done, and Slither/Aderyn triaged
  - the fuzz, invariant and fork suites green
  - the 72h public window closed
  - every High and Critical finding fixed and re-checked
  - the deployed bytecode equal to the final hash
- [ ] **Bug bounty live** (self-run, up to $500; §6.3).
- [ ] Each D0 feature is either green or cut from the D0 comms: Mission Control v1, on-chain guardrails (Safe plus Zodiac Roles where possible; enforced once reviewed, otherwise advisory and the comms say so), the ChatGPT and OpenClaw packs (plus the Claude Desktop and claude.ai connector if it fell back to D0), Rule Lab v1, Deep Research, the perps panel, the summon bots, Beat the Swarm and the Clear badge.
- [ ] **Burn wallet ready:**
  - hardware #6 set up (or the 2-of-3 Safe)
  - its address on the transparency page, pinned, and labelled on the explorer
  - the daily-burn script dry-run on a fork, for both a curve buy and a pool buy
  - the daily burn time set (§12.2)
- [ ] **Launch buy-and-burn ready:** the dev wallet holds $100 of ETH plus gas; the buy and the burn are dry-run on a fork.
- [ ] **Final:**
  - the `$EKO` clone re-check (Oct 19)
  - the buyback slice (the team confirms 25% or changes it)
  - team token buys (decision 4)
- [ ] Pons creation rehearsed. The creator must be in a region where Pons is available (it's blocked in the UK and EU). **Never use a VPN to get around it.**
- [ ] Wallets gas-funded; timelock (standard template) tested on a fork; bots tested from private accounts; the official-links page live.

**Outcomes:** **GO**; **GO without named features**; or **SLIP one week**, with a public post naming the gate that failed.

## 11. Token day (D0, Tue Oct 20)

### 11.1 Pons creation checklist

> **Dropped 2026-10-05:** "native buyback ON" as EKO policy, the launch buy-and-burn staging and the "dev buy → burned" self-scan line.

The Owner is at the keyboard and Dev A reads every field back.
- [ ] **Creator:** the dev fee wallet, so the creator and fee recipient are one public address.
- [ ] **Name and ticker:** EKO / `$EKO`, exactly as decided; re-checked against clones on Oct 19.
- [ ] **Creator tax: 1%, fixed.** The token's total fee is 2%: the Pons 1% standard fee plus this 1% creator tax. Check it isn't typed as 2 (the total), 10 or 0.1.
- [ ] **Native buyback: ON at `{{BUYBACK_SLICE}}`** (25%, tentative, unless the team changed it by Oct 18). It's locked at creation.
- [ ] **Anti-sniper exemption wallets: zero.** Not one.
- [ ] **Pair: ETH.**
- [ ] **Metadata:** official links only, and no text aimed at agents (our agent-bait scan must pass).
- [ ] **Launch buy-and-burn staged:** the dev wallet holds $100 of ETH plus gas, and the buy and the burn were dry-run on a fork on D0-1 (§11.3).
- [ ] **Team buys (if any):** from disclosed wallets, after the anti-sniper tax has decayed, sent to the timelock within the hour, with the hashes posted.
- [ ] **Read it back on-chain:** the 1% creator tax, the buyback, the fee recipient, and **no `SnipeTaxExempted` events.** Archive screenshots.

### 11.2 Self-scan
- [ ] Scan our own CA and post the result as it comes out.
- [ ] The scanner should show "Fixed 1% creator tax (immutable)" as Info, and the launch buy as "dev buy → burned."
- [ ] **If the verdict isn't Clear, post it anyway and explain.**

### 11.3 Launch buy-and-burn and burn wallet wiring

> **Dropped 2026-10-05:** the launch buy-and-burn, the burn wallet, the daily burn and burning token payments. Do not run or post any of this.

- [ ] **The $100 launch buy-and-burn (~L+1m):**
  - Once the anti-sniper window has ended (`antiSnipe.endsInSec` is 0 on our card), the dev wallet buys **$100** of the token.
  - It **burns the full amount immediately**, with `token.burn` if the token supports it, or otherwise a transfer to the dead address. Check which on the D0-1 fork dry run.
  - Both signatures are four-eyes on hardware #2.
  - If the window runs long, wait for it: never buy into the anti-sniper tax.
- [ ] **Post it at ~L+2m** on the three official channels, with the buy and burn tx hashes. The Burn Board shows it as the launch burn.
- [ ] **Publish the burn wallet** (hardware #6, or the 2-of-3 Safe):
  - on the transparency page, pinned, with its explorer label
  - on the Burn Board, with the daily burn time
- [ ] **Terminal fee:**
  - Point the terminal fee recipient in the swap calldata at the burn wallet. `fee.destination` is the burn wallet address, and it's `null` whenever the fee is 0 bps.
  - Switch the fee from 0 to **50 bps on Uniswap-routed trades** (tier discounts from D0+1).
  - **Pons-curve trades stay at 0 bps** (no curve fee at launch).
- [ ] **Token payments** (research runs, quotas, premium) are switched on, paid to the burn wallet, and burned in the daily burn. The weekly x402 sweep to the burn wallet is set up with Drop 1 (§12.2).
- [ ] **The first daily burn is that evening** at the scheduled time (§12.2). It burns whatever the wallet has received since the fee switched on.
- [ ] **Disclosure:** daily burn buys pay the token's 2% fee (Pons 1% + 1% creator tax) like any buyer. The monthly note shows it.
- [ ] **Wording:** "burned daily from a public burn wallet; every transaction posted." **Never** "trustless," "automated," "ownerless," "nobody can touch it" or "audited" about the launch burns (FACTS §6).

### 11.4 Tiers (D0+1, Wed Oct 21)
- [ ] **12:00:** the Owner sets `{{TIER_AMOUNTS}}` from the price at that moment: token amounts worth ≈ $50 / $250 / $1,000 (decided). Dev A reruns the Access suite. The amounts are reviewed monthly and only ever lowered.
- [ ] **16:00:** tiers go live on the 24h minimum balance (40, 30 and 25 bps). Post the amounts.

### 11.5 Summon bots
- [ ] X (API; image cards, no links), Farcaster (Neynar) and Telegram, all with summoned replies only, one per interaction, deterministic cards, rate limits and dedupe.

### 11.6 Run-of-show

> **Dropped 2026-10-05:** the launch buy-and-burn rows, publishing the burn wallet, pointing fees at the burn wallet, the `burn_board` flag and the first daily burn.

| Time | Action | Owner |
|---|---|---|
| D0-1, 17:00 | Gate reconfirmed. Fork dry run of creation, the launch buy-and-burn (buy, then `token.burn` or the dead-address transfer), the fee wiring to the burn wallet, and the daily-burn script. | All |
| 08:00 | On-call. Hardware wallets on hand and tested: #2 (dev) and #6 (burn). Gas funded. The dev wallet holds $100 of ETH for the launch buy-and-burn, plus gas. | Dev A, Owner |
| 10:00 | D0 release deployed with its features dark | Dev A, Dev B |
| 12:00 | Milestone timelock deployed from its standard template, verified and published | Dev A |
| 13:00 | "Token launches today. The only CA comes from `{{MAIN_HANDLE}}`, the Telegram channel and `{{DOMAIN}}`." Never post the launch time: it hands snipers the timing. | Marketing |
| 15:30 | Pons form filled and read back | Owner, Dev A |
| **16:00 (L)** | **Create the token** | Owner |
| ~16:01 (L+1m) | **Launch buy-and-burn:** once the anti-sniper window has ended, the dev wallet buys $100 of the token and burns it immediately (four-eyes) | Owner, Dev A |
| 16:02 | Settings verified on-chain; CA posted on the three official channels at once | Dev A, Marketing |
| ~16:02 (L+2m) | **Launch buy-and-burn posted** with both tx hashes (X, Telegram, Burn Board) | Marketing, Dev A |
| 16:10 | Self-scan posted ("Fixed 1% creator tax (immutable)" as Info; "dev buy → burned") | Marketing |
| 16:15 | Team buys (if any) → timelock | Owner |
| 16:20 | **Burn wallet published** (transparency page, pinned post, explorer label) with the daily burn time | Dev A, Marketing |
| 16:30 | Terminal fee pointed at the burn wallet and switched to 50 bps on Uniswap routes (Pons-curve stays 0 bps); token payments on | Dev A |
| 16:35 | ReceiptsRegistry review report ("AI-assisted and automated review, not a professional audit") published in the `contracts` repo, beside the contract address and its commit hash (§6.2) | Dev A |
| 16:45 | Green D0 features and summon bots flagged on, including `burn_board` | Dev B, Dev A |
| 17:00 | Launch thread; KOL posts (#ad); Space | Marketing, Owner |
| 17:00–22:00 | War room: clone watch on our name (Ghost Reports on fakes), guard, bot spend | All |
| **20:00** (the proposed daily burn time) | **First daily burn** (§12.2): the burn wallet's full balance is bought and burned; each transaction is auto-posted on the Burn Board, X and Telegram | Owner (signer), Dev A (script and read-back) |

## 12. Post-launch operations

### 12.1 Weekly Drop release (every Tuesday, Oct 27 → Dec 29)
- [ ] **Fri:** eval pre-check, including the drop's own gates (AFI label precision ≥ 90%; Radar crew precision; Arena no look-ahead; Launcher clean on a fresh Akash box). Demo video done; release note drafted. (Dev A, Dev B)
- [ ] **Sun (-48h):** teaser, **only if the pre-check is green.** (Marketing)
- [ ] **Mon:** final eval gate. Go, or **slide a week** and say why. Never ship broken. (Dev A → Owner)
- [ ] **Tue 16:00:** flag flip (team first, then everyone), smoke test, demo video, release note (what shipped, eval scores, receipts hit rate, known limits), mascot post. (All)
- [ ] **Wed:** review. The public roadmap lists only drops with a working demo.

### 12.2 The daily burn ritual (from D0)

> **Dropped 2026-10-05:** the daily burn ritual, its posts and the weekly burn report. EKO plans no token burns.

Once a day at the scheduled time, the burn wallet's full balance is bought and burned, and every transaction is posted. The wording is always "burned daily from a public burn wallet; every transaction posted."

**Time:** **20:00 UTC daily** (proposed; the Owner fixes it before D0).
- The first burn is on the evening of D0.
- The time is published on the Burn Board (`nextScheduledBurnAt`). Any change is announced 24h ahead.
- Unlike the token's launch time, the daily burn time is public.

**Signers:**
- The Owner signs on the burn wallet (hardware #6). Dev A runs the script and reads every transaction back from the device screen (four-eyes).
- **For two signers,** make the burn wallet a 2-of-3 Safe before D0 (the published address depends on it), so two people sign each burn and one absence doesn't stop it.
- With a single signer, a missed day rolls into the next burn (§13.5).

**The script** (`scripts/daily-burn.ts` in the public `contracts` repo; it holds no keys):
1. **Read** the burn wallet's balances: ETH (terminal fees), USDC (the x402 sweep, from Drop 1), and the token (token payments).
2. **Assert** that the token address equals `TOKEN_ADDRESS` from `addresses.4663.yaml`, and refuse anything else.
3. **Quote** a buy with the full balance minus a gas reserve, on the best route: the Pons curve before graduation, the pool after. The quote must be within the script's slippage cap; above the cap, split the buy into slices. USDC is swapped in the same run.
4. **Buy:** build the buy transaction(s) for the device to sign, and wait for confirmation.
5. **Burn** the full token balance (the bought tokens plus any token payments) with `token.burn`, or a transfer to the dead address. Wait for confirmation.
6. **Check and post:**
   - The script checks that the token balance is 0 and only the gas reserve is left.
   - It then emits the burn event (buy and burn tx hashes, tokens, USD) to the API.
   - The event feeds the Burn Board and the WS `burns` channel, and triggers the X bot and Telegram posts.

**Posting:** automatic, from the event: "Burned N $EKO ($X) from the public burn wallet today. Buy: ‹tx›. Burn: ‹tx›." There's no price talk. Marketing checks the posts landed.

**Never:**
- dev fees into the burn wallet
- any outflow other than the buy and the burn
- buying any token but ours
- skipping a day silently (§13.5)

**The weekly burn report** (Tuesdays at 14:00; the first is **Tue Oct 27, D+7**; each covers the 7 days to Monday):
- totals burned and % of supply
- each daily burn with its tx hashes
- inflows to the burn wallet by source: terminal fees, paid API and x402, and token payments
- Pons buyback totals
- the launch burn (first report only)
- any late or missed burn, and why

It's posted from main and the Telegram channel, and linked from the transparency page.

**Drop 1 also sets up the weekly x402 sweep** (moved from D0):
- It uses the payTo/sweep key, with the facilitator key settling payments on Base (§5).
- Base USDC is bridged to Robinhood Chain and sent to the burn wallet, which swaps and burns it in the next daily burn.
- The in-transit balance is disclosed.

### 12.3 Milestone buys

> **Dropped 2026-10-05:** milestone buys and the milestone timelock.

The milestones are 1,000 wallets connected, 100 agents connected, $1M volume, 30 days with zero fills, and $10M volume.
- [ ] Dev A confirms the milestone against its published definition (§14).
- [ ] The Owner computes **10% of creator fees earned since the last milestone** (the first one counts from launch) and publishes the calculation.
- [ ] **Within 72h,** buy from the dev fee wallet in slices and send the tokens to the **timelock** (the default), or burn them, and announce which.
- [ ] The mascot posts the tx hashes and the Scoreboard logs it. Wording: "bought and locked X because Y shipped." Never mention price.

### 12.4 Monthly note and weekly reports

> **Dropped 2026-10-05:** bounty payouts, burns, Pons buybacks and milestone buys in these notes, and the weekly burn report.

- [ ] **Monthly fee and costs note** (first working day; the first is Mon Nov 2, covering Oct 20–31; written by the Owner). It covers:
  - **fees earned:** creator fees, terminal fees, and paid API and x402 revenue
  - **costs** by vendor, with any card payment ([Card exception]) marked, and bounty payouts
  - **burns:** the daily totals and the launch burn, plus the 2% token fee the burn buys paid (the creator tax and the creator share of the Pons fee flow back to the dev wallet)
  - **Pons buybacks**
  - milestone buys and team wallet changes
- [ ] **Weekly KPI report** (Mondays; complete internally, a subset in public): §14 against target, the funnel, the harness, trust (refused vs missed, precision, hit rate), holders and burns, spend, incidents.
- [ ] **Recurring:** the daily burn (§12.2); the weekly burn report (Tuesdays); nightly evals; weekly hot-wallet top-ups; the Census report weekly once gated; monthly restore drills; quarterly rotation.

## 13. Incident runbooks

> Pause first, investigate second. Never delete a published verdict or post; correct it. Marketing owns comms, and the on-call dev approves the facts. Every Sev 1 gets a public post-mortem within 24h.

### 13.1 Guard miss (a honeypot fill)
- **Detection:** the post-fill sell check fails, or a user reports it.
- **First 15 min:** turn the `trading_live` flag off (the runtime kill switch; if the flag path itself is in doubt, drop the `LIVE_TRADING_ENABLED` ceiling too). Replay the fill on a fork at its block and save the tx, calldata, card and simulation logs. Mark the coin Danger and contact the user.
- **First hour:** find the root cause (a simulation gap, a route mismatch, or state that changed after the simulation). Add a fixture and rerun the guard and Normalizer suites. Turn `trading_live` back on only once they're green (allowlist-only first, if the Owner wants a staged restart).
- **Communication:** within 1h, post "Live trading paused: a honeypot filled through our guard." **Honeypots missed** goes up, with a post-mortem in 24h. **Before D0 this fails the token gate;** after D0 it resets the 30-day milestone.

### 13.2 Wrong verdict
- **Detection:** a report, a GoPlus/ScanHood disagreement, or Scoreboard grading.
- **First 15 min:** replay the verdict at its block. Correct a false Clear to Danger at once; correct a false Danger and restore any Clear badge. The original receipt stays.
- **First hour:** add a fixture, hot-fix the rule, rerun Playbooks, and check other coins the same rule hit.
- **Communication:** a correction on the Scoreboard; a human reply from main wherever the card was shared.

### 13.3 RPC outage
- **Detection:** the RPC lag alert, or a spike in simulation failures.
- **First 15 min:** confirm the guard is **refusing** trades. Fail reads and broadcasts over to the second path. Status page: "Trading paused."
- **First hour:** check dRPC. The committer queues its roots, and late receipts are flagged. Re-enable once a fixture simulation passes.
- **Communication:** the status page and Telegram. X only after 1h.

### 13.4 AI provider outage
- **Detection:** OpenRouter errors, or the circuit breaker trips.
- **First 15 min:** fail over to PPQ. If both are down, the swarm pauses and Fast Scan runs on rules only (verdicts are unaffected).
- **First hour:** pause Deep Research, refund holder runs as credits, and make x402 `deep_research` error without charging.
- **Communication:** the status page and an in-app banner.

### 13.5 Burn wallet

> **Dropped 2026-10-05:** this runbook, with the burn wallet and daily burns.

**Missed or late burn**
- **Detection:** the status-page check or the Sev 2 alert (no burn transaction within 60 min of the scheduled time). The Burn Board shows "running late" on its own.
- **First 15 min:** find the cause (signer unavailable, script error, RPC, a stuck transaction). Post on Telegram, and from main if it's over 2h: "Today's burn is late: ‹reason›. It will run by ‹time›."
- **First hour:** run the burn as soon as the cause is fixed. If it can't run today, the next scheduled burn covers both days' balance, and the post says so.
- **Communication:** the late or missed burn goes in the weekly burn report, with its reason. **Never skip a day silently.**

**Wrong-token buy** (Sev 1)
- **Detection:** the script's post-check, the alert on a burn-wallet buy of any other token, or a read-back mismatch.
- **First 15 min:**
  - Stop, and **don't burn the wrong token.**
  - Scan it with our own guard. If it can be sold, sell it back to ETH; if it can't (a honeypot), leave it and say so.
  - Then run the correct buy and burn.
- **First hour:** fix the script. The token address is hard-coded from `addresses.4663.yaml` and asserted before signing, and the four-eyes read-back checks the address on the device. Add a fork test for it.
- **Communication:** a public note within 1h with every tx hash, what happened, and what the loss was. It also goes in the weekly burn report.

**Compromised burn wallet** (Sev 1)
- **Detection:** any burn-wallet outflow that isn't a daily buy or burn, or a suspected seed or device exposure.
- **First 15 min:**
  - If the key still works, run an **emergency buy-and-burn of the full balance** at once. It's the fastest way to put the funds out of reach.
  - Set the terminal fee to **0 bps** and stop routing token payments and the x402 sweep to the old address.
- **First hour:**
  - Set up a fresh hardware burn wallet (or Safe), and publish its address, labels and the old wallet's final state.
  - Repoint the fee destination (a config change) and turn the fee back on.
  - Rotate every secret that shared the device, and run forensics.
  - **Never route fees to a hot wallet**, even for a day.
- **Communication:** a public note within 1h; update the transparency page; a post-mortem within 24h.

### 13.6 Bot suspension (X or Telegram)
- **Detection:** API 401 or 403 errors, a lock notice, or a revoked token.
- **First 15 min:** stop the worker (retries make it worse), confirm main is unaffected, and save the notice.
- **First hour:** audit the last 24h of output against the rules, fix the cause, and appeal officially. **Never create a replacement account** (that's ban evasion).
- **Communication:** main pins "X summons paused; scan on the web, Telegram and Farcaster."

### 13.7 Key compromise
- **Detection:** a watch-list outflow, unexpected API spend, or a secret-scanning alert.
- **First 15 min:**
  - **Dev fee wallet:** `transferCreatorFeeRecipient` to a fresh hardware wallet, then move the funds.
  - **Burn wallet:** follow §13.5 (compromised burn wallet): emergency buy-and-burn, fee to 0 bps, then a fresh wallet.
  - **Hot keys:** rotate them and drain their gas.
  - **Credentials:** revoke them.
- **First hour:** rotate every secret that shared the device; run forensics; sign a migration message if we still hold the old key.
- **Communication:** a public note within 1h; update the transparency page.

### 13.8 Impersonator tokens or accounts
- **Detection:** our own clone-swarm flags on our name, lookalike handles, or fake Telegram admins.
- **First 15 min:** repost the official CA and links, and report the impersonators on each platform.
- **First hour:** Ghost Reports on the fakes, with receipts; partner groups pin the official links.
- **Communication:** "We never DM first. The only CA is on `{{DOMAIN}}/official`." Before D0: "We have no token yet."

### 13.9 Trademark complaint
- **Detection:** mail to `legal@`, or a notice from a platform or registrar.
- **First 15 min:** acknowledge it, keep everything, and don't argue in public.
- **First hour:** if it concerns Robinhood marks, remove the use at once and reply with the non-affiliation line. If it concerns our name, the Owner decides on a rename. Either way it **triggers early counsel** (§15).
- **Communication:** none unless a platform acts; then a short, neutral note.

## 14. KPI dashboard

Day 30 means **D+30 (~Thu Nov 19)**. Dev A owns the dashboard, built from our own data.

| Metric | Target | Source |
|---|---|---|
| Wallets connected | 3,000 | Distinct SIWE-verified addresses |
| Bag reports shared | 1,000 | Bag share URLs created, plus OG fetches |
| Telegram groups running the bot | 50 | Bot is a member and ran ≥ 1 scan in 7 days |
| Agents connected | 300 | Active `agents` with ≥ 1 preflight in 7 days |
| Preflights per day | 1,500 | Journal preflight entries |
| Terminal volume | $250k/day average | Fills confirmed on-chain, in USD at fill |
| Honeypot fills through the guard | **0** | Post-fill sell checks; Scoreboard misses |
| Precision (playbooks, labels) | ≥ 90% | The nightly eval report |
| Clear cohort beats all launches | ≥ 3 of 4 weeks | Weekly cohort grading |
| Holders | 2,000 | Indexer (excluding pools, the burn wallet, the timelock and the dead address), checked on the explorer |

**Supporting metrics:** summons per day; D1 and D7 retention; trial → trade and trial → holder; referrals; burns; compute covered by fees; AI and X spend.

## 15. Legal-phase triggers (month 4+)

The planned start is **month 4 (~January 2027)**, after Drop 9. Any of these brings counsel in earlier:

| Trigger | Action |
|---|---|
| A regulator, Robinhood, Pons or X legal gets in touch | Pause the feature if asked; no public comment; counsel |
| A trademark complaint that removing one use doesn't settle | Counsel and a rename plan |
| Agent Apps, an enterprise licence, fiat billing or X Money | These need an entity (KYB) |
| EU or UK access, perp referral revenue, personalised features | Counsel first |
| A vendor demands KYB | Switch vendors, or start entity work |

**Prepare now:**
- [ ] A **data room:** dated policy versions, the receipts methodology, a fee-flow diagram, monthly notes, wallet and milestone records, KOL agreements with #ad evidence, post-mortems and eval reports.
- [ ] **Counsel questions:** the terminal (interface) fee, the daily burn and milestone-buy wording, the token's utility posture (SEC Rel. 33-11412), perp referrals, harness data privacy, sanctions.
- [ ] An entity shortlist (Owner), a paid contract-audit plan funded by fees (the first paid audit; until then, the §6.2 review on a budget), the Agent Apps pitch, and FISD due-diligence drafts.

## 16. Master checklist

> **Dropped 2026-10-05:** every burn wallet, daily or weekly burn, launch buy-and-burn, buyback slice, milestone buy, Burn Engine, bug bounty and closed beta item below.

- [ ] **Sep 30 · Owner:** name decided: EKO (decision 1); domain and handles registered by Oct 2; co-owner agreement; SignalOS merge logistics (brand retired)
- [ ] **Sep 30 · Marketing:** handle availability checked for EKO (X, Telegram, Farcaster)
- [ ] **Sep 30 · Dev A:** contracts frozen; GitHub org; Vultr, dRPC, Postgres; Slither, Aderyn and Foundry fuzz/invariant runs in the `contracts` CI
- [ ] **Sep 30 · Dev A:** dRPC `debug_traceCall` with state overrides and `eth_getBlockReceipts` confirmed on 4663 (else: own node or fork for simulations); backfill priced (if too costly: 7 days, plus candidate funding wallets and a Pons-events-only history scan)
- [ ] **Oct 1 · Dev A:** ReceiptsRegistry live; backfill started
- [ ] **Oct 1 · Owner:** X Premium on both accounts; X API credits (USDC first, a card if the Developer Console won't take it); models funded
- [ ] **Oct 1 · Marketing:** bot's Automated label; waitlist live
- [ ] **Oct 2 · Dev A:**
  - nightly evals live
  - [x] Pons curve, hook and event ABIs verified on-chain Oct 1 (graduation events still to observe on a graduated coin)
  - MCP OAuth verified with a real Claude Desktop and claude.ai custom connector (else: that pack moves to D0)
- [ ] **Oct 2 · Owner:** domain, DNS, email and all handles registered, the same day (decision 3)
- [ ] **Oct 3 · Marketing:** first Ghost Reports
- [ ] **Oct 3 · Dev B:** Telegram bot, channel and groups
- [ ] **Oct 4 · Dev A:** code frozen at `review-1`; three AI reviews started; findings log opened (§6.2)
- [ ] **Oct 4 · Owner:** one signer or a 2-of-3 Safe for the burn wallet (§5)
- [ ] **Oct 5 · Dev A:** backfill verified; review round 1 done (three AI reviews; Slither/Aderyn triaged); the daily-burn script on a fork
- [ ] **Oct 5 · Owner:** policies approved
- [ ] **Oct 6 · Dev A:**
  - alerts armed and restore drill done
  - `trading_allowlist` seeded with team wallets ($25 cap)
  - fuzz, invariant and fork suites green
  - **Gate B**
- [ ] **Oct 6 · Dev B:** status page live
- [ ] **Oct 6 · Owner:** hardware wallets set up, including the burn wallet (#6)
- [ ] **Oct 6 · Marketing:** mascot reveal; first beta invites
- [ ] **Oct 7 · Dev A:** team wallets trade live first ($25 cap); beta wallets from Oct 8 ($100 cap)
- [ ] **Oct 7–12 · All:** daily beta review
- [ ] **Oct 9, 11 · Marketing:** invite waves
- [ ] **Oct 12 · Owner, Dev A:** **Gate T**
- [ ] **Oct 13 · All:** T run-of-show (§9); repos public; **72h public code-review window and bug bounty (up to $500) live at 13:00**; live trading public at 16:00 ($250 cap)
- [ ] **Oct 14–19 · Marketing:** daily stats card
- [ ] **Oct 16 · Dev A:** the public review window closes at 13:00; the T cap rises to $1,000 at 16:00, if clean
- [ ] **Oct 16 · Dev B:** Farcaster bot ready
- [ ] **Oct 17 · Dev A:** every High and Critical finding fixed and re-checked; final hash recorded; review report drafted
- [ ] **Oct 18 · Owner:**
  - **go/no-go**, including burn wallet readiness and the launch buy-and-burn staging
  - the team confirms the buyback slice (25%)
  - team token buys decided (decision 4)
  - daily burn time fixed
- [ ] **Oct 19 · All:** gate reconfirmed; `$EKO` clone re-check (Pons, the explorer, the X cashtag); fork dry run (creation, launch buy-and-burn, fee wiring, daily-burn script)
- [ ] **Oct 20 · All:** D0 run-of-show (§11.6): the launch buy-and-burn at ~L+1m (posted ~L+2m); the burn wallet published; the first daily burn that evening
- [ ] **Daily from Oct 20 · Owner, Dev A:** the daily burn ritual (§12.2)
- [ ] **Oct 21 · Owner, Dev A:** `{{TIER_AMOUNTS}}` set at 12:00 (≈ $50 / $250 / $1,000; only ever lowered); tiers live at 16:00
- [ ] **Oct 23 · Dev A:** Drop 1 pre-check
- [ ] **Oct 25 · Marketing:** Drop 1 teaser
- [ ] **Oct 27 · Owner, Dev A:** **first weekly burn report** at 14:00; **Drop 1** at 16:00, with the weekly x402 sweep (to the burn wallet) set up
- [ ] **Nov 2 and monthly · Owner:** fee and costs note (fees earned, costs, burns, buybacks)
- [ ] **Mondays · Dev A:** weekly KPI report
- [ ] **Tuesdays from Oct 27 · Dev A, Marketing:** weekly burn report
- [ ] **Within 72h of each milestone · Owner:** milestone buy
- [ ] **Nov 3 → Dec 29, Tuesdays · All:** Drops 2–9
- [ ] **Nov 19 (D+30) · Dev A:** day-30 KPI checkpoint
- [ ] **Drop 7 (~Dec 8) · Owner, Dev A:** the automated Burn Engine, **only if its review is done** (§6.5); otherwise a later Drop, and the manual daily burns continue
- [ ] **Month 4+ · Owner:** open the legal phase from the data room and the counsel question list
