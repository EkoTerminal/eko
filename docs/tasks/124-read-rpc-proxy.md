# Task 124 · Expose the bounded keyless read-only RPC proxy

Read `AGENTS.md` first (rule 9 included). One engineer session. Spec: 04-BACKEND §23 CA-25; 03-FRONTEND §§6, 9.
Dependencies: 024, 090. This packet implements only the uncovered launch work; Guard 2.0 packets retain ownership of their logic.

## Do

1. Add POST /rpc for only the enumerated read methods on 4663 through metered clients, with 120/min caps and redacted error handling. Reject sends, historical tags, unknown methods and malformed/oversized requests; strip state overrides from eth_call.
2. Point web reads and receipt verification to the keyless endpoint without embedding a paid RPC URL or forwarding bearer/session material upstream.
3. Test every allowed method, mixed-batch bypass, state overrides, non-latest tags, failed provider and no credentials in output. Document which reads need privileged backend services rather than broadening this public proxy.

## Don't

- Don't edit `docs/eko/`, the Guard design or the prototype. No unrelated code, global configuration or dependency upgrades.
- No new dependencies unless explicitly named by the cited spec; update workspace declarations and `pnpm-lock.yaml` offline per AGENTS rule 6.
- Never add personal identifiers or real secrets. Use neutral fixtures; keep user keys/funds outside the server and fees away from the dev wallet.
- No commit, push, deploy, publication, external messages or paid runs without their separate explicit authorization. Keep unaccepted checks and features unavailable.

## Report

Changed files and candidate revision; exact focused checks plus `pnpm typecheck`, `pnpm test`, `pnpm brand:check` and `pnpm check:addresses` with exit codes; every `TODO(spec)`; remaining dependencies and reproduction commands. Separate fixtures from live evidence and built/tested/prepared from deployed or approved. Long jobs must report process/log/checkpoint and actual cost, coverage and next action.
