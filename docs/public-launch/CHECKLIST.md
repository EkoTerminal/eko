# T public-window and bounty handoff · not executed

All times UTC, year 2026. GO-PLAN §§6.2–6.3, 9, 16 and task 128 supersede
BACKEND §14.0's inherited Oct 5–8 public window and D0-only activation deadline.
BACKEND's stricter no-open-High/Medium and 72-hour restart bars still apply.
Acknowledgement target is 48 hours (GO-PLAN), within BACKEND's 72-hour maximum;
non-sensitive public review questions target 24 hours. Specs remain read-only.

## Before October 13, 13:00

- [ ] Release operator pins candidate commit/tag, regenerates/checks export hashes,
  reviews exact allowlist and licences, redacts raw artifacts and proves subset
  packaging/installation. No private runtime, secrets, home paths or identifiers.
- [ ] Review coordinator attaches three independent contract reviews, triaged
  Slither/Aderyn reports, unit/fuzz/handler-invariant coverage, gas and original-pin
  chain-4663 fork results for this candidate; every finding gets source/status,
  fix commit, fresh recheck and reason for acceptance/invalidation where allowed.
- [ ] Owner explicitly authorizes creation/publication of the three repositories;
  release operator enables 2FA, protected main/eval gate, secret scanning/push
  protection, self-hosted runner and signed tags. Record actual URLs and evidence.
- [x] Owner confirmed forwarding for the role mailbox (2026-10-04).
- [x] GitHub private vulnerability reporting is enabled on the public repository
  `EkoTerminal/eko` (read-only API check, 2026-10-05).
- [ ] Disclosure coordinator tests private advisories end to end in each public
  repository without exposing report contents (see OWNER-DECISIONS.md for
  whether the three separate repositories are still planned).
- [ ] Funding owner approves final tiers/payment terms and launch float, records
  funding evidence separately; no payout or funding is performed by this task.
- [x] The API serves `/.well-known/security.txt` (RFC 9116) with both real contacts,
  Policy `https://ekoterminal.com/security`, Canonical URL, `en` and Expires
  2027-10-01 (`apps/server/src/http/security-txt.ts`, tested). Code only; not deployed.
- [ ] Release operator deploys it, confirms HTTPS delivery on ekoterminal.com, and
  aligns every repository SECURITY.md with the final terms once confirmed. The root
  SECURITY.md already names both live channels.
- [x] `/official` and `/transparency` show only verified links and mark every project
  wallet, contract, social account and the status page "Not published yet"; every
  trust page carries "We have no token yet; any token claiming to be EKO is fake."
- [ ] Owner supplies only verified project wallet/contract identifiers; update
  `/official` and `/transparency` with accepted provenance. Unknowns stay unresolved.
- [x] Bug bounty page `/security` (GO-PLAN §6.3) is ready: private reporting, scope,
  exclusions and testing rules; reward tiers, funding, payment and the good-faith
  promise are marked "pending owner confirmation".
- [x] Terms and privacy drafts rewritten in plain English (version
  `2026-10-05-draft.2`); the pages say "Draft — pending owner approval".
- [ ] Owner approves policies separately (policy drafts due Oct 5 remain owned by
  task 089); public launch readiness does not make them effective.

## October 13, 13:00 → October 16, 13:00

- [ ] After explicit owner release instruction, publish frozen code, findings and
  test evidence together with actual hashes; record opening timestamp and URLs.
- [ ] Activate bounty only with confirmed terms, channel and funding; record
  activation evidence. No token yet at T; any token claiming to be EKO is fake.
- [ ] Accept private vulnerability reports and non-sensitive public questions;
  record each finding and duplicate disposition; acknowledge within the target.
- [ ] If a High or Medium fix lands, reopen 72 hours on the new candidate and
  recompute the close timestamp; preserve the earlier history. Any Critical
  also blocks acceptance; coordinator sets a new release schedule if needed.
- [ ] At October 16, 13:00, record actual close only if all 72 hours elapsed on the
  accepted candidate. Window close does not end an activated bounty.

## October 17–20

- [ ] October 17: recheck fixes with analyzers/tests and one independent review of
  the diff; record FINAL_HASH, complete triage and resolve Critical/High/Medium.
- [ ] October 18: owner D0 go/no-go sign-off with exact hash, completed window,
  active bounty evidence and verified deployed bytecode equality; otherwise defer.
- [ ] October 19: reconfirm gate, accepted deployment/roles, wallet readiness and
  fork dry run evidence supplied by owning packets. No inferred feature acceptance.
- [ ] October 20, D0: authorized deployment/publication operations remain owner
  work; planned report publication 16:35 with registry address and final hash.
  Registry deployment before review is permitted only because it holds no funds.
  Roles guardrails remain advisory until their own review is accepted.
- [ ] Record every payout in monthly note from creator fees (launch float before
  D0), never terminal fees/burn wallet; no reporter personal identifiers.

## Unresolved findings and dependencies

| ID / dependency | Severity / status | Evidence | Needed before acceptance |
| --- | --- | --- | --- |
| RR-001 zero committer | Low / open | `contracts/review/findings.yaml` | Independent disposition of intentional disable/recovery behavior |
| RR-002 renunciation | Low / open | same | Independent disposition and owner rotation-loss procedure |
| RR-003 membership/authenticity | Info / open | same | Independent disposition; verifier binds batch/tx/event, no authenticity overclaim |
| Historical WS / ETH-USD findings | Medium / ledger fixed, final-candidate recheck pending | `.audit-grade/findings.tsv`, `history.tsv` | Preserve original fix evidence; recheck candidate, do not reopen or waive silently |
| Independent reviews and analyzers | Pending | `contracts/review/README.md` | Three frozen-candidate reports and Slither/Aderyn output/triage; ignored raw review runs unavailable |
| Aggregate coverage target | 92.04% reported, below 95% | `docs/security/COVERAGE.md` | Owner/owning packet resolves measurement/provenance and remaining coverage; no new coverage claim |
| Original fork pin | Failed dependency state; partial supplemental result | `docs/security/FORK-TESTS.md` | Original-pin archive evidence; server/browser fork gates in capable authorized environment |
| Public identifiers / bytecode equality | Unresolved | address registry `ours.*` TODO; local build record | Accepted deployed addresses, canonical block, source verification, owner/committer and exact live runtime hash |
| Timelock / Roles / daily-burn exports | Unavailable | GO-PLAN §3.5 | Owning packets supply accepted parameters/configuration/script/tests; append to manifests after review |
| Bounty channels / funding / tiers | Channels live; terms draft, not active | Role mailbox (forwarding confirmed Oct 4); GitHub private reporting on `EkoTerminal/eko` (enabled); `/security` page | Owner confirms reward tiers, settlement terms and launch float |
| Public window / final hash / sign-off | Not started / unresolved | This checklist | Actual dated public evidence, final candidate and owner Oct 18 acceptance |
| Public repositories / distribution | `EkoTerminal/eko` public since Oct 2; the three separate repositories not created | artifact manifests | Owner decides whether the separate repositories are still needed; if so, release instruction, URLs and packaging proof |
| Launch policies | Draft 2 ready for owner reading | `apps/web/src/copy/legal.ts` | Owner approval with date and evidence; open items in OWNER-DECISIONS.md |

Local reproduction and final command results belong in the task 128 report.
External and paid cost of this preparation is $0. No new coverage measurement,
RPC/deployment, publication, funding, outreach or review acceptance is performed.
