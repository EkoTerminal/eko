# Audit 01 implementation report

Implemented `docs/tasks/audit-01-shutdown-test.md` on the current `audit-01-shutdown-test` branch. Base revision: `2997466a96d4a62ffd5ac6b9e93f8f8ce343e1ed`. Node v26.0.0, pnpm 11.5.1, Vitest 5.0.2; timing and focused proof runs used local PGlite fixtures without RPC.

## Changes and diagnosis

- `apps/engines/test/cli.test.ts`: a 90,000 ms startup allowance starts before fixture seeding and extends to the first complete progress record with at least 100 evaluations. After seeding, the child's startup watchdog receives only the remaining allowance. Sending SIGINT/SIGTERM replaces that watchdog with the original strict 15,000 ms shutdown allowance. Vitest gets 135,000 ms total, including 30,000 ms headroom for reopen, assertions and cleanup. A wall-time assertion from signal dispatch through child `close` prevents delayed parent timers from concealing a slow exit; child `close` includes process exit and closed stdout/stderr.
- Complete JSON lines, rather than a substring of a potentially partial pipe chunk, identify progress. The CLI can also emit progress because 30 seconds elapsed, before 100 evaluations; the test now waits for the existing required milestone in that case. Signal delivery is explicitly asserted.
- Every original assertion remains: signal sent; exit `{code:0,signal:null}`; `replay_interrupted`; planned 600 tasks/60 coins/blocks 1–10; positive throughput/RSS/source-loading/write-transaction timings; empty RPC/playbook counts; 100 ≤ evaluations < 600; 60 evaluated coins and exact pending verdict counts; reopened `engine_runs` count equal to evaluations.
- `apps/engines/test/market.test.ts`: the two dense database correctness tests get 120,000 ms total (90 seconds for fixture construction plus 30 for comparisons/close). They have no child, signal, or shutdown watchdog, so there is no shutdown phase to split. All fixtures, randomized checkpoints, SQL/live oracle comparisons, exact fractional/address-tie checks, non-finite exclusions, historical reads and no-query assertions are unchanged. The small three-coin test retains its 20,000 ms limit. These are correctness checks, not performance benchmarks.
- The supplied task packet is included. Its two absolute personal machine paths were replaced with neutral `<audit-root>` references. No personal identifiers were added or ported.

The reported original timeout was not reproduced in this local measurement. The original CLI watchdog nevertheless mixed boot/evaluation with shutdown, while Vitest also counted fixture creation and reopen. Measurements show why those phases deserve separate accounting, but do not establish machine slowness as the sole cause of the earlier failure. CLI signal handlers already precede `worker.replay`; the worker already yields between evaluations. Neither source needs a change, and measured children did not finish their planned work before the signal arrived.

Followed the audit task's Do §§1–4 and Proof, AGENTS.md hard rule 1, and backend §4.3 (replay/idempotence). No API contract, runtime behavior, spec, dependencies, lockfile, migrations or unrelated files changed. No deferred work or new `TODO(spec)` ambiguity.

## Measurements before the fix

Temporary, uncommitted instrumentation used `performance.now()` at seed start, spawn, first `engine_progress`, signal dispatch and child `close`. Diagnostic watchdog/test limits were enlarged to 90/120 seconds to permit observation; assertions and fixtures were retained. Instrumentation was removed before every final proof run. One focused command ran idle; four identical focused commands then ran concurrently (each command includes CLI and market files with default file parallelism). Both signals passed in every measured copy with code 0 and no exit signal. “Seed” includes fixture creation and seed database close; “spawn → progress” includes tsx startup, PGlite boot and the first 100 evaluations. All values below are milliseconds.

| Run | Signal | Seed → spawn | Spawn → progress | Progress → signal | Signal → exit/stdio close |
|---|---|---:|---:|---:|---:|
| idle | SIGINT | 1009.17 | 1814.15 | 0.0006 | 23.53 |
| idle | SIGTERM | 700.95 | 1883.62 | 0.0006 | 22.87 |
| load-1 | SIGINT | 1829.69 | 2891.98 | 0.0005 | 43.22 |
| load-1 | SIGTERM | 1173.34 | 3013.89 | 0.0023 | 45.50 |
| load-2 | SIGINT | 1821.57 | 2899.83 | 0.0004 | 41.72 |
| load-2 | SIGTERM | 1181.35 | 3024.57 | 0.0058 | 55.18 |
| load-3 | SIGINT | 1786.07 | 2933.00 | 0.0004 | 41.02 |
| load-3 | SIGTERM | 1210.73 | 3003.94 | 0.0025 | 54.11 |
| load-4 | SIGINT | 1814.30 | 2901.12 | 0.0015 | 44.55 |
| load-4 | SIGTERM | 1184.54 | 3025.56 | 0.0034 | 49.67 |

Market timings in the same runs (fixture/open/migrations → ready; assertion body; database close):

| Test and condition | Fixture startup ms | Correctness body ms | Close ms |
|---|---:|---:|---:|
| Dense SQL ranks, idle | 1891.40 | 2014.92 | 21.66 |
| Dense SQL ranks, four copies (range) | 2733.40–2798.21 | 2654.74–2696.98 | 28.97–35.15 |
| Fractional/ties/non-finite, idle | 527.46 | 12.24 | 1.34 |
| Fractional/ties/non-finite, four copies (range) | 766.16–795.16 | 16.39–21.34 | 1.56–3.00 |
| Dense fractional ranks, idle | 1245.09 | 2251.45 | 9.41 |
| Dense fractional ranks, four copies (range) | 1868.80–1985.83 | 2810.88–2893.80 | 9.89–11.20 |

Local raw timing evidence: `/private/tmp/eko-audit-01/timings-idle.jsonl` and `timings-load-{1,2,3,4}.jsonl`. Preliminary runs used console logging, which the reporter suppressed; the table comes from the subsequent file-recorded runs, not those preliminary runs.

## Final-candidate proof

The final test source hashes (SHA-256) are:

- `apps/engines/test/cli.test.ts`: `d7fdabf5f8bdeff960d97fd476b6f5261ccf8a327353337e8fbeff7dba35f95b`.
- `apps/engines/test/market.test.ts`: `1191e83dfafdc9164fef332e6e9298dacf764d122744ff4d09804aa933b42119`.

Focused command, unchanged for all 15 proof invocations:

```sh
pnpm --filter @eko/engines exec vitest run test/cli.test.ts test/market.test.ts
```

The loaded proof runs three continuous full engines-suite loops concurrently, each using `pnpm --filter @eko/engines test --maxWorkers=1`. Worker count bounds per-suite resource use; no test files or assertions are excluded. Each loop restarts a successfully completed suite while the five focused commands run sequentially; no failing command is retried. Active process counts are checked before and after each focused command. After the focused proof, loops stop starting new suites and their current suites are allowed to finish.

Actual loop output (every focused invocation: 2 files / 5 tests passed, exit 0):

```text
idle 01/10: exit 0, elapsed 9.15s
idle 02/10: exit 0, elapsed 9.93s
idle 03/10: exit 0, elapsed 10.30s
idle 04/10: exit 0, elapsed 9.83s
idle 05/10: exit 0, elapsed 9.51s
idle 06/10: exit 0, elapsed 9.84s
idle 07/10: exit 0, elapsed 10.90s
idle 08/10: exit 0, elapsed 11.08s
idle 09/10: exit 0, elapsed 10.11s
idle 10/10: exit 0, elapsed 9.56s
```

```text
load suite 1.1: started
load suite 3.1: started
load suite 2.1: started
loaded 01/5: exit 0, elapsed 12.32s, load suites active before/after: 3/3
loaded 02/5: exit 0, elapsed 12.32s, load suites active before/after: 3/3
loaded 03/5: exit 0, elapsed 13.90s, load suites active before/after: 3/3
loaded 04/5: exit 0, elapsed 21.72s, load suites active before/after: 3/3
loaded 05/5: exit 0, elapsed 17.25s, load suites active before/after: 3/3
load suite 1.1: exit 0, elapsed 121.19s
load suite 3.1: exit 0, elapsed 121.31s
load suite 2.1: exit 0, elapsed 121.96s
```

Each background suite passed 21 files / 223 tests. Each first suite remained active throughout all five focused invocations, so no restarts were needed. All load processes finished normally; none were killed. Focused and background logs are `/private/tmp/eko-audit-01/proof-idle-{1..10}.log`, `proof-load-{1..5}.log` and `load-suite-{1,2,3}-1.log`; the local load harness is `proof-load.py` in the same directory. The loop output above is recorded evidence in this report; raw temporary logs are local evidence and contain runner workspace paths, so they are not copied into the repository.

## Workspace gates

| Command | Result | Local evidence |
|---|---|---|
| Focused command, ten consecutive idle invocations | Exit 0 each; 2 files / 5 tests each | `proof-idle-loop.log`, `proof-idle-{1..10}.log` |
| Focused command, five consecutive loaded invocations | Exit 0 each; 2 files / 5 tests each; three other full engines suites active throughout | `proof-load-loop.log`, `proof-load-{1..5}.log` |
| Three background full engines suites (`--maxWorkers=1`) | Exit 0 each; 21 files / 223 tests each | `load-suite-{1,2,3}-1.log` |
| `pnpm typecheck` | Exit 0; all workspace packages passed | `typecheck.log` |
| `pnpm test` (no worker overrides) | Exit 0; 2,750 Vitest tests, 33 contract tests, self-tests, address checks, web/server builds and built-role checks passed | `test.log` |
| `git diff --check` | Exit 0 | Final whitespace check |

Evidence files above live under `/private/tmp/eko-audit-01/`. The pre-existing RPC-dependent contract fork test was skipped because `RPC_HTTP_URL` was unset (1 skip); this task introduced no skips, retries, omitted assertions or relaxed evaluation ranges. The final source hashes above match the files used by all proof runs and workspace gates. All verification processes have exited. No merge, push, branch switch or changes to other branches were performed.

## Commit blocker

After all proof steps passed, staging the four task files with `git add` failed (exit 128): the filesystem sandbox denied creation of `index.lock` in the shared `.git/worktrees/eko-wt-audit-1/` metadata directory, outside the writable worktree. No files were staged and no commit was created. The environment forbids requesting elevated execution, so this attempt was not retried or bypassed. The current branch remains `audit-01-shutdown-test`; all four task files are saved in the worktree.

Requested commit message: `Audit 01: separate replay startup and shutdown budgets`. The remaining step is to stage these four files and create that commit from an environment with write access to the repository's shared Git metadata. Use a neutral Git author/committer identity as AGENTS.md requires. No merge, push or other-branch changes are needed.
