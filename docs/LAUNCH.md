# Launch readiness

## What was verified, and how

| Area | Verified | Evidence |
|---|---|---|
| Core journey (paper) | ✅ | E2E (Chrome): market → analyst → signal on chart → reasoning → one tap on Buy $100 → fill → position → reload recovers everything. |
| Edge cases | ✅ | E2E and integration tests cover expired signals (visible, not actionable), stale market data pausing and resuming fills, insufficient balance, spot sells without holdings (`nothing_to_sell`), sells capped at the holding ("sell all"), duplicate taps and concurrent repeats of one idempotency key (one order), expired quotes, side mismatch, and market-data outage with reconnect. |
| Wrong network, switching, SIWE | ✅ | E2E with a test EIP-6963 wallet on chain 1 → switch to 4663 → Sign-In With Ethereum. |
| Live route (Uniswap v3, Robinhood Chain) | ✅ **on a local mainnet fork only** | Server tests against an Anvil fork of chain 4663 using the real contracts and liquidity: SELL confirmed with the actual fill matching the USDG balance change; BUY requires an exact approval, then confirms; wallet rejection; on-chain revert → `failed`; foreign transaction hash → `tx_mismatch`. A UI E2E on the fork covers Live mode → sign → *submitted* → *Confirmed on-chain*, plus rejection. |
| Live quotes on real mainnet | ✅ | Read-only QuoterV2 quotes through the public RPC (p50 313 ms). Re-checked 2026-09-28 through the server's `UniswapV3Adapter`: block 75,219,607, 0.1 ETH → 268.90 USDG (345 ms), 250 USDG → 0.09295 ETH (309 ms). |
| Real market data | ✅ | Coinbase WebSocket and REST. Rules bots published 30 real signals within minutes on live data. |
| AI pipeline | ✅ **with a scripted provider** | Validation, rejection logging, abstention, cache, outage and circuit breaker, the hard budget stop, and "Analyze now" (signal, abstain, cache hit, unconfigured, rate limit). |
| AI through the PPQ gateway | ✅ **one real call per route** | Claude, GPT, Gemini, Grok and DeepSeek default models each answered the production prompt on a real ETH-USD 1h snapshot, and every answer passed `validateModelOutput` (4–13 s). Claude needs the `json_object` fallback. See [INTEGRATIONS.md](INTEGRATIONS.md#ai-gateway-one-key-for-every-analyst). |
| Order books, sparklines, 24h stats | ✅ | Coinbase `level2_batch` streamed unauthenticated to a WebSocket client at ≈4 Hz (20 levels, 1¢ ETH spread); sparklines and 24h high/low served from real data; the simulator's book and stats are covered by integration tests. |
| Mobile | ✅ | E2E on a Pixel 7 profile: bottom-sheet card, paper buy, portfolio drawer, no horizontal scroll. Visually checked at 732 px and 390 px. |

## Not verified — do not claim

- **No live mainnet transaction was sent.** Nobody signed a real Robinhood Chain transaction with real funds. All execution tests used a local fork with test keys.
- **Direct AI provider APIs were not called.** Only the five default routes through the PPQ gateway were called, once each. The direct adapters (Anthropic SDK, OpenAI/xAI Responses, Gemini) remain unexercised, and the complete "Analyze now" → persist → broadcast path has only run with a scripted provider.
- **One-tap Live was not run end to end.** The composed live flow (`runLive`: network, SIWE, quote, exact approval, order, signature, submitted, confirmed/failed) is covered by unit tests with a fake wallet and server; the mainnet-fork suites were not re-run against it.
- **Real wallets were not tested by hand.** MetaMask, Robinhood Wallet and Rabby were not driven manually; the E2E tests use a test wallet. WalletConnect is not bundled.
- **Docker image not built.** The Docker daemon was unavailable, so the image layout was reproduced with `pnpm deploy --prod` and booted successfully instead.
- **Not tested at scale.** There was no load test beyond a single-user workload.

## Launch blockers (external dependencies)

1. **Market-data licence.** Coinbase's Market Data Terms (and Kraken's) forbid displaying or redistributing data to third parties without an agreement. Get written permission or a licensed feed; the feed is pluggable (`apps/server/src/market/types.ts`).
2. **Production RPC.** The public Robinhood Chain RPC is rate-limited and "not recommended for production"; we hit 429s. Get an Alchemy (or other listed provider) key and set `RH_MAINNET_RPC_URL`.
3. **Legal review of signals.** Showing buy/sell signals (AI or rules) to consumers may be regulated investment advice or research. You need counsel's opinion per launch jurisdiction, final disclaimers, and likely geo-restrictions.
4. **AI provider policies.**
   - Anthropic's usage policy treats consumer-facing investment advice as high-risk. It requires review by a qualified professional before outputs reach consumers, and disclosure of AI use at the start of each session.
   - OpenAI prohibits tailored advice that requires a licence without professional involvement.
   - Google's terms say not to rely on the service for financial advice, and DeepSeek requires marking outputs "for reference only".
   - SignalOS already labels AI output and keeps a human in the loop for every trade. The professional-review requirement is an **operational process you must put in place** (or keep AI bots disabled) before a consumer launch.
5. **Jurisdiction and sanctions controls.** Robinhood Chain's terms prohibit sanctioned persons and VPN evasion. Add geo-IP gating and wallet screening before a public live launch. Stock tokens are excluded because they are unavailable to US persons.
6. **Terms of service, privacy policy and risk disclosures** for a non-custodial interface. See [BUSINESS_MODEL.md](BUSINESS_MODEL.md).
7. **Keys and secrets.** You need `SESSION_SECRET`, `DATABASE_URL`, an RPC key, `GATEWAY_API_KEY` (or direct AI provider keys), `SENTRY_DSN` and `ADMIN_WALLETS`. PPQ's own terms and the upstream providers' usage policies (point 4) apply to gateway traffic.
8. **A first real live trade** from a small, dedicated wallet, observed end to end (quote → approval → sign → confirm → reconcile), before setting `LIVE_TRADING_ENABLED=true` for anyone else.

## Mainnet go-live checklist

Work through this in order; each step is reversible by setting `LIVE_TRADING_ENABLED=false`.

1. `NODE_ENV=production`, `SESSION_SECRET` (≥ 32 chars), `DATABASE_URL`, `SERVE_WEB=true`.
2. `PUBLIC_ORIGIN=https://<your-domain>`: it is the Sign-In With Ethereum domain. Boot refuses a localhost origin when live trading is on. With several origins, the SIWE message names the one the user is on.
3. `RH_MAINNET_RPC_URL` from a listed provider. Without it the public RPC is used, which works (verified above) but is rate-limited.
4. Check `/api/health`: `robinhood-mainnet` must be `ok` on chain 4663 with a current block.
5. Quote without enabling execution: with `LIVE_TRADING_ENABLED=false`, Live-mode quotes are informational (a `live_disabled` warning) and nothing can be submitted.
6. Enable `LIVE_TRADING_ENABLED=true` for yourself first, and do a first small trade from a dedicated wallet: SIWE → exact USDG approval (BUY) → refresh quote → sign → *submitted* → *confirmed* on the explorer. The server refuses an order whose quote pays out to a wallet other than the signed-in one, and the reconciler only confirms a transaction whose sender, router, calldata and value match the order.
7. Only then open it to others (launch blockers above still apply).

## Known limitations

- **Closing positions.** Close is a one-tap sell of everything held: `POST /api/orders/instant` with `all: true` on paper; on-chain, the wallet's ETH less a 0.0005 ETH gas reserve, through the normal quote → wallet-signature path. It sells what the wallet holds, which can differ from the recorded position if ETH moved outside SignalOS.
- **Execution coverage.** Only ETH ⇄ USDG is executable on-chain. Other markets are paper-only until verified tokens and venues exist. Aggregators (0x, 1inch, LI.FI, KyberSwap, Uniswap Trading API) would widen routing, but need API keys and terms.
- **Paper realism.** Paper fills use live bid/ask with a modelled 0.10% fee; price impact is not modelled.
- **Bar-close timing.** Bars close on the next trade, or after a 600 ms grace period, so signals trail the bar close by about 0.6–0.9 s.
- **Forward records.** Forward paper records assume every signal was acted on at the next bar open. They are hypothetical, and labelled as such.
- **Single worker.** The signal worker is designed for one process (`numReplicas: 1`).
