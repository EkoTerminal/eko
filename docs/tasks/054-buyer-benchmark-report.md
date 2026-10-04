# Task 054 · Buyer benchmark report

Implemented locally and left uncommitted. Guard V2 remains shadow/inactive. No paid acquisition, network transport, live run, commit, push or release occurred.

## Revision and changed files

- Starting source revision: `06d3d1d971b9c442c24b54d3d732253facbc46cd`.
- Candidate revision: `0x3728a698214913f71a805916bfba258faa0b33ea49b0d1be5a58c918dfa3b723`. This is the CLI's content digest of benchmark source, its listed local dependencies and lockfile, including uncommitted changes; it is not a commit.
- Fixture tape revision: `0xf0f890bdc47e15b4cbb46a3fce91a754a52650910285afb4f943e6dad1bd58f8`; manifest digest: `0x330a9ff70d8e1384ace614c7d6d908e32ea06e3cdac752ae6b2379209117de37`.

| File | Change |
| --- | --- |
| `apps/engines/src/buyer-benchmark-input.ts` | Closed, versioned manifest, entry/exit/gas contracts; complete completed-block clock, source digest, entry predictor cursor/class/size and evidence-cut validation. |
| `apps/engines/src/buyer-benchmark.ts` | Deterministic local runner, content-hashed resumable checkpoint/artifact store interface, exact rational accounting, fidelity gate. |
| `apps/engines/src/buyer-benchmark-pons.ts` | Explicit fixture-only Pons adapter using existing buy/sell math and campaign transaction executor; observed-state verification and persistent original-transaction constraint checks. |
| `apps/engines/src/buyer-benchmark-cli.ts` | Opt-in offline fixture CLI, exclusive output-directory lock, atomic durable checkpoint/artifact/report writes and candidate digest. |
| `apps/engines/src/index.ts` | Exports the engine benchmark contracts and runner; no worker auto-start. |
| `apps/engines/test/buyer-benchmark-fixtures.ts` | Neutral synthetic clock, states, accounts and entry predictors. |
| `apps/engines/test/buyer-benchmark.test.ts` | 14 tests covering scheduling, sizes/classes, methods, failure/recovery, cap, delayed wallet state, gaps, signed gas/USD accounting, original transaction invalidity, stop/target, source cuts, resume, CLI and fidelity gates. |

No dependencies or migrations added; reserved migration 0174 is unused. No existing tests were removed, skipped, weakened or given larger timeouts. No personal identifiers were introduced or ported.

## Behavior and specification

Follows Guard 2.0 §§2.1, 3.1, 3.4 and 9.1–9.2, with the reference sizes/accounting context in backend §6.2 and the shared cursor/rational contracts. Claim rules in FACTS §6 and marketing §04 were read; no marketing surface changed. Guard 2.0's independent delayed entry/exit method takes precedence over the legacy same-block round-trip shortcut for this benchmark.

- Entries at 5/30/60/300 seconds use the earliest completed block at/after their delay. $100/$1k and account classes execute independently. The report pins account, route, configuration, cursor, actual delay, purchase state and matching entry predictor/source cut. A missing predictor stays null.
- The primary paired unit remains `(token,60,size,class)`. Paper/persistent trajectories are separate methods. No token aggregation or half-agents truth is produced.
- Fixed holds are 300/3600/86400 seconds after the actual entry. Stop −30%/target +50% checks run every 60 seconds and at relevant sell/control/graduation boundaries, with a mandatory 3600-second exit. Sensitivities cannot overwrite the fixed primary result.
- The first scheduled failed exit remains. Optional 60-second retries through +300 seconds retain all attempts. Provider/archive gaps are censored; entry caps are `entry_unavailable`, without an invented invested loss. Unsupported classes/routes remain explicit. Proved no-exit proceeds alone become zero; net cash after execution and L1 gas remains signed.
- Quote-unit and event-time USD returns are separate, with missing USD explicit. These results never enter operator history.
- Paper buys include impact in quantity, then discard synthetic reserve changes while retaining purchase-dependent cooldown state. Persistent replay retains the synthetic entry and every original transaction's input, limit, deadline, funding, fees and transfers. A later invalid transaction is recorded with its ID as indeterminate and is never skipped. Existing campaign replay/interventions remain independent; standard probes do not replace real buyer FIFO cohorts.
- Fidelity is evaluated separately per venue/size/class: at least 30 distinct reviewed real supported cases, positive-net-proceeds relative error ≤1%, zero hurt reversals and exact accounting. Fixtures do not fill this denominator. Invalid persistent replay with no matched real FIFO fallback has no release truth. All runner results remain unreleased and paper band/history eligibility remains false.

## Checks

| Exact command | Exit code / result |
| --- | --- |
| `pnpm --filter @eko/engines exec vitest run test/buyer-benchmark.test.ts` | 0; final 14/14 tests passed. |
| `pnpm --filter @eko/engines typecheck` | 0 during implementation; final workspace check below covers the completed candidate. |
| `git diff --check` | 0. |
| `pnpm typecheck` | 0. |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0; all workspace test packages, web/server builds and role-image fixture checks passed. |
| `pnpm brand:check` | 0; 38 files checked. |
| `pnpm check:addresses` | 0; 452 source files checked. |

The engines portion of the workspace gate completed before the final stop/target status correction. The affected benchmark file was rerun on the final source (14/14 passed); unaffected completed workspace results were reused. Workspace typecheck, brand and address checks were repeated after that correction.

An initial focused assertion failed because integer rounding made the $100 paper/persistent proceeds equal in the deep fixture. The assertion now checks the $1k path, where reserve-impact differences are observable; subsequent focused runs passed. This was a fixture assertion issue, not a removed check.

## Fixture run and reproduction

Default fixture run: complete, 16 trajectories for one synthetic token, 2 primary EOA size units represented by 4 method trajectories, and 992 completed local entry/exit evaluations. Covered real matched cases: **0**. Additional class, thin-state, restriction and failure cases are synthetic unit checks, not measured validation. No real venue/size/class fidelity gate has passed.

Actual live requests: 0; request units: 0; pricing: local fixture computation, no provider price assumed; paid cost: $0. No invoice, acquired real coverage or paid process exists.

Reproduce from the worktree root without opening an IPC listener:

```sh
pnpm --filter @eko/engines exec node --import tsx --input-type=module -e 'import { mkdir, writeFile } from "node:fs/promises"; import { buyerFixture } from "./test/buyer-benchmark-fixtures.ts"; await mkdir("/tmp/054-buyer-benchmark", { recursive: true }); await writeFile("/tmp/054-buyer-benchmark/manifest.json", JSON.stringify(buyerFixture()));'
pnpm --filter @eko/engines exec node --import tsx src/buyer-benchmark-cli.ts --fixture /tmp/054-buyer-benchmark/manifest.json /tmp/054-buyer-benchmark/output-final
```

Both commands exited 0. Repeating the second command resumes the same source/candidate without adding evaluations. Process completed; checkpoint: `/tmp/054-buyer-benchmark/output-final/checkpoint.json`; artifacts: `/tmp/054-buyer-benchmark/output-final/artifacts`; report: `/tmp/054-buyer-benchmark/output-final/report.json`; run log: `/tmp/054-buyer-benchmark-run-final.log`; resume log: `/tmp/054-buyer-benchmark-resume-final.log`. Check logs: `/tmp/054-focused.log`, `/tmp/054-typecheck.log`, `/tmp/054-test.log`, `/tmp/054-brand.log`, `/tmp/054-addresses.log`.

The initial fixture preparation using the `tsx` CLI exited 1 because its IPC listener is prohibited in this sandbox. Switching to `node --import tsx` completed successfully without changing application behavior.

## Remaining gaps and next action

`TODO(spec)` in `buyer-benchmark-input.ts`: §9.1 specifies behavior but no benchmark wire/storage contract. The smallest implementation is an engines-only versioned envelope and local durable artifact store; no public API, shared outcome-label migration or background job was added.

The supplied Pons adapter is synthetic only. Deployed purchase-dependent wallet storage, token enforcement, successor-route reconstruction, independent fork/provider reproduction, observed USD/gas pricing, real FIFO matching and ≥30 diverse measured matches per venue/size/class remain unmeasured. v3/v4/hook and unsupported contract paths require verified adapters before real evaluation. The runner's adapter interface prepares that work; it does not certify those paths or fill campaign/outcome evidence. No calibration, exit-strategy fitting or rollout was performed.

Next action: review these uncommitted changes, then prepare independently verified source tapes/adapters and real matched fidelity evidence before calibration or any separately authorized resource run. For interruption, inspect the named stop reason/checkpoint and resume only the identical source/candidate; source reorg or candidate changes require a separate output directory.
