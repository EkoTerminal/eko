# Task 006 · Web M1: shell, route table, realtime, API base and mocks

Read `AGENTS.md` first. Spec: `docs/eko/03-FRONTEND.md` **§2.1** (navigation model: header, sidebar, list + inspector,
collapsible sections, phones), **§2.2** (route map — every route with stage, flag and auth), §5 (realtime), §14 M1
("the route table, `realtime.ts`, the `api.ts` base URL; mocks for every CA shape"), §15 (contract additions);
`docs/eko/04-BACKEND.md` §15.3 (WS channels) and §23 (`WsEventMap`); FACTS §7 (REST endpoints). Types come from
`@eko/shared` (task 002); components from `apps/web/src/components/ui` (task 005).

## Visual reference (read only)

`../app/` — the shell to port: `src/components/shell/Shell.jsx` (Header, Sidebar, MobileBar,
MobileTabs, Toasts), `src/App.jsx` (route wrapper and skip link), `src/styles/base.css` (shell, inspector, fold,
`.apphdr`, `.side`, centred `--frame` of 1880px, phone rules), `src/lib/expand.js` (the expanding-square transition).
Desk is the only style.

## Do

1. **Shell**: the full-width header (EKO mark linking to `/`, breadcrumb, live dot + head block + UTC clock), the
   sidebar (search, nav groups Terminal / Mission Control / Public record with numbered labels, trial card, risk mode,
   wallet button, legal line), phone top bar and tab bar, toasts, skip link, centred frame. Wire to the existing
   SignalOS router (`lib/router.ts`) and wallet code; keep SIWE/wallet behaviour working.
2. **Route table** from §2.2: every T route renders a page component (a titled placeholder with the page head is fine
   where the screen comes in M2/M3); D0 and Drop routes are registered only when their `FlagName` is on (flags from
   `GET /config`, mocked for now). Unknown paths render a not-found page. Keep `/__ui` from task 005 in dev.
3. **`lib/api.ts`**: one base URL (`VITE_API_URL`, default same-origin `/v1`), typed fetch helpers that parse
   responses with the `@eko/shared` zod schemas and map errors to `ApiError`/`ErrorCode`.
4. **`lib/realtime.ts`**: a typed WebSocket client over `WsEventMap` (subscribe/unsubscribe by channel, resync on
   reconnect, backpressure-safe), adapting the existing `lib/ws.ts` (keep its reconnect logic).
5. **Mocks**: `apps/web/src/mocks/` with one deterministic fixture factory per CA shape and FACTS §7 response, each
   validated by its zod schema in a test, plus a mock transport so the app runs fully offline with `VITE_MOCKS=1`.
6. **Expanding square**: port `expand.js` as a small hook/util used when an inspector or row opens a full page;
   honour `prefers-reduced-motion`.
7. Tests: route table (T routes always present; flagged routes absent when off), api parse/error mapping, realtime
   resubscribe on reconnect, every mock passes its schema.

## Don't

- Don't build the data screens (M2). Don't edit `docs/eko/` or the prototype. No new dependencies.

## Report

Files, route list with stage/flag, `TODO(spec)` list, typecheck/test/brand:check results, and whether `pnpm dev`
renders the shell (if you can't run a browser in the sandbox, say so).
