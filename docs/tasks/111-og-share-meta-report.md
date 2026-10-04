# Task 111 report

Candidate: `6b5e71b4f65cb0d43867c0c218a1a9ae15d2e5a2` plus the uncommitted changes listed below. No commit, push, deployment, publication, external message or paid provider run. No migration needed; 0032 remains unused.

**Status: metadata implemented; production PNG rendering blocked by unavailable offline dependencies.** This packet is not ready for launch acceptance of its PNG requirement.

Changed areas:

- `apps/og-renderer/package.json`, `tsconfig.json`, `src/index.ts`, `test/renderer.test.ts`: narrow public card projection, inert clipped names/symbols, fixed 1200×630 share and 1200×675 reply layouts, required footer disclosures, satori/resvg adapter, font fingerprinting, bounded content-hash cache, image hashes and dimension checks. The adapter accepts the spec-named implementations; those implementations are not installed or wired into production.
- `apps/server/src/http/share.ts`, `src/app.ts`, `test/share.test.ts`, `test/web-fallback.test.ts`: escaped server head injection for scan/bag/receipt/coin routes, exact public path allowlist, configured canonical origin rather than request headers, public metadata endpoint for in-app navigation, per-path cache/CSP/security headers, conditional image ETags, reply format, and no-store 503 when the rasterizer is unavailable. Bags read only the persisted redacted public snapshot; receipt metadata projects only anchoring status. No journal, salt, key, wallet or dollar-value projection. The existing fallback fixture now includes the specified head marker and preserves the original strict default-document equality, boot and API 404 assertions. Ordinary SPA responses retain the template bytes; metadata is injected only for resolved public shares.
- `apps/web/index.html`, `src/App.tsx`, `src/lib/share.ts`, `src/lib/share.test.ts`: head marker and shared metadata hook using DOM text/attribute APIs; stale metadata removed on navigation to private/non-share paths.
- `packages/shared/src/contracts/share.ts`, `src/contracts/index.ts`, `test/share.test.ts`, `test/contracts.test.ts`: shared metadata schema, canonical/public URL validation, escaped unfurl markup, hostile-input tests and the required contract sample. Existing assertions remain intact.
- `apps/server/package.json`, `pnpm-lock.yaml`, `Dockerfile`: new workspace declaration, offline lockfile importer update, and package-manifest copy for image builds. No existing dependency versions changed. No edits to `docs/eko/`, Guard design or prototype.

Specs followed: BACKEND §15.6 and §23 CA-26; FRONTEND §4.8 and §9; MARKETING §§04–05. Consumes task 107 persisted scans, task 109 redacted bag snapshots and task 081 receipt lookup. Uses task 037 shared Guard copy adapters and neutral metadata titles; does not modify Guard evaluation, negotiation or activation.

## Validation

Earlier focused exits listed below are historical focused evidence; the final combined server/shared checks and final four gates cover the delivered source. All pnpm script runs used the process-local environment `pnpm_config_verify_deps_before_run=false` after dependency restoration. This prevents pnpm 11 from automatically reinstalling dependencies before scripts; it does not change tests, assertions, worker limits or timeouts. `VITEST_MAX_WORKERS=2` was used for the full test gate.

| Command | Exit | Evidence |
| --- | --- | --- |
| `pnpm --filter @eko/server test test/share.test.ts` | 0 | 5 tests, actual Fastify app with in-memory database and injected HTTP requests; adapter image fixtures |
| `pnpm --filter @eko/og-renderer test` | 0 | 4 layout/cache/rasterizer-contract tests |
| `pnpm --filter @eko/shared test test/share.test.ts` | 0 | 3 public URL/escaping/unfurl tests |
| `pnpm --filter @eko/shared test test/contracts.test.ts` | 0 | 208 frozen contract sample tests after adding the new schema fixture |
| `pnpm --filter @eko/web test src/lib/share.test.ts` | 0 | 1 metadata replacement/private-navigation test |
| `pnpm --filter @eko/server test test/share.test.ts test/web-fallback.test.ts` | 0 | 6 tests on the final deterministic bag fixture, real receipt ID URL support, and byte-preserving fallback |
| `pnpm test:role-image` | 0 | Focused web/server builds and all compiled role boot/shutdown/startup-refusal checks |
| `pnpm typecheck` | 0 | Final full workspace typecheck; 24 seconds |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | All package tests and compiled role checks passed; 266 seconds |
| `pnpm brand:check` | 0 | 194 checked source/build files |
| `pnpm check:addresses` | 0 | 469 checked source files |
| `git diff --check` | 0 | No whitespace errors |

The earlier full gate at process 57658 was terminated by the capacity/stream interruption and has no final exit code; its partial results are not claimed as a full pass. The resumed full gate at process 67708 exited 1 after 380 seconds: 43 server files passed, while the existing fallback fixture lacked the now-required head marker. Reproduced that file alone (exit 1), updated its fixture/expected output for the specified marker without removing assertions, then passed the fallback/share files together (6 tests; exit 0). A later full gate found a random UUID collision with the short private-value test markers (exit 1); the failing share file reproduced it alone. Replaced only the public fixture UUID with a fixed neutral UUID, retaining every privacy assertion. Live receipt IDs were also confirmed to use a `verdict:` prefix; the route allowlist now accepts the raw or encoded ID and normalizes its canonical URL while rejecting encoded separators, double encoding and malformed escapes. The final focused shared URL file passed all 3 tests.

The subsequent full package tests all passed, but the compiled role check found that the default SPA response no longer matched the template bytes (full gate exit 1 after 473 seconds). Preserved default SPA bytes rather than altering that role assertion. The focused server/fallback files and complete built-role check then passed (exit 0). The final four-gate run covers this corrected candidate.

The initial full test attempt exited 1 because the contract enumeration required a sample for the newly exported metadata schema. Added that sample without changing assertions, and the focused contract file passed. Early typecheck attempts found the missing shared URL type and missing restored dependency links; both were corrected before the successful workspace typecheck.

**Fixtures versus live evidence:** no ports, network-backed chain reads, staging run, deployment or live unfurl verification. PNG tests use explicitly labeled header-only adapter fixtures. They verify requested dimensions, hashes, caching, ETags and adapter arguments; they do not verify real satori/resvg PNG encoding, glyph output, visual layout or cross-process image determinism. No actual PNG or font visual acceptance is claimed. The final full gate built the web/server assets and passed all compiled-role boot, shutdown and expected startup-refusal checks. Built role validation is part of the full test gate; no separate live verification is claimed.

## Dependency and installation evidence

- A temporary offline dependency probe for `satori` and `@resvg/resvg-js` exited 1 (`ERR_PNPM_NO_OFFLINE_META` for satori). Neither was added as an unresolved dependency. No substitute rendering implementation was introduced.
- `CI=true pnpm install --offline --no-frozen-lockfile` exited 1 (`ERR_PNPM_NO_OFFLINE_TARBALL` for an existing font package). It recreated dependency links before failing. Restored local packages from the related task 110 worktree without modifying its files, then restored missing workspace links using the current lockfile. One unused coverage package remains unavailable in the restored local environment; no coverage run is claimed.
- `CI=true pnpm install --offline --no-frozen-lockfile --lockfile-only` exited 0 and produced only the new workspace/importer entries.
- `CI=true pnpm install --offline --frozen-lockfile --lockfile-only` was cancelled (exit 130) when pnpm's supply-chain verification attempted registry access despite offline mode. A clean-checkout `pnpm install --frozen-lockfile` is unverified in this sandbox. No supply-chain policy was disabled or altered.

Next concrete step: make the two spec-named renderer packages available, declare them in the renderer workspace and refresh the lockfile, load the existing OFL Syne brand font files, construct `new OgRenderer(satoriRasterizer(satori, Resvg, fonts), fontContentHash(fonts))`, and wire it to server boot. Native runtime dependency packaging and bundled font copying must also be validated. Then add real PNG decoding/dimension and independent-render hash checks, visually inspect both sizes with hostile/oversized fixtures, rerun the required gates, and verify clean-checkout installation. Production currently omits image metadata and returns `og_renderer_unavailable`/503 for an existing share's PNG; it never advertises an accepted renderer. Receipt and coin routes have neutral metadata without an invented image endpoint.

## TODO(spec)

- `apps/og-renderer/src/index.ts`: §15.6 gives no cache storage/retention contract; use a bounded process-local cache of 128 rendered images.
- `apps/server/src/http/share.ts`: §15.6 does not select a Guard 2 route/account quote for the share headline; its exit cost remains unavailable rather than combining quotes or snapshots.
- `apps/server/src/http/share.ts`: CA-6 exposes no aggregate bag receipt ID; the footer says unavailable rather than inventing an ID.

Additional non-spec TODO: provision/wire satori/resvg in `apps/server/src/app.ts` after the dependency blocker is resolved. No personal identifiers were ported or introduced. All fixtures use neutral values.

## Long-job checkpoint and reproduction

Final verification logs: `/tmp/eko-111-verify-test.log`, `/tmp/eko-111-verify-typecheck.log`, `/tmp/eko-111-verify-brand.log`, `/tmp/eko-111-verify-addresses.log`; gate results: `/tmp/eko-111-verify-results.json`; checkpoint: `/tmp/eko-111-checkpoint.txt`. Workspace/home paths are redacted from the log. Candidate is the base revision plus this uncommitted packet; unrelated source did not change during validation. Final process initially: 98754, tool session 24782; all four gates completed with exit 0. No gate or build remains running. Final measured gate wall time: 266 seconds for tests, 24 seconds for typecheck; brand/address gates each completed in under one second. Next action for the lead is offline dependency provisioning and real PNG integration/acceptance, not repeating these completed gates solely for handoff.

Reproduce checks from the worktree root after preparing dependencies:

```sh
export pnpm_config_verify_deps_before_run=false
pnpm typecheck
VITEST_MAX_WORKERS=2 pnpm test
pnpm brand:check
pnpm check:addresses
```

Paid provider request units: 0; paid provider spend: $0. Local CPU/model cost was not measured. Test and build evidence is offline fixture evidence, not launch-performance, deployment or release approval evidence.


## Renderer completion — 2026-10-03

**Status: real deterministic PNG rendering implemented and all five required gates passed.** This section supersedes the earlier renderer dependency blocker; the earlier session's adapter-only evidence remains historical. Candidate: `c9168b3d2345b887ea600ddc86e961bf537d0e45` plus this uncommitted renderer work. No commit, push, deployment, publication, provider request or dependency change.

Changed areas:

- `apps/og-renderer/src/index.ts`, `src/runtime.ts`, `src/og-assets/worker.mjs`: inert, clipped satori element trees → embedded-font SVG → native resvg PNG. Both 1200×630 share and 1200×675 reply formats retain verdict, top playbook, agent share, exit cost, coverage/pending labels and complete disclosures. The worker uses the installed exact pins (satori 0.33.5 / @resvg/resvg-js 2.6.2), disables remote assets and system-font loading, and loads the bundled OFL Syne regular/semibold TTFs. Font bytes participate in the content hash. `src/og-assets/fonts/` contains unchanged copies of the existing web TTFs and their OFL license; no font conversion or dependency additions.
- Rendering stays off the API thread: one lazily started CPU worker, eight queued jobs maximum, a five-second deadline including queue time, termination on stalled work, and a 128 MiB worker JavaScript heap limit. Duplicate content shares one pending result; at most nine unique renders can be pending. Shutdown terminates the worker. The process-local LRU is bounded by both 128 images and 32 MiB of PNG bytes. Failures are not cached.
- `apps/server/src/app.ts`, `src/http/share.ts`: default renderer wiring with unavailable fallback; explicit no-store 503 responses for unavailable/busy/timed-out work and retry headers. Scan/bag routes and ETags consume real PNGs. Bag input remains exclusively the persisted public snapshot; empty bags retain explicit unavailable fields. Beta remains until the supplied legacy flow flag clears; Guard 2 remains beta-tagged. Guard reasons are no longer substituted for a top-playbook field, and absent Guard 2 classification/confidence/exit-selection data stays unavailable.
- `apps/server/build.mjs`, `scripts/check-role-image.mjs`, `scripts/fixtures/role-image-fastify.mjs`: copy/verify the worker and OFL assets beside bundled server entry points; the compiled API fixture now creates a pending scan and requests a real PNG through the default renderer. The existing Dockerfile still copies the og-renderer workspace manifest and deploys the server's production workspace dependencies; no package manifest or lockfile changed.
- Renderer/server tests add real PNG signature, IHDR dimensions, IDAT inflation and nonempty pixel evidence; byte equality and SHA-256 equality across independent renderer workers in both sizes using hostile oversized names; LRU entry/byte bounds and pending-work limits; stalled-worker termination/recovery; real scan/bag HTTP images; valid missing IDs, pending/empty data, beta-gate behavior and busy/timeout responses. Existing assertions and tests remain intact.

Specs followed: BACKEND §15.6 (line 2408), §23 CA-26; FRONTEND §4.8 and disclosure rules; MARKETING §§04–05. No spec files changed. No personal identifiers or secrets were introduced or ported; fixtures use neutral values.

### Final validation

These results cover the stable final source; only this report was appended afterward. Required commands ran without dependency/policy changes. The full test command used `VITEST_MAX_WORKERS=2`.

| Command | Exit | Evidence |
| --- | --- | --- |
| `pnpm --filter @eko/og-renderer test` | 0 | 7 focused tests, including real native PNG encoding/decoding and independent-worker determinism |
| `pnpm --filter @eko/server test test/share.test.ts` | 0 | 7 focused share tests, including real images and beta/empty states |
| `pnpm typecheck` | 0 | Full workspace; 26.4 seconds |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | Full package suite and its compiled-role gate; 341.8 seconds |
| `pnpm brand:check` | 0 | Required standalone gate; 0.3 seconds |
| `pnpm check:addresses` | 0 | Required standalone gate; 0.3 seconds |
| `pnpm test:role-image` | 0 | Separate final web/server build and compiled-role gate; 38.8 seconds; bundled API rendered real PNGs |
| `git diff --check` | 0 | Final whitespace check |

Early focused rendering found a CommonJS export mismatch in the pinned satori package; using its CommonJS default export fixed it. An added pending-state fixture initially used an ID outside the existing public allowlist; it now uses a valid neutral scan ID. Neither correction weakened a test or changed the allowlist.

Visual QA: generated and inspected both sizes with oversized hostile names, a long coverage gap and unavailable fields; names are inert/clipped and the complete disclosure footer is visible. Local fixture artifacts: `/tmp/eko-111-share.png`, `/tmp/eko-111-reply.png`. These are local raster/layout evidence, not chain data, deployment, live unfurl or label-gate acceptance. Determinism is verified across independent workers with the pinned fonts/runtime in this environment; cross-platform byte equality is not claimed.

Docker limitation: daemon access is denied by the sandbox. No Docker build was attempted after that denial, and no Linux container build or clean-checkout dependency installation is claimed. The required role-image command did pass, including resource-byte checks, production bundle startup, workspace/native dependency resolution and real PNG routing. A Docker-capable environment remains necessary to verify the actual container build.

### Remaining TODO(spec)

- Renderer cache retention/storage is unspecified: use process-local LRU, 128 images / 32 MiB.
- §15.6 does not select a Guard 2 route/account quote for the exit headline: keep the exit cost unavailable rather than combine quotes or snapshots.
- Guard 2 has no top-playbook field: keep it unavailable rather than reinterpret Guard reasons as classifications.
- CA-6 has no aggregate bag receipt ID: keep it unavailable.

These are explicit unavailable projections, not renderer blockers. The earlier provisioning/wiring TODO is resolved. No additional dependencies or migrations are needed.

Final gate logs: `/tmp/eko-111-render-typecheck.log`, `/tmp/eko-111-render-test.log`, `/tmp/eko-111-render-brand.log`, `/tmp/eko-111-render-addresses.log`, `/tmp/eko-111-render-role.log`; results `/tmp/eko-111-render-results.json`; checkpoint `/tmp/eko-111-render-checkpoint.json`. Workspace paths were redacted in the final logs. All gate processes finished; no build/test remains running. Reproduction: run the five required commands above from the worktree root with the installed dependencies. Paid provider spend/request units: $0 / 0; local CPU/model cost was not measured. Work remains uncommitted.
