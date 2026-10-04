# Task 125 · Production-refused fixture injection

Candidate: uncommitted changes on HEAD `add2dd5502fedfb54ee31141ff0d4ce3c6200776`. Implementation SHA-256 (sorted relative paths, NUL separators, file bytes; excludes this report): `3c025299482df91947a2dabceb5bbd4476cb7aeb1e3e10d242be10fbdfd721d9`. No commit, push, deployment, publication, external message, paid job or live-chain request. Actual paid cost: **$0**. Migration reservation **0018 is unused**; no schema or dependency change was necessary.

Followed BACKEND §23 CA-27, §§3.2, 9.9, 21.4 and the FACTS §7 shared contracts; FRONTEND §13; task gap-analysis ownership and Guard 2.0 §10's distinction between local fixtures and release evidence. Guard logic, inactive/shadow V2, release gates and the read-only specs remain unchanged.

## Changed files

- `apps/server/src/fixtures/producers.ts`: shared-schema inputs for all nine fixture kinds, typed inputs/outputs, a closed owning-producer registry, isolated-dev storage attribution, neutral synthetic input checks and the adapter to `JournalService.append`. Producers own persistence and post-commit WS publication; the route never writes source tables or publishes an injected payload itself.
- `apps/server/src/http/v1/fixtures.ts`: absolute `POST /dev/fixtures/<kind>` routes. Registration requires `ENABLE_DEV_ROUTES` and refuses production even when a caller bypasses environment parsing. Inputs and producer outputs use shared schemas. Invalid envelopes, malformed JSON and invalid/non-neutral data are rejected; private errors never enter remote telemetry. Responses are explicitly marked synthetic and private/no-store. Approval and burn kinds return 404 with their feature off; demo sessions cannot write or enable a disabled fixture kind. Engine burns remain unavailable.
- `apps/server/src/app.ts`: register the owning journal adapter only with the required journal capabilities configured, and keep unknown/disabled dev paths out of SPA fallback.
- `apps/server/test/dev-fixtures.test.ts`: offline Fastify injection; production/flag refusal, every shared fixture shape, missing capability, isolation, schema/neutral-data checks, owning-producer WS propagation, wallet ownership/origin/demo boundaries and journal encryption, consent and private receipt publication. Reuses sanitized neutral versions of the existing shared contract fixtures.
- `docs/tasks/125-implementation.md`: this handoff.

## Runtime capability and reproduction

The existing journal service is the only producer exposing a usable write interface in this candidate. Its fixture adapter preserves wallet-session ownership, explicit opt-in, agent ownership, payload bounds, encrypted storage and MCP-owned private receipt publication. It neither creates a plaintext journal substitute nor writes `receipt_items`; the receipts process remains its sole writer. Synthetic journal entries create no chain blocks or coin cards.

The remaining kinds **card, verdict, marker, pair, feed, approval, order and burn** have validated contracts and producer slots, but no owning injection adapter is registered. Valid requests return shared `sim_unavailable` (503) with the missing kind/owner named. Guard/chain/read/execution implementation alone is not a fixture injection interface. Their owners must provide `FixtureProducer<K>` adapters and register them with `fixtureRoutes` before those fixture kinds can insert data. No direct SQL replacement, launch observation, Guard assessment, execution fill or confirmed burn is fabricated here. Production remains unavailable regardless of adapters.

Fixture storage must be local ephemeral PGlite: `PGLITE_DIR=:memory:`, no `DATABASE_URL`, `APP_ROLE=api`, `RUN_WORKER=false`, `LIVE_TRADING_ENABLED=false`, and `MARKET_DATA_SOURCE=demo`. Ordinary persistent dev/indexed databases and the live-ingest `dev` role are refused. The whole fixture database disappears on process shutdown and cannot be consumed by a separately running live receipts/chain process.

Use `{synthetic:true,data:<shared input>}`. Journal data is `{agentId,entry:<JournalWrite>}`; marker data is `{coin,marker:<ChartMarker>}`. Other data is the named shared public schema. Synthetic addresses have 32 leading zero hex digits, free text starts with `Synthetic`, `Fixture` or `Sample`, external URLs use `example.invalid`, and journal payloads accept only neutral `text`, enum `side`/`decision`, and numeric `qty`/`notionalUsd`/`index`. The synthetic declaration and vocabulary are fixture input restrictions, not a general PII detector.

Journal reproduction additionally needs an authenticated wallet session, an owned agent, persisted journal opt-in, configured runtime-generated test KEK/id and an isolated destruction ledger. The focused suite creates these prerequisites without a listening port or real wallet key. No persistent/global configuration or env secret was edited.

## TODO(spec)

1. `fixtures/producers.ts`: CA-27 does not freeze the request envelope. Use `{synthetic:true,data}`; journal retains the owning writer's input and marker adds its coin context.
2. `http/v1/fixtures.ts`: CA-27 does not designate isolated dev storage. Admit only ephemeral PGlite with worker, live trading and live ingestion disabled.
3. `http/v1/fixtures.ts`: CA-27 has no missing-capability error code. Use shared `sim_unavailable`/503 and a fixed message naming the kind and owning producer.
4. `http/v1/fixtures.ts`: FRONTEND §13 references `burn_engine`, absent from this revision's shared `FlagName`. Engine burn fixtures remain 404 until the shared flag and owning producer are implemented; this packet does not change flag ownership.

## Checks

| Exact command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/server exec vitest run test/dev-fixtures.test.ts test/private-journal.test.ts` | 0 | 2 files, 15 tests; `/tmp/eko-125-focused.log` |
| `pnpm typecheck` | 0 | All workspace packages on final source; `/tmp/eko-125-typecheck.log` |
| `pnpm test` | 0 | 146 Vitest files, 2,596 tests; 33 contract tests passed (1 existing fork test skipped because RPC is unset), web/server builds and role-image checks; `/tmp/eko-125-test.log` |
| `pnpm brand:check` | 0 | 36 files; `/tmp/eko-125-brand.log` |
| `pnpm check:addresses` | 0 | 384 source files; `/tmp/eko-125-addresses.log` |
| `git diff --check` | 0 | Whitespace check |

The first focused run found two fixture-test mistakes: production configuration failed an earlier required-database check, and the test guessed an outbox table name. The tests now provide the required production config and assert the existing MCP-owned `receipt_private_publications`, while asserting that receipts-owned `receipt_items` remains untouched. A second run confirmed that the receipt item is not materialized by the journal writer. These were test-setup corrections; no existing assertion was removed or weakened. Final focused checks also cover malformed JSON. The final server suite started after the last implementation edit, and workspace typecheck was repeated on that final source.

Checkpoint: `/tmp/eko-125-checkpoint.json` contains the final source fingerprint, relative changed paths, exact focused command, logs, exit codes and completed process sessions. Full-test session **87138** and final-typecheck session **54319** completed with exit 0; no job remains running. Full-suite legacy/metered fixture counters are simulated/loopback attempts, not paid-provider billing or live-chain evidence. Actual paid cost is $0; this packet's injection fixtures use no RPC. Next action: lead review/commit and later integration of the owning producer adapters. No automatic continuation, deployment or approval is claimed.

Fixtures cover deterministic registration, contract and ownership behavior. The WS check uses a fake socket and a registered synthetic feed producer, verifies persistence before `Hub.publish<'feed','item'>`, and parses the emitted envelope with `WsEventSchema`; it is not evidence that the unavailable default feed producer or a live WS deployment works. No browser, fork, live-chain, paid acquisition or release acceptance is claimed. Existing assertions were retained.
