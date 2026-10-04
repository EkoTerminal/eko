# Task 016 · packages/chain: address registry, `verify:chain` and decoders

Read `AGENTS.md` first. This is the first backend packet: everything that reads Robinhood Chain (chain id 4663) builds
on it. Spec: `docs/eko/04-BACKEND.md` **§4.4** (decoders: v3, v4, ERC-20, WETH, Pons, actor resolution), **§4.5**
(launchpad adapter interface, Pons), **§4.6** (address registry and `verify:chain`), §4.1 (transports), §2.1 (layout),
§2.4 (`ADDRESSES_FILE`, `RPC_HTTP_URL`, `RPC_FALLBACK_HTTP_URL`, `CHAIN_ID`), and `docs/tasks/VERIFIED-pons-2026-10-01.md`.

The lead already created `packages/chain` (`@eko/chain`, with `viem`, `yaml` 2.9.0 and `@eko/shared`; lockfile done)
and committed **real chain data** captured from the public RPC at block 77,438,572, under
`packages/chain/test/fixtures/4663/`: a Pons launch (log, tx, receipt), its curve logs (`CurveBuy`, `CurveSell`,
`SnipeTaxExempted`, with a duplicate exemption), a curve buy tx, token `Transfer`s, anti-snipe reads (9900 at the launch
block, 0 now), a Uniswap v3 pool (`PoolCreated` plus swaps and liquidity events), WETH `Deposit`/`Withdrawal`, v4
PoolManager logs, and bytecode sizes/hashes for 14 registry addresses plus the SwapRouter02 wiring reads. Verified
Pons fragments are in `packages/chain/abi/pons/events.json`. You have no network: build and test everything against
these fixtures. The lead runs the live checks.

## Do

1. **Registry** `packages/chain/addresses.4663.yaml`, in the §4.6 shape, with these now-known values (the lead resolved
   them from Uniswap's deployments file for 4663 and checked the bytecode on-chain): v4 `poolManager`
   `0x8366a39cc670b4001a1121b8f6a443a643e40951`, `v4Quoter` `0x8dc178efb8111bb0973dd9d722ebeff267c98f94`,
   `universalRouter` `0x204FAca1764B154221e35c0d20aBb3c525710498`, `permit2` `0x000000000022D473030F116dDEE9F6B43aC78BA3`;
   Pons `factory` `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e`, `v4Hook` `0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044`,
   `router` `0xe33E9E479dF8802cb0866d5d05258bEc4cF62948` (note: its launch event `0xdcacba5e…` is unidentified). Keep
   every other §4.6 entry, and keep unknown ones as `TODO` with their `hint`/`source`. Mark `required_for: T` on the
   v3 entries, WETH, USDG, multicall3 and the Pons factory and hook; `ours.burnWallet` is `required_for: D0`. Store
   addresses in EIP-55 checksum form.
2. **Loader** `loadRegistry(path = ADDRESSES_FILE)`: parse with `yaml`, validate with zod (chainId 4663, checksummed
   addresses, known keys only), and expose a typed `addressOf('uniswapV3.factory')` that returns `Address | null` for
   `TODO` entries (typed so callers must handle null). Tests for good, malformed and unknown-key files.
3. **One file for addresses** (§4.6, "CI refuses a build that references an address outside it"):
   `scripts/check-addresses.mjs` + root `pnpm check:addresses`, scanning `packages/*/src` and `apps/*/src` (not tests,
   fixtures, mocks or docs) for `0x` + 40-hex literals. A literal passes if it is in the registry, the zero address or
   `0x…dEaD`, or in a short commented allowlist for SignalOS heritage that isn't a 4663 mainnet address
   (`packages/shared/src/networks.ts` testnet entries, with `TODO(spec)`). Where `apps/server` uses a 4663 mainnet
   address that the registry holds, import it from `@eko/chain` instead (the dependency direction allows it; `packages/
   shared` must not depend on `@eko/chain`). Run it in `pnpm test` for the root (or document the CI hook) and keep it
   green.
4. **`verify:chain`** (`pnpm verify:chain` at the root → `@eko/chain`'s `src/verify-cli.ts`), with the logic in a pure
   module that takes an injected client so it is unit-tested against `registry-code.json`:
   - every entry with an address has code; an EIP-1967 proxy (USDG and the ERC-8004 identity registry are ~130–170
     byte proxies) is followed to its implementation, which must have code;
   - `check: router02_wiring` → `SwapRouter02.factory() == uniswapV3.factory` and `WETH9() == tokens.WETH`;
   - event checks: for the v3 factory (`PoolCreated`), the Pons factory (`TokenLaunched`), a Pons curve (`CurveBuy`,
     `CurveSell`, `SnipeTaxExempted`) and the v4 PoolManager (`Initialize`, `Swap`, `ModifyLiquidity`, `Donate`), fetch
     recent logs and confirm `topic0 == toEventSelector(signature)` and that they decode;
   - fails while any `required_for: T` entry is `TODO`; prints a table; non-zero exit on any failure. RPC: `RPC_HTTP_URL`,
     falling back to `RPC_FALLBACK_HTTP_URL` (default `https://rpc.mainnet.chain.robinhood.com`); refuses if
     `eth_chainId` ≠ 4663.
5. **Decoders** (pure; `decode(log, ctx)` → typed events; unknown topics return `[]` and are counted, never thrown):
   - Uniswap v3: `PoolCreated`, `Swap`, `Initialize`, `Mint`, `Burn` (topic-check against the fixture pool).
   - Uniswap v4 PoolManager: `Initialize`, `Swap`, `ModifyLiquidity`, `Donate` with the §4.4 signatures. **Compute each
     selector and confirm it against the topics in `v4-poolmanager-logs.json`.** If one doesn't match, don't ship that
     decoder: list it in the report with the observed topic.
   - ERC-20 `Transfer`; WETH `Deposit`/`Withdrawal`.
   - **Pons adapter** `src/launchpads/pons.ts` implementing the §4.5 `LaunchpadAdapter` types (put `LaunchpadEvent` /
     `LaunchpadAdapter` in `src/launchpads/types.ts` as written there): `TokenLaunched` → `launch`; `CurveBuy` /
     `CurveSell` → `trade` (side, `amountToken`, `amountEth` from `quoteIn`/`quoteOut`, `feeEth`), mapping the curve
     address to its token through a `tokenForCurve` lookup in the decode context; `SnipeTaxExempted` → `exempt`, with a
     `dedupeExempt` helper (the fixture has a wallet exempted twice). `antiSnipe(token, block)` reads
     `currentSnipeTaxBps` through an injected client (fixture: 9900 → 0). Graduation events and the router event stay
     undecoded with `TODO(spec)`.
   - **Actor resolution** (§4.4) as a pure function: inside a UserOp the UserOp sender; else a 7702-delegated `tx.to`
     called by someone else; else `tx.from`. EntryPoint addresses are TODO, so test the UserOp path with synthetic
     input and the plain path with the fixture buy tx.
6. **`abi:pull`**: `pnpm --filter @eko/chain abi:pull <launchpad>` uses `BLOCKSCOUT_API_KEY` when set; without it, it
   explains that the explorer is behind a bot check and points to `abi/<launchpad>/`. Never scrape around the check.
7. **Tests** for all of the above on the fixtures; no network in tests.

## Don't

- No indexer, DB tables or engines (next task). Don't edit `docs/eko/`. Don't add dependencies beyond what the lead
  installed (update the lockfile offline only if you need `tsx` as a dev dependency here, per AGENTS rule 6).

## Report

Files, the registry entries still `TODO`, any v4 selector that didn't match its fixture topic, `TODO(spec)` list,
typecheck/test/brand:check/check:addresses results, and the exact command for the lead to run `verify:chain` live.
