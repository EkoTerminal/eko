# Task 121 · Build a truthful public Drops page

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 03-FRONTEND §3.22; BACKEND §23 CA-9/29; FACTS §6.
Dependencies: 010, 006. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Replace /drops placeholder with config demo/live records and same-origin demo videos; omit hidden or undemoed drops. Populate config only from an actual demo manifest, not speculative calendar dates.
2. Require both enabled feature and published release evidence for live wording; target dates remain qualified. Empty state is valid at T when no working demo exists.
3. Test hidden/demo/live combinations, video URL allowlist and disagreement between manifest and flags. Do not build future Drop features or invent recordings in this session.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
