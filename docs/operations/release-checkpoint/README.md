# Beta and product release checkpoints

Packet 088; GO PLAN §§1, 8–10, 13, 16 and BACKEND §§12.4, 20–21.
All times below are UTC. This is an internal release record, not public copy.
Current disposition: **NO-GO / pending evidence**. No beta fills, acceptance,
on-call confirmation or Owner approval have been supplied to this packet.

## Candidate and evidence ownership

Use one exact source revision, the 087 worktree source hash (including uncommitted
source), config/lockfile, fixture and dataset hashes, and the deployed image and
redacted config identities. An unchanged candidate reuses its completed 087,
Guard 061–063 and product 129 evidence. Never rerun a locked gate for a meeting,
report or recording. Source/config/fixture changes require a newly bound candidate
and the affected owning gates; time-dependent daily observations still need their
actual collection window. Missing, immature or unaccepted evidence remains pending.
Fixture passes establish only local behavior.

087 is on `task-087`, not in this worktree. Its runner, manifest, README and report
were read with `git show task-087:<path>` at revision
`0546ad2d32bb8d3814a58e83134571632417bca4`. Its verified B/T reports are red and
belong to a different candidate. They cannot certify this candidate. The lead must
integrate 087, update its dependency inventory after integration, and use its own
`candidateSnapshot` and reports. This packet imports that API when available; it
does not copy the runner, build another eval suite or change its branch.

The deployment record `main:docs/operations/staging-railway-evidence.md` documents
Railway staging at `08d8566863f790caebe1e2f90b0011bc7727e73c` on Oct 3.
API, worker and Postgres ran, with trading off. This is historical live evidence,
not current-candidate acceptance: unequal role image digests, unread migration
ledgers, absent indexed head/Guard/receipt roles, missing sanctions source,
backups/alerting/rollback, ingress restrictions and resource ceilings remain gaps.
Use that record rather than the older 083 statement that staging has never run.

## Gate checklist and rollout

| Checkpoint | Required evidence | Role | Current status |
|---|---|---|---|
| B · Oct 6 | Current 087 B: staging green, complete fork Guard/Normalizer/execution/receipts, verified backfill, Owner-approved policies, isolated restore | Dev A | pending |
| Team · Oct 7 | B accepted; ceiling and runtime flag deliberately enabled; allowlist only, team rows capped at $25 or lower; watch quote → approval → sign → matching reconciliation → measured sell check | Dev A | pending |
| Users · Oct 8 onward | Team observations reviewed; allowlisted beta rows at $100 or lower; paper trading available to testers | Dev A | pending |
| T · Oct 12, 17:00 | B plus current 087 T; 129 real browser/fork acceptance; applicable unchanged 061–063 reports; positive complete observed denominator, zero misses; Fast Scan p95 ≤ 5 s and preflight p95 < 150 ms | Owner, Dev A veto | pending |
| Product · Oct 13, 12:00 meeting / 16:00 launch | T acceptance, smoke below, nightly eval report, no open Sev 1/2, reachable rota and Owner go/no-go | Owner | no-go, pending |
| Public · after product approval | `TRADING_ALLOWLIST_ONLY=false`; `TRADE_CAPS_FROM` = actual approved launch time, target `2026-10-13T16:00:00Z`; $250 maximum per trade, 0 bps launch terminal fee | Dev A | pending |
| Cap increase · earliest Oct 16, 16:00 | At least 72 observed hours since actual public launch, complete sell-check cohort, zero misses, no Sev 1 during that whole window; separately dated Owner acceptance | Owner, Dev A config release | pending |

The shipped `apps/server/config/trading-caps.yaml` has only the $250 public step.
Hold it there (or keep `TRADE_MAX_USD=250`). After accepted evidence and separate
release authorization only, add the 72-hour $1,000 step through the existing
config release path. Time never approves a cap or removes the allowlist. Apply any
lower per-wallet or absolute ceiling. Do not change this config in packet 088.

Spec conflict: 073's implementation report describes a Toronto launch instant
at 20:00 UTC. GO PLAN's explicit UTC convention and §9 govern this checkpoint:
T is 16:00 UTC. Confirm the actual approved instant before any config release.

## Oct 13 smoke record

At 08:00 start on-call, 09:00 release only after separate authorization with
trading team-only, 10:00 smoke, 12:00 Owner go/no-go, 15:00 final watched team
trade, 16:00 public opening. These are planned actions, not actions performed.
Each item needs a current-candidate measured producer artifact; every item is
currently pending. Reuse 129/087/connector evidence where it covers the exact
candidate and action. The final trade is fresh observation, not a fixture.

| Checker ID | Required observation |
|---|---|
| `siwe-entitlements-ws` | SIWE login, `/v1/me` entitlements, discovered pair → complete verdict via WS within 5 s |
| `scan-share` | `/v1/scan` clean and honeypot results, share card actually unfurls on X |
| `guarded-quotes` | `/v1/trade/quote` honeypot refusal without executable bytes; clean exit cost, taxes, fee and exact approval; paused/ceiling/allowlist/cap refusals |
| `mcp-code` | All seven T tools from Claude Code using `/packs`: coin_verdict, coin_card, playbook_match, preflight, journal, census_summary, receipts_lookup; untrusted text only in `untrusted` |
| `mcp-hosted-or-d0` | Claude Desktop and claude.ai OAuth connector evidence, or explicit accepted `cut-to-d0` disposition with pack/comms removal; not a fictitious hosted pass |
| `receipt-proof` | Actual on-chain root, canonical transaction and block, reproducible leaf/root, verifier agrees |
| `pons-fallback-fee` | Accepted route or quote-only/link-out fallback; curve terminal fee 0%, destination null; executable v4 stays unavailable unless its own gate is accepted |
| `delete-harness-data` | Neutral isolated account's harness data removed by `DELETE /v1/me/data`, ciphertext/deletion behavior matches implementation |
| `telegram` | Actual group scan and DM, no trading/signing in Telegram |
| `phone-alert` | Test alert delivered to on-call phones; prepared receivers do not pass |
| `final-team-trade` | Production team-only quote → user sign → matching actual fill → measured sell check; server holds no user key/funds |
| `rollback` | Retained prior image/config compatible with current schema, three ledgers and immutable history preserved, readiness restored, trading off, measured elapsed <600 s |

The small boot probe `node scripts/smoke-staging-railway.mjs --authorized-run
<approved-origin>` is a separately authorized connected-operator step. Its
health/config/SPA/WS results alone do not pass the product smoke above. No network
probe, paid request, signing or external alert is run by this checker.

## Daily beta review and post-fill monitoring

Copy `088-beta-daily-form.json` to `evals/reports/` for each real day; retain earlier
records. At 17:00 review, fill the complete confirmed-order denominator from 076,
including unavailable/pending replays. Each confirmed order retains a neutral
internal order UUID, actual tx/block hashes and actual raw fill amount, not quote
estimates. Its `evidence` references a hashed exported 076 sell-check artifact
whose `orderId`, `txHash`, `blockHash`, `amount`, `status` and `origin` match.
Only `origin: measured` can pass/fail a sell check. Unsupported/provider failures
stay unavailable, not misses and not successful sells. `coverageComplete` is a
producer assertion backed by the retained full export, never an inferred count.

Record refusals by finite reason code, disputes, all verdict/preflight samples
and eligible counts, unchecked/eligible orders, failed/attempted simulations,
agents/preflights, scans/bag cards, errors/requests, actual spend and its approved
budget, and label true/false positives. `scanMs` measures discovery to complete
required checks, not first response; `verdictMs` is separately summarized.
Missing metrics are null, not zero. The checker computes nearest-rank p95,
error fraction, spend and precision; latency/budget violations fail. No extra
error-rate acceptance threshold is invented: use 085's alert rules and incident
review. Census headlines need their separate ≥90% accepted precision gate.

Five-line daily note: window/candidate; fills/misses/pending checks; refusals,
disputes and latency; errors/spend/top bugs; decision, cap hold and next external
step. Keep personal contact details and private order data out of public stats.
From Oct 14–19 prepare measured stats at 15:00, with misses beside refusals;
publication has its own authorization and 112 owns public incident records.

A measured failed sell in 076 atomically disables `trading_live`, records the
incident and queues the immutable miss/post-mortem handoff before paging. The
checkpoint fails T/product/cap increase and requires stop verification. Retain
original transaction/calldata/card/simulation evidence privately; replay at the
fill block through the owning Guard flow. Do not restart automatically. Prepared
contingency: `pnpm ops guard_miss` (no HTTP call). Its existing `--execute` mode
raises an incident and can deliver alerts, so requires separate external
authorization. If the flag path is doubtful, the operator also drops
`LIVE_TRADING_ENABLED`; record config and actual order refusals within the
10-second cache bound. Communication within 1h and post-mortem within 24h belong
to the incident owner, not this offline script.

## Bounded local checker and evidence format

```sh
pnpm test:checkpoint
pnpm release:checkpoint --input docs/operations/release-checkpoint/088-form.json --output evals/reports/088-prepared.json
```

The empty form exits **1**, all gates pending; it is not a passing dry run. Use a
new output name per attempt. Reports remain under 087's existing excluded report
directory, so collection does not change its source hash. Inputs/artifacts are
repository-relative JSON, maximum 1 MiB each and 16 MiB of distinct artifacts per
invocation; cohorts ≤10,000, rota ≤100 shifts,
reason codes ≤100. Checks refuse symlinks, traversal and checksum mismatch.
There are no arbitrary shell commands, collector loops, timers or external calls.

After integration obtain the current snapshot from **087**, put its `revision`
and `sourceHash` in a form under `evals/reports/`, and replace each null `records`
entry with `{ "path": "evals/reports/record.json", "sha256": "<sha256>" }`.
`evalB` and `evalT` point directly to completed 087 JSON reports. Every other
producer record has `schemaVersion: 1`, `kind` equal to its form key, matching
`candidate`, `source` (`live`, `staging`, or `approval`), increasing UTC
`window: {from,to}` bounded by the present, and `data`. Fixture sources never
certify measured acceptance. Data contracts are checked in
`scripts/release-checkpoint.mjs`; the supplied beta form lists every daily field.
All external records must be redacted at acquisition; raw command logs are never
copied into checkpoint output.

Smoke data is `{status: "passed"}` only after the entire table row is evidenced;
hosted MCP also needs `disposition: "accepted-hosted" | "cut-to-d0"`. Decisions
need `decision: "go"`, finite `role: "Owner" | "Dev A"`, and `signedAt` within
their record window. No-go decisions fail the relevant check. Incident data has
`openSev1`, `openSev2`, `sev1SinceLaunch`, retaining closed Sev 1 events. On-call
approval has `shifts: [{role,from,to,reachable}]`: both Dev A and Dev B must be
reachable continuously through actual T+72h, with day/evening/night primary
rotation documented by the approver. Dev A starts at 08:00; Marketing covers
moderation 12h/day. Sev 1 pages everyone now, Sev 2 within 15 minutes, Sev 3 next
working day. Actual contacts/escalation destinations live outside this repo.

`stopVerification` records `tradingLive: false`, effective `liveEnabled: false`
and `ordersRefused: true`. If `flagPathDoubt: true`, the hard ceiling must also be
`liveTradingEnabled: false`.

`publicLaunch` records actual `startedAt`. A cap review requires beta and incident
windows covering that whole 72h period and Owner sign-off after observation ends.
Elapsed observation and approval are independent. Reuse stable gate reports;
do not reuse yesterday's observation as today's daily review.

## Rollback and separate D0 review

Use 083's rollback ordering with the retained previous accepted digest/config;
start the measured timer at the rollback decision. First minute: ceiling off and
runtime switch off; confirm refusals, restrict ingress; drain singleton writers
and release leases. Recover API first, verify three ledgers/health/config/SPA/WS,
then start one reconciler, indexer and engines sequentially, only previously
accepted roles. End timer at required readiness and ingress restoration, <600 s.
No rebuild, overlapping writers, deleted receipt, down-migration or database
restore as application rollback. If incompatible or late, leave trading off and
use a reviewed forward fix. 084 owns isolated disaster recovery/PITR; 063 owns
Guard version rollback. Local 083 config-recovery fixtures do not prove a prior
Railway image rollback. Every real rollback assertion is currently pending.

**D0 go/no-go is Oct 18 at 17:00**, reconfirm Oct 19; **token day is Oct 20**.
The checker deliberately does not certify D0. Retain a separate candidate-bound
Owner decision and Dev A veto record for this table (all currently pending):

| D0 requirement | Evidence / status |
|---|---|
| Zero beta and post-T misses | complete cumulative cohort · pending |
| Three consecutive green nightly gates, Access 100%, daily-burn fork | owning reports, three distinct nights · pending |
| ReceiptsRegistry review | three AI reviews, Slither/Aderyn triage, fuzz/invariant/fork, all High/Critical fixed/rechecked, deployed bytecode equals final hash · pending |
| 72h public review | Oct 13 13:00 → Oct 16 13:00 observed closure; separately signed review acceptance · pending |
| Bounty live | actual published self-run bounty up to $500 · pending |
| D0 features | each accepted or explicitly cut from comms; on-chain permissions advisory until reviewed · pending |
| Burn wallet / launch rehearsal | custody outside server, address publication, daily time decision, curve/pool fork dry runs and $100 launch buy-and-burn rehearsal · pending |
| Final decisions / rehearsal | clone re-check, buyback slice, team buys, availability-region Pons creation, gas/timelock/private bot/link checks · pending |
| Outcome | GO / GO with named cuts / SLIP one week · pending Owner decision |

Dates never supply observation duration, review results or sign-off. A red token
gate slips token day a week; product and daily reporting continue subject to
their own acceptance. Next external step: lead review/integration, then owning
producers collect remaining measured evidence under separate authorization.

One new `TODO(spec)`: the release/daily/smoke interchange schema is unspecified;
the minimal bounded producer format above supplies records, not authority. No
Guard logic, spec, migrations, rollout config or live service was changed.
