# Audit fix 01: make the replay CLI shutdown test deterministic

Source: audit-grade v2 run on 2026-10-02 (report: <audit-root>/audit-grade-2026-10-02/REPORT.md, Path to 9 item 1). The suite's only failure caps the
repo's grade at 6.0.

## Problem

`apps/engines/test/cli.test.ts` ("drains the current evaluation on SIGINT/SIGTERM, prints the summary and closes
PGlite") failed in both full-suite runs and in 1 of 3 isolated reruns while the machine was loaded (20 s vitest timeout;
evidence: <audit-root>/audit-grade-2026-10-02/runs/20261002-154053/pnpm-test-all.txt and engines-isolated.txt). The first full run also timed out once in
`apps/engines/test/market.test.ts` (44.7 s).

Likely cause, to confirm with timings: one 15 s SIGKILL watchdog and one 20 s test timeout cover everything: seeding the
fixture, a cold `tsx` compile of `src/cli.ts`, PGlite (WASM Postgres) boot, reaching the first `engine_progress` line,
and only then the shutdown being tested. Under load, startup alone can exhaust the budget, so the test measures machine
speed rather than shutdown behaviour.

## Do

1. Measure first: instrument a local run (not committed) to time seed → spawn → first `engine_progress` → signal → exit,
   idle and under load (e.g. run 4 copies in parallel). Report the numbers.
2. Fix the timing model without weakening what is tested:
   - separate a generous **startup budget** (until the first `engine_progress`) from a strict **shutdown budget** that
     starts when the signal is sent (the watchdog must measure drain + summary + PGlite close, not startup);
   - set the vitest timeout to cover startup budget + shutdown budget with headroom;
   - if startup itself is needlessly slow or racy (e.g. a signal could arrive before handlers are installed, or the
     child could finish all work before the signal lands), fix the root cause in `apps/engines/src/cli.ts` or the test
     and explain it.
3. Keep **every existing assertion** (exit code 0 with no signal, `replay_interrupted` summary fields, planned 600
   tasks, 100 ≤ evaluations < 600, verdict counts, engine_runs row count equal to evaluations after reopen). No
   `retry`, no `.skip`, no loosened ranges.
4. Apply the same diagnosis to `apps/engines/test/market.test.ts`; fix it the same way if it has the same shape.

## Proof (the rescore checks this)

- `pnpm --filter @eko/engines exec vitest run test/cli.test.ts test/market.test.ts` passes **10 times in a row**, and
  also passes 5 times while 3 other copies of the full engines suite run in parallel. Include the loop output.
- `pnpm typecheck` and `pnpm test` pass (AGENTS.md hard rule 1).

Follow AGENTS.md. Do only this task. End with the report AGENTS.md asks for, including the timing table.
