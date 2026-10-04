# Gate B launch eval

Candidate: `4601c4d53b7bf2edd2d7f8c6d0fdb0c0a0afeaf8`; worktree SHA-256: `61e6cdc69f121464439e6edb4e7700f4c901ecea1e33c7ede66a850add7b2d5b`.

Result: **red**, exit 1. Fixture results do not certify measured launch acceptance.

Config: `cb9e71f6eedfa8f4bf213e80bd7904b0b9ee66fca153ee6167f12ce249b3031e`; fixtures: `f32d64c52a8a91661d2677043b7eb51daab23b4eebddd79c529cbf85155bda73`; dataset: `5ad7e2703d242c7af017f5ee09f949b145f1131b329f301a355ecab259df1667`.

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
| staging | acceptance | pending | Missing measured acceptance evidence |
| backfill | acceptance | pending | Missing measured acceptance evidence |
| policies | acceptance | pending | Missing measured acceptance evidence |
| restore | acceptance | pending | Missing measured acceptance evidence |
| harness | acceptance | skipped | Outside selected stage |
| injection | acceptance | skipped | Outside selected stage |
| playbooks | acceptance | skipped | Outside selected stage |
| latency | acceptance | skipped | Outside selected stage |
| product | acceptance | skipped | Outside selected stage |
| honeypot-fills | acceptance | skipped | Outside selected stage |
| watcher | acceptance | skipped | Outside selected stage |
| burn-ritual | acceptance | skipped | Outside selected stage |
| access | acceptance | skipped | Outside selected stage |
| swarm | acceptance | skipped | Outside selected stage |
| mcp-oauth | acceptance | skipped | Outside selected stage |

Exact commands, exit codes, counts and hashes are retained in the adjacent JSON report.
