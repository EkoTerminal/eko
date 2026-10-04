# Task 081 implementation

Candidate: base `8555f32881fd1fa02d9d8bb0b62a9b2ee59bef49` plus the uncommitted packet-081 changes. SHA-256 of sorted changed source/test paths and contents, excluding this report: `ce288345eb804f877eb3655056eabc404e498cf7075675723e25b3e0b1cacf40` (path, NUL, contents, NUL).

Followed AGENTS including rule 9, packet 081, T-GAP-ANALYSIS, BACKEND §13 and §23 CA-16, FRONTEND §3.8, FACTS §7 and Guard 2.0 §7.3. Built on the merged receipt publications, private commitment outbox, and registry anchor journal. No spec, Guard design, prototype, migration, dependency or lockfile changes. No personal identifiers or real secrets were added. No commit, deployment, paid job, live chain request or external message was performed. Actual paid cost: $0.

## Changed files and behavior

- `packages/db/src/receipt-api.ts`, `packages/db/src/index.ts`: read-only lookup over durable public/private publications, receipt items and historical Guard receipts. Verifies retained canonical bytes, payload hash, leaf and payload identity/version bindings. Anchored responses verify the item's proof against its persisted batch root and authenticate the exact registry event in its successful canonical transaction: configured registry/chain, transaction hash, block/hash, log index, assigned batch ID, root, leaf count and committer. Unknown IDs return not found; malformed or unverifiable stored evidence fails closed.
- `packages/shared/src/contracts/public-receipts.ts`, `packages/shared/test/fixtures/contracts/public-receipts.ts`: additive `ReceiptLookupSchema`/type and frozen sample. Pending responses contain identity, commitment hash, exact leaf and canonicalization version, with no invented proof/root/batch/transaction. Anchored responses include proof, `merkleRoot`, batch ID, transaction/block/hash, registry, chain and event index. The existing `Receipt`/V1/V2 reference contracts remain unchanged.
- `apps/server/src/http/v1/receipts.ts`, `apps/server/src/http/v1/index.ts`, `apps/server/src/app.ts`: register `GET /v1/receipts/:id` with the existing metered mainnet client and no-store responses. Errors expose no storage/private details. Original JSON plus exact canonical payload bytes are returned only after anchoring and the reveal window. Forecast windows start at the authenticated commit block timestamp; snapshot verdicts have no future window. Private items expose commitment/proof data only, for every caller. D0 owner POST reveal is deliberately unregistered.
- `apps/server/test/v1-receipts.test.ts`: seven PGlite/HTTP-injection tests covering durable/prepared pending states, retained V1/V2 fixture bytes and proofs, legacy/current forecast timing at the millisecond boundary, tampered payload/leaf/proof/root/item/event, unknown batch, wrong registry/committer/transaction/chain/block, removed/duplicate events, historical Guard fallback/recovery/orphans and anonymous/owner/foreign-session private access. No network or listening port is used.

## Checks and checkpoint

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/server test test/v1-receipts.test.ts` | 0 | 7 tests, final implementation |
| `pnpm --filter @eko/shared test test/contracts.test.ts` | 0 | 190 tests, including the new schema sample |
| `pnpm typecheck` | 0 | All workspace packages; `/tmp/eko-081-typecheck.log` |
| `pnpm --filter @eko/shared typecheck` | 0 | Rechecked the subsequent sample-only addition; `/tmp/eko-081-shared-typecheck.log` |
| `pnpm test` | 0 | 127 Vitest files / 2391 tests, 33 Foundry passes, web/server builds and compiled role-image gate; `/tmp/eko-081-test.log` |
| `pnpm brand:check` | 0 | 134 files after builds |
| `pnpm check:addresses` | 0 | 347 source files |
| `git diff --check` | 0 | No whitespace errors |

The first focused run found an incorrect revision ID in the V2 fixture insertion helper; the helper now preserves the original revision ID. The first full gate found the missing frozen sample for the new exported schema; the sample was added and the focused shared gate passed before restarting the full gate. No existing test was weakened, removed or newly skipped.

Checkpoint: `/tmp/eko-081-checkpoint.json`; full-test process 54137 completed with exit 0, log `/tmp/eko-081-test.log`. No check remains running. The indexer replay/catch-up suite took 309.50 seconds; no duplicate gate was launched while it ran. The existing Foundry live-fork test skipped because `RPC_HTTP_URL` was unset; no new skip was added.

Coverage is the named synthetic scenarios, not a numeric coverage percentage or live acceptance evidence. The private-anchor test inserts synthetic committed evidence; it does not demonstrate actual worker private batching. Web/server artifacts were built and the compiled role-image gate passed. Next action: lead review/commit, private batching follow-up and separately authorized operator acceptance. Nothing was deployed or live-verified; no release or owner approval is claimed.

## TODO(spec), dependencies and reproduction

New TODO(spec) notes:

1. `packages/shared/src/contracts/public-receipts.ts`: CA-16's frozen `Receipt` requires anchor fields even while pending. Use an additive discriminated lookup shape without fabricated zero/empty anchors.
2. `packages/db/src/receipt-api.ts`: a complete historical V1 forecast payload schema is not frozen. Accept its original `forecast-1`/positive integer `windowSec` fields, verify the exact original bytes, and never guess a window from recording/presentation time.

External dependencies: resolved registry deployment/configuration, retained chain receipt/header availability through the metered client, funded/configured committer and separately authorized live acceptance. V2 remains shadow/inactive. Browser receipt UI/export belongs to 113; D0 explicit owner reveal remains unavailable here.

Existing integration defect reproduced outside this packet's code changes: `ReceiptCommitJournal.batch()` calls public-only `ReceiptOutbox.get()` for every queued item. A private commitment therefore raises `TypeError: Cannot read properties of null (reading 'item')` at `packages/db/src/receipt-committer.ts:58`. This needs a receipt-worker/private-outbox follow-up before claiming real private anchors. Diagnostic exit: 1, expected for the reproduced defect; log `/tmp/eko-081-private-batch-repro.log`. No database persists after this in-memory reproduction:

```sh
pnpm --filter @eko/server exec node --import tsx --input-type=module -e 'import {openDb,migrate,migrateEngines,publishPrivateReceipt,ReceiptOutbox,ReceiptCommitJournal} from "@eko/db"; const db=await openDb({pgliteDir:":memory:"}); try { await migrate(db); await migrateEngines(db); await publishPrivateReceipt(db,"fixture-private-batch",`0x${"ab".repeat(32)}`,"2026-10-02T00:00:00Z"); await new ReceiptOutbox(db).recover(); const journal=new ReceiptCommitJournal(db); await journal.acquire(); await journal.batch(Date.parse("2026-10-02T00:05:00Z")); } finally { await db.close(); }'
```

The passing reproduction commands for this packet are the focused checks above. All evidence is fixtures/local builds; no production latency, Postgres concurrency, chain deployment, live finality or release approval is established.
