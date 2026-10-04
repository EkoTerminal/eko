# Packet 116 handoff

Candidate: `94495af646eb03a35eabb0e22e5892f6e82427df` plus the uncommitted changes
listed below. The lead commits. Prepared and fixture-tested; not deployed,
published, live-verified or release-approved. Telegram transport and
`APP_ROLE=bots` remain unavailable. No bot token was configured or read. No
Telegram/provider sends, chain requests or paid runs occurred; external cost $0.

Source fingerprint (SHA-256 over sorted changed paths, path plus NUL plus bytes
plus NUL, excluding this report):
`f262e3b7e292f402d32d3e62bcfa515b4adf1213e76a4489fecf219befd525f5`.

## Renumbered at integration

The original packet reserved migration `0024_telegram_groups`. At integration it
was renumbered to `0026_telegram_groups` (`drizzle/0026_telegram_groups.sql` and
`drizzle/meta/0026_snapshot.json`) after `0024_bags` and `0025_watch_alerts`.
HEAD's bags `0024_snapshot.json` is preserved exactly. The new snapshot chains
from 0025 and adds only the three Telegram tables; the journal appends idx 13
with a timestamp greater than every existing entry. Apply migration 0026 for
this integrated tree. The original packet history and check results below refer
to its pre-integration candidate.

## Changed files and spec

- `apps/bots/package.json`, `tsconfig.json`, `src/index.ts`, `pnpm-lock.yaml`, `Dockerfile`:
  new workspace using already locked shared/database/Fastify/Zod dependencies.
  Docker copies the new workspace manifest before frozen installation. No dependency versions were upgraded. grammY installation remains blocked.
- `apps/bots/src/telegram/{parse,handler,reads}.ts`: bounded target extraction,
  authenticated fixture processing, durable update deduplication, canonical scan
  links, Guard 037 text, pending/image-unavailable fallback, scan-service/Guard
  adapters, `/scan`, `/bags`, `/alerts`, `/help`, `/start` guidance/disclosures.
  Ambiguous targets require one address. Source prose, names and source links
  never become reply instructions or markup.
- `apps/bots/src/telegram/store.ts`: HMAC identifiers scoped per group; atomic
  first caller per coin/group; accepted 24-hour cohort-grade consumption;
  pending denominators; neutral leaderboard and usage badge. Grade evidence
  must match the call, its maturity/known-at cut and accounted cohort denominator.
- `apps/bots/src/telegram/{grammy,webhook}.ts`: typed grammY Api/InputFile adapter
  and secret-validated webhook preparation. Both reject transport use. This is
  **not an installed/running grammY bot** or a custom Bot API implementation.
- `apps/server/src/db/schema.ts`, `drizzle/0024_telegram_groups.sql`,
  `drizzle/meta/{0024_snapshot,_journal}.json`: reserved server migration 0024
  adds update interactions, first-call records and grades. Unique keys and
  database triggers prevent duplicate callers and mutation/deletion of calls/grades.
- `apps/bots/test/telegram.test.ts`,
  `apps/server/test/harness-migrations.test.ts`: 16 new bot fixture tests and
  strengthened migration-chain expectations/snapshot preservation for 0024.
- `apps/bots/README.md`: privacy, failure/delivery semantics, dependency/release
  prerequisites, BotFather privacy configuration, secret/logging requirements,
  `/start` disclosures and offline reproduction.

Followed BACKEND §16, FACTS §3, GO-PLAN §3.3; reused 107's scan contract and 037's
shared Guard copy. Dependencies 111/112 retain ownership of rendered images and
accepted outcome/cohort policy. Marketing §04 relationship/disclosures remain
the shared canonical copy. Read-only specs, Guard logic/design, money paths and
prototype were not edited. No personal identifiers or secrets were introduced;
all added identity fixtures are neutral. No source personal identifier required
replacement.

## TODO(spec) and remaining dependencies

All three new `TODO(spec)` notes:

1. `parse.ts`: mixed/multiple targets require one address; no prose-based selection.
2. `store.ts`: first caller means first durably accepted scan; Telegram delivery
   order can differ from message timestamps.
3. `store.ts`: task 112 owns cohort membership, thresholds and policy acceptance;
   absent an accepted adapter, every caller grade remains pending.

Remaining integration:

- Install grammY 1.x in an authorized dependency environment, update its declaration
  and lockfile offline where cached, and verify actual Api/InputFile compatibility.
  The sandbox cannot open the existing pnpm store index. An additional pnpm
  lockfile-only add triggered registry verification despite `--offline`; DNS
  requests failed and the command was interrupted (exit 130). Nothing downloaded
  and no grammY declaration was retained. A pnpm exec also tried automatic
  dependency repair and failed; checks use the flags below to prevent that behavior.
  There were **registry DNS attempts**, not live bot calls or successful acquisition.
- Task 111 must supply accepted deterministic 1200×675 PNGs for the exact Guard
  snapshot. Fixture image bytes are mock data, not rendered PNG/live evidence.
- Task 112 must supply accepted mature launch-cohort grades. This packet consumes
  accepted grades and does not implement another outcome oracle or speculative
  grading thresholds. Fixtures do not establish accepted production policy.
- Apply migration 0024; configure a stable separate identity hashing secret;
  integrate existing scan/Guard services and accepted renderer/grade callbacks.
  Only after separate release acceptance may grammY and the deployment role be
  wired. No webhook was registered, no listener started and no transport enabled.
- DM account linking/watchlist/approval notification delivery remain separate
  integration. Commands here provide scans/web guidance only.
- A crash after durable update claim or an uncertain send can leave a missing
  reply. No automatic replay is allowed to duplicate a potentially delivered
  message; retained `claimed`/`failed` states need manual review before future replay.

## Checks and reproduction

The final full gate uses this environment to avoid pnpm 11 automatic repair/update
operations and keep timing tests stable, without changing assertions. Focused
checks use the first two flags and one Vitest worker; the first full run used
workspace concurrency 1:

```sh
export pnpm_config_verify_deps_before_run=false
export pnpm_config_update_notifier=false
export pnpm_config_workspace_concurrency=2
export VITEST_MAX_WORKERS=1
```

| Command | Exit | Local evidence |
|---|---:|---|
| `pnpm --filter @eko/bots test` | 0 | 16 tests; `/tmp/eko-116-focused-bots.log` |
| `pnpm --filter @eko/server test test/harness-migrations.test.ts` | 0 | 6 tests; `/tmp/eko-116-focused-migrations.log` |
| `pnpm --filter @eko/server test test/roles.test.ts` | 0 | 24 tests; `/tmp/eko-116-focused-roles.log` |
| `pnpm typecheck` | 0 | `/tmp/eko-116-typecheck.log` |
| `pnpm test` | 0 | 2,739 Vitest tests; 33 Foundry passes, 1 existing skip; web/server builds and compiled-role fixtures; `/tmp/eko-116-test-final.log` |
| `pnpm brand:check` | 0 | `/tmp/eko-116-brand-final.log` |
| `pnpm check:addresses` | 0 | `/tmp/eko-116-addresses.log` |
| `CI=true pnpm install --offline --no-frozen-lockfile --lockfile-only` | 0 | Workspace lockfile updated with existing versions |
| `CI=true pnpm install --offline --frozen-lockfile --lockfile-only` | 130 | Interrupted after remaining silent; no install pass claimed |
| `git diff --check` | 0 | No whitespace errors |

The new workspace's local ignored dependency link reuses the already installed
server dependencies. Full clean-checkout installation is **not claimed**: the
sandbox store restriction blocks it. The lockfile-only check is narrower evidence.

The first full `pnpm test` run (workspace concurrency 1) exited 1 on the Docker
manifest parity assertion in `roles.test.ts`: the new workspace manifest had not
been copied before installation. All other server tests and earlier suites passed.
The Dockerfile entry was added and all 24 focused role tests passed before the
final full run. Earlier TypeScript/migration/bot check evidence remains valid: the
subsequent change is only the manifest-copy line. No test was newly skipped or
weakened. Foundry's existing `testForkCommitAndVerifyFixture` was skipped because
`RPC_HTTP_URL` is unset; no live-fork evidence is claimed.
The first full-run log is `/tmp/eko-116-test.log`.

Long-job checkpoint: `/tmp/eko-116-checkpoint.json`; final gate wrapper session `37605` (earlier session `16894` completed).
Each checkpoint entry records the actual command, child PID while running, log and
exit. Source revision/fingerprint above identifies the checked candidate. All
required gates have completed; no gate command remains active. Next action:
lead review and commit; dependency/release integration remains unaccepted. No runtime charges, bot request units, live coverage or deployment
evidence are asserted by these fixture checks.

## Integration verification (file edits only)

The merge resolutions preserve every prior migration-chain assertion, extend the
exact tag/idx/ledger expectations, and add 0026 snapshot preservation plus an
offline 0025→0026 upgrade/rerun test. No assertions were removed or weakened,
no timeouts were raised, no dependencies were declared, and no git metadata was
written. Telegram transport and the deployment role remain disabled.

Checks used the existing process-only pnpm automatic-repair/update flags and
`VITEST_MAX_WORKERS=1`; the full gate used workspace concurrency 2.

| Check | Exit | Integration evidence |
|---|---:|---|
| `pnpm typecheck` | 0 | `/tmp/eko-int-b-116-typecheck.log` |
| `pnpm --filter @eko/server test test/harness-migrations.test.ts` | 0 | 10 tests; `/tmp/eko-int-b-116-migrations.log` |
| `pnpm --filter @eko/contracts test` | 0 | 34 passed, one existing fork skip; `/tmp/eko-int-b-116-contracts.log` |
| First `pnpm test` | 1 | Contracts dependency links were absent after local dependency recovery; restored before retry |
| Final `pnpm test` | 0 | Every workspace suite, web/server builds and role-image check; `/tmp/eko-int-b-116-test-final.log` |
| `git diff --check` | 0 | Resolved working-tree whitespace |
| Conflict-marker scan | 1 | `rg` found no markers (successful absence check) |
| Snapshot/journal/Dockerfile/lockfile preservation assertions | 0 | HEAD 0024/0025 bytes and journal prefix; incoming SQL/table delta and manifest/lockfile changes |
| `CI=true pnpm install --offline --frozen-lockfile` | 130 | Stopped after pnpm 11 attempted registry policy checks despite offline mode; DNS failed |
| Same install with process-only `pnpm_config_trust_lockfile=true` | 1 | Lockfile resolution accepted, but cached `@fontsource/bricolage-grotesque@5.3.0` tarball is missing |

**Offline frozen installation is not verified.** No repository policy setting
was changed. The trusted-lockfile diagnostic omitted registry policy revalidation;
it did not establish supply-chain verification or an install pass. Installed
dependencies were restored locally from the incoming packet's existing worktree
for the successful test/build checks. Populate the required offline cache in an
authorized environment before rerunning the plain frozen install. No packages
were downloaded, and no Telegram or chain-provider transport was enabled.

The first full-gate log is `/tmp/eko-int-b-116-test.log`; the completed checkpoint
is `/tmp/eko-int-b-116-checkpoint.json`. No verification command remains running.
The lead must stage the file resolutions and commit; the unmerged index entries
remain intentionally untouched. No new `TODO(spec)` decisions were introduced.
