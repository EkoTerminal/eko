# Task 064 · Calendar-month evaluation report

Prepared, disabled, unreleased; work remains uncommitted for the lead. No accepted
release exists. The checked-in job has a null manifest and empty trusted
inventory, no population or labels, and no activation or continuing scheduler.
No RPC, acquisition, paid run, migration, commit, push or deployment occurred.

Source revision: `497b56c99ae95126870420ed469a1bd790b45349` (Guard 063 baseline).
Candidate revision: **null**, no accepted measured candidate. Implementation
content revision from the disabled CLI checkpoint:
`0xf25df9fe6ca588b50a543a4dde4ec2e57fcf1de4a885e09f36ee781df5593991`.
Synthetic candidate/release inventories in tests are explicit doubles and are not
acceptance evidence.

## Changed files and spec

- `apps/engines/src/monthly-evaluation.ts`: strict fixture job admission, exact
  half-open calendar UTC boundaries, required follow-up, new 200-coin starting
  stratified draw, separate challenges/meta cases, pending labels, sources/change
  inventory, frozen later-data gates, precision/coverage/drift diagnostics, and
  receipt/artifact-backed suspension proposals without active writes or promotion.
- `apps/engines/src/monthly-evaluation-cli.ts`: bounded application invocation,
  pinned implementation/input/definition hashes, exclusive task lock, atomic head,
  retained immutable generations, identical resume without replay, append-only
  progress and recovery of identical partial publication. Refuses changed source,
  config, code, artifacts, ticks or repeated gate inspection.
- `apps/engines/src/probability-sample.ts`: reuse the existing unbiased draw with
  frozen caller quotas; original 600-coin default and outputs remain unchanged.
  Inclusion weighting verifies the exact stored draw, with challenges excluded.
- `apps/engines/src/index.ts`: export monthly application helpers.
- `apps/engines/test/monthly-evaluation-fixtures.ts` and
  `apps/engines/test/monthly-evaluation.test.ts`: neutral synthetic fixtures and
  calendar/admission/sampling/follow-up/failure/no-promotion/resume/retention tests.
- `docs/operations/guard-monthly/064-prepared.json` and `README.md`: inactive
  example and application-job runbook, follow-up due times, pending evidence,
  version/suspension workflow and interruption recovery.
- This report.

Followed Guard 2.0 §9.5, reusing §§9.3–9.4 sampling/frozen gates and §§7.2–7.3
version/receipt retention and release discipline; backend §§1.2/3.2/20 application
process, ownership and eval conventions. Read the packet, worktree rules including
rule 9, 063 preparation/runbook, and relevant source/fixture contracts. No spec
file was edited and no personal identifiers were ported or added.

`TODO(spec)` in the monthly module: §9.5 specifies neither a maintenance wire
contract nor stratum allocation. The local starting CALIBRATE design freezes
35/25/25/35/80 across existing priority strata; insufficient/regime-changing data
requires a new reviewed expanded design. No automatic expansion is installed.

## Verification

| Command | Exit/result |
|---|---|
| `pnpm --filter @eko/engines exec vitest run test/monthly-evaluation.test.ts` | 0; 7/7 final focused monthly tests. |
| `pnpm --filter @eko/engines exec vitest run test/monthly-evaluation.test.ts test/sampling-and-incidents.test.ts test/locked-test.test.ts test/guard-cutover.test.ts` | 0; 4 files, 48/48 tests; `/tmp/eko-064-focused.log`. |
| `pnpm typecheck` | 0; `/tmp/eko-064-typecheck.log`. |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0; full workspace suites, web/server builds and role-image checks; engines 512/512, server 456/456; `/tmp/eko-064-test.log`. |
| `pnpm brand:check` | 0; `/tmp/eko-064-brand-final.log` (also passed before report creation). |
| `pnpm check:addresses` | 0; `/tmp/eko-064-addresses-final.log` (also passed before report creation). |
| `pnpm --filter @eko/engines exec node --import tsx src/monthly-evaluation-cli.ts --fixture ../../docs/operations/guard-monthly/064-prepared.json /tmp/eko-064-prepared` | 0; disabled job checkpoint only. |
| `git diff --check` | 0. |

During implementation, a stronger semantic pin check initially read versions
from score input, where the existing contract instead supplies them through the
scoring registry. Focused tests exited 1 and engines typecheck exited 2. Corrected
the mapping to the existing registry and reran the failing monthly file alone
(exit 0, 7/7), then the focused four-file gate and workspace typecheck passed.
No tests/assertions/skips/timeouts were weakened or removed. The full gate passed
without any failing-file rerun. The pre-existing contract fork test remains
skipped when its RPC input is unset; this packet added no skip. Expected startup
refusal role fixtures exit 1 inside the passing role-image matrix.

## Remaining gaps and reproduction

The 061 evaluator's existing acquisition contract covers 14 days with development,
validation and untouched-test splits. This packet reuses its frozen later-data
subset inside the calendar-month draw; the rest remains pending, with exact
coverage reported. It does not represent a 12-coin fixture census, a subset, or
fixture judgments as completed 200-coin measured maintenance. Full-month measured
execution needs a separately reviewed evidence adapter after release acceptance;
this packet does not widen 061 acceptance semantics. The original manifest only
stores accepted gate hashes, so numeric baseline drift deltas require the retained
original reports; those values are not invented.

Monthly scheduling and active suspension publication remain uninstalled. The
063 durable release publisher is itself prepared; the runbook sends suspension
proposals through its separately authorized workflow. Missing coverage prepares
named gap actions; gate failures conservatively propose returning released
heuristics to shadow and disabling Lower pending review. Proposal hashes are
content-addressed unanchored artifacts, not manufactured on-chain proofs. All
active writes and automatic promotion remain absent. Semantic changes retain
before/after hashes, reasons, receipts and pending development/validation/new
held-out references; they cannot resume old candidate gate inspection.

Next configured example due time: October review after follow-up on
**2026-11-08 00:01:30 UTC**; following November job on
**2026-12-08 00:01:30 UTC**. The 30-second confirmation setting is synthetic.
No invocation is installed; the first measured month must follow actual accepted
release and pinned operating/follow-up requirements.

Reproduce with the focused test command above and the disabled CLI command. An
identical CLI invocation verifies the saved artifacts without replay. The fixture
tests exercise a partial write, monotone follow-up progress, immutable earlier
versions, completed gate inspection, attempted retuning and changed-artifact
refusal. Separate output directories are required for new definitions/versions.
See the runbook for stale lock and interrupted generation inspection.

Acquisition/run accounting: **0 actual requests, 0 request units, $0 paid cost**.
Pricing/subscription evidence is not applicable. Measured chain/provider coverage,
live duration and launches are zero/unavailable; test inventories are synthetic.

Disabled example checkpoint: `/tmp/eko-064-prepared/checkpoint.json`, pointing to
`0x1e2ba4eeb4971c3a4abbfd65ea590a10c308555c729015fccfd38aa6cfcc78f2`.
Task verification checkpoint: `/tmp/eko-064-checkpoint.json`. Full-gate session
`44869` completed with exit 0 and log `/tmp/eko-064-test.log`. No task process
remains running. All four required final checks exited 0. Logs use neutral
workspace/home placeholders. Lead review/integration of the uncommitted work is
next after checks; measured release/evidence integration and actual scheduling
remain separate completion signals.
