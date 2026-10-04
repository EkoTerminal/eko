# Audit fix 09: license, disclosure policy, invariants linked to tests, monitoring and incident runbook

Source: `.audit-grade/REPORT.md` (rescore 7.8), Path to 9 items "Add project license and finalize disclosure/
accepted-risk policy", "Link the implemented core invariant inventory to checking tests", "Configure monitoring
delivery and incident runbook". Rubric lines:
- F (1.0): LICENSE and SECURITY.md (disclosure contact, accepted-risk list) — 0.5 each.
- G (2.0): Invariants written down, each linked to the test that checks it.
- D (1.0): Monitoring and incident response configured: alerts on authority/role changes, pauses, large outflows, oracle
  staleness, keeper (signer) balance; a pause runbook with contacts in SECURITY.md.

## Do
1. **LICENSE**: MIT, copyright line `Copyright (c) 2026 EKO contributors` (never a person's name). Add
   `"license": "MIT"` to the root package.json. Keep NOTICE (third-party attributions) intact and consistent.
2. **SECURITY.md disclosure**: keep the GitHub private-advisory route, keep `security@{{DOMAIN}}` with an explicit
   `TODO(owner): domain not live yet` note (the owner chose to leave the contact pending), and add an **Accepted risks**
   section (state plainly that no finding is currently accepted; the two open Mediums are being fixed, link the ledger).
   Keep the existing draft bounty text and claims rules (AGENTS.md rule 3: never "audited", "safe", etc. in user-facing copy).
3. **Invariants**: write `docs/security/INVARIANTS.md` listing the invariants the *implemented* code relies on
   (registry append-only/sequential ids and role separation; SIWE/session and agent-key auth, replay and revocation;
   private journal confidentiality/integrity/commitments and destruction; no custody / unsigned execution only; fee
   destination = public burn wallet; receipt integrity; indexer accounting rules; guard/policy fail-closed rules). Each
   row: invariant, where enforced (file:line), and **the exact test(s) that check it** (file + test name). Only list an
   invariant with a real test; put untested ones in a "Not yet tested" list with the missing test described. Link it from
   SECURITY.md and README.
4. **Monitoring**: in `infra/monitoring/` add alert rules for: registry `OwnershipTransferStarted`/
   `OwnershipTransferred`/committer change events; trading kill-switch (`trading_live`) flips and incidents; large
   outflows or abnormal fee/burn movements as observable by the indexer; reference-price staleness; receipt committer gas
   balance low; indexer lag. Wire receivers through env-var placeholders (no real URLs/tokens), documented in
   `infra/monitoring/README.md`. Validate JSON. Use what the indexer/server already expose; where a metric doesn't exist,
   add it only if small, otherwise list it as a gap.
5. **Incident runbook** in SECURITY.md: pause/kill-switch steps (who, how, verification), committer rotation, owner
   (Safe) actions, RPC/provider outage, key-leak response (rotate first), communications; contacts as roles with
   `TODO(owner)` where a real contact is pending.

## Proof
- Files above; JSON/YAML parse; every invariant row's test reference exists (grep each test name).
- `pnpm typecheck` and `pnpm test` pass.

Follow AGENTS.md. Only this task. End with the AGENTS.md report.
