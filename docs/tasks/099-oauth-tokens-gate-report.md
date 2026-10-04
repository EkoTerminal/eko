# Task 099 — OAuth tokens and connector gate

## Candidate and scope

Base revision: `eece6311ae9b901ee1f4c68fcd1c5089ce917ede`, plus the uncommitted task changes. Implementation SHA-256 (sorted relative changed filenames and contents, excluding this report): `0efa84dc0abd28cb7f7b9c5048e43456c38bedab552bb3c0b463c4f2237a531b`. No commit, push, deployment, publication, external message or paid run. No new dependencies or lockfile changes. No personal identifiers or real secrets added; fixtures use neutral sample accounts and generated test credentials. No source port required identifier replacement. `docs/eko/`, Guard logic and prototype files are unchanged.

Spec followed: BACKEND §§9.1, 20, §23 errata v1.2; FACTS §5b. Existing §9.11 pack fallback is retained. The v1.2 deployment-dependent acceptance date takes precedence over the older Oct 2 text. Connector readiness is **pending**; `MCP_OAUTH_ENABLED=false`, runtime discovery/consent/token routes unavailable, and `claude_connector` remains `Pack.stage=D0`. An environment toggle cannot bypass the acceptance gate.

## Changed files

- `apps/server/src/harness/oauth-tokens.ts`: consent-code exchange, S256 PKCE and exact client/redirect/resource checks, opaque audience-bound access tokens, rotating refresh tokens, expiry, RFC 7009 revocation, per-request grant/agent/key resolution and last-use updates. Codes and token secrets remain HMAC-only. Account → agent → grant/key → code/token locking and conditional consumption serialize redemption/refresh with deletion and Mission Control. Replay revokes the whole grant; the failure is raised after the revocation transaction commits.
- `apps/server/src/db/schema.ts`, `apps/server/drizzle/0043_oauth_tokens.sql`, `apps/server/drizzle/meta/0043_snapshot.json`, `apps/server/drizzle/meta/_journal.json`: issued token pairs, unique code redemption, retained spent refresh hashes, grant cascade, reciprocal key/grant revocation and credential-free revocation audit events. **0043 is the only new migration.** Merge the journal index/timestamp with other worktrees while preserving migration order.
- `apps/mcp/src/app.ts`: prepared form/JSON token and revoke endpoints, duplicate form parameter rejection, no-store responses, existing OAuth rate limiting, OAuth bearer resolution on every MCP request.
- `apps/mcp/src/tools.ts`: scope filtering for both tool listing and calls, alongside existing tool availability/entitlement checks. API keys retain all scopes; OAuth attribution comes from the grant's agent.
- `apps/mcp/src/runtime.ts`, `.env.example`: bounded TTL configuration/defaults; explicitly retain the pending live-acceptance gate.
- `apps/mcp/test/oauth-tokens.test.ts`: full discovery → recent wallet consent → redemption database fixtures, binding failures, expiry, races/replay, scope-filtered transport, revocation, foreign-account isolation, deletion and pepper/destruction failures.
- `apps/server/test/harness-migrations.test.ts`: expand exact ledger assertions for 0043 and verify snapshot continuity/table creation. Existing assertions remain in place.
- `apps/server/test/private-journal.test.ts`: replace its future placeholder token table with the actual migrated token schema; retain all deletion and other-account assertions.
- This report.

## Final verification

| Command | Exit | Actual evidence |
|---|---:|---|
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/mcp test test/oauth-tokens.test.ts` | 0 | 8 lifecycle tests; final focused rerun passed |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/mcp test` | 0 | 5 files, 65 tests |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/harness-migrations.test.ts test/private-journal.test.ts test/oauth-consent.test.ts test/v1-agents.test.ts test/restore-drill.test.ts` | 0 | 5 files, 38 tests |
| `pnpm typecheck` | 0 | All workspace typechecks passed; session 39757 completed; `/tmp/eko-099-typecheck.log` |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | Complete root gate, including 48 server files / 431 tests, 5 MCP files / 65 tests, 12 indexer files / 153 tests, and role-image web/server builds and injected boot checks; session 75327 completed; `/tmp/eko-099-full-test.log` |
| `pnpm brand:check` | 0 | 47 served/configured files checked |
| `pnpm check:addresses` | 0 | 517 source files checked |
| `git diff --check` | 0 | No whitespace errors |

Initial fixture cleanup attempted to truncate accounts, which the existing append-only points ledger correctly refused; cleanup now truncates only OAuth fixture state. The first replay/revoke tests exposed a shared trigger expression accessing a field absent on the grant record; table-specific branching fixed it. No assertions or timeouts were weakened, skipped or deleted. Final migration/privacy fixtures and the complete MCP suite pass. Subsequent TTL-only configuration additions are covered by the final workspace checks.

Logs contain normalized workspace paths. Focused logs: `/tmp/eko-099-tokens.log`, `/tmp/eko-099-mcp.log`, `/tmp/eko-099-integration.log`. Actual external/provider cost: **$0**. No coverage percentage is claimed; no coverage command was run. Evidence is offline PGlite, HTTP injection, deterministic fixtures and repository checks; it is separate from live connector evidence.

## TODO(spec)

New interpretations in `oauth-tokens.ts`:

1. Refresh scope narrowing is unspecified; an explicit refresh scope must equal the granted set. Scope changes require fresh consent.
2. Revoking an access token ends its grant and refresh family, using the same grant/key revocation unit as refresh revocation.

Touched inherited TODOs remain: `app.ts` uses 60 requests/minute per IP for OAuth routes because §9.1 specifies only the DCR hourly budget, and retains the published Listener tool rate pending a separate launch-week quota; `tools.ts` retains the existing provisional census/receipt inputs and playbook envelope. No new tool contract or Guard semantics were introduced. Untouched consent, entitlement, journal and pack ambiguities remain owned by their earlier packets.

## Prepared bounded external acceptance — not run

Prerequisites: explicit authorization for a controlled acceptance deployment; public HTTPS MCP and web/API origins; applied migration 0043; reviewed exact callback allowlist; test wallet session and agent; encryption/destruction configuration for preflight/journal; authorized Inspector and claude.ai/desktop client access. None is supplied by this sandbox. No ports or network were used, and no live client evidence is claimed.

Prepared service composition is exercised by `apps/mcp/test/oauth-tokens.test.ts`: instantiate `OAuthDiscovery` and `OAuthTokenService` for the same HTTPS `/mcp` resource, provide both to `buildMcpApp`, and register the API's existing `OAuthConsentService` through `registerV1`. Use the existing production DB/pepper/destruction ledger and real read/preflight/journal tool registry. Production runtime intentionally omits those optional services until acceptance; a controlled acceptance deployment and later activation are separate lead-owned actions. Keep public pack availability at D0 throughout pending checks.

Bound the authorized live check to one Inspector session and one connector session per authorized surface, using a disposable sample agent:

1. Inspector: discovery/401 challenge → DCR → exact redirect/S256 authorization → fresh wallet consent selecting that agent → exchange → tools/list → `coin_verdict` and advisory `preflight`. Confirm attribution and required scopes without logging credentials.
2. Use a short bounded access TTL in the acceptance environment. Wait for access expiry, verify refusal of the expired token, then verify successful refresh and a second tool call. Confirm a rotated refresh cannot be reused and that reuse ends the family.
3. claude.ai Pro acceptance: Customize → Connectors → + → Add custom connector → candidate MCP URL → wallet consent/pick agent → successful verdict and preflight → expiry/refresh → Mission Control key revoke → subsequent call refused. Repeat in Desktop only when that surface is authorized; record it separately.
4. Run the §20 scripted harness session through the connector: every submitted order follows `allow`; denied/unchecked orders and journal attribution match the existing harness expectations. Perform no live money-moving order as part of this check.
5. Record timestamps, candidate digest/deployed revision, client/surface/version, discovery and redirect behavior, redacted HTTP statuses, tool outcomes, refresh and revoke outcomes, eval results and actual cost. Do not record wallet credentials, authorization codes, access/refresh tokens or personal identifiers.

Stop after one bounded session per surface on a failure; report evidence and leave the gate false/D0. Inspector, real claude.ai/desktop, deployed-origin refresh/revoke and connector harness eval are all **pending**. Only actual passing live evidence can justify a separately reviewed production activation; local fixtures do not satisfy that gate.

Reproduction commands are the exact checks in the table. All task processes have finished; no jobs remain running. Final checkpoint: implementation digest above, typecheck session 39757 exit 0, complete root-test session 75327 exit 0, focused MCP session 86515 exit 0, focused integration session 43594 exit 0. The complete root gate passed on the final source candidate, so no isolated timing-failure rerun was needed. No duplicate gate was run for reporting. Next action is the separately authorized deployed-origin Inspector/connector acceptance above; keep false/D0 until then.

## Integration into integrate-c

The reserved migration number 0043 remains unchanged; no renumbering was needed. At integration, 0043_oauth_tokens was appended after 0041_farcaster_summons at journal index 24 with `when=1790970577353` (the previous entry + 1). Its snapshot received a fresh UUID v4 and was rebuilt from 0041 plus only `public.oauth_tokens`. All existing harness migration assertion blocks were retained, the OAuth snapshot assertions now follow 0041, and final ledger counts are 25. The original candidate digest and verification above describe the task branch before integration.

A direct 0041 → 0043 upgrade/rerun test also verifies preservation of existing harness records, Farcaster claims and the first 24 migration-ledger rows. Integration checks on the merged source:

| Command / check | Exit | Evidence |
|---|---:|---|
| `pnpm_config_verify_deps_before_run=false pnpm typecheck` | 0 | All workspace typechecks passed |
| `pnpm_config_verify_deps_before_run=false VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/harness-migrations.test.ts test/private-journal.test.ts` | 0 | 2 files, 25 tests |
| `pnpm_config_verify_deps_before_run=false VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test` | 0 | 57 files, 545 tests |
| `pnpm_config_verify_deps_before_run=false VITEST_MAX_WORKERS=2 pnpm --filter @eko/mcp test` | 0 | 5 files, 65 tests |
| Journal/snapshot/assertion preservation check | 0 | Existing journal entries unchanged; snapshot UUID v4 and exact delta from 0041; every original harness line retained with only tag/index/count/title adaptations |
| `git diff --check` | 0 | No whitespace errors |
| Text-only `rg` scan for lines beginning `<<<<<<<` | 1 (no matches) | No remaining conflict markers; wrapper exits 0 |

The initial focused server, typecheck and MCP commands each exited 1 before executing checks because pnpm attempted an automatic dependency reinstall without a TTY. Disabling only that per-command pnpm check used the installed dependencies; no dependencies, lockfile, persistent configuration or test timeouts changed. A preliminary byte scan matched binary PNG bytes; the text-only scan above excludes that false positive.

Logs: `/tmp/eko-integrate-c-099-focused.log`, `/tmp/eko-integrate-c-099-typecheck.log`, `/tmp/eko-integrate-c-099-server.log`, `/tmp/eko-integrate-c-099-mcp.log`. No root test suite was run during integration; that gate belongs to the lead. Live connector acceptance remains unverified as described above. Only working-tree files were edited; the lead must stage the resolved files and commit the merge.
