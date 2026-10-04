# Task 057 · Sampling and incidents report

Implemented locally and left uncommitted for the lead. Guard V2 remains shadow/inactive. This is fixture validation and prepared offline tooling, with no paid acquisition, live RPC, deployment or release.

## Changes and revisions

| File | Change |
| --- | --- |
| `apps/engines/src/probability-sample.ts` | Closed, label-free frame; priority-disjoint strata; fixed quotas and capacity redistribution; seeded rejection/Fisher-Yates draws; full frame/query/version/seeds and exact inclusion probabilities; rational population estimator rejecting missing outcomes, duplicate rows, altered designs and challenge extras. |
| `apps/engines/src/matched-source.ts` | Normalized matched-capture importer, nine finite parity questions, exact context/cursor matching, endpoint interval/history evidence, explicit price/API gaps, supply/gross/held conventions, separate fixture/measured coverage and parity counts; incident receipt-consistency checks and overlap deduplication. |
| `apps/engines/src/sampling-and-incidents-cli.ts` | Fixture-only CLI, content-pinned source/candidate artifacts, exclusive output lock, atomic checkpoint/report, identical-source resume and refusal of silent replacement. |
| `apps/engines/src/index.ts` | Exports the pure sampler and importer without worker activation. |
| `apps/engines/test/sampling-fixtures.ts` | Neutral synthetic population, reproducible seed, 100 matched records and explicit unavailable incident input. |
| `apps/engines/test/sampling-and-incidents.test.ts` | 15 tests for allocation/priority, reproducibility, weighting, finite questions, exact matching, unknown price/API/history, omissions, blinded data boundaries, incident IDs/overlaps and durable CLI ownership/resume. |

Starting source commit: `2f3c798773e08c0ebedb8f034df2c17b7a377c58`; initial working tree clean. Candidate remains uncommitted. CLI candidate digest of listed source dependencies and lockfile: `0x555ef7140cf6e793d802e133d74cbd2e3b7e862c85feb08263907df317372303`. Sorted relative-path/content SHA-256 over the six changed source/test files, with NUL separators: `e348f069e79c014e94f2f35a308f4002a0f6d40bb339e66874861d71b75c9a2d` (`/tmp/eko-057-source-test.sha256`). Report excluded.

Followed Guard 2.0 §9.3, with §§2.1, 8.3 and 9.4 provenance/frame/release boundaries; reused 048 durable file primitives and the existing shared address, cursor and rational contracts. Read FACTS §§6–7, backend §3.1–3.2/§4.3/§6.2 and marketing §04 claims rules. No user-facing marketing surface changed. No spec conflict, dependency, lockfile change or migration; reserved migration 0180 unused. No personal identifiers were introduced or copied. Existing tests were not deleted, skipped, weakened or given larger timeouts.

`TODO(spec)` in `probability-sample.ts`: §9.3 specifies behavior without a sampling wire contract. The smallest implementation is an engines-local, versioned envelope containing the caller's frozen query artifact and evidence-backed eligibility flags, not a new public API. Eligibility evidence/query correctness still requires source review; the sampler does not invent sale/control facts.

## Fixture evidence and remaining gaps

The reproducible fixture enumerates 1,700 synthetic tokens and selects 600: 100/75/75/100/250 from populations 200/150/150/200/1,000. Inclusion probabilities are saved as exact `n_h/N_h`. Vacancies move first to remainder capacity, then eligibility priority; smaller frames become a census. No current verdict filters the denominator. Extensions require another declared design/output. A synthetic outcome constant within each stratum recovers population rate `7/17`, rather than the unweighted sample rate `350/600`.

Imported **100 matched fixture records**, each with EKO, raw-receipt and comparator snapshots. These represent **zero measured matched records** and establish no vendor parity or endpoint support. Capability, response-time and price evidence in fixtures is synthetic. Unsupported historical endpoints remain explicit, no unknown price becomes zero, and vendor gross/held and supply conventions remain separate. Coverage, unanswerable counts, omission diagnostics and response times are preserved; parity/review/release gates remain false. Independent human judgments and pilot response-time/coverage targets are still required. No review labels or adjudications were written.

The supplied research has no verified full 53-launch address/transaction manifest or archive coverage. Actual incident members: **0**; challenge unreproduced. The reported 53, categories 45/4/4 and $18.43m remain an unreconciled allegation. Synthetic full-receipt tests exercise 53 distinct entries, category overlaps, sample overlaps, archive gaps and abbreviated-ID rejection; those addresses are not incident members. Challenge entries have unknown population probability and cannot enter population estimates. Verified source receipts, then selective reconstruction and independent review, are the next concrete steps.

Actual remote acquisition: **0 requests, 0 request units, $0 paid cost**. Provider pricing and measured source coverage remain unknown; local fixtures incur no remote charge. No acquisition process remains running.

## Reproduction and checkpoint

From the repository root:

```sh
pnpm --filter @eko/engines exec node --import tsx --input-type=module -e 'import { mkdir, writeFile } from "node:fs/promises"; import { samplingFixture } from "./test/sampling-fixtures.ts"; await mkdir("/tmp/eko-057-fixture", { recursive: true }); await writeFile("/tmp/eko-057-fixture/input.json", JSON.stringify(samplingFixture()));'
pnpm --filter @eko/engines exec node --import tsx src/sampling-and-incidents-cli.ts --fixture /tmp/eko-057-fixture/input.json /tmp/eko-057-fixture/output
```

Preparation, run and identical-command resume exited 0. Input fixture digest: `0x32d4ba17917171673f4983540aa77a38e3789bb57e94f9d2180e393d3ac2bd03`; output artifact digest: `0xfe75133de90beff33750862152864b8c46d253260fd597e12ff7ae0272e95786`. Keep `input.json`, `output/artifacts.json`, `output/checkpoint.json` and `output/report.json` together. Artifacts contain the complete frozen frame/query/seeds, final counts, matches and separate challenge. Logs: `/tmp/eko-057-fixture-prepare.log`, `/tmp/eko-057-fixture-run.log`, `/tmp/eko-057-fixture-resume.log`. Checkpoint status: complete. Resume verifies identical source/candidate/content; changed inputs need a new output. A stale `runner.lock` requires inspection of the stopped process/checkpoint before removal.

Next action: lead reviews the uncommitted candidate and fixture artifacts, then supplies verified enumeration/eligibility queries, comparator capability/capture evidence, incident receipts and independent reviewer assignments. No paid transport or automated promotion is installed.

## Checks

| Exact command | Exit code / evidence |
| --- | --- |
| `pnpm --filter @eko/engines exec vitest run test/sampling-and-incidents.test.ts` | 0; final 15/15 tests, `/tmp/eko-057-focused.log`. |
| `pnpm --filter @eko/engines typecheck` | 0 during implementation. |
| `pnpm typecheck` | 0; `/tmp/eko-057-typecheck.log`. |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0; all workspace suites, web/server builds and role-image fixture checks passed, `/tmp/eko-057-test.log`. Engines: 350/350 tests. |
| `pnpm brand:check` | 0; 38 files, `/tmp/eko-057-brand.log`. |
| `pnpm check:addresses` | 0; 463 source files, `/tmp/eko-057-addresses.log`. |
| `git diff --check` | 0. |

Verification logs replace machine-specific workspace/home prefixes with neutral placeholders. The final focused candidate passed without a timing failure or failing-file rerun.

Full gate totals: 3,124 TypeScript tests and 34 contract tests passed. The existing contract fork test skipped because its RPC URL is unset; this packet introduced no skip. Web/server builds and role-image fixture checks passed without opening ports or making live provider requests.
