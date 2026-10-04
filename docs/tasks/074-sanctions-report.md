# Task 074 implementation report · 2026-10-02

Candidate: uncommitted work on base `c6732b24f75656c81e7c0ac0272e7e103f6bf4a4`. The lead commits.
Candidate source SHA-256: `7aacde5b152ddeedaf95a8234f211939fb17a3dcc5c961133244eb99f450b448`.
The fingerprint covers the 18 changed/new non-report files below, sorted by relative path, hashed as path + NUL + file bytes + NUL. This report is excluded.

## Changed files

- `apps/server/src/sanctions/parser.ts`: bounded-depth, strict legacy SDN XML reader, complete document/record-count validation, duplicate entry detection, digital-currency extraction, EVM normalization/deduplication and UTC publication-date parsing. DTDs/external entities, malformed entries, empty address exports and unexpected formats are refused. Names and other entity details are not persisted.
- `apps/server/src/sanctions/service.ts`: single quote/order screening service with uncached current-dataset reads; shared CA-8 errors with generic copy. Worker refresh is attempted at startup when due, then checked every minute against the persisted 24-hour cadence. Downloads have a 30-second timeout and 32 MiB limit, require a public Treasury HTTPS URL, refuse redirects, and send no account context. Complete append-only snapshots and successful refresh status publish atomically. Provider, parser, partial-download, publication-date regression and transaction errors preserve the prior complete snapshot. Status and timestamps persist independently of private accounts; logs contain only refresh outcome. `freshness()` exposes version, timestamps, address count and latest refresh status to internal consumers.
- `apps/server/src/db/schema.ts`, `apps/server/drizzle/0005_ofac.sql`, `apps/server/drizzle/meta/{0005_snapshot.json,_journal.json}`: generated migration/schema metadata for versioned `ofac_sdn` and singleton `ofac_refresh`. Snapshots record source-content SHA-256, download/publication times, record count and digital-currency address set.
- `apps/server/src/config.ts`, `.env.example`: optional, validated `OFAC_SDN_URL`; no guessed default endpoint. No new dependencies or lockfile changes.
- `apps/server/src/app.ts`, `apps/server/src/index.ts`: shared service wiring, worker/dev-only refresh startup and draining on shutdown. API replicas do not refresh datasets. The existing singleton worker role lease remains the ownership boundary.
- `apps/server/src/exec/service.ts`: live quotes screen before adapter work and again before `quotes.put`; new live orders and idempotent replies re-screen current authenticated/quoted wallets before returning unsigned transactions. Missing service/dataset or failed database lookup refuses execution. Paper/testnet behavior retains its existing scope.
- `apps/server/test/{sanctions-fixture.ts,sanctions.test.ts,trade-access.test.ts}`: synthetic XML, offline PGlite refresh/parser/screening tests, daily cadence across restarts, concurrent same-worker calls, transactional rollback after snapshot insertion, exact served error shapes and quote/order/idempotent-retry refusals after refresh.
- `apps/server/test/{app.test.ts,workspace.test.ts,fork/live-route.fork.test.ts}`: seed complete synthetic sanctions snapshots so existing route, authentication, access and binding assertions continue exercising their original gates. Optional fork tests still require separate authorization/environment; they were not run.
- `apps/server/test/harness-migrations.test.ts`: extend the journal expectation to include 0005 while preserving the existing migration/retention assertions.
- `docs/tasks/074-sanctions-report.md`: this handoff.

Followed BACKEND §§12.2, 12.4, 18, the source/ownership declarations in §§2.1/2.4/3, CA-8/FACTS §7, GO PLAN §7's policy checklist and the marketing claims rules. Read T-GAP-ANALYSIS for context and Guard 2.0 §1's requirement to retain sanctions/access checks. No Guard scoring, V2 release logic, fee destinations or other packet logic changed. The spec requires screening before quote storage; the previous execution path did not have it. No existing assertions were removed, skipped or weakened. No personal identifiers were introduced or ported.

## TODO(spec), policy and remaining dependencies

- New `TODO(spec)` in `config.ts`: BACKEND §2.4 explicitly leaves the source URL/format unverified. This sandbox has no network, so this implementation supports the legacy SDN XML contract (`sdnList`, `publshInformation`, `Publish_Date` in MM/DD/YYYY, `Record_Count`, `sdnEntry/idList/id` and `Digital Currency Address - <currency>`), demonstrated only by synthetic fixtures. Verify the actual current Treasury endpoint and complete format before setting `OFAC_SDN_URL`. Unknown formats fail closed. There is no claimed live OFAC acquisition evidence.
- New `TODO(spec)` in `sanctions/service.ts`: the spec gives no maximum sanctions snapshot age. Refresh errors retain the last complete usable snapshot, including its publication/download timestamps and failure status; no age limit is invented. With no usable complete snapshot, executable quote/order requests refuse with CA-8 `stale_data`, HTTP 422, generic copy. A listed wallet receives `sanctioned`, HTTP 422, generic copy. An empty export cannot clear the list. Freshness acceptance/max-age policy remains an operator/spec decision.
- Packet 075 must call `ctx.sanctions.assertWallet(account)` before publishing a connected v1 executable quote and again for the authenticated/quote-bound wallet on order creation and idempotent responses. Use `ScreeningError.body()` / `statusCode` for CA-8; do not log account context or return provider messages. The current registered legacy live execution path is integrated; this packet does not register the future v1 trade routes or release unaccepted Guard/adapters.
- Operationally start the existing `APP_ROLE=worker` singleton with the verified source, migrate 0005 via the existing boot/migration command, and demonstrate a complete live refresh/freshness record before trading acceptance. Source provisioning, live-format acceptance and launch release approval remain external. No permissive empty-list bootstrap is provided.

## Checks and evidence

| Exact command | Exit | Result / log |
|---|---:|---|
| `pnpm --filter @eko/server exec drizzle-kit generate --name=ofac` | 0 | Generated 0005 migration and metadata; only the two sanctions tables added. |
| `pnpm --filter @eko/server exec vitest run test/sanctions.test.ts test/trade-access.test.ts test/app.test.ts test/workspace.test.ts test/harness-migrations.test.ts --testTimeout=30000 --hookTimeout=30000` | 0 | 5 files / 49 tests passed. `/tmp/eko-074-focused-final.log` |
| `pnpm typecheck` | 0 | All workspace typechecks passed. `/tmp/eko-074-typecheck.log` |
| `pnpm test` | 0 | All workspace tests passed (server: 24 files / 237 tests), then web/server builds and compiled role fixture checks passed. The existing Foundry suite reported 33 passed and 1 pre-existing skipped test; no skips were added. `/tmp/eko-074-test.log` |
| `pnpm brand:check` | 0 | 15 files checked. `/tmp/eko-074-brand.log` |
| `pnpm check:addresses` | 0 | 326 source files checked. `/tmp/eko-074-addresses.log` |
| `git diff --check` | 0 | No whitespace errors. |

Initial parser checks caught a local-time publication-date conversion; this was corrected to strict UTC parsing before the final focused and full gates. The final source fingerprint above is the tested candidate. No source changes were made after the full gates started; only this report was completed.

Long-job checkpoint: full gate process session `47521`, log `/tmp/eko-074-test.log`, on the candidate above, completed with exit 0. Coverage includes all workspace package tests, builds and compiled worker/API/indexer/engines startup, shutdown and unavailable-role fixtures. Next action: lead review/commit, then separately authorized live-source verification and acceptance. No test/build process remains running. Reproduction commands are the exact commands in the table; the generated migration can also be applied through the existing `pnpm --filter @eko/server db:migrate` on the intended database in an authorized environment.

All acquisition evidence is synthetic/offline: XML fixtures, PGlite, injected HTTP routes and compiled role smoke checks. No live source refresh, live chain read, paid job, deployment, commit, push, publication or external message occurred. Actual external acquisition cost: $0. Existing tests may record attempts against unreachable loopback fixtures with a provider label named `paid`; these do not establish paid provider traffic or live chain evidence. The optional fork suite was not run (no network/ports). Built/tested preparation is distinct from deployment or acceptance.
