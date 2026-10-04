# Task 130 · Verify and implement the Occupy launchpad adapter

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§4.3–4.5; 01-OVERVIEW §06.
Dependencies: 016, 024, 027; versioned partial cards from 029/035. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Use the LaunchpadAdapter interface for Occupy only: verify factory/template/event/quote evidence from approved pinned sources and record full fixture provenance. Missing ABIs yield an explicit unsupported manifest, not guessed selectors.
2. Implement only verified launch/trade/migration events and bounded recent backfill wiring with idempotent indexer-owned writes. Unknown control, custody and execution remain named gaps; no inherited Pons profile.
3. Test decoding, unknown events, replay/reorg and partial card creation. Report exact supported coverage and external evidence needed; absence of venue verification is an unresolved T ingestion gap.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
