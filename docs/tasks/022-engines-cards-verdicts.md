# Task 022 · apps/engines: card sources, playbook verdicts, the Signal, CoinCard assembly

Read `AGENTS.md` first (rule 9 included). The indexer (tasks 017/021) fills the chain tables from real Robinhood Chain
data. This task turns them into what the screens and agents read: verdicts and coin cards. Spec: `docs/eko/04-BACKEND.md`
**§6.4** (circulating supply), **§6.5** (CoinCard assembly, triggers, versioning, freshness), **§7.1–7.5** (rule contract,
the 13 playbooks, thresholds, verdict assembly, deployer and crew history, outcomes), **§7.7** (the Signal: five readings;
`packages/signal` already computes it), §3.2 (table ownership: Normalizer writes `coin_cards`, `coin_card_latest`,
`owner_powers`, `code_templates`; Playbooks writes `playbook_matches`, `verdicts`, `verdict_events`, `deployer_stats`,
`outcomes`), §21.1 (bus topics; `NOTIFY eko_<topic>` with ids only; consumers read rows), §9.5 (`toUntrusted`), FACTS §7
and §23 (`CoinCard`, `Verdict`, `PlaybookMatch`, `EvidenceRef`, `CoinSignal`, CA-31/CA-32).
Use `packages/playbooks` (the 13 pure rules, `CardSources`, `HistoryView`, the v1 config), `packages/signal`,
`packages/untrusted`, `packages/db` and `@eko/chain`; don't re-implement them.

**Not in this task** (later packets; leave the inputs absent, never faked): the buy-then-sell simulation and quotes
(`simulations`, exit costs, `hook.quoteSimGapPct`), owner-power analysis beyond templates (§6.3), and wallet labels /
crews / flow mix (§5). With those absent, the rules that need them don't match, and the card marks those sections
`unavailable` in `meta`. **A coin must never read "Clear" just because a check couldn't run:** the verdict carries which
playbooks were evaluated, and a coin whose required checks are missing is `pending`, not `clear` (if the shared
`Verdict` type has no way to say this, propose the smallest additive field in your report and use it behind a
`TODO(spec)`; the lead decides).

## Do

1. **`apps/engines`** (`APP_ROLE=engines`): a worker that listens on the bus (Postgres `LISTEN` in production; an
   in-process adapter for PGlite and tests, plus a cursor-based poll of `chain_blocks` as a fallback), with the §6.5
   triggers: a new pair at t0, then on meaningful change (a new swap > 5% price move, a liquidity event, holder shift),
   every 10 min for coins traded in the last hour, hourly otherwise, never for coins idle 7 days. Bounded concurrency,
   idempotent, resumable.
2. **Card sources** (`CardSources` from `packages/playbooks`) built from the chain tables only: identity (name/symbol
   through `toUntrusted`, deployer, launchpad, creation block/time), `antiSnipeActive` (Pons read through `@eko/chain`),
   `pons` (creator tax from the curve, exemptions with each wallet's prior rug history from `deployer_stats`, bought
   and held share from swaps and `balances`), `curve` (age, volume, progress; clusters left empty until crews exist),
   `wash` (round trips per actor within 1 h from `swaps`), `dominantPair`, `pools` and `liquidity` (from `pools`,
   `liquidity_events`; Pons-graduated pools are `pons_locked`), `graduation` (from the graduation marker task 021 sets;
   insider sells within 5 min), `trending` (rank by recent USD volume across tracked coins), `tokenText` (name, symbol).
   Pons token taxes come from the Pons template (fixed creator tax, not mutable); record the Pons token codehash in
   `code_templates` the first time it's seen, `TODO(spec)` for the template's reviewed profile.
3. **Playbooks engine**: run every rule with `HistoryView` backed by `deployer_stats` / `outcomes`; write
   `playbook_matches`, assemble the verdict exactly as §7.4 (Danger > Monitor > Clear, Info never escalates, ≤ 3
   templated reasons, `schemaVersion: 'verdict-1'`, `asOfBlock`, receipt pending), write a new `verdicts` row only when
   the level, the playbook set or the rules version changes, with `verdict_events`. Outcomes at +1 h, +24 h, +7 d from
   chain data (§7.5) and `deployer_stats` materialised from them.
4. **Signal**: `packages/signal` readings from the same sources (momentum from swaps, liquidity from depth when
   available else `lowData`, holders from `balances`, narrative from trending rank and agent share when available, risk
   from the matches); never used to rank.
5. **CoinCard assembly** (§6.5): `assembleCard(sources, verdict)` maps onto `CoinCard` one-to-one, rounding and hashing
   per §6.5; a new `coin_cards` row only on a hash change; `coin_card_latest` upserted; `NOTIFY eko_card_updated`.
   Circulating supply per §6.4 (unsold curve inventory excluded; `supply_anomaly` above $10B for a coin under 7 days).
   `freshness.block` = the oldest section's block; per-section confidence and `unavailable` sections in `meta`.
6. **Replay mode** (§4.3): `ENGINE_MODE=replay FROM=… TO=…` rebuilds verdicts and cards in block order with historical
   `valid_from_block`s, so the history (deployer runs, the 53-launch ring if it falls in the indexed range) shows on day 1.
7. **Tests** on PGlite with rows built from the real fixtures plus synthetic cases: each rule that can run on these
   sources fires at its §7.3 thresholds through the engine (exempt insiders, wash, serial deployer, fee-trap pool,
   removable liquidity, migration dump, agent bait from token text); verdict versioning (no new row without a change;
   `superseded` events); a coin with missing required checks is not `clear`; card hash stability; replay determinism
   (same range twice → identical rows).

## Don't

- No API routes or WebSocket channels (task 023). No simulation, quotes, owner-power selector analysis or Watcher
  labels (later tasks). Don't edit `docs/eko/`. No new dependencies. Rule 9.

## Report

Files, tables written, which playbooks can fire today and which wait for which later task, any additive contract field
you propose for "not yet checked", `TODO(spec)` list, typecheck/test/brand:check/check:addresses results, and the
commands for the lead to run the engines and a replay against a local PGlite filled by the indexer.
