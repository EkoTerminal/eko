# Task 122 · Capture T referrals and append-only EKO Points

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §17, 23 CA-12; FACTS §5.
Dependencies: 090, 076, 092, 107, 109, 118. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Persist referral codes/attribution and GET /referrals at T without awarding D0+1 time bonuses. Add append-only points_ledger and source-id idempotent earning hooks for already implemented actions.
2. Apply specified exclusion/cap rules to guarded volume, shared journal, opened scan and confirmed Ghost tips; unsupported earning categories stay inactive. Store reversals as entries, never rewrite history.
3. Test duplicate events, round-trip/crew exclusions, self-referral and concurrent credits with neutral fixtures. // TODO(spec): exact point rates/daily caps are unspecified; deliver configurable disabled rates and name this launch decision, never invent economics or enable redemption.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
