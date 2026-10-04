# Task 020 · Port the rest of Mission Control: agent detail, policy editor, approvals, Connect an agent

Read `AGENTS.md` first. A **port** like tasks 008/009/014/015: the approved prototype is the visual and behavioural
source of truth, the spec says where the data comes from and what is flagged. Match the prototype 1:1 at 1512×982,
1440×900, 1280×800 and 390×844. Mission Control's overview (task 009) is merged: reuse its parts
(`pages/mission/parts.tsx`, `lib/mission.ts`, `mocks/demo/mission*`) rather than copying them.

## Sources (read only)

- Prototype: `../app/src/pages/mission/AgentDetail.jsx`, `PolicyEditor.jsx`, `Approvals.jsx`,
  `Connect.jsx`, `parts.jsx`, `state.js`, `mission.css`, and `src/data/mission.js`. Run it with `npm run dev` in
  `RH Agents/app` (port 5190) to look; don't edit it.
- Spec: `docs/eko/03-FRONTEND.md` **§3.13** (agent detail: T journal, D0 the rest), **§3.14** (policy editor: T
  presets, D0 fields), **§3.15** (approvals queue and `/approve/:id`, D0 `approvals`), **§3.16** (soft and hard kill,
  D0 `mission_kill`), **§3.17** (Connect an agent: Claude Code, generic MCP and the Claude connector at T, the rest D0
  `packs_chatgpt_openclaw` / `onchain_guardrails`), §8 (`ADVISORY`, `ONCHAIN_ADVISORY` and where each shows), §2.2
  (routes, auth and flags). FACTS §7 + 04-BACKEND §23 for `Agent`, `AgentDetail`, `Policy`, `Approval`,
  `JournalEntry`, `UncheckedOrder`, `ApiKeyInfo`, `Pack`.

## Do

1. **Agent detail** `/mission/agents/:id`: header (name, kind, status, guardrails badge with the right advisory line),
   tabs as in the prototype; the journal at T (decision lines with reasons and the private commitment `Details`);
   performance, limits and connection tabs as the prototype shows them, with D0 parts absent when their flags are off.
2. **Policy editor** (agent tab): the Safe / Balanced / Degen presets at T; the editable fields only with
   `policy_editor`, saving through `PUT /v1/agents/:id/policy` with a confirm that shows the diff.
3. **Approvals** `/mission/approvals` and `/approve/:id` (flag `approvals`): the queue with countdowns, Approve / Deny
   with the two-step confirm already used on the overview, "Decided elsewhere" and expiry states, and the standalone
   approval page reached from a push or link. Absent (not disabled) with the flag off.
4. **Kill** (flag `mission_kill`): soft and hard stop from the agent header and Stop all, with the §3.16 confirmations
   and copy; reuse the overview's dialogs.
5. **Connect an agent** `/mission/connect`: the prototype's steps and pack cards. At T: Claude Code (API-key header),
   generic MCP, and the Claude Desktop / claude.ai connector (its stage follows `Pack.stage`, not a flag); ChatGPT and
   OpenClaw only with `packs_chatgpt_openclaw`; the on-chain path only with `onchain_guardrails`. Key creation shows
   the key once with copy and a "stored nowhere else" note; never log it. Step 4 shows `ADVISORY`.
6. **Mocks**: extend `mocks/demo/mission*` for these routes (agent detail, journal pages, policy save, approvals
   decisions, keys, packs) from the prototype's sample data.
7. **Tests**: flag-off absence for every D0 control; approval countdown/expiry; policy diff; key shown once; advisory
   copy per agent kind; Playwright spec `e2e/mission-screens.spec.ts` (+ config on port 5191) at the four sizes with
   flags on and off. You can't run Playwright; the lead does.

## Don't

- No backend routes (mocks only). Don't edit `docs/eko/` or the prototype. No new dependencies. Don't restyle the
  overview, Radar, Pairs, Feed or the coin view.

## Report

Files, what you couldn't match and why, `TODO(spec)` list, typecheck/test/brand:check results.
