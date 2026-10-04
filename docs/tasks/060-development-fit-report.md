# Task 060 · Development fitting and frozen candidate report

Prepared locally and left uncommitted for the lead. **No accepted candidate exists.** Guard V2 remains shadow/inactive; history and bucket estimation remain disabled. Fixtures establish implementation behavior, not measured validation, independent human approval, release or deployment. No real labels, paid acquisition or held-out test inspection occurred.

## Changes and specification

| File | Change |
| --- | --- |
| `apps/engines/src/development-fit.ts` | Engines-local preregistration, 058 purge/component recomputation, frozen primary truths, development-only signed 059 imports, 054 fidelity and factual/attribution/text/restriction audits, finite scoring projections, validation-only selector and content-hashed candidate freeze. |
| `apps/engines/src/development-fit-statistics.ts` | Inclusion-weighted primary-cohort metrics, seeded 2,000 component bootstrap resamples, unavailable-denominator intervals, distinct-token counts, separate factual High reporting and prescribed tie-breaks. |
| `apps/engines/src/development-fit-cli.ts` | Explicit fixture-only offline driver; candidate/source digests, exclusive directory ownership, immutable evidence/freeze/report/checkpoint and identical-source resume verification. |
| `apps/engines/src/index.ts` | Exports local fitting/statistics helpers; starts no worker and changes no active configuration. |
| `apps/engines/test/development-fit-fixtures.ts` | Neutral synthetic cohort, entry snapshots, primary outcomes and optional in-memory synthetic signed decisions. Saved run has no judgments. |
| `apps/engines/test/development-fit.test.ts` | 14 checks covering fixture non-acceptance, hashes, held-out/purge/group rejection, signed audits, frozen entry/exit/config, unavailable entries, compatibility/allocation, completeness floors, weighted clustered intervals, selection and durable ownership/resume/tamper refusal. |

Followed Guard 2.0 §§8.3–8.4 and 9.1–9.4, reading the 053 incremental/performance, 054 benchmark, 058 acquisition and 059 label implementations and packets, existing scoring/registry/allocation/history contracts, FACTS §§6–7, backend §§2, 3.1–3.2 and 6.2, and marketing §04. No spec files were edited. No active API, web, trading, fee or custody path changed. No dependencies were declared or installed; lockfile unchanged. Reserved migration 0183 is unused. No personal identifiers were introduced or copied. Existing tests were not changed, removed, skipped, weakened or given larger timeouts.

The fitter recomputes the frozen probability draw and transitive accepted/suspected/unresolved components. Earlier crossing components and the 3,900-second primary purges cannot enter selection. Only included fitting/validation case payloads, judgments, features, truths and fidelity evidence are admitted. Locked/purged review payloads and all held-out decision revisions are rejected before importing answers. Locked-test metadata remains in the cohort/sampling denominator; test judgments and feature payloads remain outside the fitter.

Primary truth remains `(token,60,size,class)` with fixed 3,600-second exit, return ≤−30% or verified no-exit at the valid scheduled state. Entry failure is not invested loss; unsupported/provider/indeterminate outcomes remain unknown. Truth hashes freeze the externally assembled benchmark normalization; benchmark hashes and evidence must be pinned to development review cases. Features must match entry cursor, availability cut, profile and cohort. Existing pure scoring validates available measurements; the fitter performs local integer point projections and never constructs an active registry or production verdict.

There are **1,035** preregistered trials: bands 25/30/35 and 55/60/65; base and ±20% uniform/one-factor point schedules, rounded half upward; fixed singleton/family/prefix, leave-one-out and facts-only masks. Compatibility removal, factor-sum allocation and optional history are diagnostics only. Eligible heuristic candidates require leave-one-factor-out precision/recall improvement without degrading those metrics. Optional history cannot enter selection; its incomplete enumeration/control gaps remain visible. Buckets have no conservation acceptance and remain disabled.

Selection uses validation only: fewest enabled heuristic factors, highest High precision, highest High-only recall, least absolute starting-parameter deviation, then ascending parameters hash. Confidence uses frozen component groups and exact inclusion weights, never weighted Wilson or independent counting of correlated paths. Undefined bootstrap denominators invalidate the interval. Missing-tier Elevated floors and Incomplete are not detected-harm successes. Confirmed current facts/capabilities have separate factual High reporting. Policy-level denials are separate diagnostics and explicitly do not represent full preflight checks.

The 100-coin minima are **untouched-test requirements**, separately recorded with development credit false. Development applies numerical precision/recall/Lower conditions with defined nonempty denominators and component intervals; no development count can satisfy an untouched-test gate. A measured eligible development candidate could be frozen as awaiting untouched test; every output still has `acceptedCandidate: null`, shadow/inactive and unreleased status. Full release evaluation belongs to the following packet.

`TODO(spec)` in `development-fit.ts`: §9.4 specifies a finite grid but not its full Cartesian extent, offline wire format or cross-cohort precision/recall aggregate. The bounded schedules above and engines-local envelopes are the smallest implementation; ranking uses the minimum precision/recall across the four primary size/account cohorts. A different grid/method/truth/source/label revision needs a new preregistration and immutable output. There is no spec conflict or silent threshold/strategy change.

## Fixture coverage, gaps and next action

The saved run has 12 synthetic enumerated/selected tokens: 3 included fitting, 3 included validation, 3 locked test and 3 primary-purged. Development contains 6 tokens and 24 explicit $100/$1k EOA/contract primary units. Required development judgments: 12; submitted: **0**; missing: **12**. Measured tokens, real fidelity matches, independent human judgments and held-out labels/features inspected: **0**. All 1,035 trials are ineligible. Selected/frozen parameter payload and parameters hash are null; the starting-parameter hash is diagnostic only. The freeze records `no_eligible_development_candidate`, not a fixture candidate promoted as accepted.

Measurement, factual review, attribution, text and restriction gates remain unpassed; no population accuracy or release-gate pass is claimed. The synthetic fixture declares enumerated launch coverage only, with funding/recycling/history/comparator sources unavailable. Six local development paths are not measured chain coverage or completed observation time. Signed-decision unit tests exercise synthetic import behavior separately, with ephemeral private signing material kept in memory only.

Remaining external work: complete 058 measured acquisition/population/follow-up; provision and verify independent human roles and judgments through 059; assemble actual pinned 054 primary benchmark/fidelity artifacts, supported class/venue coverage and development audit assertions; resolve labels and pass development gates before freezing a candidate. Independent validity of source normalization, signed role-to-human attestations and benchmark/review evidence remains external work. Do not interpret a referenced artifact hash as certification that an execution path was measured. The separately approved history study, bucket conservation, untouched test, operational/parity/live-shadow evidence and release remain pending.

Actual remote acquisition: **0 requests, 0 request units, $0 paid cost**. Pricing evidence is unknown/null; no provider pricing, invoice or paid coverage is assumed. No provider, network connection, port, database write, paid transport, recurring job, commit, push or deployment was used. The fixture process and identical resume complete locally; no acquisition or fitting process remains running after completion.

Next action: lead reviews this uncommitted implementation, completes measured acquisition and independent development labels, then prepares a new measured development input and output. Keep all locked-test payloads outside that input. A successful development freeze is only preparation for separately evaluated untouched-test and release gates, never activation.

## Reproduction

From the repository root, prepare a fresh directory. Fixture signing public keys change when regenerated, so new input digests are expected; reproduce identical resume against the same saved input.

```sh
pnpm --filter @eko/engines exec node --import tsx --input-type=module -e 'import {mkdir,writeFile} from "node:fs/promises"; import {developmentFitFixture} from "./test/development-fit-fixtures.ts"; await mkdir("/tmp/eko-060-reproduction", {recursive:true}); await writeFile("/tmp/eko-060-reproduction/input.json", JSON.stringify(developmentFitFixture()));'
pnpm --filter @eko/engines exec node --import tsx src/development-fit-cli.ts --fixture /tmp/eko-060-reproduction/input.json /tmp/eko-060-reproduction/output
```

Repeat the second command to verify immutable resume. Inspect the stopped process/checkpoint before removing any stale `runner.lock`. Altered source/config/truth/labels or a changed candidate requires a new output; the driver refuses overwrite, concurrent ownership and missing/changed artifacts. The CLI accepts fixture input only; real work requires an externally prepared and verified measured workflow, not relabeling a fixture.

## Revision, artifacts and checkpoint

Starting source commit: `2427aef1282e2f54b32c7887dbe6bc6ed5f9ae2e`; initial working tree clean. Candidate is uncommitted. Sorted relative-path/content SHA-256 over the six source/test files above (NUL separators; report excluded): `a9210bb356b6e8d9a8d09f6f23b47e8a23a054893662950ce7471da444155245`, saved in `/tmp/eko-060-source-test.sha256`.

| Pin | Actual saved final fixture digest |
| --- | --- |
| CLI implementation/candidate revision | `0x4fcdde695f5be5b9b878caf829165ceae3ddea5db6ad82b10474bfe8016b4f3b` |
| Fixture input/source revision | `0x89c44c0240ff539154f5f4e32c5069c87c90f215b85ca6296fbe22898b22a5dd` |
| Method hash | `0xda1e988dfb95f730521709939b5ecee620e433143a1d13acf4c44daea4f19df7` |
| Grid hash | `0x4715428f85018725734d34acc6b6390680a18f25817618f95e437e2603b43bd6` |
| Frozen primary truth hash | `0x0d94907fe3806aa094ce8a595035c5b15f83eb9c7f402c63dc9c773eba8cd7d6` |
| Empty development label-set hash | `0xe747059700a8f35908837d10dc0ab149ac548e8f305609ff3aea1c9b364e5a8f` |
| Calibration/evidence hash | `0xa463ac2eb673b076776346f6dc4bae1c9039630d88295026019655d9b93aeb7b` |
| Freeze hash | `0x1571040cda6e9c8760c8e261f85a285fc7cf93e9c595b7f4f646a5d45e1fef45` |

These are actual content pins, including uncommitted code; none establishes measured correctness or acceptance. The baseline diagnostic parameters hash is `0xe7e104ff5e7b620ff40ce17eb60598d963373ff8607ad02673178d7436105e14`; candidate parameters hash is **null**.

Final saved input: `/tmp/eko-060-fixture/input-final.json`. Final output directory: `/tmp/eko-060-fixture/output-final`, containing `evidence.json`, `freeze.json`, `report.json` and `checkpoint.json`. Checkpoint status: `prepared`; next action: `obtain_measured_development_and_independent_labels_before_candidate_selection`. Completed ranges are the six synthetic included development tokens, with all 1,035 trials and diagnostic ablations evaluated; no measured range is complete. Run and identical resume exited 0. Logs: `/tmp/eko-060-fixture-prepare-final.log`, `/tmp/eko-060-fixture-run-final.log`, `/tmp/eko-060-fixture-resume-final.log`. Earlier fixture output remains preserved in the same parent directory and is not the final candidate evidence.

The final preparation reused the saved synthetic assignment/public keys, recomputed preregistration after the method correction, and wrote a new input/output instead of replacing the earlier freeze. Per-trial summaries include prediction-row hashes; detailed selected/baseline validation, fitting and ablation rows remain available. This reduced the six-token fixture evidence from 11 MB to 6.7 MB without dropping metrics or weakening validation. Evidence is local fixture output, not released material.

## Checks and evidence

| Exact command | Exit code / observed evidence |
| --- | --- |
| `pnpm --filter @eko/engines exec vitest run test/development-fit.test.ts` | 0 on final source; 14/14 tests, `/tmp/eko-060-focused-stable.log`. |
| `pnpm --filter @eko/engines typecheck` | 0 on final source; `/tmp/eko-060-engines-typecheck-final.log`. |
| `pnpm typecheck` | 0; workspace typecheck, `/tmp/eko-060-typecheck-stable.log`. |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0; all workspace suites, builds and role-image fixtures, `/tmp/eko-060-test.log`. Engines: 468/468 tests; final affected fitting suite separately passed 14/14. |
| `pnpm brand:check` | 0; 209 files including built artifacts, `/tmp/eko-060-brand.log`. |
| `pnpm check:addresses` | 0; 542 source files, `/tmp/eko-060-addresses.log`. |
| `pnpm --filter @eko/engines exec node --import tsx src/development-fit-cli.ts --fixture /tmp/eko-060-fixture/input-final.json /tmp/eko-060-fixture/output-final` | 0 for preparation and identical resume; final run/resume logs listed above. |
| `git diff --check` | 0 on final source/report. |

The final preparation command reused the saved fixture to preserve its opaque public keys:

```sh
pnpm --filter @eko/engines exec node --import tsx --input-type=module -e 'import {readFile,writeFile} from "node:fs/promises"; import {preregisterDevelopmentFit} from "./src/development-fit.ts"; const f = JSON.parse(await readFile("/tmp/eko-060-fixture/input.json","utf8")); f.preregistration = preregisterDevelopmentFit(f.acquisition); await writeFile("/tmp/eko-060-fixture/input-final.json", JSON.stringify(f));'
```

It exited 0 (`/tmp/eko-060-fixture-prepare-final.log`). Logs use neutral workspace/home placeholders. Commands were wrapped by a local output sanitizer; the exact underlying check commands and environment are those above.

The initial engines typecheck exited 2 on new local TypeScript inference/narrowing errors; these were corrected. Two focused runs hit the existing default five-second test limit in the fixture driver test under load. The first unchanged isolated rerun passed 14/14. The later occurrence exposed duplicated artifact serialization; per-trial summaries/prediction hashes reduced output, and the final unchanged-timeout focused suite passed 14/14. No timeout, assertion or existing test was relaxed. The workspace test gate had no test failures or failing-file reruns.

The workspace engines portion completed before the final per-trial serialization reduction. Final-source focused fitting tests and engines typecheck were rerun successfully; unaffected completed workspace tests were reused. Workspace typecheck was run again on the stable final source. The final workspace gate passed 3,661 TypeScript tests and 38 contract tests; its existing fork-test skip remains unchanged because `RPC_HTTP_URL` is unset. This packet added no skip. Builds and role-image fixtures used no ports/providers or deployment. No background job remains running.
