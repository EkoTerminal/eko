# 084 implementation evidence

Prepared and fixture-tested in the task worktree. Not committed, deployed,
published, approved for launch, or demonstrated against live Postgres/PITR.
No paid job, chain acquisition, network request or deployment was run for 084.

Candidate: base revision `8555f32881fd1fa02d9d8bb0b62a9b2ee59bef49` plus this
uncommitted diff. The lead must pin the final committed candidate. The source
database in the offline drill is synthetic; there is no live source revision.

## Changed files

- `package.json`: repo-local dump/restore, basebackup, WAL archive/fetch and two
  focused check commands, using `node --import tsx` without a CLI IPC listener.
- `apps/server/src/ops/backup-cli.ts`: snapshot-consistent encrypted pg_dump,
  ciphertext checksums, fresh separate-cluster restore, destruction-ledger
  reconciliation, lease reclaim, neutral journal probes, redacted evidence;
  encrypted base/WAL commands and failure/pending states.
- `apps/server/src/ops/backup-stream.ts`: backpressure, child exit propagation,
  sanitized failures and no shell/plaintext staging.
- `apps/server/src/ops/restore-checks.ts`: all three migration ledgers, all
  retained-table counts, complete ingest/engine cursor and range state, bounded
  immutable card/Guard/receipt samples; cluster/name/existing-target checks.
- `apps/server/test/restore-drill.test.ts`: real isolated PGlite archive restore,
  synthetic envelope keys, current post-backup deletion ledger, actual read
  reconnects, source unchanged, digest mismatch and isolation/failure checks.
- `apps/server/test/restore-age-fixture.ts`: real age and WAL CLI round trips,
  retries/tamper/conflict/path/overwrite rejection; synthetic disposable identity.
- `infra/backups/config.env.example`, `infra/backups/README.md`: secret-store
  placeholders, retention/cadence, provider/self-hosted PITR handoff and evidence.
- This report.

No dependencies or workspace declarations changed; no lockfile update needed.
No migrations added; reserved 0009/0128 remain unused. Read-only specs, Guard
design and prototype unchanged. No personal identifiers were ported or added.

## Specification and ambiguity

Followed BACKEND §§3.5–3.6 (encrypted journals, current destruction state and
retention), §19 (age pg_dump, WAL/PITR, retention/drills), GO PLAN §4.2 (isolated
pre-B restore), and existing Guard §§2.1, 7.2–7.3 (cursor/revision/immutable
receipt preservation; no V2 activation or recomputation).

Every new `TODO(spec)`: the retention/drill conflict in `infra/backups/README.md`.
Use BACKEND §19's **30 daily / 12 monthly** copies and **weekly** drills, plus a
real pre-B drill. Final operations policy must record that resolution rather
than silently using GO PLAN's smaller copy count/monthly cadence.

## Checks and measurements

`pnpm test:restore`: exit 0, three tests. Latest focused fixture elapsed **6,270
ms**, encrypted fixture checksum
`b051a4c51926705ff3bf20ab2f67486f9456ec20a868365edf3850fb5bb57011`.
Restore target: `sample-isolated-pglite`. Each reported
assertion passed: three ledgers, counts, cursor/ranges, immutable samples, stale
leases, authorized decryption, unreadable pre-deletion ciphertext, read-service
reconnect, source unchanged, tamper detection. This is synthetic PGlite archive
plus in-memory AES-GCM, not live Postgres or pg_dump evidence.

`pnpm test:backup-tools`: exit 0, real age encryption/decryption/tamper rejection
and WAL CLI round trip, idempotent retry, conflicting input, existing output and
outside-target refusal; **6,090 ms**. These are neutral byte fixtures, not actual
PostgreSQL WAL replay. Local age-stream check also passed in 446 ms. Its initial
tsx-CLI attempt failed with sandbox IPC EPERM (exit 1); `node --import tsx`
resolved that runner failure and is used by the committed command definitions.

Both focused checks: actual provider cost **$0**, zero network calls, no ports.
Live cost/coverage is unknown; do not carry the fixture's zero into live evidence.

Required gates:

- `pnpm typecheck`: exit 0, all workspaces; subsequently added operator-tool
  fixture also covered by `pnpm --filter @eko/server typecheck`, exit 0.
- `pnpm test`: exit 0, complete workspace suites and production web/server build
  plus role-image checks. Server: 26 files / 238 tests; restore fixture 12,127 ms
  under the full suite. No failed or skipped existing test was altered.
- `pnpm brand:check`: exit 0 (136 files in the final check, after builds).
- `pnpm check:addresses`: exit 0 (348 source files at the check).
- `git diff --check`: exit 0.

Completed-process checkpoint: full test session 29899, exit 0;
`/tmp/eko-084-test.log`. Typecheck log `/tmp/eko-084-typecheck-final.log`, focused
restore log `/tmp/eko-084-focused-final.log`, tool log
`/tmp/eko-084-backup-tools.log`. All processes completed. Candidate is the base
revision plus this diff; do not rerun completed gates merely for the handoff.
Next action: lead pins the committed candidate, then a separately authorized
connected operator supplies the live prerequisites/evidence below. No provider
spend was incurred by the fixture suite.

## Remaining dependencies and reproduction

083 provider/database/storage provisioning and accepted read-role configuration;
Postgres 16 pg_dump/pg_restore/pg_basebackup clients (absent here); verified TLS,
age secret-store recipients/identity and durable CURRENT journal destruction
ledger; isolated target cluster, neutral fixture accounts and post-backup
deletion; actual snapshot/WAL continuity/PITR recovery point, API/MCP reconnect
measurements and provider costs. 092 journal implementation is consumed here.
Pending services/provider checks keep live restore reports unaccepted and exit 1.
Legacy plaintext web notes are deliberately excluded from logical dumps; physical
backup refuses nonempty legacy notes. No actual provider retention/schedule or
recovery target has been configured by this packet.

Offline:

```sh
pnpm test:restore
pnpm test:backup-tools
pnpm typecheck
pnpm test
pnpm brand:check
pnpm check:addresses
```

Connected operator after provisioning/authorization and secret-store injection:

```sh
pnpm backup ../../.data/backups/sample-generation
pnpm restore:drill ../../.data/backups/sample-generation
pnpm backup:base ../../.data/backups/sample-base
```

WAL hooks/PITR recovery sequence, fixture preparation, private evidence fields
and limitations are in `infra/backups/README.md`. Keep live observations separate
from this fixture report; no pending provider/PITR assertion constitutes a pass.
