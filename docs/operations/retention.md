# Table retention

On 2026-10-06 the production database used 25.6 GB of its 100 GB volume and grew about 2 GB a day. This page decides,
table by table, how much history the product needs for the largest tables that are not core chain facts. Chain
facts (`token_transfers`, `swaps`, `balances`, `pons_events`) and the transfer roll-up are covered in
[chain-retention.md](chain-retention.md). Every retention setting is off unless configured; BACKEND §3.6 keeps
verdicts, matches, card versions, labels and receipts forever, and nothing below deletes any of them.

## Decisions

| Table (size) | What it is | Who reads it | History needed | Decision |
|---|---|---|---|---|
| `read_feed` (2.6 GB) | Feed projection: one row per verdict, monitor/danger playbook match, wash call, new pair and graduation. Written by triggers on `verdict_events` and `playbook_matches` (migration 0113) and by `refresh_read_models` (0114). | `GET /v1/feed`, `/v2/feed` (`apps/server/src/read/feed.ts`, newest first, 100 a page); live fan-out of a coin's current block (`read/live.ts`); watch alerts, which capture new rows every 250 ms (`alerts/service.ts`); the verdict trigger, which recomputes `read_first_verdict` from the coin's remaining verdict rows. The web Feed keeps a 500-row ring (FRONTEND §3.3). | The newest 500 rows per kind filter, seconds for alerts, and each coin's first verdict row. Sources are kept elsewhere. | **Retain.** `RETENTION_FEED_DAYS` deletes verdict, playbook and wash rows older than N days. Each coin's first verdict row stays, and so do `new_pair` and `graduation` rows (a few per coin, rewritten on every refresh). |
| `wallet_fingerprint_dependencies` (1.2 GB) | Block number and hash of every block a wallet fingerprint run read: up to about 200 swap blocks plus UserOp and reaction blocks, for each new swap block of each changed wallet (`apps/engines/src/watcher/store.ts`). | Only through `wallet_label_fingerprint_dependencies`: the canonical check for fingerprint labels (`registry-labels.ts`, `watcher/store.ts`). Rows of runs that produced no label are never read. | Dependencies of labelled runs, forever (labels are forever). | **Keep.** Append-only by trigger (0153) and part of each run's provenance. Proposal for the owner: write dependency rows only for runs that produce a label. That stops most of the growth without deleting anything. |
| `pending_pool_events` (1.1 GB) | Raw v3-style pool logs from emitters the indexer does not know, with currency hints (`apps/indexer/src/decode.ts`). | `indexer enrich --coin` (operator CLI) replays and deletes them once a pool is identified. The engines count deferred events of known pools to mark liquidity attribution incomplete (`apps/engines/src/sources.ts`). | Known-pool rows until enriched (never deleted). Unknown-pool rows only while an operator might still enrich the coin. | **Retain** (existing rule, 3 days). Fixed the starvation described below. |
| `engine_block_times` (1.0 GB) | Engine clock: a copy of every `chain_blocks` header, plus blocks known from swaps, transfers and liquidity, plus archive headers for launch, Pons and pool blocks (`apps/engines/src/activity.ts`). | Engines: the whole clock on every poll (`worker.ts`), outcome horizons (`outcomes.ts`), launch and card times. API: coin creation times and Feed timestamps (`read/store.ts`, `feed.ts`, `senses.ts`, `guard-store.ts`); sell checks. | Every launch, Pons and pool block, forever. Every other row is copied back from `chain_blocks` and the event tables on the next engine poll. | **Keep.** Deleting rows is undone within seconds, and deleted archive rows cost RPC reads to fetch again. Fixed: every poll rewrote all of its rows (see below). |
| `receipt_publications` (0.8 GB) | Outbox of signed verdict and forecast receipts (`packages/db/src/receipt-outbox.ts`). | Receipt API (`receipt-api.ts`), scoreboard (all verdict calls), swarm runner, engines. | Forever: public and verifiable. | **Keep.** |
| `guard_shadow_runs` (0.35 GB) | Guard 2.0 shadow journal, one row per shadow evaluation (`apps/engines/src/shadow-v2.ts`). Append-only by trigger (0119). | No code reader. It is the record of the Guard 2.0 shadow run behind the cutover gate (task 062, guard-2.0 §9.4). | At least until the Guard 2.0 cutover decision. | **Keep.** The owner can revisit this after the cutover. |
| `read_buyers` (0.24 GB) | Distinct (coin, buyer) pairs from swaps, rebuilt for a coin on each read-model refresh (0114). | `refresh_read_models` and the card-change trigger count it into `read_coins.buyers` (Radar's buyers). | All pairs: the count covers a coin's whole life. | **Keep.** Grows with swaps. |
| `coin_cards` (0.23 GB) | Hashed card versions; a new row only when a card's hash changes (`apps/engines/src/worker.ts`). | Engines (previous card for change detection), live card push (`read/live.ts`), restore checks. | Forever: card versions (§3.6). | **Keep.** |

## Settings (worker)

| Setting | Recommended production value | Effect |
|---|---|---|
| `RETENTION_QUOTE_TRANSFER_DAYS` | 2 (unchanged) | Roll up WETH and USDG transfers ([chain-retention.md](chain-retention.md)). |
| `RETENTION_IDLE_TOKEN_DAYS` | 14 (unchanged) | Roll up tokens idle for 14 days. |
| `RETENTION_PENDING_POOL_DAYS` | 3 (unchanged) | Delete raw events of pools still unknown after three days. |
| `RETENTION_FEED_DAYS` | **3** (new) | Delete Feed verdict, playbook and wash rows older than three days. One day would already cover the 500-row ring; three days leave room for rare kinds and API paging. |

All four are part of the attested configuration (`identityConfigKeys`). The worker runs a pass every ten minutes.
Each enabled rule now has its own budget of about a minute, so a pass takes at most about four minutes. Feed deletes
run in batches of at most 5,000 rows (`FEED_BATCH_ROWS`), because each batch briefly waits on the API's read-model
refresh lock. Code: `packages/db/src/retention.ts`. Tests: `packages/db/test/retention.test.ts`,
`apps/server/test/retention-worker.test.ts`.

## Why `pending_pool_events` kept growing

- **Inflow.** The table grew by at least 0.3 GB in a day, from 0.8 to 1.1 GB. With a three-day window it should level
  off at about three days of inflow, roughly 1 GB.
- **The pending rule could get no time.** `runRetention` gave a whole pass one shared 60-second budget and ran the
  rules in order: quote transfers, then idle tokens, then pending pool events. Each quote batch picked
  `token = ANY(quote tokens) ... ORDER BY block LIMIT n`. No index returns that order, so every batch read and sorted
  all eligible quote transfers (EXPLAIN on PGlite shows a sequential scan with a top-N sort; ordering by
  `(token, block)` instead gives a merge of index scans over `token_transfers(token, block)`). On the 6.5 GB
  partition, a quote backlog could use up the minute: the pass then ended `finished:false` before the pending rule
  started, and `pendingRows` stayed 0. The job itself ran: staging recorded its first pass on 2026-10-05. This cause
  comes from the code; it has not been checked against production logs yet. To check it, look for `"finished":false`
  with `"pendingRows":0` in the worker's `Chain retention pass` lines.
- **Fix.** Each rule now has its own budget, and transfer batches are ordered by `(token, block)`, so each batch
  reads about as many rows as it moves. The order only changes which old transfers go first; baselines are per
  token and holder, so balances stay exact. A regression test shows a quote backlog no longer starves the pending rule.
- **Index use.** The pending prune has no index on `block`. It is a sequential scan that stops after `limit`
  eligible rows. In steady state it reads the roughly 1 GB table about once per pass, which is acceptable within its
  own budget. An index on `pending_pool_events(block)` would make it proportional to the rows it deletes; that
  optional migration needs a reserved migration number.

## Other growth fixed here

- **`engine_block_times` rewrite.** `refreshClock` runs on every engine poll: back to back while there is work,
  otherwise every two seconds. It upserted all of `chain_blocks` with `ON CONFLICT DO UPDATE`, which writes a new row
  version even when nothing changed. Every poll therefore left a dead copy of every clock row: bloat, WAL and vacuum
  load. It now updates only rows whose time, hash or source changed (`apps/engines/test/block-clock.test.ts`).

## Expected effect

These are estimates, assuming the listed derived tables built up over about four to five days. `read_feed` (about
0.5–0.7 GB a day) and `pending_pool_events` (about 0.3 GB a day) stop growing once each holds its window, and the
clock rewrite no longer adds bloat to `engine_block_times`. With batches that follow the index, the transfer roll-up
should keep pace with quote-token inflow. Remaining growth comes from swaps, Pons events, transfers of active coins,
`wallet_fingerprint_dependencies`, receipts, the Guard journal, cards and buyers. Expected total: roughly 0.7–1.0 GB a day instead of 2 GB. Check this with a table-size snapshot 48 hours
after deploying with `RETENTION_FEED_DAYS=3`.

Postgres reuses the space freed by these deletes, but the table files do not shrink. Returning disk space to the
volume needs `pg_repack` or `VACUUM FULL` (which takes an exclusive lock) in a maintenance window. That is an owner
decision, and stopping growth does not depend on it.

## Open items for the owner

- `wallet_fingerprint_dependencies`: approve writing dependency rows only for labelled runs. This is now the largest
  derived source of growth. Each new swap by an active wallet adds up to about 200 rows.
- `read_feed` and `read_buyers` churn: `refresh_read_models` rewrites every Feed row of a coin (`UPDATE ... SET
  symbol, first_block` with no change check) and deletes and reinserts all of its buyers on every refresh. That
  creates dead rows on each trade. A guarded update would fix it, but it needs a migration with a reserved number.
- `guard_shadow_runs`: decide its retention after the Guard 2.0 cutover.
