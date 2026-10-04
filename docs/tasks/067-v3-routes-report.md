# Task 067 implementation report · 2026-10-02

Candidate: uncommitted changes on base `42ccea5ebd58847e8875c30667dc559d0d34b912`.
Source SHA-256: `1bf45b75b58b0372cb3c2d82526e5d5e1fe4d25099ef89600fb20fc39ad2c2b7`.
The fingerprint hashes the four code/test paths listed below in sorted order, each as path + NUL + file bytes + NUL; this report is excluded.

## Changes and scope

- `apps/server/src/exec/chain.ts`: adds `UniswapV3Adapter.quoteTrade` for CA-7 route construction on 4663. The heritage market adapter's execution logic is preserved. Existing ABI/error exports remain compatible.
- `apps/server/src/exec/v3-routes.ts`: shared heritage v3 ABIs; indexed SQL pool source; pinned decimals, factory identity, slot and QuoterV2 reads; supported tiers 100/500/3000/10000; best output USD after total network cost; ETH and USDG exact-input buy/sell legs; raw input/output/minimum, native value, exact token approvals, pool impact, expiry and block. Only registry-verified WETH/USDG quote assets are eligible. Terminal fees are always zero in this launch constructor, with null destination and no terminal-fee calldata. No later unverified router function was added.
- `apps/server/test/v3-routes.test.ts`: injected fixtures cover both directions, 6/8/18 decimals, token ordering, net versus gross selection, cross-asset comparison, raw-unit flooring, exact recipient/value/amount encoding, slippage, absent/noncanonical pools, reverted quotes, RPC errors, missing prices/fees and unavailable execution.
- `apps/server/test/fork/live-route.fork.test.ts`: optional validated `FORK_BLOCK_NUMBER` forwarded to Anvil; all heritage fork assertions preserved.
- `docs/tasks/067-v3-routes-report.md`: this handoff.

Followed BACKEND §§6.1, 12.1–12.3 and §23 CA-7, with FACTS §7 shared types. No changes to read-only specs, Guard logic, other packets, dependencies or lockfile. No personal identifiers were introduced or ported.

## Verification

| Exact command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/server exec vitest run test/v3-routes.test.ts test/chain-registry.test.ts` | 0 | 2 files, 27 tests passed; `/tmp/eko-067-focused.log` |
| `pnpm typecheck` | 0 | All workspace typecheck scripts passed; `/tmp/eko-067-typecheck.log` |
| `pnpm test` | 0 | Full workspace gate passed: 84 test files / 1,622 tests; `/tmp/eko-067-test.log` |
| `pnpm brand:check` | 0 | 15 files checked; `/tmp/eko-067-brand.log` |
| `pnpm check:addresses` | 0 | 267 source files checked; `/tmp/eko-067-addresses.log` |
| `git diff --check` | 0 | Tracked diff whitespace check |

The initial `pnpm --filter @eko/server test -- test/v3-routes.test.ts test/chain-registry.test.ts` invocation ran the broader server suite (14 files / 109 tests, exit 0); the explicit `exec vitest` command above supplies the focused final-candidate evidence. An intermediate server typecheck also exited 0. No full gate has been restarted.

## Availability, dependencies and reproduction

This is prepared unsigned construction with fixture verification. It does not create a full Guard result, invent taxes, declare account binding or register a trade endpoint. Returned `route.executable` remains false until the separately owned probe/Guard/preflight integration accepts the route. This preserves the packet's requirement to keep unaccepted features unavailable.

Callers must inject block-bound USD prices and a total-network-fee estimator for the exact unsigned bytes (L2 execution plus L1 data). Missing prices refuse with `stale_data`; missing fee evidence refuses with `sim_unavailable`. Quoter gas alone is never presented as total network cost. Any live implementation of these sources must use task 024 metered clients. Indexed pools are loaded with `indexedV3Pools(db.sql)` and verified against the registry factory at the quoted block. Mandatory Guard, actual-account revalidation, screening and the v1 quote/order lifecycle remain with their owning packets, including 052/068/074/075. No new `TODO(spec)` was added; the pre-existing task-024 pager TODO in `chain.ts` is unchanged.

No live fork, paid job, deployment, commit, push or approval was performed. No live-chain acceptance or production build is claimed. The checks use local/injected evidence; no live-chain acquisition cost was incurred. The full-test checkpoint is complete for the candidate fingerprint above: session `62192` exited 0 after about four minutes, with logs retained at `/tmp/eko-067-test.log`. No job remains running. The next external validation is the authorized pinned fork run below and the owning packets' Guard/preflight integration.

Exact pinned heritage fork command for the lead, on a host with Anvil, ports and an approved metered archive upstream:

```sh
FORK_BLOCK_NUMBER=77438503 FORK_URL="${METERED_FORK_URL:?set an approved metered archive upstream}" pnpm --filter @eko/server test:fork
```

Block 77438503 is an existing task-016 chain-fixture block, not newly acquired evidence. `METERED_FORK_URL` must cover Anvil's upstream reads through the task-024 spend controls; do not substitute a raw paid provider URL. Archive availability, liquidity and fork acceptance at this pin remain unverified here. The heritage suite covers its existing ETH/USDG execution cases; generic-coin acquired-position probe acceptance remains task 068. No fork command was run because this sandbox has neither network nor ports.
