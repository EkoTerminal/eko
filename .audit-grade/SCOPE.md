# Frozen review scope — 2026-10-03

Source candidate: `c5c048a456af52c7a0787ee4450cd9e4514be9e7` plus uncommitted evidence-maintenance changes.
This record refreshes the current non-UI source inventory; it does not create a
commit or tag, rescore the candidate, or claim a new full audit. The report,
[findings.tsv](findings.tsv) and [history.tsv](history.tsv) retain their original
contents. Historical review provenance is reproduced below unchanged.

## Current scope

Fifteen in-scope workspaces: `contracts`; `apps/{server,indexer,engines,mcp,bots,og-renderer}`;
`packages/{shared,chain,db,policy,playbooks,signal,untrusted,receipts-verifier}`.
Root build/install configuration supplies the sixteenth scoped importer.
Protocol: receipt commitments, unsigned AMM/Pons/v4 preparation, noncustodial
agent/harness authentication and private journals, ingest/analytics, advisory AI,
bots, monitoring, deployment and supply chain. Renderer server security and
emitted disclosures are included. UI, UI tests/dependencies/CI, visual design,
brand-video implementation, personal identity and vendor code are excluded.
There is no implemented Solana, ZK, FHE, TEE, lending, perp or user-fund vault.

### Frozen current file inventory

The 424 tracked source paths below freeze the current broad core, non-UI
inventory, not the executable-line coverage denominator or a claim that every
line was manually reviewed. Selection: tracked existing files beneath the
fifteen workspace `src/` directories with `.ts`, `.mjs` or `.sol` extensions,
sorted by repository-relative path (the report’s source-code selection).
Tests, configs, scripts, deployment evidence and read-only specs are review
context outside this source list. Source fixtures, re-exports, generated probe
runtime, schemas/interfaces and internal helpers do not inflate executable-line
or external-mutation denominators.

<details>
<summary>424 source paths at c5c048a plus evidence-maintenance changes</summary>

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
apps/engines/src/guard-performance.ts
apps/engines/src/identity-v2.ts
apps/engines/src/incremental-guard.ts
apps/engines/src/index.ts
apps/engines/src/label-completion-cli.ts
apps/engines/src/label-completion.ts
apps/engines/src/lot-arithmetic.ts
apps/engines/src/lot-input.ts
apps/engines/src/lot-metrics.ts
apps/engines/src/lot-selling.ts
apps/engines/src/market.ts
apps/engines/src/matched-source.ts
apps/engines/src/metrics.ts
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
apps/og-renderer/src/og-assets/worker.mjs
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

## Historical review context

The following Scope section is reproduced exactly from the 2026-10-02 review
record for source `94495af646eb03a35eabb0e22e5892f6e82427df`; its workspace count
and tool outcomes describe that historical candidate. Raw run output belongs
under ignored `.audit-grade/runs/`. Relative run links require separately
retained evidence and may not resolve in a clean checkout. This historical
context does not assert current execution or close current findings.

## Scope (verbatim report section)

EVM append-only receipts registry; TypeScript API/authentication, keys/private journal, unsigned swap preparation, indexer/analytics, receipt signer, advisory policy/agent/MCP scaffolding, supply chain and deployment readiness. Protocol patterns: AMM/DEX routing, Pons launchpad integration, payments/receipts and agent-wallet boundaries; future implementations excluded. No implemented Solana, ZK, FHE, TEE, custodial vault, lending or perp code. The TEE detector matched ordinary quote retries in excluded UI; the tee-oracle lane reviewed actual pricing/receipt trust chains instead.

Twelve in-scope workspaces: `apps/{server,indexer,engines,mcp}`, `packages/{shared,chain,db,policy,playbooks,signal,untrusted}`, `contracts`; root build/install configuration is a thirteenth lockfile importer. UI, UI tests/dependencies/CI, brand video assets and founder identity are excluded from findings, points, caps and remediation. Vendor library/test code supplies dependency context and scanner triage, not extra deployed EKO contracts. The simulation probe is never deployed. Read-only specs were not edited.

| Completed lane | Files/areas in scope; lane report under `runs/20261002-154053/lanes/` |
| --- | --- |
| contracts-pashov | All `contracts/src` (one contract), script/test/config, OZ ownership/Merkle paths, receipt encoding; `contracts-pashov.md`; three serial passes with twelve role lenses, not twelve spawned reviewers per pass |
| evm-stack | Registry, `packages/chain/src`, undeployed probe, indexer attribution and engine simulation callers; `evm-stack.md` |
| offchain-backend | `apps/server/src`, MCP transport/runtime, journal/receipts, indexer/engine CLI, corresponding tests; `offchain-backend.md` |
| tee-oracle | Indexer price/event provenance, analytical consumers, receipt signer and registry boundaries; `tee-oracle.md` |
| ai-agents | MCP tools/runtime/auth, harness service/journal, policy/untrusted, AI/provider boundaries and production consumers; `ai-agents.md` |
| repo-hygiene | Historical scanner hits, manifests, docs, authority inventory, developer environment; `repo-hygiene.md` |
| supply-chain-ci | Scoped importers/lockfile, Docker/infra, tooling/CI/install controls/vendor provenance; `supply-chain-ci.md` |
| studio-policy | Non-UI claims/specs, registry/deployer/config, custody/exit/upgrade boundaries; `studio-policy.md` |
| deploy-verification | Registry/YAML/check scripts, build configs, Railway/monitoring and release documentation; `deploy-verification.md` |

The grader independently re-read both Medium execution paths and named awarded evidence. Raw tool findings were not promoted automatically. Confidence is **moderate**: useful local test and source evidence, but no broad advisory/static/mutation scans, no production load measurements and no live dependency/deployment checks. Some lane commands ran against installed checkout dependencies rather than a documented isolated copy; this does not meet the kit's Step 3 isolation procedure. No new installs, tests, RPC calls, secret reads or deployments were made by the grader, and this provenance limitation is retained.

| Tool/check | Result | Output relative to `runs/20261002-154053/` |
| --- | --- | --- |
| Kit stack/hygiene/studio scripts | Ran; detector hints triaged, not treated as findings | `stack.txt`, `hygiene.txt`, `studio.txt` |
| Gitleaks history | Ran; 13 candidates, 12 in scope dismissed as source/fixture false positives; one UI candidate excluded | `gitleaks.txt`, redacted `gitleaks.json`; dispositions in hygiene lane |
| Frozen pnpm install | Exit 0; lockfile up to date; pnpm 11.5.1 | `install.txt` |
| Forge registry tests | Exit 0; 33 pass, 1 RPC fork skip; three fuzz tests ×1,000 runs; four invariants ×16,384 calls | `forge-test.txt` |
| Recursive pnpm tests, twice | Exit 1; shutdown timeout persists; all completed scoped packages otherwise pass in second run | `pnpm-test.txt`, `pnpm-test-all.txt` |
| Isolated engines reruns | One failing run, two passing runs | `engines-isolated.txt` |
| Registry coverage / probe tests | 17/17 production registry lines; probe 16 pass | `lanes/evm-stack-artifacts/coverage.txt`, `probe-tests.txt` |
| Focused lane tests | 594 agent/policy/untrusted/server tests, 11 indexer client tests, 8 committer tests pass; synthetic/local dependencies | `lanes/ai-agents-*-tests.txt`, `tee-oracle-clients-test.txt`, `tee-oracle-receipts-test.txt` |
| Exploratory pricing PoCs | **Not passing evidence**: syntax failure in offchain-named script; precision-equality assertion failure in oracle script; confirmation uses the source trace and existing tests | `lanes/offchain-backend-poc.txt`, `tee-oracle-poc.txt` |
| Slither, Aderyn, Semgrep/CodeQL | Could not run in this environment; unavailable | None; `lanes/evm-stack-artifacts/tool-availability.txt` and lane limitations |
| OSV scanner, TruffleHog, zizmor, actionlint | Could not run in this environment; unavailable; no repository Actions to inspect | None; supply-chain/hygiene lane limitations |
| Echidna/Medusa, mutation tools, Halmos | Could not run in this environment; unavailable; Forge handler invariants are separate evidence | None; EVM lane/tool-availability notes |
| Full build/typecheck, advisory/image scans, live RPC/fork checks | No successful same-candidate result supplied; not newly executed | None; no credit inferred |
