# Task 109 implementation report

Renumbered at integration: the historical `0021_bags` migration is now
`apps/server/drizzle/0024_bags.sql` with `meta/0024_snapshot.json`. Apply **0024**
before serving shares. The existing journal entries remain unchanged; the new
entry has idx 11 and a timestamp greater than 0023. The snapshot has a fresh UUID
and follows 0023, retaining its points tables and referral constraint while adding
only `bag_shares`. Migration tests retain both branches' assertions and exercise
0023 → 0024 with points and redacted snapshots preserved. The report and check
results below describe the original branch revision and its historical numbering.

Candidate: `e0b906a49ed50e8608d562be409dd566b817a3f3` plus the uncommitted packet-109 changes. Source-content SHA-256 (sorted changed paths and contents, excluding this report): `19ffa21d5e5997f6927c569e416a436e2536109f30149ba4594a1e84213228b1`. No commit, push, deployment, publication, external message, paid acquisition or release approval was performed.

Implemented against BACKEND §§15.1 and 23 CA-6, FRONTEND §3.7, and FACTS §7. Read AGENTS including rule 9 and the marketing claims rules. No personal identifiers, real secrets, new dependencies, lockfile changes, Guard logic changes, prototype changes or read-only spec changes were added.

## Changed files

- `apps/server/src/read/bags.ts`: indexed candidate discovery; balanceOf reads pinned to the indexed block; canonical-hash recheck; measured card/price projection; per-row unknown/error status; bounded durable scan admission and explicit failed-job retry. Exact decimal-string rounding and an allowlist build the public snapshot before persistence. Public reads use only that snapshot.
- `apps/server/src/http/v1/bags.ts`, `http/v1/index.ts`: owner-only `GET /v1/wallets/:address/bags`, explicit `POST /v1/wallets/:address/bags/share`, and unauthenticated `GET /v1/bags/:id`. SIWE ownership is checked before holdings/RPC/scan access. Demo shares/retries and foreign write origins are refused. All success and error responses use `Cache-Control: private, no-store`.
- `apps/server/src/db/schema.ts`, `drizzle/0021_bags.sql`, `drizzle/meta/0021_snapshot.json`, `drizzle/meta/_journal.json`: immutable redacted JSON snapshots with opaque UUIDs. No private report, session, owner-account ID or hidden wallet/value field is stored in the share table. Migration generated offline with drizzle-kit, renamed to the reserved number 0021, and exercised by migrated PGlite tests.
- `packages/shared/src/contracts/feed.ts`, `packages/shared/test/fixtures/contracts/v1.json`: row availability, paging/coverage, independent wallet/value opt-ins, share responses, and a public report schema whose coin dollar fields may be omitted.
- `apps/server/test/harness-migrations.test.ts`: keeps exact ledger/snapshot and existing data-preservation assertions, extends them for 0021, and verifies upgrade from 0017 plus idempotent snapshot persistence.
- `apps/server/test/bags.test.ts`: ownership, guest/demo refusal, block pinning and reorg invalidation, null balances and recovery, zero balances, missing/corrupt cards, queue admission/errors/retry/progression, paging, route limits, independent opt-ins, public/storage/cache isolation, immutable snapshots, channel silence, and exact two-significant-figure rounding.

## TODO(spec) and dependencies

Two new TODO(spec) notes:

1. `packages/shared/src/contracts/feed.ts`: CA-6 does not specify per-row availability. Unknown balance and exit cost use `null`, with additive `balanceStatus`, `status`, `unavailable` and generic `error` fields. This extends the spec's string/numeric fields rather than fabricating measured zero.
2. `apps/server/src/read/bags.ts`: CA-6 does not specify bounds, paging or retry semantics. Use 100 indexed candidates per page, four concurrent balance reads, ten new scan admissions per request, and owner `?retry=true` to rearm failed waiting jobs within task 107's existing global queue capacity. `cursor` pages candidates; summary counts/value cover the returned page. Shares snapshot the first bounded page and retain its cursor so incomplete inventory is explicit. `coverage: indexed_candidates` does not claim exhaustive wallet discovery.

The public schema omits dollar fields by default, including nested coin price/liquidity/market-cap fields. Wallet opt-in and value opt-in are independent. Balance strings are rounded to two significant figures in every shared snapshot, including value-enabled shares. Unknown balance stays null. Missing any holding value omits the page total. Ready means a persisted card exists; pending verdicts and missing exit-cost measurements retain their masks and do not certify Guard completeness.

Apply server migration 0021 before serving shares. Existing tasks 035/090/107 and indexed balances provide card/auth/worker dependencies; live workers and the existing metered chain client must be configured for actual acquisition. The API performs no chain-table writes and emits no holdings over public or user channels. OG image rendering and the bags frontend are outside this packet and remain dependencies. No live-chain completeness, provider billing, staging, browser or deployment result is claimed.

## Checks and reproduction

Run from the worktree root. All new tests use migrated local PGlite, indexed/card fixtures, mocked balance reads, Fastify injection and in-memory sockets. They need no network or listening port.

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/server exec drizzle-kit generate --name bags` | 0 | Only bag_shares DDL; reserved migration 0021 |
| `pnpm --filter @eko/server test test/bags.test.ts test/v1-reads.test.ts test/v1-account.test.ts` | 0 | 43 tests; `/tmp/eko-109-focused-final.log` |
| `pnpm --filter @eko/server test test/bags.test.ts` | 0 | Final source, 18 tests; `/tmp/eko-109-bags-final.log` |
| `pnpm --filter @eko/shared test test/contracts.test.ts` | 0 | 200 contract tests; `/tmp/eko-109-contracts.log` |
| `VITEST_MAX_WORKERS=1 pnpm --filter @eko/server test test/harness-migrations.test.ts` | 0 | 7 upgrade/preservation tests; `/tmp/eko-109-migrations.log` |
| `pnpm typecheck` | 0 | `/tmp/eko-109-typecheck-final-candidate.log` |
| `pnpm_config_workspace_concurrency=1 VITEST_MAX_WORKERS=2 pnpm test` | 0 | 2699 Vitest tests, 33 contract tests (one existing fork skip), and build/role checks; `/tmp/eko-109-test-final.log` |
| `pnpm brand:check` | 0 | `/tmp/eko-109-brand-final.log` |
| `pnpm check:addresses` | 0 | `/tmp/eko-109-addresses-final.log` |
| `git diff --check` | 0 | No whitespace errors |

The first bags-only fixture run exited 1: it exposed a missing required public coin percentage field, plus two test setup errors (seeded price data and a default origin argument). The public projection was fixed and the test setups corrected; no existing assertion or safety requirement was removed or weakened. Later focused checks passed. A final cache-hook review moved the header to onSend, so the global demo guard also returns uncached refusals; the final focused run verifies that path.

The first serialized full `pnpm test` (one file worker) exited 1 only on five migration-ledger assertions still expecting ten migrations. All preceding packages and all other server tests passed. Those assertions were extended to eleven migrations without weakening their exact ledger/data/schema checks; a new 0017 → 0021 preservation test was added. The focused migration suite passed. The final full gate uses two file workers and serial workspaces. Initial evidence is retained at `/tmp/eko-109-test.log` and `/tmp/eko-109-checkpoint-first.json`.

Gate checkpoint: `/tmp/eko-109-checkpoint.json`; runner `/tmp/eko-109-gates.py`. The checkpoint retains the candidate/digest, current child PID, command/log, completed exit codes and next action. Actual cost $0 and live request units 0; all coverage is offline fixtures. All gate processes completed. Web/server bundles were built and the role-image fixture gate passed. The contract suite retains its existing fork skip when RPC_HTTP_URL is unset; no live fork evidence is claimed. Next actions belong to the lead: review/commit the candidate and apply migration 0021 in an authorized environment. No local job remains running.
