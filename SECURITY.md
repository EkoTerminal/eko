# Vulnerability reporting (draft)

Both private reporting channels are open: the `security@ekoterminal.com` role mailbox
(owner-confirmed forwarding, 2026-10-04) and GitHub private vulnerability reporting on
`EkoTerminal/eko` (enabled; checked 2026-10-05). There is no bug bounty: EKO does not pay
for reports (owner decision, 2026-10-05). The public version of this policy is
<https://ekoterminal.com/security>; the contact file is served at `/.well-known/security.txt`.
EKO uses AI-assisted and automated review, not a professional audit.

## Scope

Our deployed contracts, the pre-trade guard and the agent harness are in scope.
Scope also covers the receipts verifier, SIWE, harness keys, MCP OAuth and
the Zodiac Roles permission configuration. A guard bypass that lets a honeypot
fill is Critical. Third-party Pons, Uniswap, Safe and Zodiac contracts, social
engineering and denial-of-service testing are excluded.
At D0 the only new EKO contract is `ReceiptsRegistry`, which holds no funds.
Later contracts enter scope only when deployed. Third-party protocols, brokerage
systems, wallets and infrastructure outside EKO's control are excluded.

Report a reproducible issue privately by email to `security@ekoterminal.com`, or
through GitHub **Security → Report a vulnerability** on the public repository
(<https://github.com/EkoTerminal/eko/security/advisories/new>).
Include the affected version/commit, impact, steps to reproduce and a minimal
proof of concept using local fixtures or a fork. Do not send credentials, private
keys or personal data. The proposed launch response target is 48 hours (within
the BACKEND §14.0 72-hour maximum). We coordinate fixes and disclosure with the
reporter.

## Accepted risks

No finding is currently accepted. The two historical Medium findings (public
WebSocket work accumulation and unverified ETH/USD reference accounting) are
marked fixed in the ledger; this is historical evidence, not acceptance of this
launch candidate. Their status and remediation evidence belong in the
[findings ledger](.audit-grade/findings.tsv); this policy does not close them.
Monitoring delivery remains pending operational setup (the role mailbox and GitHub
private reporting are live), not an accepted vulnerability finding.

The [implemented invariant inventory](docs/security/INVARIANTS.md) links each
covered invariant to exact checking tests and separately lists missing tests.

## Good-faith research and harbour commitment

For good-faith research following this policy, EKO will not pursue legal action
for the research or request a third party to do so. This commitment covers only
systems we control and cannot bind third parties. Keep testing to local copies,
forks or accounts/data you control; stop and report if you encounter another
user's data. Avoid service disruption, moving others' funds, social engineering,
extortion and publication before coordinated disclosure. We will work with
researchers to clarify scope and resolve accidental policy ambiguity.

## Launch timing and readiness

Planned activation is **2026-10-13 at 13:00 UTC**, alongside the public repositories
and the 72-hour review window ending **2026-10-16 at 13:00 UTC**. There is no bug
bounty. D0 sign-off is **October 18**, with a reconfirmation October 19; planned D0
is October 20. A High or Medium fix reopens the full
72-hour window and can postpone sign-off and D0. Deploying the non-fund-holding
receipts registry does not complete review acceptance.

See the [launch checklist and unresolved evidence](docs/public-launch/CHECKLIST.md).
No publication or contact is authorized by preparing these files.

<!-- TODO(spec): GO-PLAN §6.3 specifies 48-hour acknowledgement and activation at T; BACKEND §14.0 says 72 hours and live by D0. This handoff uses the earlier T deadline and stricter 48-hour target. The owner dropped the bug bounty on 2026-10-05; reporting channels stay open. -->

## Privileged powers

This inventory describes the checked-in implementation and declared deployment
configuration, not verified live custody. Holders below are roles only. Hardware
custody and host-secret storage follow BACKEND §18; registry multisig custody is
planned in the [pre-mainnet handoff](contracts/README.md#registry-owner-handoff-before-mainnet).
Production host secrets belong in the role-scoped host secret store, provisioned
from SOPS/age outside git, with an offline age backup. No values are recorded here.
A configured public address is not a secret and does not give the server its key.

**Count: 82 authority entries**, one numbered row per power or named
secret source. Related configuration controls are counted as one authority only
when explicitly grouped in the power column; alternate secret sources and
individual provider credentials have separate rows. Internal ownership helpers
and public read functions are not independent privileged entry points.

Search method: enumerate `contracts/src` and `contracts/script` functions, then
follow the pinned OpenZeppelin `Ownable2Step` and `Ownable` inheritance (5 external
registry mutations plus 2 constructor assignments and 1 deployment authority).
Search `apps`, `packages`, `scripts` and `infra` for route mutations, `admin`,
`operator`, `adminWallets`, `revoke`, `issue`, `rotate`, `featureFlags`,
`trading_live`, `process.env`, `privateKeyToAccount`, `signTransaction`,
`sendTransaction`, `KEY`, `TOKEN`, `PASSWORD` and `COOKIE`; inspect the matching
controllers, config parsers, role launcher, receipts service and backup CLI.
Compare every secret name in the root/indexer `.env.example`,
`infra/backups/config.env.example`, `infra/railway/staging.json`, Railway and
monitoring runbooks/config template and Dockerfile. Inspect source/configuration only, never real
`.env` files, key mounts, credentials or running environment values. Line
references are repository-relative; dependency paths refer to the locked install.
The [frozen scope](.audit-grade/SCOPE.md) concerns the earlier review candidate.

| Power (exact function, route, env var or authority) | Where (file:line) | Holder (role) | Custody | What it can and cannot do | Rotation or revocation path |
| --- | --- | --- | --- | --- | --- |
| 1. `ReceiptsRegistry.commit(bytes32,uint32)` | `contracts/src/ReceiptsRegistry.sol:81` | Registry committer | Gas-only hot key (SOPS); receipts service | Appends nonempty roots at sequential ids; leaked key can append junk. Cannot edit/delete roots, rotate roles or take user funds. | Cold owner calls `setCommitter` with a replacement or zero; stop/reconfigure worker. |
| 2. `ReceiptsRegistry.setCommitter(address)` | `contracts/src/ReceiptsRegistry.sol:93` | Registry owner | Cold hardware; planned 2-of-3 hardware multisig | Replaces committer, including zero to disable commits; cannot change existing batches. | Two-step owner transfer; handoff/recovery linked above. |
| 3. `transferOwnership(address)` (effective two-step override) | `contracts/node_modules/@openzeppelin/contracts/access/Ownable2Step.sol:43` | Current registry owner | Cold hardware; planned multisig | Starts/replaces pending ownership; zero cancels pending transfer. Current owner retains powers until acceptance. | Correct pending destination or cancel with zero; pending owner then accepts. |
| 4. `acceptOwnership()` | `contracts/node_modules/@openzeppelin/contracts/access/Ownable2Step.sol:60` | Pending registry owner only | Intended holder's hardware or multisig | Takes ownership and clears pending owner; individual Safe signers cannot accept for the Safe. | Current owner cancels/replaces pending transfer before acceptance; new owner can transfer afterward. |
| 5. `renounceOwnership()` | `contracts/node_modules/@openzeppelin/contracts/access/Ownable.sol:76`; `contracts/node_modules/@openzeppelin/contracts/access/Ownable2Step.sol:52` | Current registry owner | Cold hardware; planned multisig | Sets owner to zero and clears pending owner, permanently removing rotation/transfer. Existing committer/roots remain. | Irreversible; never call for this registry. |
| 6. Constructor `owner_` / inherited `Ownable(initialOwner)` | `contracts/src/ReceiptsRegistry.sol:69`; `contracts/node_modules/@openzeppelin/contracts/access/Ownable.sol:38` | Deployment operator selects initial owner | Hardware deployer; cold hardware/multisig recipient | Assigns nonzero owner supplied in arguments, not implicitly the deployer. Cannot alter constructor assignment after deployment except ownership calls. | Transfer and acceptance by actual owner/new owner. |
| 7. Constructor `committer_` | `contracts/src/ReceiptsRegistry.sol:69` | Deployment operator selects initial committer | Hardware deployer; gas-only hot recipient | Assigns initial committer; constructor itself permits zero/equal roles, whereas deployment script rejects both. | Owner calls `setCommitter`. |
| 8. `DeployReceiptsRegistry.run()`, `RECEIPTS_OWNER`, `RECEIPTS_COMMITTER` | `contracts/script/DeployReceiptsRegistry.s.sol:12` | Deployment operator | Hardware signer via `--ledger`; role addresses public | Deploys immutable registry with supplied roles, rejects zero/equal roles. No implicit post-deploy authority unless deployer is the selected owner/committer. | Retire deployer use; replace role addresses before deploy; hand off existing owner via two steps. |
| 9. Receipt signing/broadcast service, `APP_ROLE=receipts` | `apps/engines/src/receipts/cli.ts:41`; `apps/server/src/roles.ts:13` | Receipts service operator | Gas-only hot key + host secrets | Signs chain-4663 zero-value registry commits and broadcasts retained transactions. A raw key compromise can spend that key's gas funds; no user keys. | Stop service, on-chain committer rotation, secret reload; preserve pending-attempt records. |
| 10. `BURN_WALLET_ADDRESS` / `ours.burnWallet`; manual daily signing and weekly bridge role | `apps/server/src/config.ts:85`; `packages/chain/addresses.4663.yaml:30`; `docs/eko/04-BACKEND.md:2447` | Public burn-wallet operator | Separate hardware or 2-of-3 hardware multisig per spec; never server | Intended recipient of terminal fees, paid-API/x402 revenue and token payments only, never creator/dev fees. Manual signing controls those receipts; configured address confers no signing key. Burn/bridge tools are not implemented in this checkout. | Fresh hardware wallet and disclosed address update; update future `X402_PAY_TO` with it (BACKEND §§12.5, 15.5, 18). |
| 11. `DEV_FEE_WALLET` / `ours.devWallet`; creator-fee and launch signer role | `apps/server/src/config.ts:87`; `packages/chain/addresses.4663.yaml:31`; `docs/eko/04-BACKEND.md:2448` | Public creator-fee operator | Separate hardware | Creator-fee recipient; pays running costs. Public disclosure config only today; never the terminal fee destination or a burn-service key. | Replace/disclose public role and configure creator recipient under applicable protocol rules; no server key. |
| 12. User transaction signing authority | `apps/server/src/http/routes.ts:255`; `apps/server/src/exec/trade-access.ts:62` | User wallet operator | User-controlled wallet; outside host custody | User signs unsigned preparations; server access controls gate preparation, not arbitrary wallet transfers. Server has no user signing key. | User revokes wallet approvals/permissions; session logout only revokes EKO access. |
| 13. `ADMIN_WALLETS` and database `accounts.role` | `apps/server/src/config.ts:152`; `apps/server/src/http/auth.ts:44` | Release operator / DB administrator | Host configuration + admin wallet (hardware intended) | Allowlist grants computed admin role; otherwise stored role is returned. Trading admin checks resulting role; monitoring independently requires configured wallet allowlist. Does not confer on-chain registry ownership. | Remove allowlist entry, remove persisted admin role if present, invalidate sessions; restart affected replicas. |
| 14. `PUT /v1/admin/trading/allowlist/:wallet` | `apps/server/src/http/v1/trade-admin.ts:26` | Wallet-session administrator | Wallet sign-in + signed session | Adds/updates wallet role/cap with audit record; caps cannot exceed configured beta role ceiling. Origin required; demo sessions refused. | DELETE route removes grant; revoke administrator access as above. |
| 15. `DELETE /v1/admin/trading/allowlist/:wallet` | `apps/server/src/http/v1/trade-admin.ts:40` | Wallet-session administrator | Wallet sign-in + signed session | Removes trading allowlist entry and logs it; does not revoke wallet funds/approvals. | Re-add via PUT after review; revoke admin access as above. |
| 16. `PUT /v1/admin/trading/live` / `trading_live` | `apps/server/src/http/v1/trade-admin.ts:49`; `apps/server/src/flags/service.ts:80` | Wallet-session administrator | Wallet sign-in + host session | Sets durable runtime stop/resume; cannot enable above `LIVE_TRADING_ENABLED` ceiling. Execution reads durable switch each time, failing closed. | PUT enabled=false; lower host ceiling; revoke admin access. |
| 17. `POST /admin/incident` | `apps/server/src/http/launch-monitoring.ts:47`; `apps/server/src/obs/incidents.ts:13` | Configured allowlisted wallet administrator | Wallet sign-in + signed session | Records supported incident; guard miss/RPC outage/simulation failure turn trading off before delivery. Stale committer records only; no key rotation, public post or automatic restart. | Resume via trading admin only after incident checks; revoke allowlist/session access. |
| 18. `POST /v1/admin/monitoring/measurements` | `apps/server/src/http/launch-monitoring.ts:56` | Configured allowlisted wallet administrator | Wallet sign-in + signed session | Writes schema-bounded operational measurements and audit log; can affect monitoring evidence, not directly signing or registry roots. | Revoke admin access; correct observations and retain audit record. |
| 19. `FLAGS` product override | `apps/server/src/flags/service.ts:5`; `apps/server/src/config.ts:73` | Release operator | Host configuration | Enables recognized product flags (including `d0` expansion), overrides DB false; rejects ops switches/unknown names. No user-fund authority. | Remove overrides and restart; turning DB flag off alone cannot override host enable. |
| 20. SQL `feature_flags` administration (product flags and `swarm_ranking`) | `apps/server/src/flags/service.ts:55`; `packages/shared/src/flags.ts:26`; `infra/railway/README.md:87` | DB administrator | Host DB credential | Sets public product/ops rows; product cache lasts 10s, trading stop bypasses cache. No generic public flag-write API. | Disable rows, remove host overrides, revoke SQL grant; preserve audit provenance. |
| 21. `LIVE_TRADING_ENABLED` | `apps/server/src/config.ts:151`; `apps/server/src/exec/trade-access.ts:29` | Release operator | Host configuration | Absolute live-execution ceiling, ANDed with durable trading switch; does not sign transactions. | Set false and restart all affected services; runtime stop for immediate response. |
| 22. `TRADING_ALLOWLIST_ONLY`, `TRADE_CAPS_FROM`, `TRADE_CAPS_FILE`, `TRADE_MAX_USD` | `apps/server/src/config.ts:81`; `apps/server/src/exec/trade-access.ts:33` | Release operator | Host configuration + reviewed cap file | Controls trading admission and scheduled/absolute caps; unset public start gives zero cap, config validates ceilings. Does not override mandatory execution checks. | Restore restrictive config and restart; runtime stop while changing. |
| 23. `FEE_ACTIVE_FROM`, `TIERS_ACTIVE_FROM`, `FEE_BPS_DEFAULT`, burn destination config | `apps/server/src/config.ts:78`; `apps/server/src/harness/entitlements.ts:1` | Release operator | Host configuration | Controls fee/tier activation and public fee metadata. All terminal fee paths must target public burn role only; config changes give no custody. | Stop execution, correct configuration, validate prepared fee legs and restart; never point fees to dev role. |
| 24. `LAUNCH_WEEK_AGENT_LIMIT`, `POINTS_ACTIVE_FROM`, `POINTS_RATES` | `apps/server/src/config.ts:63`; `apps/mcp/src/runtime.ts:27` | Release operator | Host configuration | Sets launch entitlements and points timing/rates; unset quota unavailable. Does not mint tokens or authorize wallet execution. | Remove/restrict configuration and restart consumers. |
| 25. `AI_DAILY_BUDGET_USD`, `AI_MAX_CALLS_PER_BOT_HOUR`, gateway/model config | `apps/server/src/config.ts:134`; `apps/server/src/ai/registry.ts:62` | Release operator | Host configuration; provider credentials below | Controls provider routing and the daily ceiling on paid model use; model output grants no signing authority. `AI_MAX_CALLS_PER_BOT_HOUR` is reserved: parsed and reported, never enforced, and no AI bot path exists in code. | Budget zero disables AI; revoke provider credentials, replace config/restart. |
| 26. `APP_ROLE`, `RUN_WORKER`, service stop/restart, singleton lease | `apps/server/src/roles.ts:28`; `Dockerfile:28`; `infra/railway/README.md:154` | Deployment/host operator | Host/platform control account | Selects available process and starts/stops workers; singleton locks avoid duplicates. Does not implicitly enable trading; absent roles refuse startup. Host compromise can replace code/read mounted secrets. | Revoke platform access, isolate host, stop roles, deploy reviewed image and rotate exposed secrets. |
| 27. `MIGRATIONS_DIR`, `pnpm db:migrate`, startup engine/indexer migrations | `apps/server/src/db/client.ts:20`; `apps/server/src/db/migrate-cli.ts:1`; `apps/engines/src/receipts/cli.ts:35` | Migration/release operator | Host DB credential + controlled migration files | Executes schema SQL with connection's privileges; privileged SQL can change off-chain data/auth. No on-chain root editing or user private keys. | Revoke DDL credential/access, freeze migrations, restore isolated verified state; no automatic rollback claim. |
| 28. `ENABLE_DEV_ROUTES` / `LEGACY_API` dev-route registration | `apps/server/src/http/routes.ts:451`; `apps/server/src/config.ts:90` | Local development host operator | Local host configuration | Exposes simulated feed pause/outage/paper funding only with legacy API and non-production mode; production refuses dev routes. No live-wallet funding. | Disable switches and restart; never expose this local authority as production admin. |
| 29. `POST /api/dev/feed/pause` | `apps/server/src/http/routes.ts:452` | Caller with access to enabled local dev server | Local host boundary; no admin wallet check | Pauses simulated feed only; cannot pause chain/registry. | Disable dev routes or isolate local listener. |
| 30. `POST /api/dev/providers/outage` | `apps/server/src/http/routes.ts:459` | Caller with access to enabled local dev server | Local host boundary; no admin wallet check | Simulates bounded provider outage; does not revoke real credentials. | Disable dev routes or isolate local listener. |
| 31. `POST /api/dev/paper/fund` | `apps/server/src/http/routes.ts:465` | Local account session | Local host + session | Changes own paper balances; no real funds or other account grant. | Disable dev routes/session; reset paper state. |
| 32. `POST /v1/agents` | `apps/server/src/http/v1/agents.ts:52` | Account's verified wallet operator | User wallet + signed session | Creates own agent within entitlement; does not create a funded server wallet. | Disconnect own agent; revoke session. |
| 33. `PATCH /v1/agents/:id` | `apps/server/src/http/v1/agents.ts:57`; `apps/server/src/harness/service.ts:65` | Owning account | User wallet + signed session | Updates own agent; status gated by `mission_kill`, drives killed policy; disconnect revokes keys. No brokerage/chain permission revocation. | Set paused/disconnected; revoke session/key. |
| 34. `DELETE /v1/agents/:id` | `apps/server/src/http/v1/agents.ts:62` | Owning account | User wallet + signed session | Disconnects own agent, revokes credentials, retains policy history; does not delete chain receipts. | Re-enroll only within entitlements; revoke session. |
| 35. `PUT /v1/agents/:id/policy` | `apps/server/src/http/v1/agents.ts:69`; `apps/server/src/harness/service.ts:84` | Owning account | User wallet + signed session | Saves versioned advisory policy when `policy_editor` on; cannot grant on-chain execution permissions. | Save restrictive policy, kill/disconnect agent, revoke session. |
| 36. `POST /v1/agents/:id/keys` | `apps/server/src/http/v1/agents.ts:74`; `apps/server/src/harness/service.ts:102` | Owning account | User wallet + session; issued bearer held by client | Issues API bearer once; only HMAC stored. Scope is harness access, no user transaction signing. | DELETE key route; disconnect agent; pepper rotation invalidates old credentials. |
| 37. `DELETE /v1/agents/:id/keys/:keyId` | `apps/server/src/http/v1/agents.ts:79`; `apps/server/src/harness/service.ts:120` | Owning account | User wallet + signed session | Revokes owned key; MCP checks HMAC/revocation every request. Cannot revoke another account's key via route. | Issue new key through authenticated owner flow. |
| 38. `PUT /v1/me/journal-consent` | `apps/server/src/http/v1/journal.ts:35` | Owning account | User wallet + signed session | Controls own private journal opt-in; does not imply public sharing or signing approval. | Opt out; delete data for irreversible destruction. |
| 39. `DELETE /v1/me/data` | `apps/server/src/http/v1/journal.ts:36`; `apps/server/src/harness/journal.ts:73` | Owning account | User wallet + signed session; destruction ledger host mount | Destroys own wrapped DEKs/private access, revokes credentials; retains irreversible receipt hashes. Cannot erase on-chain batches. | No undo of destruction; preserve current ledger on every restore. |
| 40. `POST /oauth/register`, `GET /oauth/authorize`, verified client snapshots | `apps/mcp/src/app.ts:89`; `apps/mcp/src/oauth.ts:49`; `apps/mcp/src/runtime.ts:63` | Prepared discovery service / configuration operator | Host configuration + pepper; unauthenticated registration if wired | Prepared allowlisted registration/PKCE request storage, not grant/token issuance. Runtime omits discovery; enabling OAuth is refused. | Remove snapshot/redirect allowlist, prune requests/clients; keep connector disabled pending acceptance. |
| 41. `MCP_OAUTH_ENABLED`, `/oauth/token`, `/oauth/revoke` lifecycle boundary | `apps/mcp/src/runtime.ts:20`; `apps/mcp/src/oauth.ts:89` | Future connector release operator | Intended host secrets; no active issuance custody | Only false/0 accepted. Advertised token/revocation URLs are metadata in scaffolding; no handlers, tokens or OAuth grants currently issued/revoked. | Keep disabled; future grant revocation/re-consent must be implemented before enabling. |
| 42. `SESSION_SECRET` | `apps/server/src/config.ts:68`; `.env.example:38` | API service / secret-store operator | Host secret; development-only persisted generated file | Signs cookies; a signature alone cannot create a valid DB-backed session. Host + DB compromise can impersonate sessions. | Replace secret on all replicas/restart; expire affected DB sessions. |
| 43. `HARNESS_KEY_PEPPER` | `apps/server/src/config.ts:72`; `apps/server/src/harness/service.ts:109`; `apps/mcp/src/runtime.ts:18` | API/MCP services / secret-store operator | Shared role-scoped host secret | HMACs stored API keys and rate subjects; alone cannot create a matching DB key record. No chain signing. | Rotate consistently; revoke/reissue keys. Future OAuth tokens require re-consent per §18; no current token lifecycle. |
| 44. `JOURNAL_KEK` | `apps/server/src/config.ts:69`; `apps/server/src/harness/journal.ts:74` | API journal service / restore operator | Host secret + separate offline age backup; never DB | Unwraps live per-account DEKs with DB material; cannot recover destroyed DEKs via authorized service/current ledger. No funds signing. | §18 requires re-wrap before retiring old KEK; no turnkey rotation CLI exists. Do not simply replace and lose access. |
| 45. `DEMO_SECRET` | `apps/server/src/config.ts:74`; `.env.example:77` | API service / secret-store operator | Host secret | HMACs 24-hour demo tokens; demo sessions cannot perform authenticated writes/trades. | Replace on all replicas/restart; old demo tokens fail validation. |
| 46. `DATABASE_URL` | `apps/server/src/db/client.ts:26`; `infra/railway/staging.json:50` | Role service / DB administrator | Host secret, private Postgres credentials | SQL privileges of the assigned DB role; broad application grants can mutate auth, flags and receipts data. DB alone lacks separate KEK and on-chain role keys. | Rotate password/role grants, terminate old sessions, update all role secrets. |
| 47. `RECEIPTS_COMMITTER_KEY` | `apps/engines/src/receipts/cli.ts:14`; `.env.example:183` | Receipts service | SOPS-provisioned gas-only hot key, receipts host only | Signs registry commits; raw stolen key can spend its own gas. Cannot sign user transactions or change owner. | On-chain `setCommitter` then replace environment secret and restart. |
| 48. `RECEIPTS_COMMITTER_KEY_FILE` | `apps/engines/src/receipts/cli.ts:19`; `.env.example:185` | Receipts service / mount operator | Restricted host-secret key mount; env is path only | Alternate committer source, exactly one source required; re-read per fresh attempt. Pending raw transactions retain old signer. | Rotate on-chain, replace restricted file; preserve/reconcile pending attempts. |
| 49. `RPC_HTTP_URL` | `packages/chain/src/rpc/metered.ts:7`; `apps/indexer/src/cli.ts:17`; `infra/railway/staging.json:78` | RPC-consuming services / secret-store operator | Credential-bearing URL in host secret store | Paid RPC access/spend and provider selection; no signing key. Provider influences observed data, not immutable roots. | Revoke provider credential, update URL/restart all consumers and inspect budget/provenance. |
| 50. `RPC_WS_URL` | `packages/chain/src/rpc/metered.ts:7`; `infra/railway/staging.json:79` | Indexer/RPC services | Credential-bearing host-secret URL | Paid WS access/head observations; no transaction signing authority. | Revoke provider credential, update/reconnect consumers. |
| 51. `RH_MAINNET_RPC_URL` | `apps/server/src/config.ts:149`; `apps/server/src/app.ts:160` | API chain-read service | Host secret if authenticated URL | Legacy mainnet endpoint input; reads routed through shared metering. No user signer. | Revoke provider credential, replace URL/restart. |
| 52. `RH_TESTNET_RPC_URL` | `apps/server/src/config.ts:148`; `apps/server/src/app.ts:160` | Development/testnet chain-read service | Host secret if authenticated URL | Legacy testnet endpoint input; no mainnet signing key. | Revoke provider credential, replace URL/restart. |
| 53. `RPC_FALLBACK_HTTP_URL` | `apps/indexer/.env.example:9` | Template configuration operator | Host secret if authenticated URL; currently no consumer | Named fallback placeholder only; indexer parser/meter do not implement this input. Does not establish failover. | Remove unused input; never rely on it for incident recovery. |
| 54. `OPENAI_API_KEY` | `apps/server/src/config.ts:104`; `apps/server/src/ai/registry.ts:79` | Model service | Host secret | Provider model access/spend only; no wallet authority. | Revoke at provider; update/restart API/worker consumers. |
| 55. `ANTHROPIC_API_KEY` | `apps/server/src/config.ts:106`; `apps/server/src/ai/registry.ts:78` | Model service | Host secret | Provider model access/spend only; no wallet authority. | Revoke at provider; update/restart consumers. |
| 56. `GEMINI_API_KEY` | `apps/server/src/config.ts:108`; `apps/server/src/ai/registry.ts:80` | Model service | Host secret | Provider model access/spend only; no wallet authority. | Revoke at provider; update/restart consumers. |
| 57. `XAI_API_KEY` | `apps/server/src/config.ts:110`; `apps/server/src/ai/registry.ts:81` | Model service | Host secret | Provider model access/spend only; no wallet authority. | Revoke at provider; update/restart consumers. |
| 58. `DEEPSEEK_API_KEY` | `apps/server/src/config.ts:112`; `apps/server/src/ai/registry.ts:82` | Model service | Host secret | Provider model access/spend only; no wallet authority. | Revoke at provider; update/restart consumers. |
| 59. `MISTRAL_API_KEY` | `apps/server/src/config.ts:114`; `apps/server/src/ai/registry.ts:83` | Model service | Host secret | Provider model access/spend only; no wallet authority. | Revoke at provider; update/restart consumers. |
| 60. `GROQ_API_KEY` | `apps/server/src/config.ts:116`; `apps/server/src/ai/registry.ts:84` | Model service | Host secret | Provider model access/spend only; no wallet authority. | Revoke at provider; update/restart consumers. |
| 61. `OPENROUTER_API_KEY` | `apps/server/src/config.ts:118`; `apps/server/src/ai/registry.ts:86` | Model service | Host secret | Provider model access/spend only; no wallet authority. | Revoke at provider; update/restart consumers. |
| 62. `GATEWAY_API_KEY` | `apps/server/src/config.ts:125`; `scripts/setup-ai.mjs:26` | Model service / local setup operator | Production host secret; local `apps/server/.env` created mode 0600 | Gateway model access/spend for providers without direct keys; not transaction signing. | Revoke at gateway, update/restart consumers; keep generated env out of git. |
| 63. `SENTRY_DSN` | `apps/server/src/config.ts:101`; `.env.example:65` | Error-reporting service | Host configuration treated as secret ingestion endpoint | Sends error/incident telemetry; DSN does not give Sentry administrative access. Not currently an active paging adapter. | Rotate ingestion endpoint, update/restart reporting services. |
| 64. `BACKUP_SOURCE_DATABASE_URL` | `infra/backups/config.env.example:2`; `apps/server/src/ops/backup-cli.ts:31` | Backup operator | Restricted host secret; read-only source role intended | Logical dump/inventory with scoped cluster-identity read; no source writes under required grants. Encrypted journal requires separate KEK to read. | Rotate DB credential/grants, terminate connections, update operator secret. |
| 65. `BACKUP_REPLICATION_DATABASE_URL` | `infra/backups/config.env.example:3`; `apps/server/src/ops/backup-cli.ts:126` | Physical-backup operator | Restricted host secret; scoped replication grant | Streams physical base/WAL data; confidentiality authority over DB state, no app signing key. | Rotate replication credential, remove grant, terminate replication sessions. |
| 66. `RESTORE_ADMIN_DATABASE_URL` | `infra/backups/config.env.example:4`; `apps/server/src/ops/backup-cli.ts:64` | Isolated restore administrator | Host secret restricted to different disposable cluster | Creates fresh restore DB and restores data; source/target identity guard refuses same cluster. Actual DB grants determine broader potential DDL access. | Revoke isolated admin credential and disconnect target; never route production to failed drill. |
| 67. `BACKUP_IDENTITY_FILE` | `infra/backups/config.env.example:10`; `apps/server/src/ops/backup-cli.ts:21` | Restore operator | Restricted age private-identity mount; offline backup | Decrypts backup/WAL ciphertext, exposing DB state; alone cannot decrypt KEK-protected journal payloads. Env contains path only. | Replace identity/recipients for future backups; retain old recovery key until retained ciphertext expires; compromise of old ciphertext cannot be undone. |
| 68. Derived libpq `PGDATABASE` / `PGPASSWORD` | `apps/server/src/ops/backup-cli.ts:19`; `apps/server/src/ops/backup-cli.ts:75` | Backup/restore subprocess | Short-lived child environment derived from host DB URL | Credential transport aliases, not additional independent DB roles; never command arguments/log evidence. | Rotate parent DB credentials, stop child processes and clear operator environment. |
| 69. `OPS_SESSION_COOKIE` | `scripts/ops.mjs:14`; `infra/monitoring/README.md:66` | Incident command operator | Operator host secret / short-lived admin session | Authenticates explicit `--execute` incident POST with approved Origin; cannot bypass server wallet allowlist or sign on-chain. | Log out/delete DB session, clear operator cookie; remove admin role/allowlist if compromised. |
| 70. `TELEGRAM_BOT_TOKEN` | `infra/railway/staging.json:195` | Planned notification bot service | Role-scoped host secret | Future bot account messaging credential; `bots` image role currently unavailable. No trade approvals/signing. | Revoke/reissue through bot platform, update secret before accepted bot release. |
| 71. `TELEGRAM_WEBHOOK_SECRET` | `infra/railway/staging.json:196` | Planned notification bot service | Role-scoped host secret | Future webhook authentication, not wallet authority; no accepted runtime handler yet. | Rotate secret and webhook registration together before enabling. |
| 72. `BLOCKSCOUT_API_KEY` | `packages/chain/src/abi-pull-cli.ts:8` | ABI acquisition operator | Operator host secret | Explorer ABI API access only; no on-chain signer or bytecode-verification proof. | Revoke explorer credential, replace operator input. |
| 73. `JOURNAL_TOMBSTONE_PATH` / destruction-ledger mount authority | `packages/db/src/crypto/destruction.ts:11`; `infra/backups/config.env.example:15` | Journal host/storage operator | Separate restricted durable host mount; not a secret value | Append-only destruction state gates journal/credential access after restores. Host tampering can undermine that boundary; DB backups must never replace it. | Revoke filesystem/host access, recover current monotonic ledger independently; do not reset/truncate it. |
| 74. SOPS/age provisioning and host secret-store administration | `docs/eko/04-BACKEND.md:2462`; `infra/railway/README.md:56` | Secret-store operator | Offline age identity + scoped host/platform access | Can provision/expose role secrets; encrypted files/identities are external, no secret decryption invoked here. No user keys belong in this store. | Revoke provisioning access, re-encrypt to replacement recipients, rotate every exposed downstream credential. |
| 75. Railway/host deployment, DB platform, backup/object-storage, monitoring administration | `infra/railway/README.md:154`; `infra/backups/README.md:27`; `infra/monitoring/README.md:8` | Infrastructure operator | External platform/host control credentials; no named credential vars in repository | Controls releases, volumes, snapshots and telemetry configuration; monitoring receiver templates require host endpoint provisioning. Platform grants are not proven live; host compromise reaches mounted service secrets, not hardware keys. | Revoke platform/host sessions and grants, isolate affected deployment, replace exposed secrets and verify recovery. |

| 76. `POST /v1/auth/siwe/verify` / legacy `POST /api/auth/verify` | `apps/server/src/http/v1/account.ts:38`; `apps/server/src/http/routes.ts:184` | Wallet owner / authentication service | User wallet signature + host session secret | Verifies challenge and issues DB-backed wallet session; an allowlisted wallet gains configured admin access. No server wallet signing key is obtained. | Logout/expire DB sessions; remove compromised admin grants and rotate wallet externally. |
| 77. `POST /v1/auth/logout` / legacy `POST /api/auth/logout` | `apps/server/src/http/v1/account.ts:52`; `apps/server/src/http/routes.ts:198` | Current session holder | Client session cookie | Destroys current session and clears cookie; does not revoke agent bearer keys or external wallet permissions. | Reauthenticate after logout; revoke agent keys separately. |
| 78. `ADDRESSES_FILE` / address-manifest release authority | `packages/chain/src/registry.ts:68`; `Dockerfile:36`; `apps/server/src/exec/trade-access.ts:47` | Release operator | Controlled host file + reviewed configuration | Selects receipt registry and verified router/spender entries. Can redirect consumers to another configured target; the worker registry/gas collectors require its accepted registry to match `RECEIPTS_REGISTRY_ADDRESS`. No ownership/key is conferred. Integrity depends on accepted manifest/code verification. | Stop affected services/trading; restore accepted manifest and independently verify addresses/code/roles before restart. |
| 79. `OFAC_SDN_URL` / sanctions snapshot source authority | `apps/server/src/config.ts:98`; `apps/server/src/sanctions/source.ts:11`; `apps/server/src/sanctions/service.ts:76`; `.env.example:62` | Worker release operator | Host configuration; public Treasury HTTPS source | Selects sanctioned-address data source: credential-free HTTPS on a Treasury host (`treasury.gov` or a subdomain, or the Sanctions List Service host). The downloader follows at most three redirects by hand; every hop must pass the same check or, for redirects only, be Treasury's published-file bucket. Missing usable snapshot refuses executable quotes/orders; cannot grant signing permission. | Stop execution, replace verified source, refresh complete snapshot; do not bypass missing data. |
| 80. `RPC_PAID_MAX_RPM`, `RPC_PUBLIC_MAX_RPM`, `RPC_PAID_DAILY_BUDGET`, `RPC_SESSION_BUDGET`, `RPC_WEIGHTS` | `packages/chain/src/rpc/metered.ts:38`; `.env.example:174` | RPC-consuming release operator | Host configuration | Controls metered provider spend/limits; can halt acquisition at budget closure. Worker security collectors share this meter and report unavailable without requests when daily/session budgets are zero. No signer custody or permission to bypass execution checks. | Lower budgets/stop services; rotate provider credential separately when compromised. |
| 81. `OPS_ALERT_WEBHOOK_URL` | `infra/monitoring/render-alertmanager.mjs:4`; `infra/monitoring/config.env.example:2` | Monitoring release operator | Host secret environment; rendered 0600 file outside git | Selects HTTPS ops receiver for alerts; a credential-bearing webhook can authorize delivery at its receiver. Does not grant trading or on-chain authority. | Revoke endpoint credential at issuer, provision replacement, render new config and reload Alertmanager; confirm acknowledgement. |
| 82. `ONCALL_ALERT_WEBHOOK_URL` | `infra/monitoring/render-alertmanager.mjs:4`; `infra/monitoring/config.env.example:3` | Monitoring release operator | Host secret environment; rendered 0600 file outside git | Selects HTTPS on-call receiver for severity 1/2 and unmatched alerts; does not grant trading or on-chain authority. | Revoke endpoint credential at issuer, provision replacement, render new config and reload Alertmanager; confirm acknowledgement. |

`JOURNAL_KEK_ID` is a public key-version label; `BACKUP_RECIPIENTS_FILE` supplies
public encryption recipients and `PGSSLROOTCERT` a public CA certificate.
`TEAM_ALERT_CHAT_ID`, role addresses, origins, resource paths, revision hashes,
restore fixture UUID inputs and `RPC_PUBLIC_HTTP_URL` are configuration, not
secret credentials. Dockerfile sets only nonsecret defaults and runtime paths;
Railway's `secretNames` declares role-scoped injection, not values or live grants.
Public/browser inputs must not carry provider credentials. Mounted private key
and age identity contents are covered separately above.

The only implemented funded off-chain signer found is the gas-only receipts
committer. BACKEND §18 also names future `PREFLIGHT_SIGNER_KEY` (optional hot
attestation service, no funds), `X402_FACILITATOR_KEY` (Base settlement gas only),
`KEEPER_KEY` (two future gas-only Drop 7 keepers), a future hardware Burn Engine
owner and an undecided optional sweep role. None has an implemented signing
consumer or deployed authority in this checkout; do not provision them as
current powers. Future `X402_PAY_TO` must be the disclosed public burn role,
never the dev role. Their release requires an updated inventory and the specified
review gates (BACKEND §§14.5, 14.9, 15.5, 18; FACTS §§5–7).

// TODO(spec): §18 specifies intended hardware/host custody but not live holder
// verification, database grant separation or a turnkey KEK rotation procedure.
// Confirm deployed roles/grants/mounts in the release record; implement and prove
// DEK re-wrapping before rotating KEK. No live custody or rotation is asserted.


## Incident runbook

Applies to the implemented receipt registry, unsigned execution preparation and
runtime trading controls (BACKEND §§12.4, 13, 18, 21.4). Alerts and fixture tests do
not establish live delivery. See [monitoring setup and implemented collectors](infra/monitoring/README.md).
There is no registry pause method and no deployed Drop 7 keeper assumed here.

### Contacts and authority

| Role | Responsibility | Contact |
| --- | --- | --- |
| Incident commander / on-call operator | Declare incident, coordinate stop, retain timeline, verify recovery | TODO(owner): designate on-call rota and escalation contact; `ONCALL_ALERT_WEBHOOK_URL` |
| Ops responder / wallet-session administrator | Durable trading stop, role services, providers and secret reload; triage singleton worker registry/outflow/reference/gas collectors | TODO(owner): designate responder; `OPS_ALERT_WEBHOOK_URL` |
| Registry owner (cold hardware; intended 2-of-3 Safe before mainnet) | Revoke/rotate committer, cancel/accept ownership transitions; reconcile worker registry event and current-committer gas alerts | TODO(owner): confirm live custody and owner signers via [handoff](contracts/README.md#registry-owner-handoff-before-mainnet) |
| Burn-wallet operator (separate hardware or 2-of-3 Safe) | Hold daily ritual, reconcile receipt-checked worker outflow/wrong-token evidence and recorded intents, replace/disclose burn address | TODO(owner): confirm wallet custody and escalation |
| Indexer / worker release operator | Canonical collector cursors/reorg recovery, trusted reference repair, RPC budget and threshold configuration; escalate unavailable coverage to ops/on-call | TODO(owner): designate release responder and escalation contact |
| Communications / disclosure coordinator | Private advisories, service notice, correction and post-mortem | TODO(owner): designate publisher |

`SECURITY_COLLECTORS` enables read-only worker observations and records owner-approved raw asset thresholds and exact ritual/bridge intents; default `{}` disables all collectors. It adds no signing authority. Server migration `0034` retains block/log checkpoints and canonical evidence. Unavailable measurements expire after five minutes and must be escalated, including unconfigured collectors. TODO(owner): accept start blocks, thresholds, contacts and HTTPS receivers, then retain staging drill acknowledgements; fixture tests do not establish delivery.

Contacts are roles, not personal identities. The incident commander records the
candidate revision, chain 4663, registry address, first observation, scope,
transaction hashes, actions, timestamps and acknowledgements in private incident
storage. Preserve logs with credentials/cookies/private journal content redacted.

### Pause, verify and resume

1. The wallet-session administrator signs in from the configured allowed Origin
   and sends `PUT /v1/admin/trading/live` with `{"enabled":false}`. A wallet admin
   role is required; demo sessions cannot mutate. If admin access is unavailable,
   the release operator sets `LIVE_TRADING_ENABLED=false` and redeploys/restarts
   every API replica, then verifies the ceiling. Do not rely on a product flag.
2. For a guard miss, RPC outage or simulation failure, the allowlisted ops admin
   uses `POST /admin/incident` with the appropriate finite `kind`. Alternatively,
   `pnpm ops guard_miss --execute` or `pnpm ops rpc_outage --execute` uses
   `OPS_API_ORIGIN`, `OPS_PUBLIC_ORIGIN` and `OPS_SESSION_COOKIE` provisioned in
   the secret environment. Running without `--execute` only prepares the request.
   Stop and audit commit before delivery. `stale_committer` records an incident
   without stopping trading; unsupported kinds, including `key_compromise` and
   `burn_anomaly`, require the manual procedures below.
3. Verify the response and durable `feature_flags` row (`trading_live=false`),
   `trading.live_changed` / `ops.incident` audit entries, and
   `/v1/config` → `trading.liveEnabled=false` on each replica with a real session.
   Reusing an existing quote/order request must return `trading_paused` and no
   new execution bytes; check `eko_trading_live 0` in a fresh metrics scrape.
   This gauge reports the durable switch only, not the host ceiling. Existing
   wallet-signed transactions and approvals remain outside this stop's control.
4. Check delivery audit entries for `delivered`, `failed` or `unavailable`;
   independently obtain on-call acknowledgement. The checked-in incident page
   sink has no production transport: Alertmanager receiver delivery is a separate
   channel. A 200 incident response alone is not proof of paging.
5. Keep trading off while reproducing/fixing the cause and validating the relevant
   invariant tests, Guard/Normalizer fixtures, sanctions/provider inputs and
   collector freshness. The incident commander records recovery authorization;
   the wallet admin alone resumes via `PUT /v1/admin/trading/live` with
   `{"enabled":true}` under the host ceiling. Verify each replica and retain the
   resume audit entry. No automatic resumption is implemented.

### Committer rotation and owner actions

For suspected committer compromise, **revoke/rotate first**, before extended
forensics. Stop the receipts service; the cold owner calls `setCommitter` with a
fresh gas-only role, or zero immediately if a replacement is not ready. Stopping
the host alone does not revoke a leaked key. No user funds are held by this role.

Generate the replacement key on the designated receipts host using the approved
secret provisioning procedure; fund only its gas budget. Two responders verify
chain, registry, new public role and owner before the owner signs from hardware.
If ownership has moved to a Safe, the required Safe threshold executes the call;
an individual signer cannot act as the Safe. Confirm `CommitterChanged` and
`committer()` at a canonical block, replace the role-scoped host secret, restart
one receipts worker, and verify new commits and canonical anchors. Preserve
pending attempt/outbox records: reconcile old signed transactions and sequential
batch ids rather than deleting/reusing them. Routine rotation is quarterly;
incident rotation is immediate (BACKEND §13).

Review every `OwnershipTransferStarted`, `OwnershipTransferred` and
`CommitterChanged` alert against an approved change record, even during scheduled
maintenance. Read `owner()`, `pendingOwner()` and `committer()` independently.
The current owner cancels an unwanted pending transfer with
`transferOwnership(address(0))`, or replaces it; acceptance must be executed by
the intended pending owner. An already completed transfer needs action by the
new owner. Follow the [two-step handoff](contracts/README.md#registry-owner-handoff-before-mainnet)
and verify threshold/custody before use. Never call `renounceOwnership`: it
permanently removes rotation. Disabling the committer does not pause user trading;
use the trading switch separately.

### RPC/provider outage or indexer lag

Raise `rpc_outage` and verify the trading stop. Ops checks indexer heartbeat,
indexed-head age, provider health and chain consistency using the configured
public/paid provider roles and budgets. Keep metering and fail-closed checks on.
Switch only to an approved chain-4663 endpoint; do not send credentials to an
unverified replacement. Retain the cursor, recover canonical head/reorg state,
and check reference-price freshness and pending accounting before resuming.
AI outage separately pauses the affected inference worker; rules-only outputs
must retain incomplete/pending checks. No `ai_outage` incident hook is implemented.

### Other key leaks and wallet movements

Rotate/revoke the affected authority first, then contain hosts and investigate.
For agent/API credentials, revoke the key or disconnect the agent; separately
revoke OAuth grants/refresh tokens. For session/pepper leakage, invalidate DB
sessions and affected agent/OAuth credentials and reload role secrets; users must
reauthenticate/re-consent. Rotate provider/receiver credentials at their issuer
and replace the host copy. Do not destroy a journal KEK as a rotation shortcut:
preserve recovery material and re-wrap DEKs through a reviewed, tested procedure
before retiring a KEK; turnkey re-wrapping remains a gap.

For large outflows, dev-to-burn inflows, unexpected creator-fee receipts, wrong
tokens or unexplained burn-wallet transfers, the burn operator holds the next
manual ritual. Reconcile indexed raw transfers, transaction receipts and any
manual burn/bridge records against the published wallets; incomplete indexer
coverage is not a clean reconciliation. For a burn-wallet key leak, the operator
creates a fresh hardware wallet, changes and publicly discloses
`BURN_WALLET_ADDRESS` (and future `X402_PAY_TO`), and coordinates response to
remaining wallet balances. Never redirect terminal fee/burn revenue to the dev
wallet. Owner actions do not rotate a separate burn-wallet authority.

### Communications and closure

Use private advisory/incident channels during containment; never share secret
values or private journal payloads. The communications role publishes a factual
service notice with affected functionality, observed interval and current pause
state; no price predictions or assurance claims. A guard miss requires a
post-mortem within 24 hours and review of the private Scoreboard draft. Publish
corrections with evidence, preserve original records, and record root cause,
rotation/stop evidence, user impact, delivery acknowledgements, tests and remaining
gaps before closure. Public publishing is a manual role action, not an incident
hook side effect.
