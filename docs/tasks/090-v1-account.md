# Task 090 · Migrate SIWE, account and preferences to v1

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: FACTS §7; 04-BACKEND §§15.1, 17, 23 CA-10/11/12; 03-FRONTEND §§4.2, 3.20.
Dependencies: 010. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Reuse AuthService for POST auth/siwe/nonce, verify, logout and GET /me with Me/Entitlements contracts. Supply domain/uri/issuedAt/expiry, correct same-site cookie scope, session rotation and allowed-origin validation.
2. Add GET/PUT /me/preferences and capture referral attribution at sign-in. Before D0+1 give launch-week access to shipped features and realtime data with feeBps=0 through T; do not activate trial or token-tier checks.
3. Migrate wallet/store preference callers from /api to /v1 and test nonce reuse, wrong origin/chain/signature, account switch, demos, cookie flags and shared-schema responses. Document unset launch-week limit fields with TODO(spec) rather than guessing unlimited agents.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
