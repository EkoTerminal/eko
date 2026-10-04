# Task 024 · RPC spending guard: metering, caps and routing for every chain client

Read `AGENTS.md` first (rule 9 included). On Oct 1 a forgotten head follower used up the owner's paid RPC balance in
about three hours. No process may be able to do that again. Every chain client in the repo goes through one metered
transport with hard caps, and heavy historical scans go to the free public RPC. Spec: `docs/eko/04-BACKEND.md` §4.1
(transports), §2.4 (env), §18 (observability and alerts). The paid provider's balance is the owner's money: when in
doubt, stop and alert instead of spending.

## Do

1. **`@eko/chain` metered transport** (`rpc/metered.ts`): a viem custom transport wrapping `http` and `webSocket` that
   counts every JSON-RPC call (each item of a batch counts) by provider and method, with a configurable weight per
   method (`RPC_WEIGHTS` as JSON; default 1 per call; `TODO(spec)`: the paid provider's per-method compute-unit table,
   which the owner fills in). Two providers: `paid` (`RPC_HTTP_URL`, `RPC_WS_URL`) and `public`
   (`RPC_PUBLIC_HTTP_URL`, default `https://rpc.mainnet.chain.robinhood.com`). Never log a URL, key or request body;
   use `safeError` style redaction everywhere.
2. **Caps** (env, all optional; the defaults are conservative):
   - `RPC_PAID_MAX_RPM` (default 600) and `RPC_PUBLIC_MAX_RPM` (default 120): a token bucket per provider; callers wait
     instead of bursting.
   - `RPC_PAID_DAILY_BUDGET` (weighted units per UTC day, default 200,000) persisted in a small `rpc_usage` table
     (`day`, `provider`, `method`, `calls`, `units`) so restarts and several processes share it (Postgres: atomic
     upsert; PGlite: same, single process).
   - `RPC_SESSION_BUDGET` (weighted units for this process's lifetime, default unlimited): when reached, the process
     logs `rpc_session_budget_reached` and exits cleanly. The lead uses it for every live test.
   - At 80% of the daily budget, log `rpc_budget_warning` once. At 100%, the paid provider is closed for the day:
     methods the public RPC supports move there (with its own cap); archive-only and `debug_*` calls fail fast with
     `rpc_budget_exhausted` (the engines mark those reads unavailable, never Clear). Alert through the existing alert
     path (§18).
3. **Routing rules** in one table (`rpc/routes.ts`), used by every client:
   - historical `eth_getLogs` scans (backfill streams) → public;
   - head follower (`eth_getBlockByNumber`, `eth_getBlockReceipts`, `newHeads`), archive state reads
     (`eth_call` / `eth_getCode` / `eth_getStorageAt` with an old `blockNumber`), `debug_traceCall` → paid;
   - everything else → paid with public as fallback.
   The public RPC's "Rate Limit Hit, limit will reset in 60 seconds" waits 60 s plus jitter and retries the same
   request (no range failure, no halving the log window for it); other public errors fall back to paid only when the
   budget allows.
4. **Wire it in:** `apps/indexer` (`clients.ts`: head, reads, archive, backfill), `apps/engines` (`cli.ts`: block
   headers and Pons reads), `apps/server/src/exec/chain.ts`, `packages/chain/src/verify-cli.ts`. No other
   `createPublicClient` with a raw `http(...)` may remain (add a check to `pnpm check:addresses` or a small lint
   script that fails CI on one).
5. **Visibility:** every 60 s each process logs `rpc_usage` (calls and units by provider and method for the last
   minute and today, budget left). `GET /v1/health` on the API adds today's totals and whether the paid provider is
   open. The CLI tools print a usage summary on exit (including SIGINT).
6. **Tests** (no network; a fake transport): batch items each count; weights apply; the token bucket spaces calls; the
   daily budget closes the paid provider and moves eligible methods to public; archive and `debug_*` fail fast when
   closed; the session budget exits; the 60 s rate-limit reply waits and retries; usage persists across a restart;
   no URL or key appears in any log line or error (feed one with a key in the query string and assert it's redacted).

## Don't

- No new dependencies. Don't edit `docs/eko/`. Rule 9. Don't put any endpoint URL other than the public RPC in code,
  tests or docs; paid endpoints come only from env.

## Report

Files, the routing table, the env vars with defaults, how the budget is shared across processes, `TODO(spec)` list,
typecheck/test/brand:check/check:addresses results, and the commands the lead uses to run a live test with a session
budget.
