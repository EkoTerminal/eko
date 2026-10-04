# Task 136 · Ship the T installable PWA with private data network-only

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 03-FRONTEND §§1.2, 12, 13.
Dependencies: 006, 119. This packet covers acquisition or integration outside the existing Guard packet ownership.

## Do

1. Add the specified manifest, 192/512/maskable icons, colors, /mission?src=pwa start URL and Approvals/Scan/Radar shortcuts. Use vite-plugin-pwa injectManifest only as explicitly named by the spec, updating the lockfile offline.
2. Precache shell assets, cache fonts first and keep all /v1 responses and OG images network-only. Render the specified offline connection message and offer installation from Settings; keep push unregistered until D0.
3. Test production manifest/installability, offline shell, missing API connection, sensitive response cache exclusion and sign-out. Verify an update cannot replay a cached order, approval, journal or receipt response.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.

