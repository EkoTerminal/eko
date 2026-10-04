# Task 029 · Existing-data launch roles and partial identity

Depends on 026, 027. Implements [Guard 2.0](../guard/guard-2.0.md) §§2.1–2.2, 2.4, 7.1. Existing Pons launch events/senders/recipients support simple roles now; trace-dependent ambiguity stays explicit.

## Do

1. Preserve factory caller, outer signer, direct authenticated principal, economic recipient and deduplicated exemptions independently.
2. Remove no-deployer gate for V2 partial cards; store null complex/non-Pons principals and explicit trace/service jobs, with per-launch fee configuration only where observed.
3. Test direct EOA, shared caller, duplicate exemption, unknown issuer and batched unresolved launch without claiming code/delegation control.

## Don't

Infer all exemptions are insiders or turn abbreviated examples into full registry addresses.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
