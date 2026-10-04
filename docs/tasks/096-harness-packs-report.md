# Task 096 report

Candidate: base `21851d60ee96d9325a61a9ff191f989762e877dd` plus the uncommitted changes listed below. Candidate file-content SHA-256 (all changed tracked/untracked implementation files, excluding this report): `fc9827b13305736d238fdbea1d9468126ba3c6128a0edd1832ce5534a2a96cd7`. No commit, push, deployment, publication, external messages or paid runs.

## Changes

- `harness-packs/pack.yaml`: the single manifest, written in the JSON subset of YAML 1.2 to avoid dependencies. Shared instructions cover preflight before every full order, matching allows, forced denial, no approval-unavailable retry, human approval before rechecking, session-start history, decision/outcome journaling, Untrusted text, stop results, advisory limits, brokerage approvals, credential separation and non-affiliation.
- `scripts/packs-build.mjs`, `scripts/test/packs.test.mjs`, `package.json`: deterministic `packs:build`, drift-checking `packs:check`, focused `test:packs`, and generator checks in the full gate. No dependencies or lockfile changes.
- `harness-packs/generated/`: eight checked-in files: Claude Code `.mcp.json`, `.claude/skills/eko/SKILL.md` and instructions; generic MCP config and instructions; connector metadata and instructions; CA-19 `packs.json`. Config templates preserve `{{MCP_URL}}` and API-key placeholders. Connector URL metadata has no key.
- `apps/server/src/http/v1/packs.ts`, `apps/server/src/http/v1/index.ts`: public, no-store `GET /v1/packs`, using the shared Pack schema. Claude Code and generic MCP are T; connector metadata is explicitly D0 pending 099. ChatGPT/OpenClaw generation and activation are outside this packet.
- `apps/web/src/lib/mission.ts`, `apps/web/src/pages/mission/Connect.tsx`, `apps/web/src/copy/mission.ts`: existing pack loading, agent creation and key issuance now reach the real endpoint. Verify requires a persisted owner-only journal entry, checks WS hints and polls every three seconds while waiting without overlapping requests, and clears the in-memory key when confirmed. No key is persisted. Pending D0 connector metadata is hidden in every phase until 099 promotes an accepted pack.
- `apps/server/test/packs-session.test.ts`: API-created agents/keys, generated configs, real API-key MCP transport/preflight/journal handlers, PGlite encrypted persistence and fake upstream order execution for both T packs. Negative controls reject orders without allows, denied orders and changed orders.
- `apps/web/src/pages/mission/connect-packs.test.tsx`, `apps/web/src/pages/mission/mission-screens.test.tsx`: generated-pack rendering, placeholder filling, first-journal verification/error handling, and connector readiness gating. The existing expectation that a D0 connector becomes available merely at token launch was replaced with the stricter pending-099 behavior; no test was removed, skipped or weakened.

No migrations, Guard logic changes, prototype changes or edits to `docs/eko/`. Fixtures use neutral identifiers; no source with personal identifiers was ported.

## Specification and decisions

Followed BACKEND §9.11 and §23 CA-19; FRONTEND §3.17; GO-PLAN §§8–9; FACTS §7 shared contracts; BACKEND §9.1 readiness and §9.2 T tools; MARKETING §04 claims, advisory and Robinhood/non-affiliation rules.

The packet explicitly asks for the first authenticated journal event, so Connect says “First journal event received” rather than the FRONTEND example's “First preflight received.” A successful bearer authentication alone cannot confirm connection. The requested pending-099 scope keeps a D0 connector hidden even after token launch rather than activating an unaccepted OAuth path based on calendar phase.

Every new `TODO(spec)`:

1. `apps/server/src/http/v1/packs.ts`: connector promotion requires 099's accepted readiness evidence; an environment toggle alone does not establish readiness.
2. `apps/web/src/lib/mission.ts`: there is currently no cross-process agents WS event for MCP journal writes. The smallest working bridge verifies persisted entries on WS hints and while waiting. A later event can replace polling.

Pre-existing TODOs in touched files remain unchanged: `/policy-presets` has no frozen response envelope (an array of named policies); Pack has no on-chain member (the separately flagged path uses generic MCP).

## Checks

| Exact command | Exit | Evidence |
|---|---:|---|
| `pnpm packs:build` | 0 | Eight generated files; source is deterministic. |
| `pnpm packs:check` | 0 | Generated file contents and complete file set match the manifest. |
| `VITEST_MAX_WORKERS=2 pnpm test:packs` | 0 | Two generator checks and three API/MCP connection tests pass. |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test src/pages/mission/connect-packs.test.tsx src/pages/mission/mission-screens.test.tsx` | 0 | Two files, 18 tests pass. |
| `pnpm typecheck` | 0 | All workspace typechecks pass. |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | 204 Vitest files, 3330 tests pass; generator/eval/contract checks, web/server builds and role-image gate pass. |
| `pnpm brand:check` | 0 | Final check after builds: 203 files checked. |
| `pnpm check:addresses` | 0 | 498 source files checked. |
| `git diff --check` | 0 | No whitespace errors. |

Initial development checks exposed a misplaced test import (`@fastify/cookie` is owned by the server) and incorrect assumptions about preset position/approval limits. The session test was moved to the server test package and now creates explicit fixture caps through the normal agent API. Final focused and full checks pass without changing production policy logic or timeouts.

Focused logs: `/tmp/eko-096-packs-focused.log`, `/tmp/eko-096-web-focused.log`. Other gate logs: `/tmp/eko-096-typecheck.log`, `/tmp/eko-096-brand.log`, `/tmp/eko-096-addresses.log`. Local paths in completed logs are normalized to a neutral worktree label.

## Evidence, dependencies and reproduction

This is offline fixture evidence, not live platform acceptance. Each scripted T client emits one fake order only after a matching allow, makes one forced-denial check and one approval-unavailable check with no retry, and persists eight encrypted journal entries. No upstream brokerage credentials are supplied or stored. No external upstream requests; upstream/paid-run cost is $0. Session model cost is not metered by this environment. No percentage coverage was collected.

Remaining dependencies: 098 owns the journal consent UI (the fixture explicitly opts in after proving a denied write cannot confirm connection); 099 owns OAuth login/refresh/revocation and accepted hosted-connector evidence; production needs a configured MCP endpoint (`VITE_MCP_URL` fills the preserved URL placeholder), launch agent quota and journal encryption/destruction configuration. No D0 pack is activated by this work.

Reproduce locally using the exact commands above. The focused sessions use Fastify injection, an in-memory database and a fake upstream; no network or listening ports are required. Live Claude Code and hosted OAuth smoke tests remain release acceptance work. Built and tested, including the full gate. Full-test process session 80915 completed with exit 0; `/tmp/eko-096-checkpoint.json` records completion. No new failing tests or isolated reruns in the full gate. The contract suite retains its pre-existing gated fork skip (38 passed, one skipped); this task did not introduce or modify skips. Next action: lead review of the uncommitted candidate, then the separate release acceptance work above.
