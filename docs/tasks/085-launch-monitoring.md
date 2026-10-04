# Task 085 · Add launch metrics, alert hooks and status checks

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§1.4, 18; 05-GO-PLAN §§3.6, 4.5, 13.
Dependencies: 024, 073, 080, 083; consume later harness/bot metrics when implemented. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Extend existing Prometheus/Sentry paths with head lag, queue completion, pair-to-complete-verdict, quote/preflight latency, simulation failures, receipt commit age, budgets and backup results. Keep bounded labels without wallet identifiers or secrets.
2. Add repo-local Prometheus/Grafana/Alertmanager and Uptime Kuma check definitions with specified severity thresholds. An absent role or missing measurement is unhealthy/unavailable; D0 burn checks remain inactive before D0.
3. Exercise RPC outage, simulation failure, stale committer and guard_miss with fake sinks; guard_miss flips trading_live and creates an audit record. Prepare authenticated admin incident/ops commands and delivery tests without sending external messages in this packet.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
