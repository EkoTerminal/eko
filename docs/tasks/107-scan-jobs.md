# Task 107 · Implement persisted Fast Scan jobs and latency measurement

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§1.4, 6.5, 15.2, 23 CA-5; 03-FRONTEND §3.1.
Dependencies: 035, 068, 040, 065, 066, 079; 053 owns Guard queue throughput. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Extend existing indexed GET scan with POST /scan {query}, persisted ids and GET /scan/:id. Queue bounded unknown-address/identity-only scans without API writes to chain tables; reuse indexer acquisition and engine workers with durable deduplication.
2. Return pending/ambiguous/not_found/ready accurately and retain a stable share URL. Instrument new-pair discovery to critical-check completion/verdict persistence separately from first pending result, queue delay and client response time.
3. Test crash/resume, concurrent same-target requests, rate limits, missing simulation, malicious identity and subsequent ready state. Benchmark complete scans against p95 <=5s on staging through 087; a fast pending response cannot pass this gate.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
