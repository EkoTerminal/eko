# Launch monitoring preparation

Prepared for BACKEND §§1.4, 18 and GO PLAN §§3.6, 4.5, 13. No service is deployed,
no external receiver is configured, and no live delivery or acceptance is asserted.
JSON configuration files use the JSON subset of YAML. Prometheus, Alertmanager,
Grafana and Kuma need separately authorized provisioning on the ops host.

`compose.json` defines private services without host ports. Join the application
network and replace the API scrape target before provisioning. Restrict metrics
and Grafana to the ops network; route Kuma through the existing TLS proxy.
Images require the release operator's image/security acceptance and local cache
or an authorized image pull. No images were pulled or services started here.

Alertmanager receivers are deliberately empty. Before acceptance, configure the
ops group (`TEAM_ALERT_CHAT_ID`) and on-call delivery in host secret storage,
validate configuration with the deployed `promtool`/`amtool`, and test both
channels under separate authorization. The incident hook records `unavailable`
when paging is unconfigured and `failed` when a sink fails. A Sentry receipt
requires a successful HTTP response, not merely a configured DSN. There is no
production paging adapter yet; the `AlertSink` interface is fixture-tested.

Import `grafana-dashboard.json` and the datasource/provider definitions. Missing
observations appear as unavailable, never zero. Quantiles use up to 512 recent
samples in five minutes; simulation failures use attempted checks only. Low or
capped sample counts are fixture/operational monitoring, not launch gate evidence.
Role emitters batch writes and bound each metric buffer to 512 samples; overflow
invalidates the metric and suppresses recording for the next five minutes.
Queue completion includes incomplete outputs; pair-to-complete-verdict must be
recorded only after **all required checks** complete, including durable output.
Neither a fast incomplete card nor a one-second block timestamp establishes that
measurement. The current engine does not emit complete-verdict measurements.

`uptime-kuma-checks.json` is a repo-local check inventory, not a claimed native
Kuma database export. Replace neutral fixture origins and configure checks in
Kuma. HTTP 503 means unhealthy/unavailable. `/v1/health/checks/api` tests this API;
MCP/OAuth/guard/scan/bot checks require the actual role's heartbeat and measurements.
No measurement may be manufactured from an absent process or unset feature.
X stays inactive until token phase and `summon_x` is on; Farcaster and daily burn stay inactive
before the configured token phase. Enable their Kuma checks only at their release.
The daily burn check needs the scheduled UTC timestamp and the confirmed on-chain
burn timestamp refreshed by its collector; it turns unhealthy after 60 minutes.

The metrics exporter reads the indexed head and canonical receipt anchors without
RPC calls, and consumes real API quote/simulation samples and the configured AI
budget. It does not start background scans, simulations or paid work. Live indexer progress and successful engine polls emit role heartbeats; live
engine tasks emit queue completion, and canonical committer output emits commit
lag. Complete verdict timing, harness/bot heartbeats, preflight timing, X budget,
published-wallet anomalies and backup results require their collectors. Server
migration 0010 must run before role startup; telemetry write failures log a
bounded unavailable event and do not alter indexed or trading outputs. The packet's authenticated bounded measurement endpoint prepares
those integrations: `POST /v1/admin/monitoring/measurements {metric,value}`. Refresh
role heartbeats within 90 seconds, other observations within five minutes and
backup results within 26 hours. Admin session must be a configured allowlisted
wallet, with the allowed Origin, and cannot be a demo session.

`POST /admin/incident {kind}` supports `guard_miss`, `rpc_outage`,
`simulation_failure` and `stale_committer`. The first three persist
`trading_live=false` before delivery. Each incident appends an audit record;
`guard_miss` includes a private Scoreboard draft marker and 24-hour post-mortem
requirement. No public correction or message is published. Other §18 incident
kinds stay unavailable until their owned correction, burn or key-rotation logic
exists. No signing, secret rotation or automatic resumption occurs here.

Prepare an authenticated command with `pnpm ops guard_miss`. Actual submission
requires `--execute`, `OPS_API_ORIGIN`, `OPS_PUBLIC_ORIGIN` and
`OPS_SESSION_COOKIE` from the operator's secret environment. Never paste a cookie
into a command, source file or log. Every execution check rereads the durable
trading switch, so another API replica's cached product flags cannot delay the
stop. Restart only through the existing authenticated trading admin route after
the runbook's guard/Normalizer fixtures and release authorization.

TODO(spec): No paging transport/phone provider or concrete backup/heartbeat
cadence is specified. The empty receivers and unavailable adapters require ops
configuration; the 90-second heartbeat, five-minute measurement and 26-hour
backup expiry are conservative monitoring defaults, not accepted service SLOs.
TODO(spec): Farcaster has no separate runtime flag in the current shared contract;
its status check becomes required at token phase and needs an actual heartbeat.
