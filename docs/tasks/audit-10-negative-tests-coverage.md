# Audit fix 10: negative tests for every core mutation, and measured ≥95% core line coverage

Source: `.audit-grade/REPORT.md` (rescore), Path to 9 items "Complete negative tests for core external mutations" and
"Measure ≥95% aggregate core line coverage". Rubric lines (category C):
- 1.0 Negative tests: **every** external state-changing function / route in in-scope core code has an unauthorized or
  invalid-input test (wrong signer, owner, account, input). Full points at ≥90% of them, half at ≥60%.
- 1.5 Line coverage of in-scope core code: ≥95% → 1.5 · ≥85% → 1.2 · ≥70% → 0.8 · ≥50% → 0.4.
In-scope core = code that holds or moves funds or keys, authenticates users, or decides settlement (contracts,
off-chain signers, auth/session/agent keys, private journal, execution preparation, receipts), minus tests, mocks,
interfaces, deploy scripts and generated code. UI (apps/web) is out of scope.

## Do
1. Inventory every external state-changing entry point in in-scope core: registry functions (including inherited
   Ownable2Step transferOwnership/acceptOwnership/renounceOwnership), server mutation routes (auth/SIWE, sessions,
   agent keys issue/revoke, journal write/destroy, order/trade preparation and submission/rejection, admin trading
   routes, incident/monitoring admin routes), receipt committer actions. Write it to `docs/security/NEGATIVE-TESTS.md`:
   entry point, file:line, the negative test(s) that cover it (file + test name), or "missing".
2. Add the missing negative tests until ≥90% (aim for all). Do not touch apps/server/src/ws or apps/indexer pricing code
   (other packets just changed them); their tests already exist.
3. Coverage: use the coverage provider already in the lockfile (@vitest/coverage-v8; check versions match vitest) and
   `forge coverage` for contracts. Configure coverage for the in-scope core file list only (include globs), produce the
   numbers, and record them in `docs/security/COVERAGE.md` (file list, command, per-file and aggregate line %). Add tests
   for uncovered behaviour (not trivial line-touching) until aggregate ≥95%, or as far as is reasonable — report
   honestly. Add a `coverage` script and, if it runs in reasonable time, a CI step in `.github/workflows/ci.yml` (keep
   all hardening rules).

## Proof
- NEGATIVE-TESTS.md with the count (covered/total); COVERAGE.md with the measured aggregate; `pnpm typecheck` and
  `pnpm test` pass.

Follow AGENTS.md (never weaken or skip tests). Only this task. End with the AGENTS.md report.
