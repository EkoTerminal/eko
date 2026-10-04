# Task 119 · Build T Settings and dormant plan page

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 03-FRONTEND §3.20; BACKEND §23 CA-10/12/30.
Dependencies: 090, 092, 114, 117, 122. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Wire /settings to existing controls with /me/preferences, SIWE state, slippage/presets, alert thresholds, Telegram link and confirmed DELETE /me/data. Replace route placeholder rather than adding another disconnected settings entry point.
2. Build /settings/plan with launch-week free access and real referral attribution. Hide tier/trial/redemption and push controls until their D0+1/D0 flags; do not fabricate token amounts.
3. Test preference persistence/account switch, deletion success/failure and flag-off absence with the exact served fee/advisory copy. Keep mixed public and SIWE sections accessible via inline connect.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
