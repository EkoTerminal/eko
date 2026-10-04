# Task 050 implementation report

Prepared, uncommitted fixture-only implementation. All four required repository checks exited 0. Guard V2 remains shadow/inactive; no estimator is connected to scoring, outcome labels, policy, acceptance, or a release switch. No migration or dependency change was needed; reserved migration 0188 was not used. No personal identifiers were added or ported. No network acquisition, paid run, listening port, commit, push, or deployment was started.

Source revision: `4e4f69ce650b14fff13d97d890a817b3ba7632a3`. Candidate: that revision plus the five implementation/test files below. Candidate manifest SHA-256: `3f20ca46575a852ae077754ab6149627e037ce3f368dbe9188ed263d01a02ab0`; sorted relative-path/content hashes are in `/private/tmp/eko-050-candidate.json` (report excluded).

Follows Guard 2.0 §3.3, with cursor/availability rules in §2.1, independent lot origin in §§2.3/3.2, per-pool inventory in §2.5, metric coverage in §3.1, and the optional conservation/mixing method study in §9.4. Uses the existing 031 lot rational arithmetic and 042 graduation reconciliation; stays separate from 049 campaign outcome/intervention paths. No scoped spec/code conflict was found.

Changed files:

- `apps/engines/src/reserve-origin-input.ts`: strict, versioned fixture-only normalized envelope. Pins identity classifications, graph version, full availability cut, source revision, quote asset/decimals, reserve sources, fee recipients, consumed source legs, sold-lot method, interval and opening/closing observations.
- `apps/engines/src/reserve-origin.ts`: pure exact-rational proportional accounting for operator, outside-buyer, other and individual LP-provider buckets. Buy debit reconciles to net incoming reserve plus separately recorded fees. Gross outgoing reserve is removed proportionally; net seller credit and fee/payout recipients remain separate. Mixed receipts use reviewed operator-origin sold units rather than proceeds-recipient identity. Computes interval buyer-origin receipts and subtracts each verified operator buy debit once, including trading charges. Preserves origin through migration only when task 042's actual per-pool settlement, quote/payout accounting and route bindings reconcile. Virtual reserves never enter money buckets. Returns named gaps and null estimates for unsupported cases, with input/result/identity hashes and evidence.
- `apps/engines/src/index.ts`: exports the isolated input schema and pure function; starts no work.
- `apps/engines/test/reserve-origin-fixtures.ts`, `apps/engines/test/reserve-origin.test.ts`: 33 synthetic cases, including real versus virtual reserve, large integers, fractional exact sums, fee outflow, mixed lots, one-time fee-inclusive buy offset, interval boundaries, same-block execution order, identity availability, zero reserve, LP additions/claims, FIFO/proportional and mixing sensitivity, verified migration and unsupported settlements.

Verification (repository root; final candidate):

| Exact command | Exit | Evidence |
|---|---:|---|
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/engines exec vitest run test/reserve-origin.test.ts test/graduation-inventory.test.ts test/lot-metrics.test.ts test/campaign-replay.test.ts` | 0 | 84 tests in 4 files; `/private/tmp/eko-050-focused-final.log` |
| `pnpm typecheck` | 0 | `/private/tmp/eko-050-typecheck-final.log` |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | Full command completed, including engines 545, indexer 153, server 456, MCP 57 tests and built role fixture checks; `/private/tmp/eko-050-test-final.log` |
| `pnpm brand:check` | 0 | 47 files; `/private/tmp/eko-050-brand-final.log` |
| `pnpm check:addresses` | 0 | 552 source files; `/private/tmp/eko-050-addresses-final.log` |
| `git diff --check` | 0 | Tracked whitespace |

No existing test was weakened, skipped, deleted, or given a higher timeout. Gate logs replace environment-generated workspace/home prefixes with neutral placeholders.

Remaining gaps and reproduction:

1. `TODO(spec)` in the input schema: the spec does not name this wire or its interval endpoint convention. The bounded local envelope uses `(from,through]` full executable cursors and rational raw quote units; all earlier supplied steps replay reserve mixing but contribute no interval sale receipts or buy offset. This is not a public/acquisition API or a persisted checkpoint format.
2. Opening buckets, fee transfers, reserve observations, identity classifications and sold-lot allocations must be reconciled by a source adapter. This function does not decode logs/traces or establish control from origin. Missing buy identity, unreviewed/missing/mismatched quote fees/debits/credits, incomplete coverage, manager-wide balances, broken route/delta bindings and unmatched closing state withhold accounting and estimate. Unknown/unreviewed/nonconserved sold lots or a zero prior sale reserve withhold the estimate while preserving otherwise reconciled buckets and raw receipts.
3. Migration remains unknown for unmatched settlement/pool/quote/cursor bindings, old-curve residuals, unresolved inventory/custody coverage, surplus successor inventory, missing payout decomposition or accrued successor quote fees. Existing v4 execution/depth gaps remain: accounting carryover is not an executable-route or critical-check completion claim. Later reviewed fixture LP contributions enter provider buckets rather than inheriting migrated buyer origin.
4. No measured Pons reconciliation, independent FIFO/proportional allocation audit, predictive fitting, outcome labels or release acceptance was performed. The numerical result is an optional mixing estimate; no responsibility or buyer-loss interpretation is supplied. Availability cuts and identity digests preserve the chosen classification snapshot rather than silently revising prior outputs.

Reproduce with the focused command above. For individual cases, append `-t '<case title>'`. Import `ReserveOriginInputSchema` and `estimateReserveOrigin` for a local fixture calculation. Measured inputs are explicitly rejected by the schema; a later authorized source-adapter/method study must supply reconciled observations and independent validation before broadening this boundary.

Acquisition/validation: **0 upstream requests, 0 request units, $0 charged cost, 0 measured validations**. Provider pricing was not measured. Coverage is synthetic fixture accounting and existing local dependency tests only. Mocked RPC metering in the existing full-suite logs is fixture activity, not acquisition. There is no acquisition process or measured checkpoint. Local gate checkpoint: `/private/tmp/eko-050-checkpoint.json`; command logs are listed above. All check processes ended; no timing-sensitive file failed in the final full gate, so no isolated rerun was required. Next action: the lead reviews the uncommitted scoped diff. Source-adapter validation, method study, deployment and release remain separate work.
