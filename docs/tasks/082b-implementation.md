# Packet 082b: compiled API startup regression

Candidate: `42ccea5ebd58847e8875c30667dc559d0d34b912` plus the uncommitted 082/082b worktree changes. This follow-up supplements [082's original report](082-implementation.md). No dependencies, lockfile, read-only specs, Guard logic or prototype changed. No commit, deployment, image rebuild, paid job or external message was performed.

## Fix and regression coverage

`apps/server/src/app.ts` now registers one root not-found handler after optional static-web registration. API/WebSocket prefixes retain JSON 404s; other missing paths serve `index.html` when web assets are available. This removes the second registration that crashed the built API with `SERVE_WEB=true`.

`apps/server/test/web-fallback.test.ts` verifies Fastify boot, SPA routing and API 404s with real static files. `scripts/check-role-image.mjs` requires the actual web build, then starts the compiled API/worker (`dist/index.js`), indexer and engines directly and through `dist/launch.js`. Every implemented role must reach readiness and exit 0 on SIGTERM. Existing worker/engine SIGINT checks remain. The API checks health, JSON 404s and SPA content before emitting readiness. The indexer completes a head tick using fixture RPC through its existing metered transport.

The test-only modules in `scripts/fixtures/role-image-*.mjs` replace Fastify's socket bind with `ready()` plus request injection and replace fetch with narrowly allowed in-memory indexer RPC responses. All application initialization, plugins, compiled routing, metering and shutdown remain real. No application test flag was added. These checks establish compiled startup behavior without network or ports; they do not verify socket binding, container operation or Postgres ownership against a real database.

`apps/server/src/roles.ts` and `launch.ts` print only internally constructed requirement errors: unknown/missing role, unavailable role, missing entry point, `DATABASE_URL required in production`, invalid database URL format, singleton ownership already taken, or failed Postgres connection/ownership check. Raw error messages, supplied role values, URLs and credentials are withheld. Role tests cover named errors and suppression of fixture secret/URL text; compiled checks assert the unknown-role and missing-production-database messages.

## CI commands

`package.json` adds `test:role-image` and runs it at the end of `pnpm test`, making compiled startup coverage part of the standard test gate. CI runs:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm brand:check
pnpm check:addresses
```

`pnpm test:role-image` itself builds `@eko/web`, builds `@eko/server`, then executes `node scripts/check-role-image.mjs`. To reproduce just the focused source regressions:

```sh
pnpm --filter @eko/server exec vitest run test/web-fallback.test.ts test/roles.test.ts
```

## Validation checkpoint

| Check | Exit | Result |
|---|---:|---|
| Focused source regressions above | 0 | 2 files, 27 tests passed. |
| `pnpm test:role-image` | 0 | Both builds and all compiled direct/dispatcher readiness, shutdown and refusal checks passed. The full gate below also passed this stage with development-role configuration matching the lead's reproduction. |
| `pnpm typecheck` | 0 | All workspace typechecks passed. |
| `pnpm test` | 0 | Complete standard gate passed: 85 Vitest files, 1,624 tests; 32 contract tests with 1 existing conditional fork skip; both app builds; 8 compiled direct/dispatcher SIGTERM checks, 2 SIGINT checks, and 10 startup refusals. |
| `pnpm brand:check` | 0 | 119 files including built web assets. |
| `pnpm check:addresses` | 0 | 268 source files. |
| `git diff --check` | 0 | No whitespace errors. |

Completed process `75166`, exit **0**, log `/tmp/eko-082b-test.log`; focused log `/tmp/eko-082b-focused.log`; typecheck log `/tmp/eko-082b-typecheck.log`; standalone compiled-role log `/tmp/eko-082b-role-image.log`. Paid provider cost is **$0**; RPC responses are fixtures, not live evidence. The lead rebuilds the image outside this sandbox; no container verification is claimed for this follow-up.

Followed BACKEND §§1.2, 19 and the existing public API error contract. No new `TODO(spec)` or feature dependency was introduced; unavailable roles and real Postgres/container checks remain as reported for 082.
