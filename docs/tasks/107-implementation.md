# Packet 107 implementation handoff

Prepared with local fixtures. No commit, push, deployment, publication, live chain access,
external messages or paid job. Actual external cost: $0; live RPC request units: 0.
The lead commits this worktree. No personal identifiers or secrets were added or needed
replacement. No dependency declarations, lockfile, read-only spec, Guard design or
prototype changed. Reserved engines migration **0135** is used; server **0016** is unused.

Candidate: `add2dd5502fedfb54ee31141ff0d4ce3c6200776` plus the uncommitted packet changes.
Source fingerprint (SHA-256 over sorted changed paths and bytes, excluding this handoff):
`d75ccb57c6cac3bcda08234997f39e337d0dff416cce19688e7fdff8441f61fa`.
Check results below refer to this candidate and local fixtures.

## Changes and contracts

- `packages/db/drizzle/0135_scan_jobs.sql`, `packages/db/src/{scan-jobs,scan-schema,index,engines-migrate}.ts`:
  persisted scan IDs, unique target deduplication, bounded admission, fenced leases,
  bounded retries, and discovery/worker-start/first-verdict/critical-completion timestamps.
  Discovery includes Pons launch acquisition and verified nonzero pool currencies;
  existing historical rows are not backfilled into live timing samples.
- `packages/db/test/merge-migrations.test.ts`: the migration union now includes 0135,
  checks both new tables and triggers, and retains upgrade/idempotence/history assertions.
- `apps/server/src/read/scan.ts`, `apps/server/src/http/v1/reads.ts`,
  `apps/server/src/obs/metrics.ts`: `POST /v1/scan {query}`, existing indexed GET scan,
  persisted `GET /v1/scan/:id`, stable share URLs and a shared 30/min session-or-IP
  route budget. HTTP request-to-response timing is separate from completion timing.
  All identity remains Untrusted. API writes are confined to scan jobs and existing
  read projections; it performs no chain acquisition or chain-table writes.
- `apps/indexer/src/{scan-jobs,cli,index}.ts`: durable acquisition uses the existing
  metered enrichment client and token metadata acquisition. Only a definitive empty
  code result becomes not_found. Missing identity, deployer, route or simulation
  evidence stays pending. No deployer or creation provenance is fabricated.
- `apps/engines/src/{worker,cli}.ts`: jobs reuse engine source preparation, the
  configured reference-simulation callback, pure rules, shadow recording and receipt
  publication, canonical-block validation and current history/outcome refresh.
  Older verdict blocks cannot satisfy newer discovery timing. Live timing is acknowledged after commit and resumed after a crash.
  Replay does not emit live completion measurements. The existing monitoring emitter
  receives `pair_to_complete_verdict_ms` only with complete required checks.
- `apps/server/test/{scan-jobs,scan-latency,v1-reads}.test.ts`: concurrency, alias
  deduplication, restart/expired-lease recovery, stale-worker fencing, queue capacity,
  rate limits, malicious identity, missing simulation and later indexed readiness.
  The old unknown-address not_found expectation becomes pending as BACKEND §15.2 requires.
- `scripts/scan-latency.mjs`, `scripts/scan-latency-export.sql`: offline complete-cohort
  latency evaluation and a parameterized read-only staging export for task 087.
  Missing completions remain in the denominator. Fixtures cannot pass the staging
  gate, and fast first results cannot substitute for critical completion.

Followed BACKEND §§1.4, 6.5, 15.1–15.2, 23 CA-5 and CA-34; FACTS §7 scan contract;
FRONTEND §3.1; Guard 2.0 §§8.4 and 9 operational completeness requirements.

`ScanResult.status = ready` means a persisted CoinCard exists. A ready card may
still carry a pending verdict and missing checks, following CA-34; this does **not**
qualify as a complete scan for the latency gate. Confirmed findings on incomplete
cards also do not qualify. Required metadata and all 13 evaluated playbooks must
be present before a complete timing is recorded. Optional flow data is not used
to manufacture completion.

## TODO(spec), dependencies and remaining evidence

One new TODO(spec), in `packages/db/src/scan-jobs.ts`: unspecified queue admission,
lease and retry defaults use **256 active targets, 30-second leases, three attempts
per lane**. Retry exhaustion retains a pending waiting record. The former deferred
Fast Scan queue TODO in `apps/server/src/read/scan.ts` is removed.

- Actual staging p95 <=5s evidence is **not measured or accepted**. Task 087 owns
  collection against the deployed candidate, acquisition/config/dataset provenance,
  eligible venue/coin cohort and collection window, including incomplete counts.
  Timing exports track first discovery per token, including both nonzero pool
  currencies; collector eligibility must name reference-asset exclusions. Do not
  relabel historic backfill, replay or fixtures as new live launches.
- Tasks 035/040/065/066/068/079 supply indexed/card/reference/receipt truth; task 053
  retains ownership of Guard throughput and its incremental acquisition/probe queues.
  This queue schedules on-demand targets and does not replace Guard throughput work.
- Unknown contracts acquire identity only until the existing indexer establishes
  launch/deployer/venue evidence. Waiting results retain their share URL and become
  ready when normal indexed evaluation produces a card. Missing reference simulation
  and control/depth/supply checks remain unavailable; no fork runner or collector
  is enabled by this packet. The production normalizer must configure the existing
  acquisition callback and supply accepted observations before a complete gate
  can become green.
- Apply engines migration 0135 before serving scans. The live indexer and engines
  startup paths use the existing engines migration ledger. API and worker collectors
  need the existing monitoring server migration before emitting launch measurements.
- HTTP response timing here measures server elapsed time. Task 087's staging client
  must collect network/client elapsed time separately; it cannot satisfy completion.
- A restart can delay a post-commit timing acknowledgement. Treat recovered times as
  conservative completion upper bounds, not precise transaction commit timestamps.

## Reproduction

Run the focused checks and required gates listed below from the worktree. No live
chain, database deployment or paid acquisition is needed for these fixture checks.

For authorized staging collection under 087, execute the parameterized read-only
`scripts/scan-latency-export.sql` with the pinned deployment SHA and discovery window,
retaining all eligible incomplete rows and separate collection provenance. Then:

```sh
node scripts/scan-latency.mjs /tmp/scan-cohort.json <candidate-sha> /tmp/scan-latency-report.json
```

The command exits 1 for fixtures, missing checks, invalid evidence or p95 >5s. Its
report remains `approval: unaccepted`; a numeric pass is not release approval.

## Verification checkpoint

Final code checks already complete:

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/server test test/scan-jobs.test.ts test/scan-latency.test.ts` | 0 | 10 tests; `/tmp/eko-107-focused-verified.log` |
| `VITEST_MAX_WORKERS=1 pnpm --filter @eko/engines test test/cli.test.ts` | 0 | 2 shutdown tests; `/tmp/eko-107-cli-isolated.log` |
| `pnpm typecheck` | 0 | `/tmp/eko-107-typecheck-verified.log` |
| `pnpm brand:check` | 0 | `/tmp/eko-107-brand.log` |
| `pnpm check:addresses` | 0 | `/tmp/eko-107-addresses.log` |
| `pnpm_config_workspace_concurrency=1 VITEST_MAX_WORKERS=1 pnpm test` | 0 | 2598 Vitest tests, 33 contract tests and role-image checks; `/tmp/eko-107-test-stable.log` |
| `git diff --check` | 0 | No whitespace errors |

Earlier focused integration checks also passed: server scan/read/untrusted tests
(16 tests), engines/activity tests (64 tests), and migration upgrade/idempotence tests
(3 tests). Their logs are `/tmp/eko-107-focused-final.log`,
`/tmp/eko-107-engine-tests.log`, and `/tmp/eko-107-migrations.log` respectively.

Retained failed attempts: the first parallel `pnpm test` exited 1 on the existing
policy p95 assertion (45.1 ms versus 30 ms); its isolated reproduction passed.
`npm_config_workspace_concurrency=1 pnpm test` exited 1 on the migration union
expectation, which was updated for 0135 and strengthened with table/trigger checks.
That environment prefix did not limit pnpm 11 concurrency. A subsequent
`pnpm_config_workspace_concurrency=1 pnpm test` passed on the preceding candidate.
After the final canonical/history/stale-verdict fixes, the same command exited 1
on the existing replay CLI's 20-second timeout while Vitest files ran concurrently;
both isolated signal cases passed without code or assertion changes. The final
full gate limits both workspace and Vitest file concurrency and includes all suites.
No check was deleted, skipped, weakened or presented as live acceptance evidence.

All local gate processes have completed. Checkpoint: `/tmp/eko-107-checkpoint.json`.
The full gate contains the existing intentional contract fork skip because
`RPC_HTTP_URL` is unset (33 passed, 1 skipped); no live fork result is claimed.
The web and server bundles were built and offline role dispatch/shutdown/refusal
fixtures passed. Actual cost $0 and live request units 0; all coverage is local
fixture coverage. Next external action belongs to the lead/task 087: commit and
collect an authorized candidate-linked staging cohort. No staging process,
acquisition cursor, funded fork, deployment or paid job exists to resume.
