# Task 059 · Independent labels and adjudication import report

Prepared locally and left uncommitted for the lead. Guard V2 remains shadow/inactive. Fixture validation establishes import behavior, not measured chain validation, independent human sign-off, release or deployment. No real labels, reviewer assignments or adjudications were created.

## Changes and revisions

| File | Change |
| --- | --- |
| `apps/engines/src/label-completion.ts` | Blinded assignments tied to the recomputed 058 cohort and 057 draw; exact inclusion probabilities/weights; externally attested opaque reviewer/adjudicator IDs and public keys; signed 055 decision validation; append-only revisions; unresolved/disputed states, designated adjudication queue, basis/control reversal inspection and label-set hash. |
| `apps/engines/src/label-completion-cli.ts` | Fixture-only offline driver with candidate/source digests, exclusive output lock, immutable assignments/ledger/report/checkpoint and identical-source resume. |
| `apps/engines/src/index.ts` | Exports the functions without activating any worker. |
| `apps/engines/test/label-completion-fixtures.ts` | Neutral synthetic cohort/cases/roles; ephemeral in-memory signing material and explicitly synthetic test decisions; preparation fixture has no judgments. |
| `apps/engines/test/label-completion.test.ts` | 15 focused tests for blinding, counts/weights, signatures, evidence, independence, immutable revisions, pending/unresolved/disputed/adjudicated states, reversals, changed provenance and durable fixture ownership/resume. |

Starting source commit: `c3daf6ca5b666b4ab660d1d12fa682f1ff80b349`; initial working tree clean. Candidate remains uncommitted. Sorted relative-path/content SHA-256 over the five source/test files above, using NUL separators: `2993c7b011118522e258599522d46f1642ddbc6c9b184ee6d734df6103e5aca0` (`/tmp/eko-059-source-test.sha256`); report excluded.

CLI candidate digest: `0xfb4bdbf6fac0b30c8362c15f691d6a79ed00851d1435ad5829f4d53809876ae4`. Saved fixture input/source digest: `0xb9d14ef13f92599ae35e8f9090010f1fab4e91182d9f3627ca39fd395746e915`. Assignment hash: `0x90dbaeac8a7c9c955eb5f9fc19ee268a18cde649b87fe6f9e62d7ef5e1e61d9f`. Label-set hash: `0x5746bce1e598c58a49556b1919e4c41a44f9fa14ad66e07e08f6a2b8c5523135`. Artifact hash: `0x459fcf711fcb8e0a170661742c4846bd2bc5e522227098a62681ac1748bcca62`. Digests bind actual contents, including uncommitted source; none is a claim of human correctness.

Followed Guard 2.0 §9.3 and the 055/056 immutable/blinded review contract, 057 frozen probability design and 058 cohort/purge/group boundaries. Read their cited implementation and FACTS §§6–7, backend §§3.1–3.2 and marketing §04 claims rules. No active API, web surface, money path or feature configuration changed. No spec conflict. No dependencies or lockfile change; reserved migration 0182 unused. No personal identifiers were introduced or copied. Existing tests were not changed, removed, weakened, skipped or given larger timeouts.

## Import boundary and external gaps

Assignments contain every selected token, even primary purges/group holdouts, with original exact `n_h/N_h` probability and inverse weight. Missing case snapshots remain explicit nulls; missing roles remain explicit nulls. The importer recomputes the draw and cohort, checks each 055 case hash and provenance pins, and rejects duplicate/extra tokens. Smaller complete frames are reported as such; missing reviewers never reduce the denominator. The unequal-weight test draws 600 from 1,200 synthetic tokens and requires 1,200 independent judgments, retaining 100/200 and 500/1,000 probabilities.

Scores, new/legacy levels, allegations and reviewer answers are absent from assignment exports; closed schemas reject these additions. Assignment hashes use blinded case identity, avoiding digests of hidden scores. Imported decisions and the adjudication queue are coordinator artifacts, separate from the pre-submission assignment export. Existing 055/056 session-based reveal remains unchanged. Test scores never enter this import or adjudication queue.

Signatures use Ed25519 public keys in the frozen opaque role roster. Each signature covers the version/domain, assignment hash, origin, entire immutable 055 record (including timestamp/revision/evidence) and, for reviewers, the independent-submission declaration. The record ID is checked using the existing 055 hash algorithm. Both reviewers and the adjudicator require distinct pseudonyms/keys, chain-literacy and independence attestations; no independent role may be the rule author. Evidence must be unique and pinned to the case, with sanitized nonempty Untrusted rationale. Attestation authenticity, key-to-human binding, chain literacy, honest blindness and actual independence require external verification; signatures cannot establish these human facts.

The importer accepts originals plus a prior signed ledger, never overwrites a decision, and preserves both reviewer chains and all adjudication revisions. Revised decisions must form contiguous supersedes chains. Disagreements, including differing unresolved answers, route to the designated adjudicator only after both submissions. Adjudications must reference the independent decisions current at their signed submission time. Later label revisions make old adjudication stale while preserving it and reopening the queue. Unresolved adjudication remains unresolved. Comparisons record changed questions, control/responsibility/origin reversals and evidence/rationale/reason-support basis changes.

`TODO(spec)` in `label-completion.ts`: §9.3 has no offline signature/provisioning wire contract. The smallest implementation is an engines-local Ed25519 envelope over 055 records with one externally assembled pinned token case per draw member. Additional trajectory evidence must be assembled externally into the case panels/linked benchmark artifacts; this packet does not produce buyer outcomes or certify trajectory coverage. A changed case revision/cohort/role roster/label version requires a new frozen assignment and output, preserving older artifacts. No database migration or new public wire contract is introduced.

Actual human work is **blocked**: the 058 prospective definition still has no completed population/draw; measured selected-token count and required judgment count are unknown. Initial policy target remains 600 tokens/1,200 independent judgments before disputes, subject to a genuinely smaller enumerated frame. Actual imported human judgments: **0**. Two independent chain-literate reviewers, a designated adjudicator, verified role/key attestations, pinned source/case evidence, signed decisions and resolution of disagreements remain required. No invented labels or release-gate pass fills these gaps. Full release evaluation is outside this packet; all outputs retain shadow/inactive status.

## Fixture run, usage and checkpoint

The saved preparation fixture contains 12 synthetic enumerated/selected tokens with probability 12/12 and inverse weight 12/12. Required judgments: **24**; submitted: **0**; missing: **24**; independent/adjudication revisions: **0/0**. The blocker is `independent_judgments_missing`, and fixture import completion is false. Resolved/adjudicated synthetic tests exercise completed-import behavior separately, always with measured-human-validation false and no release.

Actual remote acquisition: **0 requests, 0 request units, $0 paid cost**. Pricing evidence and actual human-review pricing are unknown. No measured acquisition coverage or elapsed observation completion exists. The fixture declares complete synthetic source coverage only. No provider, port, paid transport or recurring job was used.

Process: fixture preparation and identical resume completed (exit 0); no acquisition/review process remains running. Artifacts: `/tmp/eko-059-fixture/input.json`, `output/assignments.json`, `output/artifacts.json`, `output/checkpoint.json`, `output/report.json` under the same fixture directory. Checkpoint status: `prepared`; next action: obtain verified independent human work. Logs: `/tmp/eko-059-fixture-prepare.log`, `/tmp/eko-059-fixture-run.log`, `/tmp/eko-059-fixture-resume.log`. These logs use neutral workspace prefixes.

Next action: lead reviews the uncommitted import and assignment contract, then completes 058 enumeration/acquisition and externally provisions verified independent roles and pinned cases before collecting signed human judgments. Carry the full prior signed ledger into `previous` for each continuation, use a new immutable output for changed inputs, and preserve originals/checkpoints. Evaluate actual labels and resolve disputes separately; this packet performs no release or paid acquisition.

## Reproduction and checks

From the repository root, use a fresh directory for fixture generation (ephemeral signing public keys change on regeneration):

```sh
pnpm --filter @eko/engines exec node --import tsx --input-type=module -e 'import { mkdir, writeFile } from "node:fs/promises"; import { labelCompletionFixture } from "./test/label-completion-fixtures.ts"; await mkdir("/tmp/eko-059-reproduction", { recursive: true }); await writeFile("/tmp/eko-059-reproduction/input.json", JSON.stringify(labelCompletionFixture()));'
pnpm --filter @eko/engines exec node --import tsx src/label-completion-cli.ts --fixture /tmp/eko-059-reproduction/input.json /tmp/eko-059-reproduction/output
```

Repeat only the second command to verify identical resume. `assignments.json` is the blinded handoff; `artifacts.json` preserves signed import history. Changed source/candidate/input needs a new output; the driver refuses silent replacement and concurrent `runner.lock` ownership. Inspect the stopped process/checkpoint before removing a stale task lock. The driver rejects measured input and execution flags. Signed decision/adjudication workflows are exercised by the focused fixture tests, with private signing material created in memory only.

| Exact command | Exit code / evidence |
| --- | --- |
| `pnpm --filter @eko/engines exec vitest run test/label-completion.test.ts` | 0; final 15/15 tests, `/tmp/eko-059-focused.log`. |
| `pnpm typecheck` | 0; `/tmp/eko-059-typecheck.log`. |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0; all workspace suites, builds and role-image checks passed; engines 376/376 tests, `/tmp/eko-059-test.log`. |
| `pnpm brand:check` | 0; 159 files including built artifacts, `/tmp/eko-059-brand.log`. |
| `pnpm check:addresses` | 0; 467 source files, `/tmp/eko-059-addresses.log`. |
| `git diff --check` | 0 on final source/report. |

The initial engines-only typecheck exited 2 on nullable-role narrowing and two test-fixture types; these were corrected. The final focused tests and workspace typecheck then passed on the candidate above.

The final full gate passed 3,150 TypeScript tests and 34 contract tests. The existing contract fork-test skip remains unchanged with its RPC URL unset; this packet introduced no skips. No timing failures or failing-file reruns occurred. Builds and role-image checks used fixtures, with no ports, providers or deployment. No background job remains running.
