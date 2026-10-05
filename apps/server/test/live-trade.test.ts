import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { encodeFunctionData, padHex, type PublicClient } from 'viem';
import { binary, type SqlClient } from '@eko/db';
import { loadRegistry } from '@eko/chain';
import type { GuardAssessmentV2, Verdict } from '@eko/shared';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { liveTradeBackend, liveTradeSources, readModelVerdicts, routeTerms, V3ActualOrderProbe } from '../src/exec/live-trade.js';
import { ROUTER_ABI } from '../src/exec/v3-routes.js';
import { binding, stateFor } from '../../../packages/policy/test/actual-fixtures.js';
import { verdict as legacyVerdict } from '../../../packages/policy/test/fixtures.js';
import { guardFixture } from '../../../packages/policy/test/guard-fixtures.js';

// Offline: construction and gating only, injected readers, no chain or simulation host.
const registry = loadRegistry();
const WETH = registry.requireAddress('tokens.WETH').toLowerCase() as `0x${string}`;
const USDG = registry.requireAddress('tokens.USDG').toLowerCase() as `0x${string}`;
const ROUTER = registry.requireAddress('uniswapV3.swapRouter02');
const deps = { chains: () => { throw new Error('no chain reads at construction'); }, sql: () => { throw new Error('no SQL at construction'); }, verdict: async () => undefined };
const fetchSpy = vi.spyOn(globalThis, 'fetch');
afterEach(() => fetchSpy.mockClear());

describe('live trade backend wiring (fail-closed)', () => {
  it('installs nothing while LIVE_TRADING_ENABLED is off, whatever else is configured', () => {
    const off = liveTradeBackend({ LIVE_TRADING_ENABLED: false, RPC_HTTP_URL: 'https://rpc.example.invalid', RH_MAINNET_RPC_URL: undefined, ANVIL_FORK_URL: 'http://sim.example.invalid:8545' }, deps);
    expect(off).toEqual({ unavailable: 'Actual-account trade acquisition is unavailable', missing: ['LIVE_TRADING_ENABLED'] });
  });
  it('refuses with a named reason when the pinned-block RPC or the simulation host is missing', () => {
    const bare = liveTradeBackend({ LIVE_TRADING_ENABLED: true, RPC_HTTP_URL: undefined, RH_MAINNET_RPC_URL: undefined, ANVIL_FORK_URL: undefined }, deps);
    expect(bare.backend).toBeUndefined();
    expect(bare.missing).toEqual(['RPC_HTTP_URL', 'ANVIL_FORK_URL']);
    expect(bare.unavailable).toMatch(/not configured/);
    expect(liveTradeBackend({ LIVE_TRADING_ENABLED: true, RPC_HTTP_URL: undefined, RH_MAINNET_RPC_URL: 'https://rpc.example.invalid', ANVIL_FORK_URL: undefined }, deps).missing).toEqual(['ANVIL_FORK_URL']);
  });
  it('builds quote, probe and reconciliation without any request when fully configured', () => {
    const live = liveTradeBackend({ LIVE_TRADING_ENABLED: true, RPC_HTTP_URL: undefined, RH_MAINNET_RPC_URL: 'https://rpc.example.invalid', ANVIL_FORK_URL: 'http://sim.example.invalid:8545' }, deps);
    expect(live.backend).toMatchObject({ quote: expect.any(Function), capture: expect.any(Function), probe: expect.any(V3ActualOrderProbe), reconciliation: { supports: expect.any(Function) } });
    expect(live.missing).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('v1 quote refusals through the real app wiring', () => {
  const origin = 'https://app.eko.example', secret = 'live-trade-fixture-placeholder'.repeat(2);
  let off: Awaited<ReturnType<typeof buildApp>>, unconfigured: Awaited<ReturnType<typeof buildApp>>;
  const base = { NODE_ENV: 'test', PGLITE_DIR: ':memory:', PUBLIC_ORIGIN: origin, SESSION_SECRET: secret, DEMO_SECRET: secret };
  beforeAll(async () => {
    off = await buildApp(loadConfig(base), { startBackground: false });
    unconfigured = await buildApp(loadConfig({ ...base, LIVE_TRADING_ENABLED: 'true' }), { startBackground: false });
  });
  afterAll(async () => { await off.close(); await unconfigured.close(); });
  const quote = async (app: typeof off) => {
    const guest = await app.app.inject('/v1/me');
    const cookie = `eko_sid=${guest.cookies.find(c => c.name === 'eko_sid')!.value}`;
    return app.app.inject({ method: 'POST', url: '/v1/trade/quote', headers: { cookie, origin }, payload: { coin: USDG, side: 'buy', amountUsd: 5, slippageBps: 50 } });
  };
  it('keeps today’s refusal while live trading is off, and names the missing setup when it is on', async () => {
    expect((await quote(off)).json()).toEqual({ error: 'sim_unavailable', message: 'Actual-account trade acquisition is unavailable' });
    const refused = await quote(unconfigured);
    expect(refused.statusCode).toBe(503);
    expect(refused.json()).toMatchObject({ error: 'sim_unavailable', message: expect.stringMatching(/not configured/) });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('live trade sources and probes', () => {
  const pool = padHex('0x51', { size: 20 }), coin = padHex('0x10', { size: 20 }), coinPool = padHex('0x52', { size: 20 });
  const rows: Record<string, { id: string; currency0: string; currency1: string; fee: number }[]> = {
    [WETH]: [{ id: pool, currency0: WETH, currency1: USDG, fee: 500 }],
    [coin]: [{ id: coinPool, currency0: coin, currency1: WETH, fee: 3000 }],
  };
  const sql: SqlClient = { query: async (_q: string, params?: unknown[]) => {
    const key = `0x${Buffer.from(params![0] as Uint8Array).toString('hex')}`;
    return { rows: (rows[key] ?? []).map(r => ({ id: binary(r.id), currency0: binary(r.currency0), currency1: binary(r.currency1), fee: r.fee })) as never[] };
  } };
  // 1 WETH = 2,000 USDG (raw 2e9 per 1e18); 1 coin (18 decimals) = 0.001 WETH.
  const sqrt = (ratio: number) => BigInt(Math.round(Math.sqrt(ratio) * 2 ** 96));
  const client = {
    readContract: vi.fn(async (a: { functionName: string; address: string }) => {
      if (a.functionName === 'decimals') return a.address.toLowerCase() === USDG ? 6 : 18;
      if (a.functionName === 'liquidity') return 10n ** 18n;
      if (a.functionName === 'slot0') return [a.address === pool ? sqrt(2e9 / 1e18) : sqrt(1e-3), 0, 0, 0, 0, 0, true];
      throw new Error(`unexpected ${a.functionName}`);
    }),
    getBlock: vi.fn(async () => ({ baseFeePerGas: 10n })),
    simulateContract: vi.fn(async () => ({ result: [7n, 10n, 0n] })),
  } as unknown as PublicClient;
  const sources = liveTradeSources(() => client, () => sql);

  it('prices USDG at $1, WETH from the deepest WETH/USDG pool and coins through their pool at one block', async () => {
    expect(await sources.priceUsd(USDG, 5n)).toBe(1);
    expect(await sources.priceUsd(WETH, 5n)).toBeCloseTo(2000, 6);
    expect(await sources.priceUsd(coin, 5n)).toBeCloseTo(2, 6);
    expect(await sources.priceUsd(padHex('0x99', { size: 20 }), 5n)).toBeNull();
  });
  it('adds the NodeInterface L1 gas to execution gas at the block base fee, and refuses when it is unavailable', async () => {
    const tx = { chainId: 4663 as const, to: ROUTER, data: '0xabcd' as const, value: '0' };
    expect(await sources.networkFeeWei(tx, 100n, 5n)).toBe(1070n);
    vi.mocked(client.simulateContract).mockRejectedValueOnce(new Error('no NodeInterface'));
    expect(await sources.networkFeeWei(tx, 100n, 5n)).toBeNull();
  });
  it('decodes only the adapter’s single exactInputSingle multicall, with an optional unwrap', () => {
    const swap = encodeFunctionData({ abi: ROUTER_ABI, functionName: 'exactInputSingle', args: [{ tokenIn: coin, tokenOut: WETH, fee: 3000,
      recipient: padHex('0x02', { size: 20 }), amountIn: 5n, amountOutMinimum: 4n, sqrtPriceLimitX96: 0n }] });
    const unwrap = encodeFunctionData({ abi: ROUTER_ABI, functionName: 'unwrapWETH9', args: [4n, coin] });
    expect(routeTerms(encodeFunctionData({ abi: ROUTER_ABI, functionName: 'multicall', args: [1n, [swap, unwrap]] })))
      .toMatchObject({ tokenIn: coin, tokenOut: WETH, fee: 3000, amountIn: 5n, minOut: 4n, unwrapTo: coin });
    expect(routeTerms(encodeFunctionData({ abi: ROUTER_ABI, functionName: 'multicall', args: [1n, [swap, swap]] }))).toBeNull();
    expect(routeTerms('0xdeadbeef')).toBeNull();
  });
  it('reports an unsupported binding without touching the simulation host', async () => {
    const lease = { withExclusive: vi.fn() };
    const probe = new V3ActualOrderProbe(lease, sources, () => client);
    const b = binding();
    expect(await probe.observe(b, stateFor(b), 1)).toMatchObject({ status: 'unsupported', origin: 'measured', evidenceIds: [] });
    expect(lease.withExclusive).not.toHaveBeenCalled();
  });
  it('composes the legacy verdict with the stored Guard assessment; read failures are unavailable', async () => {
    const assessment = guardFixture() as GuardAssessmentV2;
    const reads = (legacy: Verdict | null, v2: GuardAssessmentV2 | null) => ({ store: { verdict: async () => legacy }, guard: { verdict: async () => v2 } });
    expect(await readModelVerdicts(reads(legacyVerdict, assessment))(coin)).toMatchObject({ ...legacyVerdict, guardV2: assessment });
    expect(await readModelVerdicts(reads(null, null))(coin)).toBeUndefined();
    expect(await readModelVerdicts(reads(null, assessment))(coin)).toMatchObject({ level: 'pending', playbooks: [], guardV2: assessment });
    expect(await readModelVerdicts({ store: { verdict: async () => { throw new Error('db'); } }, guard: { verdict: async () => null } })(coin)).toBe('unavailable');
  });
});
