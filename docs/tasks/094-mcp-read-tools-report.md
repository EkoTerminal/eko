# Task 094 · MCP read tools report

Candidate: base `4601c4d53b7bf2edd2d7f8c6d0fdb0c0a0afeaf8` plus uncommitted task-094 changes. Source/test manifest SHA-256: `59c3ad96b7b5bbcfb63c0811894bf97653a32dba19079402872bf3076a8b97be` (sorted changed paths, path + NUL + file bytes + NUL; this report excluded).

Followed AGENTS.md including rule 9, packet 094, BACKEND §§9.2–9.5 and 23 (CA-3/14/16/34/35), FACTS §7, and the existing 035/037 negotiated Guard contracts. The read adapters do not implement Guard logic, simulation, collectors, execution, or later-stage tools. No migration, dependency, lockfile, spec, Guard-design or prototype changes. No personal identifiers or real secrets were added. Nothing was committed, pushed, deployed, published or approved.

## Changed files and behavior

- `apps/mcp/src/read-tools.ts`, `apps/mcp/src/runtime.ts`, `apps/mcp/src/index.ts`: register the five launch Senses by default against existing `GuardReadStore`/`ReadStore` and `ReceiptApiStore`. An explicitly injected registry remains supported. Holder/real-time launch/trial access gates playbook matches; later-stage tools remain absent. Registry verification uses existing RPC metering only when a registry is configured; construction performs no provider requests. Pending commitments remain readable without a registry verifier. Missing verification returns a typed unavailable result.
- `apps/mcp/src/tools.ts`: closed inputs retain defaults for `flowWindow`, `minLevel` and `includeHistory`; explicit `version: 2` negotiates Guard reads, default V1 stays historical. Receipt IDs match the existing REST maximum of 256 characters. Outputs use additive shared schemas, including typed unavailability.
- `apps/server/src/read/senses.ts`: read-only adapters preserve V1 verdict/receipt reference fields and V2 assessments, named checks, reasons and evidence identities. Delayed reads fail closed on a fresh or undated snapshot rather than serving it as delayed. `minLevel` filters severity; `includeHistory: false` removes history; absent history is explicitly unavailable without invented counts. All nested Untrusted wrappers are sanitized; V1 text-evidence prose is confined to Untrusted, while structured references are retained. Stored objects are not rewritten.
- `apps/server/src/read/receipt-reader.ts`: metered registry transaction/header reader with shutdown cleanup, without polling, simulation or acquisition workers.
- `packages/shared/src/contracts/mcp-senses.ts`, `packages/shared/src/contracts/index.ts`: additive shared result contracts. Task 102 is absent: V1 card flow carries a typed unavailable window result, V2 flow metrics remain named unknowns for the requested window, and Census has no headline numbers or invented model/time. The Census contract enforces its separate label gate. Receipt output contains verified pending/anchored proof metadata; arbitrary revealed payload/canonical text stays in the existing receipt API, preserving exact historical bytes and hashes there. Private payloads remain absent.
- `apps/mcp/tsconfig.json`, `apps/server/src/http/v1/demo.ts`: include the existing server request augmentation and make its cookie types explicit, so importing versioned read services typechecks independently in MCP.
- `apps/mcp/test/read-tools.test.ts`, `apps/mcp/test/transport.test.ts`: fixture tests for discovery/input-output schema parity, defaults/rejected instructions, both versions, named gaps, all three flow windows, minLevel/history, unavailable coin/receipt/verification, delayed boundaries, the separate Census gate, nested adversarial names/evidence, immutable receipt proof metadata and runtime default registration.
- `packages/shared/test/fixtures/contracts/mcp-senses.ts`, `packages/shared/test/contracts.test.ts`: frozen samples for every added exported schema.

## Checks and checkpoint

| Exact command | Exit | Result / log |
|---|---:|---|
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/mcp test test/read-tools.test.ts test/transport.test.ts` | 0 | 26 tests; `/tmp/eko-094-mcp-focused-final.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/mcp test test/read-tools.test.ts` | 0 | 12 tests after final nested V2 evidence/retained-flags regression; `/tmp/eko-094-mcp-read-final.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/shared test test/contracts.test.ts` | 0 | 212 tests; `/tmp/eko-094-shared-focused.log` |
| `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test test/v1-receipts.test.ts test/guard-card-api.test.ts` | 0 | 18 tests; `/tmp/eko-094-server-focused.log` |
| `pnpm typecheck` | 0 | Final candidate; `/tmp/eko-094-typecheck-final.log` |
| `VITEST_MAX_WORKERS=2 pnpm test` | 0 | 2987 Vitest passes, 34 Foundry passes, web/server builds and compiled role-image gate; `/tmp/eko-094-test-final.log` |
| `pnpm brand:check` | 0 | 154 files; `/tmp/eko-094-brand.log` |
| `pnpm check:addresses` | 0 | 439 source files; `/tmp/eko-094-addresses.log` |
| `git diff --check` | 0 | No whitespace errors |

The pre-existing Foundry live-fork fixture remains skipped when `RPC_HTTP_URL` is unset; no skip was added by this task.

The initial focused test run found that the recursive V2 flow projection converted arrays into objects; it was corrected and the file passed alone. Review also identified the distinction between V1 text evidence and the strict V2 evidence schema; the adapter now preserves V2 evidence shape and a nested-text regression passes. No test was removed, weakened, newly skipped or given a higher timeout. The initial full gate passed, but its MCP tests had already loaded before the final flag/truncation preservation fix. The repeated full gate passed against the stable final candidate, including all 36 MCP tests.

Checkpoint: `/tmp/eko-094-checkpoint.json`. Final typecheck session `54241` and final full-test session `93668` both completed with exit 0. Initial full-test session `93379` also exited 0; it was not used as final verification of the subsequent metadata fix. The final indexer fixture suite took 330.96 seconds. No process remains running, and no duplicate gate ran concurrently. Next action: lead reviews and commits the uncommitted diff.

## TODO(spec), remaining dependencies and reproduction

1. Existing `apps/mcp/src/tools.ts` TODO(spec): §9.3 does not freeze Census/receipt input or playbook result envelopes. Keep closed empty Census input, a receipt ID, and the playbooks envelope with explicit history availability.
2. New `packages/shared/src/contracts/mcp-senses.ts` TODO(spec): unavailable envelopes and MCP version negotiation are not frozen in §9.3. The additive contracts retain default V1 verdicts and explicitly select V2 with `version: 2`.
3. New `packages/shared/src/contracts/mcp-senses.ts` TODO(spec): raw receipt payload transport has no frozen MCP Untrusted boundary. MCP serves verified proof metadata only; REST continues to retain/serve exact canonical payload bytes under task 081's reveal rules.

Task 102 must supply measured flow windows and gated Census/model evidence before those values can be served. Current unavailable contracts are fixture-tested, with no fabricated agent/human/wash share, model version, timestamp or launch count. Delayed history selection is unavailable when the current snapshot is too recent; no fabricated historical snapshot is substituted. V2 remains the existing negotiated shadow/candidate read path; these fixtures establish no acceptance or cutover.

Anchored receipt verification requires separately configured `RECEIPTS_REGISTRY_ADDRESS`, retained canonical chain receipts/headers and the existing RPC configuration/budgets. Without that evidence the tool returns `receipt_verification_unavailable`. Pending/public/private commitment reads reuse task 081. Task 095 owns preflight/journal registration; they are not registered by this packet. OAuth remains controlled by its own packets.

Reproduce adapter/transport coverage with the focused MCP commands above; reproduce durable historical receipt proofs with the focused server command. All coverage is synthetic fixtures and in-process injection, without browser/network validation by this task. Actual external acquisition request units: **0**; actual spend: **$0**; paid subscription/pricing: **not applicable**. Test RPC metering is fixture evidence, not billable acquisition. Prepared and tested locally; no deployment, publication, live chain accuracy or release approval is claimed.
