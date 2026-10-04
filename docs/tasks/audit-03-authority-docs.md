# Audit fix 03: authority inventory, registry-owner handoff plan, audit record and frozen scope

Source: audit-grade v2 run on 2026-10-02, report ../docs/audits/audit-grade-2026-10-02/REPORT.md, Path to 9 items 2, 3 and 4. Lane evidence:
../docs/audits/audit-grade-2026-10-02/runs/20261002-154053/lanes/ (deploy-verification.md, repo-hygiene.md, tee-oracle.md, evm-stack.md).

## 1. Every privileged power and who holds it (rubric D1)

Add a "Privileged powers" section to `SECURITY.md`: one table row per power, columns: power (exact function, route,
env var or authority) · where (file:line) · holder (role, never a person) · custody (hardware / hot key / host secret /
multisig) · what it can and cannot do · rotation or revocation path.

Enumerate from the code, not from memory, and count them (the rescore needs ≥90% completeness, so write the count and
how you searched):
- `contracts/`: every owner/committer power of ReceiptsRegistry, including inherited Ownable functions
  (transferOwnership, renounceOwnership and any two-step acceptance), constructor roles, and anything the deploy script
  assigns;
- off-chain signers and keys: the receipt committer hot key and its service, any other signing or funded key, burn
  wallet / dev wallet roles as the spec describes them (fees go to the public burn wallet only);
- server administration: admin or operator routes, feature flags, kill switches, OAuth/agent-key issuance and
  revocation, database and migration access;
- host secrets: every secret env var by **name** (from .env.example files, infra/, Dockerfile, Railway docs), what it
  unlocks, and where it lives. Never write a value.

## 2. Registry-owner multisig/timelock handoff plan (rubric D2)

Before mainnet the ReceiptsRegistry owner must not stay a single key. Write the concrete plan in `contracts/README.md`
(and link it from SECURITY.md):
- intended holder (e.g. a Safe with an m-of-n threshold on separate hardware signers; state the threshold and why),
  whether a timelock sits in front of owner actions and its delay. Weigh delay against incident speed: revoking a
  compromised committer may need to be fast; say how both needs are met;
- the exact transfer and acceptance steps from the deployer, matching the contract's real Ownable variant;
- verification after transfer (owner and pending-owner reads, expected values from the address manifest);
- recovery: lost or compromised signer, compromised committer, and why renounceOwnership must never be called (or what
  it would break).
Follow docs/eko (read-only) wherever it already decides custody, and cite the section. Where it is silent, choose the
smallest reasonable plan and mark it `TODO(spec)`.

## 3. Audit record and frozen scope (rubric G7, G8)

- Create `.audit-grade/` with `REPORT.md`, `findings.tsv` and `history.tsv` copied from ../docs/audits/audit-grade-2026-10-02 (exact contents; these are
  meant to be committed). Before copying, check them for absolute machine paths or usernames (AGENTS.md rule 9) and
  replace any with repo-relative paths.
- Add `.audit-grade/runs/` to `.gitignore` (raw run output stays out of git).
- Add `.audit-grade/SCOPE.md`: the audited commit `94495af646eb03a35eabb0e22e5892f6e82427df`, the git tag
  `audit-grade-2026-10-02` that will point at it (the lead creates the tag), the in-scope paths and excluded paths
  exactly as the report's Scope section lists them, and the tools that could not run.
- Point `contracts/review/README.md` at this record where it talks about review scope.

## Proof
- The privileged-powers table with its count and search method; the handoff plan; the .audit-grade files.
- No personal identifiers or machine paths anywhere (the commit hook checks).
- `pnpm typecheck` and `pnpm test` pass.

Follow AGENTS.md (docs/eko is read-only; no team names; claims rules apply to any user-facing text). Do only this task.
End with the AGENTS.md report.

## Completion evidence — 2026-10-02

Candidate: base `2997466a96d4a62ffd5ac6b9e93f8f8ce343e1ed` plus this documentation-only
packet diff on `audit-03-authority-docs`. Application/contract source and dependencies
are unchanged. The historical review candidate remains
`94495af646eb03a35eabb0e22e5892f6e82427df`; no rescore or finding closure is asserted.

- `SECURITY.md`: 80 numbered authority entries with six required columns, source
  references, search/count method and individual secret-source inputs. All explicit
  file:line references resolve; all named template/deployment secret inputs are covered.
- `contracts/README.md`: 2-of-3 independent hardware signer plan, zero on-chain
  delay with immediate quorum-based committer revocation, exact Ownable2Step
  handoff, manifest reads, signer recovery and registry renunciation prohibition.
- `.audit-grade/REPORT.md`, `findings.tsv`, `history.tsv`: byte-for-byte equality
  with source checked. `SCOPE.md` reproduces the full report Scope section exactly,
  with candidate/planned lead-created tag and unavailable tools. Raw runs are ignored.
- Packet source locations were converted from absolute personal paths to paths
  relative to the repository root. Changed documents passed the machine-path and
  machine-account-identifier check; no secret values were read or added.
- Followed BACKEND §§13, 14.2, 18, 21.4 and the custody/fee boundaries in
  FACTS §§5–7 and MARKETING §04. Read-only specs were not changed.
- `TODO(spec)`: registry multisig/notice/delay choice versus proposed single-device
  custody; release manifest role fields; live custody/grants/mount verification and
  KEK re-wrapping procedure. These are documented release dependencies, not actions
  performed by this packet.
- `pnpm typecheck`: exit 0.
- `pnpm test`: exit 0, including root self-checks, all recursive workspace tests
  and final web/server builds and role-image fixture checks. Foundry: 33 passed,
  1 existing RPC fork skip (`RPC_HTTP_URL` unset). No live fork result is claimed.
- `git diff --check`: exit 0; raw-run ignore rule verified.

Commit is pending: staging was denied because this sandbox cannot write the
linked worktree's Git metadata outside the writable workspace. No commit,
merge, push, tag or other branch change was performed. Intended commit message:
`Audit 03: document authority and freeze review scope`.
