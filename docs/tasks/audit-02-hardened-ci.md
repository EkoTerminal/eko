# Audit fix 02: hardened CI (build, test, static analysis, secret scanning)

Source: audit-grade v2 run on 2026-10-02 (report: docs/audits/audit-grade-2026-10-02/REPORT.md, Path to 9 item 5; supply-chain lane:
docs/audits/audit-grade-2026-10-02/runs/20261002-154053/lanes/supply-chain-ci.md; hygiene lane with the triaged gitleaks hits:
docs/audits/audit-grade-2026-10-02/runs/20261002-154053/lanes/repo-hygiene.md). The repo has no CI at all.

## Do

Add GitHub Actions under `.github/` for push and pull_request on all branches.

Hardening rules (each one is checked):
- every `uses:` pinned to a full 40-character commit SHA with a `# vX.Y.Z` comment (SHAs below, resolved 2026-10-02);
- top-level `permissions: {}` (or `contents: read`), widened per job only where needed;
- no `pull_request_target` or `workflow_run`; never interpolate `${{ github.event.* }}` into `run:`;
- `actions/checkout` with `persist-credentials: false`; `timeout-minutes` on every job; `concurrency` cancelling
  superseded runs;
- frozen installs only: `pnpm install --frozen-lockfile` (the `allowBuilds` allow-list in pnpm-workspace.yaml stays the
  install-script control); Node 22 (matches the Dockerfile; package.json engines >=22.12); pnpm from `packageManager`.

Jobs:
1. **node**: install, `pnpm typecheck`, `pnpm test`.
2. **contracts**: foundry-toolchain with `version: v1.7.1`, then `forge build` and `forge test` in `contracts/`
   (solc stays pinned by foundry.toml). Make `contracts/scripts/test.mjs` **fail** (non-zero) when Forge is missing
   and `CI` is set, instead of skipping; keep the local skip message for developers without Forge.
3. **slither**: crytic/slither-action on `contracts/` using the existing `contracts/slither.config.json`, failing on
   high severity; upload the report as an artifact. Do not use SARIF upload or CodeQL (both need paid Advanced Security
   on a private repo).
4. **semgrep** (TypeScript/JavaScript): run in container `semgrep/semgrep:1.179.0@sha256:93963d9295a366f59e4850127b1550400ee7b388f04fe144e4a1f6325d96e01b`
   with `p/typescript`, `p/nodejs` and `p/secrets`, scoped to the in-scope server code (apps/server, apps/indexer,
   apps/engines, apps/mcp, packages/*), failing on ERROR severity, results uploaded as an artifact. A `.semgrepignore`
   may exclude tests, fixtures and generated code (UI is out of audit scope).
5. **secrets**: checkout with `fetch-depth: 0`; download gitleaks 8.30.1 linux_x64 from the GitHub release, verify
   sha256 `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb` before running, then scan the full history
   with `--redact` and fail on any finding. (gitleaks-action needs a paid licence for organisation accounts, so use the
   binary.) Add `.gitleaks.toml` extending the default rules with a commented allow-list for the hits the audit already
   triaged as non-secrets (see the hygiene lane), each entry scoped to its exact path and rule. Never allow-list
   broadly. Prove it locally: `gitleaks git --config .gitleaks.toml --redact .` exits 0 (gitleaks is installed on this
   machine).
6. Add `.github/dependabot.yml` for the `github-actions` ecosystem (weekly) so pinned SHAs get update PRs.

Pinned actions:
| action | version | commit |
|---|---|---|
| actions/checkout | v7.0.1 | 3d3c42e5aac5ba805825da76410c181273ba90b1 |
| actions/setup-node | v7.0.0 | 820762786026740c76f36085b0efc47a31fe5020 |
| pnpm/action-setup | v6.1.0 | ea17c68df8912ef543352723c149a84f56e3d413 |
| foundry-rs/foundry-toolchain | v1.9.1 | 908c540300062bd5a7e473851cdb4282204cee09 |
| crytic/slither-action | v0.4.2 | b52cc1cbfee9ca3e8722dd5224299d16c9a6b80f |
| actions/upload-artifact | v7.0.1 | 043fb46d1a93c77aae656e7c1c64a875d1fc6a0a |

Check each action's inputs against the version you pin (read their docs in your memory carefully; don't invent
inputs). No network is available to you: you cannot run the workflows, so validate statically: parse every YAML file,
grep that every `uses:` has a 40-hex SHA, and that no `run:` contains `github.event`.

Also add one short "CI" paragraph to README.md (what runs, how to reproduce each job locally).

## Proof
- YAML parses; SHA/permissions/event-interpolation greps clean (include the output).
- `gitleaks git --config .gitleaks.toml --redact .` exits 0; `CI=1 PATH=<path without forge> node contracts/scripts/test.mjs` exits non-zero.
- `pnpm typecheck` and `pnpm test` pass.

Follow AGENTS.md. Do only this task. End with the AGENTS.md report.
