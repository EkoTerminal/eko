# Task 046 · Qualified graphs report

Implemented as an uncommitted, pure shadow evaluator. No migration, dependency, lockfile, acquisition, active policy, publication or release changes.

## Changes and specification

- `apps/engines/src/qualified-graph-input.ts`: closed normalized ledger input, pinned flow values/allocations, effective permissions/services, reviewed patterns/loops, origin lots and dispositions, canonical block manifest and availability cut.
- `apps/engines/src/qualified-graphs.ts`: observed connections separate from qualified control, coordination and origin; exact bigint ratios; authenticated control/private payment; recent material funding and 60-second batches; collector/fast slice; reviewed and method-gated closed loops; three-hop funding/seven-day recycling candidates; repeated 50% leads; lot lineage and three-wallet consolidation. Ordinary origin and gifts never establish control. Original purchasers are recorded separately from disposition participants.
- `apps/engines/src/index.ts`: exports the pure evaluator and input schema.
- `apps/engines/src/guard-code-files.json`: includes both graph implementation files in candidate source hashing.
- `apps/engines/test/qualified-graphs.test.ts`: 24 synthetic tests covering thresholds/windows, gas/conversion gaps, old/dust/service paths, failed/wrapped funding, private fanout at quarantined hubs, separate UserOps/customers, conserved allocation across launches, delayed collection/recycling, reviewed bounded loops, two-account control, consolidation, gifts, expiry/supersession and reorgs.

Followed Guard 2.0 §§2.1–2.3 and 5.3, with §9's attribution promotion boundary and existing 026 parameter/version registry. Used 031's independent lot origin, 043's permission/service resolutions, and 044's successful funding identities. 045's diagnostic acquisition does not establish production funding completeness. Guard 2.0 supersedes backend §5.4's older weighted timing/transfer unions; those unions are not used here. Shared cursor, coverage, amount and availability contracts are reused.

Components are rebuilt from surviving qualified edges, with sorted versioned membership/edge hashes, supersession and retired IDs. They are deeply frozen. Deleting the highest-degree funding node or an unresolved hub produces remaining partitions, including isolated economic endpoints. Robustness diagnostics never promote coordination to control. Three participating wallets are required for coordination group scoring; two authenticated controlled accounts remain a complete control component. Launch-bundle eligibility uses `[t0,t0+300)` separately from later qualified acquisitions.

## Qualification and remaining boundaries

The evaluator consumes **conserved factual ledger allocations**, rather than constructing a ledger that depends on graph membership. It validates ordered connected paths, non-increasing allocated value, per-flow budgets across all supplied launches, purchase inputs plus gas, and net-sale/collection budgets. Exact historical conversions belong to the source ledger; null conversions and incomplete native/internal coverage prevent qualification. Upstream ledger normalization must include competing debits and consumed lot allocations. No RPC or wall clock is used.

Recent funding uses `(buy−21600,buy)` bounded by full execution cursor; 24-hour funding sensitivity retains leads rather than asserting independence. Collector qualification includes the 86400-second endpoint and separately records amounts within 3600 seconds. Recycling requires qualified collection/funder endpoints, conserved 90% value and at most three non-service hops within 604800 seconds. Medium/soft edges never enter accepted components or history. Closed-loop control requires a principal-side connection, independently supplied review evidence known by the cut, accepted method input, and endpoints that permit control expansion. The method acceptance input is not populated by a release job in this packet; fixture acceptance is synthetic.

`TODO(spec)` in the input schema: Guard specifies qualification semantics, but not the normalized graph transport names. The smallest local closed candidate envelope is used; it is not a public API replacement.

The pure snapshot does not establish the §5.3 candidate universe, 95%-float coverage, unresolved joint exposure bounds, production service resolution, historical enumeration, or any empirical precision gate. Those checks remain explicit downstream work, including packet 047. The caller must supply complete first-buy enumeration, event-time values, canonical hashes, source-ledger allocations and captured permission/service facts. It must retain earlier immutable snapshots and invoke recomputation on timers and reorg invalidation. No accepted calibration, human attribution review or live source coverage is claimed. No personal identifiers were ported or added; fixtures use neutral generated addresses and hashes.

## Revisions and verification

Source revision: `4601c4d53b7bf2edd2d7f8c6d0fdb0c0a0afeaf8`; starting working tree was clean. Candidate remains uncommitted. Candidate source/test SHA-256: `6373df647ecdb93c24f521702e6bb2fb357d806bc961e543deb5768607dd8c6b`, computed over sorted relative paths plus NUL, file contents plus NUL for the five implementation/test files listed above. This report is excluded. Checkpoint hash: `/tmp/eko-046-candidate.sha256`.

| Exact command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/engines test test/qualified-graphs.test.ts` | 0 | Final candidate: 24 tests; `/tmp/eko-046-focused-final.log` |
| `pnpm typecheck` | 0 | `/tmp/eko-046-typecheck-final.log` |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | All workspace suites and built role-image checks passed; `/tmp/eko-046-test-final.log` |
| `pnpm brand:check` | 0 | `/tmp/eko-046-brand.log` |
| `pnpm check:addresses` | 0 | `/tmp/eko-046-addresses.log` |
| `git diff --check` | 0 | Tracked whitespace; new source/test files also checked for trailing whitespace |

Initial focused typecheck found import/type inference errors (exit 2); these were corrected. Focused graph runs then passed without modifying existing tests, assertions or timeouts. The pre-final workspace run exited 0 (`/tmp/eko-046-test.log`), including the built role-image checks. It began before final review corrections; its results are not substituted for verification of the final graph source.

## Acquisition, reproduction and handoff

Actual acquisition: 0 live requests, 0 request units, 0 indexed pages, 0 Anvil upstream calls, $0 spend. Pricing is not applicable: no paid source was acquired or exercised. Fixture coverage proves deterministic mechanics only, not measured graph precision, provider capability or live funding coverage. There is no acquisition process, acquisition log or data-run checkpoint; the paths above are verification logs.

Reproduce the graph fixtures with the focused command above, then run the four required workspace commands. All tests use the existing package timeout settings. Next action: lead reviews the uncommitted diff and consumes the pure evaluator from the subsequent graph/coverage work using acquired conserved ledger facts. Empirical method acceptance and release remain later gates; this packet prepares functions and fixtures only.

Final verification is complete; all check processes have ended. Final engines suite: 273 passing tests across 26 files, including the 24 graph fixtures. All four required workspace commands exited 0. No timing-sensitive file failed in the final run, so no isolated failure rerun was needed. The diff is uncommitted and ready for the lead.
