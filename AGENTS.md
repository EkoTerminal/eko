# EKO — working rules for coding agents

EKO is a harness for trading agents (Senses, Guardrails, Loop Lab, Flight Recorder, Mission Control) whose first
application is a trench terminal for Robinhood Chain (chain id 4663). This repo started as the SignalOS codebase,
imported unchanged in the first commit; we extend it, we don't rewrite it.

## The spec is the source of truth

Everything is specified in `docs/eko/` (read only — never edit these files):

| File | What it covers |
|---|---|
| `FACTS.md` | Facts every part must agree on. **§7 is the shared API contract** (types the frontend and backend share). |
| `04-BACKEND.md` | Monorepo layout (§2), data model, chain ingest, engines, harness/MCP (§9), execution (§12), receipts, contracts, API, flags (§21.4), build tasks (§21), contract additions (§23). |
| `03-FRONTEND.md` | The web app: what to keep/remove from SignalOS (§1.2), routes, screens, flows, design system (§7), copy and disclaimers (§8), build order (§14). |
| `01-OVERVIEW.md`, `02-MARKETING.md`, `05-GO-PLAN.md` | Product, claims rules, launch plan. Read the claims rules before writing any user-facing copy. |

When the spec and the code disagree, follow the spec and say so in your final message. When the spec is silent or
ambiguous, choose the smallest reasonable reading, leave a `// TODO(spec): …` note, and list it in your final message.

## Hard rules

1. **Keep it green.** `pnpm typecheck` and `pnpm test` must pass when you finish. Never delete, skip or weaken an
   existing test to make it pass; if a test encodes SignalOS behaviour the spec removes, replace it with a test of the
   new behaviour and say so.
2. **Brand retirement.** Nothing served or configured may carry the SignalOS brand (HTML titles, manifest, favicons,
   OG cards, cookies, env var names, package names, user-facing strings). Internal comments explaining code heritage
   are fine. The team is anonymous: never add team names, people or company names anywhere.
3. **Claims.** User-facing copy never says "audited", "trustless", "automated burn", "ownerless", "guaranteed",
   "win rate", "rug-proof", "safe", or "protects your Robinhood account", and never predicts prices. Robinhood
   wording follows 02-MARKETING §04 "Robinhood" (e.g. "Built on Robinhood Chain" plus the non-affiliation line; never
   "partner" or "official").
4. **Money paths.** Never point any automated burn or fee at the dev wallet. Fees go to the public burn wallet only,
   as the spec describes. No custody: the server never holds user keys or funds.
5. **No secrets.** Never write real keys, tokens or private keys to the repo; use `.env.example` placeholders.
6. **Lockfile.** If you add a workspace package or declare a dependency (even `workspace:*` or one already in the
   lockfile), update the lockfile offline: `CI=true pnpm install --offline --no-frozen-lockfile`, and include the
   `pnpm-lock.yaml` change. `pnpm install --frozen-lockfile` must succeed on a clean checkout.
7. **Scope.** Do only the task you're given. Don't reformat unrelated files or bump dependencies unless the task says
   so. No network access is assumed: use the dependencies already in the lockfile (zod, viem, vitest, etc.).
8. **Pure where the spec says pure.** Engines like `packages/policy`, `packages/playbooks` and `packages/untrusted`
   take no I/O; give them unit tests with fixtures.
9. **No personal identifiers, ever.** Never write the owner's email address or any part of it, a real name, account
   handles or a machine username into code, sample/mock data, fixtures, tests, comments, commits or docs. If a source
   you are porting (the prototype included) contains one, replace it with a neutral value such as `demo-account` and
   say so in your report. A git hook blocks commits and pushes that contain one; never bypass it (`--no-verify`).

## Commands

```sh
pnpm install --frozen-lockfile   # already done; when you add a package or dependency, see rule 6
pnpm typecheck
pnpm test
pnpm --filter <package> test     # one package
```

## Finishing a task

End with a short report: what changed (by file or area), spec sections followed, anything deferred or ambiguous
(`TODO(spec)`), and the typecheck and test results you saw.

## Public repository

This checkout is the public repository. Do not add personal identities, credentials or private environment
files. Run `python3 scripts/test-public-guard.py` and `python3 scripts/public-guard.py --mode history`; the
fingerprint configuration is required, so never remove it or bypass the Git hooks. Commits use the neutral
public author and committer identity documented in `docs/PUBLIC_HISTORY.md`.
