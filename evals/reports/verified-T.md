# Gate T launch eval

Candidate: `4601c4d53b7bf2edd2d7f8c6d0fdb0c0a0afeaf8`; worktree SHA-256: `f0aa8f1efe2681e8f01b7f834d59d80b4eca04d097b7f8821ad829522351c6b4`.

Result: **red**, exit 1. Fixture results do not certify measured launch acceptance.

Config: `cb9e71f6eedfa8f4bf213e80bd7904b0b9ee66fca153ee6167f12ce249b3031e`; fixtures: `d127f55933157a81a858c385bff59d32906d8f21dff074637b29cbec19cd0dc4`; dataset: `5ad7e2703d242c7af017f5ee09f949b145f1131b329f301a355ecab259df1667`.

Labeled observed coins: 0/200. Missing classes: honeypot, tax-trap, hook, fee-trap, clone, wash, clean-v3, clean-v4, clean-pons. Provider requests: 0; cost: $0.

| Suite | Evidence | Status | Reason |
|---|---|---|---|
| normalizer-fixtures | fixture | passed | 100% fixture pass bar |
| normalizer-storage-fixtures | fixture | passed | 100% fixture pass bar |
| execution-fixtures | fixture | passed | 100% fixture pass bar |
| receipts-fixtures | fixture | passed | 100% fixture pass bar |
| receipt-proofs-fixtures | fixture | passed | 100% fixture pass bar |
| harness-fixtures | fixture | passed | 100% fixture pass bar |
| mcp-fixtures | fixture | passed | 100% fixture pass bar |
| injection-fixtures | fixture | passed | 100% fixture pass bar |
| injection-rest-fixtures | fixture | passed | 100% fixture pass bar |
| latency-fixtures | fixture | passed | 100% fixture pass bar |
| product-fixtures | fixture | passed | 100% fixture pass bar |
| playbooks-fixtures | fixture | passed | 100% fixture pass bar |
| normalizer | acceptance | pending | Missing measured acceptance evidence |
| execution | acceptance | pending | Packet dependencies not merged |
| execution-v4 | acceptance | skipped | Quote-only v4; executable route unavailable |
| receipts | acceptance | pending | Missing measured acceptance evidence |
| guard-locked | acceptance | pending | Packet dependencies not merged |
| guard-shadow | acceptance | pending | Packet dependencies not merged |
| guard-cutover | acceptance | pending | Packet dependencies not merged |
| staging | acceptance | skipped | Outside selected stage |
| backfill | acceptance | skipped | Outside selected stage |
| policies | acceptance | skipped | Outside selected stage |
| restore | acceptance | skipped | Outside selected stage |
| harness | acceptance | pending | Packet dependencies not merged |
| injection | acceptance | pending | Packet dependencies not merged |
| playbooks | acceptance | pending | Missing measured acceptance evidence |
| latency | acceptance | pending | Packet dependencies not merged |
| product | acceptance | pending | Packet dependencies not merged |
| honeypot-fills | acceptance | pending | Packet dependencies not merged |
| watcher | acceptance | skipped | Separate Census gate; headlines unavailable |
| burn-ritual | acceptance | skipped | Outside selected stage |
| access | acceptance | skipped | Outside selected stage |
| swarm | acceptance | skipped | Outside selected stage |
| mcp-oauth | acceptance | skipped | Outside selected stage |

Exact commands, exit codes, counts and hashes are retained in the adjacent JSON report.
