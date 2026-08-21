# ReceiptsRegistry

The D0 registry stores write-once receipt roots and assigns sequential batch ids.
It implements BACKEND §14.2 exactly. Leaves and proofs follow §13's shared fixture.
Solidity 0.8.26, Cancun, optimizer 10,000 runs, OpenZeppelin 5.6.1 and forge-std
v1.16.2 are already pinned; `foundry.toml` keeps builds offline.

From the repository root:

```sh
pnpm --filter @eko/contracts build
pnpm --filter @eko/contracts test
pnpm --filter @eko/contracts abi:export
pnpm --filter @eko/contracts coverage
```

The root `pnpm test` includes this workspace. When `forge` is absent, only the
Foundry step skips with a clear message; build failures and failed tests propagate.
The ABI export builds first and writes only the ABI (no build metadata or machine
paths) to `packages/chain/abi/eko/ReceiptsRegistry.json`. Chain tests derive receipt
event topics from that ABI; do not hand-type topic hashes.

From `contracts/`, run `forge snapshot` to refresh `.gas-snapshot`, and
`forge test --match-contract ReceiptsRegistryGasTest --gas-report` for call gas.
`forge coverage --report summary` reports registry coverage. The complete
[review gate](review/README.md) remains required before D0.

## Hardware deployment

Provide `RPC_HTTP_URL`, `RECEIPTS_OWNER` and `RECEIPTS_COMMITTER` through the
operator's environment. The owner is cold hardware; the committer is a separate
hot key holding gas only (§18). The script rejects zero addresses and equal roles.
No private key or mnemonic is read by the script. The hardware deployer signs:

```sh
forge script script/DeployReceiptsRegistry.s.sol:DeployReceiptsRegistry \
  --rpc-url rhc --chain 4663 --ledger --broadcast --verify --verifier blockscout
```

The script logs the deployed address and simulation block; confirm the mined block
from the broadcast transaction receipt. Confirm owner/committer on-chain, publish
the deployment record and regenerate the ABI before configuring consumers.
Never commit role addresses, signer material or RPC credentials.

<!-- TODO(spec): §14.1 names robinhoodchain.blockscout.com but supplies no verifier API URL. Confirm it before using --verify; supply --verifier-url through the operator's environment/CLI. -->

## Fork check

```sh
forge test --match-path 'test/fork/*' -vv
```

It selects `rhc` at pinned block 1, checks chain id 4663, deploys the registry and
commits/verifies every fixture leaf. It skips explicitly when `RPC_HTTP_URL` is
unset. A supplied but failing RPC is an error, not a skip.

<!-- TODO(spec): §14.1 requires a pinned block but gives none. Block 1 is the fixed EVM compatibility baseline; the lead must run it against an archive-capable 4663 RPC and record evidence before D0. -->
