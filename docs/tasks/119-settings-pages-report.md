# Task 119 — settings pages report

Prepared locally, uncommitted, on base `6951422b48cc3fe30a47ef1b61783632134a9cdb`. No deployment, release approval, publication, external messages, live provider calls, or paid runs. External paid cost: $0. No dependencies or migrations added; reserved migration 0036 was not used. Specs, Guard logic/design, and prototype were not edited. No personal identifiers or real secrets were added or ported.

## Changes and spec

- `apps/web/src/pages/Settings.tsx`: replaces the retained settings entry with Trading, SIWE wallet state/sign-out, Notifications, Plan, Display, Privacy, and Help/About. Reuses NumberList controls and existing notification/Telegram linking. Guest trading preferences remain usable; wallet-only sections use inline connect. Restore defaults affects trading fields only. Removes the heritage diagnostics polling and obsolete fixed-market copy.
- `apps/web/src/pages/settings/Plan.tsx`, `Privacy.tsx`, `settings.css`: implements the previously placeholder plan route, phase-aware launch/D0 fee disclosures, server referral link/stats and user-operated copy/share actions, gated tier/trial information, and typed-confirmation deletion with retry/unconfirmed-failure feedback and accepted server timestamp. No fabricated token thresholds, trial bonuses, redemption, or push controls.
- `apps/web/src/copy/settings.ts`, `lib/settings.ts`: canonical settings/plan copy, SIWE/account matching, confirmed DELETE response validation, and referral-link validation.
- `apps/web/src/store/app.ts`: preferences update only after successful PUT, ignore obsolete account/session responses, and sign out through `/auth/logout` before clearing private session state. Device motion preferences remain independent of account refresh.
- `apps/web/src/store/ui.ts`, `components/chart/ChartStage.tsx`, `App.tsx`, `styles/shell.css`: guarded `eko.ui` density/reduced-motion/human-marker persistence and consumers. Dark-only display follows Frontend §7.1 (no theme toggle).
- `apps/web/src/routes.ts`: serves the plan component at `/settings/plan`; the URL remains available with flags off. `App.tsx` removes the duplicate dormant placeholder notice.
- `apps/web/src/mocks/responses.ts`, `mocks/transport.ts`: offline deletion response matches `{deletedAt}`, mock deletion resets that wallet’s stored preferences, and mock SIWE wallets have distinct neutral account identities.
- `apps/web/src/pages/settings/settings.test.tsx`: tests served copy/flags, guest and mismatched-wallet sections, per-wallet preference persistence, failed/stale saves, SIWE logout outcomes, typed deletion success/failure/retry, referral response values, and trial timing/entitlement updates.
- `apps/web/src/components/NotificationSettings.tsx`: corrects the inherited push-dependency TODO to identify `approvals` as its D0 flag.

Spec followed: Frontend §3.20, §2.2 mixed routes, §7.1 dark-only display, §8 exact copy, §12 push staging; Backend §23 CA-10/12/30 and CA-22, §21.4 flags; FACTS §7 shared contracts and §5 launch fees; Marketing §04 claims/Robinhood wording. The spec takes precedence over the retained scaffold’s fixed-market copy and server-backed display preferences.

## TODO(spec) and remaining dependencies

1. New TODO in `pages/settings/Privacy.tsx`: CA-10 contains no default journal-sharing preference or accepted default-sharing endpoint. The page explains the current private-by-default behavior and keeps the control unavailable. Journal recording consent is a different contract and is not treated as sharing consent.
2. Updated inherited TODO in `components/NotificationSettings.tsx`: web push follows D0 `approvals`, but production subscription routes/readiness are absent. Push remains unavailable pending that accepted dependency.

Tiers/trial/referral bonuses remain gated by their D0+1 flags (and tiers phase); redemption controls are absent. Referral attribution reads the existing launch `GET /referrals`; actual production attribution/Telegram delivery/deletion still require a verified live environment. Active-stage trial activation/recap/redemption and accepted token amounts are downstream work, not claimed as shipped by this launch packet.

## Checks

- Focused: `VITEST_MAX_WORKERS=2 pnpm --filter @eko/web test src/pages/settings/settings.test.tsx src/pages/terminal/Watch.test.tsx src/lib/trade-account.test.ts src/mocks/mocks.test.ts src/routes.test.ts src/copy/copy.test.ts src/styles/dark.test.ts` — exit 0, 7 files / 216 tests passed.
- `pnpm --filter @eko/web typecheck` — initial exit 2 (section-key typing error); corrected, final exit 0.
- `pnpm typecheck` — exit 0.
- `VITEST_MAX_WORKERS=2 pnpm test` — exit 0; 192 Vitest files / 3129 tests passed, plus 34 Solidity tests passed and 1 existing RPC-dependent fork skip. Web/server production builds and offline role-image checks passed.
- `pnpm brand:check` — exit 0, 38 files checked.
- `pnpm check:addresses` — exit 0, 474 source files checked.
- `git diff --check` — exit 0 after removing a trailing blank line.

The full gate’s existing RPC-dependent contract fork test reports its built-in skip because no RPC is configured. No test assertions, skip settings, or timeouts were changed. Focused evidence uses mocked transports, neutral wallets, SSR, and a small hook-state harness for actual deletion handlers; it is not live-browser/provider evidence. No code-coverage percentage was measured.

## Process/checkpoint and reproduction

Logs are sanitized to remove local personal paths: `/tmp/eko-task119-typecheck.log`, `/tmp/eko-task119-tests.log`, `/tmp/eko-task119-brand.log`, `/tmp/eko-task119-addresses.log`. Checkpoint: `/tmp/eko-task119-checkpoint.md`. All required checks completed with exit 0. Full-gate session 53732 completed; no check process remains running. Next action: lead review/integration of the uncommitted diff, followed by live manual verification when a network/port-enabled environment is available.

Reproduce with the focused command above and the four required root commands. For manual verification in an environment with a running web/server: visit `/settings` as a guest, connect and verify a neutral wallet, save preferences, switch wallets, link Telegram, exercise DELETE failure and confirmed success, and visit `/settings/plan` with launch flags off. This sandbox has no network/ports, so that live-browser verification was not performed.
