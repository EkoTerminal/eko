# Audit Grade — EKO

**Grade: 9.6 / 10** · Rubric v2 · **No cap applies**
Commit `51f0ebd5eb640f16c5ca225817f04476ff1e49ea` · Clean tree at entry · Mode `rescore` · 2026-10-03 (America/Toronto)
Previous: **9.6** at `0de26eb7112d196a5a9928fe5dbb5a902e791e20` today (**+0.0**) · Studio policy: **5/8 pass**
Deployed build: **matches the current audited runtime for live Railway API and worker**. Fresh verifier accepted `23976fc07b67550610bcc5206ca4286ffe349076`; its only subsequent change through HEAD is staging documentation. EKO contracts remain undeployed.
Independent check: **agreed exactly at 9.6 (within 0.3)**. A fresh read-only reviewer recomputed all seven categories, floor and caps; challenged the three 61849fb Medium closures; independently reconciled 187/187 V8 census paths and exact counters; and spot-checked static-analysis CI targets/source equivalence and the live identity comparator/runtime range. No score or cap corrections; no repository execution or new hunting.
Testing score is measured, not estimated. This rescore uses runner-supplied evidence in `runs/20261003-211920/`. The grader performed static source, test, hash, census and Git-equivalence checks only; no installs, builds, application/test execution, mutation reruns, signing, deployment or new vulnerability hunting.
Cross-brand registry comparison skipped. No registry rows or extra artifacts were written because the runner restricts writes to the two reports, findings ledger and history.

## Path to 9/10

**9.0 and 9.5 remain reached.** All six historical findings retain their required regression proof. Complete core coverage, conservative mutation credit, current live identities and static-analysis coverage remain earned. Defaulting instrumented coverage to two workers improves reproduction; fresh coverage rises from 8,371 to **8,374/8,744 lines**, still in the same ≥95% rubric band. Launch-browser and UI performance work earns no points in this non-UI audit. The four scored deductions below have no new qualifying proof.

Main Path: **no required item; current projected grade 9.6**. The rubric stops the main list at ≥9.5. Remaining grade work is under Later, ranked by sequential **final-grade gain/hour**, recomputing floors at each checkpoint. Sizes: S=1h, M=4h, L=16h, XL=40h.

Studio policy fixes (each **+0.0 grade**, absent a traced security harm): P3 — accept per-brand public deployer/owner/multisig/committer/burn role records and compare with the portfolio (S1h after inputs). P4 — record accepted issuance/allocations and utility boundaries under FACTS §5 (S1h after decisions). P7 — provide a nonempty sibling-brand/ticker inventory and a bounded cross-mention review (S1h after inventory). No identity metadata is requested or scored.

### Later

| Rank | Fix | Where | Points / projected grade | Effort | Proof for rescore |
| --- | --- | --- | --- | --- | --- |
| 1 | Configure monitoring receivers, role contacts and accepted thresholds; retain an acknowledged incident drill | `infra/monitoring/README.md:1`, `SECURITY.md:237–251` | **+0.1 → 9.7**, D8 +1; raw 9.625→9.725; 0.025 points/h | **M 4h** | Accepted receiver/rule configuration, actual alert-delivery acknowledgements for authority changes, pause, configured outflows, reference staleness, committer gas and unavailable collectors, plus incident contacts and response drill. Collector fixture tests do not establish delivery. |
| 2 | Record current real-dependency integration of guarded execution | `docs/security/FORK-TESTS.md:1`, `apps/server/test/fork/live-route.fork.test.ts` | **+0.1 → 9.8**, C7 +1; raw 9.725→9.875; 0.00625 points/h | **L 16h** | Candidate-linked successful real router/token/provider tests with chain/block/build pins and preserved execution/refusal assertions. Current optional fork skips and historical green runs do not qualify for changed guarded flows. |
| 3 | Confirm a working private disclosure channel | `SECURITY.md:17–22` | **+0.1 → 9.9**, F6 +0.5; raw 9.875→9.925; 0.100 points/h at this checkpoint | **S 1h** | Repository evidence that private advisories or a role mailbox receives reports; remove pending-channel caveat, retain the accepted-risk list. |
| 4 | Prove nontrivial fee, settlement, unit and rounding math formally | `packages/chain/src/simulation/pons-math.ts`, `apps/server/src/exec/` | **+0.1 → 10.0**, C8 +0.5; raw 9.925→10.000; 0.0025 points/h | **XL 40h** | Reproducible symbolic/formal checks of actual core arithmetic. Registry-only hash/counter simplicity does not earn whole-core credit. |

Sequential projection: **9.625→9.725→9.875→9.925→10.000**, floored **9.6→9.7→9.8→9.9→10.0**. Disclosure alone initially gains +0.0 (9.675 floors to 9.6), and after monitoring still gains +0.0 (9.775 floors to 9.7); integration therefore precedes disclosure until the latter gains +0.1. Formal checks initially gain +0.1 but require 40h. These are sequential gains, not additive independently rounded estimates.

Evidence maintenance (**+0.0**, S1h): refresh `docs/security/COVERAGE.md`'s historical candidate labels, 191/2,524 test counters and 8,370/8,744 lines to the fresh **194 suites / 2,575 tests / 8,374 of 8,744 lines**. Explicit noncore exclusions need current Guard research filenames `guard-cutover.ts`, `monthly-evaluation-cli.ts`, `monthly-evaluation.ts`, `reserve-origin-input.ts`, `reserve-origin.ts`, and shared presentation-only `disclosures.ts`. The current 187-file core denominator reconciles independently; these documentation omissions do not establish missing executable core lines. Refresh `.audit-grade/SCOPE.md` when maintaining the historical scope; the current scope is frozen below. Retain exact mutation hashes and renew deployment identity whenever runtime/configuration changes. Matching executable bundles do not prove identical OCI layers.

## Score breakdown

| Category | Score | Weight | Weighted | Change since 0de26eb | Main deductions |
| --- | ---: | ---: | ---: | ---: | --- |
| A Core security | **10.0** | 35% | **3.500** | **0.0** | No open core findings |
| B Off-chain security | **10.0** | 15% | **1.500** | **0.0** | Six historical rows verified fixed |
| C Testing & verification | **8.5** | 15% | **1.275** | **0.0** | Current real-dependency integration 0/1; formal checks 0/0.5 |
| D Privileged operations, deployment & ops | **9.0** | 10% | **0.900** | **0.0** | Monitoring delivery/contacts/drill pending |
| E Dependencies & supply chain | **10.0** | 5% | **0.500** | **0.0** | Scoped rubric checks met; no container/OS clearance implied |
| F Hygiene & CI | **9.5** | 10% | **0.950** | **0.0** | Disclosure channel unconfirmed |
| G Docs & threat model | **10.0** | 10% | **1.000** | **0.0** | Rubric met; historical evidence labels need maintenance |
| **Total before caps** | | | **9.625 → 9.6** | **+0.000 raw / +0.0 floored** | Floor to one decimal |
| **Cap / final** | | | **none / 9.6** | **+0.0 final** | Recent full audit, current live verdict, zero open Mediums |

A = max(0, 10 − 0×10 Critical − 0×3.5 High − 0×1.2 Medium − 0×0.3 Low) = **10.0**.
B = max(0, 10 − 0×10 Critical − 0×3.5 High − 0×1.2 Medium − 0×0.3 Low) = **10.0**.
No accepted findings. Fixed/false-positive rows deduct zero. All six ledger implementations are off-chain; the receipt DB/worker finding's EVM lane label does not place it in A. Both code types exist; no N/A weight transfer.

Weighted total = **0.35×10 + 0.15×10 + 0.15×8.5 + 0.10×9 + 0.05×10 + 0.10×9.5 + 0.10×10 = 3.500 + 1.500 + 1.275 + 0.900 + 0.500 + 0.950 + 1.000 = 9.625**.
**floor(9.625×10)/10 = 9.6**. Final **9.6**; previous raw 9.625 and final 9.6, hence **+0.0**. From the full follow-up at 61849fb (7.0), the cumulative improvement remains **+2.6**.

| Every rubric cap | Applies? | Evidence / decision |
| --- | --- | --- |
| Any open Critical →3.0 | No | 0 Critical |
| Live secret in history →3.0/6.0/8.9 | No | Fresh redacted Gitleaks exit 0; no confirmed live secret; known public-test/vendor leads retain full-run triage |
| ≥2 open Highs →5.0 | No | 0 High |
| User-fund-holding code with zero tests →5.0 | No | 0 implemented EKO user-fund-custody modules; tests exist |
| One open High →6.0 | No | 0 High |
| Build/tests fail →6.0 | No | Fresh complete root, typecheck, Forge and coverage gates exit 0. Asserted refusal children exit 1 by design; one optional RPC fork is skipped, disclosed below. |
| Live deployment differs/cannot verify/not checked →7.0 | No | Fresh dual-role staging verifier exit 0 at 23976fc; only staging documentation changed through 51f0ebd. Current verdict for deployed runtime/configuration; not whole-image equality. |
| Fund-holding vault/lending/perp/pool lacks stateful invariants →8.0 | No | Registry stores roots without custody. C5 uses the explicit no-funds main-flow integration alternative. |
| Any open unaccepted Medium →8.9 | No | 5 historical Mediums fixed; 0 open |
| Rescore without full/quick within 30 days →8.9 | No | Full run today at 61849fb is on record in committed history; eligible for 9+ |

## Scope

Bounded **rescore** of every ledger row, including all three Mediums and the Low discovered at 61849fb, against implementation and the previous report's required proof. Fresh supplied scans/gates and current C–G checklist evidence were read. No new hunting, leads promoted or code changes. The full follow-up at 61849fb remains the security baseline; this rescore is not a full review of later research modules.

**15 in-scope workspaces**: `contracts`; `apps/{server,indexer,engines,mcp,bots,og-renderer}`; `packages/{shared,chain,db,policy,playbooks,signal,untrusted,receipts-verifier}`. Root adds a sixteenth scoped lockfile importer. **Two stacks**: Solidity and TS/JS; 1 Solidity + 14 TS workspaces. Protocols: receipt commitments, noncustodial unsigned AMM/Pons/v4 preparation, agent/harness authentication, private journals, canonical ingest/accounting, advisory engines/bots, monitoring/deployment. Detector TEE/vendor hints do not establish an authored TEE, Solana, ZK, FHE or fund vault. UI, UI tests/dependencies/CI, brand-video assets and founder metadata are excluded. The supplied root gate includes a web build, but it earns no UI points.

Baseline lanes/evidence scope: EVM `contracts/src`; execution/MCP/auth `apps/server/src/{exec,harness,http}`, `apps/mcp/src`, policy/chain; data/oracle/engines indexer, DB receipts, engine workers and server collectors; AI/bots engine and server boundaries plus bots; hygiene/supply-chain/studio/deploy manifests, locks, workflows, Dockerfile, SECURITY, infra/release evidence. Shared validators/proof/crypto libraries are included. Frozen non-UI source file list appears below; it is not the executable-line denominator or a claim that every listed file was manually reviewed.

Runner execution provenance is supplied, not recreated. Current source binding: restore fixture names 51f0ebd in root/coverage output; current ledger assertions, mutation hashes/spans, V8 census and Git tree equivalence for CI/deploy were verified statically. Prior checklist evidence is reused where relevant inputs are unchanged. Supplied CI at e00fa56 differs from HEAD only in audit report/history and staging docs.

| Tool / gate | Result | Output under runs/20261003-211920/ |
| --- | --- | --- |
| Stack/hygiene/studio | Supplied current scans; hygiene HEAD 51f0ebd, dirty 0; existing leads retain triage | `stack.txt`, `hygiene.txt`, `studio.txt` |
| Gitleaks | Exit 0/no leaks; 265 scanned commits reported versus hygiene's 451 graph commits (different counters) | `gitleaks.txt` |
| Frozen install | Exit 0, lock current, 277 cached packages reused; command flags not printed, frozen CI/Docker policy supplies configuration evidence | `install.txt` |
| Typecheck | Exit 0; 14/14 scoped TS checks | `typecheck.txt` |
| Complete root pnpm test | Exit 0; root checks, 15/15 scoped workspace suites, production web/server builds and compiled role startup/shutdown/refusal checks | `root-test.txt:1–593` |
| Forge | 38 passed, 0 failed, 1 optional RPC fork skipped; 3 fuzz properties×1,000, 4 invariants×16,384 calls | `forge-test.txt` |
| Core coverage | Exit 0; 194 TS suites/2,575 tests; 8,374/8,744=95.7685%; 187/187 TS census paths reconciled | `coverage.txt:89–90,377–395`; generated `coverage/{core-summary.json,typescript/coverage-summary.json}` |
| Contract mutation | Supplied JSON equals committed result; 12 direct and 3 manifest hashes plus all 70 edit spans match; conservative 50/53 kills | `mutation.json`, `contracts/release/mutation.json` |
| Production advisory audit | Exit 0; no known vulnerabilities; library dependency evidence, not image/OS scan | `audit-prod.txt` |
| Staging identity | Exit 0; API and worker match revision/bundle/reviewed configuration | `staging-identity.txt` |
| GitHub CI | Run 37166829015 at e00fa56b526f059a54493da3f36c9b31d65e2113, completed success: node, four test groups, contracts, Slither, Semgrep, secrets | `ci.txt`, `.github/workflows/ci.yml` |
| Other analyzers, formal math, current live-dependency forks | Not newly run; no fabricated local results or current dependency acceptance | Full-run limits, `docs/security/FORK-TESTS.md` |

<details>
<summary>435 tracked non-UI source paths at 51f0ebd</summary>

```text
apps/bots/src/farcaster/handler.ts
apps/bots/src/farcaster/images.ts
apps/bots/src/farcaster/neynar.ts
apps/bots/src/farcaster/store.ts
apps/bots/src/farcaster/verify.ts
apps/bots/src/farcaster/webhook.ts
apps/bots/src/index.ts
apps/bots/src/telegram/grammy.ts
apps/bots/src/telegram/handler.ts
apps/bots/src/telegram/parse.ts
apps/bots/src/telegram/reads.ts
apps/bots/src/telegram/store.ts
apps/bots/src/telegram/webhook.ts
apps/bots/src/x/handler.ts
apps/bots/src/x/parse.ts
apps/bots/src/x/store.ts
apps/bots/src/x/transport.ts
apps/engines/src/acquisition-run-cli.ts
apps/engines/src/acquisition-run.ts
apps/engines/src/activity.ts
apps/engines/src/aggregates.ts
apps/engines/src/attribution-coverage.ts
apps/engines/src/buyer-benchmark-cli.ts
apps/engines/src/buyer-benchmark-input.ts
apps/engines/src/buyer-benchmark-pons.ts
apps/engines/src/buyer-benchmark.ts
apps/engines/src/campaign-replay.ts
apps/engines/src/card.ts
apps/engines/src/cli.ts
apps/engines/src/control-acquisition.ts
apps/engines/src/control-observations.ts
apps/engines/src/control-profile.ts
apps/engines/src/control-profiles.ts
apps/engines/src/coverage-pilot-cli.ts
apps/engines/src/coverage-pilot-store.ts
apps/engines/src/coverage-pilot.ts
apps/engines/src/curve-progress.ts
apps/engines/src/development-fit-cli.ts
apps/engines/src/development-fit-statistics.ts
apps/engines/src/development-fit.ts
apps/engines/src/directional-depth.ts
apps/engines/src/graduation-inventory.ts
apps/engines/src/grouped-coverage-input.ts
apps/engines/src/grouped-coverage.ts
apps/engines/src/guard-cutover.ts
apps/engines/src/guard-performance.ts
apps/engines/src/identity-v2.ts
apps/engines/src/incremental-guard.ts
apps/engines/src/index.ts
apps/engines/src/label-completion-cli.ts
apps/engines/src/label-completion.ts
apps/engines/src/live-shadow-cli.ts
apps/engines/src/live-shadow.ts
apps/engines/src/locked-test-cli.ts
apps/engines/src/locked-test-statistics.ts
apps/engines/src/locked-test.ts
apps/engines/src/lot-arithmetic.ts
apps/engines/src/lot-input.ts
apps/engines/src/lot-metrics.ts
apps/engines/src/lot-selling.ts
apps/engines/src/market.ts
apps/engines/src/matched-source.ts
apps/engines/src/metrics.ts
apps/engines/src/monthly-evaluation-cli.ts
apps/engines/src/monthly-evaluation.ts
apps/engines/src/outcome-input.ts
apps/engines/src/outcome-labels.ts
apps/engines/src/outcome-queue.ts
apps/engines/src/outcomes.ts
apps/engines/src/pons-profile.ts
apps/engines/src/pons-reference.ts
apps/engines/src/probability-sample.ts
apps/engines/src/qualified-graph-input.ts
apps/engines/src/qualified-graphs.ts
apps/engines/src/receipt.ts
apps/engines/src/receipts/cli.ts
apps/engines/src/receipts/worker.ts
apps/engines/src/reference-simulation.ts
apps/engines/src/registry-labels.ts
apps/engines/src/replay-cache.ts
apps/engines/src/reserve-origin-input.ts
apps/engines/src/reserve-origin.ts
apps/engines/src/sampling-and-incidents-cli.ts
apps/engines/src/selective-backfill-cli.ts
apps/engines/src/selective-backfill.ts
apps/engines/src/shadow-observations.ts
apps/engines/src/shadow-v2.ts
apps/engines/src/signal-v2.ts
apps/engines/src/sources.ts
apps/engines/src/supply-v2.ts
apps/engines/src/swarm/calibration.ts
apps/engines/src/swarm/index.ts
apps/engines/src/swarm/personas/v1.ts
apps/engines/src/v4-reference.ts
apps/engines/src/watcher/calldata.ts
apps/engines/src/watcher/evaluate.ts
apps/engines/src/watcher/features.ts
apps/engines/src/watcher/flow-store.ts
apps/engines/src/watcher/flow.ts
apps/engines/src/watcher/score.ts
apps/engines/src/watcher/store.ts
apps/engines/src/worker.ts
apps/indexer/src/agent-registry.ts
apps/indexer/src/backfill-gate-cli.ts
apps/indexer/src/backfill-gate-snapshot.ts
apps/indexer/src/backfill-gate.ts
apps/indexer/src/backfill.ts
apps/indexer/src/cli.ts
apps/indexer/src/clients.ts
apps/indexer/src/concurrency.ts
apps/indexer/src/decode.ts
apps/indexer/src/enrich.ts
apps/indexer/src/guard-stop.ts
apps/indexer/src/head.ts
apps/indexer/src/index.ts
apps/indexer/src/log-budget.ts
apps/indexer/src/log-head.ts
apps/indexer/src/pool-events.ts
apps/indexer/src/price.ts
apps/indexer/src/receipt-actors.ts
apps/indexer/src/rows.ts
apps/indexer/src/safe-error.ts
apps/indexer/src/scan-jobs.ts
apps/indexer/src/sender-scope.ts
apps/indexer/src/stack-summary.ts
apps/indexer/src/types.ts
apps/indexer/src/wallet-protocol.ts
apps/mcp/src/app.ts
apps/mcp/src/cli.ts
apps/mcp/src/harness.ts
apps/mcp/src/index.ts
apps/mcp/src/limits.ts
apps/mcp/src/oauth.ts
apps/mcp/src/read-tools.ts
apps/mcp/src/runtime.ts
apps/mcp/src/tools.ts
apps/og-renderer/src/index.ts
apps/og-renderer/src/runtime.ts
apps/og-renderer/src/sample.ts
apps/server/src/ai/budget.ts
apps/server/src/ai/providers/anthropic.ts
apps/server/src/ai/providers/chat.ts
apps/server/src/ai/providers/gemini.ts
apps/server/src/ai/providers/responses.ts
apps/server/src/ai/registry.ts
apps/server/src/ai/swarm-worker.ts
apps/server/src/ai/types.ts
apps/server/src/alerts/service.ts
apps/server/src/app.ts
apps/server/src/build-identity.ts
apps/server/src/config.ts
apps/server/src/db/client.ts
apps/server/src/db/migrate-cli.ts
apps/server/src/db/schema.ts
apps/server/src/dev.ts
apps/server/src/exec/actual-order.ts
apps/server/src/exec/chain.ts
apps/server/src/exec/networks.ts
apps/server/src/exec/portfolio.ts
apps/server/src/exec/position-accounting.ts
apps/server/src/exec/quotes.ts
apps/server/src/exec/service.ts
apps/server/src/exec/trade-access.ts
apps/server/src/exec/trade-backend.ts
apps/server/src/exec/trade-evidence.ts
apps/server/src/exec/trade-reconcile.ts
apps/server/src/exec/trades.ts
apps/server/src/exec/types.ts
apps/server/src/exec/v3-routes.ts
apps/server/src/fixtures/producers.ts
apps/server/src/flags/service.ts
apps/server/src/harness/entitlements.ts
apps/server/src/harness/journal.ts
apps/server/src/harness/oauth-consent.ts
apps/server/src/harness/oauth-tokens.ts
apps/server/src/harness/preflight.ts
apps/server/src/harness/service.ts
apps/server/src/http/auth.ts
apps/server/src/http/ghost-reports.ts
apps/server/src/http/launch-monitoring.ts
apps/server/src/http/review-api.ts
apps/server/src/http/routes.ts
apps/server/src/http/share.ts
apps/server/src/http/v1/account.ts
apps/server/src/http/v1/agents.ts
apps/server/src/http/v1/bags.ts
apps/server/src/http/v1/config.ts
apps/server/src/http/v1/defaults.ts
apps/server/src/http/v1/demo-token-cli.ts
apps/server/src/http/v1/demo.ts
apps/server/src/http/v1/drop-manifest.ts
apps/server/src/http/v1/fixtures.ts
apps/server/src/http/v1/health.ts
apps/server/src/http/v1/helpers.ts
apps/server/src/http/v1/index.ts
apps/server/src/http/v1/journal.ts
apps/server/src/http/v1/oauth.ts
apps/server/src/http/v1/packs.ts
apps/server/src/http/v1/reads.ts
apps/server/src/http/v1/receipts.ts
apps/server/src/http/v1/rpc.ts
apps/server/src/http/v1/telegram.ts
apps/server/src/http/v1/telemetry.ts
apps/server/src/http/v1/trade-admin.ts
apps/server/src/http/v1/trade.ts
apps/server/src/http/v1/watch.ts
apps/server/src/http/v2-guard.ts
apps/server/src/index.ts
apps/server/src/launch.ts
apps/server/src/market/candleStore.ts
apps/server/src/market/demoFeed.ts
apps/server/src/market/rng.ts
apps/server/src/market/service.ts
apps/server/src/market/stored.ts
apps/server/src/market/types.ts
apps/server/src/obs/errors.ts
apps/server/src/obs/incidents.ts
apps/server/src/obs/launch.ts
apps/server/src/obs/logger.ts
apps/server/src/obs/metrics.ts
apps/server/src/obs/security-collectors.ts
apps/server/src/obs/security-config.ts
apps/server/src/obs/security-worker.ts
apps/server/src/obs/telemetry.ts
apps/server/src/ops/backup-cli.ts
apps/server/src/ops/backup-stream.ts
apps/server/src/ops/census-eval-cli.ts
apps/server/src/ops/ghost-reports-cli.ts
apps/server/src/ops/restore-checks.ts
apps/server/src/points/config.ts
apps/server/src/points/service.ts
apps/server/src/proxy-trust.ts
apps/server/src/quant/service.ts
apps/server/src/read/bags.ts
apps/server/src/read/coins.ts
apps/server/src/read/feed.ts
apps/server/src/read/guard-card.ts
apps/server/src/read/guard-compat.ts
apps/server/src/read/guard-consumers.ts
apps/server/src/read/guard-store.ts
apps/server/src/read/live.ts
apps/server/src/read/pagination.ts
apps/server/src/read/pairs.ts
apps/server/src/read/radar.ts
apps/server/src/read/receipt-reader.ts
apps/server/src/read/scan.ts
apps/server/src/read/scoreboard.ts
apps/server/src/read/senses.ts
apps/server/src/read/store.ts
apps/server/src/roles.ts
apps/server/src/sanctions/parser.ts
apps/server/src/sanctions/service.ts
apps/server/src/swarm/cli.ts
apps/server/src/swarm/paper.ts
apps/server/src/swarm/runner.ts
apps/server/src/swarm/source.ts
apps/server/src/telegram/delivery.ts
apps/server/src/telegram/link.ts
apps/server/src/ws/hub.ts
contracts/src/ReceiptsRegistry.sol
packages/chain/src/abi-pull-cli.ts
packages/chain/src/abi-pull.ts
packages/chain/src/abis.ts
packages/chain/src/actor.ts
packages/chain/src/build-records.ts
packages/chain/src/control/collector.ts
packages/chain/src/control/fork.ts
packages/chain/src/control/types.ts
packages/chain/src/custody/collector.ts
packages/chain/src/custody/ticks.ts
packages/chain/src/custody/types.ts
packages/chain/src/decoders.ts
packages/chain/src/execution/pons-actual.ts
packages/chain/src/execution/pons.ts
packages/chain/src/execution/v4.ts
packages/chain/src/funding/acquisition.ts
packages/chain/src/funding/diagnostic.ts
packages/chain/src/funding/provider.ts
packages/chain/src/index.ts
packages/chain/src/launchpads/flap.ts
packages/chain/src/launchpads/klik.ts
packages/chain/src/launchpads/launch-roles.ts
packages/chain/src/launchpads/occupy.ts
packages/chain/src/launchpads/pons.ts
packages/chain/src/launchpads/principal-services.ts
packages/chain/src/launchpads/trace-acquisition.ts
packages/chain/src/launchpads/trace-principals.ts
packages/chain/src/launchpads/types.ts
packages/chain/src/registry.ts
packages/chain/src/rpc/clients.ts
packages/chain/src/rpc/metered.ts
packages/chain/src/rpc/routes.ts
packages/chain/src/rpc/safe-error.ts
packages/chain/src/rpc/transient.ts
packages/chain/src/rpc/usage.ts
packages/chain/src/simulation/anvil.ts
packages/chain/src/simulation/campaign-input.ts
packages/chain/src/simulation/campaign-pressure.ts
packages/chain/src/simulation/campaign-replay.ts
packages/chain/src/simulation/depth-removal.ts
packages/chain/src/simulation/depth-run.ts
packages/chain/src/simulation/depth-v3.ts
packages/chain/src/simulation/depth.ts
packages/chain/src/simulation/directional-depth.ts
packages/chain/src/simulation/fork-check-cli.ts
packages/chain/src/simulation/fork-gateway-cli.ts
packages/chain/src/simulation/fork-gateway.ts
packages/chain/src/simulation/fork-manifest-cli.ts
packages/chain/src/simulation/fork-manifest.ts
packages/chain/src/simulation/fork-runtime.ts
packages/chain/src/simulation/pons-fork-cli.ts
packages/chain/src/simulation/pons-math.ts
packages/chain/src/simulation/pons.ts
packages/chain/src/simulation/probe-runtime.ts
packages/chain/src/simulation/reference.ts
packages/chain/src/simulation/types.ts
packages/chain/src/simulation/v3.ts
packages/chain/src/simulation/v4-probe-runtime.ts
packages/chain/src/simulation/v4.ts
packages/chain/src/verify-cli.ts
packages/chain/src/verify-command.ts
packages/chain/src/verify.ts
packages/db/src/bus.ts
packages/db/src/client.ts
packages/db/src/crypto/destruction.ts
packages/db/src/crypto/journal.ts
packages/db/src/engines-migrate.ts
packages/db/src/engines-schema.ts
packages/db/src/flow-read.ts
packages/db/src/flow-schema.ts
packages/db/src/ghost-reports.ts
packages/db/src/guard-receipts.ts
packages/db/src/guard-schema.ts
packages/db/src/guard-store.ts
packages/db/src/index.ts
packages/db/src/launch-monitoring.ts
packages/db/src/lock.ts
packages/db/src/market.ts
packages/db/src/migrate-cli.ts
packages/db/src/receipt-anchors.ts
packages/db/src/receipt-api.ts
packages/db/src/receipt-committer.ts
packages/db/src/receipt-outbox.ts
packages/db/src/receipt-schema.ts
packages/db/src/registry-schema.ts
packages/db/src/review-store.ts
packages/db/src/scan-jobs.ts
packages/db/src/scan-schema.ts
packages/db/src/schema.ts
packages/db/src/types.ts
packages/db/src/wallet-protocol-schema.ts
packages/playbooks/src/guard-allocation.ts
packages/playbooks/src/guard-factors.ts
packages/playbooks/src/guard-registry.ts
packages/playbooks/src/guard-scoring.ts
packages/playbooks/src/history-v2.ts
packages/playbooks/src/index.ts
packages/playbooks/src/rules.ts
packages/playbooks/src/types.ts
packages/playbooks/src/verdict.ts
packages/policy/src/actual-order.ts
packages/policy/src/canonical.ts
packages/policy/src/guard.ts
packages/policy/src/helpers.ts
packages/policy/src/index.ts
packages/policy/src/preflight.ts
packages/policy/src/presets.ts
packages/policy/src/repeat.ts
packages/receipts-verifier/src/index.ts
packages/shared/src/backtest.ts
packages/shared/src/bots.ts
packages/shared/src/canonical.ts
packages/shared/src/census-gate.ts
packages/shared/src/contracts/actual-order.ts
packages/shared/src/contracts/api.ts
packages/shared/src/contracts/auth.ts
packages/shared/src/contracts/backtest-result.ts
packages/shared/src/contracts/burn.ts
packages/shared/src/contracts/bus.ts
packages/shared/src/contracts/coin.ts
packages/shared/src/contracts/common.ts
packages/shared/src/contracts/entitlements.ts
packages/shared/src/contracts/feed.ts
packages/shared/src/contracts/ghost-reports.ts
packages/shared/src/contracts/guard-card-api.ts
packages/shared/src/contracts/guard-consumers.ts
packages/shared/src/contracts/guard-copy.ts
packages/shared/src/contracts/guard-history.ts
packages/shared/src/contracts/guard-ids.ts
packages/shared/src/contracts/guard-lots.ts
packages/shared/src/contracts/guard-receipts.ts
packages/shared/src/contracts/guard-review.ts
packages/shared/src/contracts/guard-scoring.ts
packages/shared/src/contracts/guard-storage.ts
packages/shared/src/contracts/guard-supply.ts
packages/shared/src/contracts/guard-transport.ts
packages/shared/src/contracts/guard-v2.ts
packages/shared/src/contracts/harness.ts
packages/shared/src/contracts/index.ts
packages/shared/src/contracts/labels.ts
packages/shared/src/contracts/loop.ts
packages/shared/src/contracts/mcp-senses.ts
packages/shared/src/contracts/oauth.ts
packages/shared/src/contracts/public-receipts.ts
packages/shared/src/contracts/receipt-encoding.ts
packages/shared/src/contracts/receipts.ts
packages/shared/src/contracts/research.ts
packages/shared/src/contracts/scoreboard.ts
packages/shared/src/contracts/share.ts
packages/shared/src/contracts/swarm.ts
packages/shared/src/contracts/trading.ts
packages/shared/src/contracts/transactions.ts
packages/shared/src/contracts/versions.ts
packages/shared/src/contracts/ws.ts
packages/shared/src/disclosures.ts
packages/shared/src/drops.ts
packages/shared/src/flags.ts
packages/shared/src/format.ts
packages/shared/src/index.ts
packages/shared/src/indicators.ts
packages/shared/src/markets.ts
packages/shared/src/networks.ts
packages/shared/src/risk.ts
packages/shared/src/schemas.ts
packages/shared/src/strategies.ts
packages/shared/src/telegram.ts
packages/shared/src/telemetry.ts
packages/shared/src/time.ts
packages/shared/src/workspace.ts
packages/shared/src/ws.ts
packages/signal/src/index.ts
packages/signal/src/readings.ts
packages/signal/src/types.ts
packages/signal/src/v2.ts
packages/untrusted/src/index.ts
```

</details>

## Deploy verification

**Railway staging API and singleton worker: matches.** `staging-identity.txt` records `staging_identity_verified`, API matched, worker matched, `verify exit 0`. Source revision **23976fc07b67550610bcc5206ca4286ffe349076**; aggregate bundle digest **c09f513c5be82ac2703a574615821b03dd93ff9552975a3dd90e040c9581428e**; API configuration digest **7ca370e811f16532011401076686c92970d1f62ac9af9d14886524061529c029**. All nine executable entry/bundle hashes are supplied and compared, not only an environment revision string. The worker comparison checks its role settings separately; its digest is not printed in the supplied final record. `scripts/verify-staging-identity.mjs:10–13,57–81` rebuilds a clean pinned source, compares actual bundle bytes and reviewed config, and fails on either role's mismatch. The grader did not rerun it.

`docs/operations/staging-railway-evidence.md:190–201` records the 2026-10-04T01:19Z redeployment (2026-10-03 local), role deployments/images, matched identities and smoke. The earlier 3f872fe section is historical; the latest 23976fc record is the verdict used. API/worker images have different OCI digests from separate Dockerfile builds; executable bundles match. This is not a whole-image/container assurance claim.

Reviewed **both** `git log --oneline 3f872fe..51f0ebd` and the current-live range `git log --oneline 23976fc..51f0ebd`. The broad earlier range includes merges of Guard research, tests/core-coverage tooling and frontend launch/performance work, including shared disclosure extraction; it is not asserted runtime-identical to 3f872fe. Those changes are included in the newer live build. The decisive current-live range contains exactly **51f0ebd**, changing only `docs/operations/staging-railway-evidence.md` (+11 lines). Its Git diff has **zero bundled server/worker source, build/dependency/migration/config or Dockerfile changes**. Therefore the supplied verdict is current for the audited deployed roles and the rubric's 7.0 cap does not apply.

Reviewed staging settings retain fixed-edge `TRUST_PROXY_HOPS=1`, origin restriction/no shorter ingress assumption, paused trading and disabled launch flags. Monitoring receivers/contacts/acceptance are still pending; identity matching does not earn D8. The EKO ReceiptsRegistry has no deployed address; chain-4663 bytecode/build-record/owner/pendingOwner/committer verification is prelaunch readiness only (`packages/chain/src/verify.ts:94–119`, current verifier tests). No on-chain deployment, role action, signer custody change or new explorer acceptance is fabricated.

## Findings

**0 open** Critical / High / Medium / Low. Ledger: **6 fixed** (5 Medium, 1 Low), **0 accepted**, **0 false-positive**. No rows removed. The four 61849fb rows are explicitly reverified below, alongside both earlier Mediums.

## Studio policy

| # | Rule | Result | Evidence |
| --- | --- | --- | --- |
| P1 | Exit never gated | **Pass** | No authored user-fund custody; registry roots only, unsigned preparation; third-party exits not certified |
| P2 | Non-upgradeable by default | **Pass** | Constructor-deployed immutable registry; `DeployReceiptsRegistry.s.sol:19` |
| P3 | Fresh deployer/multisig per brand | **Unverified / not pass** | Accepted EKO role/portfolio comparison absent; no founder metadata used |
| P4 | Accepted allocations; access/utility only | **Unverified / not pass** | FACTS §5 utility boundary exists; accepted issuance/allocation record absent |
| P5 | No yield/APY/return promises | **Pass in scoped promises** | Supplied scan hits are prohibitions, technical prose or excluded visual assets; prior full scoped review retained |
| P6 | No endorsement claims | **Pass** | `README.md:5`, unchanged non-affiliation constants extracted to `packages/shared/src/disclosures.ts:1–3`, bot/harness disclosure evidence |
| P7 | No sibling cross-mentions | **Unverified / not pass** | Nonempty sibling inventory/registry evidence absent; an empty scan is not clearance |
| P8 | Honest boundaries | **Pass** | OVERVIEW §13; SECURITY planned powers/operational limits; fork, coverage and mutation caveats |

**5/8 pass**, unchanged. No policy hit has a newly traced harmful path, so no extra A/B deduction. Read-only spec context retained: FACTS §7; BACKEND §§3.5,4.2a,4.4,4.6,9.1,9.4,9.6–9.9,12.2–12.4,13,14.1–14.2,18,20,21.4; OVERVIEW §13; MARKETING §04 Robinhood/token claims. No application/spec changes or new `TODO(spec)`. Existing TODOs for reference expiry, ingress topology, outflow aggregation/unknown-token diagnostic retention and pre-mainnet custody remain disclosed decisions, not accepted ledger findings.

## Fixed since last run

**No newly fixed rows; all six remain fixed, reverified 2026-10-03.** Each row names implementation and the required regression proof. Current `root-test.txt` confirms the unexcluded server (68 suites/622 tests), indexer (12/156), engines (48/556) and DB (10/41) suites pass. Proof tests are reached by their package test include patterns; no grader rerun is claimed.

| Ledger id / title | Status | Current fix and proof for rescore |
| --- | --- | --- |
| `offchain-backend\|apps/server/src/ws/hub.ts\|unbounded-subscription-work` — unbounded public subscription work | **fixed** | `apps/server/src/ws/hub.ts:78–95,147–231`: all-frame budgets, duplicate coalescing, bounded queue, per-connection/global reads, disconnect cleanup and finally accounting. `apps/server/test/ws-bounds.test.ts:93` — **caps concurrent reads per connection and globally, bounds the queue and rejects excess work** asserts concurrency, excess rejection and resumed work; :77 duplicate/unsubscribe; :138 proves disconnected active work retains global slots and late replies are ignored. |
| `tee-oracle\|apps/indexer/src/decode.ts\|unverified-reference-price` — foreign events poison trusted USD accounting | **fixed** | `apps/indexer/src/decode.ts:200,236–255`: canonical `creation_verified` provenance plus selected identity required for same-block/restart/reference carry-forward. `apps/indexer/test/reference-price.test.ts:100` — **ignores foreign reference swaps in the block, carry-forward and restart (reverse=%s)** asserts correct persisted USD in both currency orders; :131 rejects foreign replacement; :141 tests price/candle repair and clearing unavailable data. No production backfill execution claimed. |
| `evm-stack\|packages/db/src/receipt-committer.ts\|private-receipt-batch-dos` — private item blocks all batches (61849fb Medium) | **fixed** | `packages/db/src/receipt-committer.ts:90–108` dispatches by selected kind for new/recovered batches; `receipt-outbox.ts:155–173` authenticates private commitment/canonical bytes/leaf and rejects missing/kind mismatch without plaintext access. `apps/server/test/receipt-worker-private.test.ts:66` — **journals an opted-in private entry, anchors a mixed batch, recovers after restart and advances later public batches with commitment-only private output** exercises actual consent/journal append, private/public/forecast tree, signed fixture attempt, anchor/proof, restart and later public batch; :112–127 asserts no plaintext/salt/account/agent disclosure. `apps/engines/test/receipt-committer.test.ts:59` — **rejects missing selected public/private items before signing, including stored-batch recovery** retains failure-closed integrity. |
| `data-engines\|apps/indexer/src/decode.ts\|secondary-reference-pool-overwrite` — secondary canonical pool overwrites selected reference (61849fb Medium) | **fixed** | `apps/indexer/src/clients.ts:183–214` retains deepest initialized canonical source address/venue/fee; `decode.ts:230–255,264–265` binds event/restart/carry-forward pricing and persisted freshness identity. `apps/indexer/test/reference-price.test.ts:63` — **pins the deep selected tier through same-block, carry-forward, restart and canonical re-index (reverse=%s)** checks a shallow canonical secondary cannot overwrite USD/candles, replay repairs old poisoned accounting without changing raw trades, and source rows roll back on reorg; :94 rejects absent selected archive source. `security-collectors.test.ts:238` binds freshness to selected tier. Historical repair runbook exists; no production repair asserted. |
| `mcp-auth\|apps/server/src/app.ts\|untrusted-forwarded-ip-rate-limit` — forwarded-address rotation bypasses limits (61849fb Medium) | **fixed** | `apps/server/src/app.ts:231,243`, `proxy-trust.ts:4–9`, `http/v1/rpc.ts:68`, `telemetry.ts:24`: socket peer by default, validated explicit hop trust and endpoint `req.ip` buckets. `apps/server/test/proxy-trust.test.ts:27` — **blocks forwarded-address rotation after 120 valid requests to %s** covers both endpoints, default/trusted edge, 241 header/cookie rotations, 429 after 120 and RPC invocation cap; :46 verifies identity; :55 global 600/min limit. `.env.example:11–14` and Railway README fixed-edge origin/no-shorter-ingress requirements preserve the explicit topology assumption. |
| `data-engines\|apps/server/src/obs/security-collectors.ts\|unconfigured-token-stalls-wallet-collector` — arbitrary token stalls wallet monitoring (61849fb Low) | **fixed** | `apps/server/src/obs/security-collectors.ts:218–243` filters configured tokens in SQL **before** row/receipt quotas, retaining canonical receipt/decimals refusal; :270–285 isolates bounded unknown-token diagnostics. `apps/server/test/security-collectors.test.ts:120` — **rescore proof: %i attacker-token events cannot block configured alarms or cursor advancement, including after restart** covers 1 and 1,001 injected events, exact alarm/cursor/evidence, restart and no arbitrary-token receipt RPC; :167 diagnostic query/callback isolation; :203 **stops on %s without a clean zero, including after restart** retains configured-asset failure-closed behavior. |

## Accepted risks

**None.** `SECURITY.md:29–37` accepts no ledger finding. Operational setup/disabled-feature limitations are not accepted Mediums or Low findings.

## Unverified leads

No new hunting or promoted findings. Full-run leads retain zero deduction: transaction-hash squatting/reorg legacy fills behind acquisition refusal; engine publication races; alert amplification/registry growth/collector catch-up; provider/model ceilings and semantic steering; stale-repeat misuse; disabled social transports; destruction-ledger growth; live SIWE/Postgres/OAuth acceptance; remote rules/transitives/container assurance. Fixed reference/wallet defects are not duplicated as leads. Proxy topology remains an operator assumption. Historical full raw outputs are absent from this snapshot and are not presented as newly read.

## Checklist detail (C, D, E, F, G)

Only rubric-authorized partial values. “Every”/per-package credit is full at ≥90%, half at ≥60%; current counts appear below. UI is excluded throughout.

### C — Testing & verification: 8.5 / 10

| Item | Awarded / available | Evidence and decision |
| --- | ---: | --- |
| C1 Build and all tests pass | **1.5 / 1.5** | Fresh `root-test.txt:1–593`: complete root checks, 15/15 scoped workspace suites, production server/role bundles and asserted startup/shutdown/refusal checks, final exit 0. `typecheck.txt` exit 0 for 14/14 scoped TS workspaces; `forge-test.txt` exit 0. One optional RPC skip is disclosed, not erased. |
| C2 Core executable-line coverage | **1.5 / 1.5** | Fresh `coverage.txt:89–90,377–395`, exit 0: 194/194 TS suites and 2,575/2,575 tests, then inherited Solidity coverage. **8,328/8,694 TS + 46/50 Solidity = 8,374/8,744 = 95.76852699%**, ≥95%. `vitest.coverage.config.ts:5–56` includes auth, bots (even disabled implementations), Telegram, backup/restore keys and unimported matches. `docs/security/COVERAGE.md:7` defines core and explicit noncore exclusions; older counters/candidate label are superseded by this run. Static brace/glob expansion reconciles **187 expected / 187 V8-reported / 0 missing / 0 unexpected**, and generated summaries match the fresh aggregate. `scripts/coverage.mjs:13–15` now defaults to two workers without weakening assertions/timeouts. |
| C3 Negative external-mutation tests | **1 / 1** | `docs/security/NEGATIVE-TESTS.md:5–17` plus 69-row table: **69/69** implemented core boundaries, including inherited owner/auth, implicit session mutations, trade, prepared OAuth and Telegram identity. Relevant census/source inputs unchanged since the full/previous proof; fresh root suites pass. Exact representatives: `testNonCommitterReverts`; `trade-access.test.ts:109`; `oauth-consent.test.ts:47,78`; `telegram-dms.test.ts:54–98`; harness/MCP identity tests. Overlapping lane inventories not summed. |
| C4 Stateless fuzz/property | **1 / 1** | `contracts/test/unit/ReceiptsRegistry.fuzz.t.sol:16,32,40`; fresh Forge three properties×1,000, no failures. Policy/sampling/conservation property suites pass in the root gate. |
| C5 Stateful invariants / no-funds main flows | **2 / 2** | **0 authored EKO user-fund-holding modules**; explicit no-funds alternative met by auth/preflight/unsigned trade/ingest/receipt integrations, including complete consent/private-public-forecast→sign/anchor/proof→restart→next batch at `receipt-worker-private.test.ts:66–142`. Registry's four supplementary invariants run 16,384 calls each, **not ≥100k**; no custody-invariant claim based on them. |
| C6 Core contract mutation | **1 / 1** | **1/1 authored Solidity source**. `contracts/release/mutation.json` equals supplied `mutation.json`; `docs/security/MUTATION.md` explains scope/operators/survivors. 70 candidates, 62 admitted, 9 compiler rejects excluded from kills, **50/53 compiling = 94.3396% killed**, ≥80% even including all 3 equivalent survivors. All 12 direct hashes, three dependency/fixture manifest hashes and 70 original edit spans match current files; measurement carried without rerun. |
| C7 Real-dependency integration | **0 / 1** | Fresh Forge/root optional registry fork is skipped; current main-flow suites use fixtures/stubs. `docs/security/FORK-TESTS.md` preserves historical real-router runs and constraints, without current candidate-linked acceptance for changed guarded execution. Staging identity is deployment proof, not router/token/provider integration. |
| C8 Formal checks / trivial math | **0 / 0.5** | Registry counters/equality/hashing are simple, but Pons, fee, quantity, slippage, rounding and settlement math is nontrivial. No current whole-core symbolic/formal result supplied. |
| C9 CI on every push/PR | **0.5 / 0.5** | `.github/workflows/ci.yml:3–5,30–34,38–94` covers **15/15 scoped workspaces**; supplied `ci.txt` lists successful node, four test groups and contracts at source-equivalent e00fa56. |

Sum **1.5+1.5+1+1+2+1+0+0+0.5 = 8.5**. Toolchains ran; C is not estimated and the unavailable-toolchain C≤7 rule does not apply.

### D — Privileged operations, deployment & ops: 9.0 / 10

| Item | Awarded / available | Evidence and decision |
| --- | ---: | --- |
| D1 Privileged powers/holders | **1.5 / 1.5** | `SECURITY.md:88–203` retains 82 authority groups, holder/custody/rotation matrix; **5/5 registry mutations**, **5/5 HTTP admin mutations** covered. Current registry methods :69–95; source role/admission inputs unchanged. Holders are disclosed roles, not certification of live hardware custody. |
| D2 Multisig/timelock or written handoff | **1.5 / 1.5** | `contracts/README.md:68–93,124–173`: independent 2-of-3 hardware Safe pre-mainnet, two-step transfer/recovery, separate gas-only committer, explicit zero-second delay. Written-plan alternative; no deployed multisig asserted. |
| D3 Upgrade safety / immutable | **1.5 / 1.5** | **1/1 authored deployable contract immutable**: `ReceiptsRegistry.sol:69`, direct deployment script:19, no upgrade/initializer path. |
| D4 Tested pause with exits open / no funds | **1 / 1** | **0 user-fund-custody modules**. Unsigned preparation; durable stop/host-ceiling tests in passing `trade-access.test.ts` and `launch-monitoring.test.ts`; registry has no wallet exit. |
| D5 Bounded admin setters/events | **1 / 1** | **4/4 setter groups**: committer owner/event/zero-disable (registry:93–95), lower-only wallet cap/boolean host switch (`trade-admin.ts:34–65`), bounded finite monitoring schema (`obs/launch.ts:5–12`, HTTP `launch-monitoring.ts:22–64`) with audit. Fresh suites pass. |
| D6 Reproducible deploy scripts / ownership | **1 / 1** | `DeployReceiptsRegistry.s.sol:13–19` explicit nonzero/distinct roles; `testDeployUsesEnvironmentRolesAndRejectsInvalidRoles` passes in fresh Forge. Pinned build-record gate, Foundry/Docker frozen inputs and bundle-reproduction/root role checks; handoff not executed by grader. |
| D7 Post-deploy bytecode/config verifier | **1.5 / 1.5** | Prelaunch registry code/hash/owner/pendingOwner/committer verifier (`packages/chain/src/verify.ts:94–119`) and passing chain tests. **2/2 live roles** accepted by fresh staging verifier; current 23976fc→51f0ebd runtime equivalence established above. |
| D8 Configured monitoring/response | **0 / 1** | `SECURITY.md:237–251`, `infra/monitoring/README.md` explicitly retain pending contacts, receiver provisioning, thresholds and drill acknowledgements. Fixtures/collector implementation do not prove delivery. No hosted Defender configuration. |

Sum **1.5+1.5+1.5+1+1+1+1.5+0 = 9.0**.

### E — Dependencies & supply chain hygiene: 10.0 / 10

| Item | Awarded / available | Evidence and decision |
| --- | ---: | --- |
| E1 Lockfiles / frozen installs | **2 / 2** | Committed pnpm lock covers **16/16 scoped importers** (root + 15 non-UI workspaces); **6/6 CI install sites** frozen across ci/fork/launch-evals; Docker:24 frozen. Fresh install exit 0, lock up to date; invocation flags not printed, no stronger execution claim. No dependency resolution change since previous measurement. |
| E2 Exact security-critical pins | **1.5 / 1.5** | **9/9 scoped declarations**: eight viem 2.56.9, OpenZeppelin Contracts 5.6.1; test MerkleTree 1.0.8 exact too. Current manifest census checked; UI ranges excluded. |
| E3 No reachable High/Critical production-library advisories | **2.5 / 2.5** | Fresh `audit-prod.txt`: no known vulnerabilities, exit 0. CI `pnpm audit --prod --audit-level high` succeeds. Scoped library gates/lock inputs unchanged; no affected Next/React/tRPC/Hono/mcp-remote in production-server scope. fflate override 0.7.5. **0 failures**, 2.5−0=2.5; not image/OS scan. |
| E4 Two install-time controls | **1.5 / 1.5** | **15/15 workspaces** under `pnpm-workspace.yaml:5–7`, esbuild-only allowBuilds plus 4,320-minute release cooldown. Two specified controls; no dependency/lifecycle bypass introduced. |
| E5 Explained forks/vendor source/version | **1 / 1** | Unchanged OZ lock/integrity; forge-std source/version at `contracts/README.md:5–6`, `contracts/lib/forge-std/package.json`; no core-library fork replacement in source diff. Mutation vendor hashes also match. |
| E6 Pinned submodules | **0.5 / 0.5** | **0 gitlinks/submodules**, none→full credit |
| E7 Named runtime/service advisory gates | **1 / 1** | Node22.23.3/pnpm11.5.1 Docker; Foundry1.7.1/solc0.8.26. `docs/security/ADVISORIES.md` and digest-pinned monitoring inventory retained. None of kit's listed affected Bun/Anchor/RISC Zero/SP1/Redis versions present; no new general OS advisory clearance claimed. |

Sum **2+1.5+2.5+1.5+1+0.5+1 = 10.0**.

### F — Repo hygiene & CI: 9.5 / 10

| Item | Awarded / available | Evidence and decision |
| --- | ---: | --- |
| F1 No live secrets tree/history | **3 / 3** | Fresh Gitleaks exit 0/no leaks; supplied hygiene scans. Historical known public test mnemonic/vendor RPC lead triage retained, no confirmed live secret. Narrow `.gitleaks.toml` allowlists unchanged, no blanket exclusion. No full secret copied or real environment values read. Bounded scanner evidence, not universal proof. |
| F2 Env ignored/template | **0.5 / 0.5** | `.gitignore:4–5`, placeholder `.env.example`, Docker environment/key exclusions |
| F3 Build/test CI | **1.5 / 1.5** | CI:3–5,30–34,38–94 covers **15/15 scoped workspace suites**, root gates and production role build. Fresh root/typecheck exit 0 and successful source-equivalent CI jobs. |
| F4 Static analysis all stacks/packages | **1 / 1** | CI:96–145: Slither **1/1 Solidity**, Semgrep **14/14 TS**, including bots and renderer; **15/15=100%**, ≥90%. High / ERROR --error failure settings retained. Supplied `ci.txt` records successful Slither/Semgrep at source-equivalent e00fa56; no local analyzer/raw result invented. |
| F5 Hardened Actions | **1.5 / 1.5** | **29/29 uses** across three workflows SHA-pinned; **8/8 job declarations** default-empty/job contents-read permissions, checkout credentials disabled, no privileged untrusted-code trigger/direct event-run interpolation; checksum-pinned redacted full-history Gitleaks CI:154–176. Static current count verified; matrix instances not confused with declaration count. |
| F6 LICENSE / qualifying SECURITY | **0.5 / 1** | LICENSE earns 0.5; SECURITY accepted-risk list exists, but :17–22 still explicitly requires confirmation of mailbox/private advisories. Contact half remains unearned. |
| F7 Deterministic toolchain/build | **1 / 1** | **2/2 stacks**: authored exact pragma, Foundry solc/optimizer/viaIR/Cancun/metadata pins; Node engines/pnpm packageManager; Docker both stages fixed tag/digest. Passing deterministic bundle/root checks; no identical OCI-layer claim. |
| F8 Developer-environment hygiene | **0.5 / 0.5** | Fresh hygiene Unicode/dev-config sections clear; tracked scoped configuration baseline unchanged, no auto-approved shell/network or suspect extension. No unrelated/global scan. |

Sum **3+0.5+1.5+1+1.5+0.5+1+0.5 = 9.5**.

### G — Docs, spec & threat model: 10.0 / 10

| Item | Awarded / available | Evidence and decision |
| --- | ---: | --- |
| G1 Fresh-clone purpose/build/test/deploy | **1.5 / 1.5** | README purpose/frozen install/typecheck/test/build; contracts README deploy/role/hardware handoff; Railway runbook reproduction/deploy commands. Retained product limitations are not live-capability proof. |
| G2 Architecture/actors/trust/dependencies | **1.5 / 1.5** | BACKEND §§1–2,18; Overview; SECURITY role/custody matrix: user wallet, owner/committer, host/DB/model/router/provider assumptions; Railway proxy/identity runbook. Relevant docs/source unchanged. |
| G3 Invariants linked to tests | **2 / 2** | `docs/security/INVARIANTS.md` maps auth/crypto/receipts/canonical/policy and private mixed-batch, selected-reference, configured-token regressions (:43–48) to current tests. Required ledger proof read; fresh root suites pass. Missing live acceptance disclosed. |
| G4 Threat model / honest boundaries | **1.5 / 1.5** | OVERVIEW §13; SECURITY powers/planned features/incident limits, launch evidence and COVERAGE/FORK-TESTS/MUTATION caveats. No newly committed x-ray output assumed. |
| G5 External-function documentation | **1 / 1** | `docs/security/EXTERNAL-SURFACE.md:108` generated **512/512 documented**; fresh root gate:3 recomputes attachment/staleness successfully. Removing 56 constructors and 4 event/error declarations leaves **452/452 callable functions/methods/getters**, also 100%. Auth/execution/OAuth/indexer/collectors/bots and effective inherited ownership included; ≥90%. `getItem` and proxy trust comments inspected. No all-export/core-boundary conflation. |
| G6 Addresses/explorer/build record / prelaunch | **1 / 1** | EKO registry undeployed/TODO, prelaunch clause earns credit; current release build record/verifier. Railway live revision/bundle/config identities recorded. No explorer link fabricated for an undeployed contract. |
| G7 Audit history | **1 / 1** | Prior committed REPORT/SCOPE/findings/history; full 61849fb and rescores 8678676/0de26eb recorded today. This new report does not earn its own retrospective-history point. |
| G8 Scope file list / frozen commit | **0.5 / 0.5** | Current report's non-UI source file inventory frozen at **51f0ebd**, exact core census and explicit scope/exclusions. Existing SCOPE.md retained as historical base evidence, not mislabeled current. |

Sum **1.5+1.5+2+1.5+1+1+1+0.5 = 10.0**.

---
AI audit grade — a strong pre-audit signal, not a substitute for a human audit before large TVL.
