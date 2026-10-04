# Guard calendar-month maintenance · 064

Prepared, disabled, unreleased. No accepted release exists. The checked-in
`064-prepared.json` has no manifest, population, sources, independent labels or
trusted admission. It performs zero acquisitions, RPC calls or paid runs. There
is no continuing process or installed scheduler. Fixture acceptance inventories
are test doubles; they cannot admit an actual release.

This bounded engines application job reuses the probability sampler (057),
independent label importer (059), frozen locked evaluator and its clustered
precision/coverage gates (061), release admission schema (063), and existing
atomic application checkpoint writer. It adds no OS service, dependency,
migration, port, model call or active score/policy writer. The local CLI accepts
`--fixture` only. Measured execution remains unavailable pending accepted release
and the existing independent evidence/release workflow.

## Calendar and next application job

Enrollment uses `[monthStart,nextMonthStart)` at UTC midnight. February, leap
years and December follow the calendar; never schedule a rolling 30-day month.
Run after month end plus the frozen entry delay, longest required outcome horizon
and confirmation delay, then wait for receipt-backed follow-up for every selected
coin/control. A tick cannot exceed the captured availability cut. Reorg/source
corrections require a new versioned artifact, not rewritten follow-up.

The prepared October 2026 example requires 60-second entry delay, 1-hour, 24-hour
and 7-day horizons and a **synthetic** 30-second confirmation setting. Its earliest
evaluation is **2026-11-08 00:01:30 UTC**. The following November job is eligible
**2026-12-08 00:01:30 UTC**. These are calculated application-job due times,
not installed schedules or promised completeness. Confirmation and required
horizons must be pinned to accepted operating evidence before measured use.
Choose the first eligible complete calendar month after accepted release; record
which month is next in the application's job inventory. Existing application
operations should dispatch one bounded invocation when due and resume its
checkpoint as data/labels arrive. Do not modify host cron, launch agents or global
configuration. Do not mount this job on the live worker while acceptance is absent.

## Monthly evidence and frozen evaluation

1. Verify the exact accepted **released**, non-revoked manifest hash, acceptance
   hash and candidate revision in the trusted release inventory, using the 063
   release process. Source JSON and booleans supplied by a request do not provide
   trust. Retain the original released manifest and gate artifacts.
2. Freeze complete month enumeration, source revision, availability cut, query,
   seed and evidence-only eligibility before review. The starting CALIBRATE
   sample is 200 coins, allocated 35/25/25/35/80 across 057's disjoint priority
   strata. Reuse its unbiased deterministic draw and capacity redistribution;
   smaller populations use a census. Record exact inclusion probabilities.
   Insufficient intervals or regime changes require a separately preregistered
   expanded design; this packet has no automatic expansion or optimizer.
3. Keep incident and negative controls outside probability-rate denominators.
   Pin their receipt references and independent review artifacts. Review new
   hooks/services, aged wallets, staggered buys, dispersal, delayed collectors and
   slow campaigns. The report lists meta-case challenge counts, so omitted cases
   remain visible. A missing verified incident manifest is pending, never a
   fabricated positive. Challenge artifacts have no population precision credit.
4. Append captured follow-up and coverage failures in monotone ticks. Missing
   follow-up blocks gate inspection; unresolved independent labels remain
   pending. Challenge review status is explicitly fixture input, with an artifact
   reference; it is not a generated human label. Sources retain their revision,
   captured/unavailable state, artifact hash and named check gaps.
5. Supply later data through the existing 061 frozen-input contract. Its entire
   acquisition population must belong to the monthly draw with matching launch
   times, within the month, with captured cut no later than the tick. Code,
   semantic versions, registry/profile and frozen parameter/acceptance hashes
   must match the released manifest. The released factor set must match frozen
   enabled factors. Run without fitting or changing thresholds. Preserve all
   061 precision, recall, Lower-harm, fidelity, attribution, restriction,
   classifier, factor and operational gates, plus censoring and pending labels.
6. The report retains the earlier accepted gate references and later metrics,
   audits, sources, coverage and pending labels. The 063 manifest contains no
   baseline numeric metrics, so numeric drift deltas need the separately retained
   original report; they cannot be inferred from a gate hash. The report compares
   the same frozen candidate on later data and does not invent those deltas.

The current 061 runner accepts a fixed 14-day acquisition/split envelope, not a
full-month measured evaluation cohort. Its later subset can be rehearsed inside
the monthly probability draw, with remaining monthly labels/checks explicitly
pending and zero measured credit. The monthly sample never disguises that subset
as complete 200-coin validation. Full-month measured gate execution and expansion
need an independently reviewed evidence adapter through the existing application
job/release process. This packet does not widen 061 acceptance or claim that its
fixture reports satisfy measured gates.

## Suspension and version discipline

Coverage failures prepare `suspend_coverage` actions with the check, slice,
reason and original receipt/artifact hashes. An unavailable source's declared gaps
also produce these actions. Numerical gate failures conservatively prepare
`return_factor_to_shadow` for the released heuristic factors and
`disable_lower_pending_review`, referencing the content-addressed unanchored
evaluation report and exact failing gate names. A report hash is an artifact
reference, not a fabricated on-chain receipt/proof. No suspension is published by
this CLI, and no failed heuristic is replaced with a lowest-risk score.

Apply the prepared restriction through the separately authorized 063 release
publisher after verifying underlying receipt evidence. Preserve confirmed facts,
name corresponding tier gaps and deny unresolved buy-critical checks. Never
mutate earlier receipts, configs or reports. Active suspension/publisher wiring
is deliberately absent while the release publisher itself remains prepared.

Every semantic change records field, before/after content hashes, reason,
receipt references and development/validation/new held-out evidence hashes.
These references can remain pending; they grant no acceptance. Bump the applicable
rules, identity, measurement or outcome version and config/method/source hash.
A changed definition cannot resume an old checkpoint. A definition carrying
semantic changes cannot rerun maintenance gates as if it were the old candidate;
use new development, validation and untouched held-out workflow (060/061), then
independent release acceptance. Keep all prior artifacts. No online promotion.

## Offline rehearsal and checkpoint recovery

```sh
pnpm --filter @eko/engines exec node --import tsx src/monthly-evaluation-cli.ts --fixture ../../docs/operations/guard-monthly/064-prepared.json /tmp/eko-064-prepared
pnpm --filter @eko/engines exec vitest run test/monthly-evaluation.test.ts test/sampling-and-incidents.test.ts test/locked-test.test.ts test/guard-cutover.test.ts
```

The first command only checkpoints the disabled example. Tests generate neutral
synthetic source/release/label doubles; no measured precision or coverage is claimed.

Each output directory belongs to one immutable month definition and implementation
revision. It retains content-addressed input/report/checkpoint generations and a
`checkpoint.json` head pointing at the latest fully durable generation. Old
checkpoints link to their predecessor. Identical resume verifies artifacts without
reevaluation. Progress may only append ticks before the first frozen inspection;
a completed/failed inspection cannot be retried with new parameters or labels.

Partial writes before head publication resume only when their content matches the
same invocation. Changed/missing artifacts, non-prefix ticks, source/config/code
changes or an inspected cohort refuse resume. A stale `runner.lock` after abrupt
process termination requires process inspection; remove only that task's lock
after proving its process ended, then rerun the same input. Unknown temporary or
partial generations require evidence inspection before recovery; never overwrite
or delete the artifact history. Do not launch a duplicate runner.

Current checkpoint is the disabled preparation JSON. Next action is lead review
and integration of uncommitted work, followed by accepted measured release,
reviewed monthly evidence integration and application job inventory scheduling.
No next invocation is installed by this packet.

`TODO(spec)`: §9.5 has no job wire format or stratum allocation. The smallest
implementation is the strict local fixture contract, frozen 35/25/25/35/80 quotas,
append-only checkpoints, pending evidence and externally authorized suspension.
