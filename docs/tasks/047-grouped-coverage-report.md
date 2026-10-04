# Task 047 report

Source revision: `4630274c873f18305784c7b38577f4c0892581d6` (Guard 046).
Candidate: uncommitted changes in this worktree. SHA-256 of the five changed implementation/test files, sorted by relative filename, hashing each filename + NUL + file bytes + NUL: `1c837cbb06cf32c9b05ed81ae090e3091f040093fbc4164864bdf2ae149ca0a3`.

Changed files:

- `apps/engines/src/grouped-coverage-input.ts`: strict supplied-input validation, effective graph, candidate acquisition/investigation and lock-release observations.
- `apps/engines/src/grouped-coverage.ts`: shadow-only largest/union coordination, control grouping/top ten, principal/early lot-origin bounds and the 3,600-second release scenario. Incremental component sums and maintained holder/control rankings, atomic failed-update handling and reverse wallet-to-coin dependencies support effective graph replacement after reclassification, split or reorg.
- `apps/engines/test/grouped-coverage.test.ts`: 16 synthetic tests, including ten separate 9% groups, 200 late 0.2% wallets, gifts/wide distributions, unknown custody, exact next-boundary and 95% coverage cases, mixed/missing origins, large integers, release bounds and multi-coin reclassification.
- `apps/engines/src/index.ts` and `apps/engines/src/guard-code-files.json`: exports and candidate receipt code-hash coverage.

Coverage completion requires the acquisition universe, current origin and direct actor accounting, at least 95% holder float investigated, all material connected candidates assessed and the conservative unresolved joint-group bound below the next 15/30/50% coordination boundary. Smaller holders enter the expansion queue; omitted/excluded mass stays visible and never establishes independence. Candidate/control connections are investigated without merging them into scored coordination. Distinct qualified coordination components remain separate and their union counts each member once. Unknown custody stays in float/raw top ten and leaves grouped concentration unresolved.

Spec followed: Guard 2.0 §§2.4–2.5, 3.1–3.2, 5.1, 5.3 and 8.4; supplied effective graphs follow Guard 046 / §2.3. No conflicting spec behavior replaced. `TODO(spec)` in the input module records the unspecified local aggregate acquisition/checkpoint envelope; it is not a production acquisition API.

Checks on the candidate:

| Command | Exit | Result |
|---|---:|---|
| `pnpm --filter @eko/engines test test/grouped-coverage.test.ts test/qualified-graphs.test.ts test/lot-metrics.test.ts test/supply-v2.test.ts` | 0 | 4 files, 92 tests passed |
| `pnpm --filter @eko/engines typecheck` | 0 | Passed |
| `pnpm typecheck` | 0 | All workspace typechecks passed |
| `VITEST_MAX_WORKERS=2 pnpm test` | 1 | Existing indexer dense-payload 200-block test hit its 120-second timeout; isolated file rerun passed |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/indexer test test/log-head.test.ts` | 0 | All 41 tests passed with unchanged timeouts (613.02 seconds) |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server --filter @eko/mcp test` | 0 | Server: 346 tests passed; MCP: 24 tests passed |
| `pnpm test:role-image` | 0 | Web/server builds and built-role lifecycle/configuration checks passed |
| `pnpm brand:check` | 0 | Final post-build run: 154 files checked (initial source run: 38) |
| `pnpm check:addresses` | 0 | 439 source files checked |
| `git diff --check` | 0 | Passed |

Initial new-test failures came from trying to mutate the deliberately frozen graph fixture, and initial test typechecking exposed a readonly graph-input type mismatch. Both were corrected without changing existing tests or timeouts. Subsequent focused runs passed.

All workspace package tests have passing evidence by combining the original run, the isolated indexer file rerun and the remaining server/MCP run. The inherited contract RPC fork test skipped because its endpoint was unset. The original full command's exit remains 1; no single successful full-command run is claimed. Its timing failure can be reproduced with the full command or the isolated file command above. For a single clean aggregate exit, rerun the full command after parallel machine load subsides.

Reproduction: run the focused command above; fixtures build reconciled supply snapshots and explicit synthetic effective graph/lot/investigation observations. The incremental engine can be rebuilt from those same supplied observations. No migration, dependency or lockfile changes are needed.

Acquisition/release status: no acquisition RPC/API requests, acquired request units or provider charges (actual remote spend: 0). Metering printed by inherited tests is fixture traffic. Provider pricing is not applicable; population coverage numbers are synthetic fixture assertions, not measured chain coverage or calibration. No acquisition job/log/checkpoint exists. Validation checkpoints are complete: typecheck session 95287 (0); full test session 41139 (1); isolated indexer session 77616 (0); remaining server/MCP session 39923 (0); build/image session 50448 (0). Evidence is in the command outputs; no validation processes remain running. Engines passed all 288 tests; indexer initially reported 151 passed and one timeout, then its isolated failing file passed all 41 tests. This supports a timing flake; no source/assertion/timeout changes were made. The next release action belongs to the lead: pin/merge the candidate and perform empirical gates before activation. Production collectors/persistence and empirical precision, distribution/vesting and throughput release gates remain separate work. Component sums/rankings update incrementally, but supplied-input validation, coverage passes and array index updates still depend on population size; throughput has not been measured. V2 remains shadow/inactive. Nothing was committed, pushed, deployed or released; no personal identifiers were added or ported.
