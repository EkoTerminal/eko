# Chain-table retention (staging)

Full chain history is the default and the production rule (BACKEND §3.6). On staging, the chain is busy enough that
raw tables grew about 12 GB a day on 2026-10-04, so the owner approved two measures that day: pause wallet-protocol
storage and keep a bounded raw history on a 100 GB volume.

## What runs

- **Wallet-protocol storage paused** (`INDEX_WALLET_PROTOCOL=off` on the indexer). The indexer still computes
  protocol actors for swap attribution but stores no userops, 7702 delegations or per-transaction coverage. Wallet
  fingerprints then lack account-abstraction and calldata evidence.
- **Transfer roll-up** (worker, every ten minutes, at most about a minute of work per rule and pass;
  `packages/db/src/retention.ts`, `apps/server/src/retention-worker.ts`):
  - `RETENTION_QUOTE_TRANSFER_DAYS=2`: transfers of the registry quote tokens (WETH, USDG) older than two days.
    They were 52% of all transfers, and nothing reads their history except balances.
  - `RETENTION_IDLE_TOKEN_DAYS=14`: every transfer of a token with no transfer in 14 days. The engines ignore coins
    idle for seven days, so live evaluation never reads a compacted coin.
  - `RETENTION_PENDING_POOL_DAYS=3`: raw events of pools still unknown after three days.
- **Derived tables** (`RETENTION_FEED_DAYS` and the table-by-table decisions): [retention.md](retention.md).

## Why compaction and not deletion

Balances are recomputed from a holder's whole transfer history (`packages/db/src/market.ts`), and engine holder views
sum a coin's transfers (`apps/engines/src/sources.ts`, `replay-cache.ts`). Deleting old rows would silently change
balances. Each compacted (token, holder) pair keeps its net movement and newest compacted block in
`transfer_baselines`; every reader adds it, so balances and holder views at or after that block are exact. Views
before it, and replays across compacted ranges, are not reproducible; that is the accepted cost on staging.

## Guards and identity

- Every setting is unset by default. `RETENTION_IDLE_TOKEN_DAYS` must exceed seven days.
- Do not backfill or re-enrich a block range older than the shortest retention window while retention runs: re-inserted
  transfers would be counted on top of their baseline. The live indexer only rewrites its 256-block reorg window.
- Transfer retention refuses to start when the wallet outflow collectors are configured (they read transfer history
  from a saved cursor).
- The `RETENTION_*` settings are part of the attested configuration (`identityConfigKeys`), so the staging
  verifier only matches the reviewed values. `INDEX_WALLET_PROTOCOL` is an indexer setting and is recorded in
  `infra/railway/staging.json` and `docs/operations/staging-railway-evidence.md`.
- Tests: `packages/db/test/retention.test.ts`, `apps/engines/test/retention-holdings.test.ts`,
  `apps/server/test/retention-worker.test.ts`.
