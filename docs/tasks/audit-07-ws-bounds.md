# Audit fix 07: bound public WebSocket subscription work (Medium finding)

Source: `.audit-grade/REPORT.md` and `.audit-grade/findings.tsv`, finding
`offchain-backend|apps/server/src/ws/hub.ts|unbounded-subscription-work` (Medium, open).

## Problem (from the audit)
`/v2/ws` is public. In `Hub.addV2` (`apps/server/src/ws/hub.ts`), every schema-valid `sub` message re-adds a channel
the client already has (the 64-channel cap only blocks *new* channels), sends an ack, and starts another `card()`
database read. Message handlers are async and overlap; there is no per-connection message budget, no coalescing of
pending reads, no global work bound, ack/snapshot/error replies skip the `bufferedAmount` check that `publishV2` uses,
and disconnect does not cancel queued work. One client can make the API and database do unbounded work.

## Do
1. Per-connection message budget (token bucket or fixed window; pick limits from existing config/spec, else small
   sensible defaults in config with a `TODO(spec)`), with an `err` reply and, past a hard limit, closing the socket.
2. Re-subscribing to a channel already held or with a read in flight must not start another read: coalesce per
   (connection, channel), and cap concurrent snapshot reads per connection and globally (queue or reject when full).
3. Check `bufferedAmount` (same `MAX_BUFFER`) before **every** reply, including ack, snapshot and error; slow consumers
   get the existing `resync` behaviour, not unbounded queued sends.
4. On close/error, drop queued work and ignore late results.
5. Apply the same reasoning to the v1 handler if it shares the pattern; say what you found.
6. Tests against the **production registration** path (the app that serves `/v2/ws`), not just a detached helper:
   duplicate subscribe frames while a read is pending stay bounded; message flood gets rate-limited then closed; a
   slow consumer cannot enqueue unlimited snapshots; disconnect discards queued work; ordinary subscribe/fan-out still
   works (keep `guard-card-api.test.ts` passing).

## Proof
- New tests named in the report; `pnpm --filter @eko/server test` and root `pnpm typecheck` / `pnpm test` pass.

Follow AGENTS.md. Only this task. End with the AGENTS.md report.
