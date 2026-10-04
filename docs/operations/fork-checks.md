# Metered pinned fork checks (task 138)

The lead runs these commands in an environment with the existing Foundry `anvil` executable, ports and archive RPC access. The worker runs offline fake-upstream tests only. No new dependency or migration is required.

Export `RPC_HTTP_URL` from the existing secret environment; never put its value in a manifest, command argument, log or checked-in file. Set the same `DATABASE_URL` and `RPC_PAID_DAILY_BUDGET` used by other paid readers so the persisted daily guard is shared. Alternatively, a standalone single-process check may use `RPC_USAGE_DIR`; separate directories do not share a budget. `RPC_SESSION_BUDGET` is mandatory and finite. Requests, failures and HTTP batch items use task 024 accounting and configured `RPC_WEIGHTS` (one unit per unspecified method). The fork transport is paid-only for **all** methods, including chain metadata and headers. There is no public fallback.

From the repository root, one command owns the gateway and one Anvil process, checks the first N coins at manifest block B, executes $100/$1k independently for EOA and the supported contract probe, writes observations/matches/ledger, then shuts both down:

```sh
RPC_SESSION_BUDGET=2000 pnpm --filter @eko/chain fork:check /private/tmp/eko-fork-manifest.json /private/tmp/eko-fork-results.json 5
```

`5` is the number of manifest coins, not an additional on-chain discovery scan. Omit it to run all supplied coins. Default ports: gateway 9545 and Anvil 8545, both bound to `127.0.0.1`. Override with `EKO_FORK_GATEWAY_PORT` / `EKO_FORK_ANVIL_PORT`; use unused ports. The command spawns Anvil without a remote fork URL, then supplies only the loopback gateway in every `anvil_reset`. Every case resets to the manifest pin under `SerializedMeteredForkLease`; the Pons adapter also rechecks the original pin after the cases. SIGINT/SIGTERM stop subsequent work, retain completed results and close the owned process, server and meter. Budget refusal is a JSON-RPC error, never a retry on another provider. A failed run exits nonzero and records the available partial evidence. Setup failure exits nonzero before acquisition.

## Manifest

The JSON object contains:

- `cursor`: the existing full `GuardCursor` (chain 4663, decimal-string `blockNumber` and `timestampSec`, verified `blockHash`, `boundary: "block_end"`, null transaction/execution indices).
- `ethUsd`: `{numerator, denominator, blockHash, evidenceIds}` with decimal strings, positive rational USD per ETH and price provenance at that exact block hash. This converts each USD size to native wei without floating-point rounding.
- `coins`: an array of either `{kind: "pons", route, matches, delaySec, held?}` or `{kind: "v3", route, matches, expected}`. Supply the existing adapter's verified route, never invented deployed bindings. Pons charge-term `bps`/`fixedWei` and v3 `deadline` are decimal strings in JSON.

Pons routes must be reviewed, measured, code/config/profile/source pinned, non-exempt and have reconciled charges, recipients, limits and cooldown/decay. The task 040 report lists the required `PonsCurveRoute` fields. Optional held positions retain the task 040 sell-only path and actual quantities; token storage is never funded or overridden.

V3 routes use `ReferenceRoute` from task 068 (native-entry router/quoter/path pins and cooldown). `expected` contains independently obtained `ForkMatch` predictions, with `venue: "uniswap_v3"`, the exact size/class, and `caseId: "COIN:BLOCK_HASH:ROUTE_ID:ACCOUNT_CLASS"`. Without a matching independent prediction, observations are retained but no v3 match record is generated. Do not copy current-run outputs into predictions. `matches` contains previously reviewed matches used by the existing acceptance code; a new output does not automatically accept itself.

The compatibility command for the existing single-curve task 040 manifest now also owns its gateway and Anvil; no manually started processes or local endpoint environment variables are needed:

```sh
RPC_SESSION_BUDGET=2000 pnpm --filter @eko/chain exec tsx src/simulation/pons-fork-cli.ts /private/tmp/eko-pons-manifest.json /private/tmp/eko-pons-results.json
```

## Standalone gateway

For another adapter that already owns its serialized Anvil process, write the full verified cursor to `pin.json` and start:

```sh
RPC_SESSION_BUDGET=2000 pnpm --filter @eko/chain fork:gateway /private/tmp/eko-fork-pin.json
anvil --host 127.0.0.1 --port 8545 --chain-id 4663 --fork-url http://127.0.0.1:9545 --fork-block-number 77438503
```

The number in that example must equal the supplied cursor's verified block. Stop Anvil first, then SIGINT the gateway for its final ledger. The standalone HTTP service has no pin-changing or unmetered administrative endpoint. Module users use `gatewayReset` with the owned gateway and `SerializedMeteredForkLease` to change pins between cases. Importing modules starts no process or socket.

## Allowlist and immutable cache

Allowed methods, explicitly:

`eth_chainId`, `net_version`, `eth_blockNumber`, `eth_getStorageAt`, `eth_getCode`, `eth_getBalance`, `eth_getTransactionCount`, `eth_getProof`, `eth_getBlockByNumber`, `eth_getBlockByHash`, `eth_getTransactionByHash`, `eth_getTransactionReceipt`, `eth_getBlockReceipts`.

`eth_blockNumber` returns the pinned number locally without spending. All forwarded calls use the metered fork archive client. State/proof selectors must be the pinned number or `{blockHash: PIN, requireCanonical: true}`. Omitted selectors, `latest`, `pending`, `safe`, `finalized`, other state blocks/hashes and future blocks are rejected before sending. Numbered ancestor block headers/receipts are allowed for Anvil's historical lookup. Hash-based block lookup is limited to the pinned hash; transaction/receipt results must be mined at or before the pin. Chain ID and the pinned header's number/hash/timestamp are checked before caching. New Anvil versions requiring another method fail explicitly; expand the allowlist only with a pinned-read validation and a test. Writes, `debug_*`, `trace_*`, `eth_call`, gas-price reads and every other method are refused at the gateway. Local Anvil executes transactions/debug traces itself; these are not archive passthroughs.

The disk cache defaults to `.data/fork-cache/cache.json`, capped at 64 MiB of serialized bytes; configure `EKO_FORK_CACHE_DIR` and `EKO_FORK_CACHE_BYTES`. Use a dedicated directory with one gateway owner. Entries use a digest of schema version, full cursor (including hash), method and canonicalized params; values are JSON-RPC results, with no endpoint URL/key. The oldest entries are evicted until the file fits. Writes use a temporary file and atomic rename with private file permissions. Failed/null responses are not cached. Corrupt cache files fail closed. Duplicate batch reads share the serial dispatch queue and reuse the first result. A rerun of retained reads at the same pin costs zero upstream units; eviction, changed pins or new reads incur new metered requests. The immutable cache relies on the supplied reviewed hash: reacquire/review canonicality separately if that pin may have been reorganized.

## Output and spending estimate

`metered-fork-check-1` output includes actual `upstreamRequestUnits`, `cacheHits`, per-method requests/forwarded counts/units/hits, the task 024 usage snapshot, results, match records and a failure marker. Local transaction calls are never counted as upstream units. Logs contain method counts and numerical usage, never URL, credentials, params or provider error bodies. The gateway returns fixed errors such as `rpc_session_budget_reached`, `rpc_budget_exhausted`, `fork_unpinned_read` and `fork_upstream_unavailable`.

Pons match records use local formula predictions against executed debit/return and observed network fees. Two confirmation wallets share a case identity, so they do not turn one coin/state into multiple diverse acceptance cases. V3 records compare supplied independent expectations against the local contract probe and two EOA confirmations. This does not establish arbitrary smart-account support, independent-provider reproduction, L1/network pricing fidelity or the existing minimum diverse-match acceptance gate. Charged dollars and pricing remain null until reconciled to provider billing; configured weighted units are reported as units, not fabricated dollars.

Estimate **tens to a few hundred upstream reads per cold Pons wallet/size execution**, primarily lazily touched storage, account code and balance loads. A coin runs two sizes × two classes × two confirmation wallets (eight executions), plus pin checks. Plan roughly 160–2,400 cold reads before cross-case cache reuse; shared curve/token/recipient storage substantially reduces later cases. Begin with one coin and a 2,000-unit session, inspect the ledger and adjust the next authorized session from measured counts. A cutoff may leave that coin incomplete. Retained identical reruns need zero upstream calls; this is an estimate, not a live measurement.

Implementation follows Guard 2.0 §§3.4 and 8 and task 024 spend-guard rules. Existing route/profile/cooldown/evidence requirements remain mandatory. No spec files were edited. The old gateway-installation TODOs in the task 040/068 implementations are resolved here; provider weights/pricing and independent live match acquisition remain lead checks.

## Build a Pons manifest (task 139)

`fork:manifest` needs no Anvil process or listening port. All RPC reads use the paid-only `createMeteredClients().forkArchive`, under the existing daily guard and a required finite session budget. State/code calls use `{blockHash, requireCanonical:true}`; the builder verifies chain 4663 and rechecks the numbered header before writing. It writes the `ForkCheckManifest` plus `manifestBuild` containing per-coin status/reason, exact read evidence/digests, request count and actual weighted units. Routes always have `origin: "measured"` and `verification.reviewed: false`. Unsupported candidates stay in the status/evidence report and are excluded from executable `coins`.

With the existing secret environment exported, from the repository root:

```sh
RPC_SESSION_BUDGET=200 pnpm --filter @eko/chain fork:manifest 77438503 --coins "$PONS_COINS" --review /private/tmp/eko-pons-code-review.json --output /private/tmp/eko-fork-manifest.json
RPC_SESSION_BUDGET=500 pnpm --filter @eko/chain fork:manifest head-minus 20 --from-db 5 --review /private/tmp/eko-pons-code-review.json --output /private/tmp/eko-fork-manifest.json
```

`PONS_COINS` is a comma-separated list of coin addresses, not curves. Choose either `--coins` or `--from-db`; database discovery requires `DATABASE_URL`. It orders indexed Pons coins by their latest curve trade at/before the pin, including log order within a block, excludes indexed graduations at/before the pin, and checks `graduated()`/`readyToGraduate()` on the archive. Confirmed graduated/ready candidates are skipped in favor of the next candidate. An unknown candidate retains its unsupported status and occupies a requested discovery slot; unknown state is never treated as proof of eligibility. No migration runs. The illustrative block must be replaced with the lead's intended pin.

The optional `--review` file is **code-path evidence**, not route approval. Without a matching deployment review the builder reports `unknown_factory_layout`. The published factory's `getLaunchedToken(address)` has a 15-word static record but does **not** expose launch timestamp, launch block or the snapshotted snipe duration; the executable notes do not document those deployed getters either. There is no default timing binding. Never use the factory's current global `snipeTaxSeconds()` as a historical launch snapshot. A missing verified per-launch getter is unsupported, including outside the snipe window.

Review-file schema (exported as `ManifestReviewSchema`):

- `schemaVersion: "pons-manifest-review-1"`; `deployments` is an array.
- Each deployment has `coinCodeHash`, `curveCodeHash`, `factoryCodeHash`, `sourceRevision`, and nonempty digest `evidenceIds` from the deployed-code/source review. All hashes are 32-byte hex values. Published source alone cannot establish a deployment match.
- `timing: {launchTimestamp, snipeWindow, launchBlock}` contains **reviewed deployed function signatures**, each of the form `functionName(address)`, taking the coin and returning exactly one uint256. They must read that launch's frozen values on the factory. Every signature must occur in its deployed dispatcher. Do not populate this file with hypothetical getter names.
- `exemptionEventsExhaustive` is true only when review proves every automatic and declared exemption is represented by `SnipeTaxExempted(address indexed account)` on the curve, with no unlogged mutation path. The CLI reads the launcher/fee recipient from the factory record and fetches the entire launch-block-to-pin event range in pages of at most 100,000 blocks. A partial list keeps `complete: false` and the candidate unsupported.
- `noCooldown` and `noEntryLimits` require review of all reachable deployed coin/curve trading code, including any delegate/proxy/hook paths. A missing cooldown proof yields `cooldown: null`; missing limit proof remains unknown. A selector scan alone proves neither absence. The current builder supports the published static launch-record layout and direct native curve wiring only; unknown factory layouts need a separately verified adapter extension.

Before flipping `verification.reviewed` by hand, confirm:

1. The pin/header is canonical and all three deployed code hashes match the reviewed executable code. Dispatcher PUSH4/EQ/jump checks establish selector presence, not its semantics. Coin/curve/factory wiring and native quote must match.
2. Buy/sell bindings are `buy(amount,0,recipient)`/`sell(amount,0,recipient)`, spender is the curve, and reserve getters have the reviewed meanings. Both fee terms use gross quote; verify deployed rounding, refunds and anti-snipe charge order on a fork. The active snipe term is buy-only and marked `inSnipeWindow`; exit decay uses the launch's snapshot, never a global default.
3. Exemption event coverage and completeness, payout destinations, limits and cooldown evidence are exhaustive. Payout reads include creator, protocol recipient and fee escrow. `quoteFeeBalance()` plus `creatorTaxBalance()` hold the independent fee buckets; **exclude `buybackQuoteBalance()`**, which is already inside `quoteFeeBalance`. Observation `buyAccruals`/`sellAccruals` record signed deltas; every payout and accrual delta must be non-negative and their sum must equal the observed charge. Sweeps that decrease buckets remain a mismatch under this reconciliation.
4. The pinned 4663 receipt evidence contains a positive `gasUsedForL1` component no larger than `gasUsed`; confirm the provider's Arbitrum receipt semantics that total `gasUsed` includes L1 before accepting network accounting. Missing evidence leaves the candidate unsupported, rather than defaulting the boolean.
5. ETH/USD comes from the deepest initialized positive-liquidity WETH/USDG standard-fee pool, in the indexer's discovery order `[100,500,3000,10000]`; ties retain the first. Confirm token order/registry decimals and price provenance at the exact hash. The price is a reduced integer rational, not a rounded indexer USD row.
6. Builder `profileHash` and `stateFingerprint` are **candidate read digests**. Bind/replace them with the reviewed task 039 control-profile values before normalizer integration; they do not create a completed control profile. Confirm `sourceRevision` and all pins against that profile. Do not fabricate historical matches or mark acquisition evidence as route acceptance. Keep `matches: []` until separately reviewed evidence exists; the existing diverse-match and fidelity gates still apply. Choose `delaySec` explicitly for a delayed check and retain the primary check separately.

After this review and manual route approval:

```sh
RPC_SESSION_BUDGET=2000 pnpm --filter @eko/chain fork:check /private/tmp/eko-fork-manifest.json /private/tmp/eko-fork-results.json 1
```

Estimate **26 + ceil((pinBlock − launchBlock + 1)/100000) archive requests per complete coin**, before shared factory-code/read reuse, plus **8–20 shared requests per invocation** (chain/header/receipt checks and price discovery; add one for `head-minus`). These are units only when each method's configured weight is one. With one log page this is 27 requests per coin; four distinct initialized price pools give 20 shared requests. Identical reads are reused within the builder, but it has no persistent cache across CLI invocations. Missing selectors/layouts stop that coin early; retries and long exemption histories spend additional metered units. The CLI prints the actual session units. Start with one coin under a 200-unit budget and inspect the report. No live provider cost or deployed supported-route coverage was measured in the worker sandbox.
