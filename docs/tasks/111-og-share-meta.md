# Task 111 · Render deterministic share PNGs and route metadata

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §15.6, 23 CA-26; 03-FRONTEND §4.8; 02-MARKETING §05.
Dependencies: 107, 109, 081; consume 037 Guard copy adapters. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Create apps/og-renderer using spec-named satori/resvg if needed; render 1200x630 public scan/bag and 1200x675 reply images in EKO fonts, cached by content hash.
2. Inject escaped path-specific metadata for scan, bags, receipt and coin routes in the server head marker, with canonical/public URL allowlists and appropriate per-path cache/CSP. Use only the redacted public bag snapshot.
3. Test hostile names/symbols, oversized text, required footer disclosures, pending/gap labels, dimensions, deterministic image hashes and scan link unfurl tags. Never expose private journal data, keys, salts or unshared wallet/value data in images or metadata.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
