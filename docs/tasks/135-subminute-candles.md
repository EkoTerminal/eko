# Task 135 · Serve the already-built sub-minute candle aggregation

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 03-FRONTEND §3.5; 04-BACKEND §4.9 and §23 CA-4.
Dependencies: 021, 023. This packet covers acquisition or integration outside the existing Guard packet ownership.

## Do

1. Wire CoinsService 1s/15s candle requests to the existing raw-swap aggregation in packages/db/src/market.ts for the last six hours. Preserve pinned asOfBlock and existing 1m+ behavior.
2. Distinguish a measured empty interval from absent/unavailable raw history; bound ranges and return the shared response shape without whole-history scans.
3. Test real isolated database rows for boundary timestamps, OHLC/volume, gap handling, six-hour clipping and incremental coin tick updates. Update coin UI tests so supported sub-minute data is displayed.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.

