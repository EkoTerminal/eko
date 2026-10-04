# Operations

## Deployment topology

SignalOS runs as **one always-on service**: API, WebSocket, signal worker and reconciler, plus the static web app. It must not sleep, because a sleeping worker misses bar closes and signal expiries and would silently break the product. Serverless or scale-to-zero platforms are therefore unsuitable for the worker: Vercel Hobby and Pro, Render Free, Koyeb Free and Neon Free are all ruled out.

| Component | Recommended (≤ $45/provider/month) | $0 alternative |
|---|---|---|
| App service (Docker) | **Railway Hobby**, 1 replica, with the hard usage limit set. Expect ≈ $7–15/mo. `railway.json` is included. | Oracle Cloud Always Free Ampere VM, or a GCE e2-micro, running Docker under systemd. You own patching and backups. |
| Postgres | **Railway Postgres** in the same project, under the same hard limit, ≈ $3–6/mo. | **Supabase Free**: 500 MB, and constant writes prevent its inactivity pause. Keep candle retention short. |
| Errors | Sentry Developer (free, 5k errors/mo) through `SENTRY_DSN` | — |
| RPC | An Alchemy (or other listed) Robinhood Chain endpoint through `RH_MAINNET_RPC_URL` | The public RPC is rate-limited and not for production. |

Front the service with any CDN or TLS proxy. Serving the web app from the same origin as the API is what keeps session cookies first-party (`SameSite=Lax`). If you split the frontend onto another origin, you must switch to `SameSite=None; Secure` and handle third-party cookie blocking. The single-origin deploy avoids that entirely.

API and MCP share `TRUST_PROXY_HOPS`, a non-negative integer that defaults to `0`.
At `0`, every IP-based limiter uses the socket peer and ignores `X-Forwarded-For`.
For a fixed proxy path, set the exact number of trusted hops counted from the
socket outward. At `1`, `X-Forwarded-For: attacker, client` resolves to `client`,
the rightmost address appended by the edge; earlier caller-supplied entries do
not select a rate-limit bucket. Invalid values refuse boot.

Before enabling a positive value, restrict origin access to that proxy path and
block direct connections and routes with fewer hops. A hop count does not verify
the peer's address: a directly reachable origin would let a caller impersonate
the proxy. Each trusted proxy must append the observed connecting address (or
overwrite the header with the observed client address for a one-hop path).
Railway's edge appends one hop; staging sets `TRUST_PROXY_HOPS=1` for API and MCP.
Use `0` for direct/private connections without that edge, and verify the topology
again before adding a CDN or another proxy.

### Railway

```bash
railway init && railway add --database postgres
railway variables set NODE_ENV=production SESSION_SECRET=$(openssl rand -hex 32) \
  PUBLIC_ORIGIN=https://<your-domain> DATABASE_URL='${{Postgres.DATABASE_URL}}' \
  RH_MAINNET_RPC_URL=https://robinhood-mainnet.g.alchemy.com/v2/<key> LIVE_TRADING_ENABLED=false
railway up
```

The health check is `/api/health/ready`. It returns 503 until market data has been backfilled and the worker is running. Migrations apply automatically on boot.

**Keep `numReplicas: 1`.** To scale reads later, add API-only replicas with `RUN_WORKER=false`.

## Cost controls

Railway/Supabase cost-control policy, applied manually because the `railway-supabase-cost-controls` skill was not available in this environment:

| Threshold | Meaning | How to enforce |
|---|---|---|
| **Target ≤ $45 per provider per month** | Budget | Right-size to 0.5 vCPU / 1 GB. Measured on live data: ≈ 450 MB RSS and ≈ 0.6% CPU with embedded PGlite, which runs Postgres in-process; expect less with an external `DATABASE_URL`. |
| **Warn at $40** | *Alert only*: notifies you, does not stop anything. | Railway: *Usage → Email alert at $40*. Supabase Pro: *spend alerts*. Sentry: quota email. |
| **Critical at ≥ $45** | *Hard limit*: the provider stops workloads when reached. | Railway: *Usage → Hard limit = $45* (it takes services offline, so set the email alert below it). Supabase Pro: the Spend Cap is on by default and hard, **but it excludes compute add-ons**, so pick the compute size deliberately. Supabase Free cannot bill at all. |

Alerts are not limits. Only Railway's hard usage limit and Supabase's spend cap (for usage, excluding compute) actually stop spend. The Neon, Render and Fly.io tiers compared during research offer alerts only.

Controls inside the app:
- `AI_DAILY_BUDGET_USD` is a **hard** daily stop on estimated AI spend, checked before every call.
- `AI_MAX_CALLS_PER_BOT_HOUR` caps calls per bot.
- AI bots only evaluate, on schedule, charts someone is watching with that bot enabled (5m–1d, never 1m); "Analyze now" is limited to 6 runs per account per minute and still passes the budget checks.
- One gateway key (`pnpm setup:ai`) serves every AI analyst; spend is recorded per run from the gateway's reported cost, so `AI_DAILY_BUDGET_USD` tracks real spend closely. Also set a spending limit in the PPQ dashboard.
- Candle retention: the 1m and 5m tables grow about 17k rows/day for the 10 markets. On Supabase Free, prune periodically with `DELETE FROM candles WHERE timeframe IN ('1m','5m') AND time < extract(epoch from now() - interval '30 days')`.

## Monitoring

| Signal | Where |
|---|---|
| Liveness / readiness | `GET /api/health/live`, `GET /api/health/ready` |
| System detail | `GET /api/health`: feed status, lag and reconnects; provider status and last error; RPC block height; worker last tick |
| Latency (p50/p90/p99) | `GET /api/metrics`, the status bar in the app, and *Settings → Latency* |
| AI spend and runs | `GET /api/ai/usage` and *Settings → AI budget* |
| Errors | Sentry (server errors and client errors forwarded via `/api/telemetry`) plus structured JSON logs |
| Audit | the `audit_log` table (SIWE logins, order creation, bot submissions and reviews) |

## Runbooks

- **Market data stale or down.**
  - What users see: a banner in the UI, and paper fills refused (`stale_price`).
  - What happens automatically: the feed reconnects with backoff and repairs gaps from REST.
  - What to do: if the feed stays down for more than 5 minutes, check Coinbase status. You can temporarily run `MARKET_DATA_SOURCE=demo`, which labels everything as simulated.
- **AI provider outage.**
  - What users see: bots show a warning in the strip and the provider shows *degraded/down* in Settings; "Analyze now" returns a plain-language reason (busy, out of credit, key rejected).
  - What happens automatically: after 3 failures the circuit breaker backs off up to 10 minutes. No fake signals are ever produced.
  - Gateway key rejected or out of credit (`auth` / `quota` in `/api/ai/usage`): top up at PPQ, or run `pnpm setup:ai` with a new key and restart. Rotating the key is the same command; it replaces the old lines in `apps/server/.env`.
- **RPC outage.** Live quotes fail with `rpc_unavailable`. Paper trading is unaffected. Switch `RH_MAINNET_RPC_URL` to another provider.
- **Orders stuck in `submitted`.** The reconciler retries every 1.5 s. After 30 minutes with no receipt, the order is marked `failed` with `not_found`. Inspect the transaction on the explorer; no manual database edits are needed.
- **Emergency stop for live execution.** Set `LIVE_TRADING_ENABLED=false` and redeploy. Quotes remain informational and nothing can be submitted.

## Backups

Use managed Postgres snapshots (Railway volume backups, or the Supabase daily backups on paid tiers). For PGlite deployments, back up the `PGLITE_DIR` volume.

## Security posture

- **No custody.** No seed phrases or private keys are ever requested or stored, and the server never signs. Approvals are for the exact amount.
- **Sessions.** Opaque random session tokens are stored as a SHA-256 hash. Cookies are httpOnly, signed, `SameSite=Lax` and `Secure` in production. The session rotates on SIWE login.
- **Rate limits.** 600 requests/min per session or IP globally, with tighter limits on quotes (90/min), orders (40/min), SIWE (20–30/min) and bot submissions (10/hour).
- **Input.** Every input is validated with zod. Model output is untrusted: it is schema-validated, and links or markup are rejected. Community bot text rejects markup and links, and React escapes all rendering.
- **Community bots.** Bots are template configurations only: no code upload and no free-form prompts. They cannot access wallets or credentials, and they cannot place trades.
- **Secrets.** Secrets live server-side in environment variables only. Logs redact cookies, authorization headers and keys.
- **Dev routes.** Development routes (`ENABLE_DEV_ROUTES`) are refused at boot in production.
- **Admin.** Admin access is limited to allow-listed wallets (`ADMIN_WALLETS`), and every moderation decision is audit-logged.
