# Task 127 report

Candidate: `55db3968ca2364b8e9d93f1fb220bcace328a6d3` plus the uncommitted packet
changes below. Source/file manifest SHA-256:
`82660ee177dedc10477b709df829645127baa776fca4f82f671ee5c5df76a96e`.
Definition: sort changed/untracked paths, append path + NUL + file bytes + NUL;
exclude this report. The worktree was clean at the start. No commit, push,
deployment, account creation, signing, webhook registration, upload, cast or paid
provider run was performed. No personal identifiers were ported or introduced.

**Implemented and prepared offline; transport disabled and D0 activation unapproved.**
No credentials are loaded. Telegram transport and the unavailable server bots role
remain unchanged. No dependency declarations, package versions or lockfile changed.
Only reserved server migration 0041 was used.

## Changed files

- `apps/bots/src/farcaster/verify.ts`: constant-time HMAC-SHA512 signature validation
  over bounded raw bytes, authenticated event parsing and profile-field stripping.
- `apps/bots/src/farcaster/webhook.ts`: isolated raw JSON parser and disabled HTTP
  route; invalid signatures/events rejected, valid events return 503 with zero
  scan, signer, asset or send calls.
- `apps/bots/src/farcaster/store.ts`: normalized cast-hash replay claims scoped by
  bot FID; transactional rolling-hour quota across replicas, fixed terminal states
  and no uncertain-send retries. Only hashes, rate keys, states and time persist.
- `apps/bots/src/farcaster/handler.ts`: explicit bot-FID mention filtering,
  self-cast/unsupported-target rejection, existing bounded target parser, approved
  managed signer UUID/FID verification, matching ready V2 scan/card, canonical
  record URL, deterministic reply/idempotency key and fail-closed `summon_x`
  checks before processing and immediately before sending.
- `apps/bots/src/farcaster/images.ts`: structural OG renderer interface using
  reply format, shared Guard projection/disclosures, image hash/dimension checks,
  no source names/symbols and no invented Guard exit-cost calculation.
- `apps/bots/src/farcaster/neynar.ts`: pure parent-bound Neynar request preparation
  with image and record embeds; provider adapter remains hard-disabled even when
  the summon flag is enabled. No client construction or local signing path.
- `apps/bots/src/index.ts`: exports the prepared Farcaster interfaces.
- `apps/bots/test/farcaster.test.ts`: 13 fixture tests covering raw signatures,
  invalid input, wrong FID, self/unsolicited casts, replay/concurrency/restart,
  deterministic replies, hostile/profile privacy, managed signer failures,
  missing/corrupt scans/images, three-per-hour rate limiting, flag-off zero sends,
  disabled HTTP/provider hooks and renderer/request interfaces.
- `apps/bots/FARCASTER.md`: Oct 16 bot FID/custody/managed signer/account disclosure
  readiness checklist, current disabled behavior, remaining integration work and
  separate D0 activation checklist. External setup items remain unchecked.
- `apps/server/src/db/schema.ts`, `apps/server/drizzle/0041_farcaster_summons.sql`,
  `apps/server/drizzle/meta/0041_snapshot.json`, `apps/server/drizzle/meta/_journal.json`:
  Farcaster interactions/rate serialization tables, additive migration and chained
  snapshot/journal. Existing Telegram tables and bigint update IDs are preserved.
- `apps/server/test/harness-migrations.test.ts`: strengthened fresh/upgrade/rerun
  coverage for 0041 and Telegram preservation; exact existing ledger assertions
  extend from 14 to 15 entries. No existing test/assertion was removed or relaxed.

Specs followed: BACKEND §16 and renderer §15.6; GO-PLAN §§3.4, 11.5 and custody
disclosure §5; MARKETING §§04–05. Consumes task 111 renderer interface, task 116
parser/bot workspace conventions and task 037 shared Guard copy. No spec files,
Guard design/evaluation, prototype, production environment or release flags changed.

## Verification

All pnpm runs used process-local `pnpm_config_verify_deps_before_run=false` and
`pnpm_config_update_notifier=false` to avoid automatic dependency repair/update
network access in this offline sandbox. Tests used `VITEST_MAX_WORKERS=2` for final
focused/full checks. No timeout, assertion or safety requirement was weakened.

| Exact final command | Exit | Result / log |
| --- | ---: | --- |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/bots test` | 0 | 2 files, 29 tests; `/tmp/eko-127-bots-focused.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/harness-migrations.test.ts` | 0 | 11 tests; `/tmp/eko-127-migrations-focused.log` |
| `pnpm typecheck` | 0 | Full workspace; 36.62 seconds; `/tmp/eko-127-typecheck.log` |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | All package suites, web/server builds and compiled-role checks; 424.60 seconds; `/tmp/eko-127-test.log` |
| `pnpm brand:check` | 0 | `/tmp/eko-127-brand.log` |
| `pnpm check:addresses` | 0 | `/tmp/eko-127-addresses.log` |
| `git diff --check` | 0 | No whitespace errors |

Earlier exact focused commands: `pnpm --filter @eko/bots typecheck` exited 0;
`pnpm --filter @eko/bots test test/farcaster.test.ts` exited 1 on the isolated
fixture expectation, then `VITEST_MAX_WORKERS=2 pnpm --filter @eko/bots test
test/farcaster.test.ts` exited 0 after its correction. Final combined bot tests
include the later pure provider-request assertions and cover the delivered source.
The full gate passed 44 server files / 396 server tests and the required compiled
startup/shutdown/refusal checks, including refusal of the still-unavailable bots
role. Nothing relevant changed after these checks; only this report was completed.

Initial focused bot tests exited 1 because a new missing-evidence fixture expected
the wrong shared Guard label. The failing file was rerun alone (exit 1) before
repair. Its assertion now checks `GUARD_PENDING`, and explicit shadow/candidate
label assertions were added. The corrected file passed all 13 tests (exit 0).
This was a fixture expectation error, not an application/provider/timing failure.
The initial focused migration file passed all 11 tests (exit 0).

Evidence is synthetic fixture evidence and in-process Fastify injection, not live
provider compatibility, on-chain FID ownership, custody, account disclosure,
publication or launch readiness acceptance. PNG fixtures contain only a PNG header;
they verify requested dimensions, content/image hashes, cache use, required copy
and adapter arguments, not PNG decoding, glyph output or visual layout. Real
satori/resvg implementation and PNG visual acceptance remain with the parallel
renderer work. No code coverage percentage or live performance is claimed.

## TODO(spec) and dependencies

Every added `TODO(spec)`:

1. `apps/bots/src/farcaster/handler.ts`: BACKEND §16 does not specify multi-target
   or non-scan Farcaster replies. The smallest reading ignores them without a cast.
2. `apps/bots/src/farcaster/images.ts`: BACKEND §15.6 does not select a Guard 2
   route/account quote for a share headline. Exit cost stays unavailable rather
   than mixing quote snapshots, following task 111's conservative projection.

Remaining release dependencies: accept task 111's real renderer; provision public
HTTPS hosting for the exact rendered image; provision the bot account/FID and
hardware custody; disclose the bot/operator/custody/signer publicly; approve the
Neynar managed signer through hardware-held custody; supply credential, webhook
secret and stable identity-key configuration through deployment secrets; accept
Neynar client/lookup integration, account quotas/budget and ingress/APM redaction;
merge/apply the 0041 journal/snapshot after reconciling parallel migrations; and
wire an accepted bots role. Complete live checks under separate authorization.
The checklist documents these steps; none is marked done by fixtures. D0 transport
activation and `summon_x` release remain separate work and approval.

At-most-one attempt means a crash after claiming or an uncertain provider response
can leave an interaction unreplied. Claims are retained; manual reconciliation is
needed before any future replay mechanism. No retry/polling/unsolicited cast job
was introduced. A missing/pending/ambiguous scan or missing image gets no cast.

## Reproduction and long-job checkpoint

Run from the worktree root with existing dependencies:

```sh
export pnpm_config_verify_deps_before_run=false
export pnpm_config_update_notifier=false
VITEST_MAX_WORKERS=2 pnpm --filter @eko/bots test
VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/harness-migrations.test.ts
pnpm typecheck
VITEST_MAX_WORKERS=2 pnpm test
pnpm brand:check
pnpm check:addresses
git diff --check
```

Gate runner: tool session `1494`, `/tmp/eko-127-checks.py`. Checkpoint:
`/tmp/eko-127-checkpoint.json`; results: `/tmp/eko-127-results.json`; source manifest:
`/tmp/eko-127-source-manifest.json`. Logs use `/tmp/eko-127-<check>.log` and redact
workspace/home paths. Full-test subprocess `38129` and runner session `1494`
completed with exit 0. No check or build remains running. The final checkpoint
records all six completed checks and their elapsed times/results. No source
changes occurred during the full gate; the manifest still matches the handoff.
Next action: lead review/integration and the unchecked external readiness items
in `apps/bots/FARCASTER.md`; no automatic continuation or activation is scheduled.

Paid provider request units: 0. Provider spend: $0. Local CPU and model cost were
not measured. Read-only public protocol documentation was consulted; no Neynar API
requests or external messages were made. No deployment/live verification or
activation approval is claimed.

## Integration into integrate-c

Reserved migration `0041_farcaster_summons` retained its number (no renumbering).
It follows `0040_x_bot_dark` at journal idx 23 with `when` 1790970577352
(the previous entry + 1). Its snapshot has a fresh UUID v4 and chains from
0040, preserving all prior tables and metadata and adding only the two Farcaster
tables. Telegram and X exports and all existing harness assertion blocks remain;
full-chain ledger expectations now cover 24 entries, with Farcaster snapshot and
0040-to-0041 upgrade/replay assertions appended. Earlier verification above is
branch history; integration verification is reported separately by the resolver.

Integration checks used the same process-local offline pnpm settings described
above, with `VITEST_MAX_WORKERS=2` for tests and unchanged timeout settings:

| Integration check | Exit | Result |
| --- | ---: | --- |
| `pnpm typecheck` | 0 | All workspace typechecks passed |
| `pnpm --filter @eko/bots test` | 0 | 3 files / 55 tests passed |
| `pnpm --filter @eko/server test test/harness-migrations.test.ts` | 0 | 1 file / 17 tests passed |
| `pnpm --filter @eko/server test` | 0 | 57 files / 544 tests passed |
| Snapshot delta / prior-journal / harness-preservation check | 0 | Existing content/assertions retained; incoming chain verified |
| `git diff --check` | 0 | No whitespace errors |
| Text-only anchored conflict-marker scan | 0 | No markers; no-match grep exit normalized to success |

Logs: `/tmp/eko-int-c-127-typecheck.log`, `/tmp/eko-int-c-127-bots.log`,
`/tmp/eko-int-c-127-migrations.log`, `/tmp/eko-int-c-127-server.log`.
All check processes completed. The full root `pnpm test` was intentionally not
run during this merge; the lead owns that final gate. No git metadata was written,
so the lead must stage the resolved files and commit the merge. No files were
removed or renamed. No new `TODO(spec)` was introduced by conflict resolution.
