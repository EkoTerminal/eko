# Guard cutover and rollback preparation · 063

**Prepared, inactive, unreleased. No candidate is accepted.** The checked-in
`063-prepared.json` has no accepted release manifest, an empty trusted inventory,
zero measured launches/duration and generation 0. Every venue/size/account slice
is incomplete. Released factors, checks and profiles are empty; Lower, history
and buckets are disabled. Signal stays V1. Guard 061/062 fixture reports cannot
authorize a cutover. No live runner, publisher or continuing process is installed.

This implements Guard 2.0 §§7.2–7.3 and 9.4 as pure preparation in
`apps/engines/src/guard-cutover.ts`. The active server/read/policy configuration
continues to use its existing switches. These helpers are intentionally not
mounted in API, MCP, WS, a worker, an environment override or a demo flag.
There is no deployment command in this packet. Operational publication follows
the existing [release checkpoint process](../release-checkpoint/README.md) and
application rollback ordering; a document or passing fixture is not authorization.

## Acceptance and coverage inventory

The strict `GuardReleaseManifestSchema` pins source revision, code, parameters,
service/profile/calibration, dataset and labels, and all four semantic versions.
It declares released factor/decisive/check IDs, exact gate artifacts, locked-test
and live-shadow artifacts, legacy read/proof and policy replay evidence, and
compatibility evidence for every consumer. Attribution is qualified control V2;
serial/exemption attribution is rejected. Optional buckets remain disabled.

Coverage enumerates all 16 combinations of Pons curve, Uniswap V3, Uniswap V4,
other venue, primary $100/$1,000 and EOA/smart account. A supported slice needs
accepted profile/evidence and every buy-critical check. Lower additionally needs
both tiers and its acceptance gate. Other slices explicitly name critical gaps
and refuse buys. Missing classes/venues cannot disappear from the coverage table.
At present **none can ship**. Route/profile implementation or a synthetic supported
slice does not establish measured coverage.

A narrower release may disable Lower, history and all unaccepted factors, retaining
confirmed accepted High facts and Elevated with named lower-tier gaps. Its accepted
manifest still requires contracts, fidelity, restrictions, operations, parity and
live-shadow evidence. Enabled scored factors additionally require promotion and
prediction gates; attributed factors/checks, instruction and history require their
applicable independent gates. Whole-band acceptance cannot substitute for an
unaccepted factor. Gate artifacts must cover the exact declared slices, accepted
methods and frozen candidate; the acceptance process owns that measured review.
The helper validates admission, not statistical truth in unseen artifacts.

Both 604,800 covered seconds and 5,000 launches plus final entrant follow-up,
accepted pilot operating targets and approved budget are required. Acceptance
inventory entries identify the exact manifest hash, acceptance artifact and
candidate revision. An independent redacted inventory must be obtained through
the authorized process; never construct it from an incoming request, accepted
boolean, fixture report or untrusted tool context. Revoked hashes refuse use.

## Authorized atomic publication contract

1. Complete measured candidate acceptance and existing repository release gates.
   Retain content-addressed manifests/artifacts and the previous released V2 digest,
   if one exists. Verify byte hashes and provenance outside these pure helpers.
   Obtain a separate explicit authorization bound to operation, target manifest
   hash and current generation. Fixture acceptance doubles are never admissible.
2. Stage API/cache/web/bot/policy/WS/MCP and every compact consumer with the same
   proposed switch snapshot. Collect independent `GuardConsumerAckSchema` records.
   Check original V1 reads/proofs, missing-state masks, list totals and ranking,
   omission behavior, common copy, policy replay and actual-order revalidation.
   Placeholder bot/widget/notification services must be integrated and verified
   or the release remains blocked; their prepared adapters do not provide a live ack.
3. Call `prepareGuardSwitch` with the current snapshot, expected generation,
   `operation: 'cutover'`, accepted manifest, verified inventory and acknowledgements.
   It rejects missing/mixed consumers, schemas, cache namespaces, policy versions
   or unauthorized manifests. It returns `prepared: true, released: false`, the
   expected current-state hash and one complete next snapshot/hash. It writes nothing.
4. The separately authorized publisher must pause buy admission, drain in-flight
   work, and compare-and-set the **whole** snapshot using `expectedStateHash` in
   one durable transaction. Append new settings versions from
   `prepareGuardPolicySettings` in the same publication boundary. Fan out the same
   immutable snapshot to all readers; fence consumers with stale acknowledgements.
   Do not independently flip API/cache/web/bot/policy flags or admit buys during
   mixed generations. This durable publisher/fencing integration is not installed
   by 063 and must be reviewed before any release.
5. Recheck actual effective consumer acknowledgements before restoring admission.
   Keep trading off if publication, distribution or verification is uncertain.
   Record the released inventory entry only after actual successful publication.
   Use `selectReleasedGuard` on the original stored revision, requiring a released
   manifest, matching source/method/config pins and supported slice. Never promote
   a shadow/candidate record by changing its mode or receipt. New active evaluations
   append their own records under the authorized version.

`guardReleaseCacheKey` namespaces the existing full receipt revision key with the
whole switch snapshot: chain/token/full state cursor, availability cut, route/size/
account, mode, semantic/code/config/registry/profile/calibration/source hashes.
Do not reuse a prior generation's quote/order cache. Signal never influences Guard,
ranking or permission. API negotiation stays explicit; new V1 projections use
`verdict-1+guard-2`, while original stored V1 payloads/levels retain their schema.

Signal promotion is a separate `operation: 'signal'` with its own accepted
`SignalReleaseManifestSchema`, adapter code/source hashes, check evidence and
authorization bound to the current released Guard hash. It preserves the original
five inputs and 15-second refresh. Every Guard cutover/rollback resets Signal to
V1 until that exact Guard binding is independently accepted.

## Rollback

Pause new buys using the existing operational ceiling/runtime switch. Preserve
the current switch, authorization, receipt and incident evidence. Follow the
existing rollback order: drain singleton writers, recover accepted API/config,
verify readiness, then resume accepted roles without overlapping writers.

Prepare `operation: 'rollback'` against the current generation. Select only a
previous **released**, still admitted V2 manifest with fresh acknowledgements and
explicit rollback authorization. A candidate, revoked digest, same active digest,
legacy V1 manifest or rejected serial/exemption method refuses rollback. If no
previous released V2 exists, pass `manifest: null` with separately authorized
fallback acknowledgements: the result is `critical_incomplete`, Guard policy 2,
Signal V1, no manifest or invented receipt. All buy-critical assessments are
unavailable; buyer gates deny with a named incomplete reason. Sell-only execution
retains its existing kill/blocklist/route/simulation checks.

Publish the whole rollback snapshot through the same fenced compare-and-set
boundary. Never return policy settings to V1, rewrite historical settings, replay
final preflights under new rules, delete receipts, down-migrate, restore a database
for application rollback or rebuild an old attribution engine. Old receipts retain
their original canonical bytes, modes, levels, anchor status and proofs. Existing
idempotent final preflight replay stays unchanged; calldata preparation still needs
fresh actual-order revalidation from 052. If readiness cannot be established, keep
trading off and use the reviewed forward-fix process.

## Local rehearsal and checkpoint

```sh
pnpm --filter @eko/engines exec vitest run test/guard-cutover.test.ts test/live-shadow.test.ts
pnpm --filter @eko/shared exec vitest run test/guard-receipts.test.ts test/guard-consumers.test.ts
pnpm --filter @eko/policy exec vitest run test/guard.test.ts test/actual-order.test.ts
```

These are neutral synthetic admission/switch/rollback/schema/proof/policy tests.
They do not claim measured accuracy, provider coverage, real consumer propagation,
live shadow duration or production rollback timing. Current checkpoint is the
checked-in preparation JSON; there is no running job. Next action is lead review
and integration of this uncommitted preparation, then external measured acceptance
and publisher review before any separately authorized release.

`TODO(spec)` in the implementation: the specification does not define the cutover
wire format or durable atomic publisher. The smallest reading is a strict pure
plan with external acceptance/authorization, one fenced publication boundary and
no live wiring while no accepted candidate exists. No new feature-flag name,
dependency, migration or network capability is added.
