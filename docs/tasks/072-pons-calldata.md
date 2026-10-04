# Task 072 · Build verified Pons quotes and unsigned trade legs

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§4.5, 12.1–12.4; FACTS §5b; Guard 2.0 §3.4.
Dependencies: 039, 040, 041, 052; reuse 016 registry and 024 metering. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Verify supported curve quote/buy/sell function selectors against pinned evidence and build unsigned route legs using 040 reference execution. Keep graduation custody in 042 and actual-account revalidation in 052.
2. Preserve actual recipients, refund behavior, raw input and output minima. Every Pons-curve quote has fee.bps=0 and fee.destination=null; build no fee leg or new curve fee router.
3. Test both directions, actual fee schedule, expired/active anti-snipe state, exact sell allowance and fork balance changes. If executable ABI/fork evidence is absent, return quote-only plus an allowlisted venue link.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
