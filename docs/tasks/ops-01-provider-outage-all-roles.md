# Ops 01 · Provider outage pauses every role, and refused calls are not usage

Read `AGENTS.md` first (rule 9 included). One engineer session. Files: `packages/chain/src/rpc/metered.ts`,
`packages/chain/src/rpc/outage.ts`, `packages/chain/src/rpc/clients.ts`, `apps/server/src/exec/chain.ts`,
`apps/server/src/read/receipt-reader.ts`, `apps/indexer/src/enrich.ts`, `apps/engines/src/receipts/cli.ts`, the
`rpc_usage` / `rpc_paid_daily` / `rpc_role_health` store, and `/v1/health/loops`.

## What happened (production, Oct 17–19)

The paid RPC balance ran out on Oct 17 at about 19:30Z and stayed out for about 50 hours.
- **Indexer and engines** paused correctly: they construct their meter with `pauseOnOutage: true` and probe with
  backoff.
- **api and worker** keep fail-fast semantics. Their meter, `apps/server/src/exec/chain.ts`, has no outage pause.
  They retried paid `eth_call` on every loop: about 450,000 a day (`rpc_paid_daily.non_indexer` = 449,917 on
  Oct 18 and 439,042 on Oct 19 before the top-up).
- **Accounting:** every attempt was reserved in the daily ledger before it was sent, so refused requests counted as
  usage. After the top-up the stack started the day with 441k "paid" calls already spent against a 500k soft limit.
- **Recovery:** the indexer then needed about 18 hours to catch up 1.75M blocks.

The owner pays for every real request and must be able to trust the ledger. An outage must cost nothing and must not
leave a poisoned budget behind.

## Do

1. **One stack-wide pause.**
   - When any role sees the provider refuse for balance or quota (`providerErrorClass`: 402, balance or credit
     messages, 429/quota), it records a shared pause in the database (extend `rpc_role_health` or add a small
     `rpc_provider_pause` row) with the reason, since and next retry.
   - Every meter in every role (api, worker, mcp, engines, indexer, receipts, enrich, CLIs that use the shared DB
     store) checks that pause before admitting a paid request. While paused, paid requests fail fast locally with
     `provider_balance_exceeded` / `provider_quota_exceeded`, without touching the network and without reserving
     usage.
   - Exactly one prober (lease-based, any role, prefer the indexer) retries with the existing backoff (10 s doubling
     to `RPC_OUTAGE_MAX_BACKOFF_SEC`) and clears the pause on success. Long-lived roles keep their current
     wait-and-resume behaviour; fail-fast callers get the local error immediately.
   - Public-lane reads that do not need paid stay available.
   - The pause read must be cheap: cache it in process for a few seconds, and refresh it on the first paid refusal.
2. **Refused calls are not usage.**
   - A request the provider refused for balance or quota, or that never left the process because of the pause, is
     not counted in `rpc_usage` paid rows or `rpc_paid_daily`. Record it separately (for example provider
     `paid_refused`), so the minute log shows `refusedToday` next to the real totals.
   - Reservation before sending stays, since it is what enforces the ceilings. On a refusal, release the reservation
     (decrement the same rows in the same store, idempotent per request) and add the refused count instead.
   - Ceilings (`RPC_PAID_DAILY_SOFT_LIMIT`, indexer reserve, hard limit) only see accepted requests.
3. **Visible, quiet and cheap.**
   - At most one `rpc_paused` log line per role per minute, with the refused count. No per-call error spam.
   - `/v1/health/loops` reports the pause (reason, since, next retry) so the owner sees "provider balance" and not a
     generic failure.
   - Worker loops that hit the local pause sleep until the pause's next retry instead of spinning.
4. **Tests** (offline, injected fetch or store):
   - a 402 in the worker's meter pauses every meter sharing the store;
   - paused requests make zero network calls and zero paid usage;
   - a refused request releases its reservation and is counted as refused;
   - one prober clears the pause and all roles resume;
   - quota (429) behaves the same with its own reason;
   - the ceiling math ignores refused calls;
   - the soft limit is not consumed by a simulated two-day outage;
   - existing indexer/engines pause tests still pass.

## Don't

- No new dependencies, no change to ceilings or budgets, no change to which methods are paid or public, no migration
  number below the current highest (take the next free engines/indexer number and say which).
- Never log URLs, keys or provider bodies. Rule 9 (no personal identifiers anywhere).

## Report

Files changed, the pause storage and lease design, how refused calls are recorded, the migration number, and the exact
gates run: `pnpm typecheck`, `pnpm --filter @eko/chain test`, `@eko/db`, `@eko/indexer`, `@eko/engines`,
`@eko/server`, and `pnpm test:checks`, with results.
