# Task 137 · Measure and enforce the T frontend performance budgets

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 03-FRONTEND §§11–13; 04-BACKEND §20; 05-GO-PLAN §§7–9.
Dependencies: 078, 108, 123, 135, 136; run on the same candidate as 129. This packet covers acquisition or integration outside the existing Guard packet ownership.

## Do

1. Add build-budget assertions for landing JS <=90kB gzip, shell <=220kB and route chunks <=80kB; ensure the chart loads only on coin view and landing excludes wallet/stream bundles.
2. Produce a repeatable mid-tier-phone/4G measurement harness using existing browser tooling, and Lighthouse CI only as named by the spec. Record LCP <=2s, INP <=200ms, CLS <=0.05, indexed scan p50 <=3s, WS paint p90 <=50ms, quote p50 <=800ms, chart ready <=300ms and warm approval-link readiness <=1.5s when that D0 route is enabled.
3. Keep frontend timings distinct from the server pair-to-verdict p95 <=5s gate owned by 053/087. Pin source, browser, transport, sample count and fixture/live status; a local measurement is not production field evidence. Report budget failures without weakening thresholds.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.

