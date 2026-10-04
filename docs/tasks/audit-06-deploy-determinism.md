# Audit fix 06: deterministic contract build record and a manifest-driven deploy verifier

Source: `.audit-grade/REPORT.md` (rescore), Path to 9 items "Complete deterministic build/deploy pins and release
record" (contract part; the Dockerfile/image digests were done in audit 05) and "Add manifest-driven EKO bytecode/
config verifier that fails on incomplete checks". Rubric lines:
- F (1.0): toolchain and build deterministic: fixed pragma on deployable contracts; foundry.toml pins solc, optimizer,
  via_ir, evm_version **and bytecode_hash**; runtimes pinned (engines/packageManager already).
- D (1.0): deploy scripts in the repo, reproducible, and handing ownership to the right address.
- D (1.5): post-deploy verification: a script that checks bytecode hash and live config (owner, roles, delays) and
  **fails on mismatch**; pre-launch, the script existing earns it.

## Do
1. `contracts/foundry.toml` (and the probe profile in packages/chain/probe/foundry.toml): set every determinism knob
   explicitly with today's effective values (solc 0.8.26, optimizer + runs, `via_ir`, `evm_version`, `bytecode_hash`,
   `cbor_metadata`) so the build cannot drift with Foundry defaults. Changing a value would change bytecode: keep
   current effective values and prove the compiled bytecode is unchanged (compare before/after).
2. Build of record: add `contracts/release/ReceiptsRegistry.build.json` (compiler version and settings, keccak256 of
   creation code and of runtime code, how constructor args affect them) produced by a script (e.g.
   `contracts/scripts/build-record.mjs`) that rebuilds and **fails if the hashes differ** from the committed record.
   Run it in the `contracts` CI job (`.github/workflows/ci.yml`; keep all hardening rules).
3. Verifier: `packages/chain/src/verify.ts` and `verify-cli.ts` currently check non-empty code and router wiring and can
   exit 0 on incomplete work. Make the EKO-owned part manifest-driven: for each EKO entry in
   `packages/chain/addresses.4663.yaml` (ReceiptsRegistry first): runtime code hash equals the build record (accounting
   for immutables if any), `owner()` equals the manifest owner, `pendingOwner()` is zero, `committer()` equals the
   manifest committer, chain id 4663. Any mismatch, unreachable read, interruption or exhausted budget **fails closed**
   (non-zero). Entries still `TODO` (not deployed) are reported as `not deployed` and the CLI says so explicitly; decide
   whether that exits 0 in a documented `--prelaunch` mode only. Add the manifest fields the verifier needs (owner,
   committer, expected hash reference) with TODO values; no real addresses invented.
4. Tests with a mocked RPC: match, each mismatch kind, unreachable RPC, incomplete/budget-exhausted run, not-deployed.
5. Deploy runbook in `contracts/README.md` (extend the existing handoff section, don't duplicate it): reproducible build
   command, expected hashes from the build record, deploy command with owner = verified Safe at construction, then the
   verifier command and expected output.

## Proof
- Bytecode unchanged before/after the foundry.toml change (hashes shown); build-record script passes, and fails on a
  tampered record; verifier tests pass; `pnpm typecheck` and `pnpm test` pass.

Follow AGENTS.md. Only this task. End with the AGENTS.md report.
