# Task 138 implementation report

Implemented inside `@eko/chain`, without dependencies, migrations, lockfile changes, spec edits, commits or external acquisition. The worktree was clean before this task. Rule 9 was followed; no personal identifiers or real credentials were added or ported.

## Files

- `packages/chain/src/simulation/fork-gateway.ts`: loopback HTTP handler/server, strict pinned-read allowlist, paid metering, disk cache, fixed errors and numerical ledger.
- `packages/chain/src/simulation/fork-gateway-cli.ts`: standalone pinned gateway CLI with finite-session admission requirement and shutdown reporting.
- `packages/chain/src/simulation/fork-runtime.ts`: owns one Anvil process, loopback-only RPC/reset callback, serialized lease and shutdown of Anvil/server/meter.
- `packages/chain/src/simulation/fork-check-cli.ts`: N-coin pinned $100/$1k Pons/v3 runner, local v3 contract trace, independent EOA confirmations, acquired match records and actual upstream units/cache hits. Partial results are retained on acquisition failure.
- `packages/chain/src/simulation/pons-fork-cli.ts`: existing single-curve manifest now uses the owned gateway/runtime; optional real held-position checks remain supported.
- `packages/chain/src/simulation/anvil.ts`: retires the resolved gateway configuration TODO; shared serialization behavior remains.
- `packages/chain/src/rpc/{clients,routes}.ts`: adds `forkArchive` and a paid-only `fork` context for metadata, headers and storage alike. Other routing contexts retain their behavior.
- `packages/chain/{package.json,src/index.ts}`: CLI scripts and module exports. No dependency declarations changed.
- `packages/chain/test/{fork-gateway,fork-runtime}.test.ts`: offline fake-upstream/HTTP-stream/process-lifecycle coverage without sockets.
- `packages/chain/test/{reference-anvil,pons-simulation}.test.ts`: existing execution assertions retained, with local v3 runner and acquired-match checks added.
- `docs/operations/fork-checks.md`: exact lead commands, manifest requirements, cache/ledger semantics, estimates and acceptance limitations.

## Allowlist and cache

Allowed: `eth_chainId`, `net_version`, `eth_blockNumber`, `eth_getStorageAt`, `eth_getCode`, `eth_getBalance`, `eth_getTransactionCount`, `eth_getProof`, `eth_getBlockByNumber`, `eth_getBlockByHash`, `eth_getTransactionByHash`, `eth_getTransactionReceipt`, `eth_getBlockReceipts`.

The pinned block number is answered locally. Every forwarded call uses task 024's metered paid-only transport; neither daily nor session closure permits public fallback. Storage/account/proof reads require the exact pin; moving tags, missing selectors and future reads fail before admission. Numbered ancestors support historical Anvil lookup. Header/chain mismatches fail before caching; transaction results must be mined no later than the pin. Writes, debug/trace methods and everything outside the list are refused.

Cache entries are keyed by a digest of version/full cursor/method/canonical params. One gateway owns the directory. The JSON file is atomically replaced, privately permissioned and capped at 64 MiB by default, with oldest-entry eviction. Errors/null responses are not cached; corrupt cache fails closed. Retained same-pin reruns spend zero upstream units, including after budget closure. New reads/pins and evicted entries are metered. Logs contain allowed method counts, units and cache hits, never params, URLs, keys or provider bodies.

## Lead command and expected calls

After supplying the existing secret environment and shared daily budget database, run from the root:

```sh
RPC_SESSION_BUDGET=2000 pnpm --filter @eko/chain fork:check /private/tmp/eko-fork-manifest.json /private/tmp/eko-fork-results.json 5
```

This checks five supplied coins at the manifest's block, both primary sizes and supported account classes. Exact manifest and standalone/compatibility commands are in `docs/operations/fork-checks.md`. Defaults are gateway 9545 and Anvil 8545 on `127.0.0.1`; no paid URL is supplied to Anvil. Reset runs through the owned gateway between cases. Output includes configured weighted upstream units, method counts, hits, meter snapshot, observations and the existing fork-match shapes. Actual provider pricing/charged dollars remain null until independently reconciled.

Estimate tens to a few hundred touched-storage/code/balance reads per cold Pons wallet/size case, roughly 160–2,400 before reuse across eight cases per coin. Start with one coin under the finite session cap, inspect actual ledger counts, then set the next authorized session accordingly. Retained identical reruns incur zero upstream calls. This is an estimate; no live count was acquired.

Pons predictions use local formula output plus observed network fees. V3 match records require separately supplied expectations bound to coin/block/route/class/size. Fixture-origin Pons results cannot become measured match records. Confirmation wallets share a case identity, preserving the existing diverse-case gate. New observations do not accept themselves or certify arbitrary smart accounts, independent-provider restriction reproduction, or network-fee pricing fidelity.

## Spec and remaining work

Followed task 138; task 024 daily/session metering; verified Pons executable notes; task 040/068 adapter contracts; Guard 2.0 §§3.4 and 8. No new `TODO(spec)` was introduced. The gateway-installation TODOs are resolved. Supplied reviewed routes, pinned ETH-USD provenance, cooldown/profile bindings and independent matched evidence remain required by the existing adapters. The lead runs the first real fork and validates current Anvil/provider method compatibility and pricing. No network, ports, real fork matches or paid acquisition were used here.

## Verification

- `pnpm typecheck`: passed, exit 0, final candidate.
- Focused five-file fork/reference/Pons suite: 33 tests passed, exit 0.
- `VITEST_MAX_WORKERS=1 pnpm test`: passed, exit 0; 2,621 workspace tests, including 214 chain tests, followed by web/server builds and built-role fixture checks.
- `pnpm brand:check`: passed, exit 0; 145 served/configured files after the builds.
- `pnpm check:addresses`: passed, exit 0; 393 source files.
- `git diff --check`: passed, exit 0.

The first full-gate attempt stopped at the address checker before workspace tests: its import scanner mistook a Node HTTP import preceding the viem quantity helper for a raw viem transport. Reordering those imports resolved the scanner match without weakening it. The final complete gate passed on the finished source; no test assertions were removed, skipped or relaxed.

Gate logs: `/private/tmp/eko-138-typecheck-final.log` and `/private/tmp/eko-138-test-final.log`. All verification processes have exited. Nothing was committed or pushed; the lead commits and runs the first real fork. Live/archive acquisition: zero calls, zero paid units, zero measured fork matches.
