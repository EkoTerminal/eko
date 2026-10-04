# Task 092 implementation

Candidate: `c6732b24f75656c81e7c0ac0272e7e103f6bf4a4` plus the uncommitted packet-092 changes. Source-content SHA-256 (sorted changed paths and contents, excluding this report): `ce62d483befcd52b97ff2ea79e9eb365c486cb640751de2bfbbd9519fe7fd60c`.

Implemented and locally tested; no commit, push, deployment, publication, external message, paid job or live-chain request. Actual paid cost: $0. No dependencies were added or upgraded. No personal identifiers or real secrets were added or ported. Specs, Guard design and prototype were not edited; V2 acceptance/activation is unchanged.

## Changes and spec

Followed BACKEND §§3.2, 3.5–3.6, 9.3 journal input, 9.9, 13 commitment handoff, 23 CA-30; FACTS §7. Read AGENTS including rule 9, the packet, gap analysis and claims rules. The packet cites no specific Guard algorithm section and none was changed.

- `packages/db/src/crypto/journal.ts`, `crypto/destruction.ts`, `src/index.ts`: AES-256-GCM envelope encryption with random 32-byte per-account DEKs, host-secret KEK/id, account/version/KEK-id binding for wrapped keys, UUID entry/agent AAD, independent payload/salt nonces and authentication tags, RFC 8785 JCS and a 16,384-byte canonical UTF-8 limit. Each commitment is keccak256 of a fresh 32-byte salt followed by canonical payload bytes. Clear DEK/salt buffers are cleared after use; DEKs are never cached across calls.
- `apps/server/src/db/schema.ts`, `drizzle/0005_private_journal.sql`, `drizzle/meta/0005_snapshot.json`, `drizzle/meta/_journal.json`: encrypted harness journal, wrapped user keys, persisted journal consent and de-identified shared ground truth. Journal defaults to opt-out. Existing agents/policies/keys are reused.
- `apps/server/src/harness/journal.ts`: authenticated-owner/agent service interface for later MCP journal handlers, API-owned key lifecycle adapter, same-transaction encrypted row and commitment publication, declared MCP ground-truth writer, bounded owner-filtered keyset pagination, kind filtering and deletion. Owner-row locks serialize journal writes, consent changes and deletion. Preflight references must belong to the same agent; absent preflight implementation stays unavailable.
- `apps/server/src/http/v1/journal.ts`, `http/v1/index.ts`, `app.ts`, `harness/service.ts`: wallet-session-only `GET /agents/:id/journal`, `GET/PUT /me/journal-consent`, and `DELETE /me/data`. Responses use `private, no-store`; mutations enforce Origin and reject demo sessions. A destroyed account cannot authenticate restored harness API keys. Private operation errors are reduced to fixed messages and do not enter the remote error reporter. No journal payload is published to public WS, telemetry or OG handlers.
- `packages/db/drizzle/0122_private_receipts.sql`, `src/engines-migrate.ts`, `src/receipt-outbox.ts`: immutable, commitment-only producer publication and existing receipts-owned recovery/enqueue of `harness_private` leaves. Public item data contains only `{id, kind, hash}`; it contains no owner/agent id, amount, payload, wrapped key or salt. Private publications survive deletion before receipt recovery. `getPrivate()` exposes only that item; existing public-payload reads do not expose private entries.
- `packages/shared/src/contracts/harness.ts`, `test/fixtures/contracts/v1.json`: journal write/page/consent and CA-30 deletion schemas and their required frozen-contract fixtures.
- `.env.example`, `apps/server/src/config.ts`: optional `JOURNAL_KEK`, `JOURNAL_KEK_ID`, `JOURNAL_TOMBSTONE_PATH`; no default/generated KEK or destruction ledger. Missing configuration leaves journal encryption unavailable.
- Tests: `packages/db/test/journal-crypto.test.ts`, `receipt-outbox.test.ts`, `merge-migrations.test.ts`; `apps/server/test/private-journal.test.ts`, `harness-migrations.test.ts`. Added security/integration coverage and extended existing migration expectations. No existing assertion was removed, skipped or weakened.

## Destruction and restore contract

The authoritative destruction ledger lives on a provisioned durable shared volume outside PostgreSQL/PGlite backups. Its initial file contains exactly `eko-journal-destruction-v1` followed by a newline; subsequent records are append-only account UUID/deletion timestamp pairs. Every unwrap consults the current ledger. Writes append and fsync before database key destruction or private-row cleanup. The first deletion timestamp is reused on retries. A cleanup transaction rollback does not roll back destruction: subsequent reads, writes and harness API-key authentication are denied until retry finishes cleanup.

Deletion nulls every wrapped DEK before cleaning harness rows; deletes agents and cascading keys/policies, journal rows, consent, implemented private preferences/layouts/web notes; and revokes/cleans grants/tokens/codes through the lifecycle cleaner where their additive tables exist. Later OAuth/harness implementations must conform to or supply that cleaner for their actual schemas. Public commitments and opted-in de-identified ground truth remain. Minimal destruction metadata and account authentication identity remain for restore enforcement and authenticated retries.

A restore must mount the **current** ledger before serving traffic; never restore an older ledger alongside a database backup, recreate a missing file, or truncate it to resolve a failure. Missing, malformed or torn ledger state fails closed. API and MCP replicas must share authoritative destruction state, with an independently retained copy and a restore procedure that preserves its monotonic history. Packet 084 owns the external operational backup/restore drill; this packet supplies its contract and local fixture evidence.

The test restores an actual pre-deletion PGlite data-directory backup, proves it decrypts before deletion, then proves journal access and restored-key authentication fail after deletion despite the restored database still containing its old wrapped DEK. This is application-enforced restore denial. An operator possessing both the KEK and an old wrapped-DEK backup could deliberately bypass the ledger using raw cryptography; this implementation does not claim irreversible destruction against that operator. Do not treat a database-only restore as accepted privacy evidence.

## Checks and reproduction

Run from the worktree root; no listener, external provider or paid runner is needed for the focused checks.

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/db exec vitest run test/journal-crypto.test.ts test/receipt-outbox.test.ts test/merge-migrations.test.ts --testTimeout=30000 --hookTimeout=30000` | 0 | 3 files, 13 tests; `/tmp/eko-092-focused-db.log` |
| `pnpm --filter @eko/server exec vitest run test/private-journal.test.ts test/harness-migrations.test.ts test/v1-agents.test.ts --testTimeout=30000 --hookTimeout=30000` | 0 | 3 files, 17 tests; `/tmp/eko-092-focused-server.log` |
| `pnpm --filter @eko/shared exec vitest run test/contracts.test.ts` | 0 | 1 file, 189 tests; `/tmp/eko-092-focused-shared.log` |
| `pnpm typecheck` | 0 | `/tmp/eko-092-typecheck.log` |
| `pnpm test` | 0 | 120 Vitest files, 2343 tests; 33 contract tests passed (existing fork test skipped), web/server builds and no-port role-image fixtures; `/tmp/eko-092-test.log` |
| `pnpm brand:check` | 0 | 15 files; `/tmp/eko-092-brand.log` |
| `pnpm check:addresses` | 0 | 328 source files; `/tmp/eko-092-addresses.log` |
| `git diff --check` | 0 | No whitespace errors |

Initial integration failures were corrected (UUID/text SQL parameter reuse; awaited usage assertion). The first full gate stopped on missing fixtures for the four newly exported schemas; those fixtures were added and the focused shared-contract suite passed before rerunning the gate. No failed attempt is claimed as a pass.

Coverage is synthetic-key crypto, migrated PGlite databases, HTTP injection and an actual local database-backup restoration; it is not production PostgreSQL, deployment, live-chain, MCP-client, browser, provider or release acceptance evidence. No percentage coverage, live latency or paid cost measurement was inferred. The journal integration suite asserts zero metered chain units. Legacy suites may report fixture/unroutable-endpoint meter attempts; those are not live-chain or billing evidence.

## TODO(spec) and dependencies

Every new TODO(spec):

1. `apps/server/src/harness/journal.ts`: shared-ground-truth schema/buckets are unspecified; retain only enum kind/side/decision facts and powers-of-ten notional/quantity buckets. Drop identifiers, text, instruments, timestamps, arbitrary nested data and exact amounts.
2. `apps/server/src/harness/journal.ts`: CA-30 does not define account/session or financial-record deletion. Retain account/login identity for authenticated retries and chain/trade facts; erase the implemented private harness, notes and preferences.
3. `apps/server/src/harness/journal.ts`: post-deletion re-enrollment is unspecified. Keep that account's journal and old harness credentials disabled; do not reuse its destroyed identity for a new DEK.
4. `apps/server/src/http/v1/journal.ts`: consent has no frozen endpoint. Use the separate owner-only boolean `/me/journal-consent` resource; a tool call never implies journal opt-in.

Remaining integrations: packets 093/095 connect the resolved harness principal to `JournalService.append()` and decision/preflight producers; 097–099 supply real OAuth lifecycle integration, including tombstone checks for restored grants/tokens; 119 connects Settings consent/deletion controls; 122 owns EKO Points awards (none fabricated here); 084 supplies the externally accepted restore drill. Apply both included migrations through existing migration paths, provision host-secret KEK/id and independently durable current destruction state before enabling journal writes. Production restore/volume semantics and OAuth adapter compatibility require their owning packets' evidence.

Checkpoint: `/tmp/eko-092-checkpoint.json` records source fingerprint, changed paths, process sessions, logs, completed checks, actual paid cost and next action. Full gate session 19086 and typecheck session 30237 completed with exit 0; no check process remains running. Production web/server artifacts were built by the full gate. The next action is lead review/commit and the provisioning/downstream integrations above. No authorized continuation or deployment is scheduled.
