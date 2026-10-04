# Task 074b · Main merge preparation

Candidate: uncommitted merge of branch HEAD `3fa42c2` with main `8555f32881fd1fa02d9d8bb0b62a9b2ee59bef49`. The lead started the merge. Conflict file contents are resolved; Git's five unmerged index entries remain for the lead to stage. No Git metadata, index, refs, commit or deployment was changed by this session.

## Resolution

- Preserve main's server migrations 0003–0006 and their snapshots byte-for-byte. Restore main's `meta/0005_snapshot.json`, keep its private journal 0005 and MCP 0006, and preserve the first seven journal entries exactly.
- Remove `apps/server/drizzle/0005_ofac.sql`; regenerate sanctions as `0007_ofac.sql` with Drizzle from main's 0006 snapshot and the combined schema. SQL bytes match the original sanctions migration. `meta/0007_snapshot.json` points to 0006, retains every existing table unchanged, and adds only `ofac_sdn` and `ofac_refresh`. The new journal timestamp is later than main's 0006.
- `apps/server/src/db/schema.ts`: retain both sanctions tables and all private journal/MCP schema additions.
- `apps/server/src/app.ts`: retain sanctions worker/service and private journal/destruction-ledger wiring in the combined context. No Guard, journal cryptography, receipt or execution logic was replaced.
- `apps/server/test/harness-migrations.test.ts`: expect the complete 0000–0007 chain, verify all snapshot links, preserve existing 0003/0005 upgrade assertions, and add a main-through-0006 upgrade. Fresh, upgraded and repeated migrations preserve consent, allowlist, agents, keys, MCP counters, the existing migration ledger and the newly loaded sanctions dataset.
- Main's engine migration loader and migrations 0121–0123 were compared byte-for-byte with pinned main and retained unchanged. Automatically merged task 068/080/083/091/092/093 changes remain intact.

Resolution SHA-256: `ecba37d26ff58f87640e2435c5e49d64deec97dd9edb4e2bde4c063dec177508`. Covers seven files, sorted and hashed as relative path + NUL + file bytes + NUL: `apps/server/drizzle/{0007_ofac.sql,meta/0005_snapshot.json,meta/0007_snapshot.json,meta/_journal.json}`, `apps/server/src/{app.ts,db/schema.ts}`, and `apps/server/test/harness-migrations.test.ts`. The deleted old SQL is recorded separately in the checkpoint. This report is excluded.

No new TODO(spec) or dependency declaration was introduced. Task 074's live source URL/format and maximum snapshot age ambiguities remain as documented in its original report. That report describes the pre-merge 0005 candidate; this report supersedes its migration numbering and verification revision.

## Verification

Use the per-command prefix `pnpm_config_verify_deps_before_run=false` with the existing dependency tree; no persistent setting was changed.

| Exact command/check | Exit | Result / log |
|---|---:|---|
| `pnpm --filter @eko/server exec drizzle-kit generate --name=ofac` | 0 | Regenerated 0007; `/tmp/eko-074b-migration.log` |
| Main migration byte comparisons, snapshot/journal assertions and conflict-content scan | 0 | Main 0003–0006 and engine loader/0121–0123 unchanged; only sanctions tables added in 0007; original sanctions SQL identical |
| `pnpm --filter @eko/server exec vitest run test/harness-migrations.test.ts test/sanctions.test.ts test/trade-access.test.ts test/private-journal.test.ts --testTimeout=30000 --hookTimeout=30000` | 0 | 27 tests, including fresh/main-0003/main-0005/main-0006/repeated migrations; `/tmp/eko-074b-focused.log` |
| `pnpm typecheck` | 0 | Final workspace run, including MCP; `/tmp/eko-074b-typecheck-final.log` |
| `pnpm test` | 0 | Final run: 127 Vitest files / 2393 passed tests; server 245 / MCP 14. Foundry: 33 passed with the existing RPC-unset fork test skipped. Builds and role fixtures passed; `/tmp/eko-074b-test-final.log` |
| `pnpm brand:check` | 0 | 134 files; `/tmp/eko-074b-brand.log` |
| `pnpm check:addresses` | 0 | 347 source files; `/tmp/eko-074b-addresses.log` |
| `pnpm --filter @eko/server build && node scripts/check-role-image.mjs` | 0 | Explicit build and role fixtures passed; `/tmp/eko-074b-role-image.log` |
| `git diff --check` and final conflict-content/index fingerprint checks | 0 | No whitespace/conflict markers in resolved files; Git index unchanged |

Reproduce the checks with these commands and the prefix above. Fresh and pinned-main-through-0006 upgrades run as PGlite tests within `test/harness-migrations.test.ts`. No assertions were removed, weakened or skipped. Final source and resolution fingerprints match the tested candidate; only this report/checkpoint/message were written after the full gates started.

Environment diagnosis: the initial `pnpm typecheck` exited 2 because the newly merged MCP workspace had no local Node type/dependency links. One `CI=true pnpm install --offline --frozen-lockfile` attempt exited 1 (`ERR_PNPM_NO_OFFLINE_TARBALL`, missing the font package) after recreating local dependency files. Because that attempt ran while the initial full test process was active, it caused missing PGlite data failures; that test process exited 1 and is not passing evidence. The install should have been sequenced after the test process completed. Dependencies were restored locally from an adjacent checkout whose lockfile is byte-identical, with no source checkout changes. Copied workspace links were verified to resolve inside this worktree; MCP typecheck then passed. Final full gates were rerun after restoration. A clean frozen offline installation still requires a complete package store; the restored tree does not prove that installation gate.

## Lead handoff

Merge message: `/tmp/eko-074-merge-message.txt`, ending with the exact requested co-author trailer. The lead must stage the resolved file contents, deletion of 0005_ofac, new 0007 SQL/snapshot, migration test and report, then commit the existing merge. Clearing Git's unmerged entries requires that lead staging step; this session did not stage anything.

Checkpoint: `/tmp/eko-074b-checkpoint.json` records parents, resolution/index fingerprints, check sessions/logs, cost and next action. All evidence is offline PGlite, synthetic XML, injected HTTP, built role fixtures and metered fixture RPC. No live Treasury refresh, live chain evidence, paid job, deployment, commit, push, publication or external message occurred. Actual paid cost: $0; live coverage percentage and latency are not measured. No unaccepted feature was enabled.

Final checkpoint: full-test session `69716` and explicit build/role-image session `1883` completed with exit 0. No check process remains running. Next action is lead staging/review/merge commit; no continuation is scheduled.
