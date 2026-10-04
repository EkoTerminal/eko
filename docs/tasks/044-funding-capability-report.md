# 044 implementation report

Source revision: `8555f32881fd1fa02d9d8bb0b62a9b2ee59bef49` (initial tracked tree clean).
Candidate: uncommitted working tree, funding method `2.0.0`. SHA-256 over the five changed source/test files, sorted by relative path, with NUL-separated path/content pairs: `283c70ef45e27470ad2e7f3fb0939456c3f7ae8c4d71edb5efd721ef4774006d`. Checkpoint: `/tmp/eko-044-candidate.sha256`. This report is excluded from that source hash.

## Changes and scope

- `packages/chain/src/funding/provider.ts`: normalized provider/page/flow interfaces; chain-4663 interval bounds, source revision, request/next cursor and sequence, evidence hashes, successful external/internal native and quote streams. Capability controls cover funding-only, internal, failed, ancestor-reverted, quote, wrapping, pagination and interval boundaries. Fixture validation cannot certify a provider. Native and quote qualification remain separate, with quote assets explicitly enumerated.
- `packages/chain/src/funding/acquisition.ts`: shared concurrent address/range/hash acquisition, bounded page admission and range cache, serializable checkpoints and an injectable cache interface. Accepted pages survive missing/invalid pages; a new acquisition instance resumes the retained cursor. Source revisions and endpoint hashes change the cache key. Failed/wrapped/self/mint legs are excluded, unresolved settlement stays missing, and conflicting duplicate values are rejected. Bounded history exposes first observed only; first-ever needs complete native/internal/relevant-quote coverage plus genesis or supplied proved-creation evidence. The bigint value ledger prevents consuming one transfer twice across launches and rejects post-purchase funding.
- `packages/chain/src/funding/diagnostic.ts`: reuses task-043 acquired blocks instead of introducing another RPC transport. Extracts successful native calls, excludes failed ancestors and non-transferring delegate/static frames, and requires explicit quote settlement/wrap reconciliation. The shared union-interval diagnostic plan includes task-043's full-block, receipts, trace and canonical-hash recheck costs, clips to supplied approved remaining spend/checkpoint units, and retains uncovered intervals/next block. It never claims live funding completeness or runs requests. Cost accounting separates indexed pages, confirmations, block traces and Anvil upstream; RPC deltas use actual task-024 usage rows, including retries and method weights. Indexed pages have their own explicit price/admission cap.
- `packages/chain/src/index.ts`: additive exports.
- `packages/chain/test/funding.test.ts`: 15 fixture tests for capability insufficiency, pagination gap/resume/cycles/bounds/order/conflicts, concurrent and restart cache reuse, source/hash invalidation, first-observed/first-ever, source/quote gaps, conservation, trace binding, wrapping and independent cost categories.

Follows Guard 2.0 §§2.3–2.4, 8.1–8.2 and §11, FACTS §5b, and the logs-first boundary in BACKEND §4.2a. Guard and FACTS supersede BACKEND §4.3's older `trace_filter` candidate and full-transactions funding assumptions: neither unavailable methods nor top-level-only history establish internal funding coverage. Read `T-GAP-ANALYSIS.md` for packet ownership; no graph qualification, scoring, consumer or activation changes. V2 remains shadow/inactive.

No dependencies, lockfile changes, migrations (0126 unused), personal identifiers, paid jobs, whole-chain scans, ports, deployments or commits were introduced.

## Verification and reproduction

| Exact command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/chain exec vitest run test/funding.test.ts` | 0 | 15 tests; `/tmp/eko-044-focused.log` |
| `pnpm --filter @eko/chain typecheck` | 0 | Intermediate candidate before the fixture correction; superseded by final workspace typecheck below; `/tmp/eko-044-chain-typecheck.log` |
| `pnpm typecheck` | 0 | All workspace packages; `/tmp/eko-044-typecheck.log` |
| `git diff --check` | 0 | No whitespace errors |
| `pnpm test` | 130 | Interrupted after the indexer suite produced no completion output for about four minutes; `/tmp/eko-044-test.log` |
| `pnpm --filter @eko/indexer exec vitest run --maxWorkers=1` | 130 | Bounded isolated runner attempt also produced no test completion output; `/tmp/eko-044-indexer-serial.log` |

The first focused run failed one fixture: a token log was attached to the wrong emitting call, and task-043's binder rejected it. The fixture now emits the log from the token call subtree. No assertion was weakened. Final focused checks and workspace typecheck use the candidate hash above.

The required full gate is **not green/verified**. In `pnpm test`, brand/staging self-checks and address checks passed; shared, web, policy, Signal, untrusted, playbooks, db, chain (159 tests) and engines (163 tests) completed successfully. Indexer emitted its Vitest startup line but no completion result during the bounded wait; downstream server/MCP tests and role-image builds were not reached. Isolating indexer with one worker also did not complete. Both processes were explicitly interrupted, exit 130; no test failure or application root cause is inferred from missing output. No tests, assertions or timeouts were changed. Diagnosis stopped after these two runner configurations; the prior 043 report records an indexer runner blocker too, but that does not establish today's cause.

All verification processes have ended. Next concrete reproduction in a functioning test environment: `pnpm --filter @eko/indexer exec vitest run test/phase-b.test.ts test/backfill-limits.test.ts --maxWorkers=1 --reporter=verbose` to obtain per-test progress, then complete `pnpm test`. Those two existing PGlite files are a starting point from 043's reported blocker, not identified failures in this run. Do not count the interrupted gate as a pass.

## Acquisition, pricing and checkpoint

**Live indexed provider capability: unavailable/unverified.** No indexed source, endpoint coverage, subscription price, provider request weighting or approved paid acquisition was measured in this networkless sandbox. `unavailableFundingCapability` publishes explicit native/quote gaps; the acquisition makes no page requests when no streams are available. There is no live funding completion claim.

All transport validation is synthetic. Two distinct fake block acquisitions pass through the existing RPC meter, totaling **8 fake request units** at fixture unit weights: **6 confirmations** (full block, receipts, canonical recheck for each block) and **2 block traces**. Reusing the same acquired block adds zero requests. Nominal $6/million pricing would estimate **$0.000048** for those eight units; **actual live requests, paid units and charged cost are all zero**. API paging uses in-memory provider fixtures, not indexed-provider requests. Separate meter tests exercise explicit page pricing/cap rejection, weighted trace retry rows and Anvil upstream rows; these are fixture ledger arithmetic, not measured vendor charges.

The fixture diagnostic plan merges overlapping/adjacent ranges, selects ten unique blocks under a supplied **$0.00024 fixture cap**, and estimates **40 units / $0.00024**, retaining the uncovered intervals and next block. Another fixture tests weighted traces and checkpoint clipping. Neither fixture approval is an owner approval. With approval/pricing absent, the prepared planner selects **zero** blocks and publishes `approval_or_rpc_price_unverified`. For illustration only, four nominal unit-weight RPC requests per block under a $1 remaining cap permit at most 41,666 blocks / 166,664 units / $0.999984 before all other costs; this is partial diagnostic coverage, not a sufficient live funding source or a paid-run authorization. API pages, compute/storage and other enrichment must reduce that remaining cap separately.

Coverage is confined to fixtures. The native fixture includes successful top-level/internal flows and reverted/delegated counterexamples; the quote fixture includes reconciled token logs and suppressed wrap legs. No first-ever history, live funding-only discovery or production complete interval was established.

Source checkpoint is the hash file above. Acquisition checkpoints include scope key, per-stream sequence/next/seen cursors, accepted flows, unresolved gaps and page hashes; the default cache is process-local and caller-persistable through `FundingCache`. There is no live acquisition process or live coverage checkpoint. Check logs are task-specific paths listed above.

## Remaining gaps and next action

- `TODO(spec)` freezes the normalized provider wire envelope because Guard specifies behavior, not vendor API field names. No concrete indexed vendor adapter is certified or enabled. In an authorized environment, supply independently known successful funding-only/internal/quote, failed/reverted and wrap controls; acquire and verify bounds/pagination; record measured evidence and source revision through `testFundingCapability`. Verify each relevant quote asset separately. Do not promote the synthetic measured-mode branches in tests into production evidence.
- Indexed API price/subscription/chain-4663 coverage is unknown. Supply verified page pricing and recorded approval before using `FundingCostMeter.admitPage`. RPC pricing/weights and approvals must be recorded before a diagnostic run; pass remaining shared cap/checkpoint units to `planFundingDiagnostic`. The runner must use the shared task-043 acquisition and task-024 clients, record actual scoped/day-specific RPC usage deltas (including retries and Anvil upstream), persist checkpoints and stop at the cap. This packet prepares that plan; it installs no acquisition worker.
- Quote settlement and same-account wrapping require independently captured adapter reconciliation. Unsupported trace log binding or unresolved settlement remains a gap. Native block traces are diagnostic-only and cannot discover funding outside their selected union intervals. No swap-only, nonce, current-balance or top-level-only fallback proves wallet age or independent ownership.
- The supplied proved-creation boundary and `noEarlierFunding` evidence must be verified by the source adapter; a declaration alone is not measured proof. First-ever pagination remains optional and separately budgeted. Bounded intervals never imply first-ever or freshness.
- Durable cache integration and live evidence capture belong to the eventual authorized acquisition runner; no new table or migration is necessary for this prepared interface. Actual measured provider validation and promotion/release remain outstanding.

Prepared and fixture-tested work only; nothing committed, deployed, released or acquired live.
