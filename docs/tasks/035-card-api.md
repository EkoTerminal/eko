# Task 035 · V2 coin card projection and evidence reasons

Depends on 026, 029, 030, 031, 033, 034. Implements [Guard 2.0](../guard/guard-2.0.md) §§6–7. Expose all currently available facts and every unknown required row without implementing missing collectors in the server.

## Do

1. Project typed measurements into full CoinCardV2, versioned REST/MCP/WS schemas, nullable identity, complete reason list and internal evidence endpoints.
2. Add V1 compatibility projection without invented issuer/matches, masks with original semantics, superseded legacy assessment links and server totals by active version.
3. Test partial non-Pons cards, unknown/control false distinction, High-with-gaps, Elevated floor, no-verdict state, CA-34/35/36 counts and untrusted nested evidence.

## Don't

Compute funding/fork/replay in request handlers or infer completion from evaluatedPlaybooks.

## Report

Changed files and source/candidate revision; exact focused check commands and exit codes; remaining gaps and reproduction steps. For acquisition/runs, include actual request units, pricing/cost, coverage and process/log/checkpoint with next action. Distinguish fixtures from measured validation and prepared work from released work.
