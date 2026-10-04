# Packet 122 implementation handoff

Prepared and tested locally with neutral fixtures. No commit, push, deployment,
publication, external messages or paid run. External cost: **$0**; live RPC units:
**0**. No personal identifiers, secrets or source identifiers needed replacement.
No dependencies, lockfile, read-only specs, Guard logic or prototype changed.
The lead owns committing and applying server migration **0023**.

Candidate: `e0b906a49ed50e8608d562be409dd566b817a3f3` plus the uncommitted packet changes.
Source fingerprint (SHA-256 over sorted changed paths and bytes, excluding this
handoff): `a3ca582e7371fd36dea9367a2f973a087a8648c26ee64447393600356354d0b2`.

## Changes and spec

Followed BACKEND §17 and §23 CA-12, and FACTS §5. Existing code already persisted
referral codes and first attribution during SIWE verification, exposed
`GET /v1/referrals`, and held qualified counts/time bonuses at zero. Preserved
that behavior and added a database self-referral constraint and regression tests.
No D0+1 bonus or redemption implementation is enabled.

- `apps/server/drizzle/0023_points_ledger.sql`,
  `apps/server/drizzle/meta/{0023_snapshot,_journal}.json`,
  `apps/server/src/db/schema.ts`: append-only `points_ledger`, immutable original
  credits, unique category/source events, unique full reversals, database shape
  and reversal validation, and persistent scan creator attribution. Update,
  delete and truncate of the ledger are rejected. Account deletion cannot
  cascade away points history.
- `apps/server/src/points/{config,service}.ts`: internal hooks for guarded USD
  volume, shared journal entries, ready scans opened by another wallet, and
  confirmed Ghost tips. Account locks serialize daily UTC cap checks across
  service instances. Caps count gross credits; reversals do not refill them.
  Volume requires affirmative confirmed/guarded evidence and negative round-trip
  and crew classifications; unknown classifications earn nothing.
- `apps/server/src/{config,app}.ts`, `.env.example`: configure the T activation
  instant and category rates/caps explicitly. Unset activation, missing rates,
  zero rates or zero caps produce no credits. Defaults remain disabled.
- `apps/server/src/harness/journal.ts`: shared-entry credits use the existing
  encrypted journal transaction, after the de-identified share succeeds.
  Neither private payloads nor ground-truth contents enter the points ledger.
- `apps/server/src/http/v1/{index,reads}.ts`: authenticated scan creation records
  first attribution; ready scan opens earn for the creator once per other
  verified wallet. Guest, creator, demo, missing and pending opens earn nothing.
- `apps/server/test/harness-migrations.test.ts`: extend the strict chain/ledger
  expectations to 0023, verify the new snapshot against its predecessor, and
  exercise upgrades preserving referrals and immutable points on rerun.
- `apps/server/test/points-referrals.test.ts`: disabled configuration/T boundaries,
  concurrent duplicate credits, global source uniqueness, cap races and UTC day
  rollover, round-trip/crew/unknown/guest exclusions, confirmed tips, immutable
  reversals, journal rollback, scan ownership/opens, and persisted referrals.

## TODO(spec) and dependencies

All three new TODO(spec) notes are in `apps/server/src/points/`:

1. `config.ts`: exact point rates/daily caps are unspecified. **Launch decision:**
   approve category economics and configure `POINTS_ACTIVE_FROM` plus
   `POINTS_RATES`; the checked-in defaults are empty/disabled. Configured volume
   rates count points per USD, other categories per qualifying action; fractional
   point totals round down. No economics were supplied as production defaults.
2. `service.ts`, scan creation: target-deduplicated jobs do not specify creator
   attribution. Use the first authenticated creation request, retain it on later
   creation requests, and never attribute a share-link open as creation.
3. `service.ts`, scan opens: repeat/anonymous eligibility is unspecified. Count
   one ready-card open per other verified wallet per scan; guests earn nothing.

Integration/deployment dependencies:

- 090, 092 and 107 provide the implemented account, journal and scan paths used
  here. 109 adds no eligible producer in this checkout.
- 076's authoritative v1 confirmed guarded-fill producer is absent here. The
  guarded-volume hook is prepared and fixture-tested, **not wired to heritage
  quote-estimated fills or paper/testnet orders**. Its owner must provide the
  immutable fill source, actual USD volume, occurrence time and authoritative
  round-trip/crew exclusions, and call `reverse` if credited evidence is corrected.
- 118 is queued outside this worktree. The confirmed-tip hook is prepared and
  fixture-tested; human-approved reports alone do not establish a contributor's
  confirmed tip. Wire only a persisted confirmed-tip attribution producer.
- Beat the Swarm/caller wins and bounties stay inactive; rate configuration
  rejects unsupported categories. No public earning/reversal/redemption endpoint
  exists. Referral qualification and time bonuses remain owned by the D0+1 work.
- Apply server migration 0023 before using the configured hooks. Existing scan
  migration 0135 remains owned by 107. No migration was applied to an external DB.

## Reproduction and verification checkpoint

All checks use local PGlite, synthetic encryption/signing keys and HTTP injection;
no listening ports or network are required. Functional fixture coverage is listed
above; no live chain, acceptance or percentage coverage claim is made.

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/server test test/points-referrals.test.ts` | 0 | 8 tests; `/tmp/eko-122-points-verified.log` |
| `pnpm --filter @eko/server test test/harness-migrations.test.ts` | 0 | 7 tests; `/tmp/eko-122-migrations-verified.log` |
| `pnpm typecheck` | 0 | `/tmp/eko-122-typecheck-verified.log` |
| `pnpm brand:check` | 0 | `/tmp/eko-122-brand-verified.log` |
| `pnpm check:addresses` | 0 | 402 source files; `/tmp/eko-122-addresses-verified.log` |
| `pnpm_config_workspace_concurrency=1 VITEST_MAX_WORKERS=2 pnpm test` | 0 | 2,686 Vitest tests, 33 contract tests and role-image checks; `/tmp/eko-122-test-verified.log` |

Initial focused command:
`pnpm --filter @eko/server test test/points-referrals.test.ts test/v1-account.test.ts test/private-journal.test.ts test/scan-jobs.test.ts`
exited 1: 42 passed, one new fixture used the real clock with a future event.
Corrected the fixture to use its injected clock; the final points-only check
above passes. The three existing focused files passed unchanged in that run.
The initial full gate (one worker) exited 1: five assertions still expected
10 migrations rather than 11; the other 297 server tests passed. Extended the
strict expectations and added snapshot/upgrade preservation checks; all seven
focused migration tests now pass. No assertions were removed or weakened.
The final full-gate evidence refers to the corrected source fingerprint.

Final checkpoint: `/tmp/eko-122-checkpoint.json`; full-test process session
`19358` completed with exit 0. The contract suite retains its one existing skipped
test; no tests were newly skipped. The full gate also built the web/server images
and checked supported role shutdown and unsupported role refusal. No gate is
running. Next action belongs to the lead: review/commit the candidate and arrange
the separately authorized migration/configuration and producer integration.
