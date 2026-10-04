# Packet 083 implementation handoff

Prepared and fixture-tested only. No commit, provisioning, deployment, publication,
paid job, live chain access or external message was performed. No personal
identifiers or real secrets were added; no source identifiers needed replacement.
The lead commits the worktree. No dependencies, lockfile, application runtime,
read-only specs, Guard design or prototype changed.

Application source candidate: `c6732b24f75656c81e7c0ac0272e7e103f6bf4a4`, plus
uncommitted packet 083 staging artifacts. `infra/railway/staging.json` pins that
application source; later integrated runtime changes require a new pin and gates.
No actual Railway URL, deployed revision, image digest or live migration evidence
exists for this packet.

## Changes

- `infra/railway/staging.json`: operator inventory for API/web, Postgres 16,
  indexer, engines, exactly one reconciler, gated MCP/receipts/bots/OG and private
  off-Railway simulation host; per-role secret names, initial resource ceilings,
  readiness checks and trading/ops/AI/paid-RPC-off defaults.
- `infra/railway/{api,indexer,engines,worker,mcp,receipts,bots,og}.json`: role
  config-as-code definitions using the existing Dockerfile and dispatcher. Only
  API has an HTTP probe; unavailable services remain unprovisioned.
- `infra/railway/README.md`: separately authorized provisioning/deploy commands,
  immutable candidate/previous-image retention, TLS/origin/WS routing, private
  Anvil/metered upstream prerequisite, migration ordering and rollback procedure.
- `scripts/check-staging-railway.mjs`: offline manifest/inventory/image-role
  validation and 14 rejection cases (spending, ops/flags, secrets, replicas,
  availability, TLS-independent private-service constraints and image config).
- `scripts/smoke-staging-railway.mjs`: read-only HTTPS health/config/SPA/WS smoke;
  offline fixtures exercise HTTP refusal and WS hello/subscription/ack. Deployment
  invocation requires separate authorization and an explicit CLI mode.
- `apps/server/test/staging-rollback.test.ts`: actual isolated application boots
  on persistent disposable PGlite, rejected configuration and retained-config
  recovery; unchanged server/indexer/engine ledgers and immutable pending receipt,
  paused trading refusal, no flags/ops, no network or sockets.
- `package.json`: `test:staging`; manifest and smoke fixture checks included in
  `pnpm test`. Existing compiled boot smoke remains part of that gate.

Followed BACKEND §19 (single role image, boot migrations and production host),
GO PLAN §§4, 7, 9 (infra/secret boundaries, staged rollout and rollback target),
task 017's lead deployment handoff, and 082/082b's existing dispatcher/boot
checks. Reviewed the launch gap analysis; Guard §§7.2, 9.4 keep active version
selection and acceptance with Guard packets. No Guard logic was duplicated.

## Validation checkpoint

| Exact command | Exit | Evidence |
|---|---:|---|
| `node scripts/check-staging-railway.mjs --self-test` | 0 | Eight configs and inventory valid; 14 invalid configurations rejected. |
| `pnpm test:staging` | 0 | Manifest and HTTP/WS fixture checks; one persistent-PGlite rollback test. Recovery **74 ms**, target less than 600,000 ms. |
| `pnpm typecheck` | 0 | Workspace typechecks passed. |
| `pnpm test` | 0 | 119 Vitest files / 2,328 tests; 33 contract tests passed, one existing conditional fork skip; web/server builds and every compiled direct/dispatcher boot, shutdown and startup-refusal check passed. Rollback fixture recovered in **303 ms** in this run. |
| `pnpm brand:check` | 0 | 134 files, including the full gate's built web assets. |
| `pnpm check:addresses` | 0 | 324 source files. |
| `git diff --check` | 0 | Tracked diff clean; added files also checked for trailing whitespace. |

The focused command initially exited 1 because the test expected a reported cap
of zero while 073 reports the nominal $25 ceiling with `liveEnabled=false`.
Corrected that new fixture assertion to the existing contract and added an actual
`trading_paused` refusal assertion; the corrected focused run exited 0. No
existing assertions or tests were removed or weakened.

Logs: `/tmp/eko-083-focused.log`, `/tmp/eko-083-typecheck.log`,
`/tmp/eko-083-test.log`. Completed full-gate checkpoint: session `46788`, exit **0**, source candidate
above plus this worktree. Typecheck session `60373` and final standalone
brand/address/whitespace session `8974` exited **0**. No job remains running.
Next action: lead review/commit; separately authorized provisioning and prior-image
rollback evidence when the integration prerequisites are present. The completed
full gate was not restarted. Actual provider cost
**$0**. All RPC/HTTP/WS inputs are fixtures; no real chain/provider coverage.

## Limits, dependencies and reproduction

The 74 ms rehearsal is **same-binary config recovery**, not prior-image rollback,
real Postgres restore, Railway control-plane timing or live head catch-up. Full
cross-release isolated rollback needs an authorized environment and a previous
accepted digest. The manifest checker validates the repository's small declared
subset; provider-side schema/CLI validation and resource-setting application have
not run. The web/server bundles were built by the full gate; no container was built or
executed in this packet.

082 is present. MCP 093, receipts 080, bots 116 and OG 111 still need their runtime
entries integrated into the one image/closed dispatcher before provisioning;
079's durable outbox is preserved. 075 trade lifecycle and its prerequisite gates
remain independent. 084 backup/restore, 085 monitoring/status, authorized provider
budgets, domain/TLS setup, secret provisioning, contract deployment/funding and a
private metered archive gateway/tunnel for Anvil remain external prerequisites.
Zero RPC budgets intentionally cannot establish a healthy live indexer. No
staging/launch/Guard gate is claimed approved.

New `TODO(spec)` (in the runbook): Railway is requested for staging; production
remains Vultr/BitLaunch per the launch spec until an explicit decision changes it.
No other new spec ambiguity or application feature was introduced.

Reproduce offline with:

```sh
pnpm test:staging
pnpm typecheck
pnpm test
pnpm brand:check
pnpm check:addresses
```

Authorized connected-operator commands and the migration/rollback order are in
[the runbook](../../infra/railway/README.md). Actual deployment evidence must be
recorded separately after that authorized run, using its evidence checklist.
