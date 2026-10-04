# Task 091b merge preparation

Candidate: branch HEAD `a26304b` merged with main `ffd610a`, prepared without a commit. The native `git merge main` exited 128 before changing files because the sandbox cannot create `ORIG_HEAD.lock` in the shared Git worktree metadata. A sandbox-local Git directory at `/tmp/eko-091-merge-git` holds the merge index and state. Its merge stopped on the four expected conflicts, all now resolved. The actual branch index and merge state have not been changed.

## Resolutions

- `apps/server/src/app.ts`: retain both HarnessService and trade-access imports, construction and context fields. Preserve trade configuration auditing, ExecutionService access controls, agent services and owner-scoped WebSocket authentication. Main's receipt-outbox integration was retained by the automatic merge.
- `apps/server/src/http/v1/index.ts`: preserve the optional AgentServices parameter and agent-route registration alongside TradeAccessService creation, trade-admin routes and main's config-route arguments.
- `apps/server/drizzle/meta/0003_snapshot.json`: use main's snapshot byte-for-byte. Main's `0003_trade_access.sql` is also unchanged.
- `apps/server/drizzle/meta/_journal.json`: retain all main entries through 0003 and append 0004 with an increasing timestamp. Regenerated `0004_harness.sql` and `meta/0004_snapshot.json` with `pnpm --filter @eko/server exec drizzle-kit generate --name harness`; the new snapshot's `prevId` is main 0003's `id`, and it includes both feature schemas. Harness SQL is byte-identical to the branch's original 0003 SQL apart from its filename. Removed the old `0003_harness.sql`; updated migration references in the historical 091 implementation report.
- `apps/server/test/harness-migrations.test.ts`: verify a fresh database, a database already migrated through main 0003 with existing allowlist data, and repeat migration runs. Both paths retain trade access and accept harness data. Tests use offline PGlite, not production PostgreSQL.

No new TODO(spec), dependency declarations, upgrades or feature acceptance was introduced. No specs or prototype were edited. No paid job, live chain acquisition, commit, push or deployment was performed; actual paid cost $0.

## Checks

Prefix pnpm commands in this restored local dependency tree with `pnpm_config_verify_deps_before_run=false`; no repository/global setting was changed.

| Command | Exit | Log/result |
|---|---:|---|
| `pnpm --filter @eko/server exec drizzle-kit generate --name harness` | 0 | Main 0003 preserved; harness 0004 regenerated |
| `pnpm --filter @eko/server exec vitest run test/harness-migrations.test.ts test/v1-agents.test.ts test/trade-access.test.ts --testTimeout=30000 --hookTimeout=30000` | 0 | 17 tests; `/tmp/eko-091b-focused.log` |
| `pnpm typecheck` | 0 | `/tmp/eko-091b-typecheck.log` |
| `pnpm test` | 0 | 117 Vitest files, 2306 tests, contract tests, builds and role-image checks; `/tmp/eko-091b-test.log` |
| `pnpm brand:check` | 0 | 124 files; `/tmp/eko-091b-brand.log` |
| `pnpm check:addresses` | 0 | 319 source files; `/tmp/eko-091b-addresses.log` |
| `pnpm --filter @eko/server build && node scripts/check-role-image.mjs` | 0 | Explicit build and role-image run completed; `/tmp/eko-091b-role-image.log` |
| Temporary merge index conflict/whitespace checks | 0 | No unmerged entries; `git diff --cached --check` clean |
| `sh -n /tmp/eko-091-install-merge-state.sh` | 0 | Handoff script syntax checked; not executed |

The fixture checks do not establish deployed operation, production Postgres concurrency, chain coverage, provider billing or release approval. The checkpoint `/tmp/eko-091b-checkpoint.json` records revisions, completed process/logs and the lead handoff. Full-test session 85348 and explicit role-image session 34126 both finished with exit 0; no check process remains running.

## Lead handoff

Commit message: `/tmp/eko-091-merge-message.txt`, ending with the requested co-author trailer.

Because the sandbox cannot write the real Git metadata, the lead must first run `sh /tmp/eko-091-install-merge-state.sh` from this worktree outside the restricted sandbox. It checks the branch revision and that the pinned main revision remains an ancestor of current main, rejects existing staged changes or merge state, verifies the prepared tree is unchanged and conflict-free, copies only new loose Git objects and installs the prepared index and merge-state files. It does not commit or change refs. Review `git status`, then commit with `git commit -F /tmp/eko-091-merge-message.txt`. The script has only been syntax checked here; its privileged metadata-copy step remains for the lead. Do not delete the temporary merge directory until the handoff is complete.

Main advanced concurrently to `5776918` after the merge was prepared. This tested merge remains pinned to its original parent `ffd610a`, exactly as a native in-progress merge would. The handoff preserves that MERGE_HEAD and allows main to advance without rewriting the prepared candidate. Any later integration against the newer main is a separate lead step.
