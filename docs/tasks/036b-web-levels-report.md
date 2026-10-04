# Task 036b visual-review fixes · 2026-10-02

Base revision: `c6732b24f75656c81e7c0ac0272e7e103f6bf4a4`. Candidate is uncommitted; the lead commits. Candidate source SHA-256: `fd1dcd21a196dbe4f7d95b2ff9d2cf9af05754d1be38c0978baa8df7b2c373c7` (16 changed/new `apps/web/` files, sorted relative paths, path + NUL + bytes + NUL). Includes original 036 implementation; reports are excluded. This follow-up supersedes the original report's fixture layout/checkpoint. Original scope/spec mapping is in [036 report](036-web-levels-report.md).

## Changes

- `GuardCard.tsx`: default view retains level, gap, snapshot, top three reasons, selected buyer-policy mode and buy/sell state, receipt and disclaimers. All reasons/checks, reference quote rows, optional Signal, every metric group and captured evidence use closed disclosures. Explicit evidence opening opens the requested assessment disclosure; individual checks remain closed. All data remains available on expansion.
- `coin.css`: collapsed section summaries have a 48 px minimum height, with native disclosure markers. Nested evidence markers reflect their own open state.
- `copy/guard.ts`: requested plain labels for all eight checks, short status summaries and technical coverage inside the check disclosure. Guard presentation copy lives in `copy/`. Currency is formatted in every USD parameter of every monetary reason template, including reasons and factor explanations; asset-denominated raw/quote amounts retain their explicit units. Shared wire templates and receipt data are unchanged.
- `CoinCard.tsx`: V1 compatibility rendering uses the same formatter when it carries a typed V2 assessment; original legacy prose is preserved.
- `lib/format.ts`: exact decimal USD display (grouping, cents and half-even rounding without float conversion), UTC timestamp display; existing `formatAge` supplies live age via the server-synchronized display clock. Example: `A $100 buy-then-sell returned $95.00`; `1970-01-01 00:16:40 UTC · 1s ago`.
- `GuardCard.test.tsx`, `lib/format.test.ts`: closed-default regression, top-three limit, independently collapsed checks with plain summaries, UTC/age, all monetary reason codes and exact decimal display. Fixture generation now uses collapsed defaults and a deterministic synthetic clock. Existing assertions are retained; gap expectations now use the requested labels.

Follows packet 036 and Guard 2.0 §§1, 6, 7.2; frontend presentation/claims sections listed in the original report. No new ambiguity or `TODO(spec)`. No edits to `docs/eko` or `docs/guard`; no dependency/lockfile changes or personal identifiers introduced.

## Fixtures and height estimates

Regenerated `/private/tmp/eko-036-visual/{lower,elevated,high,incomplete,shadow,candidate,legacy}.html` with inline app styles. HTML-parser counts: each of the six V2 fixtures has **253 details, zero open**; legacy has **2 details, zero open**. The six V2 fixtures have 11 collapsed section summaries. Closed descendants do not participate in native browser layout.

| Collapsed High/Elevated fixture page | Reasoning-based height estimate | Target |
|---|---:|---:|
| 1440×1000 desktop | 900–1,100 px | under approximately 1,600 px |
| 390×844 phone | 1,400–1,800 px | under approximately 2,600 px |

Estimate basis: 49 px per collapsed section including its border, nine metric groups arranged in five desktop rows or nine phone rows, plus the two other section summaries. Section/grid gaps contribute 112 px desktop or 176 px phone. Thus closed sections and gaps contribute approximately 455 px desktop / 715 px phone. Remaining budget covers the visible assessment, text wrapping, fixture disclaimers and padding, including the existing 210 px mobile coin-page bottom padding. Estimates describe these synthetic fixtures, not arbitrary future reason lengths.

These are calculations from markup/CSS, **not measured Chromium or jsdom heights**. No new browser launch was attempted: the prior sandbox Chromium bootstrap failure is recorded in the original report. Lead re-screenshots the regenerated fixtures in real Chromium at both viewports and measures `document.documentElement.scrollHeight`; also check `document.querySelectorAll('details[open]').length === 0`, text wrapping, disclosure expansion and horizontal overflow. Static fixtures have no client event wiring; mode switching/clock updates require the actual app.

## Checks and checkpoint

| Exact command | Exit | Result |
|---|---:|---|
| `GUARD_VISUAL_DIR=/private/tmp/eko-036-visual pnpm --filter @eko/web exec vitest run src/pages/terminal/GuardCard.test.tsx src/lib/format.test.ts src/pages/terminal/Coin.test.tsx src/pages/terminal/pending.test.tsx src/pages/terminal/availability.test.tsx src/copy/copy.test.ts src/components/ui/ui.test.tsx` | 0 | Final candidate: 7 files / 110 tests; seven fixtures regenerated; `/private/tmp/eko-036b-focused.log` |
| `pnpm typecheck` | 0 | Whole workspace before final compatibility-formatting adjustment; `/private/tmp/eko-036b-typecheck.log` |
| `pnpm --filter @eko/web typecheck` | 0 | Final candidate, including compatibility formatting; `/private/tmp/eko-036b-web-typecheck.log` |
| `pnpm test` | 0 | Whole workspace, contract unit/gas tests, web/server builds and role-image fixture checks; `/private/tmp/eko-036b-test.log` |
| `pnpm --filter @eko/web test` | 0 | Final candidate: 36 files / 496 tests; `/private/tmp/eko-036b-web-test.log` |
| `git diff --check` | 0 | No whitespace errors |

Initial focused run exited 1 because two new tests incorrectly expected the word `Buys` in allowed-state copy. Corrected those assertions to require the actual selected-mode `guardBuyText` result; the revised focused run above passed. No application assertion or safety requirement was weakened.

Revision boundary: workspace typecheck and the full gate's web test stage ran at fingerprint `c47aaaf894db0f6bdcdec1a663a8f2571529022d3cbd1dada946d87c279494a6`. During later unchanged-package stages, final candidate added only the compatibility-view formatter in `CoinCard.tsx` and its regression test. Final focused suite, complete web suite and web typecheck revalidate that adjustment; the full gate's final web build also used the final candidate. Other package sources/configuration remained unchanged. Optional contract fork coverage was gated by the unset RPC environment; no live-fork claim. All check processes have completed.

Actual request units: **0**. Acquisition/provider cost: **$0** (pricing not applicable). Provider counters printed by fixture tests describe mocked metered RPC, not acquisition. No live-chain access, paid job, network/port use, deployment, commit or push. Next action: lead Chromium measurement and merge review. Scoring/calibration/release and other parallel packets remain outside this change.
