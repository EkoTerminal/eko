# Packet 085 implementation handoff

Prepared and tested with local fixtures only. No commit, deployment, publication,
external message, live chain call or paid job was run. Actual external cost: $0.
No personal identifiers or real secrets were added or needed replacement. The
lead commits this worktree. No dependency declaration, lockfile, read-only spec,
Guard design or prototype changed. Only reserved server migration **0010** is
used; engines migration 0129 is unused.

Candidate: `8555f32881fd1fa02d9d8bb0b62a9b2ee59bef49` plus the uncommitted packet
085 changes listed below. Source fingerprint (SHA-256 over sorted changed paths and file bytes, excluding
this handoff): `48ab6fca20e1d8e396fbfd4ce0c5bfda1ce9dc102ca4ab08f5d7868f7305bf77`.
This is source preparation, not a deployed candidate,
accepted release, healthy production role or launch gate evidence.

## Changes

- `apps/server/drizzle/0010_launch_monitoring.sql` and
  `apps/server/drizzle/meta/{_journal,0010_snapshot}.json` and
  `apps/server/src/db/schema.ts`: bounded measurement store; one row
  per finite metric and at most 512 samples per row. Apply server migrations
  before starting worker collectors.
- `packages/db/src/launch-monitoring.ts`, `packages/db/src/index.ts`: shared
  fixed metric names, atomic concurrent writes and buffered role emitter.
  Overflow invalidates a measurement for five minutes instead of hiding drops.
- `apps/indexer/src/{cli,types}.ts`: actual live ingest progress heartbeat and
  observed head lag; absent timestamps do not manufacture a zero measurement.
- `apps/engines/src/{cli,worker}.ts`,
  `apps/engines/src/receipts/cli.ts`: live queue completion timing, successful
  engine poll heartbeat and canonical receipt commit lag. Replay emits no launch
  queue evidence; incomplete outputs do not supply complete-verdict timing.
- `apps/server/src/obs/{launch,incidents}.ts`: recent p95/rates, sample counts,
  freshness/unavailable states, canonical receipt age, D0 burn lateness and
  durable incident/audit/delivery records. Guard miss persists the trading stop,
  a private Scoreboard draft marker and 24-hour post-mortem requirement. RPC
  outage and simulation failure also stop trading. Stale committer pages without
  resuming or modifying execution. Missing canonical anchors/roles clear cached
  receipt observations. No public draft is published.
- `apps/server/src/http/launch-monitoring.ts`, `apps/server/src/app.ts`: text
  Prometheus exporter, individual status checks and bounded authenticated
  measurement/incident routes. Mutations require an allowlisted wallet session,
  allowed Origin and no demo token; database admin role alone is insufficient.
  Ingested measurements and incidents are audit logged.
- `apps/server/src/obs/{metrics,errors}.ts`,
  `apps/server/src/exec/chain.ts`: p95, launch observation hooks, existing live
  quote/simulation timing and acknowledged Sentry envelope delivery. Paper and
  testnet quote/simulation observations do not enter launch metrics. AI spend
  uses the existing budget ledger. Unconfigured Sentry resets prior DSN state.
- `apps/server/src/flags/service.ts`: execution checks reread the durable trading
  switch independently of the product flag cache, so a cached product flag cannot delay an incident stop on another
  API replica. Failed reads keep trading disabled.
- `scripts/ops.mjs`, `package.json`: `pnpm ops <kind>` prepares a command;
  actual authenticated submission requires explicit `--execute` and operator
  environment configuration. No session cookie or arbitrary provider response
  is printed.
- `infra/monitoring/{prometheus,launch-alerts,alertmanager,compose,
  grafana-dashboard,grafana-datasources,grafana-dashboards,
  uptime-kuma-checks}.json`, `infra/monitoring/README.md`: local service/check
  definitions, dashboards and Sev 1/2/3 thresholds. Empty external receivers
  cannot be claimed as delivered alerts. Kuma inventory uses neutral fixture
  origins and needs operator configuration. X is inactive before token phase or
  while its flag is off; Farcaster and daily burn are inactive before token phase.
- `apps/server/test/launch-monitoring.test.ts`,
  `apps/server/test/{trade-access,v1-foundation,harness-migrations}.test.ts`,
  `apps/engines/test/engines.test.ts`:
  offline migration/concurrent storage, freshness/threshold/absence checks,
  allowed-wallet/Origin/demo boundaries, fake alert and Sentry delivery, incident
  stop/audit behavior, bounded emitter overflow, ops command preparation and
  live-versus-replay queue observations. The existing cached-order expectation
  was replaced with stronger immediate-stop assertions; no safety assertion
  was weakened or test removed.

## Spec and remaining integration

Followed BACKEND §§1.4, 18, GO PLAN §§3.6, 4.5, 13 and Guard §9.3's distinction
between queue/incomplete output and required-check completion. Guard scoring,
calibration, cutover, accepted levels and execution logic retain their packet
ownership. No fast incomplete response is represented as a complete scan.

Missing collectors remain unavailable: complete required-check verdict timing,
harness preflight/guard/MCP/OAuth heartbeats and latency, bot heartbeats and X
budget, backup results from 084, and published-wallet anomaly observations.
The authenticated fixed-name measurement route and existing observation hooks
are ready for these producers; a measurement is not an acceptance certificate.
The current quote timer covers the existing adapter, not a future serving trade
or Guard path. The current simulation fraction covers attempted existing live
adapter simulations, not unimplemented or unsupported checks.

Receipt age/heartbeat consumes 080's canonical anchors and worker lease. Actual
registry deployment/funding and running roles are external dependencies. The
Scoreboard draft marker needs 076/112's confirmed missed-fill/correction pipeline.
Other §18 incident kinds (`bad_verdict`, `burn_anomaly`, `key_compromise`,
`ai_outage`) remain refused rather than pretending to rotate keys, correct
verdicts or control missing services. No automatic trading restart exists.

Ops still needs approved scrape targets/network, image acceptance, TLS proxy,
Kuma check setup, Grafana provisioning and both ops-group/on-call receivers.
`promtool` and `amtool` are unavailable here; native configuration validation and
real delivery acceptance remain operator steps. No Docker image was pulled or
service started. JSON definitions and threshold wiring are fixture checked.

## Every introduced TODO(spec)

1. `apps/server/src/http/launch-monitoring.ts`: measurement ingestion and
   individual status URLs are unspecified; smallest v1 convention used.
2. `apps/server/src/obs/launch.ts` and `infra/monitoring/README.md`: paging/phone transport and heartbeat/backup
   freshness cadence are unspecified. Receivers stay empty; conservative
   90-second role, five-minute observation and 26-hour backup expiry defaults
   are monitoring defaults, not accepted SLOs.
3. `apps/server/src/obs/launch.ts` and `infra/monitoring/README.md`: no separate Farcaster runtime flag exists in
   the shared contract; require its actual heartbeat at token phase.

The existing chain-client TODO about `TEAM_ALERT_CHAT_ID` delivery remains:
production paging transport is still unconfigured. Existing flag audience
ambiguity is unchanged. No spec files were edited to settle these decisions.

## Validation and reproduction

All observations are synthetic or fixture-backed; no live service or paid-provider
coverage exists. Full-suite fixture and image checks do not establish staging or
production acceptance.
Local logs under `/tmp` are disposable and excluded from the repository.

| Command | Result | Local log |
|---|---|---|
| `pnpm --filter @eko/server test test/launch-monitoring.test.ts test/trade-access.test.ts test/v1-foundation.test.ts test/harness-migrations.test.ts` | exit 0; 4 files, 37 tests | `/tmp/eko-085-focused.log` |
| `pnpm --filter @eko/engines test test/engines.test.ts -t 'emits queue completion'` | exit 0; 1 selected test (60 outside the focused selection) | `/tmp/eko-085-queue.log` |
| `pnpm test` | exit 0; all workspace suites, production web/server builds and offline role-image gate | `/tmp/eko-085-test.log` |
| `pnpm typecheck` | exit 0; all workspace packages | `/tmp/eko-085-typecheck.log` |
| `pnpm brand:check` | exit 0; 34 files | `/tmp/eko-085-brand.log` |
| `pnpm check:addresses` | exit 0; 349 source files | `/tmp/eko-085-addresses.log` |
| `git diff --check` | exit 0 | terminal output |

Full `pnpm test` completed with exit 0. Final checkpoint: every workspace suite
completed, including 164 engine, 107 indexer, 247 server and 14 MCP tests; web and
server production builds completed; direct/dispatcher shutdown and expected
unavailable-role startup refusal checks passed. Process session `58598` is
finished; log `/tmp/eko-085-test.log`. Cost $0; coverage local fixtures and mocked
metered RPC only. There is no running job or remaining local validation step.
Next action is lead review/commit, then separately authorized ops configuration
and native/live acceptance; do not treat fixture metering as provider charges.

`pnpm ops guard_miss` also completed with exit 0 and printed a prepared command
for the neutral fixture origin; it made no HTTP request.

An earlier full run failed on two hard-coded migration expectations and two
cached-switch expectations. They were updated for migration 0010 and the stronger
immediate-stop behavior, preserving product-cache, upgrade and data-preservation
assertions. The focused reproduction then passed before the final full gate.

Reproduce the commands above and `pnpm test` from the worktree root. Prepare
only (no HTTP request): `pnpm ops guard_miss`. Native ops acceptance commands
for the provisioned environment, under separate authorization:
`promtool check config infra/monitoring/prometheus.json`,
`promtool check rules infra/monitoring/launch-alerts.json`,
`amtool check-config infra/monitoring/alertmanager.json`. Real alert delivery,
Kuma monitors and staging status probes require the external configuration and
release steps listed above.
