# Task 093b · Main merge preparation

Candidate: uncommitted merge of branch HEAD `96c0205f469664b980763e70c72ba098f08ccb38` with main `afdd8c45eb7a9d7df55a068ba0be3d9d9227915e`. The lead started the merge. No Git metadata, index, refs, commit or deployment was changed by this session. Conflict **file contents** are resolved; the three unmerged index entries remain for the lead to stage.

## Resolutions and integration

- Preserve main's `apps/server/drizzle/0005_private_journal.sql` and `meta/0005_snapshot.json` byte-for-byte.
- Remove the branch's `0005_mcp_rate_limits.sql`; regenerate it as `0006_mcp_rate_limits.sql` with Drizzle against the combined schema. The SQL bytes match the prior MCP migration. `meta/0006_snapshot.json` points to main's 0005 snapshot and preserves every existing table; only `public.mcp_rate_limits` is added.
- Resolve `meta/_journal.json` by keeping main's entries through private journal 0005 and appending MCP 0006 with a later timestamp.
- Resolve `apps/server/test/harness-migrations.test.ts` with the complete 0000–0006 chain. Retain the existing main-0003 upgrade check; add a main-through-0005 upgrade check, including preservation of consent, agents, keys and migration ledger rows. Fresh and repeated migrations verify that both journal tables and writable MCP counters survive. No assertion was removed or weakened.
- `apps/mcp/src/runtime.ts` and `test/transport.test.ts`: pass the configured current destruction ledger into the merged HarnessService. This carries 092's restored-key authentication denial into MCP. A fixture proves an intact database key works before ledger destruction and is refused after it; malformed ledger state also denies access. Ledger provisioning/restore acceptance remains external, as in 092.
- `infra/railway/{staging.json,README.md}` and `scripts/check-staging-railway.mjs`: reflect the compiled MCP transport in the role inventory, keep it private/unprovisioned pending real 094/095 handlers, supply non-secret endpoint metadata and the pepper secret name, retain disabled OAuth/trading/paid defaults, and preserve the stale-availability rejection test in both directions. Role counts are derived rather than hard-coded. The catalog pin is the branch-parent baseline; the lead must pin the committed merge revision before any deployment.

Main's 068 engine migration 0121 and 092 private-receipt migration 0122 were retained by the automatic merge. No Guard logic, private-journal cryptography, execution logic, deployment or paid acquisition was added. No new dependency declarations, lockfile changes or TODO(spec) notes were introduced. Existing 093 ambiguities and downstream handler/client acceptance requirements remain in its implementation report.

## Validation

Prefix pnpm commands below with `pnpm_config_verify_deps_before_run=false` for the existing local dependency tree; no persistent setting was changed.

| Exact command/check | Exit | Result/log |
|---|---:|---|
| `pnpm --filter @eko/server exec drizzle-kit generate --name mcp_rate_limits` | 0 | Regenerated 0006; `/tmp/eko-093b-migration.log` |
| Byte/snapshot assertions against pinned main and original MCP SQL | 0 | Main 0005 unchanged; SQL identical; correct 0005 → 0006 link; previous tables unchanged |
| `pnpm --filter @eko/server exec vitest run test/harness-migrations.test.ts test/private-journal.test.ts test/staging-rollback.test.ts --testTimeout=30000 --hookTimeout=30000` | 0 | 11 tests, including fresh/main-0003/main-0005/repeated migrations; `/tmp/eko-093b-focused.log` |
| `pnpm --filter @eko/mcp test` | 0 | 14 tests; `/tmp/eko-093b-mcp.log` |
| `node scripts/check-staging-railway.mjs --self-test` | 0 | 14 invalid configurations refused; `/tmp/eko-093b-staging.log` |
| `pnpm typecheck` | 0 | Workspace; `/tmp/eko-093b-typecheck.log` |
| `pnpm test` | 0 | 125 Vitest files, 2376 tests; 33 contract tests passed with the existing RPC-unset fork test skipped; builds and role fixtures passed; `/tmp/eko-093b-test.log` |
| `pnpm brand:check` | 0 | 134 files; `/tmp/eko-093b-brand.log` |
| `pnpm check:addresses` | 0 | 341 source files; `/tmp/eko-093b-addresses.log` |
| `pnpm --filter @eko/server build && node scripts/check-role-image.mjs` | 0 | Explicit build completed; role fixtures including direct/dispatcher MCP shutdown passed; `/tmp/eko-093b-role-image.log` (role output), session 38308 (build output) |
| `git diff --check` and conflict-marker scan | 0 | Resolved file bodies; unmerged index entries intentionally retained |

The earlier 093 clean frozen-install limitation remains: this local dependency tree is not evidence of a clean install with a complete package store. No installation was needed for this merge.

## Lead handoff and evidence

Merge message: `/tmp/eko-093-merge-message.txt`, ending with the exact requested co-author trailer. The lead must stage the resolved 0005 snapshot, journal, migration test, deleted old MCP SQL, new 0006 SQL/snapshot, integration changes and this report, then commit the existing merge. Git's unmerged entries cannot clear until that authorized lead staging step; this session did not stage or edit metadata.

Checkpoint: `/tmp/eko-093b-checkpoint.json` records parents, resolution fingerprint, the index-stage fingerprint, running/completed sessions and logs, cost, and next action. The checks use migrated PGlite, HTTP injection, fake secrets, current-ledger fixtures and listener substitution. They do not establish real Postgres concurrency, public MCP/connector behavior, live chain coverage, a staging deployment, production restore acceptance, provider billing or release approval. Actual paid cost is **$0**; coverage percentage and live latency are not measured. No unaccepted tool or OAuth connector was enabled.

Final resolution SHA-256 (10 implementation/resolution files, excluding this report): `ee2997159a22afc989a28b9ecb49a2da37c4e406ed1bcd26fdb42fbc56e8d8e6`. Full-test session 86478 and explicit build/role-image session 38308 finished with exit 0. No check process remains running. The Git index-stage fingerprint is unchanged. No continuation is scheduled.
