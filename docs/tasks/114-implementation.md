# Task 114 implementation report

Prepared in the worktree; no commit, push, deployment, release approval, external notification or paid run.

Base revision: `e0b906a49ed50e8608d562be409dd566b817a3f3`.
Candidate: base plus the uncommitted files below. Source fingerprint (SHA-256 of sorted relative file names, NUL, file bytes, NUL; excludes this report): `d895fb9b1eeac817b8121fece169ac0d0abd192a01bc48b586824d8aa30cfe5a`.

Renumbered at integration: server migration `0022_watch_alerts` → `0025_watch_alerts` and `meta/0022_snapshot.json` → `meta/0025_snapshot.json`, after `0024_bags`. The journal now has thirteen entries; the new snapshot extends bags with a fresh UUID and linear `prevId`. Historical task evidence below describes the original branch numbering. Normal integrated migrations apply 0025.

## Changes

- `apps/server/drizzle/0022_watch_alerts.sql`, `apps/server/drizzle/meta/_journal.json`, `apps/server/drizzle/meta/0022_snapshot.json`, `apps/server/src/db/schema.ts`: account-owned watches/settings, durable source processing, deduplicated account delivery sequences, Telegram retry leases and consumer cursors. Reserved server migration 0022 only; no engine migration.
- `apps/server/src/alerts/service.ts`: committed verdict/playbook projection consumption and verdict correction records; confirmation checks, watch creation baselines, removals, levels, preferences, quiet hours, measured agent-trade thresholds, restart recovery and Telegram consumer methods. Missing confirmation/enrichment retries with bounded backoff. Current active legacy verdicts supply alerts; Guard 2.0 shadow output is not promoted.
- `apps/server/src/http/v1/watch.ts`, `apps/server/src/http/v1/index.ts`, `apps/server/src/app.ts`: wallet-session GET/POST/DELETE `/v1/watch`, GET/PUT `/v1/alerts/settings`; account-only GET `/v1/alerts?after=<seq>` recovery. Watch lists return `{items}` to match existing web callers. Mutations require an allowed origin and remain blocked for demo sessions. Crew targets/settings are rejected until Drop 2.
- `apps/server/src/ws/hub.ts`: authenticated owner-only `alerts`, persisted subscription sequence/resync, backpressure, per-socket cursors, and tailing deliveries created by another API instance. Global publication cannot broadcast private channels.
- `apps/server/src/obs/metrics.ts`: `alerts.discovery_to_ws_ms`, explicitly excluding delay before source discovery.
- `packages/shared/src/contracts/api.ts`: bounded watch target, nonnegative finite trade threshold, and integer UTC quiet-hour validation.
- `apps/server/test/harness-migrations.test.ts`: exact migration ledger expectations extended to eleven entries, with the new snapshot/table checks; every prior schema and preservation assertion retained.
- `apps/server/test/watch-alerts.test.ts`: 15 tests covering ownership/account switches, wallet-only auth, allowed-origin WS handshake over in-memory streams, demo writes, duplicate sources, correction, removal/re-add, confirmation, pending verdicts, playbook copy isolation, pagination, reconnect/restart/multiple sockets and API instances, missing size/label enrichment, declared/likely trade thresholds, retry leases, stale acknowledgements, consumer cursors and quiet hours.

No dependencies added, no lockfile changes, no existing assertions weakened, no personal identifiers ported or added, and no spec/prototype/Guard logic edited.

## Spec and TODO(spec)

Followed FACTS §7; BACKEND §15.3 and §23 CA-28; FRONTEND §3.11; marketing claims rules. No disagreement with the frozen spec was found. The seven new TODO(spec) notes record:

1. Default settings: web verdict/playbook alerts at every level; Telegram/push and agent-trade alerts off.
2. Equal quiet-hour endpoints mean no quiet period; overnight intervals wrap UTC midnight. Quiet hours suppress new web delivery/toasts; already queued Telegram deliveries wait until outside quiet hours.
3. Task 102's `flow_events` producer is absent here. Consume measured `agent_trade` feed projections when supplied, retaining missing enrichment as pending. No swap-label inference or invented `agent_flow_spike` rule/event.
4. Corrections use `verdict_change` with explicit correction text because there is no frozen correction kind. Original severity supplies correction urgency, not a claim about the current verdict.
5. The first confirmed verdict after a watch begins counts as a verdict change; existing historical sources are baselined rather than replayed on watch creation/re-add.
6. Watch response wrappers are unspecified: GET returns `{items: WatchBody[]}` to match callers; POST returns `WatchBody`; DELETE accepts the same body and returns `{ok:true}`.
7. REST recovery is unspecified: GET `/v1/alerts?after=<seq>` returns ascending owner records with `{rows,cursor,seq}`; paginate until `cursor` is null and retain `seq` for the next resync.

## Checks and evidence

Final source checks:

- `pnpm --filter @eko/server test test/watch-alerts.test.ts test/v1-agents.test.ts test/v1-reads.test.ts --disableConsoleIntercept`: exit 0; 3 files, 27 tests. Log: `/tmp/eko-114-focused-test.log`.
- `pnpm --filter @eko/server test test/harness-migrations.test.ts test/watch-alerts.test.ts --disableConsoleIntercept`: exit 0; 2 files, 21 tests on the final migration/schema; log `/tmp/eko-114-migration-test.log`.
- `pnpm typecheck`: exit 0. Log: `/tmp/eko-114-typecheck.log`.
- `pnpm brand:check`: exit 0; 150 files after builds. Log: `/tmp/eko-114-brand.log`.
- `pnpm check:addresses`: exit 0; 402 source files. Log: `/tmp/eko-114-addresses.log`.
- `git diff --check`: exit 0.

The first `pnpm test` run exited 1 on the unchanged engine CLI SIGINT test's 20-second deadline. Engines had 194 passes and one timeout; this was not a complete successful gate. Log: `/tmp/eko-114-test.log`.
`pnpm --filter @eko/engines test test/cli.test.ts --maxWorkers=1` then exited 0 with both shutdown tests passing. Log: `/tmp/eko-114-cli-repro.log`.

The bounded full-gate retry, `VITEST_MAX_WORKERS=2 npm_config_workspace_concurrency=1 pnpm test`, exited 1: engine/indexer tests passed; server had 304 passes and five migration-ledger count failures in the existing harness migration tests. Those expectations have been extended to the new migration, and the focused migration suite now passes. Log: `/tmp/eko-114-test-bounded.log`. The workspace environment limit was not honored; two Vitest workers per project was the effective limit.

Final gate: `VITEST_MAX_WORKERS=2 pnpm test`: exit 0; 2,692 Vitest tests passed across all workspaces, plus the contract and script checks. Web/server builds and the role-image fixture checks passed. Execution session 42562 completed; log `/tmp/eko-114-test-final.log`. Every existing test was included, with unchanged assertions and timeouts. Final checkpoint: source fingerprint above, all required gates complete; next action is lead review/commit. No process remains running for this task.

The final focused migration/watch fixture measured 84.7 ms from the persisted-source write path to an owner socket, against the <1000 ms target. Sources are explicit offline database fixtures; this is not live chain, production WS, browser toast or launch-acceptance evidence. Runtime latency instrumentation observes committed sources and never creates a source event for measurement. All RPC usage in the task-focused fixtures was zero; external cost $0. Other full-suite fixtures include simulated metered RPC units; they are not live provider evidence. Task-owned logs normalize workspace paths to `<workspace>`.

## Remaining dependencies and reproduction

Task 090's account services and task 035's active verdict projections are reused. Task 102 must supply measured, confirmed flow feed records with point-in-time declared/likely labels, wallet and USD size. Flow-spike alerts remain unavailable until a measured producer/rule is supplied. Telegram consumers can call `claimTelegram` and `settleTelegram`; account linking and actual Telegram sends are downstream, and web push remains at its D0 stage. Task 118 can use the documented private recovery endpoint for the alerts drawer/client resync. Live end-to-end one-second verification remains outstanding and requires actual confirmed source traffic and a connected client.

Reproduce with the commands in Checks. Normal server migrations apply 0022 automatically in a migrated test database. No network, open listening port or live DB is needed for the focused suite.


## Integration verification

File edits only on `integrate-b`; git metadata remains unchanged. Preserved points, bags, and all WebSocket audit rate limits, snapshot scheduling/caps, bounded replies, and `rate_limited` errors. Added task-114 owner delivery/recovery through bounded replies. Deferred resync is flushed by polling after the socket buffer drains, even without another source. The existing backpressure resync assertion now runs after congestion clears; a new assertion forbids every send while congested. All other prior assertions remain intact. Added persisted-subscription/error/late-close coverage and a bags 0024 → watches 0025 upgrade/rerun test.

Integrated candidate source fingerprint (same method as above, excluding this report): `9b921ee0ebae846fd0270a33964be05a8c2808bbab82e918894ec5078fcb0a32`.

- Final focused migration/watch/WebSocket bounds suite: exit 0, 38 tests; `/tmp/eko-int-b-114-focused-final.log`.
- Final `pnpm typecheck`: exit 0; `/tmp/eko-int-b-114-typecheck-final.log`.
- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/server test`: exit 1, 360 passes and a bags privacy fixture failure from unrelated public radar publication. Its isolated one-worker reproduction passed all 18 tests, exit 0. No assertion or timeout was weakened; `/tmp/eko-int-b-114-server.log`, `/tmp/eko-int-b-114-bags-repro.log`.
- `VITEST_MAX_WORKERS=2 pnpm --filter @eko/shared test`: exit 0, 294 tests; `/tmp/eko-int-b-114-shared.log`.
- Final `VITEST_MAX_WORKERS=1 pnpm test`: exit 0, all 2,884 Vitest tests including 361 server and 532 web tests, contract/script checks, web/server builds, and role-image fixture checks; `/tmp/eko-int-b-114-full.log`.
- `git diff --check`: exit 0. Conflict-marker verification: exit 0; marker grep exited 1 because there were no matches. Existing journal entries were checked unchanged, with idx 12/tag `0025_watch_alerts`/when `1790967350435` appended.

The initial focused run exited 1 on the incompatible immediate-over-buffer resync expectation described above; the final focused and full gates passed. No check process remains running. Live chain/Telegram delivery and deployment remain unverified; downstream dependencies and seven task-owned TODO(spec) notes above are unchanged. The lead must stage the edited files and the old/new migration paths before committing the merge.
