# Task 124 implementation

Candidate: `1b9bdfcb4a8bbe8f7615f9582691412347dffee1` plus the uncommitted changes listed below. SHA-256 of sorted changed source paths and contents, excluding this report: `d2f1f0fb735b3247c3a31fcf6979eb36cba103f57846d45f656213060d5640bc`.

Followed BACKEND §23 CA-25 and FRONTEND §§6, 9. Read AGENTS including rule 9, the packet, and T-GAP-ANALYSIS. Read-only specs, Guard logic, prototype, dependencies and lockfile are unchanged. No personal identifiers or real secrets were added or ported. No commit, push, deployment, publication, external message, live chain call or paid job was performed. Actual paid-job cost: $0. No production build or browser/fork acceptance was run.

## Changed files and behavior

- `apps/server/src/http/v1/rpc.ts`: POST `/v1/rpc`, JSON-RPC responses, strict envelopes/parameters, 16 KiB request limit, 120 requests/minute per IP, no-store responses and fixed error messages. Allows exactly `eth_chainId`, `eth_blockNumber`, `eth_getBlockByNumber`, `eth_feeHistory`, `eth_call`, `eth_getBalance`, `eth_getCode`, `eth_estimateGas`, `eth_gasPrice`, `eth_getTransactionByHash`, `eth_getTransactionReceipt`. No sends, unknown methods, notifications, batches, non-latest tags or block-hash selectors. Strips third-parameter state overrides from `eth_call`; rejects extra override parameters and transaction fields. Accepts only a chain-4663 client; a mismatched `eth_chainId` response fails closed.
- `apps/server/src/http/v1/index.ts`, `apps/server/src/app.ts`: register the route with the existing task-024 metered mainnet client. Only validated method/params reach its transport; browser authorization, cookies and headers never reach the provider. Shared metering, provider rate caps, persisted paid budgets and fallback rules remain task-024-owned.
- `apps/server/src/http/v1/demo.ts`: permit the bounded read-only POST in demo sessions, preserving other write refusals.
- `apps/web/src/lib/wallet.ts`: mainnet wallet reads use `${API_BASE}/rpc` (same-origin `/v1/rpc` by default), with credentials omitted and HTTP batching/retries disabled. Disable wagmi multicall aggregation so latest contract reads remain individual proxy requests. Export `receiptReadClient` from the same wagmi configuration for packet 113. Testnet remains dev-only, using its public endpoint with credentials omitted.
- `.env.example`, `apps/web/playwright.config.ts`: remove browser RPC overrides. Fork/provider configuration belongs on the server; browser builds contain the API endpoint only.
- `apps/server/test/v1-rpc.test.ts`: every allowed method, actual metered fixture accounting, stripped overrides, header isolation, denied methods, mixed batches, notifications, historical selectors, malformed/oversized inputs, resource caps, provider failures, chain mismatch, IP caps despite cookie rotation, application registration and demo-session reads.
- `apps/web/src/lib/wallet-rpc.test.ts`: mock-fetch wallet chain reads, latest registry contract reads and transaction-receipt reads through the shared endpoint; credentials absent; legacy browser override ignored; production chains exclude testnet.
- `docs/tasks/124-implementation.md`: this handoff and privileged-read boundaries.

The backend table writes `POST /rpc` under the versioned API; FRONTEND CA-25 explicitly names `/v1/rpc`. The route uses the existing `/v1` registration convention. No unversioned alias was added.

## Privileged services and remaining integration

Do not broaden this proxy for historical state or block headers, `eth_getLogs`, `eth_getStorageAt`, `debug_*`/`trace_*`, simulations with overrides, block-receipt scans, transaction-count/priority-fee methods, or subscriptions. Archive/simulation/Guard work belongs in the metered backend services; indexed histories and streams belong in the read API. Transaction replacement scans that request explicit block numbers must use the owning backend execution service. Sends and wallet signing stay with the connected wallet.

Hash-based transaction/receipt lookup is explicitly allowed, even for a previously mined transaction. Receipt verification can read the registry at `latest` and inspect the anchoring transaction's receipt/events without requesting historical state or logs. Packet 113 owns the verifier/module/UI and must consume `receiptReadClient`; those surfaces do not exist in this candidate and are not claimed implemented here. Packet 081 supplies receipt/proof API data. Tasks 024 and 090 are present and reused.

Deployment still needs a correctly configured chain-4663 provider, API routing/CORS for the public frontend origin, and an ingress that overwrites forwarded-IP headers consistently with the application's existing trusted-proxy setting. The 120/min IP counter is local to each API instance; task-024 SQL paid-budget accounting is shared across processes. No deployment or distributed rate-limit service was introduced.

## TODO(spec)

1. `apps/server/src/http/v1/rpc.ts`: CA-25 does not provide numeric resource bounds. This implementation caps request bodies at 16 KiB, calldata at 4 KiB, call/estimate gas at 5,000,000 (also the default), fee history at 1,024 blocks and reward percentiles at 100. Transactions require a target address and known transaction fields; deployment simulation stays outside the public proxy.
2. `apps/server/src/http/v1/rpc.ts`: CA-25 does not define batches or notifications. Reject both before dispatch, so each admitted request can execute at most one requested metered method. Provider retries/fallback remain separately metered by task 024.

## Checks and reproduction

Run these commands from the worktree root. The new focused suites use Fastify injection, in-memory usage storage, fake provider callbacks and mock fetch; they require no listening port or live provider. Fixtures establish contract behavior, not live provider capability, billing, deployed security or release acceptance. No existing assertion was removed, skipped or weakened.

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/server exec vitest run test/v1-rpc.test.ts` | 0 | 35 tests; `/tmp/eko-124-server-focused.log` |
| `pnpm --filter @eko/web exec vitest run src/lib/wallet-rpc.test.ts` | 0 | 2 tests; `/tmp/eko-124-web-focused.log` |
| `pnpm typecheck` | 0 | All workspace packages; `/tmp/eko-124-typecheck.log` |
| `pnpm test` | 0 | 89 test files, 1,707 tests; brand self-test/address gate; `/tmp/eko-124-test.log` |
| `pnpm brand:check` | 0 | 15 files; `/tmp/eko-124-brand.log` |
| `pnpm check:addresses` | 0 | 275 source files; `/tmp/eko-124-addresses.log` |
| `git diff --check` | 0 | No whitespace errors |

An initial browser test used the wrong mock-fetch signature (exit 1); corrected it to viem's URL/init signature. The initial workspace test/address gate stopped at the existing raw-transport checker (exit 1); the receipt client now reuses wagmi's public client rather than creating another client. That integration exposed wagmi's default multicall aggregation (browser check exit 1); disabling it produced the final passing browser check. These were local fixture/integration findings, with no live reads or paid work.

Checkpoint: `/tmp/eko-124-checkpoint.json` contains the candidate fingerprint, changed source paths, completed checks and workspace test process/log. Process session 53441 completed with exit 0; no test job remains running. Legacy suites count metered attempts against unroutable loopback fixture endpoints; those counters are not paid-provider or live-chain evidence. Coverage is the repository's checked-in unit/injection/fixture suites; operational and browser/fork acceptance remain external. Next action is downstream receipt-verifier integration and authorized deployment acceptance. No automatic continuation is scheduled.
