# Task 002 · Freeze the day-1 shared contracts (build day 1, Sep 30)

Read `AGENTS.md` first. Spec: `docs/eko/FACTS.md` **§7** (core types and REST endpoints — the source of truth),
`docs/eko/04-BACKEND.md` **§21.1** (what is frozen), **§21.4** (`FlagName`, copied exactly), **§23** (contract additions
CA-1…CA-26: the types block, including `WsEventMap`), **§13** (receipt leaf format), **§5.5** (label tiers and
confidence bands), **§3.2** (table ownership), and the bus topics listed in §21.1.

## Do

Create `packages/shared/src/contracts/` and export it from `packages/shared/src/index.ts`:

1. **Every FACTS §7 type as a zod schema plus its inferred TS type** (`export const VerdictSchema = z.object(…)`,
   `export type Verdict = z.infer<typeof VerdictSchema>`). Field names, optionality and literal unions must match the
   spec exactly. Addresses validate as `0x` + 40 hex (lowercase-normalised on parse is fine; say so). One file per
   area (e.g. `coin.ts`, `harness.ts`, `receipts.ts`, `burn.ts`, `entitlements.ts`, `api.ts`).
2. **§23 additions** (all additive: never rename/retype a §7 field): the types in §23's block, including `WsClient`,
   `WsServer`, `WsEventMap`, `FeedItem`, `RadarRow`, `PairRow`, `ScanResult`, `ApiError`/`ErrorCode`, `PublicConfig`,
   `Me`, `Pack`, `LoopSpec`/`Bar`/`LoopBacktest`, `ResearchJob`/`ResearchNote`, `PerpContext`, `BurnStats` (v1.2 shape
   with `mode`, `burnWallet`, `ponsBuybacks`), keys/OAuth grant types, `UncheckedOrder`, etc. Where §23 only names a
   type without fields, define the smallest shape implied by its endpoint row and mark it `// TODO(spec): fields`.
3. **`packages/shared/src/flags.ts`**: `FLAG_STAGES`, `FlagName` exactly as written in §21.4, plus
   `OpsSwitch = 'trading_live' | 'swarm_ranking'` (typed separately, never part of `FlagName`) and a zod schema for
   `flags: Record<FlagName, boolean>`.
4. **Versions**: `schemaVersion` constants per receipt-hashed type (verdict, forecast, harness_private) as the spec
   describes, exported from one place.
5. **Bus topics**: a `BUS_TOPICS` const tuple with exactly the §21.1 topics, and a `busChannel(topic)` helper that
   returns `eko_<topic>` (Postgres NOTIFY channel; dots → underscores if NOTIFY needs it — check and document).
6. **Receipt leaf format (§13)**: the pure leaf-encoding function(s) the spec describes and the shared fixture
   `packages/shared/test/fixtures/receipts/v1.json` (items with `id`, `kind`, `hash`, their `itemId`s, leaves, a
   3-leaf root and its proofs). If the spec names a library not in the lockfile (e.g. `@openzeppelin/merkle-tree`),
   don't add it: implement the encoding with `viem` (already installed) and leave `// TODO(spec): switch to
   StandardMerkleTree when the dependency is added` — but make the fixture match StandardMerkleTree's documented
   encoding (sorted pairs, double-hashed leaves) so the switch is a no-op. Say which you did.
7. **Tests** (`packages/shared/test/contracts.test.ts` etc.): every schema parses a valid sample and rejects an
   invalid one; `FlagName` has exactly the §21.4 values; bus topics match §21.1; the receipt fixture's root and proofs
   verify. Keep all existing tests green.

## Don't

- Don't wire these into the server or web yet (later tasks), beyond exporting them.
- Don't edit `docs/eko/`. Don't add dependencies.

## Report

List the files created, any field you had to infer (`TODO(spec)`), any place §7 and §23 disagree, and the
typecheck/test summary.
