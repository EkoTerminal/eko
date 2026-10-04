# Task 069 · Analyze non-Pons token control capabilities

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §6.3; Guard 2.0 §§3.4, 5.3, 7.1.
Dependencies: 026, 027, 035; Pons profiles remain in 039. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add a bounded collector for non-Pons EIP-1967/beacon/1167 proxy paths, observed owner/admin roles and known setter selectors. Use existing tools or whatsabi only as named by the spec; unknown code remains explicitly unknown.
2. Confirm suspected permissions in isolated fork calls that demonstrate changed state, version profiles by implementation/configuration/block, and invalidate on relevant changes. Feed typed capability evidence into the existing Guard card adapter.
3. Test inert ownership, proxy replacement, false/no-op setters, unknown roles and timelocked versus immediate capabilities. Do not infer absence of a power from a missing selector or successful no-op call.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
