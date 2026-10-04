# Task 086 backfill evidence handoff

Implements BACKEND §§4.3, 7.5, GO PLAN §7 and Guard §§8.3, 9.3. This is an offline verifier and read-only database exporter. It performs no RPC, migrations, collection, engine replay, deployment or approval. Task 048 owns selective acquisition and task 057 owns incident/sample/review evidence.

## Evidence input and interpretation

`apps/indexer/test/fixtures/backfill-gate/snapshot.json` documents the version-1 input shape. All addresses, counts, block heights, ranges and timestamps in that file are synthetic. Its SHA-256 report is `086-fixture-evidence.json`; it is **unresolved**, with `origin: fixture` and `liveApproved: false`. Do not reuse its ranges or token list for a live plan. No existing local chain database was supplied in this worktree. Local PGlite tests exercise actual database queries against neutral seeded data. `086-local-capture-inventory.json` separately inventories the two existing captured datasets (45 selected blocks total), preserving file hashes, min/max ranges, missing intervals, receipt/log counts, duplicate/removed/hash-consistency diagnostics and checkpoint. These sparse captures do not supply leased-range, window, holder or live-head completeness evidence; original acquisition cost is unknown. Reproduce with `python3 docs/operations/backfill-gate/inventory-local-captures.py` (exit 0).

A real plan pins chain 4663, candidate revision, head hash/time, the first blocks at or after the head's 30-day and seven-day cutoffs, and their preceding canonical headers. It declares every content group, exact lease stream name and token scope. Completed leases are unioned inclusively within a single stream. Old holder/swap filter hashes cannot fill gaps in a new target set. Supply reconciliation also requires holder coverage from each declared token's first block through the pinned head, a same-head `total_supply` sample, no negative nonzero-address balances, and exact per-holder agreement with Transfer events. All supply arithmetic uses integers; zero-address burns reduce supply, while dead-address/token/burn-wallet inventory stays in the balance sum. WETH Deposit/Withdrawal do not double-count Transfer movements.

The current `logs:pair_swaps` acquisition selects recent-created pools plus Pons graduates; a done range alone cannot establish all-pool swaps over 30 days. The plan must retain that acquisition scope and report broader unavailable content. Recent holder windows also lack older tokens' opening balances. This verifier does not synthesize those balances or use future supply reads. Missing same-head supply observations remain unresolved and must come from existing approved acquisition.

The exporter compares duplicate transaction/log identities independently of partition timestamps, and candle OHLCV/count/block bounds with complete boundary-minute aggregates. Unpriced swaps remain unresolved. Every declared phase is reported: genesis Pons plus registry; recent pools/swaps/holders, other launchpads/WETH/EntryPoints; and full 30-day blocks or seven-day blocks plus candidate funding. Unimplemented streams must remain named and unresolved, never mapped to an unrelated done stream. Fallback candidate membership/source completeness requires the owning acquisition manifest, not just a lease named `funders`.

Existing `guard_availability` metadata, content hashes and invalidation counts are exported. External 048/057 manifests can be supplied unchanged to the verifier; it records their content hashes without copying their contents into the report. Missing manifests, the verified 53-launch challenge, both named clone challenges and 50 distinct independently reviewed deployer-history comparisons remain unresolved. Alleged incident cash is not independently reconciled cash. A 200k replay establishes neither genesis nor 30-day coverage. Guard's 14+7-day cohort and 51-day availability frame retain their separate acceptance requirements.

## Offline reproduction

Run from the repository root:

```sh
pnpm --filter @eko/indexer test test/backfill-gate.test.ts
pnpm --filter @eko/indexer exec node --import tsx src/backfill-gate-cli.ts verify \
  --snapshot test/fixtures/backfill-gate/snapshot.json --out /tmp/eko-086-new-fixture-report.json
```

The verifier writes its report before exiting **2** for unresolved evidence, **1** for invalid input/export/output failure. `pnpm exec` may translate a child exit 2 into wrapper exit 1. To preserve the exact child status, run `node --import tsx src/backfill-gate-cli.ts ...` from `apps/indexer`. Outputs use exclusive creation; choose a new path on each run.

To inspect an existing database without acquisition, supply the predeclared plan, using an existing shared `DATABASE_URL` or a closed local `PGLITE_DIR` via the environment:

```sh
pnpm --filter @eko/indexer exec node --import tsx src/backfill-gate-cli.ts snapshot \
  --plan /tmp/eko-086-live-plan.json --checkpoint candidate-086 --out /tmp/eko-086-new-snapshot.json
pnpm --filter @eko/indexer exec node --import tsx src/backfill-gate-cli.ts verify \
  --snapshot /tmp/eko-086-new-snapshot.json --out /tmp/eko-086-new-report.json \
  --guard-048 /tmp/eko-048-acquisition-manifest.json --guard-057 /tmp/eko-057-review-manifest.json
```

No secrets belong in plans, manifests, logs or reports. The exporter has a 30-second limit per SQL statement, at most 1,000 declared tokens, a configurable output row bound capped at 10,000, and a repeatable-read read-only transaction. It never accepts truncated arrays. The CLI limits each imported file to 16 MiB. Cost is null for an unmetered database export; null is not measured zero acquisition cost. Source content does not leave the local filesystem.

## Prepared lead commands: separate approved budget required

These commands are prepared, **not run or approved by task 086**. The lead first records approved session/daily weighted-unit caps, actual provider weights/pricing, canonical head and timestamp boundaries, acquisition/checkpoint ownership and target sets. Endpoints remain environment secrets. Use the shared meter and database so restart does not reset the budget. Each stopped/failed range remains incomplete until a subsequent exported verifier report shows otherwise.

```sh
# Approved caps and canonical boundary block numbers must already be in the environment.
RPC_SESSION_BUDGET="${APPROVED_SESSION_UNITS:?}" RPC_PAID_DAILY_BUDGET="${APPROVED_DAILY_UNITS:?}" pnpm verify:chain
RPC_SESSION_BUDGET="${APPROVED_SESSION_UNITS:?}" RPC_PAID_DAILY_BUDGET="${APPROVED_DAILY_UNITS:?}" pnpm --filter @eko/indexer backfill -- --stream logs:pons_factory --from 0 --to "${PINNED_HEAD:?}"
RPC_SESSION_BUDGET="${APPROVED_SESSION_UNITS:?}" RPC_PAID_DAILY_BUDGET="${APPROVED_DAILY_UNITS:?}" pnpm --filter @eko/indexer backfill -- --stream logs:pons_curves --from 0 --to "${PINNED_HEAD:?}"
RPC_SESSION_BUDGET="${APPROVED_SESSION_UNITS:?}" RPC_PAID_DAILY_BUDGET="${APPROVED_DAILY_UNITS:?}" pnpm --filter @eko/indexer backfill -- --stream logs:pools --from "${FROM_30D:?}" --to "${PINNED_HEAD:?}"
RPC_SESSION_BUDGET="${APPROVED_SESSION_UNITS:?}" RPC_PAID_DAILY_BUDGET="${APPROVED_DAILY_UNITS:?}" pnpm --filter @eko/indexer backfill -- --stream logs:pair_swaps --from "${FROM_30D:?}" --to "${PINNED_HEAD:?}"
RPC_SESSION_BUDGET="${APPROVED_SESSION_UNITS:?}" RPC_PAID_DAILY_BUDGET="${APPROVED_DAILY_UNITS:?}" pnpm --filter @eko/indexer backfill -- --stream logs:holders --from "${FROM_30D:?}" --to "${PINNED_HEAD:?}"
pnpm --filter @eko/indexer bars:rebuild -- --from "${FROM_30D:?}" --to "${PINNED_HEAD:?}"
RPC_SESSION_BUDGET="${APPROVED_SESSION_UNITS:?}" RPC_PAID_DAILY_BUDGET="${APPROVED_DAILY_UNITS:?}" INDEX_HEAD_MODE=logs pnpm --filter @eko/indexer start > /tmp/eko-086-follower.jsonl 2>&1
```

Factory must finish before curve acquisition. Pool discovery precedes swaps; finalize the target set before checking hashed swap/holder streams. Rebuild candles only after the source candidate is stable. Holder creation history/archive baselines, registry, other launchpads, full-block/candidate funding coverage and Guard acquisition must use their owning workers; there is no supported runner here for the missing streams, and no replacement collector is introduced. Do not enable whole-block replay as a substitute for those workers.

For the lead's task-066 follower run, save start/end UTC times, actual remote head and applied cursor at both boundaries, the candidate revision, complete ingest_metrics/head_tick logs, and meter usage/cost at shutdown. Measure closure of a 2,000-block initial gap in less than 300 seconds, then a separate steady-head observation with p95 lag at most 1,000 ms. Attach the log hash and measured summary using the snapshot's optional `follower` field. The verifier checks these calculations and revision consistency; it does not authenticate a manually supplied log summary or infer approval. Do not mix the catch-up lag samples into steady-head p95, or report a fast incomplete scan as caught up. Stop with SIGINT or the explicit session cap; preserve process ID, log, database cursor/range checkpoint and actual cost for any unfinished run. No measured live follower result is present in this handoff.

## TODO(spec) and dependencies

One new TODO(spec), in `apps/indexer/src/backfill-gate.ts`: 048/057 have no merged interchange schema for their acquisition/challenge/review reports. Preserve original external manifests and their hashes; the owning packets must provide a reviewed adapter before incident, clone, candidate-denominator and human-history evidence can be accepted. Existing Guard storage manifests are consumed without changing their schema. No human judgments are invented and no V2 release settings are changed.

Dependencies remaining: registry and missing Phase B acquisition; accepted Phase C source/candidate denominator; complete token creation history or archive baselines and same-head supply samples; 048/057 acquisition/incident/review exports; independent 50-history comparisons; the metered live task-066 catch-up/head-lag run. These are external evidence dependencies, not permission to run paid work in this sandbox.
