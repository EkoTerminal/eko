# Encrypted backups and isolated restore drills

Packet 084 implements BACKEND §§3.5–3.6, 19 and GO PLAN §4.2. Guard §7.3 owns
immutable receipt semantics; these tools compare stored data without recomputing
or changing Guard decisions. No migration, provider job, deployment or paid run.

// TODO(spec): retention/drill cadence conflicts; use BACKEND §19: 30 daily and
12 monthly copies, daily provider snapshots, WAL/PITR and weekly isolated drills,
including a real drill before Gate B. GO PLAN §4.2 specifies fewer copies/monthly
drills; final operations policy must record the resolution.

## Prerequisites and authority

Use a pinned candidate checkout, Postgres **16** client/server tools and age on
the approved operations host. They are operator prerequisites, not new Node
dependencies or globally installed by this task. The sandbox has age but no
pg_dump/pg_restore/pg_basebackup or connected Postgres. Staging 083 provisions
neither object storage nor PITR. A provider's backup checkbox is not a recovery
result. Source/candidate revisions refer to the data-producing release and the
drill code respectively; the lead pins the final revision after committing.

Inject the names in `config.env.example` through the secret store. Do not source
this placeholder file as runnable configuration or put credentials in argv,
shell history, checked-in files or evidence. Require verified TLS with the
approved CA for both Node/libpq clients. The source URL uses a read-only dump
role; grant the scoped `pg_control_system()` read needed for cluster identity.
The restore administrator is limited to a **different disposable cluster** with
no production routing or application connections. Source and restore cluster
identifiers are compared; alias hostnames cannot establish isolation. Provision
the admin connection with no untrusted concurrent creators. Keep all writers,
trading, background roles and public ingress off on the restore cluster.

Age public recipients are in the recipients file; private identity and journal
KEK come from separate restricted secret-store mounts. Dump and archive producers
need only the public recipient. Journal keys/funds belonging to users never enter
these tools. Restrict directories to the operations account (0700); artifacts
are exclusive-create 0600. Store ciphertext, manifests and checksums in private
object storage with its immutable/versioned policy. Preserve/check the manifest
checksum out of band; a checksum beside a mutable artifact is not authenticity.
These commands do not upload, schedule or delete backups. Configure the daily
snapshot/nightly dump/weekly drill schedule externally after authorization; keep
30 successful daily generations and 12 monthly generations, and their matching
manifests. Retain full base/WAL chains needed by every recovery window before
pruning anything. No automatic pruning or cadence acceptance is claimed.

## Logical dump and fresh restore

Paths below are relative to `apps/server` because pnpm runs that workspace's CLI.
Use absolute **operator-local** paths injected at runtime if needed; never put
personal paths into source or reports.

```sh
pnpm backup ../../.data/backups/sample-generation
pnpm restore:drill ../../.data/backups/sample-generation
```

The backup directory must not exist. `pg_dump --format=custom` streams directly
to age; no plaintext dump or journal export is written. An exported repeatable
read snapshot ties dump data to counts, all three migration ledgers, complete
cursor/range state and samples of cards, Guard revisions and receipt payloads,
leaves and roots. Only counts and SHA-256 digests reach the manifest. The older
plaintext `journal_entries` notes are excluded; their count is also excluded
from the comparison. Harness rows require the encrypted schema from 092.
This exclusion is intentional: a logical recovery does not recover legacy notes.

Restore verifies the ciphertext checksum and current destruction ledger before
creating `eko_restore_*` on the separate cluster; it refuses an existing name.
Age streams into pg_restore in one transaction with error-on-failure, no
`--clean`, drop or source writes. Database URLs are environment-only. Verify
ledger/count/state/sample equality before clearing restored range leases. Session
advisory locks must be absent. Current ledger tombstones null old wrapped keys
before any reader starts; keep that CURRENT ledger mounted for every subsequent
unwrap. Never replace it with a backup-era or empty ledger. A missing/corrupt
ledger aborts. Failed databases remain isolated for diagnosis; no automatic drop.

For journal evidence, prepare **two neutral synthetic accounts/agents** through
the existing authenticated harness with consent. Write the literal note
`restore-drill-neutral-fixture` for both. Dump before deleting the second account
through `DELETE /v1/me/data`. Then restore using the current destruction ledger
and the four fixture UUID environment names. The command proves authorized
decryption for the active account and forbidden access to the deleted account
even though the dump predates deletion. No decrypted content/UUID/KEK is reported.
Keep missing fixtures pending. Never use actual customer positions in a drill.

`restore-eko_restore_*.json` records source/candidate revisions, backup checksum,
neutral target name, UTC start, elapsed milliseconds and each assertion. Failure
or pending checks yield exit 1; acceptance remains false. SQL reconnection is
automated; real API/MCP read reconnection and provider PITR stay pending until
separate isolated service/provider evidence is collected. Start only accepted
read roles against the target with `RUN_WORKER=false`, zero RPC/AI budgets and
trading/ops flags off; mount the current ledger before boot. Check health/config,
owner-authenticated active/deleted journal reads and existing public card/receipt
reads. Capture reconnect timing and results without private data. Never expose
unaccepted services or start indexer/engines/committer jobs for this drill.

## Encrypted WAL and physical PITR

Managed Postgres: provision daily provider snapshots and continuous WAL/PITR,
record provider recovery IDs/retention and request a **new isolated instance** at
the chosen UTC recovery point. Never recover over the source. Provider encryption,
archive continuity, target timeline, achieved recovery timestamp and current
deletion-ledger mount require actual provider evidence; pending access fails the
launch gate. Record baseline and at-target inventories (a dump inventory cannot
be used to certify a later arbitrary PITR point).

Self-hosted Postgres: provision an encrypted WAL directory/storage transport,
`wal_level=replica`, `archive_mode=on`, scoped replication access, and a separate
restore data directory. PostgreSQL invokes the pinned workspace CLI; configure
absolute approved installation paths outside source. Equivalent repo commands:

```sh
pnpm backup:base ../../.data/backups/sample-base
pnpm backup:wal /operator-wal-segment 000000010000000000000001
pnpm restore:wal ../../isolated-restore-data/pg_wal/000000010000000000000001 000000010000000000000001
```

`archive_command` maps `%p %f` to `wal-archive`; `restore_command` maps `%p %f`
to `wal-fetch`. Segment, history and backup-history names are allowlisted.
Archives are always age ciphertext with ciphertext/original WAL checksums;
identical completed retries succeed without a private identity on the producer.
Conflicts and incomplete artifacts fail; inspect/quarantine only that generation
before retry, never overwrite an archived segment. WAL fetch checks ciphertext
integrity and writes only a fresh file inside `RESTORE_PGDATA`. Keep PGDATA and
its parents free of symlinks, owned by the restore operator. The database's WAL
files are necessary private physical database state, not plaintext dump exports.

`basebackup` streams a tar base directly to age (single default tablespace;
additional tablespaces are unsupported and must fail). `--wal-method=none`
requires a complete retained archive from base start through the recovery point.
Legacy plaintext journal notes must be absent before physical backup; old WAL
containing them must never be exposed/decrypted as an export. Supply replication
access matching the same source cluster, and retain source timeline/start-stop
LSNs with the provider/operator record. The base manifest alone marks PITR pending.

To recover, on a **fresh isolated host**, verify base checksum against the retained
manifest, create an empty restricted PGDATA, and stream `age --decrypt` into tar
extraction there (trusted generated base only; review member paths/tablespaces
first). Do not extract into the source. Restore data is plaintext DB state on an
encrypted restricted volume, never a shared export. Delete copied standby config,
set local-only listening, add `recovery.signal`, the pinned `restore_command`,
`recovery_target_time`, `recovery_target_timeline` and `recovery_target_action=pause`.
Keep the journal KEK unavailable until the current ledger is mounted and
tombstones reconciled. Start Postgres 16 only on that isolated host; require a
paused recovery at the requested point, inspect `pg_last_wal_replay_lsn()` and
`pg_last_xact_replay_timestamp()`, and compare the target-time inventory and
neutral journal fixtures. No promotion/ingress/writer restart is implicit here.
Measure encryption, restore, replay and service reconnect separately. Missing
WAL, target not reached or unmeasured recovery is failure, not successful PITR.

## Offline reproduction

```sh
pnpm test:restore
# Explicit local operator-tool check; requires age and age-keygen.
pnpm test:backup-tools
pnpm typecheck
pnpm test
pnpm brand:check
pnpm check:addresses
```

The restore fixture takes a real PGlite archive, encrypts it in memory using a disposable
AES-GCM fixture key, restores into a new data directory, compares inventories,
tests pre-deletion data against the current ledger, reclaims stale range leases,
then reconnects real application read services with HTTP injection. It checks
the source stays unchanged by restoration and performs no network/ports. It
does **not** execute pg_dump/age, physical WAL replay, provider storage or live
service recovery. The separate tools fixture executes real age encryption,
decryption/tamper rejection and the WAL archive/fetch CLIs on neutral bytes;
it checks identical retries, conflicting segments, outside-target writes and
overwrite refusal. It does not replay PostgreSQL WAL. Production libpq tools still need a connected operator
rehearsal. Record fixture evidence separately from live evidence, including
candidate revision, commands/exit codes, assertion results, measured timings,
actual cost (fixture $0, live unknown until measured), coverage and next action.
