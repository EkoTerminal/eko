# Task 100 implementation report

Base revision: `94495af646eb03a35eabb0e22e5892f6e82427df`. Candidate: uncommitted worktree. Source/test/migration SHA-256: `6065f423a1124be39b81884a221e23019e9bbd306db4b6100a3e637c8eaaaf5d` (sorted changed relative paths and contents, each NUL-separated; this report excluded).

Changes follow BACKEND §§3.4, 5.1, 5.5 and FACTS §3. No read-only spec, Guard qualification/scoring logic, prototype, dependencies, lockfile, release gates or EntryPoint configuration changed.

## Changed files

- `apps/indexer/src/agent-registry.ts`: independent address-filtered mint/transfer collection; adaptive bounded log windows; pinned historical wallet reads; head snapshots; explicit reviewed wallet-event profiles; atomic range commits, registration evidence, sparse canonical checkpoints and bounded reorg recovery. Reviewed event profiles require a canonical captured log, matching nonempty bytecode and an applicable block interval. Unverified event signatures remain unavailable. Transfer ownership is never used as the declared trading wallet.
- `apps/indexer/src/clients.ts`, `types.ts`: registered Multicall3 archive batches of `ownerOf`, `getAgentWallet`, `tokenURI`, pinned to one block. Owner/wallet failures halt the read; optional URI failures do not substitute a wallet. At most 200 identities per application batch. Spend-guard and provider failures propagate.
- `apps/indexer/src/cli.ts`, `index.ts`, `backfill.ts`: collection runs alongside live indexing through the existing metered transport; explicit `registry:sync` supports bounded acquisition. Registry shutdown interrupts its wait. Phase A's obsolete ERC-8004 deferral now points to this collector. Existing Pons backfill ownership stays separate.
- `apps/engines/src/registry-labels.ts`, `worker.ts`, `index.ts`: Watcher-owned immutable labels, original wallet-block cuts, confidence 0.99/high, permissionless registration evidence and qualified crew attachment adapter. Withdrawal restores independent evidence or an explicitly unclassified fallback. Replays avoid duplicate rows; retroactive corrections use fresh generation identities. Canonical dependency and supersession records retain orphaned history while excluding it from current cuts. Generation filters preserve the selected history. Independent label changes are timeline boundaries; unchanged inputs avoid repeated projection work.
- `packages/db/drizzle/0149_wallet_labels.sql`, `0150_agent_registry.sql`, `src/registry-schema.ts`, `client.ts`, `engines-migrate.ts`, `index.ts`: reserved engine/indexer migrations, Drizzle schemas, per-writer migration ledgers, registry rollback integration and append-only label enforcement.
- `apps/indexer/test/agent-registry.test.ts`, `clients.test.ts`, `indexer.test.ts`, `apps/engines/test/registry-labels.test.ts`, `packages/db/test/merge-migrations.test.ts`: transfer/wallet change, batched reads, zero wallet, burn, missing reads, late discovery, replay, canonical rollback/replacement forks, immutable corrections, qualified crew changes and historical/generation cuts. Migration-union expectations include both reserved additions; existing assertions remain.
- `docs/tasks/100-registry-labels-report.md`: this handoff.

## Verification

Commands run locally; logs use neutral workspace paths.

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/indexer exec vitest run test/agent-registry.test.ts test/clients.test.ts --maxWorkers=1 --testTimeout=30000 --hookTimeout=30000` | 0 | 21 tests; `/tmp/eko-100-indexer-focused-final-candidate.log` |
| `pnpm --filter @eko/engines exec vitest run test/registry-labels.test.ts --maxWorkers=1 --testTimeout=30000 --hookTimeout=30000` | 0 | 11 tests; `/tmp/eko-100-engines-focused-final-candidate.log` |
| `pnpm --filter @eko/db exec vitest run test/merge-migrations.test.ts --maxWorkers=1 --testTimeout=30000 --hookTimeout=30000` | 0 | 3 tests; `/tmp/eko-100-migrations-stable.log` |
| `pnpm --filter @eko/indexer exec vitest run test/indexer.test.ts -t 'migrations stay separate' --maxWorkers=1 --testTimeout=30000 --hookTimeout=30000` | 0 | Focused migration reproduction; 1 passed, 17 deselected; `/tmp/eko-100-indexer-migration-repro.log` |
| `pnpm typecheck` | 0 | `/tmp/eko-100-typecheck-accepted.log` |
| `pnpm brand:check` | 0 | `/tmp/eko-100-brand-complete.log` |
| `pnpm check:addresses` | 0 | `/tmp/eko-100-addresses-complete.log`; also included in the complete test gate |
| `npm_config_workspace_concurrency=1 VITEST_MAX_WORKERS=1 pnpm test` | 0 | Complete workspace suites, builds and role-image checks; `/tmp/eko-100-test-accepted.log` |
| `git diff --check` | 0 | No whitespace errors |

The complete gate uses one Vitest worker per package and the same workspace concurrency environment used by task 133's passing gate. Package-declared timeouts and all existing assertions are retained. The complete gate passed on the source candidate above: 137 indexer, 224 engine, 294 server, 24 MCP and 230 chain tests, along with the other workspace suites, web/server builds and role-image checks.

Earlier initial focused tests exited 1 because of fixture numeric/binary types and an unnecessary empty read. Initial typecheck exited 2 for the mock function type; those issues were corrected. A later added reorg reproduction exited 1: after rollback, an independent later label overrode an unchanged declaration. The fix forces a declaration boundary when independent evidence would override it; the final 11-test focused run passed. The first full gate was interrupted, exit 130, after that reproduction failed; `/tmp/eko-100-test.log` is partial evidence, not a passing gate. The next full gate exited 1 solely because the pre-existing exact indexer migration list omitted `0150_agent_registry`; `/tmp/eko-100-test-final.log`. All 224 engine tests and 136 other indexer tests passed in that run. The migration expectation was extended, its focused reproduction passed, and the final complete gate runs that corrected candidate. No full gate was repeated without a candidate change. No assertions were weakened and no source test skips were introduced. The existing Foundry fork case remains skipped by its pre-existing environment gate.

## Coverage, cost and remaining dependencies

All new acceptance evidence is synthetic, including the reviewed event profile, identity IDs, owners, wallets and qualified crew attachments. Fixtures cover two registered identities in a batched block and a declared wallet that differs from ownership. This is not a measured chain-4663 registry population or behavioral precision result.

Live requests: **0**. Paid acquisition/runs and charged chain RPC cost: **0**. Live registry count, wallet coverage and wallet-change-event coverage: **unmeasured**. The approximate registry count in the spec is not reported as acquired coverage. Runtime coverage reports enumerate indexed identities/nonzero wallets, scanned mint bounds, contiguous genesis coverage and supplied wallet-event profile status; a partial transfer-only scan cannot invent registration. Supplied profiles are scoped to their verified lifetimes, rather than implying chain-wide coverage.

Remaining inputs:

1. Provide reviewed chain-4663 wallet-change ABI/evidence profiles through `INDEX_AGENT_REGISTRY_PROFILE`, a local JSON array of `RegistryWalletEventProfile` objects. None is checked in or invented. Mint/transfer reads and conservative head discovery work independently; a change discovered only at head becomes effective at that head observation, not at a guessed historical block.
2. Wire the qualified coordination graph into `writeRegistryLabels({crewAt, crewBlocks})` when its provider is available. The adapter accepts qualified attachments and rejects candidates; the default worker also preserves independently written crew attachments. This packet does not implement graph qualification or fingerprint scoring.
3. Acquire and inspect real registry coverage in an environment with authorized metered RPC access. No Census/flow precision gate or public claim is enabled by this work.

Bounded acquisition reproduction, with an existing configured RPC/database environment:

```sh
pnpm --filter @eko/indexer start registry:sync --from 0 --to BLOCK
```

Replace `BLOCK` with an explicit pinned height. This command is prepared and was not run here. Focused offline reproduction commands are the exact commands in the table. The normal engine role projects the acquired evidence on poll; its existing replay command also refreshes labels. Reserved migrations apply through the existing role migration runners.

Sparse registry checkpoints may replay up to one maximum log window (20,000 blocks) to reach a prior canonical anchor; the chain head follower retains its own configured chain-wide reorg depth. If no retained canonical checkpoint is found, registry recovery halts explicitly. Consumers should use `walletLabelsAt` for canonical historical cuts and specify the model generation when reproducing a published generation; raw label rows include retained orphaned/corrected history.

## TODO(spec) inventory

New:

- `agent-registry.ts`: no verified wallet-change ABI/evidence envelope is supplied; accept reviewed profiles explicitly and report the gap otherwise.
- `registry-labels.ts`: the qualified graph provider is absent in this revision; prepare a narrow point-in-time adapter without implementing qualification rules.
- `registry-labels.ts`: withdrawal without qualified crew/fingerprint evidence is represented as Human with confidence 0, no tier and `unclassified: true`. This fallback is not behavioral inference.

Retained in other changed source files:

- `clients.ts`: no preferred WETH/USDG reference fee tier is specified; retain deepest initialized standard-fee-pool selection.
- `worker.ts`: existing derived verdict history still requires explicit canonical reconciliation; that unrelated worker recovery stops conservatively.
- `packages/db/src/client.ts`: heritage server-schema migration remains a later layout task.

The old ERC-8004 Phase A deferral was resolved by this packet. No personal identifiers, home paths or real secrets were added to source, fixtures or this report; all new fixtures are neutral. No source containing personal identifiers was ported.

Checkpoint: `/tmp/eko-100-checkpoint.json`. Final gate session `73636` has completed with exit 0; log: `/tmp/eko-100-test-accepted.log`; measured log lifetime: 568.7 seconds. No validation job remains running. The checkpoint records earlier exits, completed checks, cost/coverage and the next action. This candidate is implemented and fixture-tested; it is not committed, deployed, live-verified or release-approved. Next action after checks finish: lead review and commit.
