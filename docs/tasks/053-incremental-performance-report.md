# Task 053 implementation report

Prepared, uncommitted changes. Guard V2 remains shadow/inactive. No commit, deployment, acquisition, paid run, live RPC or listening port was started. No dependency or lockfile change was needed; reserved migration 0178 is unused. No personal identifiers were added or ported. Task logs replace plain and URL-encoded workspace paths with neutral labels.

Source revision: `7a2d5ecef9374b20005037277c2e443cbf2fcf08`. Final source/test candidate SHA-256: `3f5475f417d32a4f630dc1fa549b1214ec2e419232394e59c6d746d528efb50e`; relative paths and content hashes are in `/private/tmp/eko-053-candidate.json`. Hash construction: SHA-256 of compact, key-sorted JSON containing the base revision and sorted relative-path/content-SHA-256 records. This report is excluded.

The performance run used candidate `4671c5e80ad2f057227f241165f101b458e7d8fd9373ab1528a3b1e6c36798e1`, retained in `/private/tmp/eko-053-benchmark-candidate.json`. Afterward, only `grouped-coverage.ts` and its test changed to preserve touched/component diagnostics in restored checkpoints. The measured evaluator, cache, timer, reporting module, benchmark and preflight sources are unchanged. Timing evidence applies to those unchanged measured paths; the final grouped checkpoint implementation is verified by the final focused/full tests. The benchmark record was not relabeled as a run of the final whole-worktree candidate.

Follows Guard 2.0 §8.4, its C2 review §5, version/source binding in §7.2 and operational reporting in §9.4; BACKEND §1.4 latency targets and §3.2 ownership; FACTS §7 shared contracts. No spec files, active registry, trade path or existing durable campaign/outcome tables were changed.

## Changed files

- `apps/engines/src/grouped-coverage.ts`: persistent AVL holder/control ranking indexes replace population-sized array copies/splices. Ranking clones are constant-time; touched ranking updates are logarithmic. Unchanged components apply wallet balance deltas; changed/retired memberships still rebuild only affected component sums. Resident component/input/snapshot ownership has token, serialized-byte, holder and component limits, explicit eviction and reverse-dependency cleanup. Oversized states evaluate uncached. Source/candidate-bound, digest-checked checkpoints rebuild indexes and preserve exact snapshot diagnostics.
- `apps/engines/src/incremental-guard.ts`: immutable bounded shadow scoring cache, full captured-input/source/route/raw-size/account/dependency identity, reverse wallet dependencies, source/wallet invalidation and checked checkpoint restore. A byte/dependency miss evaluates uncached and preserves incompleteness. Indexed chain-time heap supports expiry, maturity, probe, acquisition, pressure, critical and lower jobs, stable same-time ordering, deduplication, capacity refusal, arbitrary removal, dependency invalidation and digest/scope-bound resume. Failed work remains pending until explicit acknowledgement after the host's durable commit.
- `apps/engines/src/shadow-v2.ts`: shadow journal evaluation uses that cache after existing captured-source loading. Acquisition, SQL and receipt persistence remain outside the evaluator.
- `apps/engines/src/guard-performance.ts`: completion-aware reports by stage, venue and age, named missing/failed/pending counts, response versus completion latency, unchanged budgets and optional matched-baseline regression. Empty populations stay null; no pilot target is invented and reports never activate Guard.
- `apps/engines/src/index.ts`, `guard-code-files.json`: exports and candidate code-hash coverage.
- `apps/engines/test/incremental-guard.test.ts`, `grouped-coverage.test.ts`: corruption/scope/budget checks, input/result isolation, reorg/source/context identity, multi-token wallet invalidation, heap deletion/order/resume, exact BigInt deadlines, missing-completion reporting and independently sorted holder-ranking checks through transfers and checkpoint restore. Existing assertions/timeouts remain unchanged.
- `apps/engines/test/incremental-performance-benchmark.ts`: fixed synthetic source, resumable progress/checkpoints, 200,000 full arithmetic evaluations, cache hot-token stress, separate queue scheduler and local campaign measurements, immutable source verification and reuse of a completed run.

## Measurements and boundaries

**These are offline fixture measurements, not the original measured 200k pilot.** The 045 handoff says that stopped database and immutable availability/coverage manifest were not included; none was supplied here. This run repeats eight captured synthetic scoring inputs in a declared schedule for 200,000 evaluations. It is not 200,000 measured blocks or distinct observed states. Frozen fixture source SHA-256: `cf6e00924fef2ae35c989870a98973442a165abb95ae67a3ef2c88c46065a672`.

Node v26.0.0; one run:

| Metric | Observed |
|---|---:|
| Full captured-input arithmetic throughput | **274.323 evaluations/s**, reference target ≥170/s |
| Arithmetic p95 | 6.166 ms |
| Wall time including bookkeeping | 731.752 seconds |
| First / last 10% arithmetic throughput | 331.492 / 270.344 per second |
| Within-run segment decline | **18.446%**; cause unestablished |
| Matched prior-candidate regression | Unavailable; no same-source prior expanded run |
| Cache-hit p95, 1,000 requests | 0.912 ms |
| Hot-token retained cache after 1,000 changing contexts | 8 entries, 344,096 serialized bytes, 8 reverse wallets |
| Sampled peak RSS | 455,131,136 bytes (about 434 MiB); not a process-memory ceiling |
| Local campaign worker p95, 100 fixtures | 2.513 ms; pressure, buyer valuation and interventions; attribution remains unavailable |
| Actual-order cached policy p95, 5,000 fixtures | 0.210 ms, target <150 ms |
| Cached server preflight p95, 100 fixtures | 4.718 ms, target <150 ms; includes SQL/crypto/commit |

A separate verification read the durable checkpoint at evaluation 125,000, verified its prefix digest against captured-input decisions, restored the cache, and compared resumed versus uninterrupted final decision sequences. Both produce `fce9b7b09574629216a05368763eac5e2fa87d35539992db6f106db8dcc494e8`; the completed run agrees.

Each queue scheduler exercised 1,000 jobs independently:

| Queue | Enqueue total ms | Restore total ms | Scheduler drain total ms |
|---|---:|---:|---:|
| Acquisition | 3.368 | 21.725 | 3.005 |
| Probe | 2.623 | 17.400 | 2.094 |
| Pressure | 2.628 | 20.468 | 2.405 |
| Critical | 2.077 | 16.885 | 2.212 |
| Lower | 2.088 | 17.516 | 1.932 |
| Expiry | 2.825 | 19.760 | 2.220 |
| Maturity | 2.248 | 22.258 | 2.345 |

Scheduler acknowledgement is synthetic and is **not worker completion**. Acquisition/probe and end-to-end pressure/critical/lower completion p95 remain null. The separate local campaign timing excludes DB queue waits, collectors and forks. Cached critical/lower completeness samples are declared Pons fixtures at ages 0/300/3,600/86,400 seconds, seven complete and one missing in each tier. Their completion p95 spans 3.424–4.146 ms; these are cached calculation samples, not acquired coverage or required-check worker latency. Other venue completion coverage is unmeasured.

Head p95 ≤1 second and complete Fast Scan p95 ≤5 seconds remain unmeasured, not passed. Preflight figures above exclude quote acquisition/fork waits and do not establish the separate quote budget. The pilot-frozen operating target is unavailable. The original-source ≥170/s gate, large-holder empirical gate, operational age/venue coverage and production schedule therefore remain open.

Actual upstream requests **0**, request units **0**, charged upstream cost **$0**, measured fork executions **0**. Provider pricing, compute/storage billing and invoices were not measured. Anvil/upstream fork latency is unavailable; cached speed supplies no estimate of that cost. Metering messages from inherited tests are fixture traffic.

## Verification and reproduction

Commands below run from repository root; logs are under `/private/tmp/` and sanitize workspace paths.

| Exact command | Exit | Evidence |
|---|---:|---|
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/engines test test/incremental-guard.test.ts test/grouped-coverage.test.ts test/guard-shadow.test.ts` | 0 | Final candidate: 26 tests; `eko-053-focused-final.log` |
| `pnpm --filter @eko/engines typecheck` | 0 | Before final grouped checkpoint fix; final workspace check below supersedes it |
| `pnpm --filter @eko/engines exec node --import tsx test/incremental-performance-benchmark.ts /private/tmp/eko-053-fixture 4671c5e80ad2f057227f241165f101b458e7d8fd9373ab1528a3b1e6c36798e1` | 0 | `eko-053-benchmark.log`; frozen fixture only, completed run reused on repeat |
| `pnpm --filter @eko/engines exec node --import tsx /private/tmp/eko-053-verify-resume.mjs` | 0 | `eko-053-resume.log`; script and manifests retained alongside logs |
| `pnpm --filter @eko/server exec node --import tsx test/actual-order-benchmark.ts` | 0 | `eko-053-actual-order-p95.log` |
| `pnpm --filter @eko/server exec node --import tsx test/preflight-benchmark.ts` | 0 | `eko-053-preflight-p95.log` |
| `pnpm typecheck` | 0 | Final candidate; `eko-053-typecheck.log` |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | Final candidate; `eko-053-test.log`; all suites/builds/role checks passed |
| `pnpm brand:check` | 0 | Post-build: 206 files; `eko-053-brand.log` |
| `pnpm check:addresses` | 0 | 520 source files; `eko-053-addresses.log` |
| `git diff --check` | 0 | Final whitespace check |

Full-suite evidence includes engines 399, indexer 153, chain 351, server 452 and MCP 57 passing tests. The inherited contract fork test retains its original unset-RPC skip condition; no new skip was introduced and no fork evidence is claimed. No timing file failed in the final full run, so no isolated timing rerun was needed. Initial focused fixture failures involved inconsistent fork/chain pins and attempted mutation of frozen checkpoint data; fixtures were corrected without weakening assertions.

## Remaining integration and next action

1. The new `TODO(spec)` in `incremental-guard.ts` records the unspecified internal queue/checkpoint wire. The host must persist immutable input artifacts and checkpoints, enforce one checkpoint owner, perform canonical/source checks, and acknowledge after durable result commit. These interfaces do not install acquisition workers or auto-schedule probes/expirations. Existing DB-backed campaign/outcome workers retain their ownership and canonical checks.
2. Grouped input validation, balance/coverage enumeration, snapshot output and map reconstruction still scale with the supplied population. AVL rankings avoid full ranking copies/sorts and component sums use touched deltas; this is not a claim that all normalization is constant-time. Caps bound resident serialized state and structural indexes, not transient caller input or total process RSS. Evicted/oversized token discovery and reverse dependencies must come from the host's durable normalized shards; in-memory reverse lookup covers resident entries only.
3. Supply/FIFO/cycling/campaign reconstruction semantics remain with their existing owners. This packet does not broaden those adapters, accept deployed profiles or infer observations from source gaps. Selected real-buyer attribution remains queued work outside cached scoring.
4. Supply the stopped original 200k database and 045 manifest, verified normalized Guard observations, and the pilot-frozen operating target. Use 045's existing **local-only** snapshot verification/replay driver and the exported cache/queue/report interfaces to instrument those same captured cuts. The synthetic benchmark is not a measured-source adapter; original-source acquisition/probe/required-check completion instrumentation and empirical large-holder validation remain necessary before accepting the operational gate. Do not substitute these fixture numbers or promote missing scans to success.

Process/checkpoint: benchmark PID 59253 ended with exit 0; `/private/tmp/eko-053-fixture/{source.json,checkpoint.json,report.json}` retain frozen source, completed progress and all measurements. Validation checkpoint: `/private/tmp/eko-053-validation-checkpoint.json`; final candidate manifest and sanitized logs are named above. All task processes ended. Next action is lead review/commit of the uncommitted diff, then supply and validate the original measured-source artifacts locally. Prepared fixture validation is not released Guard behavior.
