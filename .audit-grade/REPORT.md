# Audit Grade — EKO

**Grade: 9.6 / 10** · Rubric v2 · **No cap applies**
Commit `68bd26f4229ce22c573fc100da44191918f83790` (public `78cab1c2306908f196ae3fc582e04972dc3458db`) · Mode `rescore` after a `quick` run · 2026-10-04
Previous: **9.6** at `51f0ebd` on 2026-10-03 (**+0.0**). The quick run at `30e70d4` today graded **7.0** (capped by unverified live roles; an open Medium also capped it at 8.9). All findings from that run are fixed here. · Studio policy: **5/8 pass** (4/8 at `30e70d4`)
Deployed build: **matches** — staging api, worker, indexer and engines all run the audited build (public `78cab1c` = source `68bd26f`), verified in this run. Contracts not deployed.
Independent check: **agreed at 9.6** (difference 0.0). A fresh reviewer recomputed every category and cap, re-ran the proof tests and upheld the three most severe closures, and spot-checked F6, D7 and C1. Its corrections are applied: a complete green gate run is recorded, the mailbox confirmation is recorded in the repo docs, and five new leads are listed.

## How this run went

1. **Quick audit of `30e70d4`** (run `20261004-150935`, eight lanes on a frozen snapshot, read-only, offline PoCs). It found 1 Medium, 3 Low and 4 deploy-verification items (one of them triggered the 7.0 cap), plus one studio-policy failure (P5).
2. **Fixes on `68bd26f`.** Each finding got a regression test that fails on `30e70d4`'s code and passes on the fix; the lane PoCs were re-run against the fix.
3. **Rescore of `68bd26f`** with the full gate, a fresh image build, the public sync and a staging deploy verified for all four live roles.

| Run | Commit | Mode | Grade | Cap | Open C/H/M/L |
| --- | --- | --- | --- | --- | --- |
| Quick | `30e70d4` | quick | **7.0** | 7.0 (live indexer and engines unverified) | 0/0/1/3 |
| Rescore | `68bd26f` | rescore | **9.6** | none | 0/0/0/0 |

## Path to 9/10

**9.0 and 9.5 are reached.** No item is required. Remaining grade work, ranked by final-grade points per hour (S = 1 h, M = 4 h, L = 16 h, XL = 40 h):

| # | Fix | Where | Points | Effort | Proof for rescore |
| --- | --- | --- | --- | --- | --- |
| 1 | Configure monitoring receivers, on-call contacts and alert thresholds; keep one acknowledged incident drill | `infra/monitoring/README.md`, `SECURITY.md` Contacts table | **+0.1 → 9.7** (D8 +1.0; raw 9.675 → 9.775) | M 4h | Accepted receiver config, delivered-alert acknowledgements for authority change, pause, outflow, reference staleness, committer gas; named role contacts; drill record |
| 2 | Real-dependency integration tests for guarded execution | `apps/server/test/fork/`, `docs/security/FORK-TESTS.md` | **+0.2 → 9.9** (C7 +1.0; raw 9.775 → 9.925) | L 16h | Candidate-pinned fork runs against the real routers and tokens, with chain, block and build pins |
| 3 | Formal checks of core fee, settlement and rounding math | `packages/chain/src/simulation/pons-math.ts`, `apps/server/src/exec/` | **+0.1 → 10.0** (C8 +0.5; raw 9.925 → 10.000) | XL 40h | Reproducible Halmos/SMT or equivalent checks of the actual arithmetic |

Projected grade after items 1–2: **9.9**.

Integrity work worth doing that earns no points:
- **DV-2 (Info, ~2 h):** add a per-file hash map of `dist` data files (`addresses.4663.yaml`, `abi/`, `chain-drizzle/`, `guard-code/`, `og-assets/`) and `drizzle/` to `build-info.json`, and a digest of the loaded address registry to the identity config (config version 2). Proof: `/v1/build` carries both and the verifier compares them.
- **Private advisories (owner, 1 min):** enable GitHub private vulnerability reporting on the public repository (currently off). `security@ekoterminal.com` already forwards to a monitored mailbox.

Studio policy fixes (each +0.0 grade, no traced security harm): **P3** record per-brand public deployer, owner, multisig, committer and burn roles and compare with the portfolio (S after inputs). **P4** record accepted issuance and allocations under FACTS §5 (S after decisions). **P7** provide a sibling-brand inventory for the cross-mention check (S after inventory).

## Score breakdown

| Category | Score | Weight | Weighted | Change since `51f0ebd` | Main deductions |
| --- | ---: | ---: | ---: | ---: | --- |
| A Core security | **10.0** | 35% | **3.500** | 0.0 | None |
| B Off-chain security | **10.0** | 15% | **1.500** | 0.0 | All four new findings fixed with proof |
| C Testing & verification | **8.5** | 15% | **1.275** | 0.0 | C7 fork/integration 0/1; C8 formal 0/0.5 |
| D Privileged ops, deploy & ops | **9.0** | 10% | **0.900** | 0.0 | D8 monitoring delivery and contacts pending |
| E Dependencies & supply chain | **10.0** | 5% | **0.500** | 0.0 | None |
| F Hygiene & CI | **10.0** | 10% | **1.000** | **+0.5** | None (disclosure mailbox confirmed) |
| G Docs & threat model | **10.0** | 10% | **1.000** | 0.0 | None |
| **Total before caps** | | | **9.675 → 9.6** | +0.05 raw | Floor to one decimal |
| **Cap** | | | **none** | | |

A = 10 − 0 = **10.0** (contracts lane: 0 findings; contract code unchanged since `51f0ebd`).
B = 10 − 0 open (four rows fixed: 1 Medium, 3 Low) = **10.0**. At `30e70d4` it was 10 − 1.2 − 3 × 0.3 = **7.9**.
Total = 0.35×10 + 0.15×10 + 0.15×8.5 + 0.10×9 + 0.05×10 + 0.10×10 + 0.10×10 = 3.500 + 1.500 + 1.275 + 0.900 + 0.500 + 1.000 + 1.000 = **9.675**, floored to **9.6**.

Quick run at `30e70d4`: 3.500 + 0.15×7.9 + 1.275 + 0.10×7.5 + 0.500 + 0.10×9.5 + 1.000 = 3.500 + 1.185 + 1.275 + 0.750 + 0.500 + 0.950 + 1.000 = 9.160 → 9.1, capped at 8.9 (open Medium) and **7.0** (live indexer and engines not verifiable). Final 7.0.

| Cap | Applies at `68bd26f`? | Evidence |
| --- | --- | --- |
| Open Critical → 3.0 | No | 0 |
| Live secret in history | No | Gitleaks exit 0, no leaks (`runs/20261004-150935/gitleaks.txt`); public guard passed 385 commits and 2,345 blobs |
| ≥ 2 open Highs → 5.0 / one → 6.0 | No | 0 High |
| User-fund code with zero tests → 5.0 | No | No EKO user-fund custody; tests exist |
| Build or tests fail → 6.0 | No | Complete gate run green at `68bd26f` (`runs/20261004-150935/rescore-gate.txt`) |
| Live deployment not verified → 7.0 | **No** | All four live roles matched in this run (Deploy verification below) |
| Fund-holding pool without invariants → 8.0 | No | No fund-holding pool or vault |
| Open Medium → 8.9 | No | The only Medium is fixed with proof |
| Rescore without a recent full/quick run → 8.9 | No | Quick run `20261004-150935` today |

## Scope

Stack: Solidity (`contracts`) and TypeScript (14 scoped workspaces: `apps/{server,indexer,engines,mcp,bots,og-renderer}`, `packages/{shared,chain,db,policy,playbooks,signal,untrusted,receipts-verifier}`), plus root build configuration. UI code (`apps/web`, `apps/landing`) and founder metadata are out of scope; the landing's serving path in the API and its build in the image are in scope.

Lanes at `30e70d4`: exec-trade, mcp-auth (with the new landing serving), data-engines (with tee-oracle), contracts (evm-stack plus one Pashov pass), ai-agents, hygiene-supply, deploy-verification, studio-policy. Reports and PoCs are in `runs/20261004-150935/lanes/`.

| Tool / gate | Result | Output |
| --- | --- | --- |
| Frozen install | exit 0, lockfile current | `runs/20261004-150935/install.txt` |
| `pnpm -r test` at `30e70d4` | exit 0 | `runs/20261004-150935/pnpm-test.txt` |
| Forge | 38 passed, 0 failed, 1 optional fork skipped | `runs/20261004-150935/forge-test.txt` |
| Core coverage | 8,390 / 8,759 lines = 95.79% | `runs/20261004-150935/coverage.txt` |
| Contract mutation | carried 50/50 kills; all 70 input hashes match HEAD | `runs/20261004-150935/mutation.json` |
| `pnpm audit --prod` | no known vulnerabilities | `runs/20261004-150935/audit-prod.txt` |
| Gitleaks | no leaks | `runs/20261004-150935/gitleaks.txt` |
| Full gate at `68bd26f` | `test:checks`, all 15 workspace suites run one at a time (server 629, engines 562, indexer 156, web 787, chain 351, mcp 68, …), contracts 38 (+1 skipped), role-image check: exit 0, 0 failures. The public tree passed the same gate. | `runs/20261004-150935/rescore-gate.txt` |
| Image build at `68bd26f` | all three stages built; runtime has web and landing bundles and no frontend build tooling | local `docker build` |
| Slither, Aderyn, Halmos | not installed locally; Slither and Semgrep run in CI | `.github/workflows/ci.yml` |

## Deploy verification

Railway project `eko-staging`, served at `ekoterminal.com`, `www.ekoterminal.com` and `app.staging.ekoterminal.com`. Build from a clean clone of public `78cab1c2306908f196ae3fc582e04972dc3458db` (the sync of `68bd26f`).

| Role | Deployment | Verdict | Config digest |
| --- | --- | --- | --- |
| api | `f671d15b-0e05-42ef-9fd5-bcfd3a198e71` | **matched** (`/v1/build`) | `7ca370e8…c029` |
| worker | `e6aef21f-350b-4869-8e9c-0f14a3398474` | **matched** (ready line 21:01:24Z) | `8d3de638…6714` |
| indexer | `03927c41-42bd-4eea-8371-6618fc6734de` | **matched** (identity line 21:03:15Z) | `6dcc7dd3…2e019` |
| engines | `a5567b78-5623-49e9-b4fc-d6f83aae1497` | **matched** (identity line 21:05:40Z) | `2fed94cb…607db` |

Bundle digest for all roles: `7305173795791af9642c37a0dbfd3ee02f0e456b5d5596932190d22a5a653634`. Identity lines were read from each current deployment's own logs. Smoke: health, identity, paused trading, flags off, SPA, WebSocket radar ack. Live trading is off; paid RPC budgets are 600,000/day for indexer and engines only. Recorded in `docs/operations/staging-railway-evidence.md`.

EKO contracts are not deployed (`packages/chain/addresses.4663.yaml` roles are `TODO`); contract verification is readiness-only and unchanged.

## Findings

No open findings. The four found by the quick run are fixed; details below for the record.

**[MEDIUM, fixed] `data-engines|apps/engines/src/worker.ts|newest-first-hides-sibling-history`.** Live first scans ran newest launch first, so a deployer's earlier launches indexed in the same poll had no `deployer_stats` rows yet when its newer coins were scored, and `serial_deployer` never fired on them. Fix: deployer groups are first-scanned in order of each deployer's newest launch, and one deployer's launches run oldest first (`worker.ts:250-265`). Proof: `engines.test.ts:554` (four bait launches by one deployer in one poll now match block-order replay: none, monitor, monitor, danger); fails on `30e70d4`.

**[LOW, fixed] `data-engines|apps/engines/src/worker.ts|coalesced-head-task-starvation`.** A coin whose checkpoints aged past the 900 s backlog window was re-queued behind newer work every poll and kept its pre-Danger card while launches kept arriving. Fix: such a coin keeps the queue place of its oldest dropped checkpoint (`worker.ts:218,236-245,264-265`). Proof: `engines.test.ts:566` (reaches Danger in the first loaded poll); fails on `30e70d4`.

**[LOW, fixed] `data-engines|apps/engines/src/worker.ts|sticky-startup-reevaluation`.** Any yielded poll switched startup mode back on, so unchanged coins were re-evaluated (paid archive reads, new rows) at every head while launches arrived. Fix: only a yielded startup poll continues startup, and a continuation skips coins already refreshed in that sequence (`worker.ts:157-161,226-231`). Proof: `engines.test.ts:587` (virtual clock; ordinary yields plan no idle coins, a yielded startup sequence refreshes each idle coin exactly once); fails on `30e70d4` with an idle coin re-evaluated five times.

**[LOW, fixed] `mcp-auth|apps/server/src/app.ts|mintable-session-rate-limit-key`.** Rate limits were keyed by session cookie, and `GET /v1/me` mints a guest session for anyone, so one address could multiply its 600/min bucket and its SIWE verify attempts (each failed signature can fall back to an on-chain contract-wallet call). Fix: per-session limits stay, with a 1,800/min ceiling per client address across all sessions and a 60/min per-address cap on SIWE verify (`http/address-limit.ts:8`, `app.ts:252`, `v1/account.ts:50`). Proof: `proxy-trust.test.ts:63`, which fails if either cap is removed; invariant row in `docs/security/INVARIANTS.md`. This deviates from the lane's suggested proof (refuse the 601st request from one address): keying everything by address would make users behind one shared address share a single 600/min bucket, so the address ceiling is 1,800/min (refused from the 1,801st) and amplification is bounded at three buckets instead of unbounded.

Deploy-verification items: **DV-1** (indexer and engines reported no build identity; 7.0 cap) fixed: the dispatcher prints an `EKO role identity` line for every role without its own ready line (`roles.ts:102-104`), the staging verifier compares it (`--indexer-identity`, `--engines-identity`), and the role-image check verifies the line against the baked build for indexer, engines, receipts and MCP. **DV-3** and **DV-4** (stale evidence doc; worker verdict provenance) fixed in `docs/operations/staging-railway-evidence.md`. **DV-2** open, Info (see Path).

## Studio policy

| # | Rule | Result | Evidence |
| --- | --- | --- | --- |
| P1 | Exit never gated | Pass | No custody; trading paused; nothing blocks withdrawal |
| P2 | No hidden admin powers | Pass | `SECURITY.md` Privileged powers |
| P3 | Fresh deployer/multisig per brand | Not pass (unverified) | Roles are `TODO` in `packages/chain/addresses.4663.yaml` |
| P4 | Allocations per doctrine; utility only | Not pass (unverified) | Utility-only half passes; allocations not recorded |
| P5 | No forbidden-claim language | **Pass** (was fail at `30e70d4`) | The "Safe" risk label is "Careful" everywhere (`2f764ac`); `copy.test.ts` scans the landing for the AGENTS.md banned claims |
| P6 | Honest data | Pass | Unstarted public record shown as such |
| P7 | No sibling cross-mentions | Not pass (unverified) | Brand inventory empty |
| P8 | Honest boundaries | Pass | `SECURITY.md` boundaries section |

## Fixed since last run

- `data-engines|apps/engines/src/worker.ts|newest-first-hides-sibling-history` — 2026-10-04
- `data-engines|apps/engines/src/worker.ts|coalesced-head-task-starvation` — 2026-10-04
- `data-engines|apps/engines/src/worker.ts|sticky-startup-reevaluation` — 2026-10-04
- `mcp-auth|apps/server/src/app.ts|mintable-session-rate-limit-key` — 2026-10-04
- `deploy-verification|scripts/verify-staging-identity.mjs|unattested-live-roles` — 2026-10-04
- `deploy-verification|docs/operations/staging-railway-evidence.md|stale-deploy-record` — 2026-10-04
- `deploy-verification|scripts/verify-staging-identity.mjs|worker-identity-provenance` — 2026-10-04
- Hygiene lead L1 (frontend build shared the server build stage): web and landing now build in their own image stage (`Dockerfile`, test in `roles.test.ts`); CI builds the landing.

All earlier ledger rows remain fixed; their proof tests passed in this run.

## Accepted risks

None new. `SECURITY.md` accepted-risk list unchanged.

## Unverified leads

No deduction. Full text in the lane reports.

- **Independent check (new):** the legacy `/api/auth/verify` (`apps/server/src/http/routes.ts:184-190`) reaches the same contract-wallet fallback without the 60/min per-address cap; legacy routes are off on staging (`LEGACY_API=false`) but on by default. The address key is `req.ip`, which skips the library's /64 grouping of IPv6 addresses, so one IPv6 /64 can rotate past both caps if the edge accepts IPv6. Users behind one shared address now share 1,800/min, and a wrong `TRUST_PROXY_HOPS` would make every user share one sign-in bucket. On-demand scan jobs run before the activity pass and can publish a first card without sibling history (re-evaluated at head later in the same poll unless it yields). Refreshes no longer run in strict block order while lagging, which widens data-engines lead 1.
- **mcp-auth:** the session cookie is scoped to the registrable domain (`ekoterminal.com`), so a sibling subdomain could read or plant it; a host-only `__Host-` cookie closes this. Pre-change staging cookies can shadow new sessions. Static routes follow symlinks inside the build folder (build tampering only). Rate-limit store eviction and IPv6 keying. Landing assets count against the global limit.
- **data-engines:** outcome history written at head is hidden from older same-poll evaluations; first scans have no cap; launch spam amplifies paid RPC reads (bounded by the daily budget, which halts engines when spent); replaying a coalesced range can fork a verdict's `supersedes` chain; the reference ETH/USD is a spot price; coalescing drops transient Danger receipts (disclosed TODO); live catch-up settings lack CLI tests.
- **contracts:** a retained receipt-commit attempt whose nonce another transaction used stalls anchoring and rotation does not clear it (committer-key holder only); `verify` accepts an inner node as a leaf (both verifiers recompute leaves); a leaked committer key adds roots that stay verifiable after rotation (RR-003).
- **ai-agents:** token text can steer Swarm persona votes; AI paths without a caller would not inherit Swarm budget discipline; `/api/ai/usage` has no auth while `LEGACY_API` is on; preflight output skips the read-tool sanitiser.
- **exec-trade:** sanctions snapshot age is unbounded and refresh failures only log; v1 `submitted` hash squatting; no finality depth in v1 reconcile; anonymous quote work before admission once a backend is installed; legacy reconcile records estimated fills.
- **hygiene-supply:** `pnpm deploy --legacy` is a non-frozen install; `packageManager` has no integrity hash; no image scan or build provenance; the public mirror's `ci.yml` adds the public-guard job.
- **studio-policy:** "Win rate" label in the unrouted `QuantLab.tsx`; claims-linter coverage gap; production does not refuse a sink burn address (the owner chose the standard dead address deliberately); the licensed landing font is tracked in the private repository only.

## Checklist detail (C, D, E, F, G)

**C — 8.5 / 10**
- C1 build and tests pass — **1.5/1.5.** Complete gate run at `68bd26f`: `test:checks`, all 15 workspace suites, contracts and the role-image check, exit 0 with 0 failures (`runs/20261004-150935/rescore-gate.txt`). Earlier parallel runs on a heavily loaded machine had two 30 s timeouts in files the fixes do not touch (indexer `log-head.test.ts`, server `scoreboard-api.test.ts`); both passed on re-run and in the complete run.
- C2 coverage — **1.5/1.5.** 95.79% of in-scope core lines (`coverage.txt`).
- C3 negative tests — **1.0/1.0.** Every state-changing route and the registry functions have refusal tests (lane reports; new caps covered by `proxy-trust.test.ts:63`).
- C4 fuzz/property — **1.0/1.0.** Forge fuzz properties on the registry.
- C5 stateful invariants — **2.0/2.0** via the no-funds rule: the registry holds no funds (`SECURITY.md`), integration tests cover the main flows.
- C6 mutation — **1.0/1.0.** Carried 50/50 kills; input hashes unchanged.
- C7 fork/integration — **0/1.0.** Optional fork test skipped (no network).
- C8 formal — **0/0.5.**
- C9 tests in CI — **0.5/0.5.** `ci.yml` runs every suite on push and PR.

**D — 9.0 / 10**
- D1 powers listed — 1.5/1.5 (`SECURITY.md` Privileged powers). D2 multisig/handoff — 1.5/1.5 (`contracts/README.md` registry-owner handoff). D3 upgrade safety — 1.5/1.5 (immutable registry). D4 pause — 1.0/1.0 (no funds held). D5 bounded setters — 1.0/1.0. D6 deploy scripts — 1.0/1.0.
- D7 post-deploy verification — **1.5/1.5.** `scripts/verify-staging-identity.mjs` checks revision, bundle hashes and per-role config digests and fails on mismatch; this run it matched api, worker, indexer and engines on staging. Contract verifier exists (`packages/chain/src/verify.ts`); contracts are pre-launch.
- D8 monitoring and contacts — **0/1.0.** Receivers, on-call contacts and drill still `TODO(owner)`.

**E — 10 / 10.** Frozen lockfile installs in CI and Docker; exact pins on viem and security libraries; `pnpm audit --prod` clean; `allowBuilds` (esbuild only) plus a 3-day `minimumReleaseAge`; no unexplained forks; no submodules; Node 22.23.3 and pnpm 11.5.1 not on the advisory list. Frontend build tooling is now isolated in its own image stage (`docs/security/ADVISORIES.md`).

**F — 10 / 10.** No secrets (Gitleaks clean; public guard green). `.env` ignored, `.env.example` present. CI builds and tests on push/PR. Slither and Semgrep in CI. Actions pinned to SHAs with least-privilege permissions and gitleaks. LICENSE present; `SECURITY.md` has a confirmed disclosure mailbox (`security@ekoterminal.com`, owner-confirmed forwarding on 2026-10-04, recorded in `SECURITY.md`, `docs/public-launch/SECURITY.public.md`, `docs/public-launch/CHECKLIST.md` and `contracts/review/README.md`) and the accepted-risk list (F6 now 1.0). Private advisories are not yet enabled; that is not required for F6. Toolchain pinned (`foundry.toml`, `packageManager`, Node image digest). No bidi characters or auto-approving agent configs.

**G — 10 / 10.** README covers build, test and deploy (landing description corrected). Architecture and roles matrix (`docs/ARCHITECTURE.md`, AI section rewritten to match the code). Invariants linked to tests (`docs/security/INVARIANTS.md`, new row for the per-address caps). Threat model and honest boundaries in `SECURITY.md` (stale line references corrected). Doc comments 513/513 (`docs/security/EXTERNAL-SURFACE.md`). Contracts pre-launch. Audit history in `.audit-grade/`. Scope frozen by this report's commit.

---
AI audit grade — a strong pre-audit signal, not a substitute for a human audit before large TVL.
