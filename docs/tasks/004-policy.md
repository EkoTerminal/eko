# Task 004 · packages/policy: the preflight policy engine and presets

Read `AGENTS.md` first. Spec: `docs/eko/04-BACKEND.md` **§9.6** (presets table, the `evaluate()` sketch with its
exact evaluation order and reason codes, idempotency rules), §9.3 (the `preflight` input schema), §9.7 (approvals) and
FACTS §7 (`Policy`, `PreflightRequest`, `PreflightResult`, `Agent`, `Verdict`, `CoinCard` — import these from
`@eko/shared`, built in task 002; don't redefine them).

## Do

1. Create the workspace package `packages/policy` (`@eko/policy`), wired like `packages/shared` and added to the root
   typecheck/test runs. No new dependencies (YAML: if no YAML parser is in the lockfile, ship the presets as a typed
   `presets.ts` and leave `// TODO(spec): presets.yaml served by GET /policy-presets`).
2. Implement `applyPreset` (a preset fills only fields the user left unset; the user's values win) with the §9.6
   table exactly (Safe / Balanced / Degen, including `approvalAboveUsd: none` for Degen and the stale-context rule).
3. Implement `evaluate(req, policy, agent, deps)` following §9.6 **in the same order with the same reason codes and
   texts** (`killed`, `stale_context`, `blocked_asset`, `not_allowed`, `sim_unavailable`, `scan_pending`,
   `honeypot`, `playbook_danger`, `playbook_monitor`, `thin_liquidity`, `round_trip_cost`, `missing_notional`,
   `position_cap`, `position_pct`, `daily_loss`, `earnings_blackout`, `leverage`, `approved`, `approval_denied`,
   `approval_expired`, `approval_unavailable`, `approval_required`). Honeypots deny in every mode. Sells skip most
   checks (kill and block lists still apply). `Deps` is injected (`now`, `verdictFor`, `cardFor`, `approvalFor`,
   `approvalsAvailable`, prices for `notionalOf`): pure, no I/O.
4. Implement the helpers the sketch uses: `normalizeInstrument`, `notionalOf`, `exitCostAt` (interpolating the card's
   exit-cost points), `daysUntil`, and `orderHash = keccak256(JCS(order))` — JCS per RFC 8785 (write a small canonical
   JSON serialiser if none exists in the repo; viem gives keccak256).
5. Idempotency (§9.6): a pure `resolveRepeat(stored, incomingOrderHash, reevaluate)` covering `order_mismatch`, replay
   of final results with the same `preflightId`, and full re-evaluation of a stored `needs_approval`.
6. Tests: a case for every reason code; evaluation order (e.g. killed wins over everything; deny collects all deny
   reasons plus warnings); preset filling; honeypot under `blockPlaybookLevel = null`; sells under a daily-loss stop
   allowed; approval flows (approved → allow, denied/expired → deny, unavailable → deny, pending → needs_approval);
   JCS canonicalisation vectors from RFC 8785; and a p95 micro-benchmark asserting `evaluate` stays well under 150 ms.

## Don't

- Don't build the MCP tool, database rows or journal writes (later tasks). Don't edit `docs/eko/`.

## Report

Files created, anything in the sketch you had to interpret (`TODO(spec)`), and the typecheck/test summary.
