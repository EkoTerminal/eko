# Task 001 · Rename to EKO and strip SignalOS (build day 1, Sep 30)

Read `AGENTS.md` first. Spec: `docs/eko/04-BACKEND.md` §2.1–2.2 (layout, reuse/remove table, **brand retirement**),
§2.4 (`MARKET_DATA_SOURCE`, cookie, env names), §21.3 "Sep 30" row; `docs/eko/03-FRONTEND.md` §1.2 (kept, adapted and
removed) and §14 milestone M1 "Removals".

## Do

1. **Scopes and names.** Root package `eko`; `@signalos/*` → `@eko/*` everywhere (package.json names, imports,
   filters in root scripts, tsconfig paths, vitest/playwright configs). The lockfile will need updating for the renamed
   workspace packages only: run `pnpm install --offline` (no new dependencies). Keep the existing folder layout
   (`apps/server`, `apps/web`, `packages/shared`); new packages come in later tasks.
2. **Brand retirement (04-BACKEND §2.2).** Nothing served or configured carries the SignalOS brand:
   - `apps/web/index.html` title and meta → "EKO"; web manifest; favicon → the EKO mark (SVG, viewBox `0 0 36 36`,
     `fill="none" stroke="currentColor" stroke-width="1.25"`, path `M26 3a16 16 0 1 0 0 30M23 10a9 9 0 1 0 0 16M20 16a2.5 2.5 0 1 0 0 4`,
     on `#030b11` with stroke `#d4f4fa` for the favicon).
   - User-facing strings in the web app ("SignalOS" → "EKO"); the SignalOS brand kit served from `apps/web/public/brand/`
     must not be served — remove it from `public/` (the repo-level `brand/` folder can stay as history for now).
   - Cookie `sos_sid` → `eko_sid`; any `sos_` prefixes; env var names; `.env.example`; `/api/health` service name;
     log/service names; drop the `x-powered-by` header if present.
   - Root `README.md`: replace with a short EKO README (what it is, how to run dev/test, where the spec lives). No team
     names, no people, no company names. Keep third-party licence attributions in `NOTICE`/`LICENSE` intact, but remove
     SignalOS branding from our own headers.
   - Add `infra/brand-denylist.txt` (one term per line: `signalos`, `SignalOS`, `sos_`) and a root script
     `pnpm brand:check` (a small Node script in `scripts/`) that fails if any denylisted term appears (case-insensitive)
     in `apps/*/public`, `apps/web/index.html`, `.env.example`, `infra/`, and the built web assets if `apps/web/dist`
     exists. Add a unit test or a self-test mode for it.
3. **Removals.**
   - Delete `railway.json`.
   - Delete `apps/server/src/market/coinbaseFeed.ts` and everything that only it uses. `MARKET_DATA_SOURCE` becomes
     `onchain | demo` (zod enum in the server config). `demo` keeps working as today. `onchain` is not built yet: boot
     must fail fast with a clear error ("MARKET_DATA_SOURCE=onchain is not implemented yet") — leave
     `// TODO(spec): OnchainFeed (04-BACKEND §2.2)`. Default `demo` outside production.
   - Frontend §1.2 removals that are pure deletions (e.g. the Coinbase feed UI: `Markets.tsx`, `MarketHeader.tsx`,
     order books, tickers, `health.marketData`). If a removal would leave the app unable to render, replace it with
     the smallest placeholder and a `TODO(spec)` rather than building new screens — screens come in later tasks.
4. **Tests.** Update tests that assert SignalOS names or removed features (replace, don't delete coverage of kept
   behaviour). `pnpm typecheck`, `pnpm test` and `pnpm brand:check` must pass.

## Don't

- Don't build new EKO features, screens or packages in this task.
- Don't edit `docs/eko/`.
- Don't add dependencies.

## Report

What you renamed/removed (grouped), any SignalOS behaviour you had to keep for now and why, every `TODO(spec)`, and
the final typecheck/test/brand:check output summary.
