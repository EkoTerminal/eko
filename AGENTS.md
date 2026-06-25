# EKO public source working rules

Keep changes focused. Follow the existing pnpm workspace, package boundaries and lockfile.
Use Node.js 22.12 or newer and pnpm 11.5.1. Run `pnpm typecheck` and `pnpm test` before finishing.
Never weaken an existing assertion to obtain a passing result. Pure engines remain free of I/O.

Do not add personal identities, credentials, private environment files, internal task reports or captures.
Run `python3 scripts/test-public-guard.py` and `python3 scripts/public-guard.py --mode history`.
The fingerprint configuration is required: never remove it or bypass the existing Git hooks.
Use the neutral public author and committer identity documented in `docs/PUBLIC_HISTORY.md`.

Public copy describes the stage actually shipped. Do not imply a review, trading outcome or
brokerage enforcement that has not been demonstrated. Preserve third-party licenses and notices.
EKO is built on Robinhood Chain and is not affiliated with Robinhood Markets, Inc.
