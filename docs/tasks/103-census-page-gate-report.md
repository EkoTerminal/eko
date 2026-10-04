# Task 103 report

Integration note: reserved migration `0035_census_evidence` retained its number (no renumbering). It follows `0034_security_collectors` at journal index 20 with `when` equal to the preceding entry plus 1. Integration adds the missing `meta/0035_snapshot.json`, chained from 0034 and adding only the evaluation table, plus matching snapshot and migration assertions. Both sides' routes, exports and existing assertions are preserved. The checks below describe the original branch candidate; integration check results are reported separately.

Candidate: base `913d0f7169921cf890f3d6cbadb1058057908857` plus uncommitted task 103 changes. The 22 changed/new implementation and test files, excluding this report, have combined SHA-256 `b34ca5efbf16a1b21ea9d1806f27710d8ec01b649a947bbf497371e85def9a85` when sorted by relative path and hashed as path, NUL, contents, NUL. Prepared and locally tested; not committed, pushed, deployed, live-verified, or approved for publication.

## Changes

- `apps/web/src/pages/{Census.tsx,Census.test.tsx,census.css}` and `apps/web/src/routes.ts`: replace the public Census placeholder with methodology, label definitions, confidence tiers, required disclosures, and a page-local Watch toggle. Loading, errors, failed/incomplete/expired evidence and server-gated responses show no Census measurements, numeric placeholders, or charts. Accepted responses cite the model version, model/dataset hashes, precision, Wilson lower bound and recall; show chain windows and available current-model coin shares; respect the flow availability mask. The page rechecks expiry against the existing server-adjusted clock and polling failures remove old data.
- `apps/engines/src/watcher/evaluate.ts` and `src/index.ts`: strict, separately typed Census wallet evaluation input; fingerprint inference without the declared-agent override; held-out/training overlap and duplicate checks; two distinct reviewer aliases per reviewed wallet; disagreements excluded from metrics and the minimum agreed cohorts; required declared activity; precision, Wilson 95% lower bound and recall; deterministic model/training-manifest and dataset hashes; transactional import into `eval_gates`. Missing cohorts and zero predictions remain failed evaluations. Guard buyer-harm input is rejected.
- `apps/server/src/ops/census-eval-cli.ts` and `apps/server/build.mjs`: offline `check` and explicit-destination `import` runner, also bundled as `dist/census-eval.js`. Check mode reads the supplied JSON only and stores nothing. Import validates before opening the database, applies existing migrations plus reserved server 0035, checks the current model version, and persists evidence. It does not invoke RPC, models, reviewers, or paid services.
- `apps/server/drizzle/0035_census_evidence.sql`, `drizzle/meta/_journal.json`, and `packages/db/src/flow-schema.ts`: nullable evidence hashes, expiry and cohort counts added to existing evaluation rows; old rows retained and remain unaccepted. No other migration number used. `packages/db/drizzle/0158_watcher_flow.sql` changes only the evaluation table/index creation to `IF NOT EXISTS`, permitting API migration 0035 to run before engines on a fresh database. Previously applied engine migrations are not replayed; both role initialization orders and task 102 upgrades are tested.
- `packages/shared/src/{census-gate.ts,index.ts,contracts/api.ts}` and `packages/db/src/flow-read.ts`: additive gate evidence fields and a shared acceptance predicate. Latest current-model evidence must meet precision and cohort requirements and remain unexpired. Census stays metadata-only otherwise; flow/marker reads retain beta status when evidence is unaccepted. Engine-only databases lacking server migration 0035 fail closed.
- `apps/engines/test/{census-evaluation.test.ts,census-fixture.ts}`, `apps/server/test/{census-evaluation.test.ts,census-eval-cli.test.ts}`: synthetic evaluator/import/CLI coverage. Existing `flow-census.test.ts` keeps its assertions, supplies explicitly synthetic evidence metadata for its passing gate, and freezes its existing fixture clock for expiry checks. `harness-migrations.test.ts` keeps its preservation assertions and extends the exact migration ledger expectations for 0035.

No dependencies or lockfile changes; no Guard implementation, prototype, read-only spec, secrets or personal identifiers changed. No identifiers were ported from another source. No live label precision was fabricated or imported.

## Spec and TODO(spec)

Followed BACKEND §5.7 (with §§5.1–5.6 label context and §23 Census contract), FRONTEND §3.9, GO-PLAN §§7 and 16, and MARKETING §§04–05 claims/disclosures. Task 102's finalized coverage requirement remains in place.

New ambiguities explicitly marked in source:

1. `packages/shared/src/census-gate.ts`: the spec does not state evaluation expiry; use seven days, matching the weekly fingerprint refit. Future and expired evaluations fail closed.
2. Same file: no held-out declared cohort size is specified; require at least one eligible held-out declared wallet in addition to at least 200 agreed reviewed agents and 300 agreed reviewed humans.
3. `apps/web/src/pages/Census.tsx`: the accepted API has window aggregates but no time-series samples or coin-volume field. Trend history and coin volume remain unavailable; no fabricated line or volume is rendered. This frontend requirement cannot be fully populated from the present contract.
4. Same file: `WatchBody` has no Census subscription target. Watch polls while the page is open; it creates no account-wide subscription or notification promise.

Retained task 102 ambiguity in `packages/db/src/flow-read.ts`: methodology links to `/census#methodology`; finalized coin selection remains unspecified, so the server continues returning an empty coin list. The page handles qualified supplied rows without substituting head Radar data.

## Checks

- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test src/pages/Census.test.tsx`: exit 0, 10 tests.
- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/engines test test/census-evaluation.test.ts`: exit 0, 6 tests.
- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/census-eval-cli.test.ts test/census-evaluation.test.ts test/flow-census.test.ts test/harness-migrations.test.ts`: exit 0, 23 tests.
- `pnpm typecheck`: exit 0 on the final source candidate.
- `VITEST_MAX_WORKERS=2 pnpm test`: exit 0 on the final source candidate, including all recursive workspace suites and the role-image gate. Web: 521 tests; engines: 283; indexer: 153; server: 362; MCP: 24. No isolated rerun was needed. The indexer suite completed in 286.22 seconds and server in 108.55 seconds; no timeout changed.
- `pnpm brand:check`: final post-build exit 0.
- `pnpm check:addresses`: final exit 0, 448 source files.
- `git diff --check`: exit 0.

The complete root command built the web and server (including the Census CLI bundle) and passed local role startup/shutdown, injected-route and fixture metered-RPC checks. This is build and fixture evidence, not deployment or real-provider evidence.

Initial typecheck exposed a page reference to metadata absent from the Radar flow contract; corrected to use its existing row availability mask. The initial page check caught error copy matching the evidence-section suppression assertion; the error copy was clarified and all assertions retained. No test, assertion or timeout was removed, skipped, weakened or raised.

## Dependencies and reproduction

Independent reviewers still must supply the real held-out dataset, model artifact and training-wallet manifest. The importer validates declared source/held-out assertions and reviewer distinction, but cannot independently establish real-world reviewer independence, agent identity, or training provenance. Those remain external evidence responsibilities. At least 200 agreed agent and 300 agreed human labels, eligible held-out declared wallets and precision at least 90% for the current model are required before publication. All passing precision results in tests are synthetic fixtures, never live evidence.

Use neutral reviewer aliases such as `reviewer-one` and `reviewer-two`. JSON follows exported `CensusEvaluationSchema`: `kind: census-wallet-labels-v1`, `model: {version,threshold,bias,w}`, `trainingWallets`, and wallet `rows`. Each row has `wallet`, `heldOut: true`, and the fingerprint `features`. Declared rows use `source: declared, declared: true`; reviewed rows use `source: reviewed` and exactly two `{reviewer,label: agent|human}` reviews. Numeric features, nullable missing features, and the `missing` list follow `EvaluationFeaturesSchema`. Rows are classified by this runner rather than trusting supplied predictions or precision. Dataset hashes include excluded disagreements; model hashes include the supplied training manifest.

Read-only validation:

```sh
pnpm --filter @eko/server exec node --import tsx src/ops/census-eval-cli.ts check /tmp/reviewed-census.json
```

When the lead has independently accepted the actual dataset, import into an explicitly selected local database (never use the synthetic test fixture as publication evidence):

```sh
PGLITE_DIR=.data/reviewed-census pnpm --filter @eko/server exec node --import tsx src/ops/census-eval-cli.ts import /tmp/reviewed-census.json
```

Production may supply `DATABASE_URL` through its existing secret environment, without copying values into source or command text. With a built role image, the corresponding runner is `node apps/server/dist/census-eval.js check|import <dataset-file>`. Current-model mismatch or input failure exits 1; an incomplete or subthreshold evaluation is stored as a failed gate rather than silently retaining an earlier pass. No paid run or external review is performed.

Finalized, completely ingested chain coverage and qualified crew inputs remain task 102/upstream dependencies. Until valid evidence and coverage both exist, the methodology can ship and Census headlines stay gated. The lead must merge the 0035 journal entry after other reserved server migrations using the normal integration ordering; no new engine migration is allocated here.

Reproduce the focused commands above, then `pnpm typecheck`, `VITEST_MAX_WORKERS=2 pnpm test`, `pnpm brand:check`, and `pnpm check:addresses`. No new check requires network or a listening port. Logs and process completion details follow below. Paid-run cost: zero.

## Completed process checkpoint

All task processes have completed. Root process session `44601` exited 0; final typecheck session `38189` exited 0. Checkpoint: `/tmp/eko-103-checkpoint.md`. Logs: `/tmp/eko-103-typecheck.log`, `/tmp/eko-103-test.log`, `/tmp/eko-103-brand.log`, `/tmp/eko-103-addresses.log`, `/tmp/eko-103-web.log`, `/tmp/eko-103-eval.log`, `/tmp/eko-103-server-focused.log`; corresponding `.exit` files record exit 0. Logs have workspace prefixes replaced with neutral markers. Total paid-run cost was zero. Coverage is synthetic classifier/reviewer fixtures, local SQL/migration/API/DOM behavior and built-role fixtures; no live-chain precision, independent label acceptance, deployment or publication is claimed. No job remains running. Next action: the lead reviews/integrates the uncommitted candidate; independent labels and upstream finalized coverage are still needed before publishing Census numbers.
