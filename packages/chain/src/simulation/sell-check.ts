import { randomBytes } from 'node:crypto';
import { decodeAbiParameters, encodeFunctionData, parseAbi, toHex, zeroAddress, type Address, type Hex } from 'viem';
import { rpcStopReason } from '../rpc/metered.js';
import { EKO_PROBE_RUNTIME } from './probe-runtime.js';
import { EKO_V4_PROBE_RUNTIME } from './v4-probe-runtime.js';
import { percent, probeAbi } from './reference.js';
import { v3Legs, type ProbeLeg, type ReferenceRoute } from './v3.js';
import { v4PoolId, v4ProbeAbi, type V4PoolKey } from './v4.js';

/**
 * The live sell check: one buy-then-sell round trip of the never-deployed probe contract inside a single `eth_call`
 * at a pinned block. Only the probe's code and native balance are overridden; token, pool and curve state stay real.
 * BACKEND §6.2 names this fallback ("the same probe through eth_call with a state-override set") for hosts without an
 * Anvil fork. It is the contract-probe step only: no EOA deep simulation, no tax sinks, no trace.
 */
export const SELL_CHECK_METHOD = 'sell-check-1' as const;
export type SellRoute =
  | { venue: 'uniswap_v3'; coin: Address; pool: Address; router: Address; quoter: Address; weth: Address; fee: 100 | 500 | 3000 | 10000 }
  | { venue: 'pons_curve'; coin: Address; curve: Address }
  | { venue: 'uniswap_v4'; coin: Address; poolId: Hex; manager: Address; quoter: Address; key: V4PoolKey; hookData: Hex };
export type SellProbeStatus = 'sellable' | 'sell_failed' | 'buy_failed' | 'unavailable';
export interface SellProbe {
  method: typeof SELL_CHECK_METHOD; venue: SellRoute['venue']; routeId: string; block: string; sizeWei: string;
  status: SellProbeStatus;
  /** Bounded machine reason, never provider text (which can carry credentials). */
  reason: 'sell_reverted' | 'returns_under_5pct' | 'graduates_on_buy' | 'graduation_state_unknown' | 'provider_failure' | 'invalid_output' | 'invalid_debit' | 'zero_tokens' | null;
  spentWei: string | null; tokens: string | null; returnedWei: string | null; quotedSellWei: string | null;
  /** 100 × (spent − returned) / spent, from the probe's own ETH debit and credit. Null when not measured. */
  exitCostPct: number | null;
  /** Token-controlled revert bytes, truncated. Untrusted evidence, never display text. */
  revert: Hex | null;
  /** Paid requests this check made, for the caller's budget accounting. */
  requests: number;
}
export interface SellRpc { request(input: { method: string; params: readonly unknown[] }): Promise<unknown> }
export const ponsCurveSellCheckAbi = parseAbi([
  'function buy(uint256 quoteIn,uint256 minTokensOut,address recipient) payable',
  'function sell(uint256 tokensIn,uint256 minQuoteOut,address recipient)',
  'function sellableTokens() view returns (uint256)',
]);
const outputs = [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'bool' }, { type: 'bool' }, { type: 'bytes' }] as const;
const fresh = (random: (n: number) => Uint8Array) => `0x${Buffer.from(random(20)).toString('hex')}` as Address;
const leg = (target: Address, data: Hex, value = 0n, amountOffset = 0n, patch = false): ProbeLeg => ({ target, value, data, amountOffset, patch });
export function sellRouteId(route: SellRoute) {
  return route.venue === 'uniswap_v3' ? `uniswap_v3:${route.pool.toLowerCase()}` : route.venue === 'pons_curve'
    ? `pons_curve:${route.curve.toLowerCase()}` : `uniswap_v4:${route.poolId.toLowerCase()}`;
}
/** Probe calldata and runtime for one route. The probe address is both buyer and seller. */
export function sellProbeCall(route: SellRoute, probe: Address, sizeWei: bigint, deadlineSec: bigint): { code: Hex; data: Hex } {
  if (route.venue === 'uniswap_v4') {
    if (route.key.currency0 !== zeroAddress || route.key.currency1.toLowerCase() !== route.coin.toLowerCase() || v4PoolId(route.key).toLowerCase() !== route.poolId.toLowerCase())
      throw new Error('Unsupported v4 sell-check route');
    return { code: EKO_V4_PROBE_RUNTIME, data: encodeFunctionData({ abi: v4ProbeAbi, functionName: 'roundTrip', args: [route.manager, route.quoter, route.key, route.hookData, sizeWei] }) };
  }
  if (route.venue === 'pons_curve') {
    // A native Pons launch takes exactly msg.value as the quote input (pons-executable-notes, "Buy" 1).
    const buy = leg(route.curve, encodeFunctionData({ abi: ponsCurveSellCheckAbi, functionName: 'buy', args: [sizeWei, 0n, probe] }), sizeWei);
    // No Pons quote getter is verified: the quote leg is an empty call and reports nothing.
    const quote = leg(zeroAddress, '0x');
    // sell(tokensIn, minQuoteOut, recipient): the acquired amount is patched into the first word, after the selector.
    const sell = leg(route.curve, encodeFunctionData({ abi: ponsCurveSellCheckAbi, functionName: 'sell', args: [0n, 0n, probe] }), 0n, 4n, true);
    return { code: EKO_PROBE_RUNTIME, data: encodeFunctionData({ abi: probeAbi, functionName: 'roundTrip', args: [route.coin, route.curve, buy, quote, sell] }) };
  }
  const reference: ReferenceRoute = { venue: 'uniswap_v3', id: sellRouteId(route), coin: route.coin, router: route.router, quoter: route.quoter,
    weth: route.weth, fee: route.fee, deadline: deadlineSec, verification: { blockHash: '0x', evidenceIds: [] }, entryLimitSelectors: [], cooldown: null };
  const legs = v3Legs(reference, probe, sizeWei);
  return { code: EKO_PROBE_RUNTIME, data: encodeFunctionData({ abi: probeAbi, functionName: 'roundTrip', args: [route.coin, route.router, legs.buy, legs.quoteSell, legs.sell] }) };
}
/**
 * Run one sell check at a pinned block. Provider failures and malformed outputs are `unavailable`, never a failed sell.
 * Budget and shutdown stops from the metered transport propagate to the caller.
 */
export async function runSellProbe(rpc: SellRpc, route: SellRoute, sizeWei: bigint, block: bigint,
  options: { nowSec?: () => number; random?: (n: number) => Uint8Array } = {}): Promise<SellProbe> {
  if (sizeWei <= 0n || sizeWei >= 2n ** 128n || block < 0n) throw new Error('Invalid sell-check input');
  const random = options.random ?? randomBytes, probe = fresh(random), caller = fresh(random);
  const result: SellProbe = { method: SELL_CHECK_METHOD, venue: route.venue, routeId: sellRouteId(route), block: block.toString(), sizeWei: sizeWei.toString(),
    status: 'unavailable', reason: null, spentWei: null, tokens: null, returnedWei: null, quotedSellWei: null, exitCostPct: null, revert: null, requests: 0 };
  const call = async (params: readonly unknown[]) => { result.requests++; return rpc.request({ method: 'eth_call', params }); };
  const unavailable = (reason: NonNullable<SellProbe['reason']>) => ({ ...result, status: 'unavailable' as const, reason });
  // The router deadline only has to cover the pinned block; one hour past the local clock always does.
  const { code, data } = sellProbeCall(route, probe, sizeWei, BigInt(Math.floor(options.nowSec?.() ?? Date.now() / 1000)) + 3600n);
  let output: unknown;
  try {
    output = await call([{ from: caller, to: probe, data, gas: toHex(30_000_000n) }, toHex(block), { [probe]: { code, balance: toHex(sizeWei + 10n ** 18n) } }]);
  } catch (error) {
    if (rpcStopReason(error)) throw error;
    return unavailable('provider_failure');
  }
  let decoded: readonly [bigint, bigint, bigint, bigint, boolean, boolean, Hex];
  try {
    if (typeof output !== 'string' || !/^0x(?:[0-9a-f]{2})*$/i.test(output)) throw new Error();
    decoded = decodeAbiParameters(outputs, output as Hex);
  } catch { return unavailable('invalid_output'); }
  const [tokens, quotedSell, returned, spent, buyOk, sellOk, revert] = decoded;
  Object.assign(result, { spentWei: spent.toString(), tokens: tokens.toString(), returnedWei: returned.toString(), quotedSellWei: quotedSell.toString(),
    revert: revert === '0x' ? null : revert.slice(0, 2 + 512) as Hex });
  if (!buyOk) return { ...result, status: 'buy_failed', spentWei: null, tokens: null, returnedWei: null, quotedSellWei: null };
  // A buy that debits nothing, or more than the size, means the route did not execute as modelled.
  if (spent <= 0n || spent > sizeWei) return unavailable('invalid_debit');
  // Zero tokens for a real debit is not modelled (for example a clamped curve buy); it is not called a failed sell.
  if (tokens === 0n) return unavailable('zero_tokens');
  if (sellOk && returned * 20n >= spent) {
    // A round trip that returns more than it spent is reported as no cost, never as a negative one.
    return { ...result, status: 'sellable', revert: null, exitCostPct: returned >= spent ? 0 : percent(spent - returned, spent) };
  }
  const failed: SellProbe = { ...result, status: 'sell_failed', reason: sellOk ? 'returns_under_5pct' : 'sell_reverted',
    exitCostPct: sellOk ? percent(spent - returned, spent) : 100 };
  if (route.venue !== 'pons_curve') return failed;
  // A Pons curve closes for sells once a buy takes its last sellable tokens and graduation runs. That is not a
  // failed sell: re-read the curve's pre-buy capacity at the same block before calling it one.
  try {
    const capacity = await call([{ to: route.curve, data: encodeFunctionData({ abi: ponsCurveSellCheckAbi, functionName: 'sellableTokens' }) }, toHex(block)]);
    if (typeof capacity !== 'string' || !/^0x[0-9a-f]{64}$/i.test(capacity)) return unavailable('graduation_state_unknown');
    const sellable = decodeAbiParameters([{ type: 'uint256' }], capacity as Hex)[0];
    return tokens >= sellable ? { ...unavailable('graduates_on_buy'), exitCostPct: null } : failed;
  } catch (error) {
    if (rpcStopReason(error)) throw error;
    return unavailable('graduation_state_unknown');
  }
}
