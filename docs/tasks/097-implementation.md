# Task 097 implementation report

Candidate: `add2dd5502fedfb54ee31141ff0d4ce3c6200776` plus the uncommitted task 097 diff. No commit, push, deployment, publication, external messages, live chain calls or paid jobs were run. Provider calls and actual external cost: **0**.

The SHA-256 fingerprint of the eleven implementation/migration/config/test files listed below is `00375e730818fd60928d8ec4bf824c993d49ed2537137edec2347cefd643cd5a` (sorted relative path, NUL, file bytes, NUL). This report is excluded from that fingerprint.

## Changes

- `apps/mcp/src/oauth.ts`: protected-resource and authorization-server metadata; public DCR; exact callback matching; Untrusted client names; atomic, shared ten-registration sliding-hour IP budgets; registration audit records; verified local metadata-document snapshots; authorize validation and ten-minute persistent requests; expiry-aware internal consent read and cleanup.
- `apps/mcp/src/app.ts`: both protected-resource paths, authorization metadata, registration and authorize routes when the discovery service is explicitly injected; RFC 9728 bearer challenge; local errors until callback validation, then callback errors preserving valid state; OAuth endpoint throttling and no-store responses. Existing API-key transport behavior remains covered.
- `apps/mcp/src/runtime.ts`, `apps/mcp/src/index.ts`, `.env.example`: exports/configuration and inactive-state cleanup. Runtime deliberately does not inject discovery, rejects enabling OAuth, and reports `oauthEnabled: false` pending 098/099. Hosted connector fallback remains D0, with Claude Code API keys at T.
- `apps/server/src/db/schema.ts`, `apps/server/drizzle/0017_oauth_discovery.sql`, `apps/server/drizzle/meta/0017_snapshot.json`, `apps/server/drizzle/meta/_journal.json`: MCP-owned clients, requests and registration budgets; reserved migration 0017 only. No new dependency or lockfile change.
- `apps/server/test/harness-migrations.test.ts`: extended exact migration/snapshot expectations for 0017; retained all prior data-preservation assertions and added upgrade from main 0010 plus OAuth row persistence on rerun.
- `apps/mcp/test/oauth.test.ts`: ten offline tests covering discovery/challenge, API keys, public registration/auditing, exact callbacks, concurrent limits and rolling expiry, authorize validation and error redirects, duplicate/missing parameters, ten-minute expiry, verified metadata snapshots without fetching, changed allowlists, and disabled runtime.

Follows BACKEND §9.1/BE-3, §2.4 environment, §3 table ownership and §23 errata v1.2; FACTS §7 Untrusted/contracts and §5b connector fallback. T-GAP-ANALYSIS and Guard §10 ownership were respected; no Guard implementation or read-only spec was edited.

## Checks and checkpoint

All OAuth evidence is synthetic: in-memory PGlite migrations and Fastify request injection, without listening ports or providers. These results are implementation evidence, not MCP Inspector, deployed endpoint, or real connector acceptance.

| Command | Exit | Result |
|---|---:|---|
| `pnpm --filter @eko/server exec drizzle-kit generate --name oauth_discovery` | 0 | Generated schema delta; renamed generated files/tag to reserved 0017. |
| `pnpm --filter @eko/mcp typecheck` | 0 | Passed after fixing error-handler narrowing. |
| `pnpm --filter @eko/mcp test test/oauth.test.ts` | 0 | 10/10 tests passed. |
| `pnpm --filter @eko/mcp test test/oauth.test.ts test/transport.test.ts` | 0 | Final candidate: 24/24 tests passed; `/tmp/eko-097-mcp-test.log`. |
| `pnpm typecheck` | 0 | Initial entire workspace passed; `/tmp/eko-097-typecheck.log`. |
| `pnpm --workspace-concurrency=1 typecheck` | 0 | Implementation compiled before extending migration tests; `/tmp/eko-097-typecheck-final.log`. |
| `pnpm test` | 1 | Stopped at existing policy performance assertion: p95 87.16 ms versus 30 ms, during concurrent workspace typechecking; `/tmp/eko-097-test.log`. |
| `pnpm --filter @eko/policy test test/performance.test.ts` | 0 | Isolated performance reproduction passed; `/tmp/eko-097-policy-performance.log`. |
| `pnpm_config_workspace_concurrency=1 pnpm test` | 1 | Policy/engines/indexer passed; server stopped on four migration tests expecting the previous nine-entry ledger. Updated to ten entries, retained earlier assertions, and extended migration coverage; `/tmp/eko-097-test-serial.log`. |
| `pnpm --filter @eko/server test test/harness-migrations.test.ts` | 0 | Final migration reproduction: 6/6 passed; `/tmp/eko-097-migrations.log`. |
| `pnpm --filter @eko/server typecheck` | 0 | Passed after extending migration tests; `/tmp/eko-097-server-typecheck.log`. |
| `pnpm_config_workspace_concurrency=1 pnpm test` | 0 | Stable final candidate comprehensive gate passed: all workspace suites, web/server builds and role-image fixture checks; `/tmp/eko-097-test-final.log`. |
| `pnpm typecheck` | 0 | Final candidate entire workspace passed; `/tmp/eko-097-typecheck-candidate.log`. |
| `pnpm brand:check` | 0 | Passed after builds, 145 files. |
| `pnpm check:addresses` | 0 | Passed, 384 source files. |
| `git diff --check` | 0 | Passed. |

Final-test checkpoint: candidate fingerprint above; full gate completed with exit 0. The TypeScript suites passed 2,599 tests; Foundry passed 33 with one existing skip. Builds and role-image fixture checks passed. Final whole-workspace typecheck completed with exit 0. All processes completed; next action is lead review/commit. No further checks or jobs are running. External cost: 0; live acceptance coverage: none.

## TODO(spec) and dependencies

Every new TODO(spec):

1. `apps/mcp/src/oauth.ts`: §9.1 does not define verified CIMD intake. Only reviewed local snapshots keyed by exact HTTPS document URLs are accepted; arbitrary caller URL fetching is unavailable. This intentionally narrows the spec's fetched-document wording in accordance with this packet's no-arbitrary-fetch requirement. Task 099 must validate the real client's document/intake behavior.
2. `apps/mcp/src/app.ts`: §9.1 specifies DCR's hourly limit but gives no separate discovery/authorize budget. Prepared routes use 60 requests/minute/IP pending connector evidence.

Remaining dependencies: apply migration 0017 through the existing migration role before MCP startup; 098 provides SIWE consent/code/grant storage and UI; 099 provides token/refresh/revoke, scope-filtered bearer auth, lifecycle integration, MCP Inspector and deployed real Claude connector evidence. Its lifecycle must touch client last-use on token activity. The pack owner (096/099) must preserve the documented D0 fallback until the complete gate passes. Configured callback strings and metadata documents here are fixtures/spec inputs, not live verification. No personal identifiers were ported or added.

Reproduce offline implementation checks with the exact focused commands above. Reproduce the resource-sensitive full gate with `pnpm_config_workspace_concurrency=1 pnpm test`; the setting applies only to that invocation and does not modify repository or global configuration.
