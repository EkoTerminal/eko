# Backlog from reviews

Found while reviewing Codex packets. Each line says where it came from.

- **Re-adapt the trade context** (001 review): `TradeContext.tsx` was removed with its analyst/portfolio/signals deps,
  and 013 removed what was left of `TradePanel.tsx` (only the signal `WhyDetail`); rebuild the guarded trade panel
  from the baseline commit `39c45c2` (the SignalOS import) in milestone M3 (03-FRONTEND §1.2, §3.6).
- **Legacy `/api/*` callers** (006 review): SIWE, quotes, orders, balances, metrics and telemetry still call SignalOS
  `/api/*`; move them to `/v1` with the backend's route migration (04-BACKEND §2.2 `routes.ts`).
- **Mocks cover `/v1` only** (006 review): legacy `/api/*` calls aren't mocked, so `VITE_MOCKS=1` is offline only for
  the new API surface.
- **Light Desk palette** (005 review): the prototype has none; needs a design decision before a light theme ships.
- **Orphaned tables** (013 review): `bots`, `bot_versions`, `bot_installs`, `signals`, `signal_events`,
  `signal_rejections`, `strategy_evaluations` have no code left; drop them in a migration once the data model task
  lands. `inference_runs` is still read by budget/usage code but has no writer.
- **Research list API** (013 review): `/research` lists mock notes; it needs a list contract and `GET /v1/research`.
- **RPC spending guard** (021 live tests): now task 024.
- **Holders live check** (021): run `logs:holders` live and confirm that for coins launched inside the window the
  balances sum to the total supply exactly.
- **Cards for non-Pons tokens** (022 replay, Oct 2): 2,683 indexed tokens with Uniswap pools have no known deployer
  (they were first seen through a pool, not a launch), and `loadSources` skips them, so they get no card (023 would
  404 them). Card them with the deployer marked unavailable (CA-34 pending) and find deployers later (explorer
  contract-creator lookup or a bounded search).
- **Engine write cost grows with history** (022 replay): the write transaction's share of replay time rose from 22% to
  71% over 120k evaluations (17 min total, fine for now). Batch writes per block or trim per-run rows before the
  live database grows large.
- **`replay_planned` overcounts** (022): it counts tasks for every token (5,167), but only Pons coins with a deployer
  are evaluated (2,475 coins, 120,099 evaluations of 481,270 planned).
- **Live follower catch-up** (025, Oct 2 live run): about 11 blocks/s on default caps against about 10 from the chain, so
  a 2,000-block gap closes slowly (about 30 min) though it keeps up at the head. Ticks are dominated by RPC wall time
  (median 13.6 s per 200 blocks). Also cut paid `eth_getBlockByNumber` header reads (283 in 300 s) and contract reads
  (145); paid ran about 2.75 calls/s during catch-up (target 1–2 at the head).
- **Curve progress coverage** (023, Oct 2 real-data check): only the near-graduation coins carry `curvePct`; the 100
  newest Pons coins on the New column show none (the card needs the curve's launch inventory and current balance, and
  total supply is known for few coins). Read curve inventory from the launch transfer or the curve's own view so every
  Pons coin has progress.
- **Read proxy routing** (124 review): `/v1/rpc` reads (`latest` only, 120/min per IP) go through the default metered
  route, which sends `eth_call`/`eth_getBalance` to the paid provider first. Route the proxy public-first with paid
  fallback so web traffic doesn't consume the paid daily budget.

