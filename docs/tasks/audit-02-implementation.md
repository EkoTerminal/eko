# Audit 02 implementation and proof

Candidate: `2997466` plus the task working tree, on `audit-02-hardened-ci`.

## Changes and scope

- `.github/workflows/ci.yml`: all-branch push/PR jobs for Node, contracts, Slither,
  Semgrep and full-history secrets. All 17 action references use the supplied SHA
  pins and version comments. Empty default permissions, job-only `contents: read`,
  credential-free checkouts, bounded timeouts and cancelling concurrency.
- Node 22, manifest-selected pnpm, frozen installs and the existing `allowBuilds`
  control. Both Node and contracts install Forge v1.7.1 because root tests include
  contracts. CI permits first-use download of the pinned solc 0.8.26; the local
  offline default and compiler settings stay intact.
- Slither uses the existing config, overrides its failure threshold to High and
  uploads JSON even after a failed scan. Semgrep uses the supplied immutable
  container, three named rule packs, ERROR gating and a JSON artifact. Its explicit
  server/package targets and ignore file exclude UI, tests, fixtures and generated
  output. No code-scanning/SARIF upload, privileged trigger or paid action.
- Gitleaks 8.30.1 is checksum-verified before extraction and scans all fetched refs
  with redaction. `.gitleaks.toml` extends defaults: exactly 13 hygiene-lane
  exceptions, each requiring the exact rule, anchored path and anchored value.
- `.github/dependabot.yml`: weekly GitHub Actions updates.
- `contracts/scripts/test.mjs`: absent Forge fails whenever CI is set (including
  an empty value); the existing developer skip remains. README files document CI
  and local reproduction.
- Included the supplied task packet. Replaced personal machine identifiers in
  its source paths with neutral `docs/audits/` references before committing it.

Followed the audit-02 task and BACKEND §§14.1, 20 and 21, preserving workspace
layout/tooling (§2) and secret boundaries (§18). The task's explicit High Slither
threshold and pinned actions supersede the older abridged §20 workflow example
(which uses floating action tags and a Medium threshold). No spec edits,
dependency/lockfile changes, application changes or new `TODO(spec)` notes.

## Proof

Local tools: Node v26.0.0, pnpm 11.5.1, Forge 1.7.1, solc 0.8.26, Gitleaks 8.30.1.
The workflow selects Node 22; a Node 22 runner was not executed locally. No network
access, workflow execution, Semgrep registry fetch or Slither execution is claimed.
Action input names were checked statically against the known action interfaces;
remote metadata was not fetched.

YAML parser output (Ruby/Psych, both GitHub YAML files):

```text
YAML parses: .github/workflows/ci.yml
YAML parses: .github/dependabot.yml
```

Parsed-structure validation output:

```text
PASS: 17 uses entries have full SHA pins and version comments; known input-name checks clean.
PASS: permissions={}, five contents:read jobs, five timeouts, cancelling concurrency, credential-free checkout.
PASS: push/pull_request on all branches; no privileged triggers or github.event in run steps.
PASS: frozen installs, Node 22, manifest pnpm, Forge v1.7.1, full-history secrets checkout.
```

Greps used:

```sh
rg -n '^\s*- uses:' .github/workflows | rg -v '@[0-9a-f]{40} # v[0-9]+\.[0-9]+\.[0-9]+$'
rg -n 'github\.event|pull_request_target|workflow_run' .github/workflows
rg -n 'permissions:|contents:|timeout-minutes:|cancel-in-progress:|persist-credentials:|fetch-depth:' .github/workflows/ci.yml
```

Output (first two exit 1 with no matches; the third exits 0):

```text
Unpinned action grep exit: 1 (1 means no matches)
Event/privileged-trigger grep exit: 1 (1 means no matches)
7:permissions: {}
11:  cancel-in-progress: true
16:    timeout-minutes: 30
17:    permissions:
18:      contents: read
25:          persist-credentials: false
40:    timeout-minutes: 20
41:    permissions:
42:      contents: read
48:          persist-credentials: false
64:    timeout-minutes: 20
65:    permissions:
66:      contents: read
72:          persist-credentials: false
97:    timeout-minutes: 15
98:    permissions:
99:      contents: read
105:          persist-credentials: false
120:    timeout-minutes: 10
121:    permissions:
122:      contents: read
126:          persist-credentials: false
127:          fetch-depth: 0
```

| Check | Exit | Evidence |
| --- | --- | --- |
| YAML and workflow assertions | 0 | Output above; all pins, job permissions/timeouts, triggers, installs and action input names checked |
| `gitleaks git --config .gitleaks.toml --redact .` | 0 | 158 commits scanned; 17.13 MB; no leaks found |
| Same scan with `--log-opts="--all"` | 0 | 158 commits scanned; no leaks found |
| Missing Forge: `CI=1 PATH=/usr/bin:/bin <absolute-node> contracts/scripts/test.mjs` | 1 (expected) | Forge required message; empty CI also exits 1 |
| Missing Forge with CI unset | 0 | Existing local skip message preserved |
| Allow-list negative controls using temporary synthetic fixtures | 0 | Exact triaged path/value exits 0; different path or changed dummy value each exits 1 |
| `forge build` in `contracts/` | 0 | Compiler run successful with solc 0.8.26 |
| `pnpm typecheck` | 0 | All workspace typechecks passed; `/tmp/eko-audit-02-typecheck.log` |
| `CI=1 pnpm test` | 0 | All workspace tests, 33 Foundry passes, web/server builds and compiled role fixture checks passed; `/tmp/eko-audit-02-test.log` |
| Changed-file Gitleaks scan | 0 | All nine task files scanned in a temporary copy; no leaks found |
| `git diff --check` | 0 | No whitespace errors |

No tests were removed, weakened or newly skipped. The existing Foundry RPC fork
check skips without `RPC_HTTP_URL`. GitHub execution and static analyzer results
remain to be observed when this branch is separately pushed. No merge or push was
performed as part of this task.

## Commit blocker and next action

All proof steps completed; no process remains running. Staging failed before any
index mutation because the worktree's shared Git directory is outside the writable
sandbox. Git could not create `worktrees/eko-wt-audit-2/index.lock` and returned
`Operation not permitted`. No commit was created; the current branch is unchanged.
This is a filesystem permission failure, not a hook rejection. Approval escalation
is unavailable in this session.

Run from this worktree in a session permitted to write its Git metadata, after
confirming the changed paths still match this packet (neutral commit identity;
normal hooks remain enabled):

```sh
git add .github/workflows/ci.yml .github/dependabot.yml .gitleaks.toml .semgrepignore README.md contracts/README.md contracts/scripts/test.mjs docs/tasks/audit-02-hardened-ci.md docs/tasks/audit-02-implementation.md
git -c user.name=demo-account -c user.email=demo-account@example.invalid commit -m "Audit 02: harden CI and secret scanning"
```
