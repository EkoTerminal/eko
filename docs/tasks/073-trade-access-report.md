# Task 073 implementation report · 2026-10-02

Candidate: uncommitted work on base `95b345c194749b151d052f99a7b9216f9f0cf4e0`. The lead commits.
Candidate source SHA-256: `3bfb1525a241e6169edd69b96bcc5854dc54763490dca6b10f87ea41ef6445cd`.
The fingerprint covers the 23 changed/new non-report files listed below, sorted by relative path, each hashed as path + NUL + file bytes + NUL; this report is excluded.

## Changed files and behavior

- `apps/server/src/db/schema.ts`, `apps/server/drizzle/0003_trade_access.sql`, `apps/server/drizzle/meta/{0003_snapshot.json,_journal.json}`: persistent wallet-primary-key allowlist with role, per-trade cap, actor, timestamp and note; generated migration and metadata.
- `apps/server/src/http/v1/trade-admin.ts`, `apps/server/src/http/v1/index.ts`: wallet-authenticated admin list/upsert/delete and runtime switch maintenance. Writes require an allowed origin, reject demo sessions, validate inputs and atomically audit successful changes. Overrides only lower role caps. The env ceiling cannot be enabled through the runtime route.
- `apps/server/src/config.ts`, `apps/server/config/trading-caps.yaml`, `.env.example`, `apps/server/build.mjs`, `packages/chain/src/index.ts`: strict YAML/zod schedule loading and env validation; reuse the chain package's existing YAML dependency, with no dependency or lockfile change. The bundled role image carries the schedule file. The shipped schedule holds $250; no time-only $1,000 promotion.
- `apps/server/src/exec/trade-access.ts`, `apps/server/src/app.ts`: shared access service for the env AND runtime switch, beta membership, role/personal caps, public schedule and absolute ceiling. Config loads have an audit snapshot/hash without secrets or filesystem paths. Missing public start time/before-start time has a zero cap. Stale runtime reads close trading when a refresh fails.
- `apps/server/src/exec/service.ts`, `apps/server/src/flags/service.ts`: current access checks at live quote/order/retry time. Refused quotes retain pricing/fees/warnings but omit executable bytes; refused orders never return unsigned transactions. Idempotent retries cannot return transaction bytes after a pause, cap reduction, membership removal, wallet mismatch or quote expiry. Paper execution remains separate.
- `apps/server/src/http/v1/config.ts`, `apps/server/src/http/v1/defaults.ts`, `apps/server/src/http/routes.ts`: effective global/session cap and accepted v3 router/spender targets from the registry; authenticated config is private/no-store. Legacy config also reflects the runtime switch. Code-only Pons verification and unaccepted v4 targets are not promoted to executable allowlists.
- `apps/server/test/trade-access.test.ts`, `apps/server/test/{app,workspace,v1-foundation}.test.ts`, `apps/server/test/fork/live-route.fork.test.ts`: offline schedule/access/admin/order tests, updated CA-8 refusal assertions and accepted router config expectations, isolated existing wallet-binding assertions, and explicit runtime/public-cap setup for the optional heritage fork suite. No assertions were removed or weakened.
- `docs/tasks/073-trade-access-report.md`: this handoff and release instructions.

Followed BACKEND §§12.4, 21.4, 23 CA-7/8/9, GO PLAN §§8–9, FACTS §7, Guard 2.0 §1 (existing access requirements retained), and the marketing claims rules. Read the gap analysis as context; the supplied merged Guard packets are the current baseline. Guard V2 logic, shared levels, scoring, receipts, trace principals and feature acceptance remain untouched. The old `live_disabled`/403 heritage response is replaced by the specified `trading_paused`/422 response. No personal identifiers or real secrets were introduced or ported.

## Operator preparation and cap hold

The routes are `GET /v1/admin/trading/allowlist`, `PUT /v1/admin/trading/allowlist/:wallet` with `{role:"team"|"beta_user",capUsd?:number,note?:string}`, `DELETE` at the same wallet URL, and `PUT /v1/admin/trading/live` with `{enabled:boolean}`. They use existing signed SIWE session cookies, admin roles/`ADMIN_WALLETS`, and allowed Origin/Referer checks. Successful writes use the `trading.allowlist_upsert`, `trading.allowlist_delete` and `trading.live_changed` audit actions. Config boot/release uses `trading.config_loaded` with the validated schedule, access settings and hash. Runtime ops cache latency is at most 10 seconds; allowlist reads are uncached.

Before beta: keep `TRADING_ALLOWLIST_ONLY=true`, seed only approved team wallets (default $25), then approved beta wallets (default $100); a row may lower its role cap. Live orders require both `LIVE_TRADING_ENABLED=true` and `trading_live=true`. These are prepared controls, not evidence that beta entry is approved.

At the approved T release, set `TRADE_CAPS_FROM` to the approved launch instant (the planned Oct 13 16:00 Toronto instant is `2026-10-13T20:00:00Z`) and explicitly release `TRADING_ALLOWLIST_ONLY=false`. Time alone never removes the allowlist. The selected public step is capped by `TRADE_MAX_USD` when configured.

At/after 72 hours, raising the cap requires a reviewed config release, conditional on clean evidence: zero honeypot fills and no Sev 1. Only after acceptance add `- { afterHours: 72, perTradeUsd: 1000 }` to the public schedule and redeploy config. The timestamp alone does not authorize this change. To hold $250, keep the shipped single-step schedule, or set `TRADE_MAX_USD=250` even if a larger step is present; lower values also work. Revert that config release or lower the absolute ceiling to roll back. Turning the runtime switch off is the immediate trading pause, visible within its cache window.

## TODO(spec) and remaining dependencies

- New `TODO(spec)` in `config.ts`: optional non-null daily-per-wallet caps require an atomic spend ledger. Until an owning implementation exists they fail configuration validation; they cannot silently enable an unenforced limit. This packet implements per-trade caps only.
- New `TODO(spec)` in `trade-admin.ts`: admin URLs/response shape are unspecified; use the v1 conventions above.
- Existing unrelated TODOs remain with their owning packets (audience targeting, demo/route-registration notes, deployment address placeholders and non-trading config defaults). The obsolete cap/router placeholder TODO in `defaults.ts` was removed by this implementation.
- Packet 075 must call `ctx.tradeAccess.assertOrder(wallet, amountUsd, isDemo)` after binding the authenticated account and before returning any v1 unsigned transaction, including idempotent replies. `informationalQuote` adds a CA-7 refusal while preserving verdict/fee data and clearing binding; callers must keep transaction bytes internal on refusal. A pass here is access eligibility only, never Guard/simulation/sanctions approval.
- Mandatory Guard/exact-account revalidation, acquired-position simulation, screening and the v1 trade lifecycle remain with 052/068/074/075. No v1 trade endpoints are registered here. The heritage ETH/USDG adapter values buy input as quote dollars and sell input at its quote price; generic-coin adapters supply their validated `amountUsd` to the service.
- Accepted Pons/v4 execution and spender targets remain with their route packets. Operator role seeding, release evidence, real-chain/fork acceptance and actual config deployment are external steps.

## Verification and checkpoint

| Exact command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/server exec drizzle-kit generate --name=trade_access` | 0 | Generated SQL and snapshot without network |
| `pnpm --filter @eko/server test test/trade-access.test.ts test/v1-foundation.test.ts test/app.test.ts test/workspace.test.ts` | 0 | 4 files / 53 tests; `/tmp/eko-073-focused.log` |
| `pnpm typecheck` | 0 | All workspace scripts passed; `/tmp/eko-073-typecheck.log` |
| `pnpm test` | 0 | 105 files / 1,994 tests plus web/server builds and compiled-role fixture checks; `/tmp/eko-073-test.log` |
| `pnpm brand:check` | 0 | 15 files; `/tmp/eko-073-brand.log` |
| `pnpm check:addresses` | 0 | 312 source files; `/tmp/eko-073-addresses.log` |
| `git diff --check` | 0 | Whitespace check |

The initial focused run exposed expected address normalization and old gate setup assertions; these were corrected without changing access requirements. The final focused run above passes. Full-test checkpoint: session `65014` exited 0; typecheck session `92769` exited 0. Logs are retained at the paths above. No job remains running, and the completed full gate was not restarted. Next action: lead review/commit and the owning packets' integration, followed by separately authorized release/fork evidence.

All evidence here is local/injected fixtures, PGlite migrations and compiled-role checks. No live chain access, paid job, commit, push, deploy, publication or external message was performed. Actual acquisition cost: $0. Existing server tests can record metered attempts to deliberately unreachable loopback fixture endpoints under a provider label named `paid`; these are not paid provider traffic or live evidence. The optional fork suite was not run because this sandbox has neither network nor ports.

Reproduce the focused and full checks with the exact commands above. For the separate authorized heritage fork step, use a host with Anvil and ports, with Anvil's upstream behind task 024 spend controls:

```sh
FORK_BLOCK_NUMBER=77438503 FORK_URL="${METERED_FORK_URL:?set an approved metered archive upstream}" pnpm --filter @eko/server test:fork
```

The pin is an existing fixture block, not newly acquired evidence. The fork setup now explicitly enables the runtime switch and supplies a public schedule start; the shipped $250 hold still applies. No production or Guard release approval is implied by this prepared command.
