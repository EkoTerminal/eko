# Task 063 · Cutover and rollback preparation report

**Prepared, inactive, unreleased; no candidate is accepted.** Cutover is unreachable
without an exact accepted release manifest in an independently verified inventory,
separate generation-bound authorization and every consumer acknowledgement.
The checked-in preparation has a null accepted candidate/manifest, an empty
inventory and inactive generation 0. All 16 primary venue/size/account slices
remain incomplete; released factors/checks/profiles are empty. Lower, history and
buckets remain disabled; Signal stays V1. No deployment, activation, migration,
commit, push, acquisition or continuing runner occurred.

Source revision: `5d5cf28306217bcd85f83ddbda33541371b630c2` (initial tree clean).
Candidate: uncommitted worktree, SHA-256 fingerprint
`820917a048cdaa3aa02812052955c72b84d4bf974a3e4ed34f5bf290975af046`.
The fingerprint hashes compact sorted-key JSON of the sorted changed paths and
each file's SHA-256, excluding this report. It identifies implementation and
preparation bytes, not an accepted scoring candidate.

## Changed files and specification

| File | Change |
| --- | --- |
| `apps/engines/src/guard-cutover.ts` | Strict Guard/Signal manifests, gate/coverage/compatibility admission, externally verified acceptance/revocation/authorization inventory, one generation-bound switch snapshot, all-consumer schema/cache/policy acknowledgements, previous-released-V2 or critical-incomplete rollback, original stored-revision selection, complete cache key and append-only policy settings preparation. No I/O or live registration. |
| `apps/engines/src/index.ts` | Exports pure preparation helpers; starts no work. |
| `apps/engines/test/guard-cutover.test.ts` | Eleven neutral synthetic tests for inactive default, missing/changed/revoked/unaccepted manifests, authorizations, stale/mixed consumers, gates/maturity, narrow coverage, stored-revision pins, rollback, separate Signal admission, cache isolation, null/Safe/High policy, old final replays and original V1/V2 proof bytes. |
| `docs/operations/guard-cutover/063-prepared.json` | Explicit blocked checkpoint with no accepted manifest, zero measured evidence and all class/venue coverage incomplete. |
| `docs/operations/guard-cutover/README.md` | Concrete acceptance, negotiation, fenced atomic publication and rollback contract; explicit remaining integration gates and local reproduction. |
| `docs/tasks/063-cutover-report.md` | This handoff. |

Followed packet 063 and Guard 2.0 §§7.1–7.3 and 9.4; read cited packets 037,
038, 052, 061 and 062 and existing adapters, actual-order policy, stored revisions,
receipt contracts and release process. Also followed FACTS §§6–7, Backend §§9.6–9.7,
12.2, 13 and 21.4, and Marketing §04 claims/non-affiliation rules. Guard §7.2 governs
V2 rollback: previous released V2 or critical-incomplete, never legacy serial or
exemption attribution. Original V1 reads/proofs and replay semantics remain intact.
No spec files, existing tests/assertions/timeouts, active consumer/order paths,
fee/custody paths, dependencies or lockfile were changed. Reserved migration 0186
was unnecessary. No personal identifiers were added or ported.

## Checks

All focused checks use synthetic fixtures, in-memory captured inputs and original
checked-in proof vectors. They establish engineering behavior, not measured
accuracy, elapsed shadow work, live consumer propagation or production rollback.

| Exact command | Exit / evidence |
| --- | --- |
| `pnpm --filter @eko/engines exec vitest run test/guard-cutover.test.ts test/live-shadow.test.ts` | 0; 22/22 tests; `/tmp/eko-063-focused-engines.log`. |
| `pnpm --filter @eko/shared exec vitest run test/guard-receipts.test.ts test/guard-consumers.test.ts` | 0; 19/19 tests; `/tmp/eko-063-focused-shared.log`. |
| `pnpm --filter @eko/policy exec vitest run test/guard.test.ts test/actual-order.test.ts` | 0; 217/217 tests; `/tmp/eko-063-focused-policy.log`. |
| `pnpm typecheck` | 0; all workspace packages; `/tmp/eko-063-typecheck.log`. |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0; all workspace suites, web/server builds and role-image checks; engines 505/505, server 456/456; `/tmp/eko-063-test.log`. |
| `pnpm brand:check` | 0; `/tmp/eko-063-brand.log`. |
| `pnpm check:addresses` | 0; `/tmp/eko-063-addresses.log`. |
| `git diff --check` | 0. |

An initial new-test parse error exited 1 and the initial focused engines typecheck
exited 2 for fixture union typing. Both were corrected; the failing test file
passed alone (11/11), then the final focused checks and workspace typecheck passed.
No assertions or timeouts were relaxed.
The full gate passed without a failing-file rerun. Its pre-existing contract fork
fixture is skipped when `RPC_HTTP_URL` is unset; this packet added or weakened no
skip. Startup-refused role fixtures intentionally exit 1 inside the passing
role-image matrix; these are expected refusal checks, not gate failures.

## Remaining gates, reproduction and accounting

No class/venue can ship from the current evidence. Guard 061 remains unaccepted
and 062 remains disabled with zero measured duration/launches. Measured method,
frozen candidate, untouched-test, per-factor/profile/check, real restriction,
coverage, operational pilot/budget and seven-day/5,000-launch/final-follow-up
acceptance are outstanding. A narrower accepted release must explicitly disable
Lower and every unaccepted heuristic and name unsupported slices/gaps.

`TODO(spec)` in `guard-cutover.ts`: the spec does not prescribe the cutover wire
format or durable atomic publisher. This packet prepares strict pure transitions
and an externally authorized publication contract. It installs no durable publisher,
consumer fencing/distribution, API/WS/MCP release loader, bot service or live consumer
acknowledgement collector. Those must be integrated and reviewed through the actual
release process before publication; the runbook records a paused-admission,
single compare-and-set boundary and post-publication verification. Placeholder
consumer services and fixture acknowledgements cannot satisfy live readiness.
The preparation helper verifies trusted admission, not measured truth of unseen
gate artifacts. Acceptance inventory/provenance must be independently verified;
incoming requests, demo flags and fixture JSON cannot supply it.

Reproduce with the focused commands above. The engines test loads the checked-in
inactive checkpoint, rejects null/fixture/unadmitted manifests and exercises
cutover/rollback using explicitly synthetic trusted-process doubles. The existing
shared/policy tests cover read/proof/consumer and actual-order regressions. Then
run the four required final commands. No ports or network are required.

Acquisition/run accounting: **0 actual requests, 0 request units, $0 paid cost**.
Pricing/subscription evidence is not applicable; there was no paid acquisition.
Actual chain/provider coverage, live latency, measured duration and measured
launches are zero/unavailable. Supported coverage in test manifests is synthetic.
Build/test time does not count toward live shadow.

Checkpoint: `/tmp/eko-063-checkpoint.json`; final full-gate process session `10861`
completed with exit 0, log `/tmp/eko-063-test.log`. No task process remains running.
Next action is lead review/integration of the uncommitted preparation. Release
requires measured acceptance, reviewed publisher/consumer integration and separate
explicit authorization. Logs are redacted to neutral workspace/home placeholders.
