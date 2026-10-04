# Task 071 · Prepare v4 unsigned execution and its fork gate

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§12.1–12.4, 20; FACTS §§3, 5b.
Dependencies: 070, 042, 052. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Use the spec-named Uniswap planners to encode the supported UniversalRouter swap route, settlement and exact ERC-20/Permit2 approvals with expiry at most 30 minutes. Only add SDK packages explicitly named in the spec if absent, updating the lockfile offline.
2. Build no terminal fee leg for T; bind recipient/raw amount/minimum/value to the checked quote. Keep executable=false until the matched buy/sell fork suite has passed for the supported pool/hook.
3. Test command decoding, exact allowances, changed account/value/route and fork balance deltas. Publish the capability result for 075; an unavailable SDK or failing fork yields a documented quote-only route.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
