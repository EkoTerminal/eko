# Transparency evidence index · preparation only

Source revision and exact exported bytes are in [artifact-manifests.json](artifact-manifests.json).
These are retained reports, not new runs or completed launch acceptance. Tool
versions, denominators and candidates must be preserved when exporting evidence.

| Evidence | Retained source | Limits / next acceptance action |
| --- | --- | --- |
| Privileged powers and incident authority | `SECURITY.md`, 82 numbered entries | Declared roles/custody, not verified live holders; confirm deployments, signer threshold and monitoring channels |
| Implemented invariants | `docs/security/INVARIANTS.md` | Exact checking tests and missing tests; no live invariant claim |
| Negative mutation-entry census | `docs/security/NEGATIVE-TESTS.md` | Reports 57/57 historical implemented entries; excludes absent features and UI; refresh for final candidate |
| Line coverage | `docs/security/COVERAGE.md` | Dated lead measurement: 2,739/2,976 aggregate lines, 92.04%, below 95%; older unmeasured/provider-blocker text remains in the inherited report, so use dated table with provenance and remeasure before acceptance |
| Fork evidence | `docs/security/FORK-TESTS.md` | Original pin 77,469,811 dependency state failed; supplementary 78,680,366 passed 3 tests. Original gate unresolved; server/browser fork checks not run; local registry fixture deployment is not a live EKO deployment |
| Mutation operators/results | `docs/security/MUTATION.md`, `contracts/release/mutation.json` | 50/53 conservative kills (94.34%), 3 explained equivalent survivors, 50/50 non-equivalent kills; scoped authored Solidity, not every possible fault |
| Supply-chain evidence | `docs/security/ADVISORIES.md` | Dated reported scans; no new network scan or clean offline install proof here |
| Historical independent repository review | `.audit-grade/REPORT.md`, `SCOPE.md`, `findings.tsv`, `history.tsv` | Candidates differ from task 128; ignored raw runs are absent; not three independent final-candidate contract reviews or a completed public window |
| Contract findings | `contracts/review/findings.yaml` | RR-001/002 Low and RR-003 Info remain open; no acceptance invented |
| Guard configuration review reports | `docs/guard/reviews/review-C1.md`, `review-C2.md`, `review-C3.md` | Guard-owned evidence retained by reference; do not infer enforcement acceptance or modify their logic |
| External surfaces | See census below | Bounded public-release census; source registration is not live availability |

## External-surface census for this handoff

| Surface | Source / proposed destination | State |
| --- | --- | --- |
| Public code repositories | `contracts`, `playbooks`, `receipts-verifier`; exact manifest entries | Prepared only; URLs, host protection, private advisories, secret scanning, eval gate, self-hosted runner and signed release tags pending |
| Independent receipt checks | `packages/receipts-verifier`, `/receipt/:id` | Fixture-tested previously; browser registry pin unresolved; direct keyless RPC acceptance pending |
| Public track record | `/scoreboard` | Task 113 candidate evidence; measured/unavailable states preserved, no invented track record |
| Transparency and project links | `/transparency`, `/official` | Prepared routes; project wallets/contracts and repository links unresolved, no placeholder address links |
| Disclosure discovery | each export's `SECURITY.md` and `.well-known/security.txt` | Draft policy/template, no confirmed live reporting channel |
| Receipt deployment verification | `packages/chain/addresses.4663.yaml`, `contracts/release/ReceiptsRegistry.build.json` | `ours.receiptsRegistry`, owner and committer remain TODO; local bytecode hashes are not live bytecode equality |
| Public project wallets and histories | dev fee wallet | No verified project identifiers supplied; no token at T. The burn wallet and milestone timelock were dropped (owner decision 2026-10-05) |
| Guard/harness/auth | guard, SIWE, harness keys, MCP OAuth, Roles configuration | Reporting scope proposed (no bug bounty); implementation and acceptance owned by other packets; unavailable checks remain unavailable |

The prepared pages intentionally use no API/config-supplied wallet address as
verified evidence. To add one, the owner must supply an accepted chain-4663 record
with canonical block, source commit/build hashes, deployment transaction and
explorer source verification; verify registry `owner()`, `pendingOwner()` and
`committer()` and any Safe signers/threshold/modules separately. Publish only
project-role wallets with accepted provenance.
