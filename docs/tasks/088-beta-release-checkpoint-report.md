# Task 088 implementation report

Candidate base revision: `c929fcc28326290dbfa0de43a6ab7daf08bffd59` plus uncommitted
packet changes. Task-specific six-file source manifest SHA-256 (not an 087
worktree hash): `1c13aab4779cf644181a11946850ee488ffb6db448a34e92b3253d3a3451b9b0`. Packet source hashes, exact command argv, process IDs, logs,
elapsed times and source-stability checks are retained in
`/tmp/eko-088-checkpoint.json`. This report is a completion record, not an 087
acceptance report. No commit, push, deployment, publication, external message,
paid run, network request, port or live signing was performed.

Read AGENTS including rule 9, the packet, GO PLAN §§1, 8–10, 13, 16, BACKEND
§§12.4, 20–21, MARKETING §04 and cited dependency packets. Consumed
`task-087` runner/manifest/README/report with `git show` at
`0546ad2d32bb8d3814a58e83134571632417bca4`; consumed
`main:docs/operations/staging-railway-evidence.md`. Neither runner nor manifest
was copied or forked. No spec, Guard logic, prototype, migration, dependency,
lockfile, trading cap/config or unrelated source changed. No personal
identifier or secret was introduced or ported.

## Changed files

- `scripts/release-checkpoint.mjs`: offline, bounded evidence consumer. Imports
  integrated 087's candidate snapshot; consumes completed B/T reports and its
  manifest without executing evals. Checks producer artifact hashes, source and
  candidate/window provenance, smoke completeness, actual-fill sell evidence,
  daily errors/spend/latency, no open Sev 1/2, two-role coverage, rollback <600 s,
  and separate elapsed-72h/Owner cap acceptance. A miss fails the gate, requires
  stop verification and prepares 085's existing command. 076 owns the atomic
  durable trading stop; no second reconciler, paging sink or restart was added.
- `scripts/test/release-checkpoint.test.mjs`: 11 synthetic consumer tests,
  including missing/stale/fixture evidence, failure propagation, denominator
  gaps, matching actual fills, latency/spend limits, rollback/rota incidents,
  independent observation/sign-off and bounded artifact reads.
- `package.json`: checkpoint CLI/focused check; new tests join the existing full
  gate without removing any gate or assertion. No dependency declaration changed.
- `docs/operations/release-checkpoint/README.md`: candidate-bound B/T checklist,
  team $25 → users $100 → public $250 rollout, $1,000 conditional config release,
  Oct 13 smoke, daily review, incident/rollback preparation, role coverage and
  separate Oct 18 D0 review / Oct 20 token day. The D0 contract review also follows
  BACKEND §20's no-open-High/Medium requirement; GO PLAN §10 additionally requires
  every High/Critical fixed and rechecked.
- `docs/operations/release-checkpoint/088-form.json` and
  `088-beta-daily-form.json`: empty evidence forms; missing values remain null.
- `evals/reports/088-prepared.json` and `088-final-prepared.json`: retained red
  local checkpoints. Every gate is pending, go/no-go is no-go, and 087 candidate
  binding is unavailable until integration. No zero-fill claim or approval.

## Checks and process checkpoint

| Exact command | Exit | Result |
|---|---:|---|
| `pnpm test:checkpoint` | 0 | Stable final source, 11 tests; `/tmp/eko-088-focused-stable.log` |
| `pnpm release:checkpoint --input docs/operations/release-checkpoint/088-form.json --output evals/reports/088-final-prepared.json` | 1 | Expected red preparation, all gates pending; `/tmp/eko-088-prepared.log` |
| `pnpm typecheck` | 0 | Stable packet source; `/tmp/eko-088-typecheck-final.log`; 55.68 s |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | Process-local `PNPM_CONFIG_WORKSPACE_CONCURRENCY=1`; 3005 Vitest tests / 182 files, 11 new Node tests, local contracts, builds and role-image checks; `/tmp/eko-088-test.log`; 500.29 s |
| `pnpm brand:check` | 0 | Final post-build check, 154 files; `/tmp/eko-088-brand.log` |
| `pnpm check:addresses` | 0 | 440 source files; `/tmp/eko-088-addresses.log` |
| `git diff --check` | 0 | No whitespace errors |

Full gate process `16216`, tool session `71945`, completed exit 0; checkpoint
`/tmp/eko-088-checkpoint.json`. No validation job remains running. The existing
conditional contract fork check was not activated (34 local contract tests passed,
one inherited fork skip); it is not counted as launch fork evidence. No timeout, assertion or existing test was changed,
weakened, skipped or deleted. An earlier successful typecheck overlapped JS/docs
refinement; the completed stable final typecheck above supersedes it.

## Acceptance, ambiguities and reproduction

Prepared locally and synthetic-consumer-tested, not deployed or approved. The
087 reports on its branch are red and bind a different source revision. 075/076
are integrated here, but 087 still needs lead integration and an updated owning
dependency inventory. Actual Gate B/T evidence remains pending: complete fork
and labeled Normalizer/Guard suites, applicable unchanged 061–063 reports,
receipts, backfill, Owner policy approval, encrypted restore/PITR, live roles,
current-candidate staging, 129 browser/fork product acceptance, harness/connector
dispositions, real latency cohorts, beta fills, paging and rollback rehearsal.

Railway staging has actually run on the older recorded revision; this packet
does not repeat the obsolete claim that no deployment exists. Its documented
image/ledger/role/sanctions/resource/ingress/backup/alert/rollback gaps are not
accepted, and it supplies no current-candidate product pass.

Spec conflict: 073's report gives T as 16:00 Toronto / 20:00 UTC. This packet
follows GO PLAN §9 and its explicit UTC convention: target Oct 13 **16:00 UTC**.
The actual approved launch instant must be recorded before config release.

One new `TODO(spec)`, in `scripts/release-checkpoint.mjs`: the release/daily/smoke
interchange schema is unspecified. The minimal bounded hashed producer format
supplies records, not authority; owners must deliver real measured evidence and
dated approval. Existing TODOs stay with their owning packets.

Actual provider request units **0**; actual charged cost **$0**. Coverage is local
synthetic records and the repository's offline tests/builds; measured new fork
runs, beta fills, live alert deliveries and rollback runs **0**. No paid or external
continuation mechanism was started. Next action: lead review of
uncommitted changes and integration of 087, then separately authorized evidence
acquisition and acceptance. Reproduce using the exact commands above, with a new
`evals/reports/088-<attempt>.json` basename to preserve red history. The README
defines the producer form and the existing prepared stop/rollback path.
