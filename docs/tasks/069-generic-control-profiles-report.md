# Task 069 implementation report

Candidate: base `33e65459bce4dee430912eaf7657f5a31516b20e` plus this uncommitted worktree diff. Source/test manifest SHA-256, excluding this report: `89341b2006abafb78cfb830de9a1d6e6e0956da99125e07487e0ae620fd59343`. No commit, paid job, deployment, publication or external message was performed.

Follows BACKEND §6.3 and Guard 2.0 §§3.4, 5.3, 7.1; preserves FACTS §7 V1 contracts. Guard's changed-state requirement supersedes BACKEND §6.3's older successful-eth_call criterion. No-op calls, missing selectors and zero owners never prove absent powers. Pons profiles, scoring, policy, hooks and liquidity custody retain their packet ownership.

## Changed files

- `packages/chain/src/control/{types,collector,fork}.ts`, exported through `packages/chain/src/index.ts`: strict profile/recipe/evidence schemas; EIP-1967, beacon and canonical EIP-1167 paths; observed owner/getOwner/proxy-admin/default-admin roles; finite setter dictionary with bounded PUSH4 disassembly using existing viem. Selector matches are leads, not permission proof. Other bytecode/proxy variants remain unknown. Limits selectors are recorded without inventing a Guard capability enum.
- Collector bounds: four proxy hops, eight enumerated members per target, two explicit controller targets, 16 configuration reads and 128 archive requests. Number/hash/time/chain pins and the final canonical check prevent mixed-state captures. No cache carries observations into later state.
- Fork confirmation uses 068's exclusive metered lease. At most 16 reviewed recipes run independently after reset; only EOA gas funding and impersonation are permitted. Authorization/token storage is never overridden. Successful receipts require directional before/after state changes; upgrades additionally require different nonempty implementation code. Timelocks require a queued operation, early rejected execution with unchanged state, then successful delayed execution. Contract owners are reached through their observed EOA controllers, never directly impersonated.
- `apps/engines/src/control-profiles.ts`, exported through `apps/engines/src/index.ts`: immutable raw profiles and typed `GuardCardMeasurement` projection through 027's existing normalizer store and 035's existing card adapter. Profile identities include implementation path, configuration, roles, block/hash/time and probe evidence. Captured review dependencies are mandatory. Atomic supersession, source dependency invalidation and reorg invalidation retain history; exact-cursor reads reject old profiles after any new state. Per-capability authorities are reported; the aggregate controller remains unknown while other roles are unresolved.
- `packages/chain/test/{control-fixtures,generic-controls.test}.ts` and `apps/engines/test/control-profiles.test.ts`: 22 synthetic tests covering inert ownership with a live admin, proxy replacement/cycles, unknown roles/code, false/no-op setters, provider failure, immediate/delayed capabilities, implementation replacement, captured card projection, supersession, invalidation, replay pins and corrupted identities.

No dependency, lockfile or migration changes. Reserved migration 0130 was unnecessary because profiles use existing append-only Guard measurement storage. Read-only specs/design/prototype and unrelated files were not changed.

## Verification

All evidence below is offline fixture evidence. RPC fixtures model isolated fork state; they are not real Anvil/chain executions or accepted control-profile review evidence.

| Exact command | Exit | Result |
|---|---:|---|
| `pnpm --filter @eko/chain exec vitest run test/generic-controls.test.ts` | 0 | 16 tests |
| `pnpm --filter @eko/engines exec vitest run test/control-profiles.test.ts` | 0 | Six tests; final aggregate-controller assertion included |
| `pnpm typecheck` | 0 | Final candidate |
| `pnpm test` | 0 | Final full workspace gate, web/server builds and built-role fixture checks |
| `pnpm brand:check` | 0 | 134 files; final source correction introduced no branding |
| `pnpm check:addresses` | 0 | 351 source files; final source correction introduced no addresses |
| `git diff --check` | 0 | Tracked whitespace; added files also checked directly |

An initial engines typecheck exposed a nullable generic type mismatch; it was corrected. An initial projection fixture incorrectly used an availability cut older than its target state; the fixture now supplies a matching cut without changing the production adapter. The first full typecheck/test gates passed. Final gates passed after correcting aggregate-controller attribution; earlier full-gate results are not substituted for the final results.

## TODO(spec), dependencies and handoff

One new TODO(spec), in `apps/engines/src/control-profiles.ts`: a generic setter probe cannot establish a quantitative ceiling or unrestricted domain. Bound evidence requires its own reviewed adapter; `boundCode`/`bound` remain unknown. Delayed execution establishes a reachable-by time upper bound, not an exact minimum delay. Synthetic queued operations never become claims about real pending queue entries, releasable supply or current float.

The generic producer is opt-in and has no paid CLI/background job. Lead integration sequence, after separate authorization and provisioning:

1. Call `inspectGenericControls` with the existing `createMeteredClients(...).archive`, a pinned block-end cursor and bounded relevant configuration/controller reads. Pons inputs are rejected.
2. Supply reviewed `ControlRecipe` records pinned to the returned implementation/configuration hashes. Use `GenericControlFork` with `SerializedMeteredForkLease`; its reset callback must route every upstream archive read through the metered gateway. Public/unknown roles, unsupported selectors, missing controller paths and unreviewed setter semantics stay unknown.
3. Call `persistControlProfile` with an existing captured Guard availability manifest and registered review/configuration dependency IDs. Pass prior profile/measurement IDs when replacing a profile. On relevant source replacement/invalidation, run the existing `GuardMeasurementStore.invalidateDependencies`; on reorg use its existing reorg invalidation. The existing V2 read adapter consumes the stored typed card measurement.

The table's commands are the prepared offline reproduction commands. No deployment or migration command is needed for this packet. Remaining external evidence: reviewed semantic/bounds profiles, an operational metered fork gateway, real matched fork executions and the owning Guard release gates. Partial capability facts do not complete `controls_hooks`, enable active V2, alter V1 trade permission or release new control scoring.

Live/archive acquisition units: **0**. Paid acquisition cost: **$0**. Real fork cases/accepted live profiles: **0**. Implementation and fixture tests do not establish deployed, approved or launch-accepted control coverage.

Checkpoint: `/private/tmp/eko-069-checkpoint.json`. Completed final processes and logs: typecheck session `91957`, `/private/tmp/eko-069-typecheck-final.log`; test session `71457`, `/private/tmp/eko-069-test-final.log`. Focused logs: `/private/tmp/eko-069-chain.log`, `/private/tmp/eko-069-engines-final.log`. All checks are complete and the sessions exited 0. Next action belongs to the lead: review/commit this diff, wire the opt-in producer and acquire separately authorized metered fork evidence. No job remains running.
