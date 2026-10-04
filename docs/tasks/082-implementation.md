# Packet 082 implementation report

Candidate: base `42ccea5ebd58847e8875c30667dc559d0d34b912` plus the uncommitted packet 082 diff. No commit, push, deployment, publication, external message, paid job or live chain acquisition was performed. Provider cost: **$0**. The local environment uses Node 26.0.0 and pnpm 11.5.1; the image targets Node 22.

## Changes and scope

- `Dockerfile`: copies all 12 workspace manifests before frozen installation; builds web and the implemented runtime bundles; retains both heritage and chain/engine migration trees. Defaults API replicas to `RUN_WORKER=false` and trading to off. Starts the closed dispatcher. Removes the inherited API-only image healthcheck; service-specific probes remain operations work.
- `.dockerignore`: excludes nested environment files, runtime secrets directories, PEM files and key files from the build context.
- `apps/server/build.mjs`: emits API/worker, indexer, engines and dispatcher bundles; copies chain/engine migrations, the address registry and ABI assets. Docker sets the absolute runtime registry path, avoiding source-relative lookup after bundling.
- `apps/server/src/roles.ts`, `launch.ts`: selects one implemented entry point; rejects unknown, missing and unavailable roles without an API fallback. API children always receive `RUN_WORKER=false`; only the dedicated worker receives `true`. Trading flags are preserved, never enabled by dispatch. Postgres session advisory locks exclude duplicate worker, live indexer and engines owners; the parent retains ownership through child shutdown, forwards SIGINT/SIGTERM, bounds draining, and terminates the child on loss of ownership. Local PGlite retains its existing directory process lock.
- `apps/server/src/index.ts`, `config.ts`: reuses the existing reconciler for the worker role without listening on an HTTP port; validates production Postgres and API-only configuration. The worker role provides the existing reconciler, not the unimplemented expiry/tier/milestone jobs listed in the process table.
- `packages/db/src/client.ts`: also rejects production PGlite when callers bypass server configuration.
- `apps/server/test/roles.test.ts`: dispatch, unavailable-role, replica, singleton, lease-loss, startup interruption, signal forwarding and image-input tests. Existing production fixtures in `config.test.ts`, `ai-gateway.test.ts` and `v1-foundation.test.ts` now provide a placeholder Postgres URL and API-only configuration; their assertions remain intact.
- `scripts/check-role-image.mjs`: reproducible offline asset and compiled-role checks using isolated in-memory fixtures.

Followed BACKEND §§1.2, 2.1, 19 and GO PLAN §4.1. The old API-only image conflicted with the multi-role spec; the implementation follows the spec. No read-only spec, Guard logic, prototype, dependencies, workspace declarations or lockfile changed. No personal identifiers were ported or added.

## Checks and evidence

| Command/check | Exit | Result |
|---|---:|---|
| `pnpm --filter @eko/server exec vitest run test/roles.test.ts test/api-read-role.test.ts test/config.test.ts test/ai-gateway.test.ts test/v1-foundation.test.ts` | 0 | 5 files, 54 tests passed on the final source. |
| `pnpm --filter @eko/server build` | 0 | All implemented role bundles emitted. |
| `pnpm --filter @eko/web build` | 0 | Web production assets built. |
| `node scripts/check-role-image.mjs` | 0 | Migration/registry/ABI asset comparisons; worker and engines startup plus SIGINT/SIGTERM shutdown; unavailable and unknown roles rejected; production API without Postgres rejected; unconfigured indexer rejected. |
| `pnpm typecheck` | 0 | All workspace typechecks passed on the final source. |
| `pnpm test` | 1 | Initial concurrent run stopped at the unchanged policy p95 assertion: 49.79 ms versus `<30` ms. This was not a passing full gate. |
| `pnpm --filter @eko/policy exec vitest run test/performance.test.ts` | 1 | 51.25 ms while other local tests were running. |
| `pnpm --filter @eko/policy exec vitest run test/performance.test.ts --maxWorkers=1 --no-file-parallelism` | 0 | Passed without competing local jobs; no policy code or assertion changed. |
| `pnpm -r --workspace-concurrency=1 test` | 0 | Complete serialized final workspace suite: 84 Vitest files, 1,621 tests passed, including all 110 server tests. Normal contract coverage: 32 passed, 1 existing conditional fork test skipped. |
| `pnpm brand:check` | 0 | 119 files, including the built web assets. |
| `pnpm check:addresses` | 0 | 268 source files. |
| `git diff --check` | 0 | No whitespace errors. |
| Clean manifest-only `CI=true pnpm install --offline --frozen-lockfile --ignore-scripts` | 1 | Lockfile resolution accepted; missing cached `@fontsource/bricolage-grotesque@5.3.0` tarball prevented installation. Separate from implementation/test failures; nothing was downloaded. |
| `docker info --format '{{.ServerVersion}}'` | 1 | Docker socket access denied. No image was built or container launched. |

An earlier server suite exposed four fixture failures from the new production constraints; those fixtures were updated, and the focused final checks above passed. The initial built-role verifier incorrectly required silence from the indexer's structured startup-error log; it now verifies that exact failure event. These were corrected check/fixture assumptions, not weakened existing assertions.

Postgres singleton behavior is tested with mocked connections; compiled worker/engines lifecycle uses PGlite fixtures. API behavior is checked by request injection without ports. There is **no isolated Postgres, container, live RPC, paid provider, deployed-service or launch-acceptance evidence**. A Postgres executable was not available and Docker access was denied. No tests or assertions were removed or skipped by this task; the normal contract suite's fork test remains conditional on its existing RPC setup.

## Dependencies, TODOs and reproduction

No new `TODO(spec)` was introduced. Existing notes in the changed source remain unchanged: deployment-address placeholders and retained legacy environment switches in server configuration, and the later heritage-schema move in `packages/db/src/client.ts`.

`mcp`, `receipts`, `bots`, `og`, `swarm` and `research` are explicitly unavailable in this candidate. Integration must add accepted executable entry points and build inputs after their owning packets land (notably 080, 093, 116 and OG packet 111). `keeper`, `sim` and the local `dev` composite are outside the image allowlist. This packet does not implement their logic or claim those features have passed release gates.

Reproduce local checks with the commands above; build the server before invoking `scripts/check-role-image.mjs`. For a clean frozen-install check, copy only the root install inputs and each workspace manifest into a new temporary directory and execute the listed offline install command there. Supply the missing package cache through an authorized environment before certifying clean installation.

When Docker and isolated Postgres are available, the outstanding checks are:

1. `docker build -t eko:082 .` with cached/authorized build inputs; inspect the final image assets and confirm runtime secrets are absent.
2. Run Postgres 16 on an isolated Docker network with no published ports. Launch two worker containers against that database using runtime-only fixture environment values: the first must own the role; the second must exit nonzero. Repeat for engines and the live indexer role; indexer startup requires a fixture metered RPC endpoint, never an unbudgeted live endpoint.
3. Stop the first owner with SIGINT/SIGTERM; verify graceful exit, released ownership and successful replacement. Terminate its Postgres connection and verify the child halts. Run API replicas with `RUN_WORKER=false` and no reconciler; verify `/v1/health` in the isolated environment. Refuse production startup without `DATABASE_URL` and unavailable roles. No external trade is required.

Completed checkpoint: serialized gate process `69930` exited **0**, log `/tmp/eko-082-test-serial.log`; final typecheck `/tmp/eko-082-typecheck.log`; built-role checks `/tmp/eko-082-role-image.log`; focused tests `/tmp/eko-082-focused.log`. All local jobs are complete. The next external check is an image build and isolated Postgres lifecycle/ownership verification in an environment with Docker access and complete package cache. No paid work is running.
