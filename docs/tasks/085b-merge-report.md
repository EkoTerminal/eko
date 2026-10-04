# Packet 085b merge handoff

Resolved working-tree conflict contents for merging main
`9d6bb63c18f7a15764c1905df7b2efe0cc14c115` into committed packet 085
`0cc3cabd2e613381e69f1fa3647abf5f1cfdd035`. Both sides' functionality is retained.
This report supersedes the migration chain and candidate validation in
`085-implementation.md`; that report still describes packet 085's scope.

Candidate resolution SHA-256 over sorted paths, NUL, file bytes, NUL for the six
files below (excluding this report):
`07d5f64bfcfe21e270c1dd12dd93d72e1fdde04909e5f775b410e2ebe7732a21`.

## Changes

- `apps/server/drizzle/meta/_journal.json`: main's first eight entries are
  unchanged. Reserved `0010_launch_monitoring` follows `0007_ofac`, with
  contiguous journal index **8** and a later timestamp. Migration filename
  **0010** is retained; there are no invented 0008/0009 migrations.
- `apps/server/drizzle/meta/0010_snapshot.json`: predecessor is main's 0007
  snapshot. Preserve every main table, including sanctions tables, and add only
  `public.launch_measurements`. All main 0000–0007 SQL and snapshots were verified
  byte-for-byte against the pinned main commit; 0010 SQL is unchanged.
- `apps/server/src/app.ts`: retain monitoring/incidents and main's sanctions
  service/worker in the shared application context and lifecycle.
- `apps/server/test/harness-migrations.test.ts`: preserve both sides' migration
  assertions, update the final ledger to nine entries, assert the complete
  snapshot chain, and add main-through-0007 upgrade/data-preservation coverage.
- `package.json`: retain launch ops and main's backup/restore scripts.
- `packages/db/src/index.ts`: retain monitoring and receipt API exports.

Other files automatically merged by the lead's merge were left intact. No
dependency, lockfile, spec, Guard design or prototype edits were needed.

## Validation

All commands below finished with **exit 0** on the resolved candidate. Commands
using pnpm had the temporary environment setting
`pnpm_config_verify_deps_before_run=false` to avoid automatic dependency installs;
no persistent configuration changed.

| Command | Result | Local evidence |
|---|---|---|
| `pnpm --filter @eko/server test test/harness-migrations.test.ts test/launch-monitoring.test.ts test/trade-access.test.ts` | 3 files, 25 tests passed | `/tmp/eko-085b-focused.log` |
| `pnpm typecheck` | All workspace packages passed | `/tmp/eko-085b-typecheck.log` |
| `pnpm test` | Full gate passed, including workspace suites, production web/server builds and offline role-image checks | `/tmp/eko-085b-test.log` |
| `pnpm brand:check` | 145 files checked | `/tmp/eko-085b-brand.log` |
| `pnpm check:addresses` | 372 source files checked | `/tmp/eko-085b-addresses.log` |
| `pnpm --filter @eko/server build && node scripts/check-role-image.mjs` | Explicit server build and role fixture gate passed | Build output in terminal; role gate in `/tmp/eko-085b-role-image.log` |
| `git diff --check` | Passed | Terminal output |

Full suites included 190 engine, 119 indexer, 269 server and 14 MCP tests.
The contract runner's existing fork-test skip remains; no test was removed,
weakened or newly skipped by this resolution.

Fresh offline PGlite migration and upgrade from main through 0007 passed.
The upgrade fixture preserves sanctions, consent, allowlist, MCP counters,
agents, keys and all eight prior migration-ledger entries; applying 0010 then
rerunning migrations preserves the added measurement. Existing upgrade paths
from 0003, 0005 and 0006 also pass. These are fresh/upgrade fixture databases,
not live database migration evidence. Reproduce with the focused command above.

## Scope and remaining steps

Packet 085 continues to follow BACKEND §§1.4, 18, GO PLAN §§3.6, 4.5, 13 and
Guard §9.3; this merge adds no product behavior or new `TODO(spec)`.
Existing packet 085 ambiguities remain:

1. Measurement ingestion and individual status URL conventions in
   `apps/server/src/http/launch-monitoring.ts`.
2. Unspecified paging/phone transport and heartbeat/backup freshness cadence in
   `apps/server/src/obs/launch.ts` and `infra/monitoring/README.md`.
3. No separate Farcaster runtime flag in the shared contract, in those same
   monitoring files.

The existing chain-client alert-delivery and flag-audience TODOs are unchanged.
Collector, receiver and external ops acceptance dependencies remain as described
in `085-implementation.md`; merging main is not evidence that a collector is
running or an alert was delivered.

All evidence is local fixtures or mocked metered RPC. No live chain call, paid
job, external message, port, deployment or publication was performed. External
cost: **$0**. No personal identifier or real secret was added or needed replacement.

Git metadata was not modified: the index fingerprint remains unchanged. The
five unmerged index entries therefore remain for the lead to stage; their file
contents are resolved and marker-free. No commit was made in this session.
The prepared merge message is `/tmp/eko-085-merge-message.txt` with the requested
co-author trailer. The lead's next action is review, stage the resolved files and
this report, then commit the merge.

Full test process session `87506` and explicit build/role gate session `73872`
both finished with exit 0. Final checkpoint:
`/tmp/eko-085b-checkpoint.json`. There is no remaining running validation job.
