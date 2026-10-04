# Task 093 · MCP transport implementation

Candidate: uncommitted worktree changes on HEAD `c6732b24f75656c81e7c0ac0272e7e103f6bf4a4`. Implementation SHA-256 (all 24 changed implementation files; excludes this report): `5ed7f88147dc3694a247643058de21eea11492d23942c66e5c21c39d41eaf5d0`. Completed process state is recorded in `/tmp/eko-093-checkpoint.json`. No commit, push, deployment, publication, external message, paid job, or live-chain request was performed. Actual paid cost: **$0**.

## Changes and spec

Followed BACKEND §§9.1–9.4 and 21.4, FACTS §7, and Guard 2.0 §§7.1–7.2 and 10. Transport outputs retain the shared V1 contracts; no inactive/shadow Guard V2 logic or release decision was changed.

- `apps/mcp/package.json`, `tsconfig.json`, `src/{app,tools,limits,runtime,cli,index}.ts`, and `test/transport.test.ts`: stateless Streamable HTTP at `/mcp`, initialize negotiation (2025-11-25/2025-06-18), ping, tool discovery/calls, and 202 acknowledgments for notifications/results. GET and DELETE return authenticated 405 responses because there is no server stream or session. Reject malformed JSON/envelopes, batches, unsupported versions, unacceptable media types, foreign origins, query credentials, and oversized bodies.
- Reuse packet 091's HMAC/constant-time key authentication on every request. Require an active agent, bind account/agent/key in handler context, and overwrite optional preflight `agentId` with the key's agent. Cookies do not authorize MCP. Revoked keys, paused agents and disconnected agents cannot call or discover tools.
- `ToolRegistry.register(name, handler, allowed?)` is the injectable, typed interface for packets 094/095. It validates both inputs and shared outputs, rechecks discovery/call permissions, and binds journal output attribution. Only registered T handlers appear. The executable defaults to an empty registry until those packets supply real handlers; no fixture handler is installed in production. Handler context includes entitlement tier, real-time/60-second freshness cut, and shutdown signal. Data consumers must honor that freshness cut.
- Successful results contain typed `structuredContent`, fixed templated `content`, and the exact Untrusted notice. Third-party fields never enter the content template. Handler/parser errors are bounded and withhold raw details; request logging is disabled and authorization/cookie headers are redacted.
- `apps/server/src/db/schema.ts`, `drizzle/0005_mcp_rate_limits.sql`, `meta/0005_snapshot.json`, and `meta/_journal.json`: shared atomic rate counters for 600/min IP and key control limits plus §9.4 tier/tool-group limits. Store only HMAC subjects; prune expired counters. The new snapshot preserves every prior table. MCP requires this separately applied API migration and refuses startup when it is absent.
- `apps/server/src/harness/entitlements.ts`, `http/v1/{account,config}.ts`: extract the existing packet 090 entitlement/phase projection without changing its behavior, and preserve previous imports via re-exports. Launch access stays real-time, without inventing a paid tier or unlimited quota.
- `apps/server/build.mjs`, `src/roles.ts`, `Dockerfile`, `scripts/check-role-image.mjs`, `scripts/fixtures/role-image-fastify.mjs`, and `apps/server/test/{roles,harness-migrations}.test.ts`: bundle and dispatch the MCP process, copy its manifest before frozen image installation, and verify migrated offline startup and shutdown through direct and dispatcher entry points. Update the migration-chain assertion for the additive migration; no existing assertion was removed or weakened.
- `pnpm-lock.yaml`: add the MCP workspace using existing locked dependencies. No dependency upgrade or new external package. Native Fastify implements the bounded Streamable HTTP transport; the spec-named MCP SDK is not cached in this sandbox and was not fetched.

OAuth remains disabled: no OAuth routes, protected-resource metadata, authorization-server metadata, or OAuth token acceptance. Its 401 challenge does not advertise an unavailable authorization server. `MCP_OAUTH_ENABLED=true` is refused until packets 097–099 replace this unavailable state with an accepted implementation. D0/Drop tools cannot be registered through this T-only registry, even if unrelated flags are enabled.

## Checks and reproduction

For pnpm checks below, prefix commands with `pnpm_config_verify_deps_before_run=false` in this locally restored dependency tree. This is a per-command setting; no global or repository configuration was changed.

| Exact command | Exit | Evidence |
|---|---:|---|
| `CI=true pnpm install --offline --no-frozen-lockfile` | 1 | `/tmp/eko-093-install.log`; missing locked font tarball, no network fallback |
| `CI=true pnpm install --offline --lockfile-only --no-frozen-lockfile` | 0 | `/tmp/eko-093-lockfile.log`; importer-only lockfile change |
| `pnpm --filter @eko/server exec drizzle-kit generate --name mcp_rate_limits` | 0 | `/tmp/eko-093-migration.log`; additive 0005 |
| `pnpm --filter @eko/mcp typecheck` | 0 | `/tmp/eko-093-focused-typecheck.log`; final MCP source/tests |
| `pnpm --filter @eko/mcp test` | 0 | `/tmp/eko-093-focused.log`; 13 tests |
| `pnpm --filter @eko/server exec vitest run test/v1-agents.test.ts test/harness-migrations.test.ts test/roles.test.ts test/v1-account.test.ts --testTimeout=30000 --hookTimeout=30000` | 0 | `/tmp/eko-093-server-focused.log`; 56 tests |
| `pnpm typecheck` | 0 | `/tmp/eko-093-typecheck.log`; workspace, supplemented by final MCP typecheck after its last protocol/test changes |
| `pnpm test` | 0 | `/tmp/eko-093-test.log`; 119 Vitest files, 2339 tests; 33 contract tests passed and 1 existing fork test skipped because RPC is unset; builds and role-image fixtures passed |
| `pnpm brand:check` | 0 | `/tmp/eko-093-brand.log`; 15 files |
| `pnpm check:addresses` | 0 | `/tmp/eko-093-addresses.log`; 331 source files |
| `git diff --check` | 0 | Tracked whitespace check |

The required offline install removed dependency links before failing on an uncached font tarball. Restored local links from the existing checkout, pointing workspace dependencies at this candidate's source. A full clean `pnpm install --frozen-lockfile` remains unverified and requires a complete store in lead/CI; the offline lockfile update is not evidence of a clean install.

Initial focused failures were corrected: shared address/hex transforms need wire-input JSON Schema emission, and Fastify requires a LogController instance. Type errors in the fake signal interface were also corrected. These are completed repairs, not remaining blockers.

## TODO(spec) and dependencies

New TODO(spec) notes:

1. `apps/mcp/src/tools.ts`: §9.3 does not freeze `census_summary`/`receipts_lookup` inputs or the `playbook_match` structured envelope. Use empty census input, `{id}` receipt input, and `{playbooks}` output.
2. `apps/mcp/src/app.ts`: launch-week tool quotas are not separately specified. Keep published Listener rates (30/min Senses, 60/min preflight and journal), while honoring launch real-time entitlements.

Preserved TODO(spec) notes moved with the shared entitlement service:

3. `apps/server/src/harness/entitlements.ts`: agent quotas require an explicitly configured launch limit; unset remains 0/unavailable.
4. Same file: accepted token-tier/trial behavior is pending; after tier activation the existing Listener fallback remains.

Remaining integration: packets 094/095 register actual Senses, preflight and journal handlers, including freshness enforcement and real first-call/activity attribution. Packet 092 owns encrypted journal storage. OAuth/connector gates remain 097–099. Apply API migration 0005 via the normal migration path; configure an approved launch agent quota, HTTPS `MCP_PUBLIC_URL` ending `/mcp`, allowed `PUBLIC_ORIGIN`, and a private runtime `HARNESS_KEY_PEPPER`. Production requires Postgres. No secret value is included in this report or repository.

Evidence is migrated PGlite, injected HTTP, fake runtime secrets, and mocked listener/signal fixtures. No real Postgres concurrency, MCP Inspector/client interoperability, public connector reachability, live chain coverage, provider billing, browser session, release acceptance, or deployment was measured. Coverage percentage and live latency are not measured. No unaccepted feature was enabled.

Final checkpoint: full-test process 59343 completed with exit 0. Web/server production artifacts, including `dist/mcp.js`, were built by that gate. Direct and dispatcher MCP fixture startup/SIGTERM shutdown both passed. No check process remains running. Next action is lead review/commit and downstream handler integration; no continuation is scheduled.
