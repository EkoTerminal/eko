# Audit fix 11: run fork / integration tests against the real chain dependencies

Source: `.audit-grade/REPORT.md` (rescore), Path to 9 item "Run integration/fork tests against actual dependencies".
Rubric line (C, 1.0): fork / integration tests against real dependencies (routers, tokens, oracle feeds, real contract
calls), with candidate-linked results. Synthetic fixtures do not count.

You have **network access** for this task, only for read-only JSON-RPC to chain 4663 via the public endpoint
`https://rpc.mainnet.chain.robinhood.com` (and the public Blockscout API if a test needs it). Never sign or send a
transaction; never use a private key; no other network use.

## Do
1. Find every fork/integration suite: `contracts/test/fork/*` (Foundry fork test, currently skipped without an RPC),
   `pnpm test:fork` (apps/server), chain routing/probe tests that support a live RPC. Find the env vars they read.
2. Run them against the public RPC at **pinned block numbers** (use the pins the code already declares; the audit noted
   the server fork source pins block 77,469,811 while contracts/README.md still says block 1: make docs and code agree).
   Fix anything that prevents them running (missing env plumbing, rate limits → small retries/backoff in test helpers,
   not weakened assertions). Do not skip required checks.
3. Record results in `docs/security/FORK-TESTS.md`: date, commit (`git rev-parse HEAD`), RPC, block pins, commands, pass
   counts, anything skipped and why.
4. Add `.github/workflows/fork.yml`: `workflow_dispatch` plus a daily `schedule`, running the same commands with the public
   RPC (no secrets). Same hardening as ci.yml: actions pinned to the same full SHAs, `permissions: {}` plus
   `contents: read`, `persist-credentials: false`, timeouts, no `github.event` interpolation.

## Proof
- The run output summarised in FORK-TESTS.md; `pnpm typecheck` and `pnpm test` (offline suite) still pass.

Follow AGENTS.md. Only this task. End with the AGENTS.md report.
