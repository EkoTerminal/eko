# Task 084 · Prepare encrypted backups and perform an isolated restore drill

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §§3.5–3.6, 19; 05-GO-PLAN §4.2.
Dependencies: 083; encrypted-journal verification depends on 092. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add repo-local backup/restore commands for encrypted pg_dump and WAL/PITR with placeholders for secret-store keys; restore into a fresh isolated database without overwriting the source. Never export plaintext journal payloads or secret material.
2. Check migration ledgers, cursor/range state, counts, sample immutable card/receipt hashes, leases and reconnecting read services after restore. When journals exist, test authorized decryption and inability to read crypto-shredded data using neutral fixtures.
3. Record source/candidate revision, backup/checksum, restore target, measured timings and each assertion; pending provider/PITR access is not a pass. // TODO(spec): retention/drill cadence conflicts; use BACKEND §19 30 daily/12 monthly copies and weekly drills, satisfying the pre-B requirement.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
