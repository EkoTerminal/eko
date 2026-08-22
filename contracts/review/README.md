# ReceiptsRegistry review gate

This is scaffolding for BACKEND §14.0, not a completed review. D0 covers only
`src/ReceiptsRegistry.sol`, which holds no funds. Freeze the candidate commit and
record its hash, tool versions, reports and anonymous reviewer roles here before
the public window. Steps 1–3 finish before the Oct 5 freeze; the planned window is
Oct 5–8. Changes to the candidate require fresh evidence for affected checks.

| Step | Work and evidence | Pass bar |
| --- | --- | --- |
| 1. AI multi-agent review | Three independent sessions on the frozen commit, using different models or prompts with no shared context: adversarial state/griefing, spec comparison, invariants/math. Record each report and every finding in `findings.yaml`. | Every High/Medium fixed and rechecked by a fresh reviewer; every Low/Info resolved or accepted with a reason. |
| 2. Static analysis | Run Slither and Aderyn on every PR touching `contracts/`; archive output and triage it in the findings log. | No untriaged finding and no open High/Medium. |
| 3. Foundry tests | Unit, 1,000-run fuzz, handler invariants and pinned chain-4663 fork tests, plus coverage and gas reports from the same candidate. | 100% of the ReceiptsRegistry §14.6 row; attach coverage. A skipped fork is still pending. |
| 4. Public code-review window | Publish the frozen commit hash, findings and test reports in a GitHub release and announcement; accept public issues for 72 hours. | No open High/Medium at close; a High/Medium fix restarts the full 72-hour window. |
| 5. Bug bounty | Finalize the root `SECURITY.md` draft, enable GitHub private advisories and provision the placeholder reporting mailbox. Up to $500, paid from creator fees; disclose payouts. | Live by D0. |

Run from `contracts/` with the installed tools (no dependency installation):

```sh
forge test
forge test --match-path 'test/fork/*'
forge coverage --report summary
forge coverage --report lcov --report-file review/coverage.lcov
forge snapshot
forge test --match-contract ReceiptsRegistryGasTest --gas-report
slither . --config-file slither.config.json --json review/slither.json
aderyn . --src src --output review/aderyn.md
```

The fork needs `RPC_HTTP_URL`; without it Foundry reports a skip. Never attach
RPC credentials or absolute machine paths to published reports. Record the fork
block and actual chain id in the evidence. Coverage disables optimization for
instrumentation; production gas uses the normal §14.1 profile.

Slither keeps all detectors enabled and filters dependency/test/script findings
using its [configuration format](https://github.com/crytic/slither/wiki/Usage#configuration-file).
The [Aderyn configuration](https://cyfrin.gitbook.io/cyfrin-docs/aderyn-vs-code/aderyn.toml-configuration)
is also available to its editor integration; the CLI command supplies the source
scope explicitly. Neither configuration marks findings as resolved.

Each finding requires `id`, anonymous `reviewer`, `severity`, `location`, `title`,
`status` (`open|fixed|accepted|invalid`), `fix_commit`, and `recheck`. Use `null`
until a fix/recheck exists. Add a reason for acceptance or invalidation; a recheck
records the fresh reviewer role, checked commit, result and report location.
The initial entries flag preserved §14.2 behaviours for the independent reviews.
