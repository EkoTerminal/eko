# Task 062 · Frozen live shadow runner and report

**Disabled: no accepted frozen candidate exists.** Guard 061 is not accepted. The seven-day/5,000-launch live shadow has not started. Guard V2 remains shadow/inactive and unreleased; Lower, history and buckets remain disabled. This work implements offline fixture machinery only. No live RPC, paid acquisition, ports, deployment, activation or commit occurred. No worker or recurring continuation mechanism is running.

## Changes and specification

| File | Change |
| --- | --- |
| `apps/engines/src/live-shadow.ts` | Strict fixture-only frozen definition and captured ticks; isolated Guard/API preview, buyer-level policy proxies and Signal diagnostics; duration/count/follow-up state; source, latency, service/bot, budget and gate reports. |
| `apps/engines/src/live-shadow-cli.ts` | Offline driver with exclusive output lock, content-addressed input/report/checkpoint generations, implementation/dependency pins, append-only progress and identical-resume verification without reevaluation. |
| `apps/engines/src/index.ts` | Exports the pure report/schema helpers; starts no job. |
| `apps/engines/test/live-shadow-fixtures.ts`, `live-shadow.test.ts` | Neutral synthetic fixtures and 11 tests for isolation, minimums, late follow-up, outages, unknown outcomes, unsupported Signal parameters, frozen pins, regressions and immutable resume. |
| `docs/tasks/062-live-shadow-report.md` | This handoff. |

Followed packet 062 and Guard 2.0 §§7.2–7.3, 8.4, 9.1 and 9.4. Read AGENTS.md including rule 9, packet 061 and its report, the Guard specification and cited existing scoring/shadow/Signal implementations, FACTS §§6–7, backend §§3.1–3.2, 9.6, 12.2, 13 and 21.4, and marketing §04. No spec file, active consumer/order path, fee/custody path, dependency or lockfile changed. No database migration is needed; reserved 0185 is unused. No personal identifiers were added or copied. No tests, assertions or timeouts were weakened, skipped or deleted.

`TODO(spec)` in `live-shadow.ts`: §9.4 does not prescribe an offline runner/checkpoint envelope. The smallest implementation is engines-local and fixture-only, with no acceptance/activation capability. Full preflight is not simulated: comparisons explicitly identify buyer-level proxies; actual-size quotes, kill/access/exposure checks and false-refusal truth remain separate. API preview objects are local diagnostics, never published badges. Captured Signal uses the existing adapter with absent powers/LP left unknown; it does not invent those measurements.

Existing shared assessment contracts enforce the starting 30/60 bands and original factor arithmetic, whereas 060 permits other frozen bands/weights. The runner uses 060's frozen projection for candidate diagnostics and leaves Signal unavailable when that projection cannot use the existing assessment output unchanged. It names `frozen_parameters_not_supported_by_shared_signal_contract` and blocks readiness instead of forging a receipt or changing shared contracts outside this packet. Resolving that contract gap for an accepted nonstarting candidate is deferred. No spec threshold was retuned.

## Workload, maturity, telemetry and gates

Covered duration is the union of successful half-open enumeration intervals, capped at the recorded enrollment end. Overlapping intervals do not double-count; uncovered wall time earns no duration. Launches are unique chain/token addresses and must be inside their recorded covered acquisition interval. Both 604,800 covered seconds and 5,000 launches are required. Enrollment closes at the first captured tick satisfying both; later ticks only follow admitted entrants.

Each entrant must reach every frozen required horizon after the primary 60-second entry delay, plus explicit confirmation delay. This fixture uses 300/3,600/86,400-second horizons and 10-second confirmation. Timer-only ticks can advance follow-up without trades. Covered/confirmed clocks and outcome evidence are separate; absent follow-up remains pending and provider-censored/missing outcomes never become known. Self-supplied fixture confirmation evidence is not a canonical chain recheck or independently verified outcome.

Reports retain every admitted entrant and every captured comparison, unassessed launches, tier gaps, missing source coverage, per-venue/age queue/completion latency and service/bot errors. Missing completions are counted separately from p95 over completed observations. Buyer-level disagreements are per Safe/Balanced/Degen; Guard levels and Signal risk disagreements are separate. Failed captured gate checks are latched across later passes. Diagnostics expose duration, launch count, maturity, outcome coverage, snapshot/source coverage, Signal compatibility, preflight p95 <150 ms, errors and regressions. Inherited 061 gate outputs remain unaccepted. Fixture arithmetic never confers acceptance.

The saved disabled preparation has **0 measured seconds, 0 measured launches, 0 mature measured entrants** and null candidate/freeze/parameters hashes. The separate workload fixture simulates 604,800 covered seconds, 5,000 launches and 5,000 entrants followed through all horizons/confirmation. It supplies no assessment snapshots, so coverage, Signal, latency and service/bot diagnostic gates fail. Its `fixture_complete` state means simulated follow-up completed, not validation accepted. Both reports have `enabled=false`, `acceptedCandidate=null`, every `acceptancePass=false`, and `releaseManifest=null`. No complete release manifest is prepared while applicable gates fail.

Actual acquisition/run cost: **0 requests, 0 request units, 0 evaluator RPC calls, $0 paid cost**. Pricing evidence is null; fixture budget cap is zero and is not an approved paid operational budget. Actual source coverage, measured latency, reviewed service/bot error rates and measured gate regressions remain unavailable. An empty error list in the disabled preparation is not measured operational success.

## Revision, artifacts and checkpoint

Starting source commit: `c554e0e1e946656ba625ce34b23f05330b288f44`; initial working tree clean. Finished work is uncommitted for the lead. Accepted frozen candidate revision: **null**. The workload's candidate revision is an explicitly synthetic fixture identifier, not an accepted source candidate.

Final implementation/dependency digest: `0x37ff964ff4e02745475696d8de6b89e764e07facc3e1af966ae9c07596d47173`. The driver hashes its sources, Guard/Signal code inventories, policy gate, locked-evaluation/development dependencies and lockfile. Each report stores source/dataset/label/config/freeze/parameter/locked-report pins. Fixture content hashes establish reproducibility, not measured provenance or independent acceptance.

| Saved disabled artifact | Digest |
| --- | --- |
| inputHash | `0xb622920300bac525a0a6d6651eb17ee1a18c74ce6a017796f0d99962b852c79d` |
| definitionHash | `0x28fc26236988be92dd6c08e217a51a4756ef47824e0b799842dae4528151df12` |
| reportHash, body excluding reportHash | `0xb08dfd51e0061acec1bcc638d0cdbba945769c4e8c3191b4e9045c780a0ff732` |

Inputs: `/tmp/eko-062-fixture/disabled.json`, `/tmp/eko-062-fixture/workload.json`. Outputs: `/tmp/eko-062-fixture/disabled-output`, `/tmp/eko-062-fixture/workload-output`. In each output, `checkpoint.json` points to a digest-named immutable checkpoint. That checkpoint names the input hash, whose files are `<inputHash>.input.json` and `<inputHash>.report.json`; it records the full report artifact hash separately from the report body's hash. Logs: `/tmp/eko-062-prepare.log`, `/tmp/eko-062-disabled-run.log`, `/tmp/eko-062-disabled-resume.log`, `/tmp/eko-062-workload-run.log`. Both fixture invocations and the identical disabled resume exited 0.

Append progress only by preserving the exact frozen definition and all prior ticks, then adding strictly advancing ticks. The driver saves one new checkpoint per progressing invocation, retains previous generations and verifies identical resume without reevaluation. Changed source/config/prior ticks/artifacts refuse resume. An interrupted generation or retained lock requires process/artifact inspection; do not delete evidence to retry. The driver is a bounded fixture invocation, not an installed live daemon. Next action: obtain an accepted frozen candidate and independently verified measured runner/source workflow before starting live shadow; then acquire real elapsed workload and required canonical follow-up under an approved resource budget.

## Reproduction and remaining work

Generate new synthetic inputs from repository root (ephemeral public reviewer fixtures may produce different label digests):

```sh
pnpm --filter @eko/engines exec node --import tsx --input-type=module -e 'import {mkdir,writeFile} from "node:fs/promises"; import {liveShadowFixture,workloadFixture,followupTick} from "./test/live-shadow-fixtures.ts"; await mkdir("/tmp/eko-062-reproduction",{recursive:true}); await writeFile("/tmp/eko-062-reproduction/disabled.json",JSON.stringify(liveShadowFixture())); const f=workloadFixture(); f.ticks.push(followupTick(f)); await writeFile("/tmp/eko-062-reproduction/workload.json",JSON.stringify(f));'
pnpm --filter @eko/engines exec node --import tsx src/live-shadow-cli.ts --fixture /tmp/eko-062-reproduction/disabled.json /tmp/eko-062-reproduction/disabled-output
pnpm --filter @eko/engines exec node --import tsx src/live-shadow-cli.ts --fixture /tmp/eko-062-reproduction/workload.json /tmp/eko-062-reproduction/workload-output
```

Repeat either driver command for identical artifact verification. The actual saved disabled verification command is:

```sh
pnpm --filter @eko/engines exec node --import tsx src/live-shadow-cli.ts --fixture /tmp/eko-062-fixture/disabled.json /tmp/eko-062-fixture/disabled-output
```

Remaining measured work: resolve 058–061 acquisition, independent labels, development freeze and untouched-test acceptance; verify candidate and source provenance externally; connect an approved measured source/confirmation workflow and persisted scheduler; gather seven actual days and 5,000 actual launches plus final entrant follow-up; supply real snapshots, complete controls/LP inputs, full policy false-refusal evidence, operational pilot targets, budget/pricing and complete gate evidence. The CLI intentionally rejects measured/paid input; relabeling fixture JSON is not a measured workflow. Cutover/rollback preparation belongs to 063. No release or continuing live job is implied.

## Checks

| Exact command | Exit code / evidence |
| --- | --- |
| `pnpm --filter @eko/engines exec vitest run test/live-shadow.test.ts test/locked-test.test.ts` | 0; 26/26 tests, including 11 packet 062 tests and 15 Guard 061 regressions; `/tmp/eko-062-focused-final.log`. |
| `pnpm typecheck` | 0; `/tmp/eko-062-typecheck.log`. |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0; all workspace suites, builds and role-image checks; engines 494/494, server 456/456; `/tmp/eko-062-test.log`. |
| `pnpm brand:check` | 0; `/tmp/eko-062-brand.log`. |
| `pnpm check:addresses` | 0; `/tmp/eko-062-addresses.log`. |
| `git diff --check` | 0 on final worktree; new-file whitespace checks also produced no diagnostics. |

Logs are sanitized to neutral workspace/home placeholders. Initial focused checks caught an invalid legacy receipt fixture and an unavailable finite-grid test selection; corrected fixtures then passed the failing file alone (11/11). No timeout or assertion was relaxed. The final full gate had no failures requiring a failing-file rerun. Final checks are tied to the final source; only this report's check results were updated afterward. No check, fixture preparation, acquisition or evaluation process remains running.
