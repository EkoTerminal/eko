# 023d implementation report

Read models accept deferred sender and pricing rows from task 025. The read migration remains `0113_v1_reads`; `0114_batched_read_models` upgrades existing installations to pending-aware, batched maintenance. No dependencies, lockfile changes, or `docs/eko/` edits were made. No personal identifiers were added or ported.

## Fixes

- The `0113` buyer backfill and original swap/token maintenance functions exclude null traders, so installing the read migration over pending swaps succeeds.
- `0114` replaces indexer-side per-row swap/bar/token/pool maintenance with statement-level triggers. Transition tables enqueue distinct changed coin keys with durable revisions for INSERT, UPDATE, and DELETE. Enrichment's trader/price/USD UPDATEs and replay price fills therefore invalidate the same projections as new swaps.
- The API refreshes changed coins in batches of at most 250, outside the indexer's transaction. A 250 ms background refresher runs in the API process, startup drains the migration backlog, and list/search/row reads drain the queued snapshot before selection. Refresh notifications update the existing live Radar/Pairs/feed consumers. The refresher uses only the database; it makes no chain calls.
- Queue acknowledgements delete only the revision that was calculated. A newer revision stays queued, including when a source change arrives between calculation and acknowledgement. Each drain has a fixed revision cutoff, so ongoing ingestion cannot keep a read request draining forever. Rollback preserves both source and queue state. Refresh errors are reported and leave work queued for retry.
- Read projections no longer hold foreign keys to mutable chain-token rows. The refresher explicitly removes projections for deleted tokens. Projection writers acquire feed/coin locks in engine write order; these locks do not cover indexer source tables or chain rows. Engine-only card/verdict/playbook hooks remain outside the indexer ingest path.
- `read_buyers` contains only known, completed sender identities. Counts are distinct buyers, not buy-event counts. A coin's buy rows with a pending sender or null trader mark `buyers` unavailable, while the numeric field retains the observed known count.
- Missing price/USD or pending pricing marks market metrics unavailable. The additive CA-35 availability enum includes `buyers`, `volume`, and `spark`; price uses `priceUnavailable`, and change/cap use their existing flags. Incomplete market values do not produce a displayed price spark. Enrichment's refreshed bars restore volume, price changes, cap, and sparklines on the next projection refresh. No synthetic candles or sender identities are created.

The pricing mask is deliberately conservative across the coin's indexed swap history: any unresolved price/USD keeps its market metrics unavailable. Sender availability applies to buys; a deferred sell alone does not make the known buyer count incomplete.

## Ingest overhead

The offline benchmark replays captured `v3PoolCreated`, `ponsLaunch`, and `ponsSell` blocks through `BlockDecoder` and the indexer's write transaction. Its synthetic workload uses the actual `BlockRows.flush` path: 100,000 swaps across 200 block numbers and 100 coins, in ten bounded 10,000-swap chunks. It includes 50,000 pending-sender swaps and 25,000 pending-pricing swaps. Half the coins are Pons launches with deployers, exercising active coin projections.

The control disables the swap/bar/token/pool read triggers only; source indexes, the bounded identity indexes, notifications, source insertion, and bar generation remain enabled. The previous per-row measurement includes the null-trader guards needed to complete the run. Each workload/mode is a single offline PGlite sample. The fixture is small and affected by cold/JIT timing; its negative percentages are noise, not a claimed speedup. The 100k range provides the threshold decision.

| Maintenance | Workload | Triggers off: ingest / writes ms | Triggers on: ingest / writes ms | Ingest / write overhead |
|---|---|---:|---:|---:|
| Previous per-row | Captured fixture | 77.85 / 35.25 | 74.94 / 36.18 | −3.74% / +2.63% |
| Previous per-row | 100k swaps | 5,518.83 / 5,383.08 | 7,538.30 / 7,400.22 | **+36.59% / +37.47%** |
| Statement queue | Captured fixture | 93.92 / 43.55 | 66.96 / 28.66 | −28.70% / −34.18% |
| Statement queue | 100k swaps | 5,727.16 / 5,581.73 | 5,817.27 / 5,678.66 | **+1.57% / +1.74%** |

The separate, post-commit refresh took 6.89 ms for the fixture and 67.58 ms for the complete 100k range. These times are not charged to the indexer's write transaction. The 100k ingest overhead is below the requested 10% limit after the change.

[Raw benchmark evidence](023d-ingest-benchmark.json) records both captures, the workload, and refresh timing. Reproduce from `apps/server` with:

```sh
node --import tsx test/read-ingest-benchmark.ts
```

These are offline synthetic measurements, not measurements of the lead's live PostgreSQL ingest. The lead still reruns on the real replay database.

## Regression coverage

- Hostile-text tests now begin with task 025's deferred v3 metadata/senders/pricing, then call the real `enrichSenders` implementation with fixture clients before asserting exact 10 KB identity storage and `toUntrusted` display on every read endpoint family. Both pre-migration data and repaired older installs pass.
- A new pending-read regression writes pending swaps through `BlockRows`, then performs actual enrichment UPDATEs from encoded v3 receipt logs. It verifies known buyer counts before enrichment, availability flags, duplicate buys counting one new sender, price, hourly change, volume, spark and candle restoration, and cleared pending flags.
- The same test verifies source rollback, revision preservation when a change arrives during refresh, buyer removal on swap deletion, and projection cleanup after token deletion.
- A web regression verifies an accessible dash instead of an incomplete price spark. Existing live-event/backpressure tests still pass with refresh notifications.
- All existing task 025, engine, shared-contract, and web tests were rerun. No assertions were removed or weakened, and no new skips were added.

## Checks

- Root `pnpm typecheck`: passed, exit 0.
- Root `pnpm test`: passed, exit 0, including 86 server tests, 67 engine tests, 90 indexer tests, and 418 web tests. The existing optional Foundry fork test remains skipped.
- `pnpm brand:check`: passed, exit 0 (15 scan targets).
- `pnpm check:addresses`: passed, exit 0 (265 source files).
- `git diff --check`: passed, exit 0.
- Ingest benchmark: passed, exit 0.
- Real-shaped read benchmark: passed, exit 0. On the prior 2,475-card / 2,683-identity / 120k-run / 400k-swap / 200k-block-clock seed, every measured route remains below 300 ms. Maximum: 51.01 ms (/v1/radar); Feed maximum: 3.62 ms. This is Fastify injection in offline PGlite, not browser/network latency.

Local pnpm commands use `--config.verify-deps-before-run=false`; installed dependencies are unchanged. No network, ports, browser checks, commit, or deployment was used for this task.
