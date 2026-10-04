# Task 110 implementation report

Candidate: `22e80a806c4c8d1c677448d30d2a1090a8ac06c1` plus the uncommitted task-110 changes. Final source-content SHA-256, using sorted changed paths and contents and excluding this report: `dee01edf5e553881c7011eb890746242fa4526b02efe5dac3ed956b3b5f252a1`.

Implemented against FRONTEND §§3.7, 4.1, 4.8, FACTS §7 and task 109's typed CA-6 contracts; followed the marketing claims/disclaimer rules and AGENTS rule 9. The prototype informed layout and interactions only. Its sample identities, prices, timing promises and fee assumptions were not copied. The scroll-story landing at `/` and the Scan landing were untouched. No spec, Guard logic, prototype, dependency, lockfile or migration changes.

Changed files:

- `apps/web/src/pages/terminal/Bags.tsx`: own-wallet/SIWE connect state; bounded progressive report loading; empty, per-row failure/retry and request-error states; indexed coverage and cursor paging; desktop holdings table and mobile cards; native evidence disclosures; independent value/wallet share opt-ins; public reports without wallet hooks; copy/X/Telegram links; in-app public metadata. Issued links use their immutable server snapshot in the same card renderer as the preview/public page. Existing links retain their original disclosures. Watch reads/mutations use its service when available; failed availability keeps the control disabled.
- `apps/web/src/pages/terminal/bags.css`: prototype-derived responsive layout and mobile sticky Share action, with long balances/addresses wrapping and table overflow contained locally.
- `apps/web/src/lib/bags.ts`: typed report/share calls, cancellation and page-scoped retries, conservative confirmed-match counts, public preview allowlist and exact decimal rounding matching task 109, neutral metadata. Pending/error/unavailable rows and rows with absent or incomplete evaluated-playbook coverage are excluded from confirmed matches. Unknown values remain unknown. Exit costs are labelled as the API's measured $1,000 reference, never inferred full-balance quotes or fees.
- `apps/web/src/routes.ts`, `apps/web/src/App.tsx`: load both bags routes and let `/bags` own its connect presentation, avoiding a duplicate generic connect card.
- `apps/web/src/mocks/bags.ts`, `apps/web/src/pages/terminal/Bags.test.tsx`: neutral synthetic fixtures and focused redaction, independent opt-ins, rounding, preview/public parity, incomplete states, accessible disclosures, retry/polling/cancellation, snapshot race and metadata tests.
- `apps/web/e2e/bags.spec.ts`: five prepared browser tests covering the existing four sizes (1512×982, 1440×900, 1280×800, 390×844), connect, row retry, keyboard disclosures, disabled Sell, mobile sticky Share, overflow, opt-ins, preview/public parity and public-read retry. Tests use generated test wallets and intercepted API fixtures; they do not establish live SIWE, chain or provider behaviour.

Every new `TODO(spec)`:

1. `apps/web/src/lib/bags.ts`: CA-6 does not specify frontend polling limits. Use up to 15 reads with 700 ms waits (9.8 seconds of waiting plus request latency), then offer manual Refresh. Retry is the existing API's page-wide `?retry=true`, not a fabricated per-coin mutation.
2. `apps/web/src/pages/terminal/Bags.tsx`: task 077's shared guarded sell panel is absent on this branch. Sell remains disabled; its existing-position handoff must be connected after 077/078 land. No replacement execution path or fee calculation was created.
3. `apps/web/src/pages/terminal/Bags.tsx`: CA-26 host-side head injection and the bags OG renderer are absent here. The page sets/restores in-app tags and the specified OG URL; crawler metadata/image availability remains a dependency.

Remaining dependencies: shared sell panel/wallet flow (077/078); deployed Watch service; task 109's API and its existing migration 0021 in the serving environment; host share-head injection and bags OG rendering. Task 109 currently exposes historical verdict/playbook data in its bags projection; V2 hydration remains with Guard consumer/API owners. Private rows already use the shared Guard-aware `VerdictChip` when a negotiated assessment is supplied. Share snapshots follow task 109's public allowlist, which omits the private Guard assessment. Sharing explicitly covers the first bounded page only; the report states indexed discovery and additional-page limits.

Checks and reproduction, from the worktree root:

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm --filter @eko/web test src/pages/terminal/Bags.test.tsx src/routes.test.ts src/copy/copy.test.ts` | 0 | 31 tests; `/tmp/eko-110-focused-final.log` |
| `pnpm --filter @eko/web typecheck` | 0 | Final browser fixture source included; `/tmp/eko-110-web-typecheck-final.log` |
| `pnpm typecheck` | 0 | `/tmp/eko-110-typecheck-final.log` |
| `pnpm_config_workspace_concurrency=1 VITEST_MAX_WORKERS=2 pnpm test` | 0 | 2,722 Vitest tests, 33 contract tests, existing fork skip and build/role gate; `/tmp/eko-110-test-final.log` |
| `pnpm brand:check` | 0 | `/tmp/eko-110-brand-final.log` |
| `pnpm check:addresses` | 0 | `/tmp/eko-110-addresses-final.log` |
| `pnpm --filter @eko/web exec playwright test e2e/bags.spec.ts --list` | 0 | All five tests discovered; `/tmp/eko-110-browser-list-final.log` |
| `git diff --check` | 0 | No whitespace errors |

Browser execution was not completed: a local Chrome launch probe exited 1 with SIGABRT and an EPERM cleanup error, before any page loaded. The sandbox also prohibits listening ports, so the existing Playwright web-server configuration was not started. Four-size visual/layout and interactive browser checks are prepared, not verified. Reproduce them in an environment permitting the existing servers and Chrome: `pnpm --filter @eko/web exec playwright test e2e/bags.spec.ts --project=desktop`.

During implementation the initial full gate caught duplicated disclaimer literals; they were replaced by the canonical copy constant. A subsequent gate was cancelled when the desktop table edit exposed a missing JSX fragment close. Focused checks then caught a missing fixture binding and the need to stay aligned with the backend's public allowlist; both were resolved before the final gate. No existing tests were deleted, skipped or weakened. Browser test discovery initially rejected a JSON fixture import; bounded filesystem fixture loading fixed discovery, and final web typecheck passed. That final browser-only change occurred after the workspace gate started; production code and Vitest source were unchanged, and the browser file received its own final typecheck/discovery checks.

Gate runner: `/tmp/eko-110-gates.py`; checkpoint: `/tmp/eko-110-checkpoint.json`. Actual paid cost $0; live request units 0. Coverage is offline synthetic fixtures. No commit, push, deployment, publication, external message, paid run or release approval was performed. All gate processes completed. Web/server bundles were built, and the built-role fixture gate passed without ports or providers. The contract suite retained its existing RPC-dependent fork skip (33 passed, one skipped); no live-fork evidence is claimed. Next actions belong to the lead: review/commit, integrate the listed dependencies, and run the prepared browser tests in a permitted environment. No local task job remains running.
