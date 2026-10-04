# Task 058 · Acquisition preparation report

Prepared locally and left uncommitted for the lead. No acquisition run was started, no live RPC was contacted, and no resource approval was inferred. Guard V2 remains shadow/inactive. Fixture checks establish preparation behavior, not measured validation or release readiness.

## Changes and revisions

| File | Change |
| --- | --- |
| `apps/engines/src/acquisition-run.ts` | Closed, label-free cohort definition; source/availability and probability-design binding; exact calendar/purge manifests; transitive accepted/suspected group holdouts and conservative unresolved grouping; primary truth definition; bounded pilot/expansion manifest checks and remaining population/sample counts. |
| `apps/engines/src/acquisition-run-cli.ts` | Dry-run-only preparation command; candidate digests; exclusive directory lock; immutable atomic preparation/checkpoint/report files; optional starter manifests for the existing 048 runner; no acquisition dispatch. |
| `apps/engines/src/index.ts` | Exports preparation functions without activating a worker. |
| `apps/engines/test/acquisition-run-fixtures.ts` | Neutral synthetic calendar, availability, components and bounded pilot input. |
| `apps/engines/test/acquisition-run.test.ts` | Calendar, purge, transitive grouping, unresolved grouping, pending population, provenance, cap, expansion/follow-up and durable dry-run tests. |
| `docs/tasks/058-acquisition-definition.json` | Concrete prospective definition, fixed seed/query, explicit proposed $10 cap and 250,000-unit checkpoint; approval, verified pricing, population and acquisition manifest remain absent. |

Starting source commit: `413b670ee1a0a1b7219b153fefa525b3732dd740`; initial working tree clean. Candidate remains uncommitted. Preparation candidate digest: `0x291ac436cc6035f0e8859c22f7443085227f0fa7332b45ee6ff553c368d804f4`. Existing runner candidate digest: `e434df5830eef6299d6c99473e0bca53b52a50ea3c3cb1e849e7ea192d945d2e`. These digest actual source contents, including uncommitted code; report content is excluded.

Definition digest: `0x1158fcf1a8069c54a3ba75c31c7d8ea9ad8b3e2682337d5716075272bfb66c44`. Prepared manifest digest: `0xbd0609c7b9a8d113179942829c59fe10394619161ba3fd455004ed3f64a7d599`. Actual acquisition source revision/availability: **pending**, not invented. The definition's `origin: measured` specifies the intended eventual input category; the dry-run report explicitly records no measured validation.

Followed Guard 2.0 §§8.3 and 9.4, with §§2.1, 8.2, 9.1–9.3 and 11 for provenance, budgets, primary truth, sampling and resource boundaries. Read the 045/048/054/057 packets and their cited implementation, FACTS §§5b–7, backend §§3.1–3.2, 4.3 and 21.4, and marketing §04 claims rules. Guard's selective, capped acquisition supersedes the older backend's general genesis-backfill guidance for this packet; no full-chain run is configured. No public copy or active feature configuration changed.

No dependency, lockfile or database migration change; reserved migration 0181 unused. No personal identifiers were copied or introduced. Existing tests were not removed, weakened, skipped or given larger timeouts.

## Frozen definition and remaining gaps

D is **2026-10-04 00:00 UTC**, the next complete UTC day after preparation, chosen before labels. Every interval is half-open. The definition freezes the prospective dates and method; it does **not** claim nonexistent member lists or a completed sample.

| Scope | UTC interval |
| --- | --- |
| Launch cohort | October 4–18 |
| Development | October 4–11 |
| Nominal fitting | October 4–8 |
| Primary fitting after purge | October 4 00:00–October 7 22:55 |
| Nominal validation | October 8–11 |
| Primary validation after purge | October 8 00:00–October 10 22:55 |
| Locked test | October 11–18 |
| Observations/follow-up | October 4–25 |
| Funding warm-up | October 3–4 |
| Selective recycling context | September 27–October 4 |
| Optional history metadata | September 4–October 25, 51 days |

The primary purges are 3,900 seconds before validation/test. Accepted and suspected component links are transitively combined; the latest calendar split owns each crossing component and earlier examples are held out. Purged tokens still participate in component isolation. Unresolved groups are conservatively combined, and actual remaining fitting/validation/test counts are recorded, including zero. Probability weights retain the original frozen 057 draw rather than being silently renormalized after holdout/purge.

The primary truth definition pins 60-second entry, 3,600-second exit, separate $100/$1,000 EOA/contract cohorts, preservation of scheduled exit failure, provider censoring and required paper fidelity. Maximum candidate delay remains 300 seconds. Seven-day outcomes remain sensitivity-only; no seven-day fitting in the short unexpanded frame. History booster remains disabled; optional metadata does not establish a complete history study.

Population lists, eligibility evidence, component assignments and the completed probability draw await complete enumeration. The dry-run status is `definition_frozen_population_pending`, with null sample/group/count artifacts. Launch availability is awaiting observation; funding, recycling, history and comparator sources are unavailable. Filling those inputs requires a new preparation output, preserving this definition/checkpoint for comparison before labels. `labelsInspected: false` is an operator declaration and the closed schema excludes top-level review/outcome label fields; this tool cannot certify external human conduct.

The existing 048 runner remains the bounded acquisition primitive: seven-day first reconstruction pilot, caps before requests, durable reservation/artifact ledger, adaptive logs, explicit gaps and no blind duplicate dispatch after uncertain results. Preparation binds its source, dates, sample selections, exact creation times and budget. Expansion needs a pilot acceptance evidence reference, every drawn sample member and at least seven days of follow-up per member. Challenge entries remain separate from sample members. Acceptance references require lead evidence review; a hash is not an automatic certification.

`TODO(spec)` in `acquisition-run.ts`: §§8.3/9.4 specify behavior without a preparation wire contract. The smallest implementation is an engines-local, versioned label-free envelope with an explicit pending population, not a new shared API or human label store.

## Actual usage, coverage and checkpoint

Actual acquisition: **0 calls, 0 request units, $0 paid cost**. Reconstructed tokens: **0**. Completed acquisition ranges: **none**. No measured coverage, outcomes, accuracy, latency or maturity validation exists. Funding/history completeness and release gates remain false.

The prospective definition records an explicit **proposed $10 total cap**, maximum **250,000 nominal units** and nominal **6,000 nano-USD/unit** arithmetic. Weights are placeholders, pricing evidence and approval are null, fixed-cost estimate is zero pending verified compute/storage/subscription costs, and invoice cost is unknown. These are not provider quotes or approval. The owner's separate proposed $1/day enrichment resource decision and any indexed-source subscription still need recorded approval and verified method/page/retry/fork pricing. This packet installs no paid transport or recurring enrichment job.

Process: preparation completed; **no acquisition process or background job exists**. PID is null. Local preparation artifacts: `/tmp/eko-058-preparation-final/preparation.json`, `/tmp/eko-058-preparation-final/checkpoint.json`, `/tmp/eko-058-preparation-final/report.json`. Checkpoint status: `prepared`, zero calls/units/cost, empty completed ranges. Log: `/tmp/eko-058-preparation-final.log`. No backfill starter is generated for this prospective definition because its population/source are pending.

Next action: lead reviews this uncommitted preparation, verifies complete enumeration and source coverage, pins evidence-backed groups and the probability draw before labels, and obtains the owner's resource decision before paid work. Start only the initial bounded seven-day reconstruction under a reviewed source/budget. Preserve candidate, source, pricing, process/log, checkpoint and completed-range evidence; expand with verified pilot acceptance into the declared 14+7 observation frame. Independent labels, actual follow-up maturity, separate complete operator history and release evaluation remain external/later packet work. No observation-period wait was attempted.

## Reproduction and checks

Preparation only, from the repository root:

```sh
pnpm --filter @eko/engines exec node --import tsx src/acquisition-run-cli.ts --dry-run ../../docs/tasks/058-acquisition-definition.json /tmp/eko-058-preparation-final
```

This exited 0 and generated the digests/checkpoint above. Identical preparation resumes without replacing frozen artifacts; changed source/candidate/definition requires a new output. An existing `runner.lock` refuses duplicate ownership; inspect the process/checkpoint before removing a stale task lock. `--acquire` and other execution flags are rejected. For a source-pinned fixture backfill, preparation can emit `backfill-manifest.json` and `backfill-checkpoint.json`; the existing `selective-backfill-cli.ts --fixture` accepts its manifest with a matching 048 fixture tape and a separate output. No fixture acquisition command was launched for this packet. Unit tests exercise the runner in process under a zero cap and verify its transport is never called, including resume.

| Exact command | Exit code / evidence |
| --- | --- |
| `pnpm --filter @eko/engines exec vitest run test/acquisition-run.test.ts` | 0; 11/11 tests, `/tmp/eko-058-focused.log`. |
| `pnpm --filter @eko/engines typecheck` | 0 during implementation. |
| `pnpm typecheck` | 0; `/tmp/eko-058-typecheck-final.log`. |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0; all workspace suites, builds and role-image fixture checks passed, `/tmp/eko-058-test-final.log`. Engines: 361/361 tests; indexer: 152/152 tests. |
| `pnpm brand:check` | 0; 159 files including built artifacts, `/tmp/eko-058-brand-final.log`. |
| `pnpm check:addresses` | 0; 465 source files, `/tmp/eko-058-addresses-final.log`. |
| `git diff --check` | 0. |

The first focused iteration exposed test fixture budgets that changed only one of two intentionally bound copies, and TypeScript address/map key mismatches. Those were corrected. Source review also added incomplete/future watermark rejection. The final focused candidate passed; the workspace gate was repeated after that source change to tie its evidence to the final candidate. Logs replace machine-specific workspace/home prefixes with neutral placeholders.

The final full gate passed 3,135 TypeScript tests and 34 contract tests without timing failures or failing-file reruns. Its existing contract fork-test skip remains unchanged because the RPC URL is unset; this packet introduced no skip. Builds and role-image fixtures passed without ports, providers or deployment evidence.
