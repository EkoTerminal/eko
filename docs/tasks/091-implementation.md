# Task 091 implementation

Candidate: `95b345c194749b151d052f99a7b9216f9f0cf4e0` plus the uncommitted packet-091 changes. Source-content SHA-256 (sorted changed paths and contents, excluding this report): `14209e52552efc151b82fc3214177add125151e2c23e2754525228bf1cee8d6c`. No commit, push, deployment, publication, external message or paid job was performed. Actual paid-job cost: $0.

Migration paths below reflect packet 091b renumbering after main added its trade-access migration 0003. The original candidate fingerprint and check evidence above describe the pre-merge task 091 candidate.

## Changes and spec

Followed BACKEND §§3.2, 9.1, 9.6, 21.4, 23 CA-18; FRONTEND §§3.12–3.17; FACTS §7; Guard 2.0 §1's mandatory policy and advisory boundaries. Read AGENTS including rule 9, the packet, gap analysis and marketing claims rules. Specs, Guard algorithms and the prototype are unchanged. No personal identifiers or real secrets were added or ported.

- `apps/server/src/db/schema.ts`, `drizzle/0004_harness.sql`, `drizzle/meta/0004_snapshot.json`, `drizzle/meta/_journal.json`: API-owned agents, append-only policies and agent keys. Keys include API/OAuth kind and future grant metadata; there is no OAuth issuer in this packet. Migration is exercised by fresh PGlite databases in the tests.
- `apps/server/src/harness/service.ts`: owner-filtered list/detail/create/rename/status/disconnect, versioned policies and key lifecycle. Owner-row locks serialize creation and reconnect quotas across service instances. Agent-row locks serialize policy updates and credential issuance/revocation/disconnect. Revoked or disconnected keys fail authentication; concurrent authentication rechecks revocation before returning a principal. Presets reuse the existing pure policy package and preserve explicit null, zero and empty lists. No Guard rollout or enforcement acceptance is enabled.
- `apps/server/src/http/v1/agents.ts`, `http/v1/index.ts`, `app.ts`: session-wallet-owned routes and runtime response parsing through shared schemas. T serves agents, policy reads, presets and key creation/list/revoke. Policy PUT is only registered when `policy_editor` is enabled and rechecks that flag at request time. PATCH status requires `mission_kill`; rename works at T. DELETE disconnects and revokes credentials. Mutations reject guest, missing/expired session, bearer-only management, foreign/missing Origin and signed demo sessions.
- `apps/server/src/config.ts`, `.env.example`: optional `HARNESS_KEY_PEPPER`, at least 32 characters when supplied. Issuance and authentication remain unavailable without it; there is no generated/default pepper. Stored keys contain prefix and HMAC-SHA256 of the random secret component. The full `eko_live_<prefix>_<secret>` bearer appears only in the issuance response, with `private, no-store`, and never in stored/listed data or log calls.
- `apps/server/src/ws/hub.ts`, `app.ts`: signed-session resolution before WebSocket upgrade, owner-only agent subscriptions/publication, independent per-account sequence numbers, and no public agent fan-out. All agents remain advisory.
- `apps/web/src/lib/mission.ts`, `pages/mission/Agents.tsx`, `AgentDetail.tsx`, `Connection.tsx`, `Connect.tsx`: existing schema-parsed Mission clients now consume persisted responses. Keys can be created with an empty key list and revoked at T. Missing journal routes produce an explicit unavailable state instead of preventing agent/key views from loading; other server errors still propagate. Disconnected records do not occupy the client quota count. Unset preset size/loss/approval fields display a dash rather than a fictitious zero-dollar limit.
- `apps/server/test/v1-agents.test.ts`, `apps/web/src/pages/mission/mission.test.tsx`, `mission-screens.test.tsx`: ownership, sessions/demo/Origin, disclosure, HMAC, revocation, disconnect, concurrent admission/reconnect, preset null semantics, append-only policy conflicts, flags and owner-scoped events. Replaced the old UI expectation that key revocation needed `mission_kill` with assertions that it is available at T; kill controls remain gated.
- `apps/server/package.json`, `pnpm-lock.yaml`: declared the existing spec-named `@eko/policy` workspace dependency; no dependency versions were upgraded.

## Checks and reproduction

For this restored local dependency tree, prefix pnpm commands with `pnpm_config_verify_deps_before_run=false`. This is a command-local setting; no global or repository configuration was changed. Run from the worktree root.

| Command (with the prefix above) | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/server exec vitest run test/v1-agents.test.ts --testTimeout=30000 --hookTimeout=30000` | 0 | 8 tests; `/tmp/eko-091-agents.log` |
| `pnpm --filter @eko/web exec vitest run src/pages/mission/mission.test.tsx src/pages/mission/mission-screens.test.tsx` | 0 | 33 tests; `/tmp/eko-091-web.log` |
| `pnpm typecheck` | 0 | All workspace packages; `/tmp/eko-091-typecheck.log` |
| `pnpm test` | 0 | 114 Vitest files, 2270 tests, contract tests, web/server builds and role-image fixtures; `/tmp/eko-091-test.log` |
| `pnpm brand:check` | 0 | 15 files; `/tmp/eko-091-brand.log` |
| `pnpm check:addresses` | 0 | 312 source files; `/tmp/eko-091-addresses.log` |
| `pnpm --filter @eko/contracts test` | 0 | 33 passed, existing fork test skipped; `/tmp/eko-091-contracts.log` |
| `git diff --check` (no prefix) | 0 | No whitespace errors |

`CI=true pnpm install --offline --no-frozen-lockfile` exited 1 because the store lacks a locked font tarball, after pnpm removed dependency links. Dependencies were restored locally from the main checkout, with task-local workspace links. `CI=true pnpm install --offline --lockfile-only --no-frozen-lockfile` exited 0 and updated only the new workspace declaration. A frozen-lockfile-only check attempted unavailable registry metadata verification despite `--offline`; it was stopped with exit 130 rather than disabling supply-chain policy checks. A full clean frozen installation is not verified in this sandbox and remains a lead/CI check with a complete store.

The first server test invocation used `test -- <path>` and unexpectedly ran the whole server suite (exit 1); focused `exec vitest run <path>` commands above were used thereafter. The first full gate stopped on missing local OpenZeppelin links; those were restored and the focused contract check passed before the full rerun. Initial focused failures were corrected (test meter await, WebSocket hello contract, and API-key/OAuth fixture selection). No tests were deleted, skipped or weakened to make a failure disappear.

Checkpoint: `/tmp/eko-091-checkpoint.json` records the source fingerprint, changed files, check results, completed full-test session/log and next action. Session 3559 finished with exit 0; no check process remains running. Web and server production artifacts were built by the required role-image gate. Next action is lead review/commit and downstream integration; no continuation is scheduled. Evidence is local migrated-database, injection, fake-socket and unit fixtures, not deployed, browser, live-chain, production-Postgres concurrency or release-acceptance evidence. The focused server suite asserts zero metered chain units; legacy suite metered counters and transports are fixtures, not provider billing or paid acquisition. No coverage percentage or live latency was measured.

## TODO(spec) and remaining dependencies

New TODO(spec) notes:

1. `apps/server/src/harness/service.ts`: quotas count active and paused connections; disconnected records keep their history and free a slot. Reconnect rechecks the quota. The spec does not freeze disconnected-record counting.
2. `apps/server/src/http/v1/agents.ts`: `/policy-presets` has no frozen envelope; use the existing Mission client's array of named Policy objects (version 1).
3. `apps/server/src/http/v1/agents.ts`: DELETE has no frozen response/deletion semantics; use credential revocation and a retained disconnected Agent rather than erasing history.

Existing relevant ambiguities remain: `apps/web/src/lib/mission.ts` already records the same preset-envelope choice; `packages/policy/src/presets.ts` still carries the YAML-source TODO (this API reuses its current defaults); task 090's entitlement service requires an approved `LAUNCH_WEEK_AGENT_LIMIT` and otherwise denies admission with limit 0. Token tiers/trials remain task 090's conservative fallback.

Set an approved launch quota and inject a stable private pepper through deployment secrets before key issuance. Apply the included migration through the normal API migration path. Packet 092 owns encrypted journal storage/routes; 093/095 must connect bearer lookup to MCP tools and real first-call/preflight activity; 096 owns packs, currently required by the Connect loader; 097–099 own OAuth grants/tokens. This packet does not add kill-all/hard-kill/session-key execution, install enforcement, or grant review acceptance. The API badges stay advisory regardless of agent kind.
