# 023c implementation report

The read migration no longer places unbounded chain identity text in B-tree keys or INCLUDE columns. Search still checks complete stored values. The migration is now `0113_v1_reads`, leaving `0111_pending_senders` available to task 025. No dependencies or `docs/eko/` changes were made. No personal identifiers were added or ported.

## Fixes

- Removed `tokens_symbol_lower`, which indexed the complete lowercased symbol.
- Replaced the covering symbol index with `(left(lower(symbol),64), address)`. The text key is bounded to 64 Unicode characters (at most 256 UTF-8 bytes); no raw name, symbol, launchpad, or JSON is included.
- Symbol search uses the identical bounded expression to find candidates, then checks `lower(symbol) = query` before ordering/limiting. Prefix collisions cannot become false matches or displace actual matches.
- Name search retains GIN over lowercased one-, two-, and three-character terms. Each key is at most 12 UTF-8 bytes. Terms come from the complete name so substring matches after a 64-character prefix remain discoverable. The full-value substring predicate rejects term-only matches. No B-tree name index is needed.
- Renamed the file, migration id/splitting rule, engine migration fixture reference, benchmark reference, and prior implementation report to `0113_v1_reads`.
- Added a transactional upgrade path for a database that successfully applied the old `0111_v1_reads`: drop both unsafe symbol indexes, install the bounded index from the new migration SQL, and rename its ledger entry without rerunning table/projection backfills. The old id remains only as a compatibility lookup and regression fixture. Failed old migrations roll back and take the normal new migration path.

## Migration and trigger audit

Read every SQL migration in both migration directories, their migration runners, the matching schema definitions, and the chain/engine producers of indexed values. No additional chain-fed raw text or JSON B-tree/INCLUDE patterns were found outside the two corrected indexes.

| Migration | Indexed chain-fed values and result |
|---|---|
| `0101_chain` | Token name/symbol and event JSON are heap values. Keys/indexes use addresses, hashes, timestamps, blocks, and log indexes. Stream names are application values. No change. |
| `0102_market` | Balances/bars use addresses and timestamps; transfer/swap indexes use addresses and blocks/times. Supply is numeric. No change. |
| `0103_range_errors` | Error text is unindexed. No change. |
| `0104_engines` | JSON profiles, matches, verdicts, outcomes, and cards are unindexed payloads. Text keys are generated receipt/card ids, Keccak code hashes, local rule/playbook versions, and finite horizon/kind values. No raw identity in a key. |
| `0105_engine_activity` | Block/time/address keys. Activity revision/source are not indexed identity payloads. No change. |
| `0106_engine_rules_versions` | Adds application rules-version keys alongside addresses and blocks. No change. |
| `0107_engine_pons_static` | Coin-address primary key; static profile JSON is unindexed. No change. |
| `0108_engine_query_indexes` | Addresses, blocks, timestamps, local versions, and numeric USD INCLUDE. Outcome predicate is an application enum. No change. |
| `0110_rpc_usage` | Date, locally selected provider, and SDK RPC method names; no token metadata or RPC response payloads in keys. No change. |
| `0113_v1_reads` | Corrected symbol indexes. Name GIN keys are bounded terms. Other projection keys use addresses, numbers, application kinds, and generated event ids. `read_feed.symbol` and `data` remain unindexed heap values. Bar INCLUDE fields are numeric. |
| Server `0000_init` | Account/order/strategy identifiers, status/time keys, and configured market ids. Names/descriptions and JSON are unindexed. Legacy market ids come from `MARKETS`; indexed chain reads do not pass token name/symbol into these keys. No change. |
| Server `0001_feature_flags` | Application flag keys; no chain-fed metadata. No change. |

The read functions and triggers were reviewed individually:

| Function | Raw text/payload handling |
|---|---|
| `read_feed_identity` | Copies full token symbol to the unindexed feed heap column; event keys remain independent of it. |
| `refresh_read_coin` | Uses addresses, block/time values, local tier/stage values, and engine-produced numeric curve progress. No name/symbol/JSON key. |
| `read_card_change` | Dispatches by coin address only. |
| `read_swap_change` | Maintains address-based buyer keys and numeric activity/counts. |
| `read_token_change` | Keeps full feed identity text in heap values. Constructs event ids from address/block, not text. |
| `read_pool_change` | Constructs event ids from pool/token identifiers. No metadata in indexed values. |
| `read_verdict_change` | Stores JSON payload in heap; uses generated verdict/event ids and addresses for keys. |
| `read_match_change` | Constructs ids from address/block/local rules version/playbook enum; payload JSON stays unindexed. |
| `read_bar_change` | Updates numeric volume by coin address. |
| `read_name_terms` | Produces distinct terms of at most three Unicode characters for GIN, never a raw-text B-tree entry. |

## Regression evidence

`apps/server/test/untrusted-token-ingest.test.ts` adds two offline end-to-end database tests:

1. Ingest captured v3 pool discovery and a Pons launch with deterministic high-entropy names and symbols of at least 10 KB, **before** engine/read migrations; then apply/reapply the renamed migration and run the engines and all read endpoint families.
2. Emulate an already-applied old read migration, repair its unsafe indexes, then ingest the same large identities with control characters and RTL overrides. Run the engines and every read endpoint family again.

Assertions cover exact raw name/symbol round trips in `tokens`, full raw feed-symbol preservation, actual token index definitions, bounded GIN term bytes, name matches beyond the prefix, full-symbol matches, and rejection of symbol-prefix collisions. Card, Radar, Pairs, Feed, and search display fields are compared with `toUntrusted` output. Read calls cover all three Pairs stages, Feed and produced-kind filters, scan, card, verdict, flow, candles, and markers. Identity-only v3 tokens retain pending search semantics and the specified card/verdict/flow `not_found` results; they do not acquire fabricated cards. No indexer, engine, migration, or read call fails.

The hostile text is generated deterministically from neutral fixture seeds, with enough entropy to avoid compression concealing the oversized-index regression. Storage is preserved; clipping and control/RTL removal happen only in the display boundary.

## Checks

- Focused hostile-ingest/migration/read tests: 2 passed, exit 0.
- Root `pnpm typecheck`: passed, exit 0.
- Root `pnpm test`: passed, exit 0, including all 85 server tests and the renamed migration engine tests. The existing optional Foundry fork test remains skipped.
- `pnpm brand:check`: passed, exit 0 (15 scan targets).
- `pnpm check:addresses`: passed, exit 0 (260 source files).
- `git diff --check`: passed, exit 0.

Local pnpm commands use `--config.verify-deps-before-run=false`; installed dependencies and lockfile are unchanged. No tests were skipped or weakened. No network or listening ports were used. The lead still reruns the migration on the full replay database. The previous 023b timing/query-plan artifact is historical evidence; its old search-index plan is not evidence for this revision.
