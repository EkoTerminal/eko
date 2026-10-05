/**
 * Test-only inputs for the v1 trade fork suite. The suite runs the production trade backend
 * (`src/exec/live-trade.ts`, installed by `buildApp` from LIVE_TRADING_ENABLED, the RPC URL and ANVIL_FORK_URL);
 * this file supplies only what a fork cannot provide the production way:
 *
 * - indexer-shaped rows (tokens, the WETH/USDG v3 pools, one ETH-priced swap) that the indexer would have written;
 * - `ForkGuard`, a verdict source serving an `active` Guard v2 assessment per coin with a stable receipt id. No
 *   Guard v2 release is active in production, where every buy is refused `guard_incomplete`;
 * - `anvilNetworkFeeWei`: Anvil has no Arbitrum NodeInterface, so the fee is execution gas at base fee (L2 only);
 * - cache warming, discovery of a recent native-ETH Pons launch, and a loopback relay to the public RPC that retries
 *   its transient refusals (Anvil treats them as final).
 */
import { appendFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { keccak256, stringToHex, type Address, type PublicClient } from 'viem';
import { binary, type SqlClient } from '@eko/db';
import { loadRegistry } from '@eko/chain';
import { GUARD_CHECK_IDS, GUARD_CHECK_TIERS, GuardAssessmentV2Schema, type Verdict } from '@eko/shared';
import { liveTradeSources, type VerdictSource } from '../../src/exec/live-trade.js';
import { FACTORY_ABI, POOL_ABI, QUOTER_V2_ABI, type IndexedV3Pool, type V3TradeSources } from '../../src/exec/v3-routes.js';
import { assessment, coverage, factor } from '../../../../packages/shared/test/fixtures/contracts/guard-v2.js';
import { verdict as legacyVerdict } from '../../../../packages/policy/test/fixtures.js';

/** Optional diagnostics: set FORK_DEBUG_LOG to a file path to record quote outcomes and warm-up attempts. */
export function forkLog(...parts: unknown[]) {
  const file = process.env.FORK_DEBUG_LOG;
  if (file) appendFileSync(file, `${new Date().toISOString()} ${parts.map(p => typeof p === 'string' ? p : JSON.stringify(p, (_k, v) => typeof v === 'bigint' ? v.toString() : v)).join(' ')}\n`);
}

const registry = loadRegistry();
const lower = (a: string) => a.toLowerCase() as Address;
export const WETH = lower(registry.requireAddress('tokens.WETH'));
export const USDG = lower(registry.requireAddress('tokens.USDG'));
export const ROUTER = lower(registry.requireAddress('uniswapV3.swapRouter02'));
const FACTORY = lower(registry.requireAddress('uniswapV3.factory'));
const QUOTER = lower(registry.requireAddress('uniswapV3.quoterV2'));

/**
 * Loopback relay from the trading fork to the public RPC. Behind its load balancer, some public nodes intermittently
 * answer "historical state … is not available" for blocks others serve, and bursts get HTTP 429; Anvil does not retry
 * either. The relay retries those (bounded, with backoff) and forwards everything else unchanged. Public RPC only.
 */
export async function startPublicRpcRelay(port: number, upstream: string) {
  const transient = (status: number, text: string) => status === 429 || /historical state [0-9a-f]+ is not available|Too Many Requests/i.test(text);
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      const body = Buffer.concat(chunks).toString('utf8');
      let status = 502, text = '{"jsonrpc":"2.0","id":null,"error":{"code":-32603,"message":"relay unavailable"}}';
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          const response = await fetch(upstream, { method: 'POST', headers: { 'content-type': 'application/json' }, body, signal: AbortSignal.timeout(30_000) });
          status = response.status; text = await response.text();
          if (!transient(status, text)) break;
        } catch { /* network error: retry */ }
        await new Promise(resolve => setTimeout(resolve, Math.min(8_000, 500 * 2 ** attempt)));
      }
      res.writeHead(status === 429 ? 503 : status, { 'content-type': 'application/json' }).end(text);
    });
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => resolve()); });
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise<void>(resolve => server.close(() => resolve())) };
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
  // The production price source, read once at the fork block.
  const ethUsd = await liveTradeSources(() => client, () => sql).priceUsd(WETH, block);
  if (!ethUsd) throw new Error('ETH-USD unavailable at the fork block');
  // The sell check prices its probe size with indexedEthUsd: recent ETH-quoted swaps with their USD value.
  await sql.query(`INSERT INTO swaps(ts,block,tx_hash,log_index,venue,pool_id,coin,quote_asset,side,amount_coin,amount_quote,price_quote,usd,priced_block)
    VALUES($1,$2,$3,0,'uniswap_v3',$4,$5,$6,1,$7,$8,$9,$10,$2)`,
  [new Date(), block.toString(), binary(keccak256(stringToHex(`eth-usd:${block}`))), binary(pools[0]!.address), binary(USDG), binary(WETH),
    BigInt(Math.round(ethUsd * 1e6)).toString(), (10n ** 18n).toString(), ethUsd, ethUsd]);
  return { pools, ethUsd };
}

/** Anvil has no Arbitrum NodeInterface (0xc8): execution gas at the block's base fee, L2 only (BACKEND §14 fork note). */
export function anvilNetworkFeeWei(chain: () => PublicClient): V3TradeSources['networkFeeWei'] {
  return async (_tx, gas, block) => {
    const b = await chain().getBlock({ blockNumber: block });
    return b.baseFeePerGas == null ? null : gas * b.baseFeePerGas;
  };
}

type GuardSetting = { level: 'lower' | 'high'; honeypot?: boolean } | 'unavailable';
/** Stand-in for the Guard read service: an active assessment per coin with a stable receipt id. */
export class ForkGuard {
  private readonly coins = new Map<string, GuardSetting>();
  set(coin: Address, setting: GuardSetting | null) { if (setting) this.coins.set(coin.toLowerCase(), setting); else this.coins.delete(coin.toLowerCase()); }
  readonly source: VerdictSource = async coin => this.verdict(coin);
  private verdict(coin: string): Verdict | 'unavailable' | undefined {
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
      scoreIsLowerBound: false, receipt: { ...assessment.receipt, id: `fork-guard-${coin.toLowerCase()}` } });
    return { ...legacyVerdict, coin: lower(coin), level: setting.honeypot ? 'danger' : 'clear',
      playbooks: setting.honeypot ? [{ id: 'honeypot', level: 'danger', confidence: 1, evidence: [] }] : [], guardV2 };
  }
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
    for (const usd of [3, 5, 20, 2_000, 10_000, 50_000]) for (const [tokenIn, tokenOut, units] of [[WETH, USDG, usd / ethUsd * 1e18], [USDG, WETH, usd * 1e6]] as const) {
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
