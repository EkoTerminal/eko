# Task 126 — X bot dark preparation report

Candidate: base `55db3968ca2364b8e9d93f1fb220bcace328a6d3` plus the uncommitted
worktree changes listed below. No commit, push, deployment, approval, purchase,
account mutation or live platform operation was performed. All transport evidence
is from fakes. Actual external spend: $0.

## Changed files

- `apps/bots/src/x/parse.ts`: bounded address/explicit scan-ticker parser, mention-page
  validation and decimal-string tweet IDs without Number precision loss.
- `apps/bots/src/x/store.ts`: durable paginated cursor/high-water state, poll cadence
  and lease fencing, interaction claims, HMAC author quotas, UTC daily/monthly usage,
  pre-operation spend reservations, persistent auth stop and burn transaction claims.
- `apps/bots/src/x/handler.ts`: Guard 037 deterministic copy and reply-size renderer
  consumption; flag checks before reads/uploads/replies; separately gated burn posting
  seam. No collector, confirmation policy, credentials or live integration.
- `apps/bots/src/x/transport.ts`, `apps/bots/src/index.ts`: exported mockable interface
  and permanently disabled default transport. Both runtime flags default off.
- `apps/bots/test/x.test.ts`: 23 offline tests; PNG headers are adapter fixtures,
  not rasterized cards or live delivery evidence. Existing Telegram tests retained.
- `apps/bots/README.md`: operations semantics and external account/credential/cap readiness.
- `apps/bots/package.json`, `pnpm-lock.yaml`: existing OG renderer workspace dependency;
  no external package additions or upgrades.
- `apps/server/src/db/schema.ts`, `apps/server/drizzle/0040_x_bot_dark.sql`,
  `apps/server/drizzle/meta/0040_snapshot.json`, `apps/server/drizzle/meta/_journal.json`:
  only reserved migration 0040, four new tables; existing interaction schema preserved.
- `apps/server/test/harness-migrations.test.ts`: extended ledger expectations to 15
  migrations without removing prior-data assertions; fresh/rerun checks and a new
  upgrade test from Telegram 0026 preserving interactions, cursor, quotas and burn dedupe.

Spec followed: BACKEND §16 (and renderer interface §15.6 / defaults §2.4),
GO-PLAN §§3.2, 8, 11.5; FACTS §7 shared contract boundary; MARKETING §§04–05 claims/disclosures; existing shared
ScanResult/Guard contracts. Guard logic and read-only specs were not edited.
No personal identifiers were introduced or copied from a source.

## Checks and checkpoint

All commands ran from this worktree. Unless shown otherwise, pnpm commands used
`pnpm_config_verify_deps_before_run=false pnpm_config_update_notifier=false` to
prevent automatic dependency repair/network operations. Worker caps do not change
assertions or timeouts. No tests were removed, weakened or newly skipped.

| Command | Exit | Evidence |
| --- | --- | --- |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/bots test test/x.test.ts` (first iteration) | 1 | 21/22; test setup left flag off when expecting a disabled-transport failure; corrected the setup. |
| `pnpm --filter @eko/bots typecheck` (final focused) | 0 | Bot source/tests typechecked. Earlier iterations exited 2 for missing restored Vitest links, null narrowing and a fixture callback annotation; all corrected. |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/bots test` | 0 | 39/39 tests in two files, including 23 X tests and 16 existing Telegram tests. |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/harness-migrations.test.ts` (first iteration) | 1 | Eight assertions still expected the old total of 14 migrations; extended to 15, preserving assertions. |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/harness-migrations.test.ts` (final focused) | 0 | 11/11; fresh, upgrade and rerun evidence. Log `/tmp/eko-126-migrations-final.log`. |
| `pnpm typecheck` | 0 | All workspace typechecks. Log `/tmp/eko-126-typecheck.log`. |
| `VITEST_MAX_WORKERS=2 pnpm test` (first gate) | 1 | Offline install had removed contracts' local OpenZeppelin dependency link; restored the existing local package link. No contract source change. |
| `pnpm --filter @eko/contracts test` | 0 | 34 passed; one existing fork test skipped by its unchanged configuration. Log `/tmp/eko-126-contracts.log`. |
| `VITEST_MAX_WORKERS=2 pnpm test` (final gate) | 0 | 3,137 Vitest tests passed; 34 Foundry tests passed with one unchanged fork skip; web/server builds and role-image checks passed. Log `/tmp/eko-126-test-final.log`. |
| `pnpm brand:check` | 0 | Passed after build. Log `/tmp/eko-126-brand.log`. |
| `pnpm check:addresses` | 0 | Passed. Log `/tmp/eko-126-addresses.log`. |

Dependency update: required `CI=true pnpm install --offline --no-frozen-lockfile`
exited 1 because the store lacked an existing font package tarball. This install
removed local dependency links before failing. Restored project links and virtual
packages from the already installed checkout, without network or dependency changes.
`CI=true pnpm install --offline --no-frozen-lockfile --lockfile-only` exited 0 and
updated only the renderer workspace declaration in the lockfile. A clean-checkout
`pnpm install --frozen-lockfile` is not verified in this sandbox; its existing offline
store is incomplete. Release environment must verify it with the accepted store.

Completed long-job checkpoint: final full test session `56949` exited 0, log
`/tmp/eko-126-test-final.log`; source candidate is the base above plus these changes.
Typecheck, focused migration checks, full tests/builds/role checks and final brand/address
checks completed. No gate remains running. Actual provider/platform cost was $0;
coverage here is scenario/test-count evidence, not an instrumentation percentage or
live acceptance claim. Next action belongs to the lead: review/integrate the uncommitted
candidate and independently complete external readiness before any release.

## Every new TODO(spec)

- Parser: §16 leaves multiple-target selection unspecified; ambiguous actionable
  targets are ignored.
- Store: GO-PLAN §3.2 specifies 3M reads/month without an exact daily ceiling;
  conservatively cap at 100k per UTC day.
- Store: empty-poll and media billing are unspecified; charge at least one read for
  a validated empty poll and retain the full read reservation on uncertain failures.
  Reply/post reservations use the spec's approximate prices; actual media/empty-poll
  pricing must be reconciled before transport acceptance.
- Handler: §15.6 does not select a Guard 2 exit quote for the card headline; display
  unavailable, matching task 111, rather than combine route/account snapshots.

## Remaining dependencies / reproduction

Prepared and tested: persisted parsing/cursor/dedupe, three-per-author rolling-hour
cap, daily reply/read caps, monthly spend/read limits, fake upload/reply, 401/403 stop,
flag toggles, lease fencing, and separate fake burn posting. Each interaction has at
most one send attempt; delivery is not guaranteed, and uncertain claims are not retried.

External readiness remains unperformed: automated account label, access/payment,
read/write application, deployment secrets, stable identity hashing key, $400 platform
spend cap and 50%/80% alerts. The renderer's real satori/resvg output belongs to the
parallel branch. Runtime flag/read-service wiring, accepted API/billing compatibility,
scheduler/release integration and D0 burn collection/confirmation require their
separate accepted integration and release authorization. Transports remain disabled.

Reproduce with existing installed dependencies:

```sh
pnpm --filter @eko/bots test test/x.test.ts
pnpm --filter @eko/bots typecheck
pnpm --filter @eko/server test test/harness-migrations.test.ts
pnpm typecheck
VITEST_MAX_WORKERS=2 pnpm test
pnpm brand:check
pnpm check:addresses
```

## Integration migration note

Reserved number 0040 was retained at integration. Migration `0040_x_bot_dark`
now follows `0037_swarm_inference` at journal index 22, with `when`
1790970577351 (the previous entry + 1). Its fresh UUID v4 snapshot chains from
0037 and preserves all predecessor tables and metadata, adding only the four X
bot tables. All existing harness assertion blocks were retained; the X snapshot
block follows Swarm, the X upgrade test starts at 0037, and final ledger counts
are 23. Earlier check results above describe the branch candidate before integration.

Integration verification (file edits only; git index unchanged):

- `pnpm typecheck`: exit 0 after restoring the missing local
  `@eko/og-renderer` workspace link for bots (initial exit 2).
- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/bots test`: exit 0, 42 tests
  passed (initial exit 1 from the same missing workspace link).
- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/harness-migrations.test.ts`:
  exit 0, all 16 tests passed.
- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test`: exit 0.
- Journal preservation and exact snapshot delta validation: exit 0.
- `git diff --check`: exit 0; anchored conflict-marker search: exit 1
  (no matches). An unanchored search also finds an existing report quoting the
  marker text; that is not a merge conflict.

Logs: `/tmp/eko-126-integration-typecheck.log`,
`/tmp/eko-126-integration-bots.log`, `/tmp/eko-126-integration-migrations.log`,
`/tmp/eko-126-integration-server.log`. No assertions or timeouts changed except
for extending migration lists/counts and adapting the incoming X predecessor.
No new spec ambiguity was introduced. BACKEND §§15.6, 16 and the lead's migration
ordering instructions govern this resolution. Root `pnpm test` was intentionally
not run; the lead owns that final gate. Clean-checkout frozen installation and
external platform readiness remain unverified as described above.
