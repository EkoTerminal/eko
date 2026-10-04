# Task 009 · Port the Mission Control overview from the approved prototype

Read `AGENTS.md` first. This is a **port**: the approved prototype is the visual and behavioural source of truth; the
spec says where the data comes from and which parts are flagged. Match the prototype 1:1 at 1512×982, 1440×900,
1280×800 and 390×844.

## Sources (read only)

- Prototype: `../app/src/pages/mission/Agents.jsx`, `parts.jsx` (StatusPill, PreflightBar,
  OutcomeKey, JournalLine, HardKillModal, useSoftKill, money/signed/agoText, PROTECTION, TERMS), `state.js`,
  `mission.css`, `src/components/common/index.jsx` (`Collapsible`, `Inspector`, `useSelection`, `onListKeys`),
  `src/components/chart/AreaChart.jsx` (the bars chart in the agent inspector), `src/styles/themes.css` (Desk rules).
  Run it with `cd ../app && npm run dev` (port 5190) if you need to see it; don't edit it.
- Spec: `docs/eko/03-FRONTEND.md` §3.12 (overview: Needs you, How it works, the last 24 hours, agent rows, agent
  inspector, Recent activity, terms; states and acceptance), §3.13 (tabs Activity · Limits · Performance ·
  Connection), §3.15 (approvals: approve/deny always needs a confirm), §3.16 (kill), §2.1, §7;
  FACTS §7 (`Agent`, `Approval`, `JournalEntry`, `Policy`) and 04-BACKEND §23 CA-18 (keys, `Agent.guardrails`,
  `UncheckedOrder`). **Flags** (04-BACKEND §21.4): `approvals`, `mission_kill`, `unchecked_orders`,
  `policy_editor` are D0 — when a flag is off its controls are **absent, not disabled** (§3.12).
- Already in the app: Desk tokens, `components/ui`, `components/ui/charts.tsx` (`Spark`, `MiniBars`),
  `lib/phosphor.ts`, the shell and inspector, `lib/api.ts`, `lib/realtime.ts`, mocks, the flags from `GET /v1/config`.

## Do

1. **Data**: `GET /v1/agents`, `GET /v1/agents/:id`, `GET /v1/agents/:id/journal`, `GET /v1/approvals` (only when
   `approvals` is on), `GET /v1/agents/:id/unchecked-orders` (only when `unchecked_orders` is on); WS `agents`,
   `approvals`. Mutations through `lib/api.ts`: approve/deny (`approvals`), pause/resume and Stop all
   (`mission_kill`).
2. **Mocks**: `apps/web/src/mocks/demo/mission.ts` — port the prototype's 4 agents, approvals, journals, hourly
   activity and performance (`app/src/data/mission.js`) into valid contract objects, and route the endpoints above to
   them. Add a mock flag preset so `VITE_MOCKS=1 VITE_FLAGS=d0` turns the D0 flags on for review (default: off, as at T).
3. **Screen**: page head with Connect an agent and Stop all (flagged), `Needs you` (collapsible, count, summary;
   approval rows with countdown + Deny/Approve each needing a confirm; unchecked orders with Copy instructions; paused
   agents with Resume), `How Mission Control works` (collapsible), the stats band with its four figures, context lines
   and charts, agent rows (status pill, checks bar, 24h `MiniBars`, money at work, today), the agent inspector with
   the four tabs, Recent activity (collapsible), What the terms mean (collapsible, folded by default). Collapsed state
   remembered per section.
4. **Copy**: plain language from the prototype; Advisory/Enforced wording from `copy/` (§8). Never imply EKO can block
   a Robinhood order.
5. **Behaviour**: keyboard list nav, Esc closes inspector and returns focus, expanding square to
   `/mission/agents/:id`, `inert` folded sections.
6. **Tests**: flags off → approval and kill controls absent; flags on → present and require a confirm; agent row
   rendering from mocks; mocks validate against their schemas.

## Don't

- Don't build Agent detail, Approvals, Connect or Loop Lab pages (other tasks). Don't edit `docs/eko/` or the
  prototype. No new deps.

## Report

Files, what you couldn't match and why, `TODO(spec)` list, typecheck/test/brand:check results.
