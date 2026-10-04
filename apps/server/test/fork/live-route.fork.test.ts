import { seedSanctions } from '../sanctions-fixture.js';
import { createMeteredClients } from '@eko/chain';
/**
 * End-to-end LIVE route test against a local fork of Robinhood Chain mainnet (chain 4663).
 *
 * Runs the real server (quotes, order creation, reconciliation) against the real Uniswap v3
 * deployment and liquidity, forked locally by Anvil. The wallet is a key generated at test time
 * and funded with fork-only ETH via anvil_setBalance. No real funds, no real transactions.
 *
 * Requires Anvil (Foundry). Run:  pnpm --filter @eko/server test:fork
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createWalletClient, erc20Abi, parseEther, type Address, type Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createSiweMessage } from 'viem/siwe';
import { robinhood } from 'viem/chains';
import type { FastifyInstance } from 'fastify';
import { NETWORKS, type Order, type Quote } from '@eko/shared';
import { buildApp, type Ctx } from '../../src/app.js';
import { loadConfig } from '../../src/config.js';
import { featureFlags } from '../../src/db/schema.js';

const foundryAnvil = join(homedir(), '.foundry/bin/anvil');
const ANVIL = process.env.ANVIL_BIN ?? (existsSync(foundryAnvil) ? foundryAnvil : 'anvil');
const PORT = 8547;
const RPC = `http://127.0.0.1:${PORT}`;
const FORK_URL = process.env.FORK_URL ?? NETWORKS['robinhood-mainnet'].publicRpcUrl;
const FORK_BLOCK_NUMBER = process.env.FORK_BLOCK_NUMBER ?? '77469811';
if (!/^[1-9][0-9]*$/.test(FORK_BLOCK_NUMBER)) throw new Error('FORK_BLOCK_NUMBER must be a positive block number');

const key = generatePrivateKey();
const wallet = privateKeyToAccount(key);
const chain = { ...robinhood, rpcUrls: { default: { http: [RPC] } } };
const { paid: pub, meter } = createMeteredClients({ ...process.env, RPC_HTTP_URL: RPC, RPC_PUBLIC_HTTP_URL: RPC, RPC_USAGE_DIR: ':memory:' }, { chain, standalone: true });
const wc = createWalletClient({ account: wallet, chain, transport: meter.transport() });
const USDG = NETWORKS['robinhood-mainnet'].tokens.USDG!.address;

let anvil: ChildProcess;
let app: FastifyInstance;
let ctx: Ctx;
let close: () => Promise<void>;
let cookie = '';

async function call<T>(method: string, url: string, body?: unknown) {
  const r = await app.inject({ method: method as 'GET', url, headers: { cookie }, payload: body as object });
  return { status: r.statusCode, body: r.json() as T };
}

async function waitFor<T>(fn: () => Promise<T | null>, ms = 20_000): Promise<T> {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > ms) throw new Error('timed out');
    await new Promise((r) => setTimeout(r, 300));
  }
}

async function orderById(id: string) {
  const r = await call<{ orders: Order[] }>('GET', '/api/orders?mode=live');
  return r.body.orders.find((o) => o.id === id) ?? null;
}

describe('live route on a Robinhood Chain mainnet fork (Uniswap v3)', () => {
  beforeAll(async () => {
    anvil = spawn(ANVIL, ['--host', '127.0.0.1', '--fork-url', FORK_URL, '--fork-block-number', FORK_BLOCK_NUMBER, '--port', String(PORT), '--silent', '--retries', '3', '--fork-retry-backoff', '1000', '--compute-units-per-second', '50'], { stdio: 'ignore' });
    let startupError: Error | undefined;
    anvil.on('error', error => { startupError = error; });
    await waitFor(async () => {
      if (startupError) throw startupError;
      if (anvil.exitCode !== null) throw new Error(`Anvil exited with code ${anvil.exitCode}`);
      try {
        return (await pub.getChainId()) === 4663 ? true : null;
      } catch {
        return null;
      }
    }, 30_000);
    expect(await pub.getBlockNumber({ cacheTime: 0 })).toBe(BigInt(FORK_BLOCK_NUMBER));
    await pub.request({ method: 'anvil_setBalance' as never, params: [wallet.address, `0x${parseEther('5').toString(16)}`] as never });

    const cfg = loadConfig({
      NODE_ENV: 'test',
    LEGACY_SIGNALS: 'true',
      PGLITE_DIR: ':memory:',
      MARKET_DATA_SOURCE: 'demo',
      SESSION_SECRET: 'f'.repeat(40),
      RH_MAINNET_RPC_URL: RPC,
      RH_TESTNET_RPC_URL: 'http://127.0.0.1:9',
      LIVE_TRADING_ENABLED: 'true',
      TRADING_ALLOWLIST_ONLY: 'false',
      TRADE_CAPS_FROM: '2026-01-01T00:00:00Z',
    } as NodeJS.ProcessEnv);
    ({ app, ctx, close } = await buildApp(cfg));
    await seedSanctions(ctx.dbh.chain);
    await ctx.dbh.db.insert(featureFlags).values({ key: 'trading_live', enabled: true });
    // The boot snapshot defaults closed; wait for the specified runtime cache expiry on this fork fixture.
    await new Promise(resolve => setTimeout(resolve, 10_000));
    const s = await app.inject({ method: 'GET', url: '/api/session' });
    cookie = `eko_sid=${s.cookies.find((c) => c.name === 'eko_sid')!.value}`;
    const n = await call<{ nonce: string; domain: string; uri: string }>('GET', '/api/auth/nonce');
    const message = createSiweMessage({ domain: n.body.domain, address: wallet.address, uri: n.body.uri, version: '1', chainId: 4663, nonce: n.body.nonce, issuedAt: new Date() });
    const v = await app.inject({ method: 'POST', url: '/api/auth/verify', headers: { cookie }, payload: { message, signature: await wallet.signMessage({ message }) } });
    expect(v.statusCode).toBe(200);
    cookie = `eko_sid=${v.cookies.find((c) => c.name === 'eko_sid')!.value}`;
  }, 120_000);

  afterAll(async () => {
    await close?.();
    await meter.close();
    anvil?.kill('SIGTERM');
  });

  it('SELL 0.05 ETH → USDG: quote, simulate, sign, submit, reconcile to CONFIRMED with the actual fill', async () => {
    const usdgBefore = await pub.readContract({ address: USDG, abi: erc20Abi, functionName: 'balanceOf', args: [wallet.address] });
    const q = await call<{ quote: Quote }>('POST', '/api/quotes', { market: 'ETH-USD', side: 'sell', mode: 'live', amountIn: '0.05', slippageBps: 50, account: wallet.address });
    expect(q.status).toBe(200);
    const quote = q.body.quote;
    expect(quote.venue).toBe('uniswap-v3');
    expect(quote.tx!.approval).toBeNull();
    expect(quote.warnings.filter((w) => w.startsWith('simulation_failed') || w.startsWith('insufficient'))).toEqual([]);
    expect(quote.expectedOut).toBeGreaterThan(50); // ~0.05 ETH worth of USDG

    const o = await call<{ order: Order; tx: NonNullable<Quote['tx']> }>('POST', '/api/orders', { quoteId: quote.id, idempotencyKey: 'fork-sell-0001' });
    expect(o.status).toBe(201);
    expect(o.body.order.status).toBe('awaiting_signature');
    // A duplicate click returns the same order and does not create a second one.
    const dup = await call<{ order: Order; duplicate: boolean }>('POST', '/api/orders', { quoteId: quote.id, idempotencyKey: 'fork-sell-0001' });
    expect(dup.body.duplicate).toBe(true);
    expect(dup.body.order.id).toBe(o.body.order.id);

    const hash = await wc.sendTransaction({ to: o.body.tx.swap.to as Address, data: o.body.tx.swap.data as Hex, value: BigInt(o.body.tx.swap.value) });
    const sub = await call<{ order: Order }>('POST', `/api/orders/${o.body.order.id}/submitted`, { txHash: hash });
    expect(sub.body.order.status).toBe('submitted'); // never "confirmed" before the receipt

    const done = await waitFor(async () => {
      const x = await orderById(o.body.order.id);
      return x && x.status !== 'submitted' ? x : null;
    });
    expect(done.status).toBe('confirmed');
    expect(done.filledIn).toBeCloseTo(0.05, 9);
    expect(done.filledOut!).toBeGreaterThanOrEqual(quote.minOut - 1e-6);
    expect(done.fillPrice!).toBeGreaterThan(0);
    expect(done.feeAsset).toBe('ETH');
    const usdgAfter = await pub.readContract({ address: USDG, abi: erc20Abi, functionName: 'balanceOf', args: [wallet.address] });
    expect(Number(usdgAfter - usdgBefore) / 1e6).toBeCloseTo(done.filledOut!, 4);
    // Live fills are recorded separately from paper.
    const paper = await call<{ fills: unknown[] }>('GET', '/api/portfolio?mode=paper');
    expect(paper.body.fills).toHaveLength(0);
    const live = await call<{ fills: { txHash: string }[]; positions: { realizedPnl: number }[] }>('GET', '/api/portfolio?mode=live');
    expect(live.body.fills[0]!.txHash).toBe(hash.toLowerCase());
    // ETH sold here was not bought through EKO, so no realized P&L is booked.
    expect(live.body.positions.every((p) => p.realizedPnl === 0)).toBe(true);
  }, 90_000);

  it('BUY with USDG: requires an exact approval first, then confirms', async () => {
    const q1 = await call<{ quote: Quote }>('POST', '/api/quotes', { market: 'ETH-USD', side: 'buy', mode: 'live', amountIn: '40', slippageBps: 50, account: wallet.address });
    expect(q1.status).toBe(200);
    expect(q1.body.quote.tx!.approval).not.toBeNull();
    const refused = await call<{ error: string }>('POST', '/api/orders', { quoteId: q1.body.quote.id, idempotencyKey: 'fork-buy-0000' });
    expect(refused.status).toBe(409);
    expect(refused.body.error).toBe('approval_required');

    const a = q1.body.quote.tx!.approval!;
    expect(BigInt(a.amount)).toBe(40_000_000n); // exact amount, never unlimited
    const ah = await wc.writeContract({ address: a.token as Address, abi: erc20Abi, functionName: 'approve', args: [a.spender as Address, BigInt(a.amount)] });
    expect((await pub.waitForTransactionReceipt({ hash: ah })).status).toBe('success');

    const q2 = await call<{ quote: Quote }>('POST', '/api/quotes', { market: 'ETH-USD', side: 'buy', mode: 'live', amountIn: '40', slippageBps: 50, account: wallet.address });
    expect(q2.body.quote.tx!.approval).toBeNull();
    expect(q2.body.quote.warnings.some((w) => w.startsWith('simulation_failed'))).toBe(false);
    const ethBefore = await pub.getBalance({ address: wallet.address });
    const o = await call<{ order: Order; tx: NonNullable<Quote['tx']> }>('POST', '/api/orders', { quoteId: q2.body.quote.id, idempotencyKey: 'fork-buy-0001' });
    const hash = await wc.sendTransaction({ to: o.body.tx.swap.to as Address, data: o.body.tx.swap.data as Hex, value: 0n });
    await call('POST', `/api/orders/${o.body.order.id}/submitted`, { txHash: hash });
    const done = await waitFor(async () => {
      const x = await orderById(o.body.order.id);
      return x && x.status !== 'submitted' ? x : null;
    });
    expect(done.status).toBe('confirmed');
    expect(done.filledOut!).toBeGreaterThanOrEqual(q2.body.quote.minOut - 1e-9);
    const ethAfter = await pub.getBalance({ address: wallet.address });
    expect(ethAfter).toBeGreaterThan(ethBefore - parseEther('0.001')); // received native ETH (net of gas)
    const live = await call<{ positions: { market: string; quantity: number }[] }>('GET', '/api/portfolio?mode=live');
    expect(live.body.positions.find((p) => p.market === 'ETH-USD')!.quantity).toBeCloseTo(done.filledOut!, 9);
  }, 90_000);

  it('wallet rejection is recorded as REJECTED (nothing submitted)', async () => {
    const q = await call<{ quote: Quote }>('POST', '/api/quotes', { market: 'ETH-USD', side: 'sell', mode: 'live', amountIn: '0.01', slippageBps: 50, account: wallet.address });
    const o = await call<{ order: Order }>('POST', '/api/orders', { quoteId: q.body.quote.id, idempotencyKey: 'fork-rej-0001' });
    const r = await call<{ order: Order }>('POST', `/api/orders/${o.body.order.id}/rejected`, { code: 'user_rejected', message: 'Rejected in wallet' });
    expect(r.body.order.status).toBe('rejected');
  }, 60_000);

  it('a transaction that reverts on-chain is reconciled as FAILED, never as a trade', async () => {
    const q = await call<{ quote: Quote }>('POST', '/api/quotes', { market: 'ETH-USD', side: 'sell', mode: 'live', amountIn: '0.02', slippageBps: 50, account: wallet.address });
    const o = await call<{ order: Order; tx: NonNullable<Quote['tx']> }>('POST', '/api/orders', { quoteId: q.body.quote.id, idempotencyKey: 'fork-fail-0001' });
    // Send the exact order transaction (same calldata and value, so it is not a tx_mismatch) after moving the fork's
    // clock past the router multicall deadline (120 s), with a fixed gas limit so it is mined and reverts.
    // The time warp is undone afterwards (snapshot/revert) so later tests see the original chain clock.
    const snapshot = await pub.request({ method: 'evm_snapshot' as never, params: [] as never });
    try {
      await pub.request({ method: 'evm_increaseTime' as never, params: [600] as never });
      await pub.request({ method: 'evm_mine' as never, params: [] as never });
      const hash = await wc.sendTransaction({ to: o.body.tx.swap.to as Address, data: o.body.tx.swap.data as Hex, value: BigInt(o.body.tx.swap.value), gas: 400_000n });
      await call('POST', `/api/orders/${o.body.order.id}/submitted`, { txHash: hash });
      const done = await waitFor(async () => {
        const x = await orderById(o.body.order.id);
        return x && x.status !== 'submitted' ? x : null;
      });
      expect(done.status).toBe('failed');
      expect(done.errorCode).toBe('reverted');
      expect(done.fillPrice).toBeNull();
    } finally {
      await pub.request({ method: 'evm_revert' as never, params: [snapshot] as never });
    }
  }, 60_000);

  it('a hash from a different sender is not accepted as this order’s fill', async () => {
    const other = privateKeyToAccount(generatePrivateKey());
    await pub.request({ method: 'anvil_setBalance' as never, params: [other.address, `0x${parseEther('1').toString(16)}`] as never });
    const owc = createWalletClient({ account: other, chain, transport: meter.transport() });
    const q = await call<{ quote: Quote }>('POST', '/api/quotes', { market: 'ETH-USD', side: 'sell', mode: 'live', amountIn: '0.01', slippageBps: 50, account: wallet.address });
    const o = await call<{ order: Order }>('POST', '/api/orders', { quoteId: q.body.quote.id, idempotencyKey: 'fork-mismatch-0001' });
    const foreign = await owc.sendTransaction({ to: other.address, value: 1n });
    await call('POST', `/api/orders/${o.body.order.id}/submitted`, { txHash: foreign });
    const done = await waitFor(async () => {
      const x = await orderById(o.body.order.id);
      return x && x.status !== 'submitted' ? x : null;
    });
    expect(done.status).toBe('failed');
    expect(done.errorCode).toBe('tx_mismatch');
    void ctx;
  }, 60_000);
});
