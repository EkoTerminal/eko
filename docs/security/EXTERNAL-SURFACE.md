# Implemented external core surface

This is the documentation census for rubric G, REPORT.md “Path to 9/10”, item 2.
It describes checked-in implementations, not a rescore or deployment verification.
Source of scope: [.audit-grade/SCOPE.md](../../.audit-grade/SCOPE.md).
Security context: [privileged powers](../../SECURITY.md#privileged-powers) and
[implemented invariants](INVARIANTS.md). Spec basis: FACTS §7 and BACKEND §§3.5,
4, 8–9, 12–16, 18, 21.4. Existing implementation/spec gaps remain as written;
this task changes documentation and its gate, not those behaviors.

## Denominator rule

Count one implemented callable declaration at its source, including explicit
constructors, public/static class methods and accessors, exported functions and
function-valued exports, exported lifecycle adapter object methods, and callable
APIs returned by the receipt codecs/indexer client/app factory. Count overload
implementations once, not type signatures. Anonymous route callbacks belong to
their documented exported route registrar, rather than adding one count for each
registration/callback. MCP tool invocation validation belongs to ToolRegistry's
registration boundary; injected application handlers are not additional exports.

For Solidity, count every authored external/public function, generated public
state getter, constructor, event and custom error in contracts/src. Also count
all five effective inherited public ownership functions once at their locked
OpenZeppelin implementation (exclude the superseded single-step transfer).
Inherited function NatSpec is supplemented by the registry's local
`@custom:ownership-*` documentation of parameters, role checks, failures,
returns, events and irreversible renunciation. Inherited events/errors are
listed separately below; vendor declarations are not edited or used to inflate
the authored event/error denominator.

For TypeScript, the reviewed trust-boundary modules are explicitly enumerated
in [check-doc-surface.mjs](../../scripts/check-doc-surface.mjs). They cover:

- HTTP authentication/session/demo and account/agent/private journal routes;
  owner-scoped lifecycle/key/journal services and entitlement projection.
- Core route registration (including public read, receipt, RPC, monitoring and
  admin endpoints), flag/incident/measurement services and backup/restore APIs.
- Trading access/sanctions, unsigned route/order preparation, wallet-reported
  submission/reconciliation, retained quote ownership and portfolio APIs.
- Policy/preflight/repeat/actual-account decisions and hashes, Guard scoring,
  verdict assembly and untrusted text ingress.
- Receipt publication/outbox/commit lease/anchor/proof/reveal APIs, returned
  codec operations, journal authenticated crypto and destruction ledger.
- MCP transport, tool registration/invocation/visibility, shared throttling,
  prepared OAuth discovery/registration, fresh-SIWE consent and rotating token
  lifecycle, cached preflight/journal tools, runtime and process lifecycle.
  Production OAuth activation remains gated on deployed connector acceptance.
- Role selection/lease/child launch; indexer head/log/backfill/registry/enrichment
  and scan-acquisition entry points; engine worker/replay/scan, receipt worker
  and coverage-pilot entry points, and their returned RPC acquisition APIs.
- Metered security/control/custody collectors, public share metadata/PNG routes,
  Telegram linking/delivery and group records, and default-disabled X/Farcaster
  platform seams with durable deduplication and quota boundaries.
- REST flow/Census snapshot publication and precision gates, MCP unavailable
  Census projection, Scoreboard coverage/correction/cohort reads, and Swarm
  funnel/cache, budgeted inference, paper accounting and calibration boundaries.

Exclude UI and UI tests/dependencies (the grade's express scope exclusion),
tests/fixtures, generated/build artifacts/ABI data, declaration-only interfaces,
schemas/constants, re-exports (count the implementation once), CLI/module
bootstrap statements that delegate to documented callable APIs, private/protected
methods and internal analytical/persistence/formatting/scheduling helpers. The
explicit excluded-name set identifies exported internal converters/wiring and
error containers; exports alone do not make these a caller trust boundary.
Decoder, source/card/metric/lot math and other engine/indexer internals sit behind
the documented worker entry points. Pure boundary decisions/crypto/proof APIs
remain counted despite performing no I/O. New boundary modules must be added to
the script's reviewed module list; newly declared callables in listed modules
are discovered automatically. This is a bounded source scanner, not a general
TypeScript compiler; maintain its syntax fixtures when introducing new forms.

A TS entry is documented only with an attached `/** ... */` comment. Authored
Solidity entries require attached NatSpec with both `@notice` and `@dev`;
parameters/returns and failure details are reviewed in the source, not inferred
from tag presence. Inherited functions require their existing `@dev` plus local
ownership supplements. The percentage measures comment attachment; accuracy and
completeness require reading implementation, as performed for these comments.

## Recompute and enforce

Run `node scripts/check-doc-surface.mjs` (also in root `pnpm test`). It discovers
source declarations, checks attachment, recomputes coverage and fails below 90%.
It also fails if this recorded table, its file:line references or measurement
are stale. After reviewing a source change, refresh only the generated section
with `node scripts/check-doc-surface.mjs --write`. The dependency-free script
uses Node built-ins and runs declaration/comment-attachment fixtures on every run.

No commit was created here; the lead must commit the census, source comments,
script, package test wiring and metadata-only release-record refresh together.
NatSpec changes source metadata under the existing IPFS/CBOR compiler settings.
The documented [build-record flow](../../contracts/README.md#registry-owner-handoff-before-mainnet)
permits deliberate `--write` after review. Executable creation/runtime bytes
excluding the CBOR trailer must remain identical; only full-bytecode hashes
are refreshed, without changing release settings or record semantics.

## Inherited events and errors (context, outside the authored declaration count)

| Declaration | Locked source | Doc comment | Local documentation |
| --- | --- | --- | --- |
| OwnershipTransferred(previousOwner,newOwner) | contracts/node_modules/@openzeppelin/contracts/access/Ownable.sol:33 | No vendor comment | Registry `@custom:ownership-events`: completed assignment on construction/acceptance/renunciation; both addresses indexed. |
| OwnershipTransferStarted(previousOwner,newOwner) | contracts/node_modules/@openzeppelin/contracts/access/Ownable2Step.sol:28 | No vendor comment | Registry `@custom:ownership-events`: proposal/replacement/cancellation; current and pending owner indexed. |
| OwnableUnauthorizedAccount(account) | contracts/node_modules/@openzeppelin/contracts/access/Ownable.sol:26 | Yes (`@dev`) | Registry `@custom:ownership-errors`: rejected owner/pending-owner caller. |
| OwnableInvalidOwner(owner) | contracts/node_modules/@openzeppelin/contracts/access/Ownable.sol:31 | Yes (`@dev`) | Registry `@custom:ownership-errors`: zero initial owner; effective two-step cancellation permits zero pending owner. |

<!-- generated census: node scripts/check-doc-surface.mjs --write -->

Measured: **591/591 (100.00%)** documented. Minimum: **90%**.

| Entry | Kind | Source (file:line) | Doc comment |
| --- | --- | --- | --- |
| `summonEnabled` | function | [apps/bots/src/farcaster/handler.ts:14](../../apps/bots/src/farcaster/handler.ts#L14) | Yes |
| `FarcasterHandler.constructor` | constructor | [apps/bots/src/farcaster/handler.ts:36](../../apps/bots/src/farcaster/handler.ts#L36) | Yes |
| `FarcasterHandler.receive` | method | [apps/bots/src/farcaster/handler.ts:53](../../apps/bots/src/farcaster/handler.ts#L53) | Yes |
| `farcasterCard` | function | [apps/bots/src/farcaster/images.ts:8](../../apps/bots/src/farcaster/images.ts#L8) | Yes |
| `validFarcasterImage` | function | [apps/bots/src/farcaster/images.ts:28](../../apps/bots/src/farcaster/images.ts#L28) | Yes |
| `farcasterImages` | function | [apps/bots/src/farcaster/images.ts:40](../../apps/bots/src/farcaster/images.ts#L40) | Yes |
| `neynarCastRequest` | function | [apps/bots/src/farcaster/neynar.ts:14](../../apps/bots/src/farcaster/neynar.ts#L14) | Yes |
| `neynarSend` | function | [apps/bots/src/farcaster/neynar.ts:25](../../apps/bots/src/farcaster/neynar.ts#L25) | Yes |
| `FarcasterStore.constructor` | constructor | [apps/bots/src/farcaster/store.ts:11](../../apps/bots/src/farcaster/store.ts#L11) | Yes |
| `FarcasterStore.claim` | method | [apps/bots/src/farcaster/store.ts:17](../../apps/bots/src/farcaster/store.ts#L17) | Yes |
| `FarcasterStore.finish` | method | [apps/bots/src/farcaster/store.ts:44](../../apps/bots/src/farcaster/store.ts#L44) | Yes |
| `NeynarWebhookVerifier.constructor` | constructor | [apps/bots/src/farcaster/verify.ts:20](../../apps/bots/src/farcaster/verify.ts#L20) | Yes |
| `NeynarWebhookVerifier.valid` | method | [apps/bots/src/farcaster/verify.ts:27](../../apps/bots/src/farcaster/verify.ts#L27) | Yes |
| `NeynarWebhookVerifier.parse` | method | [apps/bots/src/farcaster/verify.ts:37](../../apps/bots/src/farcaster/verify.ts#L37) | Yes |
| `farcasterWebhook` | function | [apps/bots/src/farcaster/webhook.ts:6](../../apps/bots/src/farcaster/webhook.ts#L6) | Yes |
| `grammySend` | function | [apps/bots/src/telegram/grammy.ts:9](../../apps/bots/src/telegram/grammy.ts#L9) | Yes |
| `grammyNoticeSend` | function | [apps/bots/src/telegram/grammy.ts:25](../../apps/bots/src/telegram/grammy.ts#L25) | Yes |
| `TelegramHandler.constructor` | constructor | [apps/bots/src/telegram/handler.ts:24](../../apps/bots/src/telegram/handler.ts#L24) | Yes |
| `TelegramHandler.validSecret` | method | [apps/bots/src/telegram/handler.ts:37](../../apps/bots/src/telegram/handler.ts#L37) | Yes |
| `TelegramHandler.receive` | method | [apps/bots/src/telegram/handler.ts:43](../../apps/bots/src/telegram/handler.ts#L43) | Yes |
| `parseIntent` | function | [apps/bots/src/telegram/parse.ts:22](../../apps/bots/src/telegram/parse.ts#L22) | Yes |
| `telegramReadServices` | function | [apps/bots/src/telegram/reads.ts:5](../../apps/bots/src/telegram/reads.ts#L5) | Yes |
| `returned.scan` | method | [apps/bots/src/telegram/reads.ts:13](../../apps/bots/src/telegram/reads.ts#L13) | Yes |
| `TelegramStore.constructor` | constructor | [apps/bots/src/telegram/store.ts:32](../../apps/bots/src/telegram/store.ts#L32) | Yes |
| `TelegramStore.identities` | method | [apps/bots/src/telegram/store.ts:39](../../apps/bots/src/telegram/store.ts#L39) | Yes |
| `TelegramStore.claim` | method | [apps/bots/src/telegram/store.ts:48](../../apps/bots/src/telegram/store.ts#L48) | Yes |
| `TelegramStore.finish` | method | [apps/bots/src/telegram/store.ts:57](../../apps/bots/src/telegram/store.ts#L57) | Yes |
| `TelegramStore.first` | method | [apps/bots/src/telegram/store.ts:65](../../apps/bots/src/telegram/store.ts#L65) | Yes |
| `TelegramStore.appendGrade` | method | [apps/bots/src/telegram/store.ts:80](../../apps/bots/src/telegram/store.ts#L80) | Yes |
| `TelegramStore.gradePending` | method | [apps/bots/src/telegram/store.ts:96](../../apps/bots/src/telegram/store.ts#L96) | Yes |
| `TelegramStore.grade` | method | [apps/bots/src/telegram/store.ts:106](../../apps/bots/src/telegram/store.ts#L106) | Yes |
| `TelegramStore.leaderboard` | method | [apps/bots/src/telegram/store.ts:115](../../apps/bots/src/telegram/store.ts#L115) | Yes |
| `telegramWebhook` | function | [apps/bots/src/telegram/webhook.ts:5](../../apps/bots/src/telegram/webhook.ts#L5) | Yes |
| `XSummonBot.constructor` | constructor | [apps/bots/src/x/handler.ts:41](../../apps/bots/src/x/handler.ts#L41) | Yes |
| `XSummonBot.poll` | method | [apps/bots/src/x/handler.ts:50](../../apps/bots/src/x/handler.ts#L50) | Yes |
| `XBurnPoster.constructor` | constructor | [apps/bots/src/x/handler.ts:104](../../apps/bots/src/x/handler.ts#L104) | Yes |
| `XBurnPoster.post` | method | [apps/bots/src/x/handler.ts:113](../../apps/bots/src/x/handler.ts#L113) | Yes |
| `parseXMention` | function | [apps/bots/src/x/parse.ts:13](../../apps/bots/src/x/parse.ts#L13) | Yes |
| `XStore.constructor` | constructor | [apps/bots/src/x/store.ts:27](../../apps/bots/src/x/store.ts#L27) | Yes |
| `XStore.beginPoll` | method | [apps/bots/src/x/store.ts:61](../../apps/bots/src/x/store.ts#L61) | Yes |
| `XStore.allowed` | method | [apps/bots/src/x/store.ts:74](../../apps/bots/src/x/store.ts#L74) | Yes |
| `XStore.stop` | method | [apps/bots/src/x/store.ts:82](../../apps/bots/src/x/store.ts#L82) | Yes |
| `XStore.settleReads` | method | [apps/bots/src/x/store.ts:88](../../apps/bots/src/x/store.ts#L88) | Yes |
| `XStore.finishPage` | method | [apps/bots/src/x/store.ts:102](../../apps/bots/src/x/store.ts#L102) | Yes |
| `XStore.release` | method | [apps/bots/src/x/store.ts:117](../../apps/bots/src/x/store.ts#L117) | Yes |
| `XStore.claim` | method | [apps/bots/src/x/store.ts:125](../../apps/bots/src/x/store.ts#L125) | Yes |
| `XStore.finish` | method | [apps/bots/src/x/store.ts:146](../../apps/bots/src/x/store.ts#L146) | Yes |
| `XStore.claimBurn` | method | [apps/bots/src/x/store.ts:154](../../apps/bots/src/x/store.ts#L154) | Yes |
| `XStore.finishBurn` | method | [apps/bots/src/x/store.ts:167](../../apps/bots/src/x/store.ts#L167) | Yes |
| `XPlatformError.constructor` | constructor | [apps/bots/src/x/transport.ts:14](../../apps/bots/src/x/transport.ts#L14) | Yes |
| `pilotHash` | function | [apps/engines/src/coverage-pilot.ts:76](../../apps/engines/src/coverage-pilot.ts#L76) | Yes |
| `pilotJobKey` | function | [apps/engines/src/coverage-pilot.ts:83](../../apps/engines/src/coverage-pilot.ts#L83) | Yes |
| `splitPilotLogs` | function | [apps/engines/src/coverage-pilot.ts:112](../../apps/engines/src/coverage-pilot.ts#L112) | Yes |
| `initialPilotCheckpoint` | function | [apps/engines/src/coverage-pilot.ts:136](../../apps/engines/src/coverage-pilot.ts#L136) | Yes |
| `validatePilotCheckpoint` | function | [apps/engines/src/coverage-pilot.ts:157](../../apps/engines/src/coverage-pilot.ts#L157) | Yes |
| `runCoveragePilot` | function | [apps/engines/src/coverage-pilot.ts:189](../../apps/engines/src/coverage-pilot.ts#L189) | Yes |
| `pilotCoverage` | function | [apps/engines/src/coverage-pilot.ts:251](../../apps/engines/src/coverage-pilot.ts#L251) | Yes |
| `pilotReport` | function | [apps/engines/src/coverage-pilot.ts:273](../../apps/engines/src/coverage-pilot.ts#L273) | Yes |
| `commitData` | function | [apps/engines/src/receipts/worker.ts:15](../../apps/engines/src/receipts/worker.ts#L15) | Yes |
| `validateCommitAttempt` | function | [apps/engines/src/receipts/worker.ts:38](../../apps/engines/src/receipts/worker.ts#L38) | Yes |
| `authenticateCommit` | function | [apps/engines/src/receipts/worker.ts:55](../../apps/engines/src/receipts/worker.ts#L55) | Yes |
| `ReceiptWorker.constructor` | constructor | [apps/engines/src/receipts/worker.ts:85](../../apps/engines/src/receipts/worker.ts#L85) | Yes |
| `ReceiptWorker.stop` | method | [apps/engines/src/receipts/worker.ts:93](../../apps/engines/src/receipts/worker.ts#L93) | Yes |
| `ReceiptWorker.tick` | method | [apps/engines/src/receipts/worker.ts:128](../../apps/engines/src/receipts/worker.ts#L128) | Yes |
| `ReceiptWorker.run` | method | [apps/engines/src/receipts/worker.ts:177](../../apps/engines/src/receipts/worker.ts#L177) | Yes |
| `fitMomentum` | function | [apps/engines/src/swarm/calibration.ts:12](../../apps/engines/src/swarm/calibration.ts#L12) | Yes |
| `momentumProbability` | function | [apps/engines/src/swarm/calibration.ts:37](../../apps/engines/src/swarm/calibration.ts#L37) | Yes |
| `calibrationReport` | function | [apps/engines/src/swarm/calibration.ts:43](../../apps/engines/src/swarm/calibration.ts#L43) | Yes |
| `buildSwarmNaiveView` | function | [apps/engines/src/swarm/index.ts:32](../../apps/engines/src/swarm/index.ts#L32) | Yes |
| `swarmSnapshotHash` | function | [apps/engines/src/swarm/index.ts:51](../../apps/engines/src/swarm/index.ts#L51) | Yes |
| `swarmCacheKey` | function | [apps/engines/src/swarm/index.ts:61](../../apps/engines/src/swarm/index.ts#L61) | Yes |
| `evaluateSwarmFunnel` | function | [apps/engines/src/swarm/index.ts:84](../../apps/engines/src/swarm/index.ts#L84) | Yes |
| `swarmFunnelFromCard` | function | [apps/engines/src/swarm/index.ts:100](../../apps/engines/src/swarm/index.ts#L100) | Yes |
| `swarmPrompt` | function | [apps/engines/src/swarm/index.ts:112](../../apps/engines/src/swarm/index.ts#L112) | Yes |
| `refreshCoinFlow` | function | [apps/engines/src/watcher/flow-store.ts:41](../../apps/engines/src/watcher/flow-store.ts#L41) | Yes |
| `refreshFlows` | function | [apps/engines/src/watcher/flow-store.ts:77](../../apps/engines/src/watcher/flow-store.ts#L77) | Yes |
| `refreshCensus` | function | [apps/engines/src/watcher/flow-store.ts:95](../../apps/engines/src/watcher/flow-store.ts#L95) | Yes |
| `retryAfterBlocks` | function | [apps/engines/src/worker.ts:17](../../apps/engines/src/worker.ts#L17) | Yes |
| `EngineWorker.telemetry` | method | [apps/engines/src/worker.ts:90](../../apps/engines/src/worker.ts#L90) | Yes |
| `EngineWorker.summary` | method | [apps/engines/src/worker.ts:99](../../apps/engines/src/worker.ts#L99) | Yes |
| `EngineWorker.constructor` | constructor | [apps/engines/src/worker.ts:118](../../apps/engines/src/worker.ts#L118) | Yes |
| `EngineWorker.stop` | method | [apps/engines/src/worker.ts:131](../../apps/engines/src/worker.ts#L131) | Yes |
| `EngineWorker.replay` | method | [apps/engines/src/worker.ts:139](../../apps/engines/src/worker.ts#L139) | Yes |
| `EngineWorker.poll` | method | [apps/engines/src/worker.ts:174](../../apps/engines/src/worker.ts#L174) | Yes |
| `EngineWorker.processScanJobs` | method | [apps/engines/src/worker.ts:211](../../apps/engines/src/worker.ts#L211) | Yes |
| `EngineWorker.run` | method | [apps/engines/src/worker.ts:455](../../apps/engines/src/worker.ts#L455) | Yes |
| `EngineWorker.processBlock` | method | [apps/engines/src/worker.ts:480](../../apps/engines/src/worker.ts#L480) | Yes |
| `validateWalletEventProfile` | function | [apps/indexer/src/agent-registry.ts:27](../../apps/indexer/src/agent-registry.ts#L27) | Yes |
| `AgentRegistryCollector.constructor` | constructor | [apps/indexer/src/agent-registry.ts:46](../../apps/indexer/src/agent-registry.ts#L46) | Yes |
| `AgentRegistryCollector.stop` | method | [apps/indexer/src/agent-registry.ts:56](../../apps/indexer/src/agent-registry.ts#L56) | Yes |
| `AgentRegistryCollector.reconcile` | method | [apps/indexer/src/agent-registry.ts:66](../../apps/indexer/src/agent-registry.ts#L66) | Yes |
| `AgentRegistryCollector.scan` | method | [apps/indexer/src/agent-registry.ts:91](../../apps/indexer/src/agent-registry.ts#L91) | Yes |
| `AgentRegistryCollector.snapshot` | method | [apps/indexer/src/agent-registry.ts:176](../../apps/indexer/src/agent-registry.ts#L176) | Yes |
| `AgentRegistryCollector.poll` | method | [apps/indexer/src/agent-registry.ts:200](../../apps/indexer/src/agent-registry.ts#L200) | Yes |
| `AgentRegistryCollector.coverage` | method | [apps/indexer/src/agent-registry.ts:212](../../apps/indexer/src/agent-registry.ts#L212) | Yes |
| `RangeLeases.constructor` | constructor | [apps/indexer/src/backfill.ts:31](../../apps/indexer/src/backfill.ts#L31) | Yes |
| `RangeLeases.seed` | method | [apps/indexer/src/backfill.ts:38](../../apps/indexer/src/backfill.ts#L38) | Yes |
| `RangeLeases.claim` | method | [apps/indexer/src/backfill.ts:66](../../apps/indexer/src/backfill.ts#L66) | Yes |
| `RangeLeases.renew` | method | [apps/indexer/src/backfill.ts:80](../../apps/indexer/src/backfill.ts#L80) | Yes |
| `RangeLeases.finish` | method | [apps/indexer/src/backfill.ts:91](../../apps/indexer/src/backfill.ts#L91) | Yes |
| `RangeLeases.fail` | method | [apps/indexer/src/backfill.ts:102](../../apps/indexer/src/backfill.ts#L102) | Yes |
| `PonsBackfill.constructor` | constructor | [apps/indexer/src/backfill.ts:125](../../apps/indexer/src/backfill.ts#L125) | Yes |
| `PonsBackfill.stop` | method | [apps/indexer/src/backfill.ts:132](../../apps/indexer/src/backfill.ts#L132) | Yes |
| `PonsBackfill.run` | method | [apps/indexer/src/backfill.ts:141](../../apps/indexer/src/backfill.ts#L141) | Yes |
| `blockAtTime` | function | [apps/indexer/src/backfill.ts:334](../../apps/indexer/src/backfill.ts#L334) | Yes |
| `createClients` | function | [apps/indexer/src/clients.ts:19](../../apps/indexer/src/clients.ts#L19) | Yes |
| `returned.tokenMetadataBatch` | method | [apps/indexer/src/clients.ts:55](../../apps/indexer/src/clients.ts#L55) | Yes |
| `returned.rpcStopped` | method | [apps/indexer/src/clients.ts:74](../../apps/indexer/src/clients.ts#L74) | Yes |
| `returned.paidExhausted` | method | [apps/indexer/src/clients.ts:81](../../apps/indexer/src/clients.ts#L81) | Yes |
| `returned.rpcTiming` | method | [apps/indexer/src/clients.ts:88](../../apps/indexer/src/clients.ts#L88) | Yes |
| `returned.chainId` | method | [apps/indexer/src/clients.ts:95](../../apps/indexer/src/clients.ts#L95) | Yes |
| `returned.head` | method | [apps/indexer/src/clients.ts:101](../../apps/indexer/src/clients.ts#L101) | Yes |
| `returned.block` | method | [apps/indexer/src/clients.ts:109](../../apps/indexer/src/clients.ts#L109) | Yes |
| `returned.header` | method | [apps/indexer/src/clients.ts:116](../../apps/indexer/src/clients.ts#L116) | Yes |
| `returned.parentHeader` | method | [apps/indexer/src/clients.ts:123](../../apps/indexer/src/clients.ts#L123) | Yes |
| `returned.timestampHeader` | method | [apps/indexer/src/clients.ts:130](../../apps/indexer/src/clients.ts#L130) | Yes |
| `returned.receipts` | method | [apps/indexer/src/clients.ts:138](../../apps/indexer/src/clients.ts#L138) | Yes |
| `returned.logs` | method | [apps/indexer/src/clients.ts:146](../../apps/indexer/src/clients.ts#L146) | Yes |
| `returned.timestampLogs` | method | [apps/indexer/src/clients.ts:158](../../apps/indexer/src/clients.ts#L158) | Yes |
| `returned.code` | method | [apps/indexer/src/clients.ts:165](../../apps/indexer/src/clients.ts#L165) | Yes |
| `returned.tokenMetadata` | method | [apps/indexer/src/clients.ts:173](../../apps/indexer/src/clients.ts#L173) | Yes |
| `returned.agentWallets` | method | [apps/indexer/src/clients.ts:182](../../apps/indexer/src/clients.ts#L182) | Yes |
| `returned.ethUsdRate` | method | [apps/indexer/src/clients.ts:205](../../apps/indexer/src/clients.ts#L205) | Yes |
| `returned.v3Pool` | method | [apps/indexer/src/clients.ts:248](../../apps/indexer/src/clients.ts#L248) | Yes |
| `returned.watch` | method | [apps/indexer/src/clients.ts:274](../../apps/indexer/src/clients.ts#L274) | Yes |
| `enrichSenders` | function | [apps/indexer/src/enrich.ts:23](../../apps/indexer/src/enrich.ts#L23) | Yes |
| `HeadFollower.constructor` | constructor | [apps/indexer/src/head.ts:75](../../apps/indexer/src/head.ts#L75) | Yes |
| `HeadFollower.assertChain` | method | [apps/indexer/src/head.ts:85](../../apps/indexer/src/head.ts#L85) | Yes |
| `HeadFollower.stop` | method | [apps/indexer/src/head.ts:92](../../apps/indexer/src/head.ts#L92) | Yes |
| `HeadFollower.rollback` | method | [apps/indexer/src/head.ts:101](../../apps/indexer/src/head.ts#L101) | Yes |
| `HeadFollower.ingest` | method | [apps/indexer/src/head.ts:125](../../apps/indexer/src/head.ts#L125) | Yes |
| `HeadFollower.run` | method | [apps/indexer/src/head.ts:152](../../apps/indexer/src/head.ts#L152) | Yes |
| `LogHeadFollower.constructor` | constructor | [apps/indexer/src/log-head.ts:89](../../apps/indexer/src/log-head.ts#L89) | Yes |
| `LogHeadFollower.stop` | method | [apps/indexer/src/log-head.ts:105](../../apps/indexer/src/log-head.ts#L105) | Yes |
| `LogHeadFollower.rollback` | method | [apps/indexer/src/log-head.ts:125](../../apps/indexer/src/log-head.ts#L125) | Yes |
| `LogHeadFollower.tick` | method | [apps/indexer/src/log-head.ts:176](../../apps/indexer/src/log-head.ts#L176) | Yes |
| `LogHeadFollower.run` | method | [apps/indexer/src/log-head.ts:592](../../apps/indexer/src/log-head.ts#L592) | Yes |
| `acquireScanJob` | function | [apps/indexer/src/scan-jobs.ts:13](../../apps/indexer/src/scan-jobs.ts#L13) | Yes |
| `buildMcpApp` | function | [apps/mcp/src/app.ts:58](../../apps/mcp/src/app.ts#L58) | Yes |
| `registerHarnessTools` | function | [apps/mcp/src/harness.ts:10](../../apps/mcp/src/harness.ts#L10) | Yes |
| `SqlRateLimits.constructor` | constructor | [apps/mcp/src/limits.ts:16](../../apps/mcp/src/limits.ts#L16) | Yes |
| `SqlRateLimits.consume` | method | [apps/mcp/src/limits.ts:24](../../apps/mcp/src/limits.ts#L24) | Yes |
| `SqlRateLimits.prune` | method | [apps/mcp/src/limits.ts:43](../../apps/mcp/src/limits.ts#L43) | Yes |
| `OAuthDiscovery.constructor` | constructor | [apps/mcp/src/oauth.ts:59](../../apps/mcp/src/oauth.ts#L59) | Yes |
| `OAuthDiscovery.protectedResource` | method | [apps/mcp/src/oauth.ts:89](../../apps/mcp/src/oauth.ts#L89) | Yes |
| `OAuthDiscovery.authorizationServer` | method | [apps/mcp/src/oauth.ts:100](../../apps/mcp/src/oauth.ts#L100) | Yes |
| `OAuthDiscovery.registrationLimit` | method | [apps/mcp/src/oauth.ts:123](../../apps/mcp/src/oauth.ts#L123) | Yes |
| `OAuthDiscovery.register` | method | [apps/mcp/src/oauth.ts:144](../../apps/mcp/src/oauth.ts#L144) | Yes |
| `OAuthDiscovery.authorize` | method | [apps/mcp/src/oauth.ts:165](../../apps/mcp/src/oauth.ts#L165) | Yes |
| `OAuthDiscovery.request` | method | [apps/mcp/src/oauth.ts:222](../../apps/mcp/src/oauth.ts#L222) | Yes |
| `OAuthDiscovery.prune` | method | [apps/mcp/src/oauth.ts:233](../../apps/mcp/src/oauth.ts#L233) | Yes |
| `pruneOAuthDiscovery` | function | [apps/mcp/src/oauth.ts:246](../../apps/mcp/src/oauth.ts#L246) | Yes |
| `registerReadTools` | function | [apps/mcp/src/read-tools.ts:10](../../apps/mcp/src/read-tools.ts#L10) | Yes |
| `mcpConfig` | function | [apps/mcp/src/runtime.ts:32](../../apps/mcp/src/runtime.ts#L32) | Yes |
| `mcpLogger` | function | [apps/mcp/src/runtime.ts:69](../../apps/mcp/src/runtime.ts#L69) | Yes |
| `createMcpRuntime` | function | [apps/mcp/src/runtime.ts:84](../../apps/mcp/src/runtime.ts#L84) | Yes |
| `runMcpProcess` | function | [apps/mcp/src/runtime.ts:140](../../apps/mcp/src/runtime.ts#L140) | Yes |
| `portableSchema` | function | [apps/mcp/src/tools.ts:66](../../apps/mcp/src/tools.ts#L66) | Yes |
| `toolSchemas` | function | [apps/mcp/src/tools.ts:84](../../apps/mcp/src/tools.ts#L84) | Yes |
| `modelText` | function | [apps/mcp/src/tools.ts:102](../../apps/mcp/src/tools.ts#L102) | Yes |
| `ToolRegistry.register` | method | [apps/mcp/src/tools.ts:139](../../apps/mcp/src/tools.ts#L139) | Yes |
| `ToolRegistry.visible` | method | [apps/mcp/src/tools.ts:161](../../apps/mcp/src/tools.ts#L161) | Yes |
| `loadSwarmConfig` | function | [apps/server/src/ai/swarm-worker.ts:25](../../apps/server/src/ai/swarm-worker.ts#L25) | Yes |
| `swarmInterval` | function | [apps/server/src/ai/swarm-worker.ts:43](../../apps/server/src/ai/swarm-worker.ts#L43) | Yes |
| `SwarmWorker.constructor` | constructor | [apps/server/src/ai/swarm-worker.ts:59](../../apps/server/src/ai/swarm-worker.ts#L59) | Yes |
| `SwarmWorker.enqueue` | method | [apps/server/src/ai/swarm-worker.ts:79](../../apps/server/src/ai/swarm-worker.ts#L79) | Yes |
| `SwarmWorker.recoverInterrupted` | method | [apps/server/src/ai/swarm-worker.ts:99](../../apps/server/src/ai/swarm-worker.ts#L99) | Yes |
| `SwarmWorker.drain` | method | [apps/server/src/ai/swarm-worker.ts:109](../../apps/server/src/ai/swarm-worker.ts#L109) | Yes |
| `SwarmWorker.runNext` | method | [apps/server/src/ai/swarm-worker.ts:120](../../apps/server/src/ai/swarm-worker.ts#L120) | Yes |
| `SwarmWorker.outcomeWindow` | method | [apps/server/src/ai/swarm-worker.ts:247](../../apps/server/src/ai/swarm-worker.ts#L247) | Yes |
| `buildApp` | function | [apps/server/src/app.ts:112](../../apps/server/src/app.ts#L112) | Yes |
| `returned.close` | method | [apps/server/src/app.ts:362](../../apps/server/src/app.ts#L362) | Yes |
| `ActualOrderService.constructor` | constructor | [apps/server/src/exec/actual-order.ts:45](../../apps/server/src/exec/actual-order.ts#L45) | Yes |
| `ActualOrderService.lookup` | method | [apps/server/src/exec/actual-order.ts:64](../../apps/server/src/exec/actual-order.ts#L64) | Yes |
| `ActualOrderService.prepare` | method | [apps/server/src/exec/actual-order.ts:92](../../apps/server/src/exec/actual-order.ts#L92) | Yes |
| `ActualOrderService.revalidate` | method | [apps/server/src/exec/actual-order.ts:106](../../apps/server/src/exec/actual-order.ts#L106) | Yes |
| `ActualOrderService.invalidate` | method | [apps/server/src/exec/actual-order.ts:166](../../apps/server/src/exec/actual-order.ts#L166) | Yes |
| `ActualOrderService.drain` | method | [apps/server/src/exec/actual-order.ts:176](../../apps/server/src/exec/actual-order.ts#L176) | Yes |
| `ChainClients.constructor` | constructor | [apps/server/src/exec/chain.ts:44](../../apps/server/src/exec/chain.ts#L44) | Yes |
| `ChainClients.get` | method | [apps/server/src/exec/chain.ts:68](../../apps/server/src/exec/chain.ts#L68) | Yes |
| `ChainClients.checkHealth` | method | [apps/server/src/exec/chain.ts:79](../../apps/server/src/exec/chain.ts#L79) | Yes |
| `ChainClients.healthList` | method | [apps/server/src/exec/chain.ts:108](../../apps/server/src/exec/chain.ts#L108) | Yes |
| `UniswapV3Adapter.constructor` | constructor | [apps/server/src/exec/chain.ts:139](../../apps/server/src/exec/chain.ts#L139) | Yes |
| `UniswapV3Adapter.network` | method | [apps/server/src/exec/chain.ts:152](../../apps/server/src/exec/chain.ts#L152) | Yes |
| `UniswapV3Adapter.route` | method | [apps/server/src/exec/chain.ts:162](../../apps/server/src/exec/chain.ts#L162) | Yes |
| `UniswapV3Adapter.quoteTrade` | method | [apps/server/src/exec/chain.ts:174](../../apps/server/src/exec/chain.ts#L174) | Yes |
| `UniswapV3Adapter.quote` | method | [apps/server/src/exec/chain.ts:189](../../apps/server/src/exec/chain.ts#L189) | Yes |
| `UniswapV3Adapter.parseSwap` | method | [apps/server/src/exec/chain.ts:364](../../apps/server/src/exec/chain.ts#L364) | Yes |
| `UniswapV3Adapter.receipt` | method | [apps/server/src/exec/chain.ts:394](../../apps/server/src/exec/chain.ts#L394) | Yes |
| `UniswapV3Adapter.transaction` | method | [apps/server/src/exec/chain.ts:408](../../apps/server/src/exec/chain.ts#L408) | Yes |
| `cursorOf` | function | [apps/server/src/exec/live-trade.ts:40](../../apps/server/src/exec/live-trade.ts#L40) | Yes |
| `routeTerms` | function | [apps/server/src/exec/live-trade.ts:47](../../apps/server/src/exec/live-trade.ts#L47) | Yes |
| `liveTradeSources` | function | [apps/server/src/exec/live-trade.ts:72](../../apps/server/src/exec/live-trade.ts#L72) | Yes |
| `simulationRpc` | function | [apps/server/src/exec/live-trade.ts:128](../../apps/server/src/exec/live-trade.ts#L128) | Yes |
| `simulationLease` | function | [apps/server/src/exec/live-trade.ts:142](../../apps/server/src/exec/live-trade.ts#L142) | Yes |
| `V3ActualOrderProbe.constructor` | constructor | [apps/server/src/exec/live-trade.ts:229](../../apps/server/src/exec/live-trade.ts#L229) | Yes |
| `V3ActualOrderProbe.observe` | method | [apps/server/src/exec/live-trade.ts:231](../../apps/server/src/exec/live-trade.ts#L231) | Yes |
| `v3PostFillSell` | function | [apps/server/src/exec/live-trade.ts:300](../../apps/server/src/exec/live-trade.ts#L300) | Yes |
| `walletPolicy` | function | [apps/server/src/exec/live-trade.ts:318](../../apps/server/src/exec/live-trade.ts#L318) | Yes |
| `walletAgentId` | function | [apps/server/src/exec/live-trade.ts:320](../../apps/server/src/exec/live-trade.ts#L320) | Yes |
| `readModelVerdicts` | function | [apps/server/src/exec/live-trade.ts:338](../../apps/server/src/exec/live-trade.ts#L338) | Yes |
| `currentVerdictGate` | function | [apps/server/src/exec/live-trade.ts:371](../../apps/server/src/exec/live-trade.ts#L371) | Yes |
| `buyVerdictGateFor` | function | [apps/server/src/exec/live-trade.ts:381](../../apps/server/src/exec/live-trade.ts#L381) | Yes |
| `guardReceiptFor` | function | [apps/server/src/exec/live-trade.ts:387](../../apps/server/src/exec/live-trade.ts#L387) | Yes |
| `v3TradeAcquisition` | function | [apps/server/src/exec/live-trade.ts:398](../../apps/server/src/exec/live-trade.ts#L398) | Yes |
| `returned.quote` | method | [apps/server/src/exec/live-trade.ts:402](../../apps/server/src/exec/live-trade.ts#L402) | Yes |
| `returned.capture` | method | [apps/server/src/exec/live-trade.ts:423](../../apps/server/src/exec/live-trade.ts#L423) | Yes |
| `liveTradeBackend` | function | [apps/server/src/exec/live-trade.ts:461](../../apps/server/src/exec/live-trade.ts#L461) | Yes |
| `ponsGraduationLock` | function | [apps/server/src/exec/pons-graduation.ts:34](../../apps/server/src/exec/pons-graduation.ts#L34) | Yes |
| `indexedPonsCurves` | function | [apps/server/src/exec/pons-routes.ts:50](../../apps/server/src/exec/pons-routes.ts#L50) | Yes |
| `indexedGraduated` | function | [apps/server/src/exec/pons-routes.ts:60](../../apps/server/src/exec/pons-routes.ts#L60) | Yes |
| `PonsHandoff.constructor` | constructor | [apps/server/src/exec/pons-routes.ts:68](../../apps/server/src/exec/pons-routes.ts#L68) | Yes |
| `ponsOpen` | function | [apps/server/src/exec/pons-routes.ts:80](../../apps/server/src/exec/pons-routes.ts#L80) | Yes |
| `readPonsCurve` | function | [apps/server/src/exec/pons-routes.ts:86](../../apps/server/src/exec/pons-routes.ts#L86) | Yes |
| `ponsBuyOut` | function | [apps/server/src/exec/pons-routes.ts:115](../../apps/server/src/exec/pons-routes.ts#L115) | Yes |
| `ponsSellOut` | function | [apps/server/src/exec/pons-routes.ts:121](../../apps/server/src/exec/pons-routes.ts#L121) | Yes |
| `ponsDepthWei` | function | [apps/server/src/exec/pons-routes.ts:135](../../apps/server/src/exec/pons-routes.ts#L135) | Yes |
| `ponsTradeCall` | function | [apps/server/src/exec/pons-routes.ts:143](../../apps/server/src/exec/pons-routes.ts#L143) | Yes |
| `ponsCallTerms` | function | [apps/server/src/exec/pons-routes.ts:147](../../apps/server/src/exec/pons-routes.ts#L147) | Yes |
| `quotePonsTrade` | function | [apps/server/src/exec/pons-routes.ts:172](../../apps/server/src/exec/pons-routes.ts#L172) | Yes |
| `decodePonsFill` | function | [apps/server/src/exec/pons-routes.ts:242](../../apps/server/src/exec/pons-routes.ts#L242) | Yes |
| `ponsFingerprints` | function | [apps/server/src/exec/pons-trade.ts:29](../../apps/server/src/exec/pons-trade.ts#L29) | Yes |
| `PonsActualOrderProbe.constructor` | constructor | [apps/server/src/exec/pons-trade.ts:46](../../apps/server/src/exec/pons-trade.ts#L46) | Yes |
| `PonsActualOrderProbe.observe` | method | [apps/server/src/exec/pons-trade.ts:48](../../apps/server/src/exec/pons-trade.ts#L48) | Yes |
| `ponsPostFillSell` | function | [apps/server/src/exec/pons-trade.ts:104](../../apps/server/src/exec/pons-trade.ts#L104) | Yes |
| `ponsTradeBackend` | function | [apps/server/src/exec/pons-trade.ts:128](../../apps/server/src/exec/pons-trade.ts#L128) | Yes |
| `returned.quote` | method | [apps/server/src/exec/pons-trade.ts:144](../../apps/server/src/exec/pons-trade.ts#L144) | Yes |
| `returned.capture` | method | [apps/server/src/exec/pons-trade.ts:168](../../apps/server/src/exec/pons-trade.ts#L168) | Yes |
| `VenueActualOrderProbe.constructor` | constructor | [apps/server/src/exec/pons-trade.ts:207](../../apps/server/src/exec/pons-trade.ts#L207) | Yes |
| `VenueActualOrderProbe.observe` | method | [apps/server/src/exec/pons-trade.ts:209](../../apps/server/src/exec/pons-trade.ts#L209) | Yes |
| `venueTradeBackend` | function | [apps/server/src/exec/pons-trade.ts:223](../../apps/server/src/exec/pons-trade.ts#L223) | Yes |
| `returned.quote` | method | [apps/server/src/exec/pons-trade.ts:238](../../apps/server/src/exec/pons-trade.ts#L238) | Yes |
| `PortfolioService.constructor` | constructor | [apps/server/src/exec/portfolio.ts:41](../../apps/server/src/exec/portfolio.ts#L41) | Yes |
| `PortfolioService.ensurePaperAccount` | method | [apps/server/src/exec/portfolio.ts:49](../../apps/server/src/exec/portfolio.ts#L49) | Yes |
| `PortfolioService.paperBalances` | method | [apps/server/src/exec/portfolio.ts:59](../../apps/server/src/exec/portfolio.ts#L59) | Yes |
| `PortfolioService.positions` | method | [apps/server/src/exec/portfolio.ts:71](../../apps/server/src/exec/portfolio.ts#L71) | Yes |
| `PortfolioService.fills` | method | [apps/server/src/exec/portfolio.ts:98](../../apps/server/src/exec/portfolio.ts#L98) | Yes |
| `PortfolioService.resetPaper` | method | [apps/server/src/exec/portfolio.ts:128](../../apps/server/src/exec/portfolio.ts#L128) | Yes |
| `accountSpotFill` | function | [apps/server/src/exec/position-accounting.ts:4](../../apps/server/src/exec/position-accounting.ts#L4) | Yes |
| `QuoteStore.constructor` | constructor | [apps/server/src/exec/quotes.ts:19](../../apps/server/src/exec/quotes.ts#L19) | Yes |
| `QuoteStore.newId` | method | [apps/server/src/exec/quotes.ts:29](../../apps/server/src/exec/quotes.ts#L29) | Yes |
| `QuoteStore.put` | method | [apps/server/src/exec/quotes.ts:39](../../apps/server/src/exec/quotes.ts#L39) | Yes |
| `QuoteStore.get` | method | [apps/server/src/exec/quotes.ts:49](../../apps/server/src/exec/quotes.ts#L49) | Yes |
| `QuoteStore.consume` | method | [apps/server/src/exec/quotes.ts:59](../../apps/server/src/exec/quotes.ts#L59) | Yes |
| `SellGuard.constructor` | constructor | [apps/server/src/exec/sell-guard.ts:27](../../apps/server/src/exec/sell-guard.ts#L27) | Yes |
| `SellGuard.check` | method | [apps/server/src/exec/sell-guard.ts:37](../../apps/server/src/exec/sell-guard.ts#L37) | Yes |
| `SellGuard.refused` | method | [apps/server/src/exec/sell-guard.ts:55](../../apps/server/src/exec/sell-guard.ts#L55) | Yes |
| `ExecutionService.constructor` | constructor | [apps/server/src/exec/service.ts:101](../../apps/server/src/exec/service.ts#L101) | Yes |
| `ExecutionService.tradeQuote` | method | [apps/server/src/exec/service.ts:116](../../apps/server/src/exec/service.ts#L116) | Yes |
| `ExecutionService.tradeOrder` | method | [apps/server/src/exec/service.ts:125](../../apps/server/src/exec/service.ts#L125) | Yes |
| `ExecutionService.tradeSubmitted` | method | [apps/server/src/exec/service.ts:134](../../apps/server/src/exec/service.ts#L134) | Yes |
| `ExecutionService.tradeRejected` | method | [apps/server/src/exec/service.ts:139](../../apps/server/src/exec/service.ts#L139) | Yes |
| `ExecutionService.tradeHistory` | method | [apps/server/src/exec/service.ts:144](../../apps/server/src/exec/service.ts#L144) | Yes |
| `ExecutionService.tradeDetail` | method | [apps/server/src/exec/service.ts:149](../../apps/server/src/exec/service.ts#L149) | Yes |
| `ExecutionService.start` | method | [apps/server/src/exec/service.ts:157](../../apps/server/src/exec/service.ts#L157) | Yes |
| `ExecutionService.stop` | method | [apps/server/src/exec/service.ts:166](../../apps/server/src/exec/service.ts#L166) | Yes |
| `ExecutionService.quote` | method | [apps/server/src/exec/service.ts:180](../../apps/server/src/exec/service.ts#L180) | Yes |
| `ExecutionService.place` | method | [apps/server/src/exec/service.ts:357](../../apps/server/src/exec/service.ts#L357) | Yes |
| `ExecutionService.instantPaper` | method | [apps/server/src/exec/service.ts:553](../../apps/server/src/exec/service.ts#L553) | Yes |
| `ExecutionService.markSubmitted` | method | [apps/server/src/exec/service.ts:602](../../apps/server/src/exec/service.ts#L602) | Yes |
| `ExecutionService.markRejected` | method | [apps/server/src/exec/service.ts:626](../../apps/server/src/exec/service.ts#L626) | Yes |
| `ExecutionService.list` | method | [apps/server/src/exec/service.ts:646](../../apps/server/src/exec/service.ts#L646) | Yes |
| `ExecutionService.reconcile` | method | [apps/server/src/exec/service.ts:667](../../apps/server/src/exec/service.ts#L667) | Yes |
| `ExecutionService.modeNetwork` | method | [apps/server/src/exec/service.ts:763](../../apps/server/src/exec/service.ts#L763) | Yes |
| `TradeAccessService.constructor` | constructor | [apps/server/src/exec/trade-access.ts:24](../../apps/server/src/exec/trade-access.ts#L24) | Yes |
| `TradeAccessService.fromDb` | method | [apps/server/src/exec/trade-access.ts:38](../../apps/server/src/exec/trade-access.ts#L38) | Yes |
| `TradeAccessService.liveEnabled` | method | [apps/server/src/exec/trade-access.ts:48](../../apps/server/src/exec/trade-access.ts#L48) | Yes |
| `TradeAccessService.cap` | method | [apps/server/src/exec/trade-access.ts:58](../../apps/server/src/exec/trade-access.ts#L58) | Yes |
| `TradeAccessService.verifiedTargets` | method | [apps/server/src/exec/trade-access.ts:82](../../apps/server/src/exec/trade-access.ts#L82) | Yes |
| `TradeAccessService.refusal` | method | [apps/server/src/exec/trade-access.ts:102](../../apps/server/src/exec/trade-access.ts#L102) | Yes |
| `TradeAccessService.assertOrder` | method | [apps/server/src/exec/trade-access.ts:121](../../apps/server/src/exec/trade-access.ts#L121) | Yes |
| `TradeAccessService.informationalQuote` | method | [apps/server/src/exec/trade-access.ts:134](../../apps/server/src/exec/trade-access.ts#L134) | Yes |
| `auditTradeConfig` | function | [apps/server/src/exec/trade-access.ts:149](../../apps/server/src/exec/trade-access.ts#L149) | Yes |
| `v3TradeBackend` | function | [apps/server/src/exec/trade-backend.ts:21](../../apps/server/src/exec/trade-backend.ts#L21) | Yes |
| `returned.quote` | method | [apps/server/src/exec/trade-backend.ts:31](../../apps/server/src/exec/trade-backend.ts#L31) | Yes |
| `decodeV3Fill` | function | [apps/server/src/exec/trade-reconcile.ts:24](../../apps/server/src/exec/trade-reconcile.ts#L24) | Yes |
| `v3ReconciliationBackend` | function | [apps/server/src/exec/trade-reconcile.ts:102](../../apps/server/src/exec/trade-reconcile.ts#L102) | Yes |
| `TradeError.constructor` | constructor | [apps/server/src/exec/trades.ts:40](../../apps/server/src/exec/trades.ts#L40) | Yes |
| `preparationError` | function | [apps/server/src/exec/trades.ts:47](../../apps/server/src/exec/trades.ts#L47) | Yes |
| `TradeService.constructor` | constructor | [apps/server/src/exec/trades.ts:64](../../apps/server/src/exec/trades.ts#L64) | Yes |
| `TradeService.quote` | method | [apps/server/src/exec/trades.ts:142](../../apps/server/src/exec/trades.ts#L142) | Yes |
| `TradeService.order` | method | [apps/server/src/exec/trades.ts:196](../../apps/server/src/exec/trades.ts#L196) | Yes |
| `TradeService.detail` | method | [apps/server/src/exec/trades.ts:259](../../apps/server/src/exec/trades.ts#L259) | Yes |
| `TradeService.history` | method | [apps/server/src/exec/trades.ts:265](../../apps/server/src/exec/trades.ts#L265) | Yes |
| `TradeService.submitted` | method | [apps/server/src/exec/trades.ts:278](../../apps/server/src/exec/trades.ts#L278) | Yes |
| `TradeService.rejected` | method | [apps/server/src/exec/trades.ts:310](../../apps/server/src/exec/trades.ts#L310) | Yes |
| `TradeService.reconcile` | method | [apps/server/src/exec/trades.ts:320](../../apps/server/src/exec/trades.ts#L320) | Yes |
| `indexedV3Pools` | function | [apps/server/src/exec/v3-routes.ts:66](../../apps/server/src/exec/v3-routes.ts#L66) | Yes |
| `rawUsd` | function | [apps/server/src/exec/v3-routes.ts:90](../../apps/server/src/exec/v3-routes.ts#L90) | Yes |
| `verified` | function | [apps/server/src/exec/v3-routes.ts:96](../../apps/server/src/exec/v3-routes.ts#L96) | Yes |
| `quoteV3Trade` | function | [apps/server/src/exec/v3-routes.ts:118](../../apps/server/src/exec/v3-routes.ts#L118) | Yes |
| `supportedV4Hook` | function | [apps/server/src/exec/v4-routes.ts:46](../../apps/server/src/exec/v4-routes.ts#L46) | Yes |
| `indexedV4Pools` | function | [apps/server/src/exec/v4-routes.ts:48](../../apps/server/src/exec/v4-routes.ts#L48) | Yes |
| `readV4Pool` | function | [apps/server/src/exec/v4-routes.ts:62](../../apps/server/src/exec/v4-routes.ts#L62) | Yes |
| `coinPerWei` | function | [apps/server/src/exec/v4-routes.ts:71](../../apps/server/src/exec/v4-routes.ts#L71) | Yes |
| `v4DepthWei` | function | [apps/server/src/exec/v4-routes.ts:78](../../apps/server/src/exec/v4-routes.ts#L78) | Yes |
| `v4TradeCall` | function | [apps/server/src/exec/v4-routes.ts:116](../../apps/server/src/exec/v4-routes.ts#L116) | Yes |
| `v4CallTerms` | function | [apps/server/src/exec/v4-routes.ts:131](../../apps/server/src/exec/v4-routes.ts#L131) | Yes |
| `v4Wired` | function | [apps/server/src/exec/v4-routes.ts:152](../../apps/server/src/exec/v4-routes.ts#L152) | Yes |
| `v4Allowances` | function | [apps/server/src/exec/v4-routes.ts:163](../../apps/server/src/exec/v4-routes.ts#L163) | Yes |
| `quoteV4Trade` | function | [apps/server/src/exec/v4-routes.ts:180](../../apps/server/src/exec/v4-routes.ts#L180) | Yes |
| `decodeV4Fill` | function | [apps/server/src/exec/v4-routes.ts:241](../../apps/server/src/exec/v4-routes.ts#L241) | Yes |
| `v4Fingerprints` | function | [apps/server/src/exec/v4-trade.ts:33](../../apps/server/src/exec/v4-trade.ts#L33) | Yes |
| `V4ActualOrderProbe.constructor` | constructor | [apps/server/src/exec/v4-trade.ts:58](../../apps/server/src/exec/v4-trade.ts#L58) | Yes |
| `V4ActualOrderProbe.observe` | method | [apps/server/src/exec/v4-trade.ts:60](../../apps/server/src/exec/v4-trade.ts#L60) | Yes |
| `v4PostFillSell` | function | [apps/server/src/exec/v4-trade.ts:116](../../apps/server/src/exec/v4-trade.ts#L116) | Yes |
| `v4TradeBackend` | function | [apps/server/src/exec/v4-trade.ts:143](../../apps/server/src/exec/v4-trade.ts#L143) | Yes |
| `returned.quote` | method | [apps/server/src/exec/v4-trade.ts:162](../../apps/server/src/exec/v4-trade.ts#L162) | Yes |
| `returned.capture` | method | [apps/server/src/exec/v4-trade.ts:184](../../apps/server/src/exec/v4-trade.ts#L184) | Yes |
| `isV4Binding` | function | [apps/server/src/exec/v4-trade.ts:214](../../apps/server/src/exec/v4-trade.ts#L214) | Yes |
| `parseFlagOverride` | function | [apps/server/src/flags/service.ts:11](../../apps/server/src/flags/service.ts#L11) | Yes |
| `FlagService.constructor` | constructor | [apps/server/src/flags/service.ts:43](../../apps/server/src/flags/service.ts#L43) | Yes |
| `FlagService.fromDb` | method | [apps/server/src/flags/service.ts:57](../../apps/server/src/flags/service.ts#L57) | Yes |
| `FlagService.all` | method | [apps/server/src/flags/service.ts:95](../../apps/server/src/flags/service.ts#L95) | Yes |
| `FlagService.isOn` | method | [apps/server/src/flags/service.ts:106](../../apps/server/src/flags/service.ts#L106) | Yes |
| `FlagService.isOpsOn` | method | [apps/server/src/flags/service.ts:117](../../apps/server/src/flags/service.ts#L117) | Yes |
| `phaseAt` | function | [apps/server/src/harness/entitlements.ts:12](../../apps/server/src/harness/entitlements.ts#L12) | Yes |
| `EntitlementsService.constructor` | constructor | [apps/server/src/harness/entitlements.ts:26](../../apps/server/src/harness/entitlements.ts#L26) | Yes |
| `EntitlementsService.get` | method | [apps/server/src/harness/entitlements.ts:34](../../apps/server/src/harness/entitlements.ts#L34) | Yes |
| `groundTruthWriter.write` | method | [apps/server/src/harness/journal.ts:22](../../apps/server/src/harness/journal.ts#L22) | Yes |
| `privateDataCleaner.cleanup` | method | [apps/server/src/harness/journal.ts:52](../../apps/server/src/harness/journal.ts#L52) | Yes |
| `journalKeyWriter.provision` | method | [apps/server/src/harness/journal.ts:82](../../apps/server/src/harness/journal.ts#L82) | Yes |
| `journalKeyWriter.destroy` | method | [apps/server/src/harness/journal.ts:96](../../apps/server/src/harness/journal.ts#L96) | Yes |
| `JournalService.constructor` | constructor | [apps/server/src/harness/journal.ts:109](../../apps/server/src/harness/journal.ts#L109) | Yes |
| `JournalService.authorizeInTransaction` | method | [apps/server/src/harness/journal.ts:137](../../apps/server/src/harness/journal.ts#L137) | Yes |
| `JournalService.consent` | method | [apps/server/src/harness/journal.ts:150](../../apps/server/src/harness/journal.ts#L150) | Yes |
| `JournalService.setConsent` | method | [apps/server/src/harness/journal.ts:161](../../apps/server/src/harness/journal.ts#L161) | Yes |
| `JournalService.append` | method | [apps/server/src/harness/journal.ts:180](../../apps/server/src/harness/journal.ts#L180) | Yes |
| `JournalService.appendInTransaction` | method | [apps/server/src/harness/journal.ts:192](../../apps/server/src/harness/journal.ts#L192) | Yes |
| `JournalService.page` | method | [apps/server/src/harness/journal.ts:233](../../apps/server/src/harness/journal.ts#L233) | Yes |
| `JournalService.deleteData` | method | [apps/server/src/harness/journal.ts:271](../../apps/server/src/harness/journal.ts#L271) | Yes |
| `OAuthConsentService.constructor` | constructor | [apps/server/src/harness/oauth-consent.ts:20](../../apps/server/src/harness/oauth-consent.ts#L20) | Yes |
| `OAuthConsentService.inspect` | method | [apps/server/src/harness/oauth-consent.ts:53](../../apps/server/src/harness/oauth-consent.ts#L53) | Yes |
| `OAuthConsentService.consent` | method | [apps/server/src/harness/oauth-consent.ts:69](../../apps/server/src/harness/oauth-consent.ts#L69) | Yes |
| `OAuthTokenError.constructor` | constructor | [apps/server/src/harness/oauth-tokens.ts:22](../../apps/server/src/harness/oauth-tokens.ts#L22) | Yes |
| `OAuthTokenService.constructor` | constructor | [apps/server/src/harness/oauth-tokens.ts:33](../../apps/server/src/harness/oauth-tokens.ts#L33) | Yes |
| `OAuthTokenService.exchange` | method | [apps/server/src/harness/oauth-tokens.ts:87](../../apps/server/src/harness/oauth-tokens.ts#L87) | Yes |
| `OAuthTokenService.revoke` | method | [apps/server/src/harness/oauth-tokens.ts:130](../../apps/server/src/harness/oauth-tokens.ts#L130) | Yes |
| `OAuthTokenService.authenticate` | method | [apps/server/src/harness/oauth-tokens.ts:149](../../apps/server/src/harness/oauth-tokens.ts#L149) | Yes |
| `recentCoinPrice` | function | [apps/server/src/harness/preflight-inputs.ts:17](../../apps/server/src/harness/preflight-inputs.ts#L17) | Yes |
| `storedPreflightInputs` | function | [apps/server/src/harness/preflight-inputs.ts:36](../../apps/server/src/harness/preflight-inputs.ts#L36) | Yes |
| `unavailablePreflightInputs` | function | [apps/server/src/harness/preflight.ts:22](../../apps/server/src/harness/preflight.ts#L22) | Yes |
| `PreflightService.constructor` | constructor | [apps/server/src/harness/preflight.ts:39](../../apps/server/src/harness/preflight.ts#L39) | Yes |
| `PreflightService.run` | method | [apps/server/src/harness/preflight.ts:50](../../apps/server/src/harness/preflight.ts#L50) | Yes |
| `HarnessService.constructor` | constructor | [apps/server/src/harness/service.ts:26](../../apps/server/src/harness/service.ts#L26) | Yes |
| `HarnessService.list` | method | [apps/server/src/harness/service.ts:56](../../apps/server/src/harness/service.ts#L56) | Yes |
| `HarnessService.detail` | method | [apps/server/src/harness/service.ts:65](../../apps/server/src/harness/service.ts#L65) | Yes |
| `HarnessService.policy` | method | [apps/server/src/harness/service.ts:75](../../apps/server/src/harness/service.ts#L75) | Yes |
| `HarnessService.create` | method | [apps/server/src/harness/service.ts:86](../../apps/server/src/harness/service.ts#L86) | Yes |
| `HarnessService.createInTransaction` | method | [apps/server/src/harness/service.ts:96](../../apps/server/src/harness/service.ts#L96) | Yes |
| `HarnessService.update` | method | [apps/server/src/harness/service.ts:110](../../apps/server/src/harness/service.ts#L110) | Yes |
| `HarnessService.savePolicy` | method | [apps/server/src/harness/service.ts:136](../../apps/server/src/harness/service.ts#L136) | Yes |
| `HarnessService.keys` | method | [apps/server/src/harness/service.ts:153](../../apps/server/src/harness/service.ts#L153) | Yes |
| `HarnessService.assertKeyIssuance` | method | [apps/server/src/harness/service.ts:165](../../apps/server/src/harness/service.ts#L165) | Yes |
| `HarnessService.createKey` | method | [apps/server/src/harness/service.ts:181](../../apps/server/src/harness/service.ts#L181) | Yes |
| `HarnessService.revokeKey` | method | [apps/server/src/harness/service.ts:200](../../apps/server/src/harness/service.ts#L200) | Yes |
| `HarnessService.authenticate` | method | [apps/server/src/harness/service.ts:217](../../apps/server/src/harness/service.ts#L217) | Yes |
| `AuthService.constructor` | constructor | [apps/server/src/http/auth.ts:37](../../apps/server/src/http/auth.ts#L37) | Yes |
| `AuthService.cookieOptions` | method | [apps/server/src/http/auth.ts:48](../../apps/server/src/http/auth.ts#L48) | Yes |
| `AuthService.fromToken` | method | [apps/server/src/http/auth.ts:67](../../apps/server/src/http/auth.ts#L67) | Yes |
| `AuthService.createSession` | method | [apps/server/src/http/auth.ts:84](../../apps/server/src/http/auth.ts#L84) | Yes |
| `AuthService.createGuest` | method | [apps/server/src/http/auth.ts:96](../../apps/server/src/http/auth.ts#L96) | Yes |
| `AuthService.destroySession` | method | [apps/server/src/http/auth.ts:108](../../apps/server/src/http/auth.ts#L108) | Yes |
| `AuthService.readCookie` | method | [apps/server/src/http/auth.ts:118](../../apps/server/src/http/auth.ts#L118) | Yes |
| `AuthService.ensure` | method | [apps/server/src/http/auth.ts:132](../../apps/server/src/http/auth.ts#L132) | Yes |
| `AuthService.nonce` | method | [apps/server/src/http/auth.ts:150](../../apps/server/src/http/auth.ts#L150) | Yes |
| `AuthService.challenge` | method | [apps/server/src/http/auth.ts:163](../../apps/server/src/http/auth.ts#L163) | Yes |
| `AuthService.expectedDomain` | method | [apps/server/src/http/auth.ts:180](../../apps/server/src/http/auth.ts#L180) | Yes |
| `AuthService.originFor` | method | [apps/server/src/http/auth.ts:195](../../apps/server/src/http/auth.ts#L195) | Yes |
| `AuthService.verifySiwe` | method | [apps/server/src/http/auth.ts:223](../../apps/server/src/http/auth.ts#L223) | Yes |
| `publicGhostReport` | function | [apps/server/src/http/ghost-reports.ts:19](../../apps/server/src/http/ghost-reports.ts#L19) | Yes |
| `ghostReportRoutes` | function | [apps/server/src/http/ghost-reports.ts:43](../../apps/server/src/http/ghost-reports.ts#L43) | Yes |
| `launchMonitoringRoutes` | function | [apps/server/src/http/launch-monitoring.ts:19](../../apps/server/src/http/launch-monitoring.ts#L19) | Yes |
| `registerRoutes` | function | [apps/server/src/http/routes.ts:68](../../apps/server/src/http/routes.ts#L68) | Yes |
| `securityTxtRoutes` | function | [apps/server/src/http/security-txt.ts:32](../../apps/server/src/http/security-txt.ts#L32) | Yes |
| `ShareService.constructor` | constructor | [apps/server/src/http/share.ts:58](../../apps/server/src/http/share.ts#L58) | Yes |
| `ShareService.content` | method | [apps/server/src/http/share.ts:66](../../apps/server/src/http/share.ts#L66) | Yes |
| `ShareService.image` | method | [apps/server/src/http/share.ts:95](../../apps/server/src/http/share.ts#L95) | Yes |
| `webHeaders` | function | [apps/server/src/http/share.ts:107](../../apps/server/src/http/share.ts#L107) | Yes |
| `registerShareRoutes` | function | [apps/server/src/http/share.ts:122](../../apps/server/src/http/share.ts#L122) | Yes |
| `spaDocument` | function | [apps/server/src/http/share.ts:155](../../apps/server/src/http/share.ts#L155) | Yes |
| `accountRoutes` | function | [apps/server/src/http/v1/account.ts:26](../../apps/server/src/http/v1/account.ts#L26) | Yes |
| `agentRoutes` | function | [apps/server/src/http/v1/agents.ts:36](../../apps/server/src/http/v1/agents.ts#L36) | Yes |
| `bagsRoutes` | function | [apps/server/src/http/v1/bags.ts:17](../../apps/server/src/http/v1/bags.ts#L17) | Yes |
| `configRoutes` | function | [apps/server/src/http/v1/config.ts:20](../../apps/server/src/http/v1/config.ts#L20) | Yes |
| `createDemoToken` | function | [apps/server/src/http/v1/demo.ts:29](../../apps/server/src/http/v1/demo.ts#L29) | Yes |
| `verifyDemoToken` | function | [apps/server/src/http/v1/demo.ts:43](../../apps/server/src/http/v1/demo.ts#L43) | Yes |
| `guardDemoWrite` | function | [apps/server/src/http/v1/demo.ts:74](../../apps/server/src/http/v1/demo.ts#L74) | Yes |
| `installDemoGuard` | function | [apps/server/src/http/v1/demo.ts:87](../../apps/server/src/http/v1/demo.ts#L87) | Yes |
| `demoRoutes` | function | [apps/server/src/http/v1/demo.ts:103](../../apps/server/src/http/v1/demo.ts#L103) | Yes |
| `healthRoutes` | function | [apps/server/src/http/v1/health.ts:14](../../apps/server/src/http/v1/health.ts#L14) | Yes |
| `registerV1` | function | [apps/server/src/http/v1/index.ts:38](../../apps/server/src/http/v1/index.ts#L38) | Yes |
| `journalRoutes` | function | [apps/server/src/http/v1/journal.ts:20](../../apps/server/src/http/v1/journal.ts#L20) | Yes |
| `oauthConsentRoutes` | function | [apps/server/src/http/v1/oauth.ts:19](../../apps/server/src/http/v1/oauth.ts#L19) | Yes |
| `packRoutes` | function | [apps/server/src/http/v1/packs.ts:13](../../apps/server/src/http/v1/packs.ts#L13) | Yes |
| `readRoutes` | function | [apps/server/src/http/v1/reads.ts:32](../../apps/server/src/http/v1/reads.ts#L32) | Yes |
| `receiptRoutes` | function | [apps/server/src/http/v1/receipts.ts:14](../../apps/server/src/http/v1/receipts.ts#L14) | Yes |
| `rpcRoutes` | function | [apps/server/src/http/v1/rpc.ts:59](../../apps/server/src/http/v1/rpc.ts#L59) | Yes |
| `telegramRoutes` | function | [apps/server/src/http/v1/telegram.ts:13](../../apps/server/src/http/v1/telegram.ts#L13) | Yes |
| `telemetryIngress` | function | [apps/server/src/http/v1/telemetry.ts:16](../../apps/server/src/http/v1/telemetry.ts#L16) | Yes |
| `telemetryRoutes` | function | [apps/server/src/http/v1/telemetry.ts:43](../../apps/server/src/http/v1/telemetry.ts#L43) | Yes |
| `tradeAdminRoutes` | function | [apps/server/src/http/v1/trade-admin.ts:19](../../apps/server/src/http/v1/trade-admin.ts#L19) | Yes |
| `tradeRoutes` | function | [apps/server/src/http/v1/trade.ts:14](../../apps/server/src/http/v1/trade.ts#L14) | Yes |
| `watchRoutes` | function | [apps/server/src/http/v1/watch.ts:17](../../apps/server/src/http/v1/watch.ts#L17) | Yes |
| `guardReadRoutes` | function | [apps/server/src/http/v2-guard.ts:17](../../apps/server/src/http/v2-guard.ts#L17) | Yes |
| `IncidentService.constructor` | constructor | [apps/server/src/obs/incidents.ts:18](../../apps/server/src/obs/incidents.ts#L18) | Yes |
| `IncidentService.recordTradeMiss` | method | [apps/server/src/obs/incidents.ts:24](../../apps/server/src/obs/incidents.ts#L24) | Yes |
| `IncidentService.raise` | method | [apps/server/src/obs/incidents.ts:44](../../apps/server/src/obs/incidents.ts#L44) | Yes |
| `IncidentService.deliver` | method | [apps/server/src/obs/incidents.ts:64](../../apps/server/src/obs/incidents.ts#L64) | Yes |
| `sentryIncidentSink` | function | [apps/server/src/obs/incidents.ts:85](../../apps/server/src/obs/incidents.ts#L85) | Yes |
| `LaunchMonitor.constructor` | constructor | [apps/server/src/obs/launch.ts:35](../../apps/server/src/obs/launch.ts#L35) | Yes |
| `LaunchMonitor.collect` | method | [apps/server/src/obs/launch.ts:44](../../apps/server/src/obs/launch.ts#L44) | Yes |
| `LaunchMonitor.record` | method | [apps/server/src/obs/launch.ts:65](../../apps/server/src/obs/launch.ts#L65) | Yes |
| `LaunchMonitor.snapshot` | method | [apps/server/src/obs/launch.ts:77](../../apps/server/src/obs/launch.ts#L77) | Yes |
| `LaunchMonitor.checks` | method | [apps/server/src/obs/launch.ts:102](../../apps/server/src/obs/launch.ts#L102) | Yes |
| `LaunchMonitor.prometheus` | method | [apps/server/src/obs/launch.ts:139](../../apps/server/src/obs/launch.ts#L139) | Yes |
| `SecurityCollectors.constructor` | constructor | [apps/server/src/obs/security-collectors.ts:47](../../apps/server/src/obs/security-collectors.ts#L47) | Yes |
| `SecurityCollectors.start` | method | [apps/server/src/obs/security-collectors.ts:56](../../apps/server/src/obs/security-collectors.ts#L56) | Yes |
| `SecurityCollectors.stop` | method | [apps/server/src/obs/security-collectors.ts:72](../../apps/server/src/obs/security-collectors.ts#L72) | Yes |
| `SecurityCollectors.poll` | method | [apps/server/src/obs/security-collectors.ts:79](../../apps/server/src/obs/security-collectors.ts#L79) | Yes |
| `parseSecurityCollectors` | function | [apps/server/src/obs/security-config.ts:26](../../apps/server/src/obs/security-config.ts#L26) | Yes |
| `securityBudgetOpen` | function | [apps/server/src/obs/security-worker.ts:10](../../apps/server/src/obs/security-worker.ts#L10) | Yes |
| `workerSecurityCollectors` | function | [apps/server/src/obs/security-worker.ts:19](../../apps/server/src/obs/security-worker.ts#L19) | Yes |
| `runStream` | function | [apps/server/src/ops/backup-stream.ts:16](../../apps/server/src/ops/backup-stream.ts#L16) | Yes |
| `validateRestoreName` | function | [apps/server/src/ops/restore-checks.ts:13](../../apps/server/src/ops/restore-checks.ts#L13) | Yes |
| `assertFreshRestoreTarget` | function | [apps/server/src/ops/restore-checks.ts:23](../../apps/server/src/ops/restore-checks.ts#L23) | Yes |
| `captureInventory` | function | [apps/server/src/ops/restore-checks.ts:47](../../apps/server/src/ops/restore-checks.ts#L47) | Yes |
| `compareInventories` | function | [apps/server/src/ops/restore-checks.ts:90](../../apps/server/src/ops/restore-checks.ts#L90) | Yes |
| `reclaimRestoreLeases` | function | [apps/server/src/ops/restore-checks.ts:106](../../apps/server/src/ops/restore-checks.ts#L106) | Yes |
| `ScoreboardService.constructor` | constructor | [apps/server/src/read/scoreboard.ts:33](../../apps/server/src/read/scoreboard.ts#L33) | Yes |
| `ScoreboardService.start` | method | [apps/server/src/read/scoreboard.ts:55](../../apps/server/src/read/scoreboard.ts#L55) | Yes |
| `ScoreboardService.close` | method | [apps/server/src/read/scoreboard.ts:57](../../apps/server/src/read/scoreboard.ts#L57) | Yes |
| `ScoreboardService.background` | method | [apps/server/src/read/scoreboard.ts:59](../../apps/server/src/read/scoreboard.ts#L59) | Yes |
| `ScoreboardService.sync` | method | [apps/server/src/read/scoreboard.ts:61](../../apps/server/src/read/scoreboard.ts#L61) | Yes |
| `ScoreboardService.recordCoverage` | method | [apps/server/src/read/scoreboard.ts:65](../../apps/server/src/read/scoreboard.ts#L65) | Yes |
| `ScoreboardService.recordRefusal` | method | [apps/server/src/read/scoreboard.ts:73](../../apps/server/src/read/scoreboard.ts#L73) | Yes |
| `ScoreboardService.acceptOutcome` | method | [apps/server/src/read/scoreboard.ts:92](../../apps/server/src/read/scoreboard.ts#L92) | Yes |
| `ScoreboardService.publishCohort` | method | [apps/server/src/read/scoreboard.ts:201](../../apps/server/src/read/scoreboard.ts#L201) | Yes |
| `ScoreboardService.attachPostMortem` | method | [apps/server/src/read/scoreboard.ts:271](../../apps/server/src/read/scoreboard.ts#L271) | Yes |
| `ScoreboardService.list` | method | [apps/server/src/read/scoreboard.ts:288](../../apps/server/src/read/scoreboard.ts#L288) | Yes |
| `SensesReadService.constructor` | constructor | [apps/server/src/read/senses.ts:37](../../apps/server/src/read/senses.ts#L37) | Yes |
| `SensesReadService.verdict` | method | [apps/server/src/read/senses.ts:49](../../apps/server/src/read/senses.ts#L49) | Yes |
| `SensesReadService.card` | method | [apps/server/src/read/senses.ts:64](../../apps/server/src/read/senses.ts#L64) | Yes |
| `SensesReadService.playbooks` | method | [apps/server/src/read/senses.ts:97](../../apps/server/src/read/senses.ts#L97) | Yes |
| `SensesReadService.census` | method | [apps/server/src/read/senses.ts:115](../../apps/server/src/read/senses.ts#L115) | Yes |
| `SensesReadService.receipt` | method | [apps/server/src/read/senses.ts:123](../../apps/server/src/read/senses.ts#L123) | Yes |
| `roleStartupMessage` | function | [apps/server/src/roles.ts:31](../../apps/server/src/roles.ts#L31) | Yes |
| `planRole` | function | [apps/server/src/roles.ts:43](../../apps/server/src/roles.ts#L43) | Yes |
| `acquireRoleLease` | function | [apps/server/src/roles.ts:73](../../apps/server/src/roles.ts#L73) | Yes |
| `announceRoleIdentity` | function | [apps/server/src/roles.ts:102](../../apps/server/src/roles.ts#L102) | Yes |
| `runRole` | function | [apps/server/src/roles.ts:115](../../apps/server/src/roles.ts#L115) | Yes |
| `SanctionsService.constructor` | constructor | [apps/server/src/sanctions/service.ts:26](../../apps/server/src/sanctions/service.ts#L26) | Yes |
| `SanctionsService.assertWallet` | method | [apps/server/src/sanctions/service.ts:35](../../apps/server/src/sanctions/service.ts#L35) | Yes |
| `SanctionsService.freshness` | method | [apps/server/src/sanctions/service.ts:54](../../apps/server/src/sanctions/service.ts#L54) | Yes |
| `downloadSdn` | function | [apps/server/src/sanctions/service.ts:76](../../apps/server/src/sanctions/service.ts#L76) | Yes |
| `SanctionsWorker.constructor` | constructor | [apps/server/src/sanctions/service.ts:114](../../apps/server/src/sanctions/service.ts#L114) | Yes |
| `SanctionsWorker.start` | method | [apps/server/src/sanctions/service.ts:127](../../apps/server/src/sanctions/service.ts#L127) | Yes |
| `SanctionsWorker.stop` | method | [apps/server/src/sanctions/service.ts:138](../../apps/server/src/sanctions/service.ts#L138) | Yes |
| `SanctionsWorker.tick` | method | [apps/server/src/sanctions/service.ts:146](../../apps/server/src/sanctions/service.ts#L146) | Yes |
| `paperDelayMs` | function | [apps/server/src/swarm/paper.ts:21](../../apps/server/src/swarm/paper.ts#L21) | Yes |
| `paperSizeUsd` | function | [apps/server/src/swarm/paper.ts:27](../../apps/server/src/swarm/paper.ts#L27) | Yes |
| `initialPaperPosition` | function | [apps/server/src/swarm/paper.ts:33](../../apps/server/src/swarm/paper.ts#L33) | Yes |
| `paperExitReason` | function | [apps/server/src/swarm/paper.ts:42](../../apps/server/src/swarm/paper.ts#L42) | Yes |
| `stepPaper` | function | [apps/server/src/swarm/paper.ts:55](../../apps/server/src/swarm/paper.ts#L55) | Yes |
| `referencePaperLeg` | function | [apps/server/src/swarm/paper.ts:81](../../apps/server/src/swarm/paper.ts#L81) | Yes |
| `SwarmPaperRunner.constructor` | constructor | [apps/server/src/swarm/runner.ts:23](../../apps/server/src/swarm/runner.ts#L23) | Yes |
| `SwarmPaperRunner.prepareCohort` | method | [apps/server/src/swarm/runner.ts:29](../../apps/server/src/swarm/runner.ts#L29) | Yes |
| `SwarmPaperRunner.register` | method | [apps/server/src/swarm/runner.ts:66](../../apps/server/src/swarm/runner.ts#L66) | Yes |
| `SwarmPaperRunner.observe` | method | [apps/server/src/swarm/runner.ts:108](../../apps/server/src/swarm/runner.ts#L108) | Yes |
| `SwarmPaperRunner.tick` | method | [apps/server/src/swarm/runner.ts:134](../../apps/server/src/swarm/runner.ts#L134) | Yes |
| `SwarmPaperRunner.report` | method | [apps/server/src/swarm/runner.ts:192](../../apps/server/src/swarm/runner.ts#L192) | Yes |
| `telegramAlertText` | function | [apps/server/src/telegram/delivery.ts:13](../../apps/server/src/telegram/delivery.ts#L13) | Yes |
| `TelegramDeliveryWorker.constructor` | constructor | [apps/server/src/telegram/delivery.ts:27](../../apps/server/src/telegram/delivery.ts#L27) | Yes |
| `TelegramDeliveryWorker.runOnce` | method | [apps/server/src/telegram/delivery.ts:34](../../apps/server/src/telegram/delivery.ts#L34) | Yes |
| `TelegramDeliveryWorker.dispatch` | method | [apps/server/src/telegram/delivery.ts:45](../../apps/server/src/telegram/delivery.ts#L45) | Yes |
| `TelegramLinkService.constructor` | constructor | [apps/server/src/telegram/link.ts:16](../../apps/server/src/telegram/link.ts#L16) | Yes |
| `TelegramLinkService.issue` | method | [apps/server/src/telegram/link.ts:24](../../apps/server/src/telegram/link.ts#L24) | Yes |
| `TelegramLinkService.redeem` | method | [apps/server/src/telegram/link.ts:42](../../apps/server/src/telegram/link.ts#L42) | Yes |
| `TelegramLinkService.unlink` | method | [apps/server/src/telegram/link.ts:68](../../apps/server/src/telegram/link.ts#L68) | Yes |
| `advanceTelegramCursor` | function | [apps/server/src/telegram/link.ts:85](../../apps/server/src/telegram/link.ts#L85) | Yes |
| `committer` | getter | [contracts/src/ReceiptsRegistry.sol:38](../../contracts/src/ReceiptsRegistry.sol#L38) | Yes |
| `lastBatchId` | getter | [contracts/src/ReceiptsRegistry.sol:41](../../contracts/src/ReceiptsRegistry.sol#L41) | Yes |
| `CommitterChanged` | event | [contracts/src/ReceiptsRegistry.sol:48](../../contracts/src/ReceiptsRegistry.sol#L48) | Yes |
| `BatchCommitted` | event | [contracts/src/ReceiptsRegistry.sol:55](../../contracts/src/ReceiptsRegistry.sol#L55) | Yes |
| `NotCommitter` | error | [contracts/src/ReceiptsRegistry.sol:59](../../contracts/src/ReceiptsRegistry.sol#L59) | Yes |
| `EmptyBatch` | error | [contracts/src/ReceiptsRegistry.sol:62](../../contracts/src/ReceiptsRegistry.sol#L62) | Yes |
| `constructor` | function | [contracts/src/ReceiptsRegistry.sol:69](../../contracts/src/ReceiptsRegistry.sol#L69) | Yes |
| `commit` | function | [contracts/src/ReceiptsRegistry.sol:81](../../contracts/src/ReceiptsRegistry.sol#L81) | Yes |
| `setCommitter` | function | [contracts/src/ReceiptsRegistry.sol:93](../../contracts/src/ReceiptsRegistry.sol#L93) | Yes |
| `batch` | function | [contracts/src/ReceiptsRegistry.sol:102](../../contracts/src/ReceiptsRegistry.sol#L102) | Yes |
| `verify` | function | [contracts/src/ReceiptsRegistry.sol:113](../../contracts/src/ReceiptsRegistry.sol#L113) | Yes |
| `inertAuthority` | function | [packages/chain/src/control/collector.ts:20](../../packages/chain/src/control/collector.ts#L20) | Yes |
| `controlWordAddress` | function | [packages/chain/src/control/collector.ts:25](../../packages/chain/src/control/collector.ts#L25) | Yes |
| `observedControlSelectors` | function | [packages/chain/src/control/collector.ts:37](../../packages/chain/src/control/collector.ts#L37) | Yes |
| `inspectGenericControls` | function | [packages/chain/src/control/collector.ts:48](../../packages/chain/src/control/collector.ts#L48) | Yes |
| `collectGenericLpCustody` | function | [packages/chain/src/custody/collector.ts:26](../../packages/chain/src/custody/collector.ts#L26) | Yes |
| `custodyDepthInputs` | function | [packages/chain/src/custody/collector.ts:162](../../packages/chain/src/custody/collector.ts#L162) | Yes |
| `PonsActualOrderProbe.constructor` | constructor | [packages/chain/src/execution/pons-actual.ts:37](../../packages/chain/src/execution/pons-actual.ts#L37) | Yes |
| `PonsActualOrderProbe.observe` | method | [packages/chain/src/execution/pons-actual.ts:49](../../packages/chain/src/execution/pons-actual.ts#L49) | Yes |
| `ponsV2Execution` | function | [packages/chain/src/execution/pons.ts:33](../../packages/chain/src/execution/pons.ts#L33) | Yes |
| `verifiedPonsExecution` | function | [packages/chain/src/execution/pons.ts:54](../../packages/chain/src/execution/pons.ts#L54) | Yes |
| `buildPonsTrade` | function | [packages/chain/src/execution/pons.ts:83](../../packages/chain/src/execution/pons.ts#L83) | Yes |
| `pendingPonsTradeForkGate` | function | [packages/chain/src/execution/pons.ts:136](../../packages/chain/src/execution/pons.ts#L136) | Yes |
| `ponsTradeForkGateIssues` | function | [packages/chain/src/execution/pons.ts:147](../../packages/chain/src/execution/pons.ts#L147) | Yes |
| `ponsVenueLink` | function | [packages/chain/src/execution/pons.ts:196](../../packages/chain/src/execution/pons.ts#L196) | Yes |
| `PonsCurveAdapter.constructor` | constructor | [packages/chain/src/execution/pons.ts:218](../../packages/chain/src/execution/pons.ts#L218) | Yes |
| `PonsCurveAdapter.quote` | method | [packages/chain/src/execution/pons.ts:228](../../packages/chain/src/execution/pons.ts#L228) | Yes |
| `PonsCurveAdapter.prepareExecution` | method | [packages/chain/src/execution/pons.ts:291](../../packages/chain/src/execution/pons.ts#L291) | Yes |
| `buildV4ApprovalPlan` | function | [packages/chain/src/execution/v4.ts:41](../../packages/chain/src/execution/v4.ts#L41) | Yes |
| `bindV4ExecutionIntent` | function | [packages/chain/src/execution/v4.ts:64](../../packages/chain/src/execution/v4.ts#L64) | Yes |
| `v4ExecutionForkIssues` | function | [packages/chain/src/execution/v4.ts:108](../../packages/chain/src/execution/v4.ts#L108) | Yes |
| `v4ExecutionCapability` | function | [packages/chain/src/execution/v4.ts:137](../../packages/chain/src/execution/v4.ts#L137) | Yes |
| `UniswapV4Adapter.constructor` | constructor | [packages/chain/src/execution/v4.ts:151](../../packages/chain/src/execution/v4.ts#L151) | Yes |
| `UniswapV4Adapter.prepareExecution` | method | [packages/chain/src/execution/v4.ts:157](../../packages/chain/src/execution/v4.ts#L157) | Yes |
| `FileJournalDestructionLedger.constructor` | constructor | [packages/db/src/crypto/destruction.ts:19](../../packages/db/src/crypto/destruction.ts#L19) | Yes |
| `FileJournalDestructionLedger.destroyedAt` | method | [packages/db/src/crypto/destruction.ts:27](../../packages/db/src/crypto/destruction.ts#L27) | Yes |
| `FileJournalDestructionLedger.destroy` | method | [packages/db/src/crypto/destruction.ts:46](../../packages/db/src/crypto/destruction.ts#L46) | Yes |
| `journalBytes` | function | [packages/db/src/crypto/journal.ts:31](../../packages/db/src/crypto/journal.ts#L31) | Yes |
| `sealEntry` | function | [packages/db/src/crypto/journal.ts:45](../../packages/db/src/crypto/journal.ts#L45) | Yes |
| `openEntry` | function | [packages/db/src/crypto/journal.ts:61](../../packages/db/src/crypto/journal.ts#L61) | Yes |
| `wrapDek` | function | [packages/db/src/crypto/journal.ts:81](../../packages/db/src/crypto/journal.ts#L81) | Yes |
| `unwrapDek` | function | [packages/db/src/crypto/journal.ts:93](../../packages/db/src/crypto/journal.ts#L93) | Yes |
| `flowModel` | function | [packages/db/src/flow-read.ts:9](../../packages/db/src/flow-read.ts#L9) | Yes |
| `censusGate` | function | [packages/db/src/flow-read.ts:17](../../packages/db/src/flow-read.ts#L17) | Yes |
| `unavailableFlow` | function | [packages/db/src/flow-read.ts:28](../../packages/db/src/flow-read.ts#L28) | Yes |
| `readFlows` | function | [packages/db/src/flow-read.ts:38](../../packages/db/src/flow-read.ts#L38) | Yes |
| `readMarkers` | function | [packages/db/src/flow-read.ts:51](../../packages/db/src/flow-read.ts#L51) | Yes |
| `readCensus` | function | [packages/db/src/flow-read.ts:70](../../packages/db/src/flow-read.ts#L70) | Yes |
| `GuardReceiptStore.constructor` | constructor | [packages/db/src/guard-receipts.ts:32](../../packages/db/src/guard-receipts.ts#L32) | Yes |
| `GuardReceiptStore.record` | method | [packages/db/src/guard-receipts.ts:41](../../packages/db/src/guard-receipts.ts#L41) | Yes |
| `GuardReceiptStore.get` | method | [packages/db/src/guard-receipts.ts:59](../../packages/db/src/guard-receipts.ts#L59) | Yes |
| `GuardReceiptStore.prepareBatch` | method | [packages/db/src/guard-receipts.ts:83](../../packages/db/src/guard-receipts.ts#L83) | Yes |
| `GuardReceiptStore.recordAnchor` | method | [packages/db/src/guard-receipts.ts:105](../../packages/db/src/guard-receipts.ts#L105) | Yes |
| `GuardReceiptStore.refreshAnchors` | method | [packages/db/src/guard-receipts.ts:147](../../packages/db/src/guard-receipts.ts#L147) | Yes |
| `currentReceiptAnchor` | function | [packages/db/src/receipt-anchors.ts:13](../../packages/db/src/receipt-anchors.ts#L13) | Yes |
| `ReceiptApiStore.constructor` | constructor | [packages/db/src/receipt-api.ts:33](../../packages/db/src/receipt-api.ts#L33) | Yes |
| `ReceiptApiStore.get` | method | [packages/db/src/receipt-api.ts:44](../../packages/db/src/receipt-api.ts#L44) | Yes |
| `ReceiptCommitJournal.constructor` | constructor | [packages/db/src/receipt-committer.ts:25](../../packages/db/src/receipt-committer.ts#L25) | Yes |
| `ReceiptCommitJournal.acquire` | method | [packages/db/src/receipt-committer.ts:35](../../packages/db/src/receipt-committer.ts#L35) | Yes |
| `ReceiptCommitJournal.fenced` | method | [packages/db/src/receipt-committer.ts:45](../../packages/db/src/receipt-committer.ts#L45) | Yes |
| `ReceiptCommitJournal.heartbeat` | method | [packages/db/src/receipt-committer.ts:59](../../packages/db/src/receipt-committer.ts#L59) | Yes |
| `ReceiptCommitJournal.release` | method | [packages/db/src/receipt-committer.ts:66](../../packages/db/src/receipt-committer.ts#L66) | Yes |
| `ReceiptCommitJournal.health` | method | [packages/db/src/receipt-committer.ts:73](../../packages/db/src/receipt-committer.ts#L73) | Yes |
| `ReceiptCommitJournal.batch` | method | [packages/db/src/receipt-committer.ts:82](../../packages/db/src/receipt-committer.ts#L82) | Yes |
| `ReceiptCommitJournal.attempt` | method | [packages/db/src/receipt-committer.ts:123](../../packages/db/src/receipt-committer.ts#L123) | Yes |
| `ReceiptCommitJournal.saveAttempt` | method | [packages/db/src/receipt-committer.ts:135](../../packages/db/src/receipt-committer.ts#L135) | Yes |
| `ReceiptCommitJournal.failed` | method | [packages/db/src/receipt-committer.ts:146](../../packages/db/src/receipt-committer.ts#L146) | Yes |
| `ReceiptCommitJournal.anchor` | method | [packages/db/src/receipt-committer.ts:156](../../packages/db/src/receipt-committer.ts#L156) | Yes |
| `ReceiptCommitJournal.unfinalized` | method | [packages/db/src/receipt-committer.ts:177](../../packages/db/src/receipt-committer.ts#L177) | Yes |
| `ReceiptCommitJournal.anchorEvent` | method | [packages/db/src/receipt-committer.ts:187](../../packages/db/src/receipt-committer.ts#L187) | Yes |
| `publishPrivateReceipt` | function | [packages/db/src/receipt-outbox.ts:37](../../packages/db/src/receipt-outbox.ts#L37) | Yes |
| `publishReceipt` | function | [packages/db/src/receipt-outbox.ts:69](../../packages/db/src/receipt-outbox.ts#L69) | Yes |
| `ReceiptOutbox.constructor` | constructor | [packages/db/src/receipt-outbox.ts:108](../../packages/db/src/receipt-outbox.ts#L108) | Yes |
| `ReceiptOutbox.enqueue` | method | [packages/db/src/receipt-outbox.ts:116](../../packages/db/src/receipt-outbox.ts#L116) | Yes |
| `ReceiptOutbox.recover` | method | [packages/db/src/receipt-outbox.ts:141](../../packages/db/src/receipt-outbox.ts#L141) | Yes |
| `ReceiptOutbox.getPrivate` | method | [packages/db/src/receipt-outbox.ts:155](../../packages/db/src/receipt-outbox.ts#L155) | Yes |
| `ReceiptOutbox.getItem` | method | [packages/db/src/receipt-outbox.ts:169](../../packages/db/src/receipt-outbox.ts#L169) | Yes |
| `ReceiptOutbox.get` | method | [packages/db/src/receipt-outbox.ts:183](../../packages/db/src/receipt-outbox.ts#L183) | Yes |
| `guardScoreHash` | function | [packages/playbooks/src/guard-scoring.ts:20](../../packages/playbooks/src/guard-scoring.ts#L20) | Yes |
| `evaluateGuardV2` | function | [packages/playbooks/src/guard-scoring.ts:48](../../packages/playbooks/src/guard-scoring.ts#L48) | Yes |
| `assembleVerdict` | function | [packages/playbooks/src/verdict.ts:49](../../packages/playbooks/src/verdict.ts#L49) | Yes |
| `actualBindingHash` | function | [packages/policy/src/actual-order.ts:17](../../packages/policy/src/actual-order.ts#L17) | Yes |
| `executionPolicyHash` | function | [packages/policy/src/actual-order.ts:25](../../packages/policy/src/actual-order.ts#L25) | Yes |
| `actualStateHash` | function | [packages/policy/src/actual-order.ts:35](../../packages/policy/src/actual-order.ts#L35) | Yes |
| `actualOrderGate` | function | [packages/policy/src/actual-order.ts:65](../../packages/policy/src/actual-order.ts#L65) | Yes |
| `actualNotionalOf` | function | [packages/policy/src/actual-order.ts:140](../../packages/policy/src/actual-order.ts#L140) | Yes |
| `orderHash` | function | [packages/policy/src/canonical.ts:15](../../packages/policy/src/canonical.ts#L15) | Yes |
| `guardBuyGate` | function | [packages/policy/src/guard.ts:14](../../packages/policy/src/guard.ts#L14) | Yes |
| `evaluate` | function | [packages/policy/src/preflight.ts:34](../../packages/policy/src/preflight.ts#L34) | Yes |
| `applyPreset` | function | [packages/policy/src/presets.ts:23](../../packages/policy/src/presets.ts#L23) | Yes |
| `resolveRepeat` | function | [packages/policy/src/repeat.ts:17](../../packages/policy/src/repeat.ts#L17) | Yes |
| `guardReceiptRevisionKey` | function | [packages/shared/src/contracts/guard-receipts.ts:29](../../packages/shared/src/contracts/guard-receipts.ts#L29) | Yes |
| `guardDecisionBody` | function | [packages/shared/src/contracts/guard-receipts.ts:55](../../packages/shared/src/contracts/guard-receipts.ts#L55) | Yes |
| `createGuardReceiptCodec` | function | [packages/shared/src/contracts/guard-receipts.ts:68](../../packages/shared/src/contracts/guard-receipts.ts#L68) | Yes |
| `returned.hash` | method | [packages/shared/src/contracts/guard-receipts.ts:76](../../packages/shared/src/contracts/guard-receipts.ts#L76) | Yes |
| `returned.verifyPayload` | method | [packages/shared/src/contracts/guard-receipts.ts:85](../../packages/shared/src/contracts/guard-receipts.ts#L85) | Yes |
| `returned.verifyPublicProof` | method | [packages/shared/src/contracts/guard-receipts.ts:109](../../packages/shared/src/contracts/guard-receipts.ts#L109) | Yes |
| `createReceiptEncoder` | function | [packages/shared/src/contracts/receipt-encoding.ts:39](../../packages/shared/src/contracts/receipt-encoding.ts#L39) | Yes |
| `returned.receiptItemId` | method | [packages/shared/src/contracts/receipt-encoding.ts:47](../../packages/shared/src/contracts/receipt-encoding.ts#L47) | Yes |
| `returned.encodeReceiptLeaf` | method | [packages/shared/src/contracts/receipt-encoding.ts:57](../../packages/shared/src/contracts/receipt-encoding.ts#L57) | Yes |
| `returned.hashReceiptPair` | method | [packages/shared/src/contracts/receipt-encoding.ts:69](../../packages/shared/src/contracts/receipt-encoding.ts#L69) | Yes |
| `returned.buildReceiptTree` | method | [packages/shared/src/contracts/receipt-encoding.ts:80](../../packages/shared/src/contracts/receipt-encoding.ts#L80) | Yes |
| `returned.verifyReceiptProof` | method | [packages/shared/src/contracts/receipt-encoding.ts:110](../../packages/shared/src/contracts/receipt-encoding.ts#L110) | Yes |
| `normalizeIdentity` | function | [packages/untrusted/src/index.ts:68](../../packages/untrusted/src/index.ts#L68) | Yes |
| `isAgentBait` | function | [packages/untrusted/src/index.ts:86](../../packages/untrusted/src/index.ts#L86) | Yes |
| `toUntrusted` | function | [packages/untrusted/src/index.ts:111](../../packages/untrusted/src/index.ts#L111) | Yes |
| `ReceiptsRegistry.owner` | inherited function | [contracts/node_modules/@openzeppelin/contracts/access/Ownable.sol:56](../../contracts/node_modules/@openzeppelin/contracts/access/Ownable.sol#L56) | Yes |
| `ReceiptsRegistry.renounceOwnership` | inherited function | [contracts/node_modules/@openzeppelin/contracts/access/Ownable.sol:76](../../contracts/node_modules/@openzeppelin/contracts/access/Ownable.sol#L76) | Yes |
| `ReceiptsRegistry.pendingOwner` | inherited function | [contracts/node_modules/@openzeppelin/contracts/access/Ownable2Step.sol:33](../../contracts/node_modules/@openzeppelin/contracts/access/Ownable2Step.sol#L33) | Yes |
| `ReceiptsRegistry.transferOwnership` | inherited function | [contracts/node_modules/@openzeppelin/contracts/access/Ownable2Step.sol:43](../../contracts/node_modules/@openzeppelin/contracts/access/Ownable2Step.sol#L43) | Yes |
| `ReceiptsRegistry.acceptOwnership` | inherited function | [contracts/node_modules/@openzeppelin/contracts/access/Ownable2Step.sol:60](../../contracts/node_modules/@openzeppelin/contracts/access/Ownable2Step.sol#L60) | Yes |
