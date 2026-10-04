# Task 010 · Server: the /v1 foundation, feature flags and GET /v1/config

Read `AGENTS.md` first. Spec: `docs/eko/04-BACKEND.md` **§15.1** (conventions: routers in `apps/server/src/http/v1/`,
error shape, status mapping, list shape), **§21.4** (feature flags), **§2.2** (the `routes.ts` row: keep
`/api/health*`, `/api/metrics`, `/api/telemetry`; product routes move to `/v1`; legacy routes behind `LEGACY_API`),
**§2.4** (env vars: `FLAGS`, `DEMO_SECRET`, `LEGACY_API`, `LEGACY_SIGNALS`, `TIERS_ACTIVE_FROM`, `FEE_ACTIVE_FROM`,
`FEE_BPS_DEFAULT`, `LIVE_TRADING_ENABLED`, `TRADE_MAX_USD`, `BURN_WALLET_ADDRESS`, `RECEIPTS_REGISTRY_ADDRESS`,
`DEV_FEE_WALLET`), **§17** (`phase`), §23 **CA-9** (`PublicConfig`, demo tokens), FACTS §7. Import `PublicConfig`,
`PublicConfigSchema`, `ApiError`, `ErrorCode`, `FlagName`, `FLAG_STAGES`, `FlagsSchema`, `OpsSwitch` from `@eko/shared`; don't redefine them.

This is server-only work. Don't touch `apps/web`.

## Do

1. **Config.** Extend the SignalOS zod env loader (`apps/server/src/config.ts`) with the §2.4 variables listed above.
   Production refuses to boot without a required secret (`DEMO_SECRET` once demo tokens are used). Add placeholders
   to `.env.example` (no real values). `LEGACY_API` defaults to `true` for now (the web still calls `/api/*` for
   SIWE, quotes, orders and balances, see `docs/tasks/BACKLOG.md`); `LEGACY_SIGNALS` defaults to `false`.
2. **v1 skeleton.** `apps/server/src/http/v1/index.ts` registers one router per area under the `/v1` prefix. Shared
   helpers: `sendError(reply, code, message, extra?)` with the §15.1 status mapping for every `ErrorCode` (a table
   test covers all codes), a `{rows, cursor, delayedSec?}` list helper, zod parsing of params/query/body that
   answers `bad_request`. `GET /v1/health` → `{ ok: true }`.
3. **Feature flags** (§21.4). A `feature_flags(key, enabled, audience)` Drizzle table with a migration; a
   `FlagService` that merges the table with the `FLAGS` env override (e.g. `FLAGS=approvals,mission_kill` or
   `FLAGS=d0` for every D0 flag; unknown names fail at boot), cached 10 s, `isOn(flag)` and `all(): Record<FlagName,
   boolean>`. `OpsSwitch = 'trading_live' | 'swarm_ranking'` lives in the same table but is typed separately, never
   appears in `flags`, and can't be set by `FLAGS` or a demo session. A route helper `flagged(flag, handler)` makes a
   route behave exactly as if it were not registered (`404 not_found`, same body as an unknown route) while its flag
   is off, so it reacts to runtime changes within the cache window. `TODO(spec)` if you read "not registered"
   differently.
4. **`GET /v1/config`** → a `PublicConfig` that validates against `PublicConfigSchema` (assert it in tests):
   `phase` from the clock (`launch_week` before `FEE_ACTIVE_FROM`, `token_live` from it, `tiers` from
   `TIERS_ACTIVE_FROM`); `flags` from `FlagService`; `trading.liveEnabled` = `LIVE_TRADING_ENABLED` AND the
   `trading_live` ops switch; `wallets.burn` = `BURN_WALLET_ADDRESS`; `contracts.receiptsRegistry` =
   `RECEIPTS_REGISTRY_ADDRESS`. Values the spec leaves to later tasks (tiers, drops, burnBoard, loops, exampleScans,
   routers, spenders) come from one typed defaults module with `TODO(spec)` notes, not scattered literals. Nothing
   about the team (§2.2: no team fields). Cache-Control: `public, max-age=10`.
5. **Demo sessions** (CA-9): `GET /v1/demo/:token` verifies an HMAC-SHA256 token (`DEMO_SECRET`, 24 h, payload =
   the flags to turn on + expiry), sets a session marker so `GET /v1/config` reports those flags on for that session
   only, and nothing else changes: a demo session gets `403 forbidden` on any write (mark the guard so later write
   routes use it). Bad, expired or tampered tokens → `404 not_found`. Add a small `pnpm --filter @eko/server demo:token`
   script that prints a token for given flags (reads `DEMO_SECRET` from env).
6. **Legacy off switch.** Wrap the legacy SignalOS product routes in `registerRoutes` so they register only when
   `LEGACY_API` is true; `/api/health*`, `/api/metrics` and `/api/telemetry` always register. The SignalOS signals
   routes and the bots routes also need `LEGACY_SIGNALS` (they are removed for good in a later task, so keep this a
   thin guard). Tests for both switch positions.

## Money and claims (AGENTS rules 3–4)

- No fee or burn destination other than `BURN_WALLET_ADDRESS`. `DEV_FEE_WALLET` is shown in `wallets.dev` only; it
  must never be used as a fee or burn target, and a test asserts the config never puts it anywhere else.

## Don't

- Don't touch `apps/web`, `docs/eko/` or the SignalOS bots and analyst code beyond the guard in item 6. No new
  dependencies (Fastify, Drizzle, zod are already here). No WebSocket work (later task).

## Report

Files by item, the env vars added, `TODO(spec)` list, typecheck/test/brand:check results.
