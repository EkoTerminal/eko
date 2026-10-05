/**
 * End-to-end v1 trade API (`/v1/trade/*`) against a local fork of Robinhood Chain mainnet (chain 4663).
 *
 * The real server (`buildApp`, fresh in-memory database) quotes through the real Uniswap v3 adapter, admits through
 * the real access, sanctions, sell-check and policy code, returns unsigned bytes, and its reconcile worker confirms
 * fills from receipts. A key generated at test time signs; it is funded with fork-only ETH by `anvil_setBalance`.
 * No real funds, wallets or keys, and no paid RPC: Anvil forks the public RPC only.
 *
 * Production passes no trade acquisition backend to `buildApp`, so this suite installs the fork harness in
 * `v1-trade-harness.ts`; read its header for what it stands in for and which inputs are synthetic.
 *
 * Two Anvil processes on fixed ports: the trading chain (8547, forked from the public RPC, one block per second like
 * a live chain) and the simulation host (8548, re-forked from the trading chain for every measured probe). The public
 * RPC keeps only about 6,000 blocks (~12 minutes) of state, so the fork pins a block just behind the current head
 * unless FORK_BLOCK_NUMBER names one that is still inside that window. Both processes are killed in afterAll, on
 * process exit and by a 14-minute watchdog.
 *
 * Requires Anvil (Foundry). Run:  pnpm --filter @eko/server test:fork
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createConnection } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createPublicClient, createWalletClient, erc20Abi, http, parseEther, type Address, type Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { createSiweMessage } from 'viem/siwe';
import { robinhood } from 'viem/chains';
import { NETWORKS, SIWE_STATEMENT, SiweNonceSchema, TradeOrderSchema, TradeQuoteSchema, UnsignedTxSchema,
  type TradeOrder, type TradeQuote, type UnsignedTx } from '@eko/shared';
import { buildApp } from '../../src/app.js';
import { loadConfig } from '../../src/config.js';
import { tradeOrders } from '../../src/db/schema.js';
import { seedSanctions } from '../sanctions-fixture.js';
import { SellGuard } from '../../src/exec/sell-guard.js';
import { findPonsLaunch, forkLog, forkTradeBackend, jsonRpc, ROUTER, seedIndexedState, simulationLease, USDG, warmForkState, WETH, type ForkHarness } from './v1-trade-harness.js';

const ANVIL = process.env.ANVIL_BIN ?? 'anvil';
const CHAIN_PORT = 8547, SIM_PORT = 8548;
const CHAIN_RPC = `http://127.0.0.1:${CHAIN_PORT}`, SIM_RPC = `http://127.0.0.1:${SIM_PORT}`;
const PUBLIC_RPC = NETWORKS['robinhood-mainnet'].publicRpcUrl;
const RUN_LIMIT_MS = 14 * 60_000;
const ORIGIN = 'https://app.eko.example';
const SECRET = 'fork-v1-trade-placeholder'.repeat(2);

const chain = { ...robinhood, rpcUrls: { default: { http: [CHAIN_RPC] } } };
// First reads of an untouched slot wait on the rate-limited public RPC, so the test's own clients allow a minute.
const transport = () => http(CHAIN_RPC, { retryCount: 0, timeout: 60_000 });
const rpc = createPublicClient({ chain, transport: transport() });
const trader = privateKeyToAccount(generatePrivateKey());
const other = privateKeyToAccount(generatePrivateKey());
const admin = privateKeyToAccount(generatePrivateKey());
const traderWallet = createWalletClient({ account: trader, chain, transport: transport() });
const otherWallet = createWalletClient({ account: other, chain, transport: transport() });

const children: ChildProcess[] = [];
const killAnvils = () => { for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); };
process.once('exit', killAnvils);
const watchdog = setTimeout(() => { killAnvils(); console.error('v1 trade fork run exceeded its time limit'); process.exit(1); }, RUN_LIMIT_MS);
watchdog.unref();

let built: Awaited<ReturnType<typeof buildApp>>;
let harness: ForkHarness;
let forkBlock: bigint;
let cookie = '';
let pons: Awaited<ReturnType<typeof findPonsLaunch>>;

const portFree = (port: number) => new Promise<boolean>(resolve => {
  const socket = createConnection({ host: '127.0.0.1', port });
  socket.once('connect', () => { socket.destroy(); resolve(false); });
  socket.once('error', () => resolve(true));
});
async function startAnvil(port: number, args: string[], expectedBlock?: bigint) {
  // Never attach to a process this run did not start.
  if (!await portFree(port)) throw new Error(`Port ${port} is already in use; stop the other Anvil first`);
  const child = spawn(ANVIL, ['--host', '127.0.0.1', '--port', String(port), '--silent', '--no-storage-caching', ...args], { stdio: 'ignore' });
  children.push(child);
  let failure: Error | undefined;
  child.once('error', error => { failure = error; });
  const client = createPublicClient({ transport: http(`http://127.0.0.1:${port}`, { retryCount: 0 }) });
  await waitFor(async () => {
    if (failure) throw failure;
    if (child.exitCode !== null) throw new Error(`Anvil on ${port} exited with code ${child.exitCode}`);
    try { return await client.getChainId() === 4663 && (expectedBlock === undefined || await client.getBlockNumber() >= expectedBlock) ? true : null; }
    catch { return null; }
  }, 60_000, 250);
}
async function waitFor<T>(fn: () => Promise<T | null>, ms: number, every = 1000): Promise<T> {
  const started = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - started > ms) throw new Error('timed out');
    await new Promise(resolve => setTimeout(resolve, every));
  }
}

const cookieOf = (response: { cookies: { name: string; value: string }[] }) => `eko_sid=${response.cookies.find(c => c.name === 'eko_sid')!.value}`;
const api = (session: string, method: 'GET' | 'POST' | 'PUT', path: string, payload?: object) =>
  built.app.inject({ method, url: `/v1${path}`, headers: { cookie: session, origin: ORIGIN }, ...(payload ? { payload } : {}) });
async function signIn(wallet: PrivateKeyAccount) {
  const guest = cookieOf(await built.app.inject('/v1/me'));
  const challenge = SiweNonceSchema.parse((await api(guest, 'POST', '/auth/siwe/nonce')).json());
  const message = createSiweMessage({ domain: challenge.domain, uri: challenge.uri, address: wallet.address, chainId: 4663,
    nonce: challenge.nonce, version: '1', statement: SIWE_STATEMENT, issuedAt: new Date(challenge.issuedAt), expirationTime: new Date(challenge.expirationTime) });
  const verified = await api(guest, 'POST', '/auth/siwe/verify', { message, signature: await wallet.signMessage({ message }) });
  expect(verified.statusCode, verified.body).toBe(200);
  return cookieOf(verified);
}
const tradingLive = async (enabled: boolean) => {
  const response = await api(await signIn(admin), 'PUT', '/admin/trading/live', { enabled });
  expect(response.statusCode, response.body).toBe(200);
};

const quoteResponse = (body: { coin: Address; side: 'buy' | 'sell'; amountUsd: number; slippageBps?: number }) =>
  api(cookie, 'POST', '/trade/quote', { slippageBps: 50, account: trader.address, ...body });
async function quote(body: Parameters<typeof quoteResponse>[0]): Promise<TradeQuote> {
  const response = await quoteResponse(body);
  expect(response.statusCode, response.body).toBe(200);
  const q = TradeQuoteSchema.parse(response.json());
  forkLog('quote', body.side, body.amountUsd, q.binding, q.guard.checks);
  return q;
}
const orderResponse = (q: TradeQuote, idempotencyKey: string) => api(cookie, 'POST', '/trade/order', { quoteId: q.id, idempotencyKey, acknowledged: [] });
async function order(q: TradeQuote, idempotencyKey: string) {
  const response = await orderResponse(q, idempotencyKey);
  expect(response.statusCode, response.body).toBe(201);
  const body = response.json() as { order: TradeOrder; tx: UnsignedTx };
  return { order: TradeOrderSchema.parse(body.order), tx: UnsignedTxSchema.parse(body.tx), raw: body };
}
async function submitted(id: string, txHash: Hex) {
  const response = await api(cookie, 'POST', `/trade/order/${id}/submitted`, { txHash });
  expect(response.statusCode, response.body).toBe(200);
  return TradeOrderSchema.parse(response.json());
}
const detail = async (id: string) => TradeOrderSchema.parse((await api(cookie, 'GET', `/trade/orders/${id}`)).json());
const settled = (id: string) => waitFor(async () => {
  const o = await detail(id);
  return o.status === 'submitted' || o.status === 'awaiting_signature' ? null : o;
}, 90_000);
const send = async (tx: UnsignedTx, from = traderWallet, gas?: bigint) => {
  const hash = await from.sendTransaction({ to: tx.to, data: tx.data, value: BigInt(tx.value), ...(gas ? { gas } : {}) });
  return { hash, receipt: await rpc.waitForTransactionReceipt({ hash }) };
};
const usdgOf = (who: Address) => rpc.readContract({ address: USDG, abi: erc20Abi, functionName: 'balanceOf', args: [who] });
const allowanceOf = (who: Address) => rpc.readContract({ address: USDG, abi: erc20Abi, functionName: 'allowance', args: [who, ROUTER] });
async function approveExact(amount: bigint) {
  const hash = await traderWallet.writeContract({ address: USDG, abi: erc20Abi, functionName: 'approve', args: [ROUTER, amount] });
  expect((await rpc.waitForTransactionReceipt({ hash })).status).toBe('success');
  expect(await allowanceOf(trader.address)).toBe(amount);
}
const refusalCodes = (q: TradeQuote) => q.guard.checks.filter(c => c.status === 'refuse').map(c => c.code);

describe('v1 trade API on a Robinhood Chain mainnet fork', () => {
  beforeAll(async () => {
    const pinned = process.env.FORK_BLOCK_NUMBER;
    if (pinned !== undefined && !/^[1-9][0-9]*$/.test(pinned)) throw new Error('FORK_BLOCK_NUMBER must be a positive block number');
    forkBlock = pinned ? BigInt(pinned) : await createPublicClient({ transport: http(PUBLIC_RPC, { retryCount: 1 }) }).getBlockNumber() - 30n;
    // The public RPC answers 429 to bursts: stay near 5 requests per second and wait out a limited window.
    await startAnvil(CHAIN_PORT, ['--fork-url', PUBLIC_RPC, '--fork-block-number', forkBlock.toString(), '--block-time', '1',
      '--retries', '12', '--fork-retry-backoff', '5000', '--compute-units-per-second', '80'], forkBlock);
    // The simulation host reads only the local trading fork, so it needs no upstream rate limit.
    await startAnvil(SIM_PORT, ['--fork-url', CHAIN_RPC, '--no-rate-limit']);
    for (const [who, eth] of [[trader.address, '5'], [other.address, '2']] as const)
      await rpc.request({ method: 'anvil_setBalance' as never, params: [who, `0x${parseEther(eth).toString(16)}`] as never });

    const cfg = loadConfig({
      NODE_ENV: 'test', APP_ROLE: 'api', PGLITE_DIR: ':memory:', PUBLIC_ORIGIN: ORIGIN, SESSION_SECRET: SECRET, DEMO_SECRET: SECRET,
      MARKET_DATA_SOURCE: 'onchain', LEGACY_API: 'false', LEGACY_SIGNALS: 'false', RUN_WORKER: 'false',
      // Every chain read, including "paid"-routed pinned-block reads, goes to the local fork.
      RH_MAINNET_RPC_URL: CHAIN_RPC, RPC_HTTP_URL: CHAIN_RPC, RPC_PUBLIC_HTTP_URL: CHAIN_RPC, RH_TESTNET_RPC_URL: 'http://127.0.0.1:9',
      RPC_PAID_MAX_RPM: '60000', RPC_PUBLIC_MAX_RPM: '60000',
      // Public-launch admission: no allowlist, the published cap schedule started an hour ago, zero fee, sell check on.
      LIVE_TRADING_ENABLED: 'true', TRADING_ALLOWLIST_ONLY: 'false', TRADE_CAPS_FROM: new Date(Date.now() - 3_600_000).toISOString(),
      FEE_BPS_DEFAULT: '0', SELL_CHECK_ENABLED: 'true', ADMIN_WALLETS: admin.address,
    } as NodeJS.ProcessEnv);
    harness = forkTradeBackend({ chains: () => built.ctx.chains, sql: () => built.ctx.dbh.chain.sql, lease: simulationLease(jsonRpc(SIM_RPC), CHAIN_RPC) });
    built = await buildApp(cfg, { startBackground: false, tradeBackend: harness.backend });

    // Production-shaped data: OFAC snapshot, indexed tokens/pools/ETH price, Guard verdicts and the runtime switch.
    await seedSanctions(built.ctx.dbh.chain);
    await built.ctx.dbh.chain.ensurePartitions(new Date());
    pons = await findPonsLaunch(rpc, forkBlock);
    const patient = createPublicClient({ chain, transport: http(CHAIN_RPC, { retryCount: 0, timeout: 180_000 }) });
    const indexed = await seedIndexedState(built.ctx.dbh.chain.sql, patient, forkBlock, pons ? { pons } : {});
    const sellGuard = new SellGuard(built.ctx.dbh.chain, { getBlockNumber: () => patient.getBlockNumber(), request: input => patient.request(input as never) });
    await warmForkState(patient, indexed.pools, indexed.ethUsd, (coin, usd) => sellGuard.check(coin, usd));
    for (const coin of [USDG, WETH]) harness.guard.set(coin, { level: 'lower' });
    if (pons) harness.guard.set(pons.coin, { level: 'lower' });
    await tradingLive(true);
    cookie = await signIn(trader);
    // The worker role's reconcile loop (1.5 s ticks), as `APP_ROLE=worker` starts it.
    built.ctx.exec.start();
    // Then warm the API path itself: the measured probe must fit its 5-second refresh window, so repeat a small buy
    // quote until it binds (every leg of the round trip has then run once against this fork).
    let last = '';
    await waitFor(async () => {
      const buy = await quoteResponse({ coin: USDG, side: 'buy', amountUsd: 5 });
      last = `${buy.statusCode} ${buy.statusCode === 200 ? JSON.stringify({ binding: buy.json().binding, guard: buy.json().guard }) : buy.body.slice(0, 300)}`;
      forkLog('warm-up quote', last);
      return buy.statusCode === 200 && (buy.json() as TradeQuote).binding ? true : null;
    }, 180_000, 2_000).catch(error => { throw new Error(`Fork warm-up did not converge: ${last}`, { cause: error }); });
  }, 480_000);

  afterAll(async () => {
    built?.ctx.exec.stop();
    await built?.close();
    killAnvils();
    clearTimeout(watchdog);
  });

  it('native ETH → USDG (v1 buy of USDG): binding quote, order, sign, submit, reconcile to the actual fill', async () => {
    const before = await usdgOf(trader.address);
    const q = await quote({ coin: USDG, side: 'buy', amountUsd: 20 });
    expect(q, JSON.stringify(q.guard)).toMatchObject({ coin: USDG, side: 'buy', binding: true, account: trader.address.toLowerCase(), approvals: [],
      route: { venue: 'uniswap_v3', executable: true }, fee: { bps: 0, usd: 0, destination: null }, guard: { decision: 'allow' } });
    expect(q).not.toHaveProperty('tx');
    expect(q.valueWei).toBe(q.amountIn);
    expect(BigInt(q.minOut)).toBe(BigInt(q.expectedOut) * 9950n / 10_000n);
    expect(Date.parse(q.expiresAt) - Date.now()).toBeLessThanOrEqual(15_000);

    const placed = await order(q, 'fork-v1-native-buy-0001');
    expect(placed.order).toMatchObject({ quoteId: q.id, status: 'awaiting_signature', coin: USDG, side: 'buy', feeBps: 0 });
    expect(placed.tx).toMatchObject({ chainId: 4663, to: ROUTER, value: q.valueWei });
    // A repeated click returns the same intent and bytes, with 200 instead of 201.
    const repeat = await orderResponse(q, 'fork-v1-native-buy-0001');
    expect(repeat.statusCode).toBe(200);
    expect(repeat.json()).toEqual(placed.raw);

    const { hash, receipt } = await send(placed.tx);
    expect(receipt.status).toBe('success');
    expect(await submitted(placed.order.id, hash)).toMatchObject({ status: 'submitted', txHash: hash.toLowerCase() });
    const done = await settled(placed.order.id);
    expect(done, JSON.stringify(done)).toMatchObject({ status: 'confirmed', txHash: hash.toLowerCase(), filledIn: q.amountIn });
    expect(BigInt(done.filledOut!)).toBeGreaterThanOrEqual(BigInt(q.minOut));
    expect(await usdgOf(trader.address) - before).toBe(BigInt(done.filledOut!));
    // Bought amounts get the measured post-fill sell replay at the fill block.
    const [row] = await built.ctx.dbh.db.select().from(tradeOrders).where(eq(tradeOrders.id, placed.order.id));
    expect(row!.postFillEvidence).toMatchObject({ status: 'passed', origin: 'measured', amount: done.filledOut, txHash: hash.toLowerCase() });
    const history = await api(cookie, 'GET', '/trade/orders');
    expect((history.json() as { rows: TradeOrder[] }).rows.map(o => o.id)).toContain(placed.order.id);
  }, 120_000);

  it('USDG → native ETH (v1 sell of USDG): an exact approval comes first, then the trade confirms', async () => {
    const unapproved = await quote({ coin: USDG, side: 'sell', amountUsd: 10 });
    expect(unapproved.amountIn).toBe('10000000');
    expect(unapproved.approvals).toEqual([{ token: USDG, spender: ROUTER, amount: unapproved.amountIn, kind: 'erc20' }]);
    expect(unapproved.binding).toBe(false);
    expect(refusalCodes(unapproved)).toEqual(['token_approval_required']);
    const refused = await orderResponse(unapproved, 'fork-v1-sell-0000');
    expect(refused.statusCode).toBe(422);
    expect(refused.json()).toMatchObject({ error: 'guard_refused' });

    await approveExact(BigInt(unapproved.approvals[0]!.amount)); // exact, never unlimited
    const q = await quote({ coin: USDG, side: 'sell', amountUsd: 10 });
    expect(q).toMatchObject({ binding: true, amountIn: unapproved.amountIn, valueWei: '0', guard: { decision: 'allow', checks: [] } });
    const placed = await order(q, 'fork-v1-sell-0001');
    expect(placed.tx).toMatchObject({ to: ROUTER, value: '0' });
    const [usdgBefore, ethBefore] = await Promise.all([usdgOf(trader.address), rpc.getBalance({ address: trader.address })]);
    const { hash, receipt } = await send(placed.tx);
    expect(receipt.status).toBe('success');
    await submitted(placed.order.id, hash);
    const done = await settled(placed.order.id);
    expect(done, JSON.stringify(done)).toMatchObject({ status: 'confirmed', filledIn: q.amountIn });
    expect(BigInt(done.filledOut!)).toBeGreaterThanOrEqual(BigInt(q.minOut));
    expect(usdgBefore - await usdgOf(trader.address)).toBe(BigInt(q.amountIn));
    // Native ETH received equals the decoded fill (the router unwrapped WETH to the wallet); gas is separate.
    const gas = receipt.gasUsed * receipt.effectiveGasPrice;
    expect(await rpc.getBalance({ address: trader.address }) - ethBefore + gas).toBe(BigInt(done.filledOut!));
    expect(await allowanceOf(trader.address)).toBe(0n);
  }, 120_000);

  it('a wallet rejection is recorded as rejected and nothing is submitted', async () => {
    const nonce = await rpc.getTransactionCount({ address: trader.address });
    const q = await quote({ coin: USDG, side: 'buy', amountUsd: 5 });
    const placed = await order(q, 'fork-v1-reject-0001');
    const rejected = await api(cookie, 'POST', `/trade/order/${placed.order.id}/rejected`, { code: 'user_rejected' });
    expect(rejected.statusCode).toBe(200);
    expect(TradeOrderSchema.parse(rejected.json())).toMatchObject({ status: 'rejected', errorCode: 'user_rejected' });
    // A hash reported afterwards is refused, and reconciliation never touches the rejected intent.
    const late = await api(cookie, 'POST', `/trade/order/${placed.order.id}/submitted`, { txHash: `0x${'ab'.repeat(32)}` });
    expect(late.statusCode).toBe(409);
    await new Promise(resolve => setTimeout(resolve, 3_500));
    expect(await detail(placed.order.id)).not.toHaveProperty('txHash');
    expect((await detail(placed.order.id)).status).toBe('rejected');
    expect(await rpc.getTransactionCount({ address: trader.address })).toBe(nonce);
  }, 90_000);

  it('the order transaction reverting on chain is reconciled as failed, never as a trade', async () => {
    await approveExact(5_000_000n);
    const q = await quote({ coin: USDG, side: 'sell', amountUsd: 5 });
    expect(q.binding).toBe(true);
    const placed = await order(q, 'fork-v1-revert-0001');
    // The wallet revokes the allowance before signing; the exact order bytes then revert in the router.
    await approveExact(0n);
    const before = await usdgOf(trader.address);
    const { hash, receipt } = await send(placed.tx, traderWallet, 500_000n);
    expect(receipt.status).toBe('reverted');
    await submitted(placed.order.id, hash);
    const done = await settled(placed.order.id);
    expect(done).toMatchObject({ status: 'failed', errorCode: 'reverted' });
    expect(done).not.toHaveProperty('filledIn');
    expect(done).not.toHaveProperty('filledOut');
    expect(await usdgOf(trader.address)).toBe(before);
  }, 90_000);

  it('a hash from a different sender is not accepted as the order fill, even with identical bytes', async () => {
    const q = await quote({ coin: USDG, side: 'buy', amountUsd: 5 });
    const placed = await order(q, 'fork-v1-sender-0001');
    // Another wallet broadcasts the exact order transaction (same router, calldata and value).
    const { hash, receipt } = await send(placed.tx, otherWallet);
    expect(receipt.status).toBe('success');
    await submitted(placed.order.id, hash);
    const done = await settled(placed.order.id);
    expect(done).toMatchObject({ status: 'failed', errorCode: 'tx_mismatch' });
    expect(done).not.toHaveProperty('filledOut');
  }, 90_000);

  it('a Danger Guard verdict, or a buy whose sell check cannot run, is refused at quote time', async () => {
    try {
      const cases: [Parameters<ForkHarness['guard']['set']>[1], string][] = [
        [{ level: 'lower', honeypot: true }, 'honeypot'], [{ level: 'high' }, 'guard_high'],
        // No active Guard assessment for the coin: production today, before a Guard v2 release.
        [null, 'guard_incomplete'], ['unavailable', 'sim_unavailable'],
      ];
      for (const [setting, code] of cases) {
        harness.guard.set(USDG, setting);
        const q = await quote({ coin: USDG, side: 'buy', amountUsd: 5 });
        expect(q, code).toMatchObject({ binding: false, guard: { decision: 'refuse' } });
        expect(refusalCodes(q)).toEqual([code]);
        const refused = await orderResponse(q, `fork-v1-guard-${code}`);
        expect(refused.statusCode).toBe(422);
        expect(refused.json()).toMatchObject({ error: 'guard_refused' });
      }
    } finally { harness.guard.set(USDG, { level: 'lower' }); }
    // The sell check measures exits on native-ETH routes only: a coin quoted against USDG is refused, fail closed.
    const unchecked = await quoteResponse({ coin: WETH, side: 'buy', amountUsd: 5 });
    expect(unchecked.statusCode).toBe(503);
    expect(unchecked.json()).toMatchObject({ error: 'sim_unavailable' });
  }, 120_000);

  it('Pons-curve coins have no executable v1 route (quote-only until a Pons acquisition is installed)', async () => {
    expect(pons, 'a native-ETH Pons launch in the scanned range').not.toBeNull();
    const response = await quoteResponse({ coin: pons!.coin, side: 'sell', amountUsd: 5 });
    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({ error: 'no_route' });
  }, 60_000);

  it('admission: the runtime switch and the published cap refuse at quote and order time', async () => {
    const q = await quote({ coin: USDG, side: 'buy', amountUsd: 5 });
    expect(q.binding).toBe(true);
    await tradingLive(false);
    try {
      const paused = await quote({ coin: USDG, side: 'buy', amountUsd: 5 });
      expect(paused.binding).toBe(false);
      expect(refusalCodes(paused)).toContain('trading_paused');
      const refused = await orderResponse(q, 'fork-v1-paused-0001');
      expect(refused.statusCode).toBe(422);
      expect(refused.json()).toMatchObject({ error: 'trading_paused' });
    } finally { await tradingLive(true); }
    const over = await quote({ coin: USDG, side: 'buy', amountUsd: 300 });
    expect(over.binding).toBe(false);
    expect(refusalCodes(over)).toContain('trade_cap_exceeded');
  }, 120_000);
});
