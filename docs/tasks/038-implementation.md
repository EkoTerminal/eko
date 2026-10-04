# Task 038 implementation handoff

Source revision: `8555f32881fd1fa02d9d8bb0b62a9b2ee59bef49` (initial tracked tree clean).
Candidate: uncommitted worktree changes, implementation/test manifest SHA-256
`2a69bf017e6e4192fa1b2a7c1e02d9822d255c725703c83c5ad92e46d0e29c21`.
The fingerprint hashes compact, sorted-key JSON of the sorted changed implementation/test
paths and each file's SHA-256; this report is excluded. No commit, push or deployment.

## Changes and spec

Followed Guard 2.0 §§7.1–7.3 and BACKEND §7.7. Guard §7.2 supersedes the legacy
Monitor-match deduction only in the separately versioned adapter. V1 inputs, calculations,
fixtures, card history and receipts retain their original semantics.

- `packages/signal/src/v2.ts`, `src/index.ts`, `test/v2.test.ts`: Signal version 2;
  five numeric readings; original 30/25/20/15/10 weights and beta flag. Elevated deducts
  25 once, confirmed tax-raise/blacklist/mint deduct 10 once each, removable LP deducts
  15 once. Either tier gap or unresolved required control/custody produces numeric 50
  with lowData risk; High keeps Risk zero even with gaps. The other four readings reuse
  explicitly supplied V1 measurements, with unavailable/lowData readings normalized to
  50. V2 depth/float/flow values never substitute for legacy measurements. Input method
  versions and the exact Guard receipt ID accompany every result. Presentation checks
  the current Guard separately from cached Signal, overlays High and suppresses Hot on
  gaps, missing readings or a different Guard receipt.
- `apps/engines/src/signal-v2.ts`, `signal-code-files.json`, `shadow-v2.ts`, `worker.ts`,
  `test/signal-v2.test.ts`: append-only shadow input/output history, bound to an actual
  stored Guard revision and availability cut. Captured control/LP content hashes are
  checked; measurement IDs, original legacy sample, full Guard receipt, source revision,
  adapter code hash and methods are retained. Refresh is limited to once per 15 seconds
  per coin/adapter code/replay lane. Missing recorded Guard revisions produce no invented
  Signal receipt. No public activation, rank or policy integration.
- `packages/db/drizzle/0124_signal_shadow.sql`, `src/engines-migrate.ts`,
  `test/merge-migrations.test.ts`: reserved engines migration 0124, immutable journal,
  receipt/block bindings and refresh index. Migration tests retain prior assertions and
  add the new ledger entry/table; no server migration.
- `apps/web/src/pages/terminal/CoinSignal.tsx`, `CoinSignal.test.tsx`: prepared V2 rendering
  requires a Guard, hides lowData reading values/bars/contributions as unavailable, labels
  the adapter shadow, shows method versions/receipt and overlays High. A shadow assessment
  is labeled shadow; active High says buys refused. Existing V1 rendering retains its
  numeric/Low data behavior. V2 is not mounted by public routes in this packet.
- `apps/server/test/signal-ranking.test.ts`: changing activity/adapter scores does not
  change the existing Radar order. Guard refusal is independently tested with high Signal.
- `apps/server/build.mjs`, `scripts/check-role-image.mjs`: bundle and verify the exact
  Signal source bytes independently from the existing Guard source manifest.

## Checks

Final implementation verification:

| Exact command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/signal test` | 0 | 53 tests, including unchanged V1 fixtures and V2 adapter/policy regressions |
| `pnpm --filter @eko/web test src/pages/terminal/CoinSignal.test.tsx` | 0 | 2 server-rendered UI tests |
| `pnpm --filter @eko/engines test test/signal-v2.test.ts test/guard-shadow.test.ts` | 0 | 6 synthetic PGlite tests; original V1 card/verdict unchanged |
| `pnpm --filter @eko/db test test/merge-migrations.test.ts` | 0 | 3 fresh/upgrade/idempotency tests |
| `pnpm --filter @eko/server test test/signal-ranking.test.ts` | 0 | 1 ranking regression |
| `pnpm typecheck` | 0 | All workspace packages |
| `pnpm test` | 0 | Full workspace tests, brand/address checks, web/server builds and role-image matrix |
| `git diff --check` | 0 | No whitespace errors |

The initial full gate caught the migration test's old expected ledger list; it was extended
for 0124 without removing assertions. The ranking regression was moved into the server
package to respect its Fastify type augmentation boundary; final typecheck and its focused
check pass. No existing tests were deleted, skipped or weakened.

## Gaps, reproduction and checkpoint

`TODO(spec)` in the adapter: Signal has no narrower required-control manifest. The adapter
conservatively requires the shared `GUARD_CAPABILITIES` set before treating unobserved
powers as absent. Unknown LP custody likewise cannot establish absence of the LP deduction.

This is prepared, fixture-validated shadow work. Independent adapter promotion and Guard
release gates remain outstanding. No real chain coverage, calibrated accuracy, current
control/LP acquisition or browser/network acceptance is claimed. Collector omissions remain
lowData; V2 float/directional-depth/freshness definitions are not repurposed as V1 observations.

Reproduce by running the focused commands above, followed by `pnpm typecheck` and `pnpm test`.
Apply migration 0124 through the existing engines migration runner in an authorized release.
For a shadow row, the normal pipeline must already have a recorded Guard revision plus its
captured availability manifest; the engine tests demonstrate this entirely in memory.

Acquisition: **0 live chain/provider calls, 0 billed request units, $0 acquisition cost**.
No paid job, subscription or deployment; no pricing assumption needed for zero acquisition.
Coverage is synthetic fixtures and existing checked-in replay fixtures, not newly measured data.

Checkpoint: complete; no task process remains running. Final gate processes completed with
exit 0. Logs: `/tmp/eko-038-typecheck.log`, `/tmp/eko-038-test.log`, and
`/tmp/eko-038-focused-{signal,web,engines,db,server}.log` (one file per check area).
Next action: lead review/commit of this candidate; public activation and measured release
validation belong to the independently authorized rollout.
