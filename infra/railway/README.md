# Railway staging handoff

Prepared for packet 083; no project, database, domain, deployment or paid job has
been created by this packet. Production remains Vultr/BitLaunch (BACKEND §19,
GO PLAN §4). This directory is a staging exception, not a production host change.

// TODO(spec): Railway is requested for staging; production remains Vultr/BitLaunch
per the launch spec until an explicit decision changes it.

The application source candidate is pinned in `staging.json`:
`96c0205f469664b980763e70c72ba098f08ccb38` (merge-parent baseline; the integrated candidate is uncommitted). The lead must pin the resulting merge revision before any deployment.
If application integrations change, update the pin and role availability together,
review the diff, and repeat the relevant gates. Never deploy floating `main`.
Retain the previous accepted image **digest**, source revision, config export
(secret names/redacted values only), schema compatibility result and migration
ledger checksums before replacement. There is no previous Railway deployment yet.

`staging.json` is the operator inventory, not a Railway config file. Each role's
`*.json` is the small Railway config-as-code subset (Dockerfile build, launch
command, replica count, restart policy, API health probe). Resource limits,
variables, networking, database volumes, source revision and disabled services
are configured separately in Railway; config files do not apply them. Select the
exact config path per service in its settings. An unavailable service's JSON is a
future definition: **do not provision or start it**. The current image dispatcher
rejects it rather than starting a substitute process.

| Service | Current state | Ingress and readiness | Initial hard limits |
|---|---|---|---|
| api (web + REST + WS) | available, one replica | TLS 8710; `/v1/health`, `/v1/config`, SPA, `/v1/ws` ack | 1 CPU, 1 GiB |
| Postgres 16 | separately authorized provisioning | private only; `pg_isready`, `SELECT 1`, migration ledgers | 2 CPU, 4 GiB, 20 GiB volume |
| indexer | available; no paid budget by default | private; `indexer_started`, `head_tick`, cursor/hash/lag | 1 CPU, 2 GiB |
| engines | available; no paid budget by default | private; `engines_started`, queue progress and receipt outbox | 1 CPU, 2 GiB |
| worker (reconciler) | available, exactly one | no listener; `EKO worker ready`, exclusive Postgres lease | 1 CPU, 2 GiB |
| mcp | transport compiled; handlers require 094/095; keep unprovisioned pending integration | private only; `/health` and authenticated `/mcp` initialize; future real tool checks | 1 CPU, 2 GiB |
| receipts | unavailable, requires 080 + role/image integration | private; actual registry event/root/proof, not startup alone | 1 CPU, 2 GiB |
| bots | unavailable, requires 116 + role/image integration | approved Telegram path only; X/Farcaster remain off | 1 CPU, 2 GiB |
| og | unavailable, requires 111 + role/image integration | future TLS deterministic PNG route | 1 CPU, 2 GiB |
| sim | separate compatible host; never Railway public ingress | private fork + ArbSys + supported simulation suite | 2 CPU, 4 GiB |

These are initial operator ceilings, not measured capacity or cost estimates.
Apply them in service settings before starting anything; reject a plan that cannot
honor them. No autoscaling of indexer, engines, worker or receipts. API replicas
must keep `RUN_WORKER=false`. The image's session advisory lock prevents duplicate
singleton writers, but it does not make overlapping deploys desirable. Stop and
drain an old singleton before starting its replacement; disable automatic deploys,
cron jobs, previews, serverless sleeping and overlapping rollouts for these roles.
Use a small separately approved platform spend cap; no platform charge is approved
by this handoff. Configure Postgres connection capacity for the sum of pools and
lease/LISTEN connections (server pools currently max 10 per process) with reserve;
reassess before adding replicas. Alert on OOM, restart loops and disk utilization.
Backups/WAL/restore proof belong to 084, alerting/status/paging to 085.

## Variables and authority

Apply `commonEnvironment` then each available service's `environment`. Supply only
its listed `secretNames` through environment-specific secret storage (SOPS/age
handoff into Railway variables); never paste values into source, shell history,
logs, a report or browser build variables. Do not export an unredacted variable set.
`DATABASE_URL` uses the Postgres service's **private** hostname and generated
credentials, never its public TCP proxy. Preserve the existing client's TLS
behavior; provider-side Postgres TLS verification is an integration prerequisite,
not something this packet changes. Use a separate staging database and keys.

API/worker production boot also requires a verified **public burn wallet** address
in `BURN_WALLET_ADDRESS` (address placeholder only in the handoff). Use
`RECEIPTS_REGISTRY_ADDRESS` only after separately authorized contract deployment
and verified registry evidence; it remains unset until then. Never substitute a
dev wallet. `DEV_FEE_WALLET` is unnecessary here. `SESSION_SECRET`, `DEMO_SECRET`
and `HARNESS_KEY_PEPPER` are names only; generate and retain them out of band.
No user keys, burn-wallet key, registry-owner key, custody key, keeper, sweep key
or facilitator key belongs here. The receipts committer key, once authorized,
is scoped to that service and funded for gas only. Bot vendor credentials stay
absent while bots are unavailable. No direct model keys are provisioned.

Defaults: live trading false, allowlist required, nominal absolute trade ceiling
$25 (the config parser requires a positive ceiling), ops `trading_live` and
`swarm_ranking` false, product flags empty, fee 0 bps, no fee/tier activation date,
AI budget 0, paid daily/session RPC budgets 0, OAuth false and legacy/dev routes
off. `/v1/config` can show the nominal $25 cap while `liveEnabled=false`; every
order must still refuse with `trading_paused`. Do not set `TRADE_MAX_USD=0` (invalid).

Empty `FLAGS` only removes env overrides; it does not clear enabled DB rows. On
this dedicated staging database, after migrations and before ingress/workers:

```sql
BEGIN;
UPDATE feature_flags SET enabled = false;
INSERT INTO feature_flags(key, enabled, audience)
VALUES ('trading_live', false, 'public'), ('swarm_ranking', false, 'public')
ON CONFLICT (key) DO UPDATE SET enabled = false, audience = 'public';
COMMIT;
```

Verify all flags remain false via SQL and `/v1/config`; allow the flag cache's
10-second refresh or restart. Keep Guard V2 inactive/shadow and preserve existing
accepted V1 behavior; Railway configuration cannot accept Guard gates. Guard
§§7.2, 9.4 own version cutover/rollback. 063 owns Guard release manifests. Neither
a staging rollout nor a fast fixture qualifies an unaccepted heuristic for orders.

## TLS, origins and private simulation

Replace `app.staging.example.invalid` and the cookie-domain placeholder with the
approved neutral staging domain. API serves web from `/app/web` and `/v1` on the
same origin; no separate web process. Point Railway's HTTPS domain at port 8710,
require TLS externally, redirect HTTP, restrict staging access at ingress, and
forward WebSocket upgrades to `/v1/ws` without path rewriting. Preserve `/v1`,
SIWE cookie headers, original HTTPS scheme/host and a suitable WS idle timeout.
`PUBLIC_ORIGIN` is an exact HTTPS origin (no path/trailing slash) and
`SESSION_COOKIE_DOMAIN` must contain it. Keep Vite's default same-origin `/v1`;
never bake RPC URLs, keys or a private host into browser assets. Validate TLS,
CORS/SIWE nonce domain, secure cookies and WS ack from outside after authorization.

Only API has a public domain in this candidate. Future accepted MCP gets its own
TLS origin `https://mcp.<staging-domain>/mcp` (Streamable HTTP, preserve streaming
and auth headers, no buffering); OAuth discovery/issuer must match that origin
only after 097–099 acceptance. OG gets a separate accepted image route when 111
lands. Do not route those hosts to API placeholders or claim connector success.
Postgres, indexer, engines, reconciler and receipts get no public TCP/HTTP domain.

Keep Anvil on a compatible private VM with pinned Foundry binary/image version,
private volume and no public listener. Connect via an authenticated private tunnel
from Railway; if that private path is unavailable, simulations remain unavailable
and trading remains off. Anvil must fork via the existing **metered archive
client/gateway**, including upstream archive calls and retries in the shared
spend ledger; never use a direct paid `--fork-url` from this runbook. A deployable
metered archive gateway/private tunnel is not present in this candidate. Do not
start the fork until that prerequisite and its bounded acquisition budget are
separately authorized. Install the existing ArbSys mock per BACKEND §14.7, verify
chain 4663 and pinned block/hash, and run supported fork fixtures. No public-RPC
simulation fallback. Provider limits here constrain request budgets, not approve
spending. Public requests are also metered; do not launch backfill automatically.

## Separately authorized provisioning and deploy sequence

The following commands are a handoff for a connected operator. They were **not
run**. Installing/authenticating the Railway CLI, funding services, publishing an
image, creating resources, changing DNS and deploying each require explicit
external authorization. Check the installed CLI's `--help` for its pinned
version before use; provider-side config validation is still required.

```sh
railway init --name eko-staging
railway add --database postgres
# Repeat only for available, approved roles: api, indexer, engines, worker.
railway add --service api
railway add --service indexer
railway add --service engines
railway add --service worker
railway variables --service api --set 'APP_ROLE=api' --set 'RUN_WORKER=false'
```

1. Provision isolated Postgres **16**, volume and backup policy first. The database
   template must be verified as 16; reject another major. Disable public networking.
   Set resource caps, project/environment, exact config paths and all non-secret
   defaults before starts. Set scoped secret names through the secret store.
2. Build the pinned checkout with the existing root Dockerfile only after build
   authorization. Use `git rev-parse HEAD` and a clean reviewed tree to verify the
   source pin; the lead must also preserve this handoff bundle. Run the offline
   gates below. Retain its image digest and previous accepted image digest. Prefer
   importing the **same immutable image digest** for all roles using Railway's
   image-source setting (a registry publication is separately authorized):
   `railway add --service api --image "$CANDIDATE_IMAGE_DIGEST"` is the image-source
   alternative to creating the source service above, not a second API service.
   Do not independently rebuild different role images. If using Dockerfile source
   deployments, pin the checkout, verify all resulting image digests match and
   stop the release if they do not.
3. Keep public ingress restricted. Stop all writers and drain them. Start API alone
   against the staging DB with trading ceiling false and `RUN_WORKER=false`.
   API boot applies **server Drizzle → indexer → engines** migrations, then refreshes
   projections, before serving health. This candidate has no all-ledgers standalone
   migration entry in the image: `dist/db/migrate-cli.js` covers only server Drizzle
   and must not be mistaken for complete migrations. Migration-on-boot is the
   BACKEND §19 path. Indexer/engines rerun their own ledgers idempotently afterwards.
4. Record before/after `drizzle.__drizzle_migrations`, `eko_indexer_migrations` and
   `eko_engine_migrations` row IDs/hashes, timestamps and startup failure/success.
   Inspect pending SQL for additive compatibility with the retained image; require
   a tested forward fix for destructive changes. No down-migration on rollback.
   Snapshot/encrypted backup precedes migration; 084 proves restoration separately.
5. Apply and verify the ops-off SQL above. API health alone proves neither current
   indexed head nor Guard/trading readiness. API health is HTTP, workers have no
   HTTP probe. Restart exhaustion or absent progress is a failed rollout.
6. Start the singleton reconciler, then indexer, then engines one at a time. With
   zero RPC budgets, an indexer may halt rather than reach live readiness; this is
   an explicit **not accepted** staging state. Do not raise budgets or call it
   healthy to make the probe pass. Only separately approved metered live budgets
   may permit head following/enrichment; record cost, source watermark and lag.
7. Keep mcp/receipts/bots/og unprovisioned until their packets, compiled entries,
   secrets and role dispatch integration have landed and their own tests pass.
   075 supplies trade lifecycle; 080 receipts; 093 MCP; 116 Telegram. Never add a
   keeper, swarm/research job, burn job or unaccepted tool during this rollout.
8. For an authorized source deployment from the exact pinned clean checkout:
   `railway up --service api --detach`, then worker/indexer/engines sequentially
   after the preceding readiness checks. For image-source services, deploy the
   retained digest through that service's source setting instead. Capture actual
   Railway deployment IDs/revisions/digests from the service deployment details.
9. Run the read-only deployed smoke only after authorization:
   `node scripts/smoke-staging-railway.mjs --authorized-run "$STAGING_ORIGIN"`.
   It checks TLS origin, HTTP health, paused config/flags, SPA and WS radar ack;
   it does not exercise paid acquisition, signing, MCP, migrations or team trades.
   GO PLAN §9's authenticated/tool/receipt/scan/trade smoke is a separate acceptance
   run on the integrated candidate, not satisfied by this boot smoke.

## Rollback ordering and ten-minute target

Before any rollout, stage the previous image and redacted config so rollback does
not require a build. Verify it reads the candidate's additive schema and retains
receipt/proof history and journal ciphertext. A DB restore can lose later immutable
publications and is a distinct disaster-recovery procedure (084), not routine
application rollback. Never delete ledgers, receipts or revert migrations.

Start the rollback timer at the decision. Within the first minute set
`LIVE_TRADING_ENABLED=false` on API and worker and set both DB ops switches false;
verify config after the cache refresh/restart. Restrict ingress. Stop/drain engines,
indexer, receipts/bots if previously accepted, and the single reconciler; confirm
old role leases are released. Select the retained **previous deployment/image
and config** for API first, verify the three ledgers and health/config/SPA/WS,
then restart one worker, indexer and engines sequentially. Re-enable only services
already accepted in that previous release; keep trading/ops off. Restore MCP/OG
only if previously accepted and protocol/render probes pass. Never overlap writers
or rebuild during recovery. End the timer after required readiness and ingress
restoration; **less than 600 seconds** is the GO PLAN §9 target. Missing progress,
incompatible schema or a ten-minute overrun blocks acceptance; keep the ceiling
off and use the prepared forward-fix/incident procedure.

The offline rehearsal uses persistent disposable PGlite: two real application
boots, a rejected config, retained config recovery, all three migration ledgers
unchanged, immutable pending receipt retained, health/config and actual trading
refusal. Its timer measures failure-to-recovery; fixture setup is outside it. It
opens no ports, sends no provider request and costs $0 in provider charges. This
is **same-binary config rollback**, not a Railway deployment rollback, Postgres
restore, prior-release compatibility proof or live catch-up timing. The existing
role-image smoke additionally checks compiled CLI startup and SIGTERM/SIGINT,
fixture metered RPC and unavailable-role refusal without sockets/providers.
A full isolated Railway/prior-image rollback drill still requires authorization
and a retained earlier accepted release; record its real timing separately.

## Offline reproduction and evidence

```sh
pnpm test:staging
pnpm typecheck
pnpm test
pnpm brand:check
pnpm check:addresses
```

`pnpm test:staging` runs manifest rejection checks, smoke CLI offline HTTP/WS
fixtures and the isolated PGlite rollback. `pnpm test` also builds and runs the
existing `test:role-image` boot checks. No new dependency/install is required.
The validator checks our declared JSON subset and repository invariants; it has
not fetched Railway's schema or validated CLI/provider version behavior.

After an **authorized** run, retain a separate redacted evidence record:
source revision and handoff revision; image digest for every role; environment and
service deployment IDs; actual HTTPS URL; UTC start/end and rollback seconds;
resource caps; migration-ledger before/after and backup reference; HTTP/WS results;
worker lease/progress, indexed cursor/block hash/lag; accepted MCP/receipts/bot/OG
checks or explicit unavailable state; meter cost/coverage; remaining acceptance
gaps and approval reference. Never invent a deploy URL, batch ID, root, migration
result, approved gate or paid cost. Local fixture evidence belongs in the packet
implementation report, not in that live evidence record.
