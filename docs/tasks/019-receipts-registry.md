# Task 019 · contracts/: ReceiptsRegistry, its tests, deploy script and review scaffolding

Read `AGENTS.md` first (rule 9 included). This is EKO's only new contract at D0. Its review (spec §14.0) must finish
before D0, so the code and tests come first. Spec: `docs/eko/04-BACKEND.md` **§14.0** (review on a budget: findings
log, static analysis, tests, 72 h window, bounty), **§14.1** (workspace: solc 0.8.26, `evm_version = cancun`, optimizer
10,000 runs, OpenZeppelin 5.x), **§14.2** (the contract, given in full), **§14.6** (the ReceiptsRegistry test row and
invariants), **§13** (receipt leaves, `StandardMerkleTree`, the shared fixtures), §4.4 (the indexer reads
`BatchCommitted` / `CommitterChanged` from the `forge build` ABI, never hand-typed topics), §18 (keys: the committer is a
hot key holding gas only, the owner is cold).

The lead set up `contracts/` as a pnpm workspace package (`@eko/contracts`): `foundry.toml` with the §14.1 settings and
`offline = true`, OpenZeppelin **5.6.1** from `node_modules` (remapped as `@openzeppelin/contracts/`), forge-std
**v1.16.2** vendored in `lib/forge-std`, and solc 0.8.26 already cached, so `forge build` / `forge test` work offline.
The shared receipt fixture is `packages/shared/test/fixtures/receipts/v1.json` (readable through `fs_permissions`), and
the TS encoder is already cross-checked against `StandardMerkleTree`.

## Do

1. **`contracts/src/ReceiptsRegistry.sol`**: exactly the §14.2 contract (same storage, events, errors, behaviour,
   NatSpec). Don't add features. If you think something in it is wrong, leave it as written and raise it in the report.
2. **Tests** (`contracts/test/`), every §14.6 row:
   - `unit/`: commit happy path (event, stored batch, returned id); non-committer reverts `NotCommitter`; zero root and
     zero `leafCount` revert `EmptyBatch`; ids are assigned by the contract, start at 1 and are sequential; a junk batch
     from a leaked committer key doesn't block, overwrite or reorder the next honest commit, before or after rotation;
     rotation: only the owner, `CommitterChanged` emitted, the old committer can no longer commit; `Ownable2Step`
     ownership transfer (pending owner must accept); `verify` returns true for every fixture leaf with its proof
     against a committed fixture root (load the JSON with `vm.readFile` + `vm.parseJson`), false for a wrong leaf, a
     wrong proof, a tampered proof element, and an unknown or zero batch id; `batch()` of an unknown id is zeroed.
   - fuzz: arbitrary roots and leaf counts commit or revert exactly as specified; `verify` never returns true for an
     uncommitted id.
   - `invariant/`: a handler that commits, rotates and verifies at random; invariants: a committed root never changes;
     `lastBatchId` rises by exactly 1 per successful commit; every stored batch has a non-zero root and leaf count.
   - `fork/`: on `rhc` at a pinned block (`vm.createSelectFork("rhc", <block>)`), deploy and commit/verify the fixture
     root, so we know it works against Robinhood Chain's EVM. Skip cleanly when `RPC_HTTP_URL` isn't set (the lead runs
     it live).
   - A gas snapshot (`forge snapshot`) committed as `contracts/.gas-snapshot`.
3. **Deploy script** `contracts/script/DeployReceiptsRegistry.s.sol`: reads `RECEIPTS_OWNER` (cold, hardware) and
   `RECEIPTS_COMMITTER` (hot) from the environment, refuses zero addresses and owner == committer, deploys, logs the
   address and block. Document the command in `contracts/README.md`: `forge script … --rpc-url rhc --ledger
   --broadcast --verify` (Blockscout verification for 4663 in the README as `TODO(spec)` if the verifier URL isn't in
   the spec). Never put a private key, mnemonic or real address in the repo.
4. **ABI export**: `pnpm --filter @eko/contracts abi:export` writes the built ABI to
   `packages/chain/abi/eko/ReceiptsRegistry.json`, plus a small test in `packages/chain` that reads it and checks the
   `BatchCommitted` and `CommitterChanged` topics against `toEventSelector` of their signatures.
5. **Review scaffolding** (§14.0): `contracts/review/findings.yaml` (schema: id, reviewer, severity, location, title,
   status `open|fixed|accepted|invalid`, fix_commit, recheck), `contracts/review/README.md` with the five steps and
   their pass bars, `slither.config.json` and an Aderyn config (the lead runs the tools), and a coverage command in
   the README. A root `SECURITY.md` draft from §14.0 step 5 (scope, the severity→payout table capped at $500, 72 h
   acknowledgement, safe harbour, reporting through GitHub private advisories and `security@{{DOMAIN}}` left as that
   placeholder). Claims rules apply: never "audited", "trustless", "guaranteed" or "safe".
6. Wire `@eko/contracts` `test` into the root `pnpm test` only if `forge` is on PATH (skip with a clear message
   otherwise), so CI without Foundry still passes.

## Don't

- No other contracts. Don't edit `docs/eko/`. No new npm or Foundry dependencies beyond what the lead installed. No
  personal identifiers, keys or real addresses (rule 9; rule 5).

## Report

Files, test counts by kind, coverage of `ReceiptsRegistry.sol`, gas for `commit` and `verify`, anything in §14.2 you'd
question, `TODO(spec)` list, and the root typecheck/test/brand:check/check:addresses results.
