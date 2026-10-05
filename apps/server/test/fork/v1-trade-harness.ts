/**
 * Fork-test stand-in for the trade acquisition registry that production does not have yet.
 *
 * `buildApp` only quotes v1 trades when the host passes a `tradeBackend`; `src/index.ts` passes none, so every
 * production `/v1/trade/quote` answers `sim_unavailable` (see the TODO(spec) in `src/app.ts`). This harness supplies
 * the pieces that registry would own, built from the real server modules wherever they exist:
 *
 * - routes: the real `UniswapV3Adapter.quoteTrade` through `v3TradeBackend`, over indexed `pools` rows read with
 *   `indexedV3Pools` and the API's own metered mainnet client;
 * - capture: current account/route/policy state at the chain head, with the owner's wallet as the trading agent;
 * - probe: a measured EOA simulation of the exact unsigned transaction on a separate simulation Anvil (the role of
 *   the private `sim` host), reset to the order's block through `SerializedMeteredForkLease` and never touching the
 *   chain the wallet trades on;
 * - reconciliation: the real `v3ReconciliationBackend` and `decodeV3Fill`, with a measured post-fill sell replay.
 *
 * Synthetic inputs, stated plainly: the Guard assessment is a fixture marked `active` (no Guard v2 release is active
 * in production), USD prices come from the WETH/USDG pool spot price (USDG = $1), and the ±2% depth is a quoter
 * ladder measured once per route at quote time. Quote-time taxes and exit cost are reported as zero.
 */
import { appendFileSync } from 'node:fs';
import { decodeFunctionData, encodeFunctionData, keccak256, padHex, stringToHex, toHex,
  type Address, type Hex, type PublicClient } from 'viem';
import { binary, type SqlClient } from '@eko/db';
import { loadRegistry, SerializedMeteredForkLease, type AnvilRpc, type MeteredForkLease } from '@eko/chain';
import { ActualOrderBindingSchema, canonicalize, GUARD_CHECK_IDS, GUARD_CHECK_TIERS, GuardAssessmentV2Schema,
  type ActualOrderBinding, type ActualOrderObservation, type ActualOrderState, type Agent, type GuardCursor,
  type Policy, type PreflightRequest, type Verdict } from '@eko/shared';
import { executionPolicyHash, PRESETS, type Deps } from '@eko/policy';
import { UniswapV3Adapter, type ChainClients } from '../../src/exec/chain.js';
import { v3TradeBackend, type V3TradeAcquisition } from '../../src/exec/trade-backend.js';
import { v3ReconciliationBackend, type PostFillEvidence, type TradeReceipt, type ActualFill } from '../../src/exec/trade-reconcile.js';
import { ERC20_ABI, FACTORY_ABI, POOL_ABI, QUOTER_V2_ABI, ROUTER_ABI, indexedV3Pools, type IndexedV3Pool, type V3TradeSources } from '../../src/exec/v3-routes.js';
import type { RetainedTrade, TradeBackend } from '../../src/exec/trades.js';
import { assessment, coverage, factor } from '../../../../packages/shared/test/fixtures/contracts/guard-v2.js';
import { verdict as legacyVerdict } from '../../../../packages/policy/test/fixtures.js';

/** Optional diagnostics: set FORK_DEBUG_LOG to a file path to record quote, capture and probe timings. */
export function forkLog(...parts: unknown[]) {
  const file = process.env.FORK_DEBUG_LOG;
  if (file) appendFileSync(file, `${new Date().toISOString()} ${parts.map(p => typeof p === 'string' ? p : JSON.stringify(p, (_k, v) => typeof v === 'bigint' ? v.toString() : v)).join(' ')}\n`);
}

const registry = loadRegistry();
const lower = (a: string) => a.toLowerCase() as Address;
export const WETH = lower(registry.requireAddress('tokens.WETH'));
export const USDG = lower(registry.requireAddress('tokens.USDG'));
export const ROUTER = lower(registry.requireAddress('uniswapV3.swapRouter02'));
export const FACTORY = lower(registry.requireAddress('uniswapV3.factory'));
export const QUOTER = lower(registry.requireAddress('uniswapV3.quoterV2'));
const ADDRESS_THIS = padHex('0x02', { size: 20 });
const same = (a: string | null | undefined, b: string | null | undefined) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
/** keccak of the JCS form; bigints become decimal strings and undefined fields are dropped first. */
export const digest = (value: unknown): Hex => keccak256(stringToHex(canonicalize(JSON.parse(JSON.stringify(value, (_k, v) => typeof v === 'bigint' ? v.toString() : v)))));

/** Minimal loopback JSON-RPC client that keeps provider error text (the chain package's client drops it). */
export function jsonRpc(url: string): AnvilRpc {
  let id = 0;
  return { request: async ({ method, params }) => {
    const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }), signal: AbortSignal.timeout(60_000) });
    const body = await response.json() as { result?: unknown; error?: { message?: string } };
    if (body.error) throw new Error(`${method}: ${body.error.message ?? 'RPC error'}`);
    return body.result;
  } };
}

/** The simulation host lease: every exclusive use starts from a fork of the trading chain at the requested block. */
export function simulationLease(sim: AnvilRpc, chainUrl: string): MeteredForkLease {
  return new SerializedMeteredForkLease(sim, async cursor => {
    await sim.request({ method: 'anvil_reset', params: [{ forking: { jsonRpcUrl: chainUrl, blockNumber: Number(cursor.blockNumber) } }] });
  });
}

export const cursorOf = (block: { number: bigint | null; hash: Hex | null; timestamp: bigint }): GuardCursor => ({
  chainId: 4663, blockNumber: block.number!.toString(), blockHash: block.hash!.toLowerCase() as Hex,
  transactionIndex: null, executionOrdinal: null, timestampSec: block.timestamp.toString(), boundary: 'block_end',
});

export interface RouteTerms { tokenIn: Address; tokenOut: Address; fee: number; recipient: Address; amountIn: bigint; minOut: bigint; unwrapTo: Address | null }
/** Decode the adapter's SwapRouter02 multicall: one exactInputSingle, optionally followed by unwrapWETH9. */
export function routeTerms(data: Hex): RouteTerms | null {
  try {
    const call = decodeFunctionData({ abi: ROUTER_ABI, data });
    if (call.functionName !== 'multicall') return null;
    let swap: RouteTerms | null = null, unwrapTo: Address | null = null;
    for (const inner of call.args[1]) {
      const c = decodeFunctionData({ abi: ROUTER_ABI, data: inner });
      if (c.functionName === 'exactInputSingle') {
        if (swap) return null;
        const p = c.args[0];
        swap = { tokenIn: lower(p.tokenIn), tokenOut: lower(p.tokenOut), fee: p.fee, recipient: lower(p.recipient), amountIn: p.amountIn, minOut: p.amountOutMinimum, unwrapTo: null };
      } else if (c.functionName === 'unwrapWETH9') unwrapTo = lower(c.args[1]);
      else return null;
    }
    return swap ? { ...swap, unwrapTo } : null;
  } catch { return null; }
}

/** Indexer-shaped rows: the tokens, v3 pools and one ETH-priced swap that the indexer would have written. */
export async function seedIndexedState(sql: SqlClient, client: PublicClient, block: bigint, extra: { pons?: { coin: Address; curve: Address; launchBlock: bigint } } = {}) {
  const pools: IndexedV3Pool[] = [];
  for (const fee of [100, 500, 3000, 10000]) {
    const pool = await client.readContract({ address: FACTORY, abi: FACTORY_ABI, functionName: 'getPool', args: [WETH, USDG, fee], blockNumber: block });
    if (/^0x0{40}$/i.test(pool)) continue;
    const [c0, c1] = WETH < USDG ? [WETH, USDG] : [USDG, WETH];
    pools.push({ address: lower(pool), currency0: c0, currency1: c1, fee });
  }
  if (!pools.length) throw new Error('No WETH/USDG v3 pool at the fork block');
  for (const p of pools) {
    await sql.query(`INSERT INTO pools(id,venue,currency0,currency1,fee,tick_spacing,created_block,block,creation_verified)
      VALUES($1,'uniswap_v3',$2,$3,$4,$5,$6,$6,true) ON CONFLICT(id) DO NOTHING`,
    [binary(p.address), binary(p.currency0), binary(p.currency1), p.fee, ({ 100: 1, 500: 10, 3000: 60, 10000: 200 } as Record<number, number>)[p.fee], block.toString()]);
  }
  const tokens: [Address, string, number, string | null, Address | null, bigint][] = [[WETH, 'WETH', 18, null, null, block], [USDG, 'USDG', 6, null, null, block]];
  if (extra.pons) tokens.push([extra.pons.coin, 'PONS-SAMPLE', 18, 'pons', extra.pons.curve, extra.pons.launchBlock]);
  for (const [address, symbol, decimals, launchpad, curve, first] of tokens) {
    await sql.query(`INSERT INTO tokens(address,symbol,name,decimals,launchpad,curve,first_block,block) VALUES($1,$2,$2,$3,$4,$5,$6,$7) ON CONFLICT(address) DO NOTHING`,
      [binary(address), symbol, decimals, launchpad, curve ? binary(curve) : null, first.toString(), block.toString()]);
  }
  const ethUsd = await ethUsdAt(client, sql, block);
  if (!ethUsd) throw new Error('ETH-USD unavailable at the fork block');
  // The sell check prices its probe size with indexedEthUsd: recent ETH-quoted swaps with their USD value.
  await sql.query(`INSERT INTO swaps(ts,block,tx_hash,log_index,venue,pool_id,coin,quote_asset,side,amount_coin,amount_quote,price_quote,usd,priced_block)
    VALUES($1,$2,$3,0,'uniswap_v3',$4,$5,$6,1,$7,$8,$9,$10,$2)`,
  [new Date(), block.toString(), binary(digest({ seed: 'eth-usd', block })), binary(pools[0]!.address), binary(USDG), binary(WETH),
    BigInt(Math.round(ethUsd * 1e6)).toString(), (10n ** 18n).toString(), ethUsd, ethUsd]);
  return { pools, ethUsd };
}

/** USDG per WETH from the deepest indexed WETH/USDG pool's spot price at the block. */
export async function ethUsdAt(client: PublicClient, sql: SqlClient, block: bigint): Promise<number | null> {
  const pools = (await indexedV3Pools(sql)(WETH, block)).filter(p => [p.currency0, p.currency1].some(c => same(c, USDG)));
  let best: { liquidity: bigint; sqrt: bigint; token0: Address } | null = null;
  for (const p of pools) {
    const [liquidity, slot] = await Promise.all([
      client.readContract({ address: p.address, abi: [{ type: 'function', name: 'liquidity', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint128' }] }] as const, functionName: 'liquidity', blockNumber: block }),
      client.readContract({ address: p.address, abi: POOL_ABI, functionName: 'slot0', blockNumber: block }),
    ]);
    if (!best || liquidity > best.liquidity) best = { liquidity, sqrt: slot[0], token0: lower(p.currency0) };
  }
  if (!best || best.sqrt === 0n) return null;
  const q = Number(best.sqrt) / 2 ** 96, raw = q * q; // token1 raw per token0 raw
  return same(best.token0, WETH) ? raw * 1e12 : 1 / (raw * 1e-12);
}

/** Block-bound sources for the real adapter: indexed pools, pool-derived prices and execution gas at base fee. */
export function forkSources(chain: () => PublicClient, sql: () => SqlClient): V3TradeSources {
  return {
    pools: (coin, block) => indexedV3Pools(sql())(coin, block),
    priceUsd: async (token, block) => same(token, USDG) ? 1 : same(token, WETH) ? ethUsdAt(chain(), sql(), block) : null,
    // TODO(spec) for production: Robinhood Chain charges L1 data on top; Anvil exposes execution gas only.
    networkFeeWei: async (_tx, gas, block) => {
      const b = await chain().getBlock({ blockNumber: block });
      return b.baseFeePerGas == null ? null : gas * b.baseFeePerGas;
    },
  };
}

type GuardSetting = { level: 'lower' | 'high'; honeypot?: boolean } | 'unavailable';
/** Stand-in for the Guard read service: an active assessment per coin with a stable receipt id. */
export class ForkGuard {
  private readonly coins = new Map<string, GuardSetting>();
  set(coin: Address, setting: GuardSetting | null) { if (setting) this.coins.set(coin.toLowerCase(), setting); else this.coins.delete(coin.toLowerCase()); }
  receiptId(coin: string) { return `fork-guard-${coin.toLowerCase()}`; }
  verdict(coin: string): Verdict | 'unavailable' | undefined {
    const setting = this.coins.get(coin.toLowerCase());
    if (!setting || setting === 'unavailable') return setting;
    // One second behind the wall clock: a snapshot newer than the request clock is refused as stale.
    const cursor = { ...assessment.cursor, timestampSec: String(Math.floor(Date.now() / 1000) - 1) };
    const score = setting.level === 'high' ? 60 : 0;
    const guardV2 = GuardAssessmentV2Schema.parse({ ...assessment, cursor, availabilityCut: { ...assessment.availabilityCut, cursor }, coin,
      mode: 'active', observedLevel: setting.level, level: setting.level, levelFloorReason: null,
      completeness: { buyCriticalComplete: true, lowerTierComplete: true, missing: [] },
      checks: GUARD_CHECK_IDS.map(id => ({ id, tier: GUARD_CHECK_TIERS[id], status: 'complete', coverage, evidenceIds: [], failureCode: null })),
      factors: score ? [{ ...factor, eligiblePoints: score, assignedPoints: score, calibration: 'released' }] : [],
      baseScore: score, score, historyPoints: 0, familyPoints: { E: score, O: 0, Ff: 0, C: 0, I: 0 }, decisiveIds: [], reasons: [],
      scoreIsLowerBound: false, receipt: { ...assessment.receipt, id: this.receiptId(coin) } });
    return { ...legacyVerdict, coin: lower(coin), level: setting.honeypot ? 'danger' : 'clear',
      playbooks: setting.honeypot ? [{ id: 'honeypot', level: 'danger', confidence: 1, evidence: [] }] : [], guardV2 };
  }
}

export const policyFor = (mode: Policy['mode']): Policy => ({ mode, blockPlaybookLevel: PRESETS[mode].blockPlaybookLevel, killed: false, version: 1 });
/** A wallet trade has no harness agent; the signed-in wallet is the agent the policy evaluates. */
export const walletAgentId = (accountId: string) => `wallet-${accountId}`;
const walletAgent = (accountId: string, wallet: string): Agent => ({ id: walletAgentId(accountId), name: 'Wallet', kind: 'onchain', wallet: lower(wallet), status: 'active', uncheckedOrders24h: 0 });

async function fingerprints(client: PublicClient, coin: Address, pool: Address, terms: RouteTerms, block: bigint) {
  const [coinCode, poolCode] = await Promise.all([client.getCode({ address: coin, blockNumber: block }), client.getCode({ address: pool, blockNumber: block })]);
  return {
    routeFingerprint: digest({ venue: 'uniswap_v3', pool, router: ROUTER, tokenIn: terms.tokenIn, tokenOut: terms.tokenOut, fee: terms.fee }),
    profileHash: digest({ coinCode: keccak256(coinCode ?? '0x'), poolCode: keccak256(poolCode ?? '0x') }),
    stateFingerprint: digest({ coin, pool, factory: FACTORY, accountClass: 'eoa' }),
  };
}

const erc20 = {
  balanceOf: (token: Address, who: Address) => encodeFunctionData({ abi: ERC20_ABI, functionName: 'balanceOf', args: [who] }),
  allowance: (token: Address, who: Address, spender: Address) => encodeFunctionData({ abi: ERC20_ABI, functionName: 'allowance', args: [who, spender] }),
  approve: (spender: Address, amount: bigint) => encodeFunctionData({ abi: ERC20_ABI, functionName: 'approve', args: [spender, amount] }),
};
const decimalsOf = (token: Address) => same(token, USDG) ? 6 : 18;

/** Exact-account execution on the simulation host. No balance, code or storage overrides; impersonation only. */
class SimAccount {
  readonly receipts: Hex[] = [];
  constructor(private readonly rpc: AnvilRpc, readonly address: Address) {}
  private async call(to: Address, data: Hex) { return await this.rpc.request({ method: 'eth_call', params: [{ from: this.address, to, data }, 'latest'] }) as Hex; }
  async token(token: Address) { return BigInt(await this.call(token, erc20.balanceOf(token, this.address))); }
  async allowance(token: Address, spender: Address) { return BigInt(await this.call(token, erc20.allowance(token, this.address, spender))); }
  async native() { return BigInt(await this.rpc.request({ method: 'eth_getBalance', params: [this.address, 'latest'] }) as Hex); }
  async code() { return await this.rpc.request({ method: 'eth_getCode', params: [this.address, 'latest'] }) as Hex; }
  async send(to: Address, data: Hex, value: bigint) {
    const hash = await this.rpc.request({ method: 'eth_sendTransaction', params: [{ from: this.address, to, data, value: toHex(value), gas: toHex(3_000_000n) }] }) as Hex;
    // Mine explicitly: a forked Anvil's automine can seal more than a second later, which the 5-second window cannot absorb.
    await this.rpc.request({ method: 'evm_mine', params: [] });
    type SimReceipt = { status: Hex; gasUsed: Hex; effectiveGasPrice: Hex };
    const read = async () => await this.rpc.request({ method: 'eth_getTransactionReceipt', params: [hash] }) as SimReceipt | null;
    let receipt = await read();
    for (let tries = 0; !receipt && tries < 200; tries++) { await new Promise(resolve => setTimeout(resolve, 10)); receipt = await read(); }
    if (!receipt) throw new Error('Simulation receipt unavailable');
    this.receipts.push(hash);
    return { ok: BigInt(receipt.status) === 1n, network: BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice) };
  }
  /** Sell `amount` of `coin` for `quote` on the route's pool; WETH proceeds are unwrapped to native ETH. */
  async sellBack(coin: Address, quote: Address, fee: number, amount: bigint) {
    const nativeOut = same(quote, WETH);
    const calls: Hex[] = [encodeFunctionData({ abi: ROUTER_ABI, functionName: 'exactInputSingle', args: [{ tokenIn: coin, tokenOut: quote, fee,
      recipient: nativeOut ? ADDRESS_THIS : this.address, amountIn: amount, amountOutMinimum: 0n, sqrtPriceLimitX96: 0n }] })];
    if (nativeOut) calls.push(encodeFunctionData({ abi: ROUTER_ABI, functionName: 'unwrapWETH9', args: [0n, this.address] }));
    const before = nativeOut ? await this.native() : await this.token(quote);
    const sold = await this.send(ROUTER, encodeFunctionData({ abi: ROUTER_ABI, functionName: 'multicall', args: [BigInt(Math.floor(Date.now() / 1000) + 3600), calls] }), 0n);
    const returned = nativeOut ? await this.native() - before + sold.network : await this.token(quote) - before;
    return { ...sold, returned };
  }
}

async function withAccount<T>(lease: MeteredForkLease, cursor: GuardCursor, account: Address, work: (sim: SimAccount, rpc: AnvilRpc) => Promise<T>): Promise<T> {
  return lease.withExclusive(async (rpc, reset) => {
    await reset(cursor);
    await rpc.request({ method: 'evm_setAutomine', params: [false] });
    const header = await rpc.request({ method: 'eth_getBlockByNumber', params: [toHex(BigInt(cursor.blockNumber)), false] }) as { hash?: string } | null;
    if (!same(header?.hash, cursor.blockHash)) throw new Error('Simulation pin mismatch');
    await rpc.request({ method: 'anvil_impersonateAccount', params: [account] });
    try { return await work(new SimAccount(rpc, account), rpc); }
    finally { await rpc.request({ method: 'anvil_stopImpersonatingAccount', params: [account] }); }
  });
}

/**
 * Largest USD size of a short ladder (up to the strictest preset's $50k minimum) whose buy moves the pool price by at
 * most 2%: a measured lower bound at the quote block. Measured once per route at quote time, like the Guard's cached
 * depth reading, so the per-order probe stays inside its 5-second refresh window.
 */
async function depthUsdLower(client: PublicClient, pool: Address, terms: RouteTerms, priceIn: number, block: bigint): Promise<number> {
  const slot = await client.readContract({ address: pool, abi: POOL_ABI, functionName: 'slot0', blockNumber: block });
  for (const usd of [50_000, 10_000, 2_000]) {
    const amountIn = BigInt(Math.floor(usd / priceIn * 10 ** decimalsOf(terms.tokenIn)));
    try {
      const { result } = await client.simulateContract({ address: QUOTER, abi: QUOTER_V2_ABI, functionName: 'quoteExactInputSingle',
        args: [{ tokenIn: terms.tokenIn, tokenOut: terms.tokenOut, amountIn, fee: terms.fee, sqrtPriceLimitX96: 0n }], blockNumber: block });
      if (Math.abs((Number(result[1]) / Number(slot[0])) ** 2 - 1) <= 0.02) return usd;
    } catch { /* this size cannot fill; try a smaller one */ }
  }
  return 0;
}

interface ProbeRoute { pool: Address; depthUsdLower: number | null }
/** ActualOrderProbe for indexed single-hop v3 routes (the v3 counterpart of the chain package's PonsActualOrderProbe). */
export class ForkV3Probe {
  constructor(private readonly lease: MeteredForkLease, private readonly sources: V3TradeSources, private readonly route: (b: ActualOrderBinding) => ProbeRoute | undefined) {}
  async observe(binding: ActualOrderBinding, state: ActualOrderState, requestClockMs: number): Promise<ActualOrderObservation> {
    const started = Date.now(), result = await this.measure(binding, state, requestClockMs);
    forkLog('probe', binding.side, result.status, 'ms', Date.now() - started, 'depth', result.depthUsdLower, 'tokens', result.tokens, 'returned', result.returned);
    return result;
  }
  private async measure(binding: ActualOrderBinding, state: ActualOrderState, requestClockMs: number): Promise<ActualOrderObservation> {
    const b = ActualOrderBindingSchema.parse(binding), terms = routeTerms(b.tx.data), route = this.route(b), pool = route?.pool;
    const result: ActualOrderObservation = { binding: b, state, quotedAtMs: requestClockMs, refreshedAtMs: requestClockMs,
      expiresAtMs: requestClockMs + 15_000, origin: 'measured', mode: b.side === 'buy' ? 'round_trip' : 'sell_only', accountClass: 'eoa',
      status: 'unsupported', spent: '0', returned: '0', tokens: '0', heldBefore: '0', allowanceBefore: '0', notionalUsd: 0,
      entryNetworkFee: '0', exitNetworkFee: '0', depthUsdLower: null, evidenceIds: [] };
    if (!terms || !pool || !same(b.tx.to, ROUTER) || !same(b.side === 'buy' ? terms.tokenOut : terms.tokenIn, b.coin) ||
      terms.amountIn !== BigInt(b.amountIn) || terms.minOut !== BigInt(b.minOut)) return result;
    const quote = b.side === 'buy' ? terms.tokenIn : terms.tokenOut;
    const price = await this.sources.priceUsd(quote, BigInt(state.cursor.blockNumber));
    if (!price) return result;
    try {
      await withAccount(this.lease, state.cursor, b.account, async sim => {
        if (await sim.code() !== '0x') { result.accountClass = 'smart_account'; return; }
        const original = await sim.token(b.coin);
        result.heldBefore = original.toString();
        result.allowanceBefore = (await sim.allowance(b.coin, ROUTER)).toString();
        if (b.side === 'buy') {
          result.depthUsdLower = route!.depthUsdLower;
          const nativeIn = same(quote, WETH) && BigInt(b.tx.value) > 0n;
          const before = nativeIn ? await sim.native() : await sim.token(quote);
          const bought = await sim.send(b.tx.to, b.tx.data, BigInt(b.tx.value));
          result.entryNetworkFee = bought.network.toString();
          if (!bought.ok) { result.status = 'entry_limited'; return; }
          const spent = nativeIn ? before - await sim.native() - bought.network : before - await sim.token(quote);
          const tokens = await sim.token(b.coin) - original;
          if (spent <= 0n || tokens <= 0n) throw new Error('Invalid simulated debit');
          const approved = await sim.send(b.coin, erc20.approve(ROUTER, tokens), 0n);
          if (!approved.ok) { result.status = 'exit_restricted'; return; }
          const sold = await sim.sellBack(b.coin, quote, terms.fee, tokens);
          result.exitNetworkFee = (approved.network + sold.network).toString();
          if (!sold.ok || sold.returned <= 0n) { result.status = 'exit_restricted'; return; }
          Object.assign(result, { spent: spent.toString(), tokens: tokens.toString(), returned: sold.returned.toString(),
            notionalUsd: Number(spent) / 10 ** decimalsOf(quote) * price });
        } else {
          if (original < BigInt(b.amountIn)) { result.status = 'entry_limited'; return; }
          // Approve exactly the sold amount inside the simulation; the real allowance is reported separately.
          const approved = await sim.send(b.coin, erc20.approve(ROUTER, BigInt(b.amountIn)), 0n);
          if (!approved.ok) { result.status = 'exit_restricted'; return; }
          const nativeOut = terms.unwrapTo !== null;
          const before = nativeOut ? await sim.native() : await sim.token(quote);
          const sold = await sim.send(b.tx.to, b.tx.data, BigInt(b.tx.value));
          result.exitNetworkFee = (approved.network + sold.network).toString();
          if (!sold.ok) { result.status = 'exit_restricted'; return; }
          const returned = nativeOut ? await sim.native() - before + sold.network : await sim.token(quote) - before;
          if (returned <= 0n || await sim.token(b.coin) !== original - BigInt(b.amountIn)) throw new Error('Invalid simulated credit');
          Object.assign(result, { tokens: b.amountIn, returned: returned.toString(), notionalUsd: Number(returned) / 10 ** decimalsOf(quote) * price });
        }
        result.status = 'ok';
        result.evidenceIds = [digest({ binding: b, state, receipts: sim.receipts, spent: result.spent, returned: result.returned, tokens: result.tokens })];
      });
    } catch (error) {
      forkLog('probe failed', String((error as Error)?.message ?? error));
      return { ...result, status: 'provider_failure', evidenceIds: [] };
    }
    return result;
  }
}

/** Measured post-fill replay: sell the actual bought amount from the account at the fill block. */
async function postFillSell(lease: MeteredForkLease, retained: RetainedTrade, receipt: TradeReceipt, fill: ActualFill): Promise<PostFillEvidence> {
  const b = retained.checked!.order.execution!, terms = routeTerms(b.tx.data)!;
  const cursor: GuardCursor = { chainId: 4663, blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash.toLowerCase() as Hex,
    transactionIndex: null, executionOrdinal: null, timestampSec: '0', boundary: 'block_end' };
  const sold = await withAccount(lease, cursor, b.account, async sim => {
    const approved = await sim.send(b.coin, erc20.approve(ROUTER, BigInt(fill.filledOut)), 0n);
    if (!approved.ok) return { ok: false, receipts: sim.receipts, returned: 0n };
    const out = await sim.sellBack(b.coin, terms.tokenIn, terms.fee, BigInt(fill.filledOut));
    return { ok: out.ok && out.returned > 0n, receipts: sim.receipts, returned: out.returned };
  });
  return { status: sold.ok ? 'passed' : 'failed', origin: 'measured', code: sold.ok ? 'sell_ok' : 'sell_failed', chainId: 4663,
    account: b.account, txHash: receipt.transactionHash.toLowerCase() as Hex, blockHash: receipt.blockHash.toLowerCase() as Hex,
    blockNumber: receipt.blockNumber.toString(), amount: fill.filledOut, checkedAt: new Date().toISOString(),
    evidenceIds: [digest({ replay: sold.receipts, returned: sold.returned, fill })] };
}

export interface ForkHarness { backend: TradeBackend; guard: ForkGuard; sources: V3TradeSources }
/**
 * Assemble the trade backend. `chains`/`sql` are read lazily because `buildApp` creates them after it receives the
 * backend; every chain read goes through the API's own metered mainnet client.
 */
export function forkTradeBackend(o: { chains: () => ChainClients; sql: () => SqlClient; lease: MeteredForkLease }): ForkHarness {
  const chain = () => o.chains().get('robinhood-mainnet');
  let adapter: UniswapV3Adapter | undefined;
  const v3 = () => adapter ??= new UniswapV3Adapter(o.chains(), 'robinhood-mainnet', () => null);
  const sources = forkSources(chain, o.sql), guard = new ForkGuard();
  const routes = new Map<string, ProbeRoute>();
  const probe = new ForkV3Probe(o.lease, sources, b => routes.get(b.routeFingerprint));
  const acquisition: V3TradeAcquisition = {
    async quote(owner, input, route, id) {
      const terms = routeTerms(route.tx.data), pool = route.route.poolId as Address | undefined;
      if (!terms || !pool) throw new Error('Unsupported route shape');
      const block = await chain().getBlock({ blockNumber: BigInt(route.asOfBlock) });
      const policy = policyFor(input.riskMode ?? 'safe'), fp = await fingerprints(chain(), input.coin, lower(pool), terms, block.number!);
      const priceIn = input.side === 'buy' ? await sources.priceUsd(terms.tokenIn, block.number!) : null;
      routes.set(fp.routeFingerprint, { pool: lower(pool), depthUsdLower: priceIn ? await depthUsdLower(chain(), lower(pool), terms, priceIn, block.number!) : null });
      const checked: PreflightRequest | null = input.account ? { agentId: walletAgentId(owner.id), clientOrderRef: id,
        order: { venue: 'rhc', instrument: input.coin, side: input.side, orderType: 'market', notionalUsd: input.amountUsd,
          tx: { to: route.tx.to, data: route.tx.data, value: route.tx.value },
          execution: { chainId: 4663, account: input.account, recipient: input.account, coin: input.coin, side: input.side,
            amountIn: route.amountIn, minOut: route.minOut, slippageBps: input.slippageBps, cursor: cursorOf(block), ...fp,
            policyHash: executionPolicyHash(policy), guardReceiptId: guard.receiptId(input.coin), tx: route.tx,
            approval: input.side === 'sell' ? { token: input.coin, spender: lower(route.tx.to), amount: route.amountIn, kind: 'erc20',
              tx: { chainId: 4663, to: input.coin, data: erc20.approve(route.tx.to, BigInt(route.amountIn)), value: '0' } } : null } },
        context: { reportedAt: new Date().toISOString() } } : null;
      return { checked, accepted: true, guard: { decision: 'allow', checks: [] }, buyTaxPct: 0, sellTaxPct: 0, exitCostPct: 0 };
    },
    async capture(retained) {
      const b = retained.checked!.order.execution!, terms = routeTerms(b.tx.data)!, pool = lower(retained.quote.route.poolId!);
      const head = await chain().getBlock(), at = head.number!;
      const policy = policyFor(retained.input.riskMode!), fp = await fingerprints(chain(), b.coin, pool, terms, at);
      const [native, held, allowance, canonical] = await Promise.all([
        chain().getBalance({ address: b.account, blockNumber: at }),
        chain().readContract({ address: b.coin, abi: ERC20_ABI, functionName: 'balanceOf', args: [b.account], blockNumber: at }),
        chain().readContract({ address: b.coin, abi: ERC20_ABI, functionName: 'allowance', args: [b.account, ROUTER], blockNumber: at }),
        chain().readContract({ address: FACTORY, abi: FACTORY_ABI, functionName: 'getPool', args: [terms.tokenIn, terms.tokenOut, terms.fee], blockNumber: at }),
      ]);
      const now = Date.now();
      forkLog('capture head', head.number, 'age s', now / 1000 - Number(head.timestamp));
      const state: ActualOrderState = { observedAtMs: now, criticalCheckedAtMs: now, cursor: cursorOf(head), ...fp,
        balanceHash: digest({ native, held, allowance }), feeHash: digest({ poolFee: terms.fee, ekoFeeBps: 0 }), controlHash: fp.profileHash,
        sourceRevision: digest('fork-v1-trade-harness-1'), semanticHash: digest({ coin: b.coin, side: b.side }),
        policyHash: executionPolicyHash(policy), guardReceiptId: guard.receiptId(b.coin), routeAvailable: same(canonical, pool) };
      const deps: Deps = { now: Date.now, verdictFor: coin => guard.verdict(coin), cardFor: () => undefined, priceFor: () => undefined,
        approvalFor: () => undefined, approvalsAvailable: false };
      return { request: retained.checked!, policy, agent: walletAgent(retained.accountId, retained.wallet!), deps, state,
        admission: { status: 'allowed' }, quoteClocks: { quotedAtMs: retained.quotedAt.getTime(), expiresAtMs: retained.expiresAt.getTime() } };
    },
    probe,
    reconciliation: v3ReconciliationBackend({ receipt: h => v3().receipt(h), transaction: h => v3().transaction(h) }, sources,
      (retained, receipt, fill) => postFillSell(o.lease, retained, receipt, fill)),
  };
  return { backend: v3TradeBackend({ quoteTrade: (input, s) => v3().quoteTrade(input, s) }, sources, acquisition), guard, sources };
}

/**
 * Load the route and sell-check state into the trading fork through a patient client. A cold slot is a rate-limited
 * public RPC read, and the API's metered client gives up after 10 seconds; once loaded, the fork answers locally.
 */
export async function warmForkState(client: PublicClient, pools: IndexedV3Pool[], ethUsd: number, sellCheck: (coin: Address, usd: number) => Promise<unknown>) {
  const block = await client.getBlockNumber();
  for (const p of pools) {
    await client.readContract({ address: FACTORY, abi: FACTORY_ABI, functionName: 'getPool', args: [WETH, USDG, p.fee], blockNumber: block });
    await client.readContract({ address: p.address, abi: POOL_ABI, functionName: 'slot0', blockNumber: block });
    for (const usd of [5, 20, 2_000, 10_000, 50_000]) for (const [tokenIn, tokenOut, units] of [[WETH, USDG, usd / ethUsd * 1e18], [USDG, WETH, usd * 1e6]] as const) {
      await client.simulateContract({ address: QUOTER, abi: QUOTER_V2_ABI, functionName: 'quoteExactInputSingle',
        args: [{ tokenIn, tokenOut, amountIn: BigInt(Math.floor(units)), fee: p.fee, sqrtPriceLimitX96: 0n }], blockNumber: block }).catch(() => undefined);
    }
  }
  for (const usd of [5, 10, 20, 300]) await sellCheck(USDG, usd);
}

/** Find a native-ETH Pons launch that is at least `minAgeBlocks` old at `block` (TokenLaunched on the Pons factory). */
export async function findPonsLaunch(client: PublicClient, block: bigint, minAgeBlocks = 30_000n, span = 40_000n) {
  const factory = registry.requireAddress('pons.factory');
  const logs = await client.getLogs({ address: factory, fromBlock: block - minAgeBlocks - span, toBlock: block - minAgeBlocks,
    event: { type: 'event', name: 'TokenLaunched', inputs: [{ type: 'address', name: 'token', indexed: true }, { type: 'address', name: 'curve', indexed: true },
      { type: 'address', name: 'deployer', indexed: true }, { type: 'address', name: 'pairToken' }, { type: 'uint256', name: 'launchConfigId' }, { type: 'uint256', name: 'graduationThreshold' }] } });
  const launch = logs.reverse().find(l => /^0x0{40}$/i.test(l.args.pairToken ?? ''));
  return launch ? { coin: lower(launch.args.token!), curve: lower(launch.args.curve!), launchBlock: launch.blockNumber! } : null;
}
