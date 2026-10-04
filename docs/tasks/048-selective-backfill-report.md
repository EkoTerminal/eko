# Task 048 · Selective backfill report

Implemented and left uncommitted for the lead. This is fixture validation and prepared acquisition code; no paid run, deployment, release, accuracy study, or live request occurred.

## Changes and revisions

- `apps/engines/src/selective-backfill.ts`: closed source/availability/selection manifest, exact UTC calendar frame, sparse cached timestamp search, full-frame launch metadata enumeration, and selective token/market event tapes from each captured creation through the declared exclusive follow-up cutoff. Parent-block boundary state is read once per selected coin and preserved separately from its ordered event shards. Older creations are reconstructed from creation rather than clipped to cohort start. No whole-chain block replay or engine evaluation is scheduled.
- `apps/engines/src/selective-backfill-cli.ts`: offline, content-pinned fixture driver with an exclusive output-directory lock, atomic checkpoints and immutable response artifacts, candidate-code pinning, and a bounded progress log/report. Only `--fixture` is supported; there is no live transport or paid CLI mode.
- `apps/engines/src/index.ts`: exports the runner API.
- `apps/engines/test/selective-backfill.test.ts`: 14 offline tests covering seven-day pilot bounds, 14+7 and optional 51-day metadata framing, full enumerated denominator, older creation, seven-day test follow-up, repeated timestamps, adaptive dense time/address/topic splits, missing ranges and state, weighted and monetary cap stops, response-before-checkpoint recovery, uncertain dispatch, source reorg, future availability, filter validation, authorization gating, and durable fixture-driver resume/ownership.

Source revision: `e56b495697b52c799cc7e4629d550cf8967e5d4b` (initial working tree clean). Candidate remains uncommitted. Runtime candidate SHA-256 from the existing pilot candidate-code hasher: `3af85ba77824a41d5b9726d3d2be5f5b59b95e368f315d67c00cc8770bf8987c`. Sorted relative-path/content SHA-256 over the four changed source/test files, with NUL separators: `0cca98f8ef271acde083cc5f6507ac78fb8e59d0321c7ad3ebfc4ff11f20498c`. This report is excluded from both hashes. Digest evidence: `/tmp/eko-048-candidate.sha256` and `/tmp/eko-048-source-test.sha256`.

Followed Guard 2.0 §8.3 and the supporting source/cost/availability rules in §§2.1, 7.2–7.3, 8.1–8.2; reused task-045 splitting, hashing and durable file primitives. Backend §4.3 provides the existing idempotent acquisition context. Where its broad genesis/full-block plan differs from Guard §8.3, this packet follows the selective Guard plan. No migrations, dependencies, lockfile changes, or changes to read-only specifications were needed; migration reservations 0164/0165 remain unused. No personal identifiers were copied into fixtures or new files.

## Acquisition and coverage boundaries

All actual live requests: **0 calls, 0 units, $0 paid acquisition cost**. Provider pricing, invoice cost, real source completeness, measured throughput and seven-day accuracy remain unverified. Fixture accounting uses explicit weights for header/log/boundary operations and supplied nano-USD arithmetic, including dense attempts; it is not measured provider billing. The driver reports fixture arithmetic separately from actual live request/cost fields and leaves invoice cost null. Fixed costs consume the same declared cap. The 250,000-unit maximum checkpoint is enforced before dispatch; cap exhaustion never promotes coverage or resets spend.

The seven-day first pilot bounds each selected creation-to-follow-up interval to seven calendar days. The cohort frame records `[D,D+14d)` launches, development `[D,D+7d)`, fitting `[D,D+4d)`, validation `[D+4d,D+7d)`, locked test `[D+7d,D+14d)`, and observations through the exclusive `D+21d` boundary. Primary purge duration is recorded as 3,900 seconds; seven-day outcomes remain sensitivity-only. Warm-up metadata records D−1 day funding and D−7 days selective recycling. Optional history metadata enumerates `[D−30d,D+21d)`, exactly 51 days for the cohort frame, without enabling a booster or asserting full operator-history outcomes. Enumeration retains every returned launch, including unselected tokens; missing ranges retain named gaps without narrowing the denominator.

Acquisition output consists of validated normalized event shards and boundary snapshots. It does not calculate prices, replay engines, qualify funding graphs, assign operator-held-out groups, purge calibration examples, label outcomes, or activate history/policy. Native funding and operator-history completeness remain false. Actual seven-day follow-up maturity and source coverage must be checked on a verified source; empty fixture results are synthetic observations only. Real provider adapters must supply verified complete range responses, map dense/missing responses explicitly, and meter every underlying call/retry with verified provider units. None is configured or certified by this packet.

## Reproduction, checkpoint and next action

Focused reproduction from the repository root:

```sh
pnpm --filter @eko/engines exec vitest run test/selective-backfill.test.ts
```

The integration test constructs neutral source fixtures, drives actual atomic JSON persistence and lock ownership in a task-specific temporary directory, resumes the same candidate, and removes that test directory afterwards. No acquisition process remains running and there is no persistent measured-source checkpoint. Its log is `/tmp/eko-048-focused.log`.

To exercise a separately prepared offline fixture:

```sh
pnpm --filter @eko/engines exec node --import tsx src/selective-backfill-cli.ts --fixture /tmp/eko-048-manifest.json /tmp/eko-048-fixture.json /tmp/eko-048-output > /tmp/eko-048-fixture-run.log 2>&1
```

Use `SelectiveBackfillManifestSchema` for the manifest and `BackfillFixtureSchema` for `{version:"selective-backfill-fixture-048.1",responses:{...}}`. Response keys are `backfillRequestKey(request)`; source revision and availability revision must equal `0x` plus `pilotHash(parsedFixture)`. Include all sparse boundary-search headers, selected parent states, and metadata/token/market log responses. Omitted fixture requests become explicit missing responses. Use neutral values only. Supply exact captured creation cursors and follow-up cutoffs; never estimate heights from a block rate. Freeze D, selection and source cut before inspecting labels.

Keep `manifest.json`, `checkpoint.json`, `report.json` and `artifacts/` together. The checkpoint stores owner, candidate/source hashes, per-request reservation/result hashes, weighted units/cost, elapsed time and sampled RSS. Logs emit `selective_backfill_checkpoint` summaries only. Resume with the same command/source/candidate/output. Exit 0 is complete acquisition; exit 2 is a named stop/gap; exit 1 is a failure. A missing/dense response is immutable for that source, so a repaired source needs a new manifest/output rather than quietly retrying old coverage.

Dense responses are cached before their deterministic children are scheduled. A response persisted before the cursor commit recovers without redispatch. A reservation with no persisted response stops as `request_outcome_unconfirmed`; reconcile that attempt with authoritative source/provider evidence before resuming. The runner never blindly duplicates an uncertain request. Source reorg stops as `source_reorg`; preserve the old artifacts and use a newly reviewed source revision/output for replacement evidence. It never edits old observations or reuses old checkpoints under a new source. A stale `runner.lock` requires inspection of the stopped process/checkpoint before the lead removes that task lock. Cap extension requires a separately reviewed resource plan carrying previous usage; automatic extension is absent.

Next action: lead reviews the uncommitted implementation and fixture evidence, supplies verified source/coverage and provider capability records, and obtains the owner's resource decision before any broader paid acquisition. This packet installs no subscription, background job or production adapter.

New `TODO(spec)`: Guard specifies acquisition behavior but not a local wire envelope; the closed `selective-backfill-048.1` envelope is the smallest fixture transport record, not a new shared API contract. Other calibration/grouping/outcome work belongs to its packets.

## Checks

| Exact command | Exit code | Evidence |
|---|---:|---|
| `pnpm --filter @eko/engines exec vitest run test/selective-backfill.test.ts` | 0 | 14 tests; `/tmp/eko-048-focused.log` |
| `pnpm typecheck` | 0 | Workspace checks; `/tmp/eko-048-typecheck.log` |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | All workspace suites, builds and role-image checks; `/tmp/eko-048-test.log` |
| `pnpm brand:check` | 0 | `/tmp/eko-048-brand.log` |
| `pnpm check:addresses` | 0 | `/tmp/eko-048-addresses.log` |
| `git diff --check` | 0 | No whitespace errors |

Initial focused implementation iterations exposed and fixed the checkpoint reason-code validator, fixture mutation after manifest hashing, response fork classification, and test callback typing. No existing tests were removed, skipped, weakened, or given larger timeouts.

The full gate ran 34 contract tests with its existing single fork-test skip, plus 2,720 TypeScript tests across the workspace. Engines passed all 302 tests, including this packet's 14. No failing-file rerun was necessary during the final full gate. Generated verification logs use neutral workspace/home placeholders.
