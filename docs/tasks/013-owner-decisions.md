# Task 013 · Apply the owner decisions of Sep 30 to the code

Read `AGENTS.md` first. The spec already carries these decisions; the code still shows the old state. Each item names
its spec section. Start from `main` after tasks 008 and 009 have merged (the shell already has nav icons and the
24/44 px targets on the screens those tasks ported).

## Do

1. **Rule Lab.** The tool is called "Rule Lab" in everything a user sees (03-FRONTEND §2.1, §2.2, §3.18): nav label,
   breadcrumb, page title, empty states, help/glossary text, onboarding. Keep the internal names unchanged: route
   `/lab` and `/lab/:loopId`, flag `loop_lab`, `LoopSpec`, `loop_compile`/`loop_backtest`, telemetry event names.
   Update `navigation.test.ts` and any snapshot to the new label.
2. **ADVISORY copy.** `apps/web/src/copy/index.ts` `ADVISORY` must equal 03-FRONTEND §8 exactly
   ('Advisory: your agent is told to check with EKO before every order. Robinhood’s own trade approvals, when they’re
   on, remain the enforced stop.'). Update the snapshot. Remove "off by default for external agents" anywhere else it
   appears in served copy (it is no longer a claim we make).
3. **Dark only** (03-FRONTEND §7.1, "Theme"). Remove the theme toggle, any light palette tokens, `prefers-color-scheme`
   switches and stored theme preferences from the web app. Keep the contrast tests for the dark tokens. Chart code
   that branches on theme keeps only the dark branch.
4. **Research link** (03-FRONTEND §2.1, §2.2). The Mission Control nav shows "Research" only when `deep_research` is
   on, and it opens `/research`, a new D0 route listing your Deep Research notes (`siwe`, flag `deep_research`).
   With mocks, list two sample notes linking to `/research/:id`. Replace the `/research/new` link and remove the
   `TODO(spec)` in `navigation.ts`. Flag off → no link, and `/research` behaves like other flag-off D0 routes.
5. **Remove the SignalOS analysts** (04-BACKEND §2 table, "`apps/server/src/bots/*`… **Remove**"; 03-FRONTEND §1.2
   line on `analyst.ts`, `trade/signals.ts`, `AiSetup.tsx`, `BotAvatar`, BotShop/BotDetail, chart BUY/SELL tags).
   Remove the bots, analysts, ensembles and the buy/sell signal feed from server and web, with their routes, store
   slices, onboarding/help references and tests. **Keep the paper engine** (it serves Beat the Swarm and the Arena)
   and anything it needs. Replace removed tests only where they covered behaviour that remains. Note any DB tables
   left orphaned (don't write a migration; list them in your report).
6. **Targets app-wide** (03-FRONTEND §7.4). Every interactive element is at least 24 × 24 px with a mouse
   and at least 44 × 44 px under `@media (pointer: coarse)`. Apply it once in the shared UI layer (buttons, icon
   buttons, chips, tabs, segmented controls, links styled as buttons) rather than per page, and add a test that
   asserts the rule exists in the shared CSS for both pointer types.

## Don't

- Don't rename routes, flags, contracts or telemetry. Don't edit `docs/eko/`. No new dependencies.
- Don't restyle screens beyond what an item needs.

## Report

Files by item, removed modules and any orphaned tables, `TODO(spec)` notes, typecheck/test/brand:check results.
