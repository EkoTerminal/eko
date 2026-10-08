# Table retention

On 2026-10-06 the production database used 25.6 GB of its 100 GB volume and grew about 2 GB a day. This page decides,
table by table, how much history the product needs for the largest tables that are not core chain facts. Chain
facts (`token_transfers`, `swaps`, `balances`, `pons_events`) and the transfer roll-up are covered in
[chain-retention.md](chain-retention.md); the per-coin rules that drop the raw history of dead and Danger coins are
[below](#per-coin-history-of-quiet-coins). Every retention setting is off unless configured; BACKEND §3.6 keeps
verdicts, matches, card versions, labels and receipts forever, and nothing below deletes any of them.

## Decisions

| Table (size) | What it is | Who reads it | History needed | Decision |
|---|---|---|---|---|
| `read_feed` (2.6 GB) | Feed projection: one row per verdict, monitor/danger playbook match, wash call, new pair and graduation. Written by triggers on `verdict_events` and `playbook_matches` (migration 0113) and by `refresh_read_models` (0114). | `GET /v1/feed`, `/v2/feed` (`apps/server/src/read/feed.ts`, newest first, 100 a page); live fan-out of a coin's current block (`read/live.ts`); watch alerts, which capture new rows every 250 ms (`alerts/service.ts`); the verdict trigger, which recomputes `read_first_verdict` from the coin's remaining verdict rows. The web Feed keeps a 500-row ring (FRONTEND §3.3). | The newest 500 rows per kind filter, seconds for alerts, and each coin's first verdict row. Sources are kept elsewhere. | **Retain.** `RETENTION_FEED_DAYS` deletes verdict, playbook and wash rows older than N days. Each coin's first verdict row stays, and so do `new_pair` and `graduation` rows (a few per coin, re-derived by every refresh of their coin). |
| `wallet_fingerprint_dependencies` (1.2 GB) | Block number and hash of every block a wallet fingerprint run read: up to about 200 swap blocks plus UserOp and reaction blocks, for each new swap block of each changed wallet (`apps/engines/src/watcher/store.ts`). | Only through `wallet_label_fingerprint_dependencies`: the canonical check for fingerprint labels (`registry-labels.ts`, `watcher/store.ts`). Rows of runs that produced no label are never read. | Dependencies of labelled runs, forever (labels are forever). | **Keep.** Append-only by trigger (0153) and part of each run's provenance. Proposal for the owner: write dependency rows only for runs that produce a label. That stops most of the growth without deleting anything. |
| `pending_pool_events` (1.1 GB) | Raw v3-style pool logs from emitters the indexer does not know, with currency hints (`apps/indexer/src/decode.ts`). | `indexer enrich --coin` (operator CLI) replays and deletes them once a pool is identified. The engines count deferred events of known pools to mark liquidity attribution incomplete (`apps/engines/src/sources.ts`). | Known-pool rows until enriched (never deleted). Unknown-pool rows only while an operator might still enrich the coin. | **Retain** (existing rule, 3 days). Fixed the starvation described below. |
| `engine_block_times` (1.0 GB) | Engine clock: a copy of every `chain_blocks` header, plus blocks known from swaps, transfers and liquidity, plus archive headers for launch, Pons and pool blocks (`apps/engines/src/activity.ts`). | Engines: the whole clock on every poll (`worker.ts`), outcome horizons (`outcomes.ts`), launch and card times. API: coin creation times and Feed timestamps (`read/store.ts`, `feed.ts`, `senses.ts`, `guard-store.ts`); sell checks. | Every launch, Pons and pool block, forever. Every other row is copied back from `chain_blocks` and the event tables on the next engine poll. | **Keep.** Deleting rows is undone within seconds, and deleted archive rows cost RPC reads to fetch again. Fixed: every poll rewrote all of its rows (see below). |
| `receipt_publications` (0.8 GB) | Outbox of signed verdict and forecast receipts (`packages/db/src/receipt-outbox.ts`). | Receipt API (`receipt-api.ts`), scoreboard (all verdict calls), swarm runner, engines. | Forever: public and verifiable. | **Keep.** |
| `guard_shadow_runs` (0.35 GB) | Guard 2.0 shadow journal, one row per shadow evaluation (`apps/engines/src/shadow-v2.ts`). Append-only by trigger (0119). | No code reader. It is the record of the Guard 2.0 shadow run behind the cutover gate (task 062, guard-2.0 §9.4). | At least until the Guard 2.0 cutover decision. | **Keep.** The owner can revisit this after the cutover. |
| `read_buyers` (0.24 GB) | Distinct (coin, buyer) pairs from swaps, brought up to date for a coin on each read-model refresh: new pairs are inserted, vanished ones deleted (0185). | `refresh_read_models` and the card-change trigger count it into `read_coins.buyers` (Radar's buyers). | All pairs: the count covers a coin's whole life. | **Keep.** Grows with swaps. |
| `coin_cards` (0.23 GB) | Hashed card versions; a new row only when a card's hash changes (`apps/engines/src/worker.ts`). | Engines (previous card for change detection), live card push (`read/live.ts`), restore checks. | Forever: card versions (§3.6). | **Keep.** |

## Settings (worker)

| Setting | Recommended production value | Effect |
|---|---|---|
| `RETENTION_QUOTE_TRANSFER_DAYS` | 2 (unchanged) | Roll up WETH and USDG transfers ([chain-retention.md](chain-retention.md)). |
| `RETENTION_IDLE_TOKEN_DAYS` | 14 (unchanged) | Roll up tokens idle for 14 days. |
| `RETENTION_PENDING_POOL_DAYS` | 3 (unchanged) | Delete raw events of pools still unknown after three days. |
| `RETENTION_FEED_DAYS` | **3** (new) | Delete Feed verdict, playbook and wash rows older than three days. One day would already cover the 500-row ring; three days leave room for rare kinds and API paging. |
| `RETENTION_DANGER_QUIET_DAYS` | **2** (new, off until set) | Drop the raw history of coins whose current verdict is Danger after two days without a swap or transfer ([below](#per-coin-history-of-quiet-coins)). |
| `RETENTION_QUIET_COIN_DAYS` | **8** (new, off until set) | The same for every non-quote coin after eight quiet days. Must exceed the engines' seven-day idle window: config and `runRetention` refuse 7 or less, as for the idle-token rule. |

All six are part of the attested configuration (`identityConfigKeys`). The worker runs a pass every ten minutes.
Each enabled rule now has its own budget of about a minute, so a pass takes at most about six minutes. Feed deletes
run in batches of at most 5,000 rows (`FEED_BATCH_ROWS`), because each batch briefly waits on the API's read-model
refresh lock. Code: `packages/db/src/retention.ts`. Tests: `packages/db/test/retention.test.ts`,
`packages/db/test/retention-history.test.ts`, `apps/engines/test/history-prunes.test.ts`,
`apps/server/test/read-model-churn.test.ts`, `apps/server/test/retention-worker.test.ts`.

## Per-coin history of quiet coins

Memecoins die fast: of 19,636 coins on 2026-10-07, only 5,749 traded in the last day. Once a dead or Danger coin has
its card, verdict and outcomes, almost nothing reads its raw history, so two rules (each off unless configured,
`pruneQuietCoins` in `retention.ts`) keep a summary and drop the raw rows.

**Which coins.** Not a registry quote token; for `RETENTION_DANGER_QUIET_DAYS`, a current Danger card
(`coin_card_latest`); no swap and no transfer for the configured number of days; no swap, liquidity event or
unknown-pool event still waiting for enrichment; and every outcome horizon decided. A horizon (1h, 24h, 7d after
launch) is decided when it is labeled, or when it has passed and the coin had no swap at or before its end block: the
outcome engine skips such a horizon with or without the pruned rows (`outcomes.ts` needs at least one swap). So
outcome labels are never cut short, and the Danger rule reaches a coin only once its 7-day outcome is decided.

**What goes, at the rule's horizon** (the newest block older than the window): transfers are compacted into
`transfer_baselines` with `compactTransfers`, so balances and holder views stay exact; liquidity events of the coin's
pools against a quote asset are deleted, except liquidity removals by the coin's deployer; Pons events are deleted.
**Swaps go later**: only once the coin has also had no swap for 28 days (`SWAP_EVIDENCE_DAYS`), whatever the rule, and
only after the trending lists that read them are saved. Swaps are deleted in whole minutes.

**What stays**: tokens, pools, exemptions, balances, baselines, minute bars, cards and card versions, verdicts,
playbook matches, Feed rows, outcomes, deployer statistics, receipts, flow markers, labels and every other derived
table. Each pruned coin gets one `history_prunes` row (migration 0185): rule, watermark blocks, removed-row counts,
first and last trade time, and an upper bound on the distinct buyers of the deleted swaps. It is written in the same
transaction as each deletion batch, so no reader sees missing rows without it.

### Per-table decisions

| Table (size) | Rows of a pruned coin | Why that is safe |
|---|---|---|
| `token_transfers` (11 GB, 20.3M rows) | Compacted at the rule's horizon. | Balances, engine holder views and holder history at or after the baseline block stay exact ([chain-retention.md](chain-retention.md)). |
| `swaps` (3.2 GB, 5.3M rows) | Deleted after 28 quiet days, Danger coins included. | Wallet fingerprints read each wallet's swaps of the 14 days before every swap block they refresh (28 days back in all) and the buy order of the coins it bought then; the Census reads 7 days. Deleting younger swaps would change labels and the Census for wallets and coins that are still active. |
| `liquidity_events` (0.5 GB) | Deleted at the horizon, except removals (`Burn`, `ModifyLiquidity`) by the coin's deployer and events of pools between two non-quote coins. | The prior-removal check of the deployer's later launches reads its removals. A two-coin pool's events belong to the other coin too. |
| `pons_events` (0.6 GB) | Deleted at the horizon. | Only the coin's own curve progress reads them (and the engine clock, whose rows already exist); a revived coin shows its curve progress as unavailable. |
| `bars_1m`, `balances`, `transfer_baselines` | Kept. | Charts and holdings. A bar whose minute has no swap left is never rebuilt (`market.ts`). |
| `history_prunes`, `trending_snapshots` (new, 0185) | One row per pruned coin; one trending list per launch block up to an hour past the swap horizon. | Summaries for the readers below. |

### Per-reader decisions

| Reader | Needs | Handling |
|---|---|---|
| Engines card evaluation (`sources.ts`, `worker.ts`) | The coin's whole raw history. | **Changed.** A pruned coin is not evaluated again until it has a swap or transfer after its watermark: live scheduling skips it (also inside the 7-day idle window, where Danger coins are), on-demand scans answer with its kept card, and `loadSources` refuses checkpoints at or before the watermark or without new activity (`history_pruned`). Once revived, it is evaluated from balances and baselines plus the new activity. Checks that need deleted rows are reported as not fully checked with reason `history_pruned`: liquidity ownership (liquidity events), deployer sells, bundles, fresh wallets and exempt insiders (swaps), and insider sells when graduation is before the watermark. Their sections are dropped, so they never pass, and the verdict cannot be Clear. Holder concentration, wash trading and the other trailing-hour checks are measured as before. |
| Outcome labels (`outcomes.ts`, horizons 1h, 24h, 7d) | Swaps and liquidity up to each horizon, opening holdings. | Only coins with every horizon decided are pruned (above). `outcome_label_*` jobs carry their inputs and only check block hashes. |
| Deployer history (`deployer_stats`, prior removals) | Matches and outcomes; the deployer's liquidity removals. | Kept. |
| clone_swarm trending (`sources.ts`) | Other coins' swaps in the hour before a launch, at every later evaluation of that coin. | **Changed.** Before any swap below the swap horizon is deleted, the list of every launch whose window reaches it is saved in `trending_snapshots`; `trendingAt` (`packages/db/src/trending.ts`) reads it instead of recomputing. Same rows (tested). |
| Live ranks, sell-check route volume, sub-minute candles, Census | The last hour, day, 6 hours, 7 days. | Unaffected: pruned swaps are older. |
| Wallet fingerprints (`watcher/store.ts`) | A wallet's swaps of 14 days, refreshed up to 14 days back; the buy order of coins it bought then. | Unaffected while swaps stay 28 days. **Changed** for a revived coin whose swaps were deleted: a new buyer's rank adds the deleted buyers, an upper bound like the existing one for unresolved buys, so it is never promoted into the first 50. |
| Watcher flows and chart markers (`flow-store.ts`, swap trigger) | Swaps in its windows (24 hours). | **Changed.** The swap delete trigger would mark the coin's flow dirty from the deleted swaps' time, and the next refresh would delete the coin's chart markers since then. Each batch puts the coin's dirty mark back as it was. |
| Bars rebuild (`market.ts`: reorg `deleteAbove`, graduation rebuild, `indexer bars`) | A minute's swaps. | **Changed.** A bar whose minute has no swap left is kept, never rebuilt from nothing; reorgs delete their own bars first. Swaps go in whole minutes, so no minute is ever partly pruned. |
| Read models (`refresh_read_models`, `refresh_read_coin`, 0185) | Buyers and last trade from swaps. | **Changed.** A coin whose swaps were deleted keeps its buyers (new ones are added), and its last trade comes from `history_prunes`; Radar and Pairs show the same buyers and activity. |
| Coin candles API (`read/coins.ts`) | First and last trade. | **Changed.** Falls back to the trade times in `history_prunes`. Minute bars are kept. |
| Guard v2 shadow and Guard reads | Captured Guard evidence; `read_coins` activity. | Unaffected. `captureLaunchRolesV2` (Pons events and swaps) has no production caller; a capture after pruning would see partial history. |
| Scoreboard, receipts, Feed, alerts | Their own tables. | Unaffected. |
| Replay and backfill (`ENGINE_MODE=replay`, `indexer backfill` and `enrich`, the backfill gate) | Raw history of the range. | Replays skip pruned coins' gaps (`history_pruned`), and other coins' trending reads the snapshots. Ranks, fingerprints and gate counts over pruned ranges are not reproducible, as with transfer compaction. Pruned coins have nothing waiting for enrichment. Do not backfill ranges older than the shortest window while retention runs. |

### Expected size reduction

These are estimates from the 2026-10-07 numbers; confirm them with the query below. 71% of coins did not trade in
the last day. Assuming about two weeks of history (25.6 GB at about 2 GB a day on 2026-10-06), coins quiet for eight
days or more are about 40% of coins and, being short-lived, hold about a fifth of the non-quote rows. Danger coins
quiet for two to eight days, and at least seven days old, add a few percent.

| Table | Expected effect |
|---|---|
| `token_transfers` | About a fifth of 11 GB, roughly 2–3 GB, over the first passes. The 14-day idle-token rule would reach the same rows six days later; in steady state the rows kept for dead coins drop from about 14 days of deaths to about 8 (2 for Danger coins). |
| `liquidity_events`, `pons_events` | About a fifth to a quarter of 1.1 GB, roughly 0.25 GB. In steady state they hold about eight days of dead coins' events plus live coins' history. |
| `swaps` | Little at first: few coins have been quiet for 28 days yet. In steady state, no swaps of coins dead for more than four weeks. |
| `read_feed` (churn fix) | The 6.4 GB of mostly dead rows no longer comes back after a vacuum; live rows are about 89k. |

Altogether about 2.5–3 GB of the 29 GB at first, about 10%, rising as history ages. It counts for memory too: the
engines read all of `swaps`, `token_transfers`, `liquidity_events` and `pons_events` on every poll (`coinActivity`,
`refreshClock`), so their size is working set rather than cold storage, and the refresh no longer touches every Feed
page of a traded coin. To measure the share before enabling the rules (an eight-day window; the outcome and enrichment
gates make the real share slightly smaller):

```sql
WITH h AS (SELECT max(number) AS b FROM chain_blocks WHERE ts < now() - interval '8 days'),
quiet AS (SELECT t.address FROM tokens t, h WHERE NOT EXISTS (SELECT 1 FROM swaps s WHERE s.coin = t.address AND s.block > h.b)
  AND NOT EXISTS (SELECT 1 FROM token_transfers x WHERE x.token = t.address AND x.block > h.b))
SELECT (SELECT count(*) FROM token_transfers WHERE token IN (SELECT address FROM quiet))::float / (SELECT count(*) FROM token_transfers) AS transfers,
       (SELECT count(*) FROM swaps WHERE coin IN (SELECT address FROM quiet))::float / (SELECT count(*) FROM swaps) AS swaps;
```

As with every delete here, Postgres reuses the freed space, but the files only shrink with `pg_repack` or
`VACUUM FULL`.

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
- **Read-model churn.** On every refresh of a coin, `refresh_read_models` (0114) deleted and reinserted all of its
  buyers and its new-pair and graduation Feed rows, rewrote every one of its Feed rows (`UPDATE ... SET symbol,
  first_block` with no change check) and its `read_coins` row; the per-minute rank refresh zeroed and set the volume
  of every ranked coin. Each trade therefore left dead rows: on 2026-10-07 `read_feed` held 30.8M dead rows for 89k
  live ones (6.4 GB). Migration 0185 replaces the function (and the card trigger's `refresh_read_coin`): buyers are
  inserted only when new and deleted only when their buys are gone, Feed and `read_coins` rows are written only when
  a value differs, and the rank refresh is one update of the coins whose volume changed (`read/store.ts`). The target
  rows are the same as before. `apps/server/test/read-model-churn.test.ts` runs the 0114 function side by side: after
  each kind of source change both produce identical rows, and a refresh with no source change creates no new row
  version.

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
- `guard_shadow_runs`: decide its retention after the Guard 2.0 cutover.
- Per-coin history: a revived coin is re-checked with the pruned checks marked partial. A coin that was Danger
  because of, say, removable liquidity then shows that check as not fully checked rather than Danger again; its
  earlier verdicts and receipts stay. Carrying the last Danger matches forward would need a verdict format change.
- Per-coin history: run the measurement query above before enabling the two rules, and compare table sizes 48 hours
  after.
