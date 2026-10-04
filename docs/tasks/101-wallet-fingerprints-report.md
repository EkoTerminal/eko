# Task 101 implementation report

Base revision: `cc5c440bb8644e928359590ab9c09d10abc2389a`. Candidate is the uncommitted worktree. Source/test/migration candidate SHA-256: `d5ad6803c59eb822cc415249b28756daec37e9f8a26f6dbefc8bf8726adf2abd` (sorted changed relative paths and file contents, each NUL-separated; this report excluded).

## Changes and spec

Followed BACKEND §§5.2–5.5, 20 and FACTS §3, including BACKEND §3.4's immutable point-in-time generations. No spec files were edited.

- `apps/engines/src/watcher/features.ts`: pure features over the inclusive 14-day window capped at 200 swaps; seven-day UTC-hour entropy; block-gap CV and block-based nearest-rank reaction p10; exact four-significant-digit ETH sizes; transaction-level gas-limit/ratio repeat shares and selector/counterparty entropy. Missing observations remain nullable with a named missing-feature list. Orbio requires a buy. Future observations and out-of-window first buys cannot influence features.
- `apps/engines/src/watcher/score.ts`: exact fp-1.0.0 logistic weights, initial 0.75 threshold, confidence tiers, fewer-than-five-swaps low-tier Human, and Declared > Crew > Likely > Human precedence with crew attachments. Risk bands are not an input. Candidate inference is always beta.
- `apps/engines/src/watcher/calldata.ts`: bounded Router02 exact-input and nested multicall shape decoding, including inner selectors, floor-minute deadline buckets and zero minimum-output flags. Unsupported layouts remain missing.
- `apps/engines/src/watcher/store.ts`, `worker.ts`, `index.ts`: indexed actor/log-specific UserOp bindings, canonical delegation state, verified fingerprint routes, acquired transaction inputs, ETH/WETH notional and launch/graduation timing. Known-at cuts prevent later qualified observations influencing earlier cuts. Buyer rank uses an upper bound that counts unresolved buys as possible distinct buyers, so missing actors cannot promote a wallet into the first 50. Immutable feature snapshots and label changes retain original blocks and model versions. Keyset replay processes 256 wallet/block boundaries by default, at most 1,000 per call, returning `next`; incremental polls refresh at most 16 changed wallets by default, at most 256, with at most 200 swap boundaries per wallet. Content revisions catch late enrichment, model/input changes and replacement forks. Qualified graph/history callbacks and their `evidenceRevision` reuse upstream evidence; no funding graph or control/service qualification logic was added.
- `registry-labels.ts`: canonical fingerprint dependencies also govern point-in-time reads, supersessions and declaration withdrawals. Fingerprint model generations themselves retain declared precedence; registry fallback restores the separate behavioral result. Orphaned rows remain stored and unavailable; replacement forks append explicit correction generations. Exact model-version filtering preserves the existing task-100 generation semantics, including separately named `:correction:` generations.
- `apps/indexer/src/types.ts`, `wallet-protocol.ts`: retain already-acquired full-transaction calldata/gas and complete-receipt gas used in the existing scoped protocol manifest. Receipt-only inputs remain explicitly missing. No transport, RPC acquisition or actor-resolution heuristic was added.
- `packages/db/drizzle/0153_wallet_fingerprints.sql`, `0154_wallet_fingerprint_indexes.sql`, `src/engines-migrate.ts`, `src/registry-schema.ts`: engines-owned feature snapshots, canonical dependency links, immutable label links and incremental state; supporting indexes and append-only triggers. Only reserved migrations 0153 and 0154 were used. No dependencies or lockfile changes.
- Tests: new `apps/engines/test/wallet-fingerprints.test.ts`; additive acquired-input test in `apps/indexer/test/wallet-protocol.test.ts`; expanded migration union expectations in `packages/db/test/merge-migrations.test.ts`. No existing assertions were weakened, deleted or skipped; no timeout changes.

## Verification

All commands use existing local dependencies. The workspace gate began before the final engines-only buyer-rank correction. Its engine phase passed on the preceding candidate; the complete engines package subsequently passed on the final frozen candidate. Other packages are unchanged by that final correction, so their workspace-gate evidence is reused.

| Command | Exit | Evidence |
|---|---:|---|
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/engines test test/wallet-fingerprints.test.ts test/registry-labels.test.ts` | 0 | 2 files, 31 tests; `/tmp/eko-101-focused-stable.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/indexer test test/wallet-protocol.test.ts` | 0 | 1 file, 9 tests; `/tmp/eko-101-indexer.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/db test test/merge-migrations.test.ts` | 0 | 1 file, 3 tests; `/tmp/eko-101-migrations.log` |
| `pnpm typecheck` | 0 | All workspace typechecks on final candidate; `/tmp/eko-101-typecheck-candidate.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/engines test test/wallet-fingerprints.test.ts` | 0 | Final buyer-rank regression included: 1 file, 20 tests; `/tmp/eko-101-focused-candidate.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/engines test` | 0 | Final complete engines gate: 26 files, 269 tests, 124.03 s; session `29878` completed; `/tmp/eko-101-engines-final.log` |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | 181 files, 2,988 tests; web/server builds and built-role fixture checks passed; session `7277` completed; `/tmp/eko-101-test-final.log` |
| `pnpm brand:check` | 0 | 154 files checked, including built artifacts; `/tmp/eko-101-brand-candidate.log` |
| `pnpm check:addresses` | 0 | 439 source files checked; `/tmp/eko-101-addresses-candidate.log` |
| `git diff --check` | 0 | No whitespace errors |

Earlier development checks exposed fixture score/threshold expectations and a temporary unnecessary RPC value-field typing mismatch, both corrected. The diagnostic command `VITEST_MAX_WORKERS=2 pnpm --filter @eko/engines test test/wallet-fingerprints.test.ts -t 'updates changed'` exited 1 before fixture correction; the complete file subsequently passed. The first full command exited 1 after overlapping the final Orbio buy-only edit: the runner loaded the pre-edit feature with the new assertion. Its focused reproduction passed on the frozen candidate before the stable full gate was launched. That first run is not accepted as final verification.

## TODO(spec), dependencies and limits

Every TODO in changed source files:

- New, `watcher/features.ts`: the spec does not select a percentile estimator, deadline buckets or entropy sample floors. Use nearest-rank p10, floor-minute buckets and any observed entropy sample; retain the specified 20-swap CV and five-pair reaction floors.
- New, `watcher/store.ts`: no reviewed agent-kit implementation list or complete wallet UserOp-history certificate is specified. Require supplied reviewed delegates and explicit `useropHistoryAt` coverage evidence; absent lists/history remain null. Indexed UserOps are bounded to 200, with an extra row detecting truncation; truncated history cannot claim a complete paymaster share. Authorization signatures alone do not establish current delegation code.
- Retained, `registry-labels.ts`: the qualified graph provider is absent in this revision. Accept only the existing qualified crew attachment adapter; do not implement another graph. Upstream changes must update `evidenceRevision` or explicitly replay affected cuts.
- Retained, `apps/indexer/src/wallet-protocol.ts`: no persisted Watcher coverage wire schema is specified; retain the existing finite scoped manifest, with acquired transaction fields added.

Reviewed agent-router/delegate inputs, qualified graph membership and complete wallet protocol-history coverage remain upstream dependencies. Unsupported calldata layouts, missing current code and unobserved protocol attribution remain named missing features. Replay requires canonical indexed block headers; absent headers cannot produce accepted fingerprint snapshots. The separate ≥90% label-precision evidence remains unprovided; no eval gate, Census headline gate or release flag was enabled.

This candidate is implemented and fixture-tested, not committed, pushed, deployed, live-verified or approved. Tests use neutral synthetic fixtures; they are not live precision evidence. No personal identifiers or real secrets were added or ported. Actual external cost: zero; no paid runs, network acquisition or ports. No coverage instrumentation was run.

Completed checkpoint: workspace session `7277` and final engines session `29878` both exited 0; no jobs remain running. The workspace run included indexer tests (153 tests, 306.80 s), server tests (346 tests, 208.24 s), MCP tests, web/server builds and built-role fixtures. Final engines verification covers the last SQL/test correction, with unchanged packages covered by the workspace run. No full gate was restarted merely for reporting. Next action is lead review and commit of this uncommitted candidate. Reproduction commands are the exact commands in the table; bounded replay is exported as `replayFingerprints(db, from, to, { limit, after })` and returns the next keyset cursor.
