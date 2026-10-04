# Task 005 · Web M1: design system, core components and copy

Read `AGENTS.md` first. Spec: `docs/eko/03-FRONTEND.md` **§7** (design system: tokens, type scale, surfaces, the
"Style under review" note — **Desk is the chosen style**), **§8** (copy and disclaimers: every constant in the code
block, and where each must appear), §14 milestone **M1** ("tokens, icons, `UntrustedText`, `VerdictChip`, `copy/` with
tests"), FACTS §7 (`Untrusted`, `Level`, `Verdict`, `WalletLabel` — import from `@eko/shared`).

## Visual reference (read only)

The approved look is the clickable prototype at `../app/` (React + plain CSS, sample data). It is the
**visual source of truth** where it is more specific than the spec. Port its look; don't copy its sample data or its
review-only style picker.
- Tokens: `app/src/styles/tokens.css` plus the **Desk** rules in `app/src/styles/themes.css` (everything under
  `[data-style=desk]` and the shared `:is([data-style=desk],…)` rules) — in the real app Desk is the only style, so
  fold those rules into plain tokens/classes; no `data-style` switch.
- Components to match: verdict chip (`.verdict`), heat tag, info popover, collapsible section, segmented control with
  sliding indicator, tabs, buttons, the phosphor chart plates (`app/src/lib/phosphor.js`, `app/src/lib/dither.js`).

## Do

1. **Tokens** in `apps/web/src/styles/tokens.css`: colours, the type scale (12 · 13 · 14 · 16 · 24 · page titles 52–76
   in the display face), radii (Desk: 2/2/3), surfaces, motion tokens, from the prototype's Desk values. Keep the
   existing SignalOS token names only where other kept code still uses them; otherwise replace.
2. **Fonts**: the prototype uses Syne for display; if the Syne font files are not in the repo, copy
   `../app/public/fonts/syne-*.ttf` into `apps/web/public/fonts/` with its OFL licence text (check the
   prototype folder for it; if absent, leave `TODO(spec): add Syne OFL licence`).
3. **Icons**: port the prototype's line icons (`app/src/components/icons.jsx`) to `apps/web/src/components/icons.tsx`
   (typed), merging with the existing file; same stroke weight.
4. **Components** in `apps/web/src/components/ui/` (typed, tested with Vitest + Testing Library if already in the
   lockfile, otherwise React's test renderer/`react-dom/server` string checks):
   - `VerdictChip` — icon **and** word for clear/monitor/danger (+ `info`, + pending "Scanning…"); never colour alone.
   - `UntrustedText` — renders an `Untrusted` value as text only (never HTML), shows a "truncated" affordance, and
     marks `agent_bait`/`impersonation` flags with a visible label; test that `<img onerror>` and "ignore previous
     instructions" render inert.
   - `HeatTag`, `Info` popover (Esc closes, focus returns), `Collapsible` (disclosure pattern, `inert` when folded,
     state remembered per id), `Seg` and `Tabs` with the sliding indicator — matching the prototype's behaviour.
5. **Copy**: `apps/web/src/copy/index.ts` with every §8 constant **verbatim**, plus a test that snapshots the exact
   strings and a lint-style test that no file under `apps/web/src` hard-codes the non-affiliation sentence or "DYOR"
   outside `copy/`.
6. A dev-only page `/__ui` (behind `import.meta.env.DEV`) showing every component and token for review.

## Don't

- Don't build routes, the shell, or data screens (task 006). Don't edit `docs/eko/` or the prototype.
- No new npm dependencies.

## Report

Files created/changed, which prototype pieces were ported, any spec/prototype conflict and how you resolved it,
`TODO(spec)` list, and typecheck/test/brand:check results.
