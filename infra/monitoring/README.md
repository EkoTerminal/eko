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

Alertmanager routes severity 1/2 (and unmatched alerts) to ops and on-call;
severity 3 goes to ops. `alertmanager.json` is a **template** with
`${OPS_ALERT_WEBHOOK_URL}` and `${ONCALL_ALERT_WEBHOOK_URL}`. Alertmanager itself
does not expand these. Provision both HTTPS webhook endpoints from host secret
storage (see `config.env.example`), then render a new file outside the checkout:

```sh
node infra/monitoring/render-alertmanager.mjs /run/eko-monitoring/alertmanager.json
```

The parent directory must already exist with restricted access. The renderer
requires both receivers, refuses unresolved placeholders and non-HTTPS/userinfo
URLs, creates the file exclusively with mode 0600, and never prints URLs. Set
`EKO_ALERTMANAGER_CONFIG` to that absolute path for Compose; the private service
mounts it read-only. Create a new file and update the mount during rotation;
never commit generated receiver configuration. Secret injection and endpoint
provisioning remain owner work. Receivers accept Alertmanager webhook payloads;
chat/on-call providers needing another payload require a provisioned adapter.

Before provisioning, validate the rendered file with the deployed `amtool check-config`
and all Prometheus rules with `promtool check config` / `promtool check rules`.
These binaries are not bundled in the Node test gate. The incident hook records
`unavailable` when its independent page sink is unconfigured and `failed` when a
sink fails. A Sentry receipt requires a successful HTTP response, not merely a
configured DSN. There is no production incident paging adapter yet; Alertmanager
webhooks above deliver scrape alerts separately from the fixture-tested
`AlertSink` interface.

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
backup results require their collectors; security observations use the worker collectors below. Server
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
cadence is specified. Webhook endpoints and unavailable incident adapters require ops
configuration; the 90-second heartbeat, five-minute measurement and 26-hour
backup expiry are conservative monitoring defaults, not accepted service SLOs.
TODO(spec): Farcaster has no separate runtime flag in the current shared contract;
its status check becomes required at token phase and needs an actual heartbeat.


## Security alerts and coverage

All rules are in `launch-alerts.json`; scrape the private
`/api/metrics/prometheus` endpoint every 15 seconds. Security alerts link to the
[incident runbook](../../SECURITY.md#incident-runbook). JSON is also valid YAML,
but JSON parsing alone does not prove PromQL or receiver delivery.

| Signal / rule | Implemented observation | Collector coverage and remaining work |
| --- | --- | --- |
| `RegistryOwnershipTransferStarted`, `RegistryOwnershipTransferred`, `RegistryCommitterChanged` | Fixed measurement names `registry_ownership_started_timestamp_s`, `registry_ownership_transferred_timestamp_s`, `registry_committer_changed_timestamp_s`; event alerts cover the last five minutes | `SecurityCollectors.registry` in the singleton worker filters only the accepted manifest registry (which must match `RECEIPTS_REGISTRY_ADDRESS`) and the exact ABI events on chain 4663. Durable window checkpoints retain block hash and last log index; reorgs rewind to a canonical checkpoint and remove orphaned evidence. Last canonical event timestamps survive restart. Zero is emitted only after a complete successful scan since the configured start block; provider failure does not refresh measurements. |
| `TradingLiveChanged`, `TradingPaused`, `IncidentRecorded` | `eko_trading_live` reads durable `feature_flags` at scrape time (missing row means off); `eko_trading_live_changes_total` counts `trading.live_changed`; `eko_incidents_total` counts `ops.incident` | Implemented directly from server DB, no private labels. Switch count includes repeated explicit writes; direct DB changes are visible in the state gauge but bypass audit counts. Incidents that pause are counted as incidents. Gauge is the runtime switch, not `LIVE_TRADING_ENABLED` or effective execution permission. Counter increases require two scrapes; use durable audit records for startup and scrape-outage reconciliation. |
| `PublishedWalletOutflow`, `BurnUnexpectedOutflow`, `BurnWrongToken` | Existing bounded measurements `published_wallet_unexpected_outflow`, `burn_unexpected_outflow`, `burn_wrong_token`, alert when positive | `SecurityCollectors.wallets` reconciles canonical indexed ERC-20 `Transfer` rows for the configured public dev and burn wallets against successful transaction receipts and exact log amounts/participants. Durable checkpoints and evidence rewind on reorg. Owner-approved raw per-asset limits apply to aggregate unapproved outflows over five minutes; any unapproved burn outflow and a burn to zero/DEAD of a different token are separate counts. Exact transaction/token/destination intents with aggregate amount limits record manual ritual/bridge authorization. Missing thresholds, decimals, receipts or canonical hashes stop updates. No USD valuation is fabricated. Non-indexed tokens, native ETH, WETH withdrawal events, inflows and manual burn-record publication remain outside this coverage; burn alerts apply before token phase. |
| `ReferencePriceStale` | `reference_price_timestamp_s` is the timestamp of the last successfully authenticated reference-price source block, distinct from measurement ingestion time; alert after 300 s | `SecurityCollectors.reference` uses the repaired indexer restart predicate: verified canonical-factory v3 pool creation, WETH/USDG currencies, positive finite reference price and canonical indexed source/creation blocks at or below the head cursor. It emits the source block timestamp, never ingestion time or arbitrary pool swaps. Missing trusted observations stop updates. Complete the historical repair in `docs/operations/reference-price-repair.md` before provisioning. Archive slot0 samples have no separately persisted source observation and are not counted as fresh by this collector. |
| `ReceiptCommitterGasLow` | `receipt_committer_balance_eth` in native ETH, alert below 0.01 | `SecurityCollectors.gas` verifies chain 4663 and the accepted registry, reads `committer()` then `eth_getBalance` for that current address using the same canonical block hash, and rechecks the block. Rotation is followed on the next minute poll. A zero committer, unsupported canonical block reads or RPC failure stops updates. This is the gas-only receipts signer; no key is needed and future Drop 7 keepers are not covered. |
| `RpcLag`, `LaunchCheckUnavailable` | Existing `head_lag_ms` from indexed head and `role_indexer` heartbeat; alert above 5 s or absent/unhealthy role | Implemented indexer/head signals. Log-first ingest also logs `blocks_behind` in `ingest_metrics`, but this is not a Prometheus gauge. Investigate canonical progress, sparse windows and provider budgets together. |
| `SecurityCollectorUnavailable` | Existing `eko_measurement_available` for every security collector metric, zero for missing/stale samples | Implemented missing-data alert, including the preexisting wallet measurements; collectors expire after five minutes. It pages while collectors are pending, rather than implying coverage. |

The singleton `APP_ROLE=worker` runs `apps/server/src/obs/security-collectors.ts`
through `security-worker.ts`; API replicas do not start it. Collectors submit
finite nonnegative observations through the same `LaunchMonitor.record` service
as `POST /v1/admin/monitoring/measurements {metric,value}`. The HTTP path still
requires an allowlisted wallet session and allowed Origin; the worker needs no
admin cookie or signer key. Poll each minute (after the previous poll completes);
stop updates on failed reads so expiry alerts fire. Event collectors refresh the
**last canonical event's timestamp**, not the scrape timestamp. No addresses,
keys, account ids, transaction payloads or arbitrary labels enter metrics.
Retain evidence/cursors outside this bounded measurement window. A polling
failure shorter than expiry can leave the prior measurement visible.

// TODO(spec): The spec does not set reference-price alert age, gas floor or
// per-asset large-outflow thresholds. Five minutes and 0.01 ETH are conservative
// operational defaults, not execution policy or accepted SLOs. The owner must
// choose thresholds from actual cadence/gas use and record per-asset outflow
// thresholds before enabling the collector. No arbitrary USD threshold is assumed.


## Collector provisioning (disabled by default)

Run server migration `0034_security_collectors` before starting the worker. Its
checkpoint/evidence tables retain operational reconciliation independently of the
five-minute measurement window. The existing worker role lease excludes competing
workers. All RPC reads share `ChainClients.meter` and its durable usage/budgets;
zero paid daily or session budget stops every enabled collector (including local
reference refresh) before any RPC attempt. Failures log only fixed collector names.
There are no new dependencies or signing powers.

`SECURITY_COLLECTORS` is a validated JSON host setting, default `{}`. Enable only
the collectors provisioned by the owner. Configuration fields:

| Field | Required owner record |
| --- | --- |
| `registry: {startBlock}` | Accepted deployment/start block, plus matching accepted `ours.receiptsRegistry` manifest and `RECEIPTS_REGISTRY_ADDRESS` |
| `reference: true` | Completed canonical discovery/historical reference repair and indexed trusted reference swaps |
| `gas: true` | Accepted registry and an approved chain-4663 provider supporting canonical block-hash `eth_call`/`eth_getBalance` |
| `wallets: {startBlock,burnToken,assets,intents}` | Public `DEV_FEE_WALLET` and `BURN_WALLET_ADDRESS`; expected burn token; scan start; approved thresholds and manual intent records |
| `wallets.assets[]: {token,decimals,maxOutflowRaw}` | Per-asset five-minute aggregate raw integer limit (decimal string); zero is an explicitly recorded zero-tolerance threshold, not a default |
| `wallets.intents[]: {txHash,token,to,maxAmountRaw,purpose}` | Exact transaction/token/destination and aggregate raw cap; purpose `burn`, `bridge` or `ritual`. Burn intent requires the configured burn token and zero/DEAD destination. Defaults to no approved intents. |

Scans advance at most 500 blocks per poll, accept at most 1,000 matching events,
and wallet windows accept at most 100 unique transaction receipts. An oversized
window reports unavailable without cursor advancement; ops must investigate
coverage/cadence before enabling in a busy deployment. Catchup persists progress
but publishes no clean zero before reaching the head. Receipt/asset data remains
in private evidence tables, never Prometheus labels. Missing asset metadata or
thresholds are unavailable; raw limits need no USD reference conversion.

| Collector escalation | Responsible role | Delivery provisioning |
| --- | --- | --- |
| Registry event or committer gas | Ops responder, then cold registry owner for unauthorized authority changes | TODO(owner): contacts/rota; ops and on-call webhooks |
| Published/burn outflow or wrong burn token | Ops responder, then burn-wallet operator to hold/reconcile the ritual | TODO(owner): thresholds, intents and operator escalation |
| Trusted reference stale/unavailable | Ops responder and indexer release operator; pause/recover per SECURITY.md | TODO(owner): provider/repair acceptance and responder contact |

## Acceptance and incident drill (pending provisioning)

1. Deploy the private scraper/receivers and verify `/api/metrics/prometheus` is
   reachable only on the ops network. Configure the implemented worker collectors above;
   confirm their canonical chain/role bindings, cursors and failure behavior.
2. On an isolated staging deployment, exercise a real registry ownership
   initiation/acceptance and committer rotation with staging authorities only;
   confirm matching event alerts, both receiver acknowledgements and recovery.
3. Scrape once before and after an authenticated `trading_live` flip and incident;
   verify state/audit counters, actual order refusal and ops/on-call notification.
   Use fixture outflows, stale price timestamps and a staging committer low
   balance to check rule firing and absence of wallet/private content in payloads.
4. Stop each collector and the indexer to verify unavailable/lag alerts. Confirm
   resolved notifications after healthy observations return. Do not silence a
   missing collector as proof of coverage. Store rendered-config/rule validation
   output, revision, timestamps and delivery acknowledgements in the release
   record without credentials. Follow SECURITY.md for recovery authorization.

The local gate parses the Prometheus rule structure and the restricted PromQL
used here, verifies selectors against exported measurement/check names, renders
receivers with placeholder HTTPS webhook names, and tests durable state/counters,
collector restart/reorg/failure behavior and expiry with offline fixtures. The
validator is not a replacement for the deployed version’s `promtool`/`amtool`.
No live collector, monitoring service, external delivery or on-chain owner action
was executed by this change.
