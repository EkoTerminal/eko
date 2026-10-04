# Task 117 implementation report

Prepared and tested locally; left uncommitted for the lead. No commit, push, deployment, publication, real Telegram messages, approval registration, or paid run. Actual paid cost: $0.

Base revision: `6b5e71b4f65cb0d43867c0c218a1a9ae15d2e5a2`. Candidate: base plus this packet's uncommitted files. Source fingerprint (SHA-256 over sorted relative changed paths, NUL, file bytes, NUL; excludes this report): `a2f09c2c09fa4f32276588beab6ba6c2c583adaefc3d002106e100401e3b9447`.

## Changes and spec

Read AGENTS including rule 9, packet 117, dependency packets/reports 090, 114 and 116, and cited BACKEND §16 / §23 CA-22 and FRONTEND §3.11. Copy follows MARKETING §§04–06, including both required Telegram disclosures. No spec disagreement found. Read-only specs, Guard logic and prototype are unchanged. No dependencies, lockfile edits, personal identifiers, real secrets, keys or funds were added or ported.

- `apps/server/src/telegram/link.ts`: cryptographically random account-bound bearer codes, stored only as SHA-256 hashes; expiry, one-time redemption, invalidation on reissue, wallet-account checks, unique external identity enforcement, account relinking and idempotent unlink. Identity changes cancel pending/claimed notices and advance the durable consumer cursor.
- `apps/server/src/http/v1/telegram.ts`, `http/v1/index.ts`, `app.ts`, `config.ts`, `.env.example`: registered wallet-session POST and DELETE `/v1/telegram/link`, strict origin checks, demo-write denial, private/no-store responses, link issuance rate limiting and optional deployment bot identifier configuration. POST returns only `{url, expiresAt}` and accepts no account selector; absent bot configuration returns 404. No bot token or sending process is loaded.
- `apps/server/src/http/v1/account.ts`: `/me` reports persisted linked providers.
- `apps/server/src/db/schema.ts`, `drizzle/0033_telegram_dms.sql`, `drizzle/meta/0033_snapshot.json`, `drizzle/meta/_journal.json`: unique linked identities and account-bound code storage, account cascade deletion. Only reserved server migration 0033 is added; all prior tables/snapshots/SQL and journal entries are preserved. Metadata extends the local 0026 predecessor; the lead must order this entry with the other reserved migrations at integration.
- `apps/server/src/telegram/delivery.ts`: prepared worker consumes task 114 delivery leases, rereads durable records before sending, rechecks settings/watch/identity/quiet hours, retries with existing bounded exponential backoff, deduplicates acknowledged records and stale attempts, and advances cursors. Source prose, names and URLs are discarded. Fixed notices use the configured HTTPS web origin and typed public coin targets. The transport receives only its private destination, fixed notice and an opaque retry key, never internal account IDs or wallet credentials.
- `packages/shared/src/telegram.ts`, `src/index.ts`: narrow redemption and notification interfaces and prepared BotFather description containing analysis and non-affiliation disclosures. No approve action interface or handler is registered.
- `apps/bots/src/telegram/parse.ts`, `handler.ts`, `grammy.ts`: parse opaque `/start` codes separately from scans; redeem only in a private chat whose ID equals the sender's ID. Codes and profile/message prose are never persisted or echoed. Description and `/start` carry both disclosures. DM transport adapter stays behind the existing disabled transport constant; webhook/role deployment remains unavailable.
- `apps/web/src/components/NotificationSettings.tsx`: owner unlink control beside the existing Telegram deep-link card, clears outstanding UI links and reports success/failure.
- `apps/server/test/telegram-dms.test.ts`, `test/harness-migrations.test.ts`, `apps/bots/test/telegram.test.ts`, `apps/web/src/pages/terminal/Watch.test.tsx`: auth/origin/demo/account isolation, expired/foreign/reissued/reused codes, concurrent redemption, uniqueness, relink/unlink cancellation, durable duplicate sends, retry/lease recovery, withdrawn preferences, quiet hours, deterministic hostile-source handling, dark approval/order notices, required descriptions and private DM validation. Migration tests extend exact ledger expectations and verify 0026→0033 upgrade/rerun preservation; every prior assertion is retained. No tests were deleted, skipped or weakened and no timeout was raised.

## TODO(spec) and limits

Four new TODO(spec) notes:

1. `telegram/link.ts`: CA-22 omits TTL, reissue and relink policy. Use ten minutes, one current bearer code per SIWE account and cancellation of queued notices when replacing an identity. Possession of the issued code authorizes redemption for its issuing account; it cannot select another account. Keep the deep link private.
2. `http/v1/telegram.ts`: CA-22 specifies POST only. Use owner-only, idempotent DELETE at the same path for unlink, revoking issued codes and pending notices.
3. `telegram/delivery.ts`: absent identities have no backlog replay; withdrawn preferences and unsupported kinds cancel notices, while quiet hours defer them.
4. `telegram/delivery.ts`: Telegram provides no send-idempotency guarantee. Confirmed acknowledgements deduplicate durably; ambiguous provider acknowledgements or a crash after provider acceptance but before database commit can duplicate a retry. The stable opaque delivery key is prepared for an accepted transport; the grammY adapter cannot promise exactly-once delivery.

D0 approval/order notification kinds remain dark. Generic notification interfaces are prepared without approve buttons/actions. The consumer and grammY adapter are built but not registered with a timer, bot credentials or external transport. The watch lock is held through mocked acceptance/acknowledgement to serialize unlink/relink and watch cancellation; an eventual approved transport must bound send duration and operationally validate this with PostgreSQL. Already accepted messages cannot be recalled by unlink.

Remaining operational work: deployment bot identifier, migration integration/application, separately authorized real Telegram transport/webhook/worker wiring, publication of the prepared BotFather description and live acceptance. Existing task 116 renderer/caller-grade acceptance remains with 111/112; Guard logic remains with its owning packets. These fixtures establish neither live Telegram delivery nor production/PostgreSQL/browser acceptance.

## Checks and reproduction

Run from the worktree root. New checks use migrated in-memory PGlite, Fastify injection, neutral fixtures and mocked sends, with no network/listening ports. Full-gate existing suites may contain their existing optional skips; none was added or changed here.

| Command | Exit | Evidence |
|---|---:|---|
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server exec vitest run test/telegram-dms.test.ts test/harness-migrations.test.ts test/watch-alerts.test.ts test/v1-account.test.ts` | 1 | 61 passed, one new test-helper failure; `/tmp/eko-117-server-focused.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server exec vitest run test/telegram-dms.test.ts` | 0 | Final 15 tests; `/tmp/eko-117-dms-focused-final.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/bots exec vitest run test/telegram.test.ts` | 0 | 19 tests; `/tmp/eko-117-bots-focused.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web exec vitest run src/pages/terminal/Watch.test.tsx src/store/watch.test.ts` | 0 | 14 tests; `/tmp/eko-117-web-focused.log` |
| `pnpm typecheck` | 0 | `/tmp/eko-117-typecheck.log` |
| First `VITEST_MAX_WORKERS=2 pnpm test` | 1 | Existing indexer dense-payload fixture exceeded its 120-second limit; `/tmp/eko-117-test.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/indexer exec vitest run test/log-head.test.ts` | 0 | 41 tests, 174.85 seconds; failing file rerun alone; `/tmp/eko-117-indexer-isolated.log` |
| `npm_config_workspace_concurrency=1 VITEST_MAX_WORKERS=2 pnpm test` | 130 | Stopped after confirming pnpm 11 ignored the npm-prefixed concurrency variable; `/tmp/eko-117-test-final.log` |
| `pnpm_config_workspace_concurrency=1 VITEST_MAX_WORKERS=2 pnpm test` | 0 | 191 Vitest files / 3,118 tests, 34 contract tests passed / one existing fork skip, web/server builds plus role-image gate; `/tmp/eko-117-test-serial.log` |
| `pnpm brand:check` | 0 | Final 194 files including build output; `/tmp/eko-117-brand.log` |
| `pnpm check:addresses` | 0 | 469 source files; `/tmp/eko-117-addresses.log` |
| `git diff --check` | 0 | Whitespace verification |

The initial focused failure was a fixture helper defaulting an explicitly undefined origin back to the allowed origin. The missing-origin test now passes a distinct absent-header value; its assertion is unchanged. The file passed alone after correction and passed again with the final worker-consumption test. The other three files in the combined check passed all 48 tests. Migration generation first needed explicit schema/dialect arguments, then a relative output path because this drizzle-kit version mishandled absolute output paths; generation succeeded using a task-specific temporary directory, which was removed. No other migration number was generated or copied into the worktree.

Checkpoint: `/tmp/eko-117-checkpoint.json`. Typecheck session `90770` completed with exit 0; first full test session `89283` completed with exit 1. Indexer isolated reproduction session `72783` completed with exit 0; logs above. The full gate passed every earlier package and engines (249 tests), then indexer finished with 151 passing and one timeout in `test/log-head.test.ts:312` (1000-block dense live payload fixture, 120-second existing limit). No timeout/assertion/test was changed. Coverage is fixture/injection/migration behavior, not a measured coverage percentage or live evidence. The isolated file passed all 41 tests in 174.85 seconds. Final full gate session `15148` completed with exit 0 using verified `pnpm_config_workspace_concurrency=1` and the requested two Vitest workers, preserving every timeout and assertion. The final run passed indexer (152 tests, 257.69 seconds), engines (249 tests, 65.49 seconds), server (406 tests, 94.19 seconds), MCP (24 tests), all other workspace suites, web/server builds and the role-image gate. The existing optional chain-fork skip remains; no skip was added. Brand and address gates were rerun at the end and both exited 0. All commands are complete; no verification process remains running. Next action is lead review/integration of the uncommitted candidate, including migration ordering, followed by separately authorized operational acceptance.

## Integration note

Reserved migration 0033 was retained at integration (no renumbering). Its snapshot now extends 0031_trade_reconcile with a fresh UUID v4 and only the two Telegram account-link tables. All existing journal entries are unchanged; 0033 is appended at idx 18 with when 1790970577347 (0031 + 1). Migration tests retain every prior assertion block and verify the 0031→0033 chain and upgrade/rerun preservation. Telegram routes are added alongside execution and prepared OAuth consent services. Earlier checks above describe the original branch candidate.

Integration checks on the resolved worktree (all complete; no source changes after the final migration correction):

| Command/check | Exit | Evidence |
|---|---:|---|
| `pnpm typecheck` | 0 | `/tmp/eko-117-integration-typecheck.log` |
| Initial `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/harness-migrations.test.ts test/telegram-dms.test.ts` | 1 | 27 passed, two old ledger totals still expected 18; corrected to 19 without removing assertions; `/tmp/eko-117-integration-focused.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/harness-migrations.test.ts` | 0 | 14 tests; `/tmp/eko-117-integration-migrations-final.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test` | 0 | 468 tests; `/tmp/eko-117-integration-server.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test` | 0 | 694 tests; `/tmp/eko-117-integration-web.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/bots test` | 0 | 19 tests; `/tmp/eko-117-integration-bots.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/shared test` | 0 | 361 tests; `/tmp/eko-117-integration-shared.log` |
| Journal preservation, non-future timestamp and exact snapshot delta assertions | 0 | Existing journal unchanged; new idx 18; 0031 predecessor and exactly two new tables |
| Existing harness assertion and v1 route retention assertions | 0 | Every existing assertion retained with exact ledger totals adapted; every existing route registration retained |
| `git diff --check` | 0 | No whitespace/conflict errors |
| Anchored text conflict-marker scan | 0 | Underlying `rg` exit 1 means no marker lines; a literal marker mention in an existing task 077 report is documentation |

No files were renamed or removed. Added incoming files: server `drizzle/0033_telegram_dms.sql`, `drizzle/meta/0033_snapshot.json`, `src/http/v1/telegram.ts`, `src/telegram/delivery.ts`, `src/telegram/link.ts`, `test/telegram-dms.test.ts`; shared `src/telegram.ts`; this report. Followed BACKEND §16 / §23 CA-22 and FRONTEND §3.11. No new spec ambiguity or TODO(spec) was introduced during resolution. Root `pnpm test`, builds, migration application and live delivery were not run at integration. Git metadata is untouched, so the lead must stage the resolved files and commit the merge.
