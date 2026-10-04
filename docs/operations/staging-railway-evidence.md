# Railway staging: first deployment evidence

Redacted evidence record for the first authorized Railway staging rollout
(infra/railway/README.md, "After an authorized run"). Staging only; production
remains Vultr/BitLaunch. No secret values, credentials or personal identifiers
are recorded here.

The run below is **historical**. It does not establish current live source,
bundle, image or configuration identity for audit Path item 1. The identity
implementation and independent verification instructions are now available;
current live results remain pending for the lead/reviewer to fill.

## Run

| Field | Value |
|---|---|
| Date (UTC) | 2026-10-03, 14:31–14:45 |
| Authorization | Owner request in the launch-push session of 2026-10-03 (create the EKO Railway project and staging domain) |
| Railway project | `eko-staging`, environment `production` (the project's only environment; it is staging) |
| Source revision | `08d8566863f790caebe1e2f90b0011bc7727e73c` (clean detached checkout, `git status` empty) |
| Handoff revision | `infra/railway/` at the same revision |
| Public origin | https://app.staging.ekoterminal.com (TLS certificate valid; CNAME to the Railway edge plus a `_railway-verify` TXT record) |
| Plan | Railway trial; no paid plan or spend approved |

## Services

| Service | Source | Deployment | Image digest | State |
|---|---|---|---|---|
| Postgres | `ghcr.io/railwayapp-templates/postgres-ssl:16` (16.15) | `9ed82c07-7e50-487d-8e82-37b08ccb63b4` | template image | running; private network only, no TCP proxy; 500 MB trial volume |
| api | root `Dockerfile`, `node dist/launch.js`, health `/v1/health` (120 s) | `433f033b-28fc-4ec2-b8a5-f0700832c9cd` | `sha256:e75559db962adc386c6540330cd1eef0b0eaff4995233995325a0f1668837e7f` | running, `RUN_WORKER=false`, one replica |
| worker | root `Dockerfile`, `node dist/launch.js` | `07dcb202-96f7-458b-856c-72f999d76774` | `sha256:e89c2731cc47ba8d3831182a2b403d8fb3a4a2ba91f115b3e88dcb860b084cc4` | running, `EKO worker ready`, one replica |
| indexer, engines | not provisioned | | | zero RPC budgets would halt them; not started |
| mcp, receipts, bots, og | not provisioned | | | MCP/receipts are compiled but unaccepted here; bots/og are unavailable image roles |

The Railway Postgres template defaulted to major version 18. The handoff requires
16, so the service image was switched to `postgres-ssl:16` and the empty volume
recreated before any application connected.

Railway no longer accepts config-as-code files for new services, so the settings
in `infra/railway/api.json` and `worker.json` (Dockerfile build, start command,
one replica, `ON_FAILURE` with 3 retries, the API health probe) were applied as
service settings through the Railway API.

## Configuration

`commonEnvironment` plus each role's `environment` from `infra/railway/staging.json`,
with these replacements:

- `PUBLIC_ORIGIN=https://app.staging.ekoterminal.com`, `SESSION_COOKIE_DOMAIN=staging.ekoterminal.com`
- `DATABASE_URL` is a Railway reference to the Postgres service's private URL.
- `SESSION_SECRET`, `DEMO_SECRET` and `HARNESS_KEY_PEPPER` were generated out of band
  (32 random bytes each), set on api and worker, and never printed.
- `BURN_WALLET_ADDRESS` is the conventional public burn address
  `0x000000000000000000000000000000000000dEaD` as a staging placeholder, because boot
  requires a burn address and fees are 0 with trading off. **TODO(owner):** replace it
  with the verified EKO burn wallet before any fee or burn path is enabled.

Defaults hold: live trading false, allowlist only, $25 nominal ceiling, fee 0 bps,
AI budget 0, paid daily and session RPC budgets 0, OAuth and legacy/dev routes off.

## Checks

| Check | Result |
|---|---|
| Boot | api: `EKO server ready`, `liveTrading=false`, `aiProviders=[]`; worker: `EKO worker ready` |
| `GET /v1/health` | `{"ok":true}`, paid RPC closed, budget 0 |
| `GET /v1/config` | every product flag false, `trading.liveEnabled=false`, `maxTradeUsd=25`, receipts registry unset |
| `node scripts/smoke-staging-railway.mjs --authorized-run https://app.staging.ekoterminal.com` | `health ok`, `trading paused`, `flags off`, `spa html`, `websocket radar-ack` |
| Ops-off SQL | not run: the `feature_flags` table is empty on this fresh database, and the flag service treats missing rows as off (`apps/server/src/flags/service.ts`); `/v1/config` confirms. Running the SQL needs a database shell (`railway ssh`), which needs an SSH key registered on the account. |

## Gaps (not accepted)

- **Image digests differ.** api and worker were built separately from the same
  clean checkout; the Dockerfile build is not byte-reproducible, so their digests
  differ. The handoff requires one immutable digest for all roles: publish one
  image to a registry and point both services at it (registry publication needs
  separate authorization).
- **Migration ledgers** were not read (no database shell). API boot applied the
  server, indexer and engines migrations and reported ready; record the three ledgers
  once shell access exists.
- **Sanctions source:** the worker logs `Sanctions dataset refresh failed` because
  `OFAC_SDN_URL` is unset. Trading stays unavailable without it.
- **Ingress restriction:** staging is publicly reachable; Railway has no built-in
  access gate for this service.
- **Resource ceilings:** trial-plan defaults apply; the handoff's 2 CPU / 4 GiB /
  20 GiB Postgres and 1–2 GiB service ceilings need a paid plan.
- **Backups, alerting and the rollback drill** (084, 085) are not yet configured
  on Railway.
- No indexer or engines, so no indexed head, lag, Guard or receipt evidence.

## How to verify

Follow `infra/railway/README.md` → "How to verify" from an independent clean
checkout of the candidate. Before any separately authorized `railway up`, the
lead sets `EKO_SOURCE_REVISION` on **both** API and worker to that checkout's full
SHA. The Dockerfile accepts it as an ARG and bakes it beside deterministic hashes
of every executable role/entry bundle. No git metadata is needed in the image.
Changing a runtime revision variable cannot rewrite the baked identity.

```sh
node scripts/verify-staging-identity.mjs "$STAGING_ORIGIN" --revision "$REVISION" \
  --expected-config /private/tmp/staging-reviewed.json \
  --worker-identity /private/tmp/staging-worker-ready.json
```

The reviewed non-secret config uses `staging.json`'s catalog shape with accepted
overrides (including the public burn address); retain secret names only. The
default template intentionally lacks a production burn address. Keep the copy
outside the clean checkout. The worker file contains `{msg:"EKO worker ready",
identity:…}` from the **current** deployment's logs, retrieved independently with
read-only Railway access. The verifier rebuilds locally, fetches only
`GET /v1/build`, and compares revision, every bundle/aggregate digest and parsed
allowlisted config digests for both roles. A mismatch exits non-zero. `/v1/health`
is unchanged; smoke additionally checks the build identity's shape, which alone
does not prove equality. The verifier reports worker `not-checked` if its log is
not supplied.

Independently inspect each deployment's immutable image digest and baked manifest
against actual bundle bytes, plus its role settings and one-worker lease. Use the
digest-pinned read-only image inspection command in the runbook where image access
is available; retain unavailable image access as a gap. Reported identities and
operator-provided logs alone cannot prove arbitrary operator code is authentic.
Reproducible bundles do not prove whole OCI image equality. Retain the three
migration-ledger IDs/hashes/timestamps and separate DB flags/ops checks: the
host-config allowlist excludes secrets, URLs, cookies, keys and mutable DB state.
No live requests, rollout, image publication or database reads were performed by
this implementation task.

| Current candidate evidence (lead/reviewer to fill) | Result |
|---|---|
| Audited candidate SHA / clean checkout / lockfile | pending |
| Read-only verifier API verdict and retained JSON | pending |
| Current worker ready identity / verifier verdict / deployment time | pending |
| Independently retrieved API deployment ID / immutable image digest / byte check | pending |
| Independently retrieved worker deployment ID / immutable image digest / byte check | pending |
| Reviewed non-secret config / configVersion / per-role config digests | pending |
| Actual API/worker role settings / replicas / exclusive worker lease | pending |
| Server, indexer, engines migration ledgers and schema compatibility | pending |
| Paused config / DB product flags and both ops switches off | pending |
| Remaining image access, differing images or other verification gaps | pending |

## Verified deployment: 2026-10-03, 21:42 UTC

The current staging deployment is the audited candidate. The identity was checked
read-only with the verifier above from a clean checkout of the same revision.

| Field | Value |
|---|---|
| Source revision | `3f872fe80ac32e23ffdc245ad11ec85f7ff178df` (main) |
| api deployment / image | `89167d09-476b-4416-8809-5f13d63571fa` / `sha256:2350c889cd395eb7ef6285af6218ae6c0415ca2c8ad4dcb3a7658fcd3aca339d` |
| worker deployment / image | `dde7ebf3-5fc6-4e46-b250-c95c57b99a0a` / `sha256:28fc8a881703ff0710afad3b2de2b9e843036ce5cf073be3d80902b3fc5703dd` |
| Bundle digest (both roles) | `c6d30cc8135c76ae97c1d529dbe0fa320b418751f282721f7db72508cc1d27da` |
| api config digest | `7ca370e811f16532011401076686c92970d1f62ac9af9d14886524061529c029` |
| Verifier | `staging_identity_verified`: api **matched**, worker **matched** (revision, every bundle digest, allowlisted configuration digest) |
| Smoke | health ok, identity present, trading paused, flags off, SPA html, WebSocket radar ack |
| Proxy trust | `TRUST_PROXY_HOPS=1` (Railway edge) on api and worker |
| Rollout | api first; the old worker deployment removed (`railway down`) before the new worker started, so the singleton lease was never contended |

Reviewed configuration: `staging.json` with the accepted overrides `PUBLIC_ORIGIN=https://app.staging.ekoterminal.com`,
`SESSION_COOKIE_DOMAIN=staging.ekoterminal.com`, `TRUST_PROXY_HOPS=1` and the staging placeholder burn address
`0x000000000000000000000000000000000000dEaD` (TODO(owner): the real burn wallet). Server migrations through
0044 and engine/indexer migrations through 0180 applied at api boot. The api and worker images are separate
Dockerfile builds of the same revision; their bundle bytes match, their image digests differ (non-reproducible
layers), and publishing one image to a registry for both roles remains an owner decision.

### Redeployed and re-verified: 2026-10-03T21:58Z

Staging moved to `b44909fad35e6f8df3c79422ae46e5c0162a757e` (main after the coverage and Guard 062 merge). Same rollout
(api first; old worker removed before the new one started) and the same read-only verifier: api **matched**, worker
**matched**.

| Field | Value |
|---|---|
| api deployment / image | `a6b08d2f-6478-4dfa-9072-73de6b2b5d7d` / `sha256:e8326b967d904e5f5ce9b953556b8977c4fb25c8595975c7862edb4f6803e6ba` |
| worker deployment / image | `4bdd8262-2c7a-4373-9974-7157d74ebb6e` / `sha256:ff46f56bfb0a03cbb4fd8b34645acfa7cf178ef8e14f8c3f3dcaf59d88435495` |
| Bundle digest (both roles) | `bbfab1f345996318b9a6a803be9251602b957c8085c1053db671104d8c4e30fe` |
| Smoke | health ok, identity present, trading paused, flags off, SPA html, WebSocket radar ack |

### Redeployed and re-verified: 2026-10-03T23:25Z

Staging moved to `249510f2ce967f984bb0be10a8cca1b3e51a3d93` (main after Guard 063/064/050 and the Telegram coverage merge).
Same rollout and verifier: api **matched**, worker **matched**; smoke all green.

| Field | Value |
|---|---|
| api deployment / image | `155d0221-8bca-4773-a575-82b0c67f24c5` / `sha256:7a3c0eec1ff90245e8d54abd07f00d0f4fa3a46baa7642f19402e0edcfe200c9` |
| worker deployment / image | `d6eabead-b9f2-449b-9953-f7a7f68e9ff6` / `sha256:52275153431e2b28aa5cfb9c423256871fe86c62ef3a4fcd91ab81fc68f676bf` |
| Bundle digest (both roles) | `f5377b5f81043e7d78001b0f24940b6108c2d17d69c81aed917102f6e081d659` |

### Redeployed and re-verified: 2026-10-04T01:19Z

Staging moved to `23976fc07b67550610bcc5206ca4286ffe349076` (main after the performance budgets, launch browser gate and
coverage-worker merge). Same rollout and verifier: api **matched**, worker **matched**; smoke all green.

| Field | Value |
|---|---|
| api deployment / image | `f5ac22b2-3741-478a-8b6f-14b47a6d6e25` / `sha256:ab23992d2a27fb0db9f4b851785955e90ce8a478fa8221d05aacde3b8acacce4` |
| worker deployment / image | `8bdbf207-97d0-4d87-8f89-8416b3f1db38` / `sha256:cc84f8158833724d8d783a3e1cc5059e6a6ffaeae8c0f8753ad9d8c995b50713` |
| Bundle digest (both roles) | `c09f513c5be82ac2703a574615821b03dd93ff9552975a3dd90e040c9581428e` |
