# Custody, routing, signals and monetization

This page states how SignalOS actually works today, so that users, partners and counsel can assess it. It describes the product; it is not legal advice. Calling the product a "wrapper" or "interface" does not by itself settle its obligations. Each point below should be reviewed for the jurisdictions you launch in.

## Custody: non-custodial

- **Where assets live.** In the user's own wallet.
- **What SignalOS never does.**
  - It never receives, holds, pools or moves user funds.
  - It never asks for or stores seed phrases or private keys.
  - It never signs transactions.
- **What the server does in live mode.** It builds the Uniswap v3 swap calldata and simulates it with `eth_call` from the user's address. The user's wallet then shows the transaction and the user signs it. Approvals are for the **exact** amount of each trade.
- **Paper mode** is a simulation held in SignalOS's database. It is clearly labelled and stored separately from any on-chain activity. Paper "balances" are not assets.

## Routing: user-initiated, direct to a public AMM

- **Venue.** Every live trade goes directly to **Uniswap v3 on Robinhood Chain mainnet** (verified contracts; see [INTEGRATIONS.md](INTEGRATIONS.md)). There is no aggregator, no RFQ, no internalization and no order book operated by SignalOS.
- **Pool selection.** The route is chosen among Uniswap fee tiers purely by best quoted output for the user.
- **No payment for order flow.** SignalOS takes **no fee, spread or rebate** on trades today; the calldata contains no fee-taking step.
- **Execution risk stays with the user.** Price can move within the user-selected slippage limit, and transactions can revert. A tap sends the trade at once, but the UI never shows a submitted on-chain transaction as a completed trade, and never claims guaranteed execution or a guaranteed price.
- **Every trade is user-initiated.** Each trade needs an explicit tap on Buy, Sell or a position's Close, for an amount the user picked; there is no separate review screen. On-chain the user's wallet must also sign the swap (and approve the exact USDG amount for a buy), and live trades above the user's large-trade limit need one more tap first. There is **no automated or unattended trading** in this release; the Automation page is disabled by design.

## Signals: information, not advice

- **Kinds of bots.**
  - **Deterministic rules bots** are published strategy templates with visible parameters.
  - **AI analyst bots** are third-party large language models given a fixed, reproducible indicator snapshot.
  - **Ensembles** combine member bots under explicit quorum rules.
- **Everything is recorded and reviewable.** Every signal is persisted with its rationale, invalidation level, data timestamp, expiry and a permanent event history.
- **Performance claims are only shown when backed by records.** Backtests, forward paper records and live records are labelled separately, each with its sample size, period, fee and slippage assumptions, and methodology.
- **What SignalOS does not claim.**
  - It does not present model "conviction" as a probability of profit.
  - It does not imply that a general-purpose model produces profitable strategies.
  - It does not fabricate reviews, users, win rates or verification badges.
- **Still possibly regulated.** Displaying buy/sell signals may be a regulated activity in some jurisdictions (investment advice, a research service or an investment-recommendation regime), even when the signals come from software and the user decides.

## Monetization: none implemented

- **Today.** SignalOS charges nothing and has no payment or entitlement system. Community bots are free, and the shop has no "buy" buttons by design.
- **No crypto-asset offering.** There is no token, token sale or staking scheme, and none is planned. The product is the trading workspace.
- **Candidate models.** Each would need its own review before building.
  - A **subscription for the workspace or AI bots** is the lowest-risk option: a fixed price, independent of trading.
  - **Creator revenue share** on community bots needs a payment provider, entitlements, tax handling and creator agreements.
  - An **interface fee on swaps** is common among DeFi front-ends, but it changes the regulatory analysis (broker/exchange/money-transmission questions) and must be disclosed before the tap that trades.

## Obligations to review before launch

See [LAUNCH.md](LAUNCH.md) for the full checklist. The main ones:

1. **Investment advice / research rules** for AI and rules signals, and the disclaimers and suitability duties that come with them.
2. **AI provider usage policies.** Anthropic classes consumer-facing investment advice as *high-risk*: it requires human review by a qualified professional and disclosure of AI at the start of each session. OpenAI, Google and DeepSeek have comparable restrictions.
3. **Market-data licensing.** Coinbase and Kraken public data may not be redistributed to third parties without an agreement.
4. **Sanctions and jurisdiction controls.** Robinhood Chain's terms prohibit sanctioned persons and VPN evasion, and stock tokens are not available to US persons.
5. **Terms of service, privacy policy and risk disclosures** for a non-custodial interface.
