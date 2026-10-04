# Task 079 implementation

Candidate: `95b345c194749b151d052f99a7b9216f9f0cf4e0` plus the uncommitted packet-079 changes. Source-content SHA-256 (sorted changed paths and contents, excluding this report): `45d53f665712cabb34e9e0bf81134395203a04cb38939702cff2bbe1722da07c`. No commit, push, deployment, external publication, message, paid job, or live chain request was performed. Actual paid cost: $0.

Followed BACKEND §§3.2, 13 and Guard 2.0 §7.3. Read AGENTS including rule 9, the packet, gap analysis, and cited specifications. Guard 034 raw hashes, canonical payloads, leaf encoding, and authenticated anchor facts are reused. Guard remains shadow-only; no release flags or accepted-check status changed. Read-only specs, prototype, dependencies, and lockfile are unchanged. No personal identifiers or secrets were added or ported.

## Changed files

- `packages/shared/src/contracts/public-receipts.ts`, `contracts/index.ts`: typed immutable producer envelope with model/persona/rules/card/output versions, raw snapshot hash, exact recording time, snapshot or commit-relative forecast window, supersession and reorg references. Forecasts require real model/persona metadata; no forecast producer or invented output is shipped.
- `packages/shared/test/contracts.test.ts`, `test/fixtures/contracts/public-receipts.ts`: schema fixture coverage through the existing exported-contract gate.
- `packages/db/drizzle/0120_receipt_outbox.sql`, `src/receipt-schema.ts`: append-only producer publications, receipts-owned `receipt_items`, internal prepared `receipt_batches`, and batch membership/proofs. Prepared batch IDs are internal identities, never fabricated registry IDs. Legacy verdicts/events become append-only; same-block corrections may have separate immutable IDs.
- `packages/db/src/receipt-outbox.ts`, `src/index.ts`: transactional `publishReceipt`, idempotent `ReceiptOutbox.enqueue(id)`, bounded `recover(limit)`, and integrity-checked reads. Recovery reads immutable publications and the existing Guard payload journal; there is no lossy notification/cursor acknowledgement. Raw JCS bytes, hash, leaf, producer and revision identities must agree. Duplicate identities with different input fail. Existing authenticated Guard anchors distinguish recorded/anchored, including anchor-orphan events; prepared generic batches expose no public anchor.
- `packages/db/src/engines-migrate.ts`, `src/engines-schema.ts`: register the additive migration and align legacy revision uniqueness with same-block corrections.
- `apps/engines/src/receipt.ts`, `src/worker.ts`: publish raw envelopes in the verdict transaction, before card rounding; preserve exact bigint inputs as decimal strings. IDs incorporate snapshot/decision identity and block hash. Full decision/evidence changes create revisions even when risk level is unchanged. Same-block predecessor selection follows publication order. References to pre-079 verdicts retain their old identities without inventing missing raw payloads.
- `apps/engines/test/engines.test.ts`: producer-failure rollback, no leaked notifications, same-block revisions, exact receipt hashes/raw precision, and replay recovery. Cross-database replay tests inject one recording clock and compare full durable publications as well as prior outputs.
- `packages/db/test/receipt-outbox.test.ts`, `test/guard-receipts.test.ts`: crash between persistence/enqueue, interrupted enqueue rollback, replay, concurrent duplicates, changed-input rejection, raw/display differences, forecast metadata, revision references, immutable storage, shared leaves and unchanged Guard hashes/anchors.
- `packages/db/test/guard-storage.test.ts`, `test/merge-migrations.test.ts`: additive/idempotent migration coverage. The former same-block uniqueness rejection was replaced with separate-correction acceptance and duplicate-ID rejection, as required by this packet; assertions were not removed to conceal failures.

## Checks and reproduction

Run these commands from the worktree root. All new checks use synthetic PGlite data or retained Guard fixtures and synthetic registry logs. They are not live chain, fork, deployment or release-acceptance evidence.

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/db exec vitest run test/receipt-outbox.test.ts test/guard-receipts.test.ts test/guard-storage.test.ts test/merge-migrations.test.ts` | 0 | 21 tests |
| `pnpm --filter @eko/engines exec vitest run test/engines.test.ts -t 'durably publishes\|rolls verdict\|replays 1.0.0\|cached, uncached'` | 0 | 4 selected regression tests; final helper validation also checked with `-t 'durably publishes\|rolls verdict'` (2 tests, exit 0); all engine tests covered by the final workspace gate |
| `pnpm --filter @eko/shared exec vitest run test/contracts.test.ts` | 0 | 175 contract tests |
| `pnpm typecheck` | 0 | All workspace packages; `/tmp/eko-079-typecheck-final.log` |
| `pnpm test` | 0 | 114 test files, 2,269 tests, brand/address prechecks, web/server builds and built role-image checks; `/tmp/eko-079-test-final.log` |
| `pnpm brand:check` | 0 | 15 files before builds; final post-build check passed over 124 files |
| `pnpm check:addresses` | 0 | 314 source files |
| `git diff --check` | 0 | No whitespace errors |

Initial package-script calls with `test -- ...` selected the complete package suites. They exposed the old same-block uniqueness assertion, legacy predecessor references without a producer envelope, and wall-clock differences in independent replay fixtures. These were corrected and the focused reproductions passed. The first workspace test run stopped at the missing fixture for the new exported schema; the fixture was added and its reproduction passed before rerunning the final workspace gate. No existing test was deleted, skipped, or weakened.

Checkpoint: `/tmp/eko-079-checkpoint.json` records candidate fingerprint, changed paths, completed checks, process and log. Session 90165 finished with exit 0; no check remains running. Coverage is the checked-in workspace unit, injection, migration, fixture and built-role checks. The built role-image gate verifies that the unimplemented receipts dispatcher still refuses startup; it is not a deployed receipts worker. Existing metered fake-provider counters are synthetic test evidence, not provider charges. Web/server artifacts were built by the required test gate; no live browser, fork, production database or chain verification ran. Next action is lead review/commit and downstream 080/081 integration.

## TODO(spec), dependencies and scope

- New `TODO(spec)` in `apps/engines/src/receipt.ts`: the legacy CoinCard has no frozen schema literal. Its envelope explicitly labels the existing shape `legacy-coin-card/unversioned` until the spec freezes a version.
- The existing engine `TODO(spec)` for cross-task reorg reconciliation remains: the worker stops on an orphaned cursor for explicit derived-history reconciliation. This packet preserves payloads/status events and allows immutable reorg references; it does not implement a chain-history repair runner.
- Pre-079 legacy verdicts have no retained raw envelope matching their old hash. They remain untouched and may be referenced by new revisions; recovery does not fabricate their missing payloads. All retained Guard 034 payloads are recoverable, including same-block corrections, superseded and orphaned revisions.
- Packet 080 must call bounded `ReceiptOutbox.recover()` in the receipts role and implement scheduling, frozen batch preparation/submission/retry, configured metered registry clients and authenticated generic anchor storage. This packet prepares that storage and handoff; it runs no committer, signer or paid acquisition.
- Packet 081 owns public receipt/proof/reveal handlers. Actual Swarm producers must call `publishReceipt` in their producer transaction with their real metadata/raw output. Forecast windows remain commit-relative until an authenticated commit event supplies the block.
- Migration and code are prepared and fixture-tested locally. Production migration, deployed receipts role, funded/configured registry committer and operational acceptance remain external. No automatic continuation or deployment is scheduled.
