# Task 108 · Build landing and scan result pages

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 03-FRONTEND §§3.1, 3.7, 4.1, 8; BACKEND §23 CA-5.
Dependencies: 107, 112; consume Guard compact adapters from 037. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Replace / and /scan/:id placeholders with scan input, configured examples, ambiguity/pending/error states and shared result cards with evidence, costs, flow and receipts. Landing includes six Radar preview cards, equal-size refused/missed counters, harness pitch and footer disclosures.
2. Poll the persisted scan result with cancellation/backoff, enable share/Open coin/Scan my bags and preserve named unavailable fields. No wallet library belongs in the landing chunk; no token purchase CTA at T.
3. Test address/ticker validation, candidate selection, pending-to-ready, stale result, real counters without fabricated zeros and mobile input above the fold. Record indexed-coin p50 response target <=3s independently from new-pair p95.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
