# Task 042 implementation report

Prepared, offline fixture-tested implementation. **Measured graduation acceptance and critical completion remain incomplete.** Source revision: `047819ad926d5536935128e1d18d0e0b43eeb336`. Candidate: uncommitted worktree; sorted relative-path/content SHA-256 manifest `a7b60ccb29715b976f1f7367eec1e1016670b975431ebdaeee7ffaeb97792c04`, saved at `/private/tmp/eko-042-candidate.json` (source/tests only; this report excluded). The lead owns committing. No personal identifiers were added or ported.

Follows Guard 2.0 §§2.5, 3.4, 4.3 and packet 042; extends 030 supply accounting, binds 039 profiles and retains 040/041's explicit v4 limitations. Uses the lead's deployed-behaviour facts: readiness requires zero sellable tokens, ready curves close sells, and graduation hands tracked reserves to v4. It does not derive graduation from a reserve threshold, assume historical reserve fractions, or import the public curve implementation as deployed truth.

Changed files:

- `apps/engines/src/graduation-inventory.ts`: strict local supplied-evidence envelope and pure reconciler. Binds coin/quote, old curve, migration transaction, reviewed factory/source pins, successor PoolId settlement credit, full-range position and pinned hook/locker. Conserves real token/quote handoff including separate payouts and non-market excess; reconciles positions, signed tick liquidity and active liquidity. Requires exact current-state/availability boundaries and profile digest. Rejects aggregate PoolManager inventory. Current per-pool fees remain separate from market inventory. Expired/revocable positions are removable; locked LP underlying stays in P; unavailable non-market excess enters K. Exposes supplied $100 sell observations and alternative routes without proving token-wide no-exit or withdrawal. Uses 041's separately validated position/range inputs to assess supported secondary v3 removal, while returning the v4 residual as unknown.
- `apps/engines/src/supply-v2.ts`: optional reconciled graduation input, U=0, exact K/P/C/F, custody-balance cross-checks, no double exclusion, and no pool units in external holder numerators. Unrelated manager balances/fees remain visible in F. Fixture graduation never completes the live `supply_float` check; missing evidence preserves existing unsupported graduation behaviour.
- `packages/shared/src/contracts/guard-supply.ts`: additive `pool` holding bucket; supply/cap definitions remain unchanged.
- `apps/engines/src/index.ts`, `guard-code-files.json`: exports and source provenance manifest.
- `apps/engines/test/graduation-fixtures.ts`, `graduation-inventory.test.ts`: synthetic normal/inaccessible graduation, removable secondary route, expired/revocable lock, aggregate rejection, fees/residual custody, readiness/conservation/full-range/tick/asset failures, stale/changed pins, availability, duplicates and double-counting negatives. Existing tests were not removed, skipped or weakened.
- `docs/tasks/042-implementation-report.md`: handoff and acceptance gaps.

No dependency or migration was needed; engines 0138/server 0020 reservations are unused. No worker, active V2 policy, legacy card, trading route or deployment was enabled.

Verification:

| Exact command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/engines exec vitest run test/graduation-inventory.test.ts test/supply-v2.test.ts` | 0 | Final candidate, 41 tests; `/private/tmp/eko-042-focused-stable.log` |
| `pnpm typecheck` | 0 | Final candidate; `/private/tmp/eko-042-typecheck-stable.log` |
| `pnpm test` | 0 | Final candidate: all workspace suites, role-image builds and checks; `/private/tmp/eko-042-test-stable.log` |
| `git diff --check` | 0 | Tracked whitespace |
| `pnpm brand:check` | 0 | 145 files, including built assets; `/private/tmp/eko-042-brand.log` |
| `pnpm check:addresses` | 0 | 390 source files |

Initial focused runs exited 1 because fixture assertions expected the wrong reorg error, supplied extra fields to a strict lock schema, and mutated a shared availability object. Those fixtures were corrected; production checks were retained. The final focused run above passed.

Earlier workspace `pnpm test` runs exited 0 (`/private/tmp/eko-042-test.log`, `/private/tmp/eko-042-test-final.log`), including all package suites and role-image builds/checks. They started before the final token/quote binding additions and null-unlock regression respectively. Review caught a missing nonrevocable-lock unlock time being treated as removable; it now remains unknown and has regression assertions. Earlier workspace evidence is superseded by the final candidate run above. The existing contract fork fixture skips when `RPC_HTTP_URL` is unset; no fork evidence is claimed. Metering counters in workspace-test logs are mock RPC fixture counters, not acquisition requests or charges.

Remaining evidence and reproduction:

1. **No observed deployed migration fixture is available locally.** The new `TODO(spec)` states that the acquisition envelope is unspecified. This adapter consumes reviewed supplied observations; it does not authenticate raw migration ABI/call/logs, derive PoolId from a verified PoolKey, acquire settlement storage, or establish deployed locker permissions by itself. A measured flag/reviewer assertion is not new chain validation. The October 1 fixtures contain launches/buys, and the task's lead facts do not supply a graduation receipt or locker trace.
2. Collect one actual factory graduation call/event and receipt/trace; review its deployed code and arguments. Capture pre-migration readiness/real reserves, exact post-migration cursor, PoolKey-to-PoolId binding, token/quote settlement credits and payouts, full-range mint, current pool ticks/positions/fees, hook/locker code and reachable custody permissions/unlock schedule. Include complete relevant transfers and all alternative routes. Bind a reviewed measured 039 profile at the pre-migration state; do not relabel these synthetic fixtures as measured.
3. Independently validate successor execution for each required account/size and v4 removal-depth reconstruction. 040/041 currently cannot certify v4. Every graduation result therefore retains `criticalComplete=false`, `v4_execution_unvalidated` and `v4_removal_depth_unsupported`. Secondary v3 removal results are not token-wide ratios. An inaccessible/unknown successor stays unassessed; an empty old curve alone cannot label a pull. The 600-second successor-equivalence observation and complete withdrawal-label proof remain unavailable.
4. Offline reproduction: run the focused command above. For a reviewed captured manifest, call `reconcileGraduationInventory(input)` and optionally `reconcileSupplyBasicsV2(supplyInput)` with `inventory.graduation=input`; provide separately validated 041 route/position inputs to `graduationRemovalDepth`. Capture the missing deployed evidence in an independently authorized environment before 052/075 acceptance. No paid acquisition driver or remote job was added.

Acquisition: **0 remote requests, 0 request units, $0 charged cost, 0 measured graduations or successor executions**. Provider pricing was not acquired or assumed. Coverage is synthetic: one v4 successor and one optional secondary v3 route, with supplied fixture $100 EOA exit observations. It does not certify either reference account class, either reference size, arbitrary successors, historical outcome labels or trading release.

Checkpoint: `/private/tmp/eko-042-checkpoint.json`; verification logs and manifest are listed above. All verification processes finished; none remain running. Next action belongs to the lead: review/commit the prepared candidate and acquire the missing measured migration/custody/execution evidence before critical acceptance. No commit, push, paid job, network acquisition, listening service or deployment was started.
