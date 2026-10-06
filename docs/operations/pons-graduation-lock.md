# Pons graduation pools: is the liquidity locked?

Checked on 2026-10-06 against Robinhood Chain (4663) at block 81,960,826. All reads went through the public RPC, and
every write was tried on a local Anvil fork of it (time-limited, fixed port, stopped afterwards). No real keys or funds
were used. **Result: the liquidity that a Pons graduation puts into its v4 pool cannot be removed by anyone.** Fees on an
existing pool are fixed, and no owner setting stopped swaps. The trade path re-proves the lock for each pool at each quote
and order (`apps/server/src/exec/pons-graduation.ts`).

## Contracts

| Role | Address | Evidence |
|---|---|---|
| Pons factory (registry `pons.factory`) | `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e` | `locker()`, `positionManager()`, `memeHook()`, `graduationExecutor()` read below |
| Pons v4 hook (registry `pons.v4Hook`) | `0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044` | `factory()` is the factory; `poolManager()` is the v4 PoolManager |
| Graduation executor | `0xC7819B64a1DAecd7EC19856D026cb14efBd89046` | mints the position (`mintFullRangePosition`) |
| Launch locker | `0x267444D099b10fB5ED7C3CC7b7C767ADcA574952` | holds the position NFT; runtime code hash `0x58455f80…2025` (1,969 bytes) |
| Uniswap v4 PositionManager | `0x58daec3116aae6D93017bAAea7749052E8a04fA7` | `name()` "Uniswap v4 Positions NFT", `poolManager()` is `0x8366…0951`; code hash `0xc873e135…70b2` |
| Uniswap v4 PoolManager (registry) | `0x8366a39CC670B4001A1121B8F6A443A643e40951` | verified registry entry |

The factory, hook and locker share one owner, `0x263e…19Dd`. It is a Safe with a 2-of-3 threshold (`getThreshold()` = 2). None of
the four contracts is a proxy: the EIP-1967 implementation, admin and beacon slots are all zero.

## The graduation path (sample: coin `0xEcfd…8e75`, pool `0xd86e…1d9b`, block 81,864,562)

The graduation transaction:

1. initializes the pool on the PoolManager with key (ETH, coin, fee 0, tick spacing 200, Pons hook);
2. has the executor approve Permit2 and mint one full-range position (ticks −887,200…887,200) through the
   PositionManager. The PoolManager `ModifyLiquidity` event names the PositionManager as `sender` (the position's owner in
   the PoolManager), with salt = token id 3,634,826 (minted to the locker in the same transaction, block 81,864,562);
3. mints the ERC-721 for that position straight to the launch locker, which records it (`lockPosition`) and also pulls in
   the reserved token supply (`lockTokenSupply`).

The same pattern holds at a second graduation (pool `0x1e17…cf1c`, token id 3,633,215).

## Who can remove the liquidity: nobody

- **PoolManager:** a position belongs to the account that created it (`sender`), here the PositionManager. Only the
  PositionManager can modify it.
- **PositionManager (canonical Uniswap v4 periphery):** `modifyLiquidities` decrease and burn, `transferFrom` and
  `subscribe` all require the NFT's owner or an approved account. `permit` and `permitForAll` need the owner's signature,
  and for a contract owner that means ERC-1271 `isValidSignature`. Reads at the block: `ownerOf(3634826)` is the locker,
  `getApproved` is zero, and `getPositionLiquidity` is 29,277,002,188,455,996,366,490. That equals the pool's active
  liquidity, so the locked position is the pool's only in-range liquidity.
- **Locker bytecode:** its dispatcher has exactly these functions: `lockPosition(address,uint256)`,
  `lockTokenSupply(address,uint256)`, `isLocked(address)`, `lockedPositions(address)`, `lockedTokenSupply(address)`,
  `setFactory(address)`, `positionManager()`, `factory()`, `onERC721Received`, and Ownable2Step
  (`owner`, `pendingOwner`, `transferOwnership`, `acceptOwnership`, `renounceOwnership`).
  - It has no `isValidSignature`, no unlock, withdraw or transfer function, and no DELEGATECALL, CREATE or SELFDESTRUCT.
  - It makes exactly two external calls: a STATICCALL of `ownerOf` (0x6352211e) on the PositionManager, and a CALL of
    ERC-20 `transferFrom(caller, locker, amount)`, which only pulls tokens in.
  - So no code path can approve, transfer or decrease the position. The owner's only lever, `setFactory`, changes who may
    add locks.
- **Fork attempts** (each one reverted):
  - `transferFrom` of the NFT, by a stranger and by the locker's owner;
  - `modifyLiquidities` with DECREASE_LIQUIDITY, by the owner Safe and by a stranger;
  - initializing a new pool with the Pons hook, by a stranger (the hook's `beforeInitialize` refused it), so Pons-hook
    pools come from the factory's graduation path.

Anyone can still add their own extra liquidity to a graduation pool (the hook has no add or remove permission), and they
can remove that again. The locked full-range position always stays.

## Fees and swaps on an existing pool

- **Hook permissions** (the low bits of its address, `0x3044`): beforeInitialize, afterInitialize, afterSwap and
  afterSwapReturnDelta. It has no beforeSwap and no add, remove or donate hooks. On swaps the hook keeps 3% of the output
  (creator tax 200 bps plus hook fee 100 bps; `launches(poolId)` holds them, and a fork buy and sell confirmed it).
- **What the hook owner can change.** The hook exposes `setHookFeeBps` (capped at 1,000 bps, so 1,001 reverts),
  `setProtocolFeeRecipient`, `setBuybackBurnBps`, `setBuybackVault`, `setMaxInternalPriceImpactBps`, `setFeeSweepOperator`,
  `setBuybackEnabled(bytes32,bool)`, `setCreatorFeeRecipient(bytes32,address)` and `rescuePoolFees(bytes32)`. It has no
  pause or blacklist function. On the fork, the accepted settings (hook fee 200 and 1,000, burn 10,000, protocol
  recipient) left the existing pool's buy and sell quotes unchanged, because each launch keeps the fee terms it was
  registered with. The others reverted. The factory's `setBuybackEnabled(coin,true)` also reverted.
- **Uniswap's own fee switch.** The PoolManager's protocol-fee controller (`0x6d00…314c`) can set a protocol fee of up to
  1,000 pips (0.1%) per direction on any v4 pool; 1,001 reverts on the fork.

Remaining exposure: a holder's future exit can cost at most that 0.1% more. The per-trade simulation measures the actual
cost at every quote and order.

## How EKO uses this

A v4 pool counts as a locked Pons graduation pool only when all of these hold at the block:

- its hook is the registry's `pons.v4Hook`, and it is the indexer's graduation record for the coin;
- the factory's `memeHook()` is that hook;
- `locker()` and `positionManager()` have the reviewed code hashes above, and the PositionManager points at the
  registry PoolManager;
- the locker's `lockedPositions(coin)` NFT is owned by the locker, with no approval, with liquidity, on exactly this pool.

Such a pool is admitted like a Pons curve: its exact simulated round-trip cost is checked against the mode's
`maxRoundTripCostPct`, instead of the ±2% depth floor, and the sell check and per-trade simulation still apply. Any
failed check, or any other v4 or v3 pool, keeps the depth floor. If the locker or PositionManager code ever changes, the
hash check fails and the depth floor returns.

## Independent check (2026-10-06, lead review)

An earlier draft of this file cited token id 3,635,850 for the sample; that token was minted to another account at
block 81,903,563 and later burned by it, so it is not a graduation position. The sample's actual position is
3,634,826: the PositionManager `Transfer` from zero to the locker at block 81,864,562. Re-read at block ~81,974,000:
`ownerOf(3634826)` is the locker, `getApproved` is zero and `getPositionLiquidity` is 29,277,002,188,455,996,366,490
(unchanged). Across blocks 81,000,000–81,975,000 the locker received 40 position NFTs and sent none out. The trade
route does not rely on any token id in this file: it re-reads ownership, approval and the pool binding per quote.
