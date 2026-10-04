# Task 123 · Migrate privacy-preserving telemetry to v1

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §23 CA-24; 03-FRONTEND §11; 05-GO-PLAN §14.
Dependencies: 090, 085. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add POST /telemetry with closed event/sample/error schemas and 120/min limit, using existing metric/storage modules. Preserve specified event names and durations without PII, wallet addresses, order context or secrets.
2. Migrate remaining web /api telemetry/metrics submissions to /v1 while retaining internal operational health paths. Aggregate launch funnel/latency data with bounded labels and retention.
3. Test oversize/unknown fields, identifier/secret redaction, demo inputs and rate limiting; offline mock mode must not call legacy telemetry. Never report a browser-to-server latency pass from Fastify injection timings.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
