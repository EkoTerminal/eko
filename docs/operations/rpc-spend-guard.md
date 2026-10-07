# RPC spending guard (tasks 024 and 024b)

Implements the task packet's spending override to BACKEND §4.1, environment configuration (§2.4) and observability (§18). No `apps/engines` package is created in this branch.

Paid server/indexer/verification JSON-RPC attempts reserve persisted weighted units before sending; public counters are buffered. Failures and retries count; HTTP batch items count individually. Internal viem retries and request deduplication are disabled. A capacity-one token bucket per provider spaces calls instead of permitting a startup burst. Reservation failures stop reads without spending on fallback.

| Request | Primary | Fallback |
|---|---|---|
| Historical `eth_getLogs` through the backfill client (including verification scans) | Public | Paid while budget permits |
| Block headers, full blocks, receipts, head reads | Paid | Public for supported methods |
| Explicit numbered/hash state reads (`eth_call`, code, storage, balance, nonce), archive context | Paid | None |
| `debug_*`, `trace_*` | Paid | None |
| Other supported reads | Paid | Public |
| Unknown methods | Paid | None |
| Server testnet reads | Public testnet | None (never mainnet) |

Explicit block selectors are conservatively treated as archive reads: the public endpoint's state retention is short. `latest`/`pending`/`safe`/`finalized` selectors can fall back. Public support is allowlisted in `rpc/routes.ts`. A public rate-limit reply waits 60 seconds plus 0–999 ms jitter, then retries the same request; it never reaches a range splitter. Other public errors try paid once subject to admission. A closed paid provider gives `rpc_budget_exhausted` for archive/debug/unknown methods.

WebSocket subscription and unsubscribe requests are metered too. Every received push counts as one paid `eth_subscription` call, using its configured weight (default `1`), against both the daily and process session budgets. Delivery never waits for accounting or a rate token; already billed pushes are persisted even when a push crosses the remaining allowance. Accounting is flushed before the exit summary and database close. Hidden reconnects, replay and keepalive are disabled. Budget closure closes existing paid sockets; the indexer's existing HTTP head backstop continues through the public route. Shutdown closes sockets without sending an additional paid unsubscribe.

| Environment variable | Default |
|---|---|
| `RPC_HTTP_URL`, `RPC_WS_URL` | Unset; paid endpoints supplied only by env |
| `RPC_PUBLIC_HTTP_URL` | `https://rpc.mainnet.chain.robinhood.com` |
| `RPC_PAID_MAX_RPM` | `1200` |
| `RPC_PUBLIC_MAX_RPM` | `300` |
| `RPC_PAID_DAILY_BUDGET` | `200000` weighted units per UTC day |
| `RPC_SESSION_BUDGET` | Unlimited when unset; counts paid and public attempts |
| `RPC_WEIGHTS` | `{}`; unspecified methods cost `1`, configured weights must be positive finite numbers |
| `RPC_USAGE_DIR` | `.data/rpc-usage`, for standalone factory/CLI PGlite persistence |
| `RPC_TIMEOUT_MS` | `10000`; per HTTP request, reply body included; the meter adds a 5 s backstop for any transport |
| `DATABASE_URL` | Existing shared Postgres configuration |

The indexer and API reuse their database connection. Application factories require `{ db }` (the existing `ChainDb`), an injected store, or an existing meter; they never silently open a second database. Only standalone CLIs opt into `{ standalone: true }`, which uses `DATABASE_URL` or the dedicated `RPC_USAGE_DIR`. Meters backed by the same application database are reused, and closing a meter leaves its application-owned database open. Use the same Postgres database and budget configuration in every process: an atomic conditional upsert of the `(day, provider, __total__)` row leases paid units in chunks of 100 (or the remaining allowance). Cached admissions perform no SQL and open no transaction. Weighted requests larger than a lease reserve their necessary units. Method counters are buffered and flushed in one statement every three seconds, on usage reads, and on exit. Graceful exit releases unused units. Failed admissions never send. A crash leaves a conservative unused reservation bounded by one lease and may lose buffered method detail since the last flush; persisted reservations cannot be spent again after restart. Already-billed WebSocket pushes may cross the allowance and remain counted. Paid and public admission queues are independent; network enrichment runs outside indexer write transactions. PGlite supports the same SQL for a single process only; separate PGlite directories do not share a budget. Rate buckets and session limits are process-local.

Each process logs `rpc_usage` every 60 seconds, with rolling-minute and UTC-day method/provider totals, remaining paid budget and paid-open status. The API exposes these day totals in `/v1/health.rpc`. CLI shutdown prints the same summary, including SIGINT. At the session limit the process stops new admissions, signals shutdown and exits with status zero. SIGINT/SIGTERM report `indexer_stopped` with `reason: shutdown_requested`, including pending transport failures. An actual session limit reports `reason: rpc_session_budget_reached`; an archive-only budget refusal reports `reason: rpc_budget_exhausted`. Neither guard condition retries the block/header or backfill range, including errors wrapped by viem. A stopped backfill releases its lease as `todo`, preserving committed work and keeping failure counters unchanged. At 80% a process emits one `rpc_budget_warning` per UTC day; at closure it emits `rpc_budget_exhausted`. Indexer/default callers use the structured `alert` path; the server also routes these events through its existing error-reporting/Sentry path. There is no Telegram pager sender in this worktree.

The source check under `pnpm check:addresses` forbids raw server HTTP/WS transport imports outside the centralized wrapper. Browser wallet transports remain wallet-only; they do not create raw public clients.

## Engines merge handoff

`@eko/chain` exports `createMeteredClients(env, { db })` for applications with an existing `ChainDb`, and `createMeteredClients(env, { standalone: true })` for CLIs without one. It returns `paid`, `reads`, `archive`, `public` (historical logs routed public), `headWs`, `header(blockNumber)`, `pons` (a `PonsReadClient`) and `meter`. Calls with the same database reuse the application meter, and reporting starts automatically. An existing meter or usage store can also be injected. The engines CLI should use `header` for block headers and `pons` for the Pons adapter, handle guard refusals as unavailable, and call `meter.close()` in its existing shutdown/finally path. It must never convert unavailable reads to Clear.

```ts
import { createMeteredClients } from '@eko/chain';

const clients = createMeteredClients(process.env, { db }); // The engine loop already owns db.
// Pass clients.header and clients.pons to the engines readers.
// On SIGINT/session shutdown: stop the engine worker, then close in finally.
try {
  // Run the existing engine loop.
} finally {
  await clients.meter.close();
}
```

## Lead live checks

Set paid endpoint secrets and a shared `DATABASE_URL` in the deployment environment. Every check must carry a session budget. From the repository root:

```sh
RPC_SESSION_BUDGET=100 pnpm verify:chain
RPC_SESSION_BUDGET=100 pnpm --filter @eko/indexer start
RPC_SESSION_BUDGET=100 pnpm --filter @eko/indexer backfill -- --stream logs:pons_factory --from 77438503 --to 77438603
RPC_SESSION_BUDGET=100 pnpm --filter @eko/server start
# After merging the engines branch and switching its CLI to the factory:
RPC_SESSION_BUDGET=100 pnpm --filter @eko/engines start
```

Build the server before its `start` command. The default logs head needs no `RPC_WS_URL`; blocks mode may use it. Use a persistent single-process PGlite directory for standalone checks only when Postgres is unavailable. Verify the day counters and paid-open status with `GET /v1/health`; check the final `rpc_usage` line and process exit status. Validate public method availability and actual provider weights with the lead's live checks. A budget cutoff intentionally may leave a verification or backfill unfinished.

## Measured throughput and lead check

Robinhood Chain produces about 10 blocks per second (about 860,000 per day), measured Oct 2 over 1,000,000 blocks. The current head follower spends about 3.7 paid calls per block (block + receipts + Pons/price reads). Its former paid cap of 600 calls/min could not keep up with the head; task 025c raises the default to 1,200/min. The logs-first follower described below replaces this loop by default. WebSocket pushes also incur paid usage and are included by the 024b meter.

The lead's pre-024b live check used `RPC_SESSION_BUDGET=100` on the paid endpoint: the head follower stopped after 13 seconds, exited zero, left no process, and its usage rows persisted. This branch's follow-up checks use no network; the measured live result is the lead's report for the preceding implementation.

## TODO(spec)

- Define a verified freshness cutoff for explicit block selectors; pinned state conservatively requires paid archive until then.
- Populate the paid provider's compute-unit weights (`RPC_WEIGHTS`); defaults remain one per call.
- This worktree has structured alerts and server Sentry reporting but no `TEAM_ALERT_CHAT_ID` pager delivery implementation. The factory accepts an `alert` callback for that later integration.

No spec documents were edited. The only dependency declaration added is the existing `@eko/db` workspace package for standalone durable metering; no external dependencies were added. The lockfile includes that workspace link.

## Changed areas and local checks

- `packages/chain/src/rpc/{metered,routes,usage,clients,safe-error}.ts`: admission, routing, persistence, factory, redaction; exported from `src/index.ts`.
- `packages/db/src/{schema,client}.ts` and `drizzle/0110_rpc_usage.sql`: usage table and migration.
- `apps/indexer/src/{clients,cli,safe-error,guard-stop,head,backfill}.ts`: all reads/backfills/head subscriptions use the meter; shutdown summaries; migration/client tests updated.
- `apps/server/src/{app,config,index}.ts`, `db/client.ts`, `exec/chain.ts`, `http/v1/{health,index}.ts`: shared connection, config, execution clients, alerts, health and early shutdown handlers; health/fork tests updated.
- `packages/chain/src/verify{,-cli}.ts`: metered verification with public historical scans and sanitized reports.
- `scripts/check-addresses.mjs`, RPC tests, env examples, workspace link and lockfile: enforcement, offline coverage and configuration.

Current offline results are recorded below. The earlier Playbooks config/spec mismatch is resolved by the merged main branch. This task changes no dependency declarations or lockfile and requires no installation. The existing live contract fork check remains optional; no network or ports were used by this worker.

## Logs-first live follower (tasks 025, 025b and 025c)

`start` defaults to `LogHeadFollower`; `INDEX_HEAD_MODE=blocks` retains the per-block follower for comparison. The implementation follows BACKEND §4.2a, §4.2 reorgs, §4.4 actors and §21.1 notifications, with the task-025b parity and task-025c routing/retry overrides below. It uses `createMeteredClients(env, { db })`, creates no subscription, and adds no dependencies.

| Live request | Primary | Fallback |
|---|---|---|
| `eth_blockNumber`, OR-topic event/Transfer `eth_getLogs`, bounded concurrent receipts | Public when a token is available | Paid immediately when public is occupied or fails |
| Cursor header | Paid | Supported public fallback |
| Supplemental timestamp headers | Spare public capacity | Paid when public is occupied or fails |
| Exact sparse parent headers | Public, queued at its cap | None |
| Numbered code, price samples, static discovery/metadata | Paid archive | None |

A healthy tick issues one topic-only scan containing Transfer and the handled event signatures; tracked tokens are filtered locally. Size errors shrink the catch-up window. If a single block still exceeds the provider response limit, Transfers fall back to address chunks, with adaptive address/range splits. No address list is sent on the healthy path. Queued paid spills re-check for a replenished public token before dispatch, and only the provider actually used is charged. Failure fallback always tries the other eligible provider. Both queues retain capacity-one spacing: 200 ms public and 50 ms paid, with no startup burst. Live contexts switch immediately on provider rate-limit errors; historical backfill retains its existing wait/retry policy. Every attempt and every HTTP batch item is counted.

| Environment variable | Default | Purpose |
|---|---|---|
| `INDEX_HEAD_MODE` | `logs` | `blocks` selects the debug follower |
| `INDEX_HEAD_TICK_MS` | `1000` | Minimum start-to-start tick spacing |
| `INDEX_HEAD_MAX_RANGE` | `200` | Maximum fetch window; writes commit at most 200 stored blocks |
| `INDEX_CODE_CACHE_SEC` | `3600` | Per-target delegation code TTL |
| `INDEX_TRANSIENT_RETRY_SEC` | `300` | Per-request transient recovery window |
| `INDEX_STALL_SEC` | `300` | Behind an advancing head with no cursor progress this long: `indexer_stalled`, exit 1 |
| `INDEX_REORG_DEPTH` | `256` | Maximum rollback distance, including sparse gaps |
| `INDEX_START_BLOCK` | Current head on first start | Persisted cursors take precedence |
| `INDEX_PREFETCH_BLOCKS` | `32` | Per-block mode only |

`head` anchors the last stored block; `head_logs` records the scanned endpoint. Empty blocks need no row. Cursor mismatches, removed/conflicting logs and inconsistent receipts use bounded rollback, reset both cursors, and clear decoder caches. Parent hashes come from predecessor logs/stored rows or verified headers. Positive log timestamps are preserved; zero/missing timestamps use full receipt logs, then a verified header. Conflicting times fail the tick; times are never interpolated. This matters for the lead's public fixture, whose 1,497 raw logs all have `blockTimestamp: 0x0`, while receipt logs contain real timestamps.

Unknown v3 pool emitters use the same cached factory/currency/fee discovery as the per-block decoder and remain provisional (`creation_verified: false`) until a verified creation event is seen. Their currencies join the local Transfer filter in that tick. V4 ModifyLiquidity is selected by the PoolManager emitter, preserving events even for an unknown PoolId, as the old decoder does. Prepared pool/token state carries across a batch, preserving a pool created at N and traded at N+1. Up to 32 blocks share a write transaction and aggregate refresh; receipt/header enrichment finishes first. Idempotency and chain_block/swap/pair_created notifications remain intact.

### Transient transport recovery and measured public capacity

The lead measured the public RPC on Oct 2: all 300 receipt calls succeeded over 60 seconds at 5/s; at 12/s only 378/720 succeeded (about 5.7/s sustained), with non-JSON throttle replies and immediate recovery afterward. The public default is therefore 300 attempts/min, shared by all methods. Paid defaults to 1,200/min (20/s), providing catch-up margin; the shared paid daily budget remains 200,000 weighted units.

The indexer CLI enables bounded retries on its existing meter for every HTTP read, including archive enrichment. GOAWAY, connection resets, timeouts, 5xx, rate-limit replies and non-JSON parse failures retry the identical request. A supported other provider is tried immediately, subject to admission; repeated failures back off exponentially from 500 ms to 30 seconds with equal jitter (half to the full delay), bounded by INDEX_TRANSIENT_RETRY_SEC. Archive-only reads retry paid without public fallback. Retry logs contain method/provider/count/delay, never URLs or response bodies. Rate limits and every failed attempt remain metered. Cursor state advances only through existing successful transactions; retry recovery does not skip blocks.

Shutdown interrupts backoff. Session/daily guard refusals remain clean stops. On transient-window expiry the live head loop no longer exits: it logs `head_retry` (attempt, `backoff_ms`, sanitized reason) and retries the tick after a jittered delay doubling from 1 s to 60 s, including errors wrapped by viem or Multicall. Wrong chain, database, reorg-depth, usage-store and permanent provider errors still halt with `indexer_halted`. Permanent invalid-parameter/result-size errors retain immediate failure/adaptive splitting; 400/401/403 authentication/configuration errors receive no repeated recovery loop. Other applications do not opt into the indexer's retry policy automatically.

Every batched HTTP reply is checked against its requests before viem pairs them (`packages/chain/src/rpc/reply.ts`). viem's batch transport otherwise assumes one array entry per request: a single JSON-RPC error object for the whole batch, an HTTP 429/5xx with a JSON-RPC body, an empty body or a short array became the unclassified `Cannot read properties of undefined (reading 'error')` that halted production on Oct 6, and a short array could pair a result with the wrong request. Such replies are now transient `RpcReplyError`s (other HTTP 4xx stay permanent); entries pair by id. After three consecutive transient paid failures, public-capable reads queue on the public lane first for 60 s (doubling to 10 minutes while probes fail; `rpc_paid_degraded` / `rpc_paid_recovered`); pinned archive reads stay paid. Usage-store admissions time out after 30 s rather than holding a provider lane.

The live indexer runs a progress watchdog: behind an advancing head with no cursor progress for `INDEX_STALL_SEC`, or unable to read the head (worker and its own once-a-minute metered probe) for twice that, it logs `indexer_stalled` and exits 1 for a platform restart. It logs `indexer_lag` and reports `head_lag_ms` each minute; launch monitoring raises `IndexerHeadLag` and the `indexer_lag` check above ten minutes. The engines live loop exits the same way (`engines_stalled`) after `ENGINE_STALL_SEC` (600 s) without a completed poll or evaluation.

### Retained calls and timing

The head's `eth_call`s are now explicitly bounded enrichment: the shared 600-block ETH/USD archive sample (one slot0 call per period after the initial two-call reference-pool discovery), cached discovery of previously unseen v3 emitters (factory plus four pool facts for a valid pool), and batched metadata for previously unknown currencies. These preserve existing pools, token decimals/supply, USD and priced_block values. There are no per-block Pons profile/tax reads. Task 025b explicitly supersedes §4.2a's swap-only pricing to require the archive samples. Choosing the initial deepest standard-fee reference pool remains a TODO(spec).

Delegation code is read only for targets of selected receipt-bearing transactions, cached by normalized address for `INDEX_CODE_CACHE_SEC`. Observed SetCode receipts invalidate sender/target entries; failures are not cached, and rollback clears the cache. Third-party authorization changes absent from receipts remain a TODO(spec) for the full-block stream. Liquidity/exemption actors also require receipts beyond the packet's trade-only restriction; this parity requirement remains explicitly documented in code.

Every tick emits `head_tick` with blocks_covered, logs_kept, receipts_fetched, receipts_by_reason, tick_ms, rpc_wait_ms, rpc_wall_ms, meter_admission_ms, meter_rate_wait_ms and db_write_ms. Receipt reasons count unique successfully fetched blocks per category: pons_coin_trade (curve or pool), other_indexed_token, launch, liquidity, and other_event for remaining actor evidence. Reasons can overlap; the receipt total counts each block once. RPC/admission metrics sum request durations, so concurrent totals can exceed tick wall time. rpc_wall_ms measures orchestration waits; rate waits are already included in admission time and must not be added again.

### Historical 025c verification and spending estimate (superseded by 025d below)

The 41 lead-captured disagreement blocks are replayed through both followers using metered fake transports. Every chain table, balance and bar is compared, including timestamps, provisional pools, ModifyLiquidity, actors, USD and priced_block. Missing contract-state captures use the same deterministic mocked metadata/price responses for both paths; these are not live contract-read measurements.

The existing deterministic 2,000-block replay still compares every row. It has 900 trade blocks, 1,100 Transfer-only blocks, one repeated delegated target and ten 200-block ticks: 932 normal-timestamp calls (10 heads, 10 scans, 11 headers, 900 receipts, one code read); zero log timestamps require 1,100 additional headers, totaling 2,032. Pricing is disabled identically in this budget fixture and checked separately. The shared virtual clock exercises both new default caps; worker/CLI chain-ID checks add two paid startup calls outside tick replay.

A new moving-head benchmark starts 2,000 blocks behind a head advancing at 10/s, with 92% receipt-bearing blocks and zero public log timestamps. Each full tick covers 200 blocks, keeps 384 logs and fetches 184 receipts: 40 Pons coin trades, 140 other indexed-token trades, four liquidity blocks, zero launches/other events. It catches up to within ten blocks in **136.6 virtual seconds**, then keeps that bound for 30 one-second ticks. Every wire attempt is checked for at least 200 ms public / 50 ms paid spacing. Full-window rate waits total 8.10–8.15 seconds, while local fake-RPC ticks take roughly 0.2–0.3 seconds with 54–76 ms DB writes. These are synthetic timings with virtual sleeps and instant RPC, not live throughput; the lead reruns the comparison.

At 10 blocks/s and one tick/s, using the observed upper receipt share 185/200 (92.5%):

- Blocks/day = 10 × 86,400 = **864,000**.
- Receipts/day = 864,000 × 0.925 = **799,200**. Reason overlaps do not add calls.
- Head + log scan + cursor/day = 3 × 86,400 = **259,200**.
- Archive slot0/day = 864,000 / 600 = **1,440** after initial discovery.
- Base total/day = 799,200 + 259,200 + 1,440 = **1,059,840**.
- At full public utilization: 5 × 86,400 = **432,000 public/day**; remaining **627,840 paid/day** (7.27/s). If all five public slots went to receipts, paid receipts alone would be 9.25 − 5 = 4.25/s. Public head/log reads share those slots, so they must not be subtracted a second time.

That full-utilization model is a lower paid-cost estimate, not a guaranteed allocation. Immediate spill-over plus bursty ticks can leave public slots idle. The synthetic moving benchmark's 30 steady ticks used 89 public and 299 paid attempts: extrapolated **256,320 public/day** and **861,120 paid/day**, plus **1,440 paid samples/day** omitted from the benchmark. This short synthetic window includes timestamp headers; it is not a measurement of production provider utilization. In general, paid/day = total attempts/day − actual public attempts/day. The lead should compare that arithmetic to rpc_usage and head_tick in the live rerun.

Add initial reference discovery, new pool/token metadata, about 24 code reads/day per continuously active cached target, new targets/SetCode changes, retries and missing timestamp/parent headers. With zero timestamps on all non-receipt blocks at a 92.5% receipt share, timestamp headers alone can add 864,000 × 0.075 = **64,800/day**, before sparse parents. The unchanged 200,000-unit daily budget stops well before a full day at these densities; raising RPM does not bypass it. Set an explicit deployment budget using actual weights and live utilization.

No docs/eko files or dependencies were changed. Existing TODO(spec) items remain the initial reference fee tier, liquidity/exemption actor receipts beyond the trade-only packet, third-party SetCode authority changes absent from receipts, and shared RPC freshness/weights. Task 025c explicitly overrides §4.2a's paid receipt route; task 025b's archive sampling override remains in force.

Final local gates passed: `pnpm typecheck`, `pnpm test`, `pnpm brand:check`, `pnpm check:addresses` and `git diff --check`. The full test run includes 75 indexer tests and 112 chain tests, including deterministic replay, captured-fixture equality and transient recovery. Optional live fork checks were not enabled; this revision awaits the lead's live comparison.


## Task 025d: sender scope, demand enrichment and pipelined head

The Oct 2 lead run again matched every chain table, but processed 2,400 blocks in 300 seconds while the chain advanced about 9.5/s. The measured 300-second counts were paid: 1,880 receipts, 356 code reads, 280 contract calls and 176 headers; public: 471 receipts, 13 scans, 13 head reads and 43 headers. About 173–184 of each 200-block window's receipt reasons were other indexed tokens. This revision follows the new §4.2a Sender scope; the prior all-token spending estimate above is historical.

### Scope and enrichment

Both followers and the backfill streams now resolve senders only for Pons trades, launches, exemptions and liquidity on Pons pools. New launches and verified Pons-hook pool events activate that scope within the same window. Receipt selection counts blocks once, even when reasons overlap. Non-Pons swaps and liquidity have null trader/actor, tx_from and tx_to, with senders_pending=true, even if a Pons event causes that block's receipts to be fetched. Transfers retain their event parties and need no receipts or delegation checks. Code reads target only transactions containing selected sender evidence; the existing hourly address cache and observed SetCode invalidation remain.

Migration 0111_pending_senders, after 0110_rpc_usage, adds the pending flags and nullable sender fields. Price_quote is also nullable when a newly observed non-Pons currency has no decimals yet; raw amounts and available quote-side USD evidence are retained. Metadata is read live for Pons currencies and their counterpart currencies, plus the WETH/USDG pricing reference. Other creation events retain pool facts and token placeholders without contract reads. Third-party PoolCreated events retain creation_verified=false and join the same recent-pool backfill selection. Unknown non-Pons emitters retain their raw events and transfer-derived currency hints in pending_pool_events instead of disappearing. Hints select on-demand probes; actual RPC pool currencies must match the requested coin before materialization. Unlinked emitters remain deferred until currency evidence identifies them.

`enrichSenders(db, coin)` uses the shared metered application clients, public-first receipts, code and batched metadata, with paid fallback when public cannot serve pinned historical state. It processes at most 32 blocks per write, preserves EntryPoint context, validates receipt/log identities and block hashes, fills senders/prices, refreshes bars and clears pending markers atomically. Unknown pool events are canonically materialized and removed from the deferred table in that transaction. Pool probes are restricted to the requested coin's deferred witnesses. Existing rows and repeated calls remain idempotent. No cursor advances during enrichment. The application owns the shared meter's shutdown.

Run the CLI with `pnpm --filter @eko/indexer start -- enrich --coin <address>`. It uses the existing environment, migrations, session/daily budgets and transient retry policy. Engines return no sources/card when that coin has pending swaps, liquidity or linked deferred pool evidence; this applies to cached replay too.

### Public utilization, timestamps and writes

Live admission reserves nearby public slots (at most one second ahead, normally 400 ms) before spilling the rest across the two capped lanes. It accounts for queued admissions and rechecks public capacity before paid dispatch. A sustained test queues eligible reads alongside paid-only enrichment and requires successive public dispatches exactly 200 ms apart, with paid dispatches at least 50 ms apart. Actual dispatched attempts, including retries, are charged to their actual provider. Paid-only cursor validation and archive price samples retain their routes; default caps stay public 300 / paid 1,200 RPM and the shared daily budget stays 200,000 units.

Header reads serve cursor/reorg validation, exact missing timestamps, and missing immediate parent hashes for sparse stored blocks. They do not interpolate time. When public logs lack timestamps, one paid topic scan can supply all window timestamps; block hashes and timestamps must agree. If that provider also omits them, the unsuccessful probe occurs once per process and exact headers remain the fallback. A provider-size error also falls back to headers. This timestamp capability is exercised offline; the lead must confirm the paid endpoint's live response. It is essential to the low-cost estimate when the public endpoint reports zero timestamps.

The next full catch-up window's scan, discovery and receipt/header reads start before the current write finishes. Only full future windows are prefetched; near the head, a fresh scan avoids retaining a stale partial frontier. Commits remain ordered, with both cursors in the transaction after row writes. Shutdown/reorg/error drains speculative work without advancing its cursor. Token/pool state and stored hashes load in bulk; a window stages one transaction and multi-row table writes, including batched token/pool updates, rather than per-block writes and lookups. RPC work never runs inside the write transaction.

head_tick retains blocks/logs/receipt counts and timings, and adds headers_fetched, headers_by_reason (cursor, missing_timestamp, missing_parent), and timestamp_scans. Receipt reasons are now Pons-only: other_indexed_token stays zero; launch/liquidity reasons can overlap with trades; other_event includes exemptions. Concurrent timing totals and prefetched window durations can exceed the current tick's wall time, so admission/rate/RPC sums must not be added to tick_ms.

### Offline result and arithmetic

Strict 41-block replay compares every chain table, balances and bars, including timestamps and pending/deferred state. The existing 2,000-block replay still compares every row: 932 calls with usable timestamps, 2,033 when both log providers omit timestamps (the previous 2,032 plus one failed timestamp capability probe). Additional tests cover third-party creation facts, live/backfill pending equality, full sender equality after enrichment, repeated enrichment with no receipt calls, deferred-pool materialization, pipeline overlap/ordered stopping and the engines' card guard. Historical actor tests now identify their fixture coins as Pons; their actor, price, amount and idempotency assertions remain.

The moving-head synthetic range has 92% event-bearing blocks, with Pons receipts spread across 20% of blocks. Full ticks cover 200 blocks, keep 384 logs, fetch **40 receipts** (40 Pons trades; zero other-token/launch/liquidity receipts) and commit one batch. It catches a moving 2,000-block gap in **20.6 virtual seconds** with usable timestamps, and **140.85 seconds** when both log providers omit them; both stay within ten blocks for 30 steady one-second ticks. When only public omits timestamps and paid supplies them, catch-up is again **20.6 seconds**, using one paid timestamp scan per window. Representative fake-RPC tick walls were 0.16–0.35 seconds, DB writes 29–55 ms and RPC orchestration 48–323 ms; summed virtual rate waits were about 3.25–3.65 seconds per full timestamped tick and 16.2–16.35 seconds without timestamps. These virtual sleeps/instant transports are not live throughput measurements.

At 10 blocks/s and one tick/s, using the lead's 7–22% Pons-trade share and counting other Pons-only receipt blocks separately:

- Blocks/day = 10 × 86,400 = **864,000**.
- Pons trade receipts/day = 864,000 × 0.07–0.22 = **60,480–190,080**.
- Public head + topic scan/day = 2 × 86,400 = **172,800**.
- Base public demand/day = 172,800 + receipts = **233,280–362,880**, below the public capacity of 5 × 86,400 = **432,000**. The bucket is full only when work is queued; low demand does not need five calls/s.
- Paid cursor validation/day = **86,400**; archive samples/day = 864,000 / 600 = **1,440**. Base paid/day = **87,840** (1.017/s).
- If paid timestamp scans are needed every tick, add **86,400**, making **174,240 paid/day** (2.017/s) before scoped code, Pons discovery, retries and spill-over. These are at most one scan per window, never one call per non-Pons block.

The synthetic 30-tick steady sample with usable public timestamps used **119 public / 30 paid** calls: **342,720 public/day / 87,840 paid/day** after adding the omitted 1,440 archive samples. The paid-timestamp case adds 30 paid scans in those 30 ticks, projecting **342,720 public/day / 174,240 paid/day** including pricing. At the lead's $6 per million paid requests, those base paid figures are about **$0.53 / $1.05 per day**. Include scoped code: about 24 reads/day per continuously active target, plus new targets and SetCode invalidations. The old 356-code/2,351-receipt ratio is not a measured Pons-only ratio; the lead must measure that population and new Pons pool/metadata reads in the rerun. Launch/exemption/liquidity-only blocks add receipts only when not already counted as Pons trade blocks.

If neither log provider supplies timestamps, at a 20% receipt share the remaining 80% can require 864,000 × 0.8 = **691,200 timestamp headers/day**, before missing parents. Total base attempts become 172,800 receipts + 172,800 polls/scans + 86,400 cursors + 691,200 headers + 1,440 samples = **1,124,640/day**. Even full public utilization leaves **692,640 paid/day**. The corresponding short synthetic steady sample used 120 public / 266 paid attempts in 30 ticks, projecting **345,600 public / 767,520 paid/day** including samples. Thus the 1–2 paid/s cost target requires usable timestamps from at least one log provider; correct timestamps cannot be obtained for free when both omit them. The fallback still meets synthetic catch-up/throughput bounds. The daily guard continues to bound spend in every case.

No dependencies or docs/eko files were edited by this implementation; the lead's Sender scope spec update is preserved. Existing TODO(spec) items remain the reference pool fee tier, third-party SetCode authorizations absent from receipts, and shared RPC freshness/weights. Live comparison remains for the lead.

Final 025d gates passed on this implementation: `pnpm typecheck`, `pnpm test` (81 indexer / 113 chain / 66 engines tests), `pnpm brand:check` (15 files), `pnpm check:addresses` (251 source files), and `git diff --check`. Optional live-fork checks were not enabled. No live throughput claim is made for the synthetic measurements.


## Task 066: follower catch-up and paid reads

### Findings and implementation

Source inspection identified serial pool discovery, timestamp-provider probing before receipt loading,
and one-block-at-a-time code/price/metadata enrichment before the batch write. The existing range pipeline
already overlaps the next range's reads with the current application/write; it is retained. Task 066 overlaps
receipt loading, sparse parent recovery and timestamp capability probing, then prefetches enrichment in
bounded groups of at most 32 blocks. Preparation, collection and commits stay in block order. Launches,
pool creation/initialization and observed SetCode blocks are barriers so later reads see the earlier metadata
and delegation state. All sibling reads drain on failure before retry/invalidation; RPC remains outside writes.

The excess `eth_call` paths are not all price samples. A v3 probe previously used a serial `factory()` read
plus four contract calls; it now uses one pinned Multicall. A window's null-decimal currency placeholder
could shadow metadata learned by the decoder in earlier blocks, causing the same metadata batch to be read
again. Filled decoder hints now win over those placeholders. The regression indexes 40 pool trades with
one metadata read at the creation block and one price sample. The existing 600-block archive sample cache
remains: one slot0 call per sample period after initial reference discovery (two Multicalls). Concurrent
adjacent sample periods share initial discovery; sampling does not replace historical prices with head state.

Code reads remain scoped to Pons sender evidence and cached by normalized address for the configured TTL
(default one hour), including empty code. Expiry and observed SetCode now remove only that address's promise
rather than clearing unrelated in-flight reads. Concurrent blocks share their first read. SetCode barriers,
TTL refresh, failure eviction and rollback invalidation retain their previous meaning. New targets and observed
SetCode changes still cost reads; the live population must be measured before attributing all 76 calls to misses.

Startup no longer reads its anchor header twice. With usable log timestamps and a known immediate predecessor
hash, the only header is cursor validation (one per tick), plus reorg walk-back when necessary. There is a
concrete exception to the packet's request to remove every other header: logs have no `parentHash`, but
`chain_blocks.parent_hash` is non-null and the equality tests compare it exactly. Sparse predecessors cannot
be reconstructed from an unrelated log hash. Those required headers are now public-only, without paid
spill-over. Missing timestamps still use exact metered header fallback if neither log provider supplies them.
`TODO(spec)` records this representation conflict in `log-head.ts`; changing/dropping parent values would
violate the packet's no-data-change requirement. Public-only sparse recovery depends on public availability.

The delayed-RPC benchmark also exposed overdue meter slots after slow usage persistence. The next slot is
now based on dispatch readiness, preventing a following admission from bursting after a delayed reservation.
Tests cover 200 ms public / 50 ms paid spacing and unchanged per-attempt accounting. Caps, weights, session
and daily budgets are unchanged.

### Timing evidence and offline benchmark

`head_tick` adds `logs_ms`, `discovery_ms`, `timestamp_ms`, `receipts_ms`, `headers_ms`, `enrichment_ms`,
`prepare_ms`, `receipt_rpc_ms`, `receipt_max_ms`, `receipt_concurrency`, `enrichment_concurrency`,
`meter_public_rate_wait_ms` and `meter_paid_rate_wait_ms`. Receipt durations include admission and wire wait;
the sum can exceed wall time. Header/timestamp/receipt phases overlap. Pipeline work may originate in the
previous tick, so phase durations and global meter deltas are not additive to `tick_ms`.

The moving synthetic range starts 2,000 blocks behind a chain advancing at 10/s. It retains the 20% Pons
receipt population, 92% swap/liquidity population, default caps and 200-block windows. Each full window
fetches 40 receipts. It checks every dispatch against both cap spacings, and follows catch-up with 30 steady
ticks. The delayed variants include actual archive pricing through mocked contract responses.

| Provider timestamps | Injected receipt / other RPC / write latency | Catch-up | Public / paid catch-up attempts |
|---|---|---:|---:|
| Public supplies timestamps | 0 / 0 / 0 ms | 20.60 s | 104 / 373 |
| Only paid supplies timestamps | 0 / 0 / 0 ms | 20.60 s | 104 / 385 |
| Neither log provider supplies timestamps | 0 / 0 / 0 ms | 141.45 s | 708 / 2,758 |
| Public supplies timestamps | 350 / 100 / 3,700 ms | 55.10 s | 126 / 420 |
| Only paid supplies timestamps | 350 / 100 / 3,700 ms | 56.25 s | 131 / 430 |

Instant variants catch up to at most ten blocks behind. With the deliberately imposed 3.7-second write,
the bound is 60 blocks: the observed final steady gaps are 45 and 46 blocks. A scan cannot represent a
head that advances during its write. The delayed benchmark sustains that bound for 30 further ticks.
These are virtual-clock latency experiments with local PGlite, not live measurements. Real phase timings
measure local execution; virtual rate waits/injected I/O are reported separately. Full-window receipt and
enrichment concurrency reaches 32. Live confirmation remains the lead's comparison; no network or ports used.

The strict 41 captured blocks still compare every chain table, balances and bars (210 swaps). The deterministic
2,000-block equality replay uses 931 requests with log timestamps, or 2,032 when both log providers omit them;
the one-call reduction is the duplicate startup anchor. Missing timestamp fallback retains exact rows.

### Expected calls per day

At 10 blocks/s, one tick/s, usable public timestamps, no retries and the spec's 7–22% Pons trade-block share:

- 864,000 blocks/day; 60,480–190,080 trade receipts/day, plus distinct launch/exemption/liquidity-only blocks.
- 172,800 public head/log requests/day; public demand before sparse parents is 233,280–362,880/day.
- 86,400 paid cursor validations + 1,440 archive sample calls = **87,840 paid/day** before spill/enrichment.
- If public timestamps are absent but paid logs carry them, add 86,400 paid scans: **174,240 paid/day**.
- Add one public header per stored block whose predecessor hash is unavailable. Public capacity remains
  432,000/day; this extra demand can displace receipts into the paid lane. If both providers omit timestamps,
  exact timestamp headers can still spill paid; no interpolation or fabricated parent links is used.
- Code: approximately 24 paid reads/day per continuously active cached target, plus new addresses, observed
  SetCode invalidations, reorgs and failures. Pool probes: one Multicall per newly witnessed relevant emitter;
  token metadata: one batch per newly needed currency group, with retries when decimals remain unavailable.

The instant 20%-receipt benchmark's 30 steady ticks extrapolate to **342,720 public / 87,840 paid per day**
including the 1,440 price samples omitted from that instant fixture. Paid timestamp scans raise paid to
**174,240/day**. These are synthetic allocation examples; actual provider utilization varies.

During catch-up, the delayed experiment's measured 55.10-second 126-public/420-paid burst corresponds to
**197,575 public / 658,584 paid attempts per 24 hours at that temporary rate**. The paid-timestamp variant's
56.25-second 131-public/430-paid burst corresponds to **201,216 public / 660,480 paid/day**. Both include
archive pricing and initial discovery/code. Actual catch-up spends those hundreds of calls once, then returns
to head rates; the unchanged 200,000-unit daily guard prevents continuous spending at those extrapolated rates.
The absolute dispatch ceilings remain 432,000 public / 1,728,000 paid requests/day before daily/session limits.
Actual weighted usage, sparse parent frequency, new targets/coins and provider retries determine deployment cost.

Task 066 follows BACKEND §4.2a sender/reorg semantics and the existing task 025 archive-sampling/RPC guard
rules. No dependencies, lockfile or `docs/eko` files changed. The new ambiguity is exact sparse parent storage;
existing fee-tier, unseen third-party SetCode, provider-weight/freshness TODOs remain. Live comparison is deferred
to the lead as requested.


Final task 066 gates on the unchanged source candidate:

- `pnpm typecheck`: passed, exit 0.
- `VITEST_MAX_WORKERS=1 pnpm test`: passed, exit 0; 1,602 tests across all workspace packages,
  including 99 indexer, 115 chain, 67 engines and 86 server tests. Fixture and synthetic equality passed.
- `pnpm brand:check`: passed, exit 0 (15 served/configured files).
- `pnpm check:addresses`: passed, exit 0 (265 source files).
- `git diff --check`: passed, exit 0.

The initial unrestricted gate timed out five existing indexer tests at five seconds; all five passed in their
focused two-worker reproduction. A full two-worker gate passed every package except one existing server
migration test at 30 seconds; its focused one-worker reproduction passed in 24.91 seconds. The final complete
one-worker gate passed without changing test timeouts/assertions or application source. Use the worker setting
for this resource-constrained sandbox. No live/fork comparison was attempted and no commit or push was made.


## Task 066b: live crash and corrected catch-up model

### Root causes and fixes

The boundary crash is reproducible without a provider failure. `fetchWindow` carried the previous window's
last raw log hash when deciding whether a parent header was needed. `applyWindow` rebuilt that map from only
the current candidates and persisted rows. If the boundary block held only untracked logs, its hash was
neither rebuilt nor persisted: application dereferenced an absent header's `number`. Windows now carry
the same validated hash map into application. Regressions cross untracked, empty and final partial windows;
concurrent `tick()` callers share one operation. Missing cursor/reorg/recovery headers fail explicitly.
Unexpected ingest errors include at most eight redacted `stack_frames`: whitelisted function symbols and
relative source file:line locations, including wrapped causes. Absolute paths, arbitrary labels, request
URLs, query strings and stack values are discarded.

The earlier 55-second prediction is superseded by the dense model below. It understated log payloads,
provider latencies/tails and registry work, and charged no serial preparation cost. The supplied live ticks
show approximately 3 seconds of preparation plus 3.5 seconds of writes per 200 blocks. Receipt and header
recovery overlap, so their timings cannot be added. `headers_ms` spans the whole recovery join; new
`parent_headers_ms` and `timestamp_headers_ms` distinguish parent requests from timestamp fallback.
The supplied 9–16 seconds are consistent with scans, the slower recovery branch and ordered preparation/write
costs; admission and receipt RPC sums are concurrent waits, not additional tick wall time.

Code inspection found an additional unmeasured cost: `windowScope` checked every curve/pool against the
whole registry with repeated `.some()` scans and binary conversions. That quadratic work now uses sets
and one indexed initialization pass, with `window_scope_ms` instrumentation. Per-block prefetch, preparation,
pending state and committed metadata also copied the entire registry. One window index now supplies only
the block's emitters, curve tokens and pool currencies, while preserving WETH/USDG pricing context, creation
barriers, sender scope and ordered writes. The dense test checks that 2,000 background tokens/pools do not
expand prepared state beyond four tokens and one pool.

The corrected comparison favors retaining the default 200-block fetch range: a configured 1,000-block
range is slower under the same dense payload/tail model. Larger ranges amortize cursor checks but increase
scan and recovery latency and leave a more stale frontier near the head. Provider size errors still shrink
ranges. Transactions retain at most 200 stored blocks; intermediate scan cursors advance only through the committed prefix. Shutdown regression
checks that an uncommitted suffix remains available for replay. The default 200 and configured 1,000
ranges are both benchmarked. Existing full-table captured and synthetic equality tests remain, including a
new 1,000-block-fetch variant of the 2,000-block comparison. No balance/bar shortcut or row removal is used.

Exact sparse parents remain public-only: raw logs lack `parentHash`, whereas persisted chain rows require
the exact non-null value. Checking only window edges would change data for sparse internal predecessors.
This existing `TODO(spec)` representation conflict remains deferred; it does not justify fabricated parents.

### Topic accounting

The OR filter includes verified Pons `FeesSwept(uint256,uint256,uint256)` and `Initialized(address)` signatures,
which the current Pons decoder deliberately does not index. Valid events from known curves now count as
`unindexed_pons_event`; malformed encodings still count as `malformed`. Unknown v3 pool events retained for
on-demand discovery count as `deferred_pool`. Genuine unknown topics remain `unknown_topic`. No event filter
or stored rows were changed. `ingest_metrics.log_topics` adds up to 64 reason/selector buckets plus an overflow
bucket, alongside the existing reason totals and bounded samples. Tests cover these distinctions and the bound.
The aggregate 794 count does not establish which selectors occurred: the next live run's selector counts
(or the previous run's classification samples) are needed to attribute all 794.

### Corrected benchmark

The moving head starts 2,000 blocks ahead and advances at 10 blocks/s. Each 200-block full window has 180
nonempty blocks, 2,160 logs, 30 Pons receipt blocks and about 20 exact sparse-parent lookups. The registry
contains 2,000 background tokens and pools. Real metered transports enforce unchanged defaults of 300
public / 1,200 paid requests per minute, checking every dispatch's 200 / 50 ms spacing.

Injected public / paid base latency is 350 / 150 ms. Log payload latency adds 8 / 6 ms per scanned block
(1.95 / 1.35 seconds for 200 blocks). Public logs omit timestamps, requiring the paid timestamp scan.
One receipt block per 100 adds a 5.5-second public or 1.45-second paid tail. Ordered preparation retains
a conservative 15 ms per stored block and every commit costs 3.5 seconds, even for partial steady windows.
These are virtual-clock experiments with actual local decoding/PGlite writes; local execution times are
reported separately and are not confused with injected time. They test the supplied latency envelope, not
a promise about live providers. The benchmark follows catch-up with ten more steady ticks, enforces a
100-block frontier bound and verifies the exact retained Transfer count.

| Fetch range | Catch-up to ≤100 blocks behind | Caught-up cursor | Public / paid catch-up attempts | Ten steady ticks | Final steady gap |
|---|---:|---:|---:|---:|---:|
| 200 | 132.733 s | 3241 | 358 / 528 | 79.388 s | 74 blocks |
| 1000 | 268.627 s | 4594 | 502 / 689 | 80.107 s | 79 blocks |

The default-range test reaches its first full 200-block window at 12.9 simulated seconds; subsequent
full-window checkpoints at 19.6 and 26.3 seconds demonstrate 6.7-second overlapped ticks in this model.
The old 55.1-second sparse model is retained as a lower-load regression, not the forecast. The dense default
uses 886 catch-up attempts once, then returns to steady demand. Local serial preparation totals were
4.55 / 5.07 seconds across each entire catch-up plus steady run; injected preparation is retained separately
so faster local PGlite execution does not erase the lead's measured cost.

### Call expectations and live rerun

At 10 blocks/s and 15% Pons receipt blocks, expect 129,600 receipts/day, plus distinct launch, exemption and
liquidity-only blocks. A 10% sparse-predecessor share costs about 86,400 public parent headers/day. With one
tick/s and paid timestamp recovery, fixed demand before receipts/enrichment is 259,200 public calls/day
(head + scan + parents) and 174,240 paid calls/day (cursor + timestamp scan + 600-block price samples).
Actual partial-window write time reduces poll frequency; the corrected benchmark reports it rather than
assuming a one-second write. New sender targets, observed SetCode, TTL expiry, pool discovery and metadata
add the already documented reads. No caps, weights or daily/session budgets change.

- 200-block model: catch-up-rate extrapolation 233,033 public / 343,691 paid calls/day; steady-rate extrapolation 108,833 public / 156,719 paid calls/day. These are synthetic rates including measured routing and archive pricing, not an authorization to spend beyond the daily guard.
- 1000-block model: catch-up-rate extrapolation 161,461 public / 221,607 paid calls/day; steady-rate extrapolation 108,934 public / 156,391 paid calls/day. These are synthetic rates including measured routing and archive pricing, not an authorization to spend beyond the daily guard.

Live confirmation remains the lead's comparison with equal data. Retain `INDEX_HEAD_MAX_RANGE=200`, use
default caps, run from 2,000 behind for 300 seconds, and compare cursor lag, all chain/derived rows,
`window_scope_ms`, `prepare_ms`, `db_write_ms`, the independent recovery fields, and selector counts.
No network or ports were used here. No new dependencies, spec edits or personal identifiers were added.

### Verification

Final candidate follows BACKEND §4.2a (logs-first/sender scope), §4.2 (reorg rollback), §4.4 (actors) and
the existing RPC spend guard. `pnpm typecheck` passed. `VITEST_MAX_WORKERS=1 pnpm test` passed all 1,610 tests,
including 107 indexer, 115 chain, 67 engine and 86 server tests. No tests/assertions were skipped or weakened;
one worker avoids the previously observed concurrent PGlite resource contention. `pnpm brand:check` passed
(15 files), `pnpm check:addresses` passed (266 source files), and `git diff --check` passed. The focused
indexer/guard/classification run passed all 54 tests before the final comprehensive gate. Optional live-fork
checks were not enabled. Nothing was committed, pushed or live-verified.
