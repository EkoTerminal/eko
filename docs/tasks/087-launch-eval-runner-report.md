# Task 087 implementation report

Candidate revision: `4601c4d53b7bf2edd2d7f8c6d0fdb0c0a0afeaf8` plus uncommitted packet changes. Sorted source manifest SHA-256: `f0aa8f1efe2681e8f01b7f834d59d80b4eca04d097b7f8821ad829522351c6b4`. The exact sorted relative paths/content hashes are retained in `evals/reports/verified-B.json` and `verified-T.json`; reports and this completion report are excluded from the source hash.

Implemented against 04-BACKEND §20 and 05-GO-PLAN §§1, 7–9. Read AGENTS including rule 9 and all cited dependency packets. Guard 061–063 are consumed without changing their logic, labels or datasets. No spec, prototype, migrations, dependencies, lockfile, release flags or unrelated source changed. No personal identifiers were introduced or ported. No commit, push, deployment, publication, external message, paid run, provider request or live signing occurred.

## Changed areas

- `evals/runner.mjs`: independent B/T selection; candidate/worktree, fixture/dataset/config hashes; exact reproducible commands, exits/signals, test counts and pending/skipped status; red incremental checkpoints; evidence/artifact provenance validation and spec pass bars. Omitted required stage suites cannot produce a green report. Fixture passes are separate from measured acceptance.
- `evals/manifest.json`: fixed current deterministic suites, relevant merged dependencies and explicit pending packets; quote-only v4; independent Census gate and later-stage exclusions. Unmerged packet dependencies remain pending even if an evidence envelope is supplied.
- `evals/fixtures/normalizer/inventory.json`: honest empty observed-label inventory, preserving all nine class gaps. Synthetic test coins and ABI captures are not promoted to truth labels.
- `evals/test/runner.test.mjs`: 10 focused tests for failure propagation, missing results, stage independence, optional v4, pending packets, stale hashes, missing fork/labels, zero-fill denominators, latency/precision bars, unchanged Guard report consumption, budget rejection and missing mandatory suites.
- `evals/README.md`: commands, acceptance interchange format, provenance/denominator requirements and external producer responsibilities.
- `package.json`: nightly application CLI and focused test entry point; runner tests join the existing full gate.
- `.github/workflows/launch-evals.yml`: independent B/T PR/main/nightly/manual jobs, 02:00 UTC schedule, failed-report retention for 30 days and pinned existing Actions versions. No provider credentials or paid-generation client.
- `evals/reports/`: retained red reports, including earlier runner candidates and final verified B/T JSON/Markdown evidence.

## Checks

| Exact command | Exit | Result |
|---|---:|---|
| `pnpm test:evals` | 0 | 10 focused runner tests |
| `pnpm evals:nightly --gate B --report evals/reports/verified-B.md` | 1 | 12 fixture groups / 751 tests pass; required acceptance pending |
| `pnpm evals:nightly --gate T --report evals/reports/verified-T.md` | 1 | 12 fixture groups / 751 tests pass; required acceptance pending |
| `pnpm typecheck` | 0 | Final candidate; `/tmp/eko-087-typecheck.log` |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | 2967 Vitest tests / 180 files, 10 runner tests, local contract tests, builds and compiled-role checks; `/tmp/eko-087-test.log` |
| `pnpm brand:check` | 0 | `/tmp/eko-087-brand.log` |
| `pnpm check:addresses` | 0 | `/tmp/eko-087-addresses.log` |
| `git diff --check` | 0 | Whitespace check |

An initial focused runner test exited 1 because Node interpreted reporter arguments as runtime options in its fake subprocess. Added the argv terminator to the test command; the final focused suite passes. No existing assertions were removed, weakened or skipped, and no timeout was raised. The inherited live-fork test remains unavailable without RPC configuration and is not counted as passing launch evidence. Earlier B reports retain their exact earlier source hashes; they are not substituted for final-candidate acceptance.

## Acceptance, coverage and dependencies

Gate B pending: normalizer, execution, receipts, guard-locked, guard-shadow, guard-cutover, staging, backfill, policies, restore.

Gate T pending: normalizer, execution, receipts, guard-locked, guard-shadow, guard-cutover, harness, injection, playbooks, latency, product, honeypot-fills.

Relevant unmerged packets in the manifest: 046, 061–063, 075–078, 094–096, 101, 108–110, 114–116, 123 and 129. These are never counted as passing acceptance. Existing 068/071/080/086/093 code supplies fixture coverage; implementation reports do not supply measured launch acceptance.

Observed labeled coins: **0/200**. Honeypot, tax-trap, hook, fee-trap, clone, wash and clean v3/v4/Pons all remain gaps. Measured launch fork cases, staging/browser acceptance and beta fill observations supplied to this runner: **0**. The zero-fill check requires a positive observed order denominator, complete classifications and individual observations; absent or unknown data cannot become zero misses. Executable v4 is explicitly skipped while quote-only; no route is enabled. Census headlines stay unavailable; D0/Drop/connector readiness checks are separately skipped.

Actual provider request units: **0**. Actual paid cost: **$0**; approved generation budget: **$0**, disabled. Scheduled Luna generation/grading and approximately 5% Opus review remain dependent on a separately authorized, capped producer. No paid model run was prepared as an implicitly authorized cron job.

Built and fixture-tested/prepared locally; **neither gate certified, no workflow deployed or remotely verified, no release approved**. Missing archive-fork matches and genuine labels, Guard 061–063 acceptance, deployed receipts, staging/backfill/policy/restore evidence, integrated trade/harness/product packets, complete latency cohorts and real beta order observations remain external dependencies. GitHub branch protection is an operator step.

## TODO(spec) and reproduction

One new `TODO(spec)` in `evals/runner.mjs`: Guard 061–063 do not specify a machine-readable acceptance report schema. The adapter consumes the owning packet's complete, accepted gate table and denominator verification with original upstream dataset/label/config hashes. The producers must provide that envelope; this packet does not refit, rerun or approve their work. No spec/code conflict was found.

Reproduce the focused and B/T checks using the exact commands above. Supply owning producers' measured evidence under `evals/reports/`, then use `--evidence evals/reports/acceptance.json` with a new report basename. The README defines required fields. Retain red reports rather than overwrite prior attempts.

Checkpoint: `/tmp/eko-087-checkpoint.json`. Full-check process session `48347` completed with exit 0; no job remains running. Logs listed above. Next action: lead review/commit, followed by separately authorized evidence acquisition and acceptance. No external or paid continuation was started.

Lead integration note: `.github/workflows/launch-evals.yml` runs nightly and on manual dispatch only. The gates are expected to stay red until measured acceptance evidence exists, so they do not run on every push or pull request.
