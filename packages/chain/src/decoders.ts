import { decodeEventLog, getAddress, toEventSelector, type Abi, type Address, type Log } from 'viem';
import { v3Abi, v4Abi, verifiedV4Events, erc20Abi, wethAbi } from './abis.js';
import { resolveActor, type ActorContext, type ActorTransaction } from './actor.js';
import type { AddressRegistry } from './registry.js';
export type DecoderLog = Pick<Log, 'address' | 'topics' | 'data'>;
export interface DecodeContext extends ActorContext {
  registry: AddressRegistry;
  tx?: ActorTransaction;
  /** Pool addresses discovered from a previously decoded PoolCreated. */
  isV3Pool?: (address: Address) => boolean;
}
type V3 = ReturnType<typeof decodeEventLog<typeof v3Abi>>;
type V4 = ReturnType<typeof decodeEventLog<typeof v4Abi>>;
type ERC20 = ReturnType<typeof decodeEventLog<typeof erc20Abi>>;
type WETH = ReturnType<typeof decodeEventLog<typeof wethAbi>>;
export type ChainEvent = ({ source: 'uniswap_v3' } & V3 | { source: 'uniswap_v4' } & V4 | { source: 'erc20' } & ERC20 | { source: 'weth' } & WETH) & { address: Address; actor?: Address };
export interface DecodeResult { events: ChainEvent[]; unknownTopics: number; malformedLogs: number }
const matches = (abi: Abi, topic: string | undefined) => abi.some(a => a.type === 'event' && toEventSelector(a) === topic);
export function decodeResult(log: DecoderLog, ctx: DecodeContext): DecodeResult {
  const address = getAddress(log.address);
  const isAddress = (key: Parameters<AddressRegistry['addressOf']>[0]) => ctx.registry.addressOf(key)?.toLowerCase() === address.toLowerCase();
  let abi: Abi | undefined;
  let source: ChainEvent['source'] | undefined;
  if (isAddress('uniswapV3.factory') || ctx.isV3Pool?.(address)) {
    const poolCreated = toEventSelector(v3Abi[0]);
    const validEmitter = isAddress('uniswapV3.factory') ? log.topics[0] === poolCreated : log.topics[0] !== poolCreated;
    if (validEmitter && matches(v3Abi, log.topics[0])) { abi = v3Abi; source = 'uniswap_v3'; }
  }
  if (isAddress('uniswapV4.poolManager')) {
    const verified = v4Abi.filter(a => (verifiedV4Events as readonly string[]).includes(a.name));
    if (matches(verified, log.topics[0])) { abi = verified; source = 'uniswap_v4'; }
  }
  if (!abi && isAddress('tokens.WETH') && matches(wethAbi, log.topics[0])) { abi = wethAbi; source = 'weth'; }
  // ERC-721 uses the same selector, but indexes its token id instead of ERC-20 data.
  if (log.topics[0] === toEventSelector(erc20Abi[0]) && log.topics.length === 4 && log.data === '0x') return { events: [], unknownTopics: 0, malformedLogs: 0 };
  if (!abi && matches(erc20Abi, log.topics[0])) { abi = erc20Abi; source = 'erc20'; }
  if (!abi || !source) return { events: [], unknownTopics: 1, malformedLogs: 0 };
  try {
    const event = decodeEventLog({ abi, topics: log.topics, data: log.data, strict: true });
    return { events: [{ ...event, source, address, ...(ctx.tx ? { actor: resolveActor(ctx.tx, ctx) } : {}) } as unknown as ChainEvent], unknownTopics: 0, malformedLogs: 0 };
  } catch { return { events: [], unknownTopics: 0, malformedLogs: 1 }; }
}
export function decode(log: DecoderLog, ctx: DecodeContext): ChainEvent[] { return decodeResult(log, ctx).events; }
export function decodeBatch(logs: readonly DecoderLog[], ctx: DecodeContext): DecodeResult {
  return logs.reduce<DecodeResult>((total, log) => {
    const result = decodeResult(log, ctx);
    return { events: [...total.events, ...result.events], unknownTopics: total.unknownTopics + result.unknownTopics, malformedLogs: total.malformedLogs + result.malformedLogs };
  }, { events: [], unknownTopics: 0, malformedLogs: 0 });
}
