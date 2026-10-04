# Task 086 implementation report

Candidate: base `33e65459bce4dee430912eaf7657f5a31516b20e` plus the uncommitted task-086 files listed below. No commit was made. `docs/operations/backfill-gate/086-candidate-files.sha256` pins the actual implementation, tests, fixture and local-inventory script. The full gates ran against these unchanged runtime/test files. The fixture's candidate revision is its declared synthetic reference, not a committed or deployed task-086 revision.

## Changed files

- `apps/indexer/src/backfill-gate.ts`: bounded input contract, inclusive completed-range gaps by exact stream, calendar-boundary checks, leases/duplicates, canonical checkpoint consistency, Guard availability invalidations, integer minted/burned/held reconciliation and optional measured follower arithmetic. Missing acquisition and human review remain unresolved; live approval is always false.
- `apps/indexer/src/backfill-gate-snapshot.ts`: existing-database read-only repeatable-read exporter, row/statement limits, natural-key duplicate queries, per-holder reconciliation, same-head supply checks, source manifest hashes/invalidation counts and candle comparisons. No migrations or acquisition.
- `apps/indexer/src/backfill-gate-cli.ts`: bounded snapshot/import/verify CLI, exclusive evidence outputs and redacted failures. External 048/057 content is hashed without copying it into reports.
- `apps/indexer/test/backfill-gate.test.ts`, `apps/indexer/test/fixtures/backfill-gate/snapshot.json`: 12 focused tests, including PGlite exporter tests, neutral fixtures and exact large-integer arithmetic.
- `docs/operations/backfill-gate/README.md`: input semantics, reproduction, separately budget-approved lead commands and dependency handoff.
- `docs/operations/backfill-gate/086-fixture-evidence.json`: saved synthetic range/count/hash/checkpoint evidence, status unresolved, paid units/cost for this offline fixture run zero. Snapshot hash `0x57add4728e67f429018ef24513bb7ad79b0aca6558f29168755dca5cf08b31b2`.
- `docs/operations/backfill-gate/inventory-local-captures.py`, `086-local-capture-inventory.json`: bounded offline inventory of existing captures, file hashes, ranges, missing intervals, receipt/log counts and consistency diagnostics. Original acquisition cost is unknown; this local inventory spent zero paid units and zero dollars.
- `docs/operations/backfill-gate/086-candidate-files.sha256` and this report: candidate/check evidence.

No dependencies, lockfile, migrations, spec documents, Guard design, prototype, deployment configuration or parallel-packet implementation files changed. Migration reservations 0131/0012 were not needed. No personal identifiers were ported or added.

## Local evidence and status

The existing captures contain 45 unique selected blocks across two files: four blocks at 77,409,714–77,438,533 (67 receipt presentations, 348 log presentations), and 41 blocks at 77,844,756–77,844,946 (344 receipts, 1,497 logs). The first capture repeats 99 transaction/log keys across overlapping named views; this is raw fixture overlap, not evidence of persisted duplicate rows. Both files have zero removed logs and zero receipt/log versus block hash mismatches. Missing intervals are saved explicitly. Neither selected capture establishes leased-range, genesis, calendar-window, holder-baseline, archive or current-head completeness.

The synthetic snapshot verifies its declared arithmetic/ranges only. The 53-launch verified manifest is absent/unreproduced; named clone challenge evidence is absent; 50 independently reviewed deployer comparisons are absent. Guard 048/057 acquisition/review manifests and the live follower log were not supplied. PGlite tests use seeded data, not live chains or human judgments. No live database, paid job, port, deployment, publication, push or external message was used. Nothing is released or approved.

## Checks and exit codes

| Exact command | Exit | Result / log |
|---|---:|---|
| `pnpm --filter @eko/indexer test test/backfill-gate.test.ts` | 0 | 12 tests passed; `/tmp/eko-086-focused-final.log` |
| `pnpm typecheck` | 0 | All workspace typechecks passed; `/tmp/eko-086-typecheck.log` |
| `pnpm test` | 0 | Full root gate passed, including 119 indexer tests, web/server builds and role-image fixture checks; `/tmp/eko-086-test.log` |
| `pnpm brand:check` | 0 | 25 files checked; `/tmp/eko-086-brand.log` |
| `pnpm check:addresses` | 0 | 350 source files checked; `/tmp/eko-086-addresses.log` |
| `git diff --check` | 0 | No tracked whitespace errors |
| `python3 docs/operations/backfill-gate/inventory-local-captures.py` | 0 | Existing local capture inventory saved |
| From `apps/indexer`: `node --import tsx src/backfill-gate-cli.ts verify --snapshot test/fixtures/backfill-gate/snapshot.json --out ../../docs/operations/backfill-gate/086-fixture-evidence.json` | 2 | Report saved; expected unresolved acceptance evidence |

The same fixture command through `pnpm exec` produced wrapper exit 1 for child exit 2. An attempted overwrite was rejected by exclusive output creation; the task-owned generated report was then regenerated at its intended path. No failed application checks were hidden or assertions weakened.

No long-running job remains. The root-gate process completed with exit 0; its log is above. No live catch-up/head-lag measurements or acquisition cost estimates are claimed. The source/checkpoint artifacts remain local for the lead to commit.

## Spec followed, TODO and next actions

BACKEND §4.3: distinguish genesis Pons/registry, 30-day recent content and declared full/fallback Phase C; retain stream/filter scopes and incomplete leases. BACKEND §7.5 and GO PLAN §7: preserve point-in-time history, clone/incident/history acceptance dependencies. Guard §8.3: pilot versus calendar coverage, manifest availability and checkpoint/cost honesty. Guard §9.3: verified incident addresses and independent human review; allegations and selected fixtures cannot become population truth.

One new `TODO(spec)` in `apps/indexer/src/backfill-gate.ts`: 048/057 have no merged acquisition/challenge/review interchange schema. Their owning packets must provide a reviewed adapter before manifest contents can certify incident/clone/candidate-denominator/human-history checks. Existing shared Guard availability storage is consumed as-is. No spec conflict was substituted with fabricated data.

Remaining dependencies: registry and missing recent-content acquisition, accepted Phase C coverage/candidate denominator, token creation history/archive baselines and same-head supply samples, 048/057 verified manifests, both named clone challenges and 50 human history comparisons, and task-066 metered live catch-up/steady-head evidence. Reproduction and prepared commands are in `docs/operations/backfill-gate/README.md`. The lead must record separate budget approval before live commands, run the owning acquisition workers, export the pinned existing database, attach their manifests and measured follower summary, then rerun the verifier to inspect unresolved findings. A 200k replay is neither genesis nor a complete 30-day backfill. Do not deploy or enable unaccepted checks.
