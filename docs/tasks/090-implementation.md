# Task 090 implementation

Candidate: `42ccea5ebd58847e8875c30667dc559d0d34b912` plus the uncommitted packet-090 changes. Source-content SHA-256 (sorted changed paths and contents, excluding this report): `977de039f91253964f36106691383e58feb4918a1998aa1dc285832549d9aaca`. No commit, push, deployment, publication, external message, or paid job was performed.

Implemented and tested locally with migrated PGlite storage, runtime-generated test wallets, Fastify injection, and mock client transports. These are fixture checks, not live chain, browser, deployed-cookie, provider billing, or release-acceptance evidence. No production build was run. Actual paid-job cost: $0; no paid jobs ran.

## Changes and spec

Followed FACTS §7; BACKEND §§15.1, 17, 23 CA-10/11/12; FRONTEND §§4.2, 3.20, and referral handling in §4.7. Read AGENTS including rule 9, the task packet, gap analysis, and claims rules. Read-only specs, Guard logic, prototype, dependencies, and lockfile are unchanged. No personal identifiers or real secrets were added or ported.

- `apps/server/src/http/auth.ts`: reused AuthService; added server-issued ten-minute challenges bound to origin, issuing session, issued time, and expiry. V1 requires chain 4663, exact domain/URI and the specified EKO statement. Nonce consumption is atomic; legacy verification cannot consume a v1 challenge. Rotation revokes the preceding session, and concurrent guest upgrades cannot overwrite an existing wallet identity. Contract-wallet verification uses the supplied task-024 metered mainnet client; EOA verification runs offline.
- `apps/server/src/http/v1/account.ts`: POST nonce/verify/logout, GET `/me`, GET/PUT preferences, GET referrals, and stage-aware EntitlementsService. Anonymous `/me` preserves guest-account behavior without claiming wallet authentication. Referral attribution accepts known non-self codes and binds once; qualification and bonuses remain unavailable.
- `apps/server/src/app.ts`, `http/v1/index.ts`, `http/v1/demo.ts`: register account services, shared error responses, and demo auth exceptions; demo preference writes remain forbidden.
- `apps/server/src/config.ts`, `.env.example`: optional `SESSION_COOKIE_DOMAIN` and `LAUNCH_WEEK_AGENT_LIMIT`, exact-origin validation, and shared cookie scope. Cookie scope defaults to the public-origin host with `app.`, `api.`, or `mcp.` removed; configure an explicit scope for other layouts. Cookies are signed, HttpOnly, SameSite=Lax, Path=/, Secure in production or for HTTPS origins; logout clears the identical scope.
- `apps/server/src/db/schema.ts`, `drizzle/0002_v1_account.sql`, `drizzle/meta/0002_snapshot.json`, `drizzle/meta/_journal.json`: nullable challenge-binding fields, wallet referral codes, and one-time attribution. Migration was generated locally with `pnpm --filter @eko/server exec drizzle-kit generate --name v1_account` (exit 0), then exercised by injection tests.
- `packages/shared/src/contracts/auth.ts`, `contracts/index.ts`, `test/fixtures/contracts/v1.json`: shared nonce/verify schemas and SIWE statement, with frozen contract samples.
- `apps/web/src/lib/trade.ts`, `lib/referral.ts`, `lib/api.ts`, `store/app.ts`, `App.tsx`, `components/Header.tsx`: v1 auth and preference callers, server challenge timestamps, chain switch to 4663, account-change rejection during signing, `/me` and preferences refresh before realtime reconnect. First-touch referral capture has a 30-day TTL and removes `ref` from the URL while preserving other parameters and fragments.
- `apps/web/src/mocks/transport.ts`, `mocks/responses.ts`, `mocks/mocks.test.ts`: matching guest/wallet v1 responses and persisted preference fixtures. The legacy mock test was replaced with the new v1 guest/SIWE/logout behavior; no assertion was removed to hide a failure.
- `apps/server/test/v1-account.test.ts`, `apps/web/src/lib/trade-account.test.ts`: account security, schema, stage, cookie, demo, preference, referral, replay/concurrency, and wallet-change coverage.

V1 intentionally differs from the heritage multichain SIWE flow: it authenticates on chain 4663 and requires a bound ten-minute challenge. Before D0+1, entitlements remain Listener with realtime enabled, no trial, and no token-balance checks; the terminal fee is 0 until the configured D0 boundary and 50 bps thereafter. Shipped-feature flags are not changed by this account packet. Existing public read routes already serve `delayedSec: 0`; no read-engine changes were needed for launch-week realtime.

## Checks and reproduction

Run from the worktree root. Commands below are the final focused reproductions; no network or listening port is needed for the new tests.

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/server exec vitest run test/v1-account.test.ts` | 0 | 21 tests; `/tmp/eko-090-server-focused.log` |
| `pnpm --filter @eko/web exec vitest run src/lib/trade-account.test.ts src/mocks/mocks.test.ts` | 0 | 188 tests; `/tmp/eko-090-web-focused.log` |
| `pnpm --filter @eko/shared exec vitest run test/contracts.test.ts` | 0 | 124 tests; `/tmp/eko-090-shared-focused.log` |
| `pnpm typecheck` | 0 | All workspace packages; `/tmp/eko-090-typecheck.log` |
| `pnpm test` | 0 | 85 test files, 1,625 tests across the workspace, plus brand self-test/address gate; `/tmp/eko-090-test.log` |
| `pnpm brand:check` | 0 | 15 checked files; `/tmp/eko-090-brand.log` |
| `pnpm check:addresses` | 0 | 269 source files; `/tmp/eko-090-addresses.log` |
| `git diff --check` | 0 | No whitespace errors |

An initial `pnpm --filter @eko/server test -- test/v1-account.test.ts` unexpectedly selected the whole server suite (exit 1). It exposed an unnecessarily broad production-HTTPS startup restriction and a missing `await` on the test meter snapshot; both were corrected. The subsequent bounded server check including account/config/auth-foundation tests passed 50 tests (exit 0). The first workspace test run exited 1 because the two new exported schemas needed frozen fixtures. Fixtures were added, and the shared contract reproduction passed. No tests were deleted, skipped, or weakened.

Checkpoint: `/tmp/eko-090-checkpoint.json` records the candidate fingerprint, changed source paths, completed checks, and completed test session/log. Process session 10840 finished with exit 0; no test process remains running. Coverage is the workspace's checked-in unit/injection/fixture suites; production browser and chain-fork acceptance were not run. The new account suite explicitly verifies zero metered RPC units; mock signature fallback returns false. Legacy suite loopback attempts and metered unit fixtures are not live chain evidence or paid acquisition jobs. Next action is downstream integration and operational configuration by the owning packets; no automatic continuation is scheduled.

## TODO(spec), dependencies, and unavailable work

All new or modified TODO(spec) notes relevant to this packet:

1. `apps/server/src/http/v1/account.ts` and `.env.example`: launch-week agent quota is unspecified. Expose an approved `LAUNCH_WEEK_AGENT_LIMIT`, or 0 meaning unavailable. Never interpret an absent quota as unlimited. Unshipped research/backtest quotas remain 0.
2. `apps/server/src/http/v1/account.ts`: accepted token-tier/trial implementation is outside this packet. At/after `TIERS_ACTIVE_FROM`, the account service exposes conservative Listener limits and no activated trial; it does not claim working balance qualification.
3. `apps/server/src/http/v1/account.ts`: CA-10 does not freeze a preference response wrapper. GET/PUT return the shared Preferences object directly, consistently with the v1 client; legacy `/api/preferences` keeps its existing wrapper.
4. `apps/web/src/lib/api.ts`: retained execution callers still need migration to v1 when the trade backend contracts are served (075–078). SIWE and preference callers are migrated here.

Operational configuration still needs the real allowed frontend origins, matching shared cookie scope, approved launch agent quota, and confirmed `FEE_ACTIVE_FROM`/`TIERS_ACTIVE_FROM` boundaries. No global configuration was edited. Schema migration is prepared and tested locally, not applied to a deployed database. Settings/plan UI remains packet 119; referral qualification/bonuses and Points remain packet 122; private realtime/harness/OAuth acceptance belongs to their respective packets. No unaccepted feature or live chain check was enabled. Launch, production cookie/browser behavior, trial/tier acceptance, deployment, and release approval are not established by these fixtures.
