import { createPublicClient, toHex, parseAbi, type Address, type Hex } from 'viem';
import { createMeteredClients, rpcStopReason, isRpcUnavailable, type AddressRegistry, type RpcEnv, type RpcMeter } from '@eko/chain';
import type { ChainClient, RpcBlock, RpcLog, RpcReceipt, TokenMetadata, EthUsdRate } from './types.js';
import { budgetedQueries } from './log-budget.js';
import { ethUsdFromSlot0 } from './price.js';
const metadataAbi = parseAbi(['function decimals() view returns (uint8)', 'function symbol() view returns (string)', 'function name() view returns (string)', 'function totalSupply() view returns (uint256)']);
const factoryAbi = parseAbi(['function getPool(address tokenA, address tokenB, uint24 fee) view returns (address)']);
const priceAbi = parseAbi(['function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)', 'function liquidity() view returns (uint128)', 'function token0() view returns (address)']);
const poolAbi = parseAbi(['function factory() view returns (address)', 'function token0() view returns (address)', 'function token1() view returns (address)', 'function fee() view returns (uint24)', 'function tickSpacing() view returns (int24)']);
export function createClients(env: RpcEnv, registry: AddressRegistry, meter: RpcMeter, options: { head?: boolean; enrich?: boolean } = {}): ChainClient {
  const { paid: client, reads, archive, public: backfill, head: live, headTimestamp, headWs } = createMeteredClients(env, { meter });
  const enrichment=createPublicClient({transport:meter.transport('enrich')});
  const publicHeaders=createPublicClient({transport:meter.transport('public')});
  const stateReads=options.enrich ? enrichment : reads;
  const metadataReads=options.enrich ? enrichment : archive;
  const checkGuard = (results: readonly { status: string; error?: unknown }[]) => {
    for (const result of results) if (result.status === 'failure' && (rpcStopReason(result.error) || isRpcUnavailable(result.error))) throw result.error;
  };
  let referenceRead:Promise<EthUsdRate|null>|undefined;
  let referencePool: { address: Address; weth0: boolean } | undefined;
  const multicallAddress = registry.requireAddress('multicall3');
  const tokenMetadataBatch = async (addresses: Address[], blockNumber: bigint): Promise<TokenMetadata[]> => {
    if (!addresses.length) return [];
    const fields = ['decimals', 'symbol', 'name', 'totalSupply'] as const;
    const results = await metadataReads.multicall({ multicallAddress, blockNumber, allowFailure: true, batchSize: 8192, contracts: addresses.flatMap(address => fields.map(functionName => ({ address, abi: metadataAbi, functionName }))) });
    checkGuard(results);
    if (results.every(r => r.status === 'failure')) throw new Error('Token metadata archive read failed');
    return addresses.map((_, i) => {
      const value = (offset: number) => { const result = results[i * 4 + offset]; return result.status === 'success' ? result.result : null; };
      return { decimals: typeof value(0) === 'number' ? value(0) as number : null, symbol: typeof value(1) === 'string' ? value(1) as string : null, name: typeof value(2) === 'string' ? value(2) as string : null, totalSupply: typeof value(3) === 'bigint' ? value(3) as bigint : null, supplyBlock: typeof value(3) === 'bigint' ? blockNumber : null };
    });
  };
  // Raw RPC keeps receipt/log quantities identical to captured fixtures, including system transactions.
  const request = async <T>(method: string, params: unknown[]): Promise<T> => client.request({ method, params } as never) as Promise<T>;
  return {
    rpcStopped: () => meter.isStopped,
    rpcTiming: () => ({ ...meter.timing }),
    chainId: () => client.getChainId(), head: () => (options.head ? live : client).getBlockNumber({ cacheTime: 0 }),
    block: n => request<RpcBlock>('eth_getBlockByNumber', [toHex(n), true]),
    header: n => options.enrich ? enrichment.request({method:'eth_getBlockByNumber',params:[toHex(n),false]} as never) as Promise<RpcBlock> : request<RpcBlock>('eth_getBlockByNumber', [toHex(n), false]),
    parentHeader: n => publicHeaders.request({method:'eth_getBlockByNumber',params:[toHex(n),false]} as never) as Promise<RpcBlock>,
    timestampHeader: n => headTimestamp.request({method:'eth_getBlockByNumber',params:[toHex(n),false]} as never) as Promise<RpcBlock>,
    receipts: n => (options.enrich ? enrichment : options.head ? live : client).request({method:'eth_getBlockReceipts',params:[toHex(n)]} as never) as Promise<RpcReceipt[]>,
    async logs(input) {
      const logs: RpcLog[] = [];
      for (const { from, to, address, addresses, topics, topicFilters } of budgetedQueries(input)) logs.push(...await (options.head ? live : backfill).request({ method: 'eth_getLogs', params: [{ fromBlock: toHex(from), toBlock: toHex(to), ...(addresses ? { address: addresses } : address ? { address } : {}), topics: topicFilters ?? [topics] }] } as never) as RpcLog[]);
      return logs;
    },
    timestampLogs: input => request<RpcLog[]>('eth_getLogs',[{fromBlock:toHex(input.from),toBlock:toHex(input.to),topics:[input.topics]}]),
    code: async (address, blockNumber) => (await stateReads.getCode({ address, blockNumber })) ?? '0x',
    tokenMetadata: async (address, n) => (await tokenMetadataBatch([address], n))[0],
    tokenMetadataBatch,
    async ethUsdRate(blockNumber) {
      // Adjacent sample periods can prefetch together; discover the reference once.
      if(!referencePool&&referenceRead)await referenceRead;
      if (referencePool) {
        const slot = await archive.readContract({ address: referencePool.address,blockNumber,abi:priceAbi,functionName:'slot0' });
        return { value:ethUsdFromSlot0(slot[0],referencePool.weth0,registry.data.tokens.WETH.decimals!,registry.data.tokens.USDG.decimals!),block:blockNumber };
      }
      const discover=async():Promise<EthUsdRate|null>=>{
        const weth = registry.requireAddress('tokens.WETH'), usdg = registry.requireAddress('tokens.USDG');
        // TODO(spec): No preferred WETH/USDG fee tier is specified; use the deepest initialized standard-fee pool at the sample block.
        const candidates = await archive.multicall({ multicallAddress, blockNumber, allowFailure: true, contracts: [100, 500, 3000, 10000].map(fee => ({ address: registry.requireAddress('uniswapV3.factory'), abi: factoryAbi, functionName: 'getPool', args: [weth, usdg, fee] as const })) });
        checkGuard(candidates);
        if (candidates.every(r => r.status === 'failure')) throw new Error('ETH/USD archive discovery failed');
        const addresses = [...new Set(candidates.flatMap(r => r.status === 'success' && lower(r.result) !== native ? [r.result] : []))];
        if (!addresses.length) return null; // Before the reference market existed.
        const reads = await archive.multicall({ multicallAddress, blockNumber, allowFailure: true, contracts: addresses.flatMap(address => (['slot0', 'liquidity', 'token0'] as const).map(functionName => ({ address, abi: priceAbi, functionName }))) });
        checkGuard(reads);
        let best: { liquidity: bigint; value: number; address: Address; weth0: boolean } | null = null;
        for (let i = 0; i < addresses.length; i++) {
          const slot = reads[i * 3], liq = reads[i * 3 + 1], token = reads[i * 3 + 2];
          if (slot.status !== 'success' || liq.status !== 'success' || token.status !== 'success') continue;
          const liquidity = liq.result as bigint; const sqrtPriceX96 = (slot.result as readonly unknown[])[0] as bigint;
          if (liquidity === 0n || sqrtPriceX96 === 0n) continue;
          const token0 = token.result as Address;
          if (![weth, usdg].some(a => lower(a) === lower(token0))) throw new Error('Unexpected ETH/USD pool currencies');
          const value = ethUsdFromSlot0(sqrtPriceX96, lower(token0) === lower(weth), registry.data.tokens.WETH.decimals!, registry.data.tokens.USDG.decimals!);
          if (!best || liquidity > best.liquidity) best = { liquidity, value, address: addresses[i], weth0: lower(token0) === lower(weth) };
        }
        if (!best && reads.some(r => r.status === 'failure')) throw new Error('ETH/USD archive slot0 read failed');
        if (best) referencePool = { address:best.address,weth0:best.weth0 };
        return best ? { value: best.value, block: blockNumber } : null;
      };
      const read=referenceRead=discover();
      try {return await read;} finally {if(referenceRead===read)referenceRead=undefined;}

    },
    async v3Pool(address, blockNumber) {
      try {
        // One pinned Multicall instead of a serial factory read and four independent calls.
        const results = await stateReads.multicall({ multicallAddress, blockNumber, allowFailure: true,
          contracts: (['factory', 'token0', 'token1', 'fee', 'tickSpacing'] as const).map(functionName => ({address, abi: poolAbi, functionName})) });
        checkGuard(results);
        const factory = results[0];
        if (factory.status === 'failure') throw factory.error;
        if (lower(factory.result as Address) === native) return null;
        for (const result of results) if (result.status === 'failure') throw result.error;
        const [,currency0,currency1,fee,tickSpacing] = results.map(r => r.status === 'success' ? r.result : null) as [Address,Address,Address,number,number];
        return { currency0, currency1, fee, tickSpacing };
      } catch (error) {
        // Contract reverts mean this emitter is not a readable v3 pool; transport failures must retry the block.
        if (rpcStopReason(error) || isRpcUnavailable(error)) throw error;
        if (error instanceof Error && /revert|returned no data/i.test(error.message)) return null;
        throw error;
      }
    },
    ...(headWs ? { watch: (onHead: (n: bigint) => void, onError: (error: unknown) => void) => headWs.watchBlockNumber({ emitMissed: true, onBlockNumber: onHead, onError }) } : {}),
  };
}
export const native: Address = `0x${'0'.repeat(40)}`;
export const lower = (address: string): Hex => address.toLowerCase() as Hex;
