# T launch gap analysis · 2026-10-02

Product launch **T = October 13, 2026**. Gate B is **October 6**, Gate T is **October 12**, and the D0 go/no-go is **October 18** for token day October 20. Times and launch operations follow [GO PLAN](../eko/05-GO-PLAN.md) §§1, 7–11. This is a repository assessment, not evidence that an external service or release gate has passed.

**Conclusion:** the terminal shell, read projections, indexer, pure engines and receipt contract have substantial implementation. The executable trade path, persistent harness, committed receipts and many public T routes are incomplete. Neither Gate B nor Gate T is demonstrated by the checked-in evidence. New packets **067–137** cover 71 bounded coding sessions outside existing packet ownership; they do not replace active Guard 2.0 packets 026–064 or pending 065–066. The launch plan cannot be certified by counting packets.

## Basis, status and estimates

Read AGENTS first, including rule 9. Reviewed [FACTS](../eko/FACTS.md), [OVERVIEW](../eko/01-OVERVIEW.md), [FRONTEND](../eko/03-FRONTEND.md) route/feature tables and acceptance sections, [BACKEND](../eko/04-BACKEND.md) process/feature/API tables and T contract additions, GO PLAN, marketing claims, all available original packets through 066, BACKLOG, every implementation report, and [Guard 2.0 §10](../guard/guard-2.0.md). Packets 011 and 018 are absent; no coverage is attributed to them.

Code snapshot: **e39ee2b**, with a clean initial tracked working tree. Important merged evidence: 001 rebrand; 006 shell; 008/014/015 terminal ports; 019 contract; 020 Mission ports; 022 engine; 023 read API and follow-ups; 025 logs-first follower. The latest Guard change is design/packets, not merged V2 implementation. Checked actual source in apps and packages, migrations, tests, Dockerfile, infra and git history. The read-only prototype in `../app` provides port references, especially `src/pages/terminal/Bags.jsx`, `src/pages/trust/Scoreboard.jsx` and `src/App.jsx`; it is not runtime evidence.

- **done:** scoped implementation is present with relevant checked-in tests or implementation evidence; does not imply today's full gate or deployment passed.
- **partial:** useful implementation exists, but required behavior, integration or measured acceptance is absent.
- **missing:** no implementation/evidence for the scoped item in this snapshot, even if a packet exists.
- **Sessions:** one bounded engineer coding session per new packet. Existing packet counts below describe remaining packet work, not independent additive estimates. Human decisions, review labels, provisioning, paid acquisition, beta observation and elapsed shadow days are separate. Rows sharing a packet must not be summed twice.

## Gate B first: trading truth, receipts and operations

| T-scope item | Status and evidence | Gate blocked | Remaining engineer sessions / ownership |
|---|---|---|---|
| Chain registry, v3/v4/Pons log decoding | partial — `packages/chain`, 016 and [verified Pons observations](VERIFIED-pons-2026-10-01.md); event/getter verification does not establish executable buy/sell ABIs; graduation fixtures absent | B Normalizer; T route execution | Existing 039–042; new 067–072 for execution adapters, no duplicate Pons reference simulation |
| Occupy, Flap, Klik launch ingest | missing — only Pons launchpad adapter in `packages/chain/src/launchpads`; BACKEND §§4.3, 4.6–4.8 explicitly name all three | B backfill/Normalizer coverage; T every-pair scan | 3: 130, 131, 132; unverified ABIs remain unavailable |
| Raw UserOp/delegation/registry ingest | partial — pure actor helpers exist; verified EntryPoint and persisted protocol evidence incomplete | B actor/backfill truth; T Watcher | 1: 133; 043 retains complex principal trace binding |
| General indexed-coin v3 quotes/calldata | partial — `apps/server/src/exec/chain.ts`, `networks.ts` support heritage fixed ETH/USDG market | B fork guard; T live route | 1: 067 |
| Non-Pons v3 round-trip honeypot simulation | missing — heritage single-transaction simulation is not acquired-position buy-then-sell; card simulation meta is unavailable | B Normalizer 100%; T zero honeypot fills | 1: 068; Pons reference execution stays 040 |
| Non-Pons reachable control and LP custody observations | missing — card control unavailable; Pons profiles are the only planned verified template | B Normalizer truth; T complete buying checks | 2: 069, 134; 041 owns all local directional-depth computation, 042 owns known Pons successor custody |
| v4 quotes/hook simulation and executable route | missing — decoder fixtures exist, no v4 execution adapter | B truth/fork gate; T only if executable | 2: 070, 071; route stays quote-only until green |
| Pons unsigned trading adapter | missing — launch/event reads present, no verified Pons buy/sell transaction constructor | B team trade; T live Pons or documented fallback | 1: 072; depends on 039/040/042 as applicable |
| Mandatory buyer policy, exact-account revalidation | partial — pure `packages/policy` with tests; no serving preflight; V2 absent | B guard; T all signing/preflight paths | Existing 028, 052; integration 075, 095 below |
| Kill switch, beta allowlist and cap schedule | partial — config heritage, but no launch-aware enforcing v1 trade path; config defaults include zero ceiling | B team $25 / beta $100; T $250 for 72h then $1,000 only if clean | 1: 073; stage transitions and fail-closed tests |
| Sanctions screening before executable quote | missing — no verified launch screening path | B executable trading; T Terms behavior | 1: 074; unavailable source prevents execution |
| v1 quote/order lifecycle and Guard integration | partial — `exec/service.ts` preserves useful account binding/idempotency/exact-approval patterns; v1 router does not register trade endpoints | B fork guard; T execution | 1: 075; depends on 090 account, adapters, 052 |
| Reconcile actual fills and post-fill sell checks | partial — heritage sender/target/calldata/value verification exists; estimated quote fill fallback, no launch post-fill missed-honeypot evidence | B fork execution; T zero honeypot fills and public counters | 1: 076; no estimated fill accepted as actual |
| Guarded trade panel | missing — `RadarParts.tsx` DisabledTradePanel permanently disables the fields; reused on Radar/Pairs/Coin | B beta UI; T product | 1: 077 |
| Wallet guarded flow, exact approvals, rejection/retry | partial — `lib/instantFlow.ts`, `trade.ts`, wallet helpers are heritage; legacy endpoints and no guarded panel integration | B team/beta trade; T product/guard | 1: 078; reuses existing wallet code |
| Receipt contract and published ABI | done for implementation — `contracts/src/ReceiptsRegistry.sol`, tests/script/ABI, 019; deployment unproved | B contract tests must still run; T chain commitment | 0 implementation; external deployment evidence under 083/128 |
| Durable receipt outbox | partial — engine hashes are pending and not durably assigned to committed batches; `apps/engines/src/worker.ts` | B receipts 100%; T every output | 1: 079; 034 retains V2 raw-hash compatibility |
| Five-minute committer, windows and retry | missing — no receipts worker; registry ours.receipts unresolved | B staged receipts; T roots on-chain | 1: 080 plus authorized deployment/funding outside coding |
| Receipt/proof API | missing — no v1 receipts endpoints | B receipts integration; T Senses/verify | 1: 081; public UI 113 |
| Single image, role dispatch and migration assets | partial — Dockerfile carries old limited workspace assumptions; no full APP_ROLE dispatch | B staging; T release | 1: 082 |
| Railway staging and rollback | missing — no current service definitions or deployed candidate evidence; railway.json intentionally retired | B staging green; T release smoke | 1: 083 prepares runnable manifests; actual provision/deploy is a separate authorized operation |
| Backups and restore drill | missing — no checked-in drill/result; restored encrypted journals/deletion tombstones unproved | B explicit restore requirement | 1: 084 plus actual isolated restore evidence |
| Monitoring, status and paging | partial — health/metrics/redaction/RPC caps exist, Sentry delivery and launch dashboards/status probes absent | B staging/on-call; T incident response | 1: 085; test alert delivery separately, no live message in this docs task |
| Verified backfill, holders and replay coverage | partial — 017/021/025 plus replay reports; historical corpus/genesis completeness, supply sums, 50-wallet histories and current head completeness not demonstrated | B explicit backfill requirement | Existing 048, 057–059; 1: 086 acceptance handoff, not another acquisition runner |
| Curve progress on every Pons coin | partial — newest 100 New rows lacked curvePct in real-data check | B pairs/engine inputs; T New pairs | Existing 065; 1 existing session, no new duplicate |
| Head catch-up and metered cost | partial — 025 live report ~11 blocks/s versus ~10 chain; 2,000-block catch-up ~30 min | B current staging; T Fast Scan | Existing 066, 053; 2 existing packet sessions, no new duplicate |
| Fast Scan pair-to-verdict latency | partial — rules-first engine/follower exist, but no candidate-linked end-to-end p95 <=5s report with real new-pair arrivals and required checks; fast read queries measure a different path | T explicit latency gate; B workable beta | Existing 053/066; 087/088 collect stage-aware timing evidence, 107 supplies persisted on-demand scans; no new duplicate queue |
| Nightly and candidate launch eval orchestration | missing — no evals corpus/runner or CI gate manifest in snapshot; individual tests are not launch acceptance | B Normalizer/guard 100%; T suite bars | 1: 087; consume 061–063 reports without redoing Guard fitting |
| Beta launch checkpoint and daily measurements | missing — no candidate-linked beta denominator, no observed no-miss history | B beta entry; T zero fills and T evals | 1: 088 prepares measurement/checkpoint; Oct 7–12 observations are elapsed operations |
| Approved policies and legal pages | missing — `/legal/:doc` loads Placeholder | B policies approved; T public policies | 1: 089 draft/render/check; actual owner policy approval separately recorded |

### Active Guard work: existing coverage, never new duplicates

All **026–064** already have normative packets in Guard §10; statuses here reflect absent merged V2 code in this worktree, not progress in another agent's branch. Each existing packet is a bounded session; optional 050 is not a launch dependency. Dependencies and release bars remain those packets' own.

| Existing packet ownership | Snapshot status | Gate and remaining ownership |
|---|---|---|
| 026–028 contracts/storage/mandatory policy; 029–033 roles/supply/lots/history/scoring; 034–038 receipts/cards/web/list/Signal adapters | missing V2, partial V1 baseline | B/T truth and UI; 13 existing sessions, do not reimplement in new APIs |
| 039–042 Pons profile/reference exit/local depth/graduation | missing validated V2 | B Normalizer/execution; 4 existing sessions |
| 043–049 trace principals/funding/pilot/qualified graphs/grouped coverage/selective backfill/campaign | missing V2, partial old indexed transfer patterns | B backfill/truth; T history completeness; 7 existing sessions |
| 050 optional reserve-origin research | missing, optional | No T blocker; 1 existing optional session |
| 051–053 outcomes/actual-order binding/incremental performance | missing V2 | B/T execution, Scoreboard, latency; 3 existing sessions |
| 054–060 benchmarks/blinded review/sample/acquisition/independent labels/fitting | missing accepted evidence | T calibrated release; 7 existing sessions plus people/acquisition |
| 061 locked acceptance, 062 frozen live shadow, 063 cutover/rollback | missing accepted evidence | T V2 release; 3 existing sessions plus elapsed shadow |
| 064 calendar-month evaluation | missing | Post-cutover upkeep; 1 existing session, not a new T packet |

**Calendar risk:** 062 requires the accepted frozen candidate from 061 followed by at least **seven actual days and 5,000 eligible launches** of live shadow (Guard §9.4). There is no such accepted candidate/report in this snapshot. Starting an accepted candidate October 2 could only reach seven days October 9; starting after October 5 cannot finish by Gate T October 12, and the launch-count bar may take longer. Gate B cannot certify a full V2 shadow by October 6 from a new October 2 start. Historical cohorts may be acquired retrospectively only with verified archive/availability coverage; missing archive coverage requires the specified prospective 14+7-day window. Existing 063 can prepare a narrower manifest of accepted confirmed facts/Elevated with named gaps and Lower disabled where the design permits; it cannot waive simulation, precision, denominator or shadow acceptance. The release manager must explicitly distinguish preparation, accepted scope and unaccepted V2 claims.

## Gate T next: account, Senses and harness

| T-scope item | Status and evidence | Gate blocked | Remaining sessions / packet |
|---|---|---|---|
| Shared FACTS/CA schemas, stages and runtime parsing | done baseline — `packages/shared/src/contracts`, 002/013; V2 pending 026 | T contract consistency | 0 new schema package; each integration imports shared schemas |
| /v1/config, signed demos and feature-flag registration | done baseline — 010, `http/v1` config/demo handlers and shared flags; deployment values/complete drop metadata unproved | B/T configuration and disabled-surface checks | 0 foundation; 073/083/121/129 supply real configuration and acceptance |
| /v1/radar, /pairs, /feed, /coins reads and named WS | partial — 023 read store/projections/live stream backed by index data; missing flow/simulation inputs and unregistered harness/private channels | B/T real serving contract | 0 second read-API foundation; 035/037/053 and new producer/API integrations fill named gaps |
| Untrusted sanitization/agent-bait detection | done pure baseline — `packages/untrusted`, 003, frontend UntrustedText | T injection regression still must be measured across real handlers | 0 core; 094/095/087 integrate and validate |
| SIWE and v1 /me, entitlements/preferences | partial — `http/auth.ts` and eko_sid cookie exist; product auth still /api; v1 /me absent | B trade/account; T harness/settings | 1: 090 |
| Agents/presets/one-time keys/list/revoke | missing real API — Mission pages parse mock/expected contracts; no route storage handlers | T harness preview | 1: 091; presets chosen at creation, mutable policy D0 |
| Encrypted journal, opt-in sharing and deletion | missing — no wrapped DEK/crypto-shred path; private journal cannot launch without CA-30 | T harness/privacy/Flight Recorder | 1: 092 |
| Streamable HTTP MCP at /mcp | missing — no apps/mcp process | T Harness 100% | 1: 093 |
| Senses: coin_verdict, coin_card, playbook_match, census_summary, receipts_lookup | missing transport/tools; underlying coin reads partial/real | T seven-tool launch contract | 1: 094; import 035, 081, 102 outputs |
| Guardrails/Flight Recorder: preflight, journal | partial pure policy only; no transactional handlers | T Harness, <150ms cached preflight | 1: 095; 052 owns exact-account validation |
| Claude Code and generic packs, /packs | missing — no harness-packs or served pack registry | T platform scripted sessions | 1: 096; no invented desktop connection success |
| OAuth discovery, DCR, PKCE/authorization | missing | T hosted connector only if gate passes | 1: 097 |
| SIWE-bound OAuth consent screen | missing — no consent route | T hosted connector, owner-bound grants | 1: 098 |
| OAuth tokens/rotation/reuse/revoke and real connector check | missing | T conditional; documented D0 fallback permitted | 1: 099 prepares lifecycle and gate; real deployed client check external |
| ERC-8004 declared trading wallet labels | partial decode/actor helpers, no complete Watcher pipeline | T declared Flow/markers; B indexed actor truth | 1: 100 after 133; permissionless declaration is evidence, not inferred bot behavior |
| Point-in-time behavioral wallet fingerprints | missing engine, pure types only | T Likely agent Flow; Census >=90% label precision | 1: 101; source missing remains unknown |
| Flow/markers/Census API | partial — cards mark flow unavailable; markers endpoint has empty unavailable labels | T Flow and Census method | 1: 102; crew/control facts supplied by 046/047, no new ring scorer |
| Census methodology and label gate/import report | missing — route Placeholder | Oct 6 T-7 methodology; T numbers only if gate passes | 1: 103; independent labeling/precision evidence separate |
| Swarm naive-view funnel and validation | missing — no launch Swarm module | T beta behavior forecast | 1: 104 |
| Budgeted/stale-safe multi-pass Swarm worker | partial heritage AI providers/budget; no persona orchestration | T beta forecast and cost/drift | 1: 105; never trades real funds or controls permission |
| Paper ledger/calibration baseline gate | partial heritage paper engine, no launch pipeline/report | T truthful beta; ranking conditional | 1: 106 prepares 14-day/500-coin evaluation; ranking off until accepted, actual observation not one session |
| On-demand Scan jobs/IDs/reload/share | partial — `read/scan.ts` indexed search, synthetic search ID, unknown address not_found; no POST queue/persisted result | T Fast Scan/share | 1: 107; reuses 053 scan queue, never calculates missing truth in request handler |
| Public Bags API and rounded, opt-in share | missing — no v1 Bags endpoints | T scan/share/privacy | 1: 109 |
| OG renderer and static per-path head injection | missing — no apps/og; static head integration absent | T public link previews | 1: 111; satori/resvg only as named in spec |
| Scoreboard call/cohort/refused/missed API | missing — no routes; engine outcomes scaffold not accepted metrics | T accountability | 1: 112; 051 supplies outcome truth, 076 post-fill observations |
| Watchlist/alerts storage and event thresholds | missing — no v1 handlers/real events | T tracking/alerts | 1: 114; crew targets only when released, web push D0 |
| Telegram group scans, caller leaderboard/badge | missing — no apps/bots | T launch bot, no Telegram trading | 1: 116 |
| Telegram account link and owner DMs | missing — no short-lived /telegram/link path | T notification connection | 1: 117 |
| Ghost Reports from real output and confirmation flow | missing — prototype demo strip is not real evidence; no production pipeline | Oct 3 T-10 drafts; T accountable call-outs/Points | 1: 118; drafts require human approval before publishing |
| Points accrual and captured referrals | missing — types/config scaffolding only, no earnings/capture ledger | T Points/plan correctness; redemption D0+1 | 1: 122; unset rates disabled with TODO(spec) |
| Telemetry, launch event counters/privacy | partial — legacy telemetry client/server only | T performance and public measurements | 1: 123 |
| Keyless read-only /v1/rpc | missing v1 allowlist/proxy | T wallet reads/key protection | 1: 124; latest only, no overrides/sends |
| Dev-only fixture insertion | missing CA-27 handler | B/T reproducible product checks | 1: 125; never registered without ENABLE_DEV_ROUTES |

At T, approvals return `approval_unavailable` where required, rather than hanging. Approval decisions, kill-all/session keys, editable Limits, unchecked-order UI, summaries/annotations, Loop Lab/compile/backtest and on-chain enforcement remain D0 or later according to their detailed stage rows. T Flight Recorder is the private journal/preflight preview. Stage-aware Harness evals must not claim unavailable D0 tools ran at T.

## Every T screen and shared client requirement

The route evidence source is `apps/web/src/routes.ts`: only Radar/Pairs/Feed/Coin and Mission base screens have concrete T imports. A listed route resolving to Placeholder is missing, not done.

| Screen/feature | Status and evidence | Gate blocked | Remaining sessions / dependencies |
|---|---|---|---|
| Shell, sidebar/mobile navigation, dark tokens, route/auth/flag boundaries | done baseline — 005/006/013 and tests; no launch-wide browser proof | B mobile/Product; T Product | 0 core; 129 final integration |
| / landing, marketing/static chunk | missing — Placeholder | T first scan/Product | 108, 137 shared sessions |
| /radar with cards/stats/sparkline/Signal | partial — Radar port 008, real 023 reads/totals; exit costs/labels absent | T truth/Product/Fast Scan | Existing 036/037/038/053, engine packets above; no second port |
| /pairs New/Near graduation/Migrated | partial — 014 port, real pairs API; curve coverage and migration truth incomplete | B beta; T pair coverage | Existing 042/065/066/037; trade 077/078 |
| /feed typed lines/live stream | partial — 014 port, 023/CA-32 real reads; simulated/skipped engine classes and not-tracked counters | T reliable call-outs | Existing 037; 100–106/112/118 produce missing events |
| /coin/:address chart/card/Flow evidence | partial — 015 and 023; real card still names simulation/flow/control gaps | B guard UI; T Product | Existing 035/036/041/042; 068–072/100–102/134 |
| 1s and 15s six-hour candles | partial — db helper built 021, CoinsService deliberately returns unavailable | T chart CA-4 | 1: 135; wire existing helper |
| /scan/:id result and stable share | missing — Placeholder, transient backend search | T scan/share/Product | 1: 108 after 107/112; includes landing |
| /bags and /bags/r/:id | missing — Placeholder; Bags prototype available | T Bags/share | 1: 110 after 109; privacy/share metadata 111 |
| /watch | missing — Placeholder | T notifications/Product | 1: 115 after 114/117 |
| /scoreboard and /receipt/:id | missing — Placeholder; Scoreboard prototype available | T public receipts/grade/missed counter | 1: 113 after 081/112; includes browser verifier/public export |
| /census | missing — Placeholder | Oct 6 methodology; T gated public state | 103 shared with label-gate work; numbers stay hidden until >=90% precision |
| /drops calendar | missing — Placeholder; default config drops empty | T truthful calendar | 1: 121; only actually demoed drops, live controls absent |
| /mission overview harness preview | partial — 009/020 real UI, unavailable mock-backed API | T connected agents/journal | 090–096; no duplicate port |
| /mission/agents/:id Activity/Connection | partial — 020 UI, real backend missing | T connection/private history | 091/092; D0 controls remain gated |
| /mission/connect | partial — 020 UI expects /packs/keys; no served data | T Code/generic and conditional OAuth | 091/096–099; pack templates authoritative |
| /oauth/consent conditional connector page | missing | T hosted OAuth only | 098; hidden until accepted |
| /settings | missing routed implementation — old Settings scaffold exists but route Placeholder | T prefs/privacy/notifications | 1: 119 after 090/092/114/117/122 |
| /settings/plan dormant | missing — Placeholder; must say free launch week without invented tier values | T account/claims | 119 same session; no active trial/redemption at T |
| /legal/:doc | missing — Placeholder | B approval; T public policy | 089 shared session |
| /transparency and /official launch trust links | missing, GO-required outside core route table | T public repos/wallets/review | 1: 128 prepares pages/artifacts; public release separately authorized |
| Nonblocking tour/checklist/progress merge | partial — heritage Tour/onboarding store; T anchors/first-scan offer not wired | T Product | 1: 120; no proposed Simple/Pro or Learn hub |
| Copy/disclaimers/unknown values/anti-sniper state | partial — central copy and pending masks implemented; new routes absent | B truthful beta; T claims | Existing 036/037; every new consumer uses shared copy and observed schedule, 129 verifies |
| Installable PWA/offline connection behavior | missing — no manifest/service worker in source/public inventory | T installability | 1: 136; push D0 |
| Frontend JS/phone/network/timing budgets | partial — heritage telemetry/tests, no complete spec budget evidence | T Product/performance | 1: 137; production field evidence separate |
| Stable candidate browser/contract integration gate | partial — relevant port Playwright tests exist, prior browser/fork results deferred | B mobile/Product; T full Product | 1: 129 after route/backend integrations; preserves Guard browser ownership |

Modes at T are the policy/alert/Settings presets and guarded-trade risk mode. OVERVIEW's broad filter wording and FRONTEND §3.2's detailed Drop 1 mode/lens toolbar differ. **TODO(spec):** use the detailed frontend stage at T; do not ship a new toolbar early. The present radar handler accepts but discards mode/lens; existing 023 read-contract ownership must resolve unsupported query semantics before those controls are enabled. This does not justify claiming working filtered results now.

## Launch operations, bots ready but off, and explicit non-T work

| Item | Status and evidence | Gate blocked | Sessions / disposition |
|---|---|---|---|
| X summon bot ready, disabled through T | missing — no bot process; flag union exists | T operational preparation; D0 enable | 1: 126; off mode must produce zero provider reads/replies; owner vendor setup separate |
| Farcaster/Neynar bot ready Oct 16, disabled until D0 | missing | Oct 16 readiness, Oct 18 D0 gate; not T product gate | 1: 127; managed signer, no custody key on server |
| Telegram launch bot enabled after group approval | missing | T run-of-show; differs from dark summon bots | 116/117; group installation and external messages require release authorization |
| Status site + API/MCP/OAuth/guard/scan/bot/committer probes | missing status deployment, partial API health | B public uptime/on-call; T incident response | 085 and 083; off bot is expected off, not a false healthy reply probe |
| Public repos, SECURITY/security.txt, 72-hour window and bounty | partial — contract review scaffold exists; no public release evidence | T Oct 13 13:00 opening; D0 review completion | 128 prepares concrete release bundle; publication/bounty activation are external |
| Contract review/fork/static-analysis acceptance | partial — 019 contract tests/review skeleton, three open Low/Info rows, no final live matching-bytecode evidence | B required Foundry suites; D0 review sign-off | Existing 019 reports/checklists, 087 automation, 128 release evidence; no duplicate contract implementation |
| Human/vendor checklist: domain/DNS, neutral project accounts, RPC/model credits, reviewer assignments, hardware/cold wallets, on-call, policy sign-off | missing verified repo evidence, not proof nothing exists externally | B provisioning/policies; T launch authorization | No invented coding packet or completion; 083/085/088/089/128 list concrete external completion signals |
| Release freeze/tag/deploy/smoke/live team trade | missing | Oct 12 T gate; Oct 13 run-of-show | 083/088/129 prepare and consume candidate evidence; commands not executed by this docs task |
| Fees/burns/token/tiers/x402 | dormant config/flags baseline | No T live functionality; D0 gates separately | T fee **0 bps**, destination null, no Pons fee leg; no keeper or automated burn at T/D0; manual public burn wallet D0 |
| D0 pages/tools and later Drops | partially ported/mocked, mostly absent | Not a reason to expand T packets | approvals/kill, Loop Lab, Deep Research list/detail, perps, Burn Board, Beat the Swarm/Clear badge, active trial/tiers, push, ChatGPT/OpenClaw, on-chain session keys, x402 and Drop1–9 remain behind stage gates |
| Recorded Drop demos | missing evidence | D0 readiness per GO PLAN; only shown on T calendar if actually recorded | Existing stage roadmap, no speculative T features/recording jobs |

## Coverage reconciliation with original packets and backlog

| Original coverage | Actual interpretation / remaining work |
|---|---|
| 001–004 | Rebrand/shared contracts/untrusted/pure policy implemented. Runtime harness and actual-account binding were explicitly not owned by 004; 028/052/090–095 cover them. |
| 005–010 | Design/shell/Radar/Mission and v1 foundation implemented; placeholders and offline mocks do not supply remaining screens or APIs. |
| 012–015 | Signal and terminal ports implemented; 013 removes old analyst/portfolio assets and gates D0 pages. New implementation reuses these conventions. |
| 016–017, 021, 024–025 | Registry/indexer/candles/metered RPC/log follower implemented with bounded live evidence; full chain/backfill and all launchpad/protocol coverage not proved. 065/066 stay existing work. |
| 019 | Contract implementation/deployment script covered; don't duplicate contract or independent review. Runtime outbox/committer/proofs/UI are uncovered 079–081/113. |
| 020 | Mission/Connect/approval UI exists. T real account/key/journal/pack API integration is uncovered; D0 approvals remain gated. |
| 022 | Real rule/card/Signal engine and replay exist; missing source checks marked unavailable. V2 changes stay 026–064, new venue/Watcher/Swarm/runtime receipt work remains distinct. |
| 023 plus 023/023b/023c/023d implementation reports | Real read/WS projections, indexes and pending semantics present. 023d PGlite request-injection radar max 51.01ms and 100k-row ingest +1.57% are historical local evidence, not cold/network/staging p95. Explicitly deferred scan jobs, candles and non-read APIs get new packets. |
| BACKLOG trade context / legacy /api callers / incomplete offline mocks | 075–078, 090, 123 and 129. No second trade rewrite. Preserve real isolated-server tests rather than calling mock mode live. |
| BACKLOG light palette / orphan tables / research list | Light remains a deferred design decision; orphan cleanup is not a launch feature; Research list is D0. No extra T cleanup packets. |
| BACKLOG holders / non-Pons cards / growing replay writes / replay denominator | 086 verifies live holdings; 029/035 own nullable non-Pons cards; 053 owns incremental cost/accurate workload denominator. No duplicate Guard fix. |
| BACKLOG RPC / catch-up / curve progress | 024 done baseline; 066 and 065 already own the pending changes. |

## Ready-to-build priority and dependency waves

Packet numbers are identifiers; **priority is this ordering**, not numeric order. Forward dependencies reflect shared critical-path work. Each new file states spec, prerequisites, testable Do, Don't and Report, with one bounded session ending in a tested diff or explicit unavailable result. Long runs do not silently become more coding sessions.

1. **B truth inputs:** 067–072, 069/134 control/custody, 130–133 ingest, alongside existing 039–048 and 065–066. 041 remains the sole local depth solver.
2. **B execution:** 090 account needed first, then 073–078, consuming existing 028/052.
3. **B receipts/operations:** 079–089 and 125, with 082 before staging, 092 before the private-data restore check, real receipt deployment supplied externally.
4. **T harness:** 091–096; optional hosted connector 097–099 after real MCP deploy. Preset/API work can use typed unavailable fixtures before all collectors finish.
5. **T labels/forecast:** 100–106, 135; 103 methodology needs Oct 6 publication preparation even if label numbers remain gated.
6. **T public product:** 107–115, 119–121 and 136; prototype ports consume already-defined APIs.
7. **T distribution/accountability:** 116–118, 122–124, 126, 128. 118 Ghost drafts are needed Oct 3 and 089 policies Oct 5 despite dependencies on later accepted live evidence; draft missing-evidence states first, never fabricated findings.
8. **Acceptance:** 129/137 on the stable assembled candidate, 087/088 accumulate rather than rerun unchanged valid gates. 127 is the Oct 16 dark-bot readiness task.

There are **71 new coding packets**, plus **38 non-optional existing Guard packets**, 065/066 and external release work. This is a scoped work inventory, not a promise of 111 simultaneous sessions or a schedule fit. Only a dependency-aware staffing plan and accepted evidence can establish feasibility; a deadline cannot convert missing checks to success.

## Decisions, ambiguities and evidence that remain external

- **TODO(spec): Railway staging versus production.** The user asks Railway; BACKEND §19/GO PLAN §4 specify Vultr/BitLaunch production and retire Railway configuration. 083 uses Railway for staging only; no implied production hosting change.
- **TODO(spec): backup retention/drill cadence.** BACKEND §19 requires 30 daily/12 monthly and weekly drills; GO PLAN §§4.2/16 lists a different retention/cadence. 084 preserves the stronger applicable retention and weekly cadence, with a real pre-B drill; final ops policy must record the resolution.
- **TODO(spec): unset launch-week quotas/Points rates.** Shared shapes exist but complete numeric limits and earning amounts are not all given. 090/122 expose/configure explicit values and keep undefined accrual disabled; never invent unlimited access or economics.
- Policies are drafted in 089, approved by the owner separately. Sanctions-source freshness/availability must be operationally demonstrated; no permissive fallback.
- GO PLAN §§6.2/9's **Oct 13–16 public window and bounty live at T** supersede the old Oct 5–8/late-bounty wording in BACKEND §21.3 and contract review scaffold. 128 corrects implementation handoff artifacts, not the read-only spec.
- Pons event/getter verification is genuine existing evidence. Router callability, current graduation/hook configuration and chain settlement still require pinned fork matches. Quote-only fallbacks are explicit scoped fallbacks, not full-route acceptance.
- Domain/provider/account setup, human reviews/labels, sanctioned-source decisions, deployment, funded committer and wallet readiness are not established by this repository inspection. No private account/secret discovery was performed.
- Census numbers require independent Likely-agent precision >=90%. Swarm ranking requires its accepted baseline evaluation; Signal stays descriptive and never ranks Radar. Missing evidence remains visible and does not inherit zero or a lowest-risk label.

## Validation of this docs change

Only `docs/tasks/` markdown files were added; code, prototype, read-only specs and lockfile were not edited. Checks passed for 71 contiguous packet numbers, required sections, dependency references, relative links and whitespace; added files contain no email addresses or absolute personal paths. Standalone brand check passed (15 files) and address check passed (265 source files). `git diff --check` passed for tracked changes; the explicit markdown checker also checked the untracked additions.

Workspace checks attempted once with automatic dependency verification disabled: `pnpm typecheck` could not run the compiler (tsc missing); `pnpm test` passed the brand self-test and address check over 265 source files, then stopped because vitest was missing. A single frozen offline install attempt failed with **ERR_PNPM_NO_OFFLINE_TARBALL** for **lightningcss 1.33.0**. These are environment blockers, not passing typecheck/test results. No unchanged failing command was repeated. Full green verification requires the lockfile's missing cached packages in a usable dependency environment.
