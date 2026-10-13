import { decodeAbiParameters, hexToString, parseAbi, type Hex, type PublicClient } from 'viem';
import { binary, hex, type ChainDb } from '@eko/db';
import { isTransientRpcUnavailable, loadRegistry, rpcStopReason } from '@eko/chain';
import { repricePonsSwaps, pricingAssets, REPRICE_BATCH, type PricingAssets } from './pricing-repair.js';

const ZERO = '0x0000000000000000000000000000000000000000', DEAD = '0x000000000000000000000000000000000000dead';
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', ZERO_TOPIC = `0x${'0'.repeat(64)}`;
/** Swaps or liquidity events attributed per statement. */
export const ATTRIBUTE_BATCH = 2000;
/** Blocks per mint search request (the public RPC serves at most ten million). */
const MINT_SPAN = 9_000_000n;

/**
 * Addresses that are never a coin's buyer or seller (the mint and burn addresses and the v4 pool manager), the
 * reference assets that are never onboarded as coins, and the ERC-4337 entry points (a launch sent through one was
 * sent by a bundler, not by the coin's creator).
 */
export interface AttributionAddresses { poolManager: string; weth: string; usdg: string; reference: string[]; entryPoints?: string[] }
export const attributionAddresses = (registry = loadRegistry()): AttributionAddresses => {
  const weth = registry.requireAddress('tokens.WETH'), usdg = registry.requireAddress('tokens.USDG');
  return { poolManager: registry.requireAddress('uniswapV4.poolManager'), weth, usdg,
    reference: [weth, usdg, registry.addressOf('tokens.USDC_bridged')].filter((a): a is `0x${string}` => !!a),
    entryPoints: (['entryPoints.v06', 'entryPoints.v07', 'entryPoints.v08'] as const).map(key => registry.addressOf(key)).filter((a): a is `0x${string}` => !!a).map(a => a.toLowerCase()) };
};
/**
 * A launch's sender with this many transactions is a relayer or a bot, not one person launching a coin (2026-10-13, 37
 * recent Uniswap launches: senders of 153,190, 140,006, 2,881 and 2,411 transactions sent 12 of them; the other 24
 * senders had 4 to 292). So is a sender this worker has already seen launch SHARED_LAUNCHES coins in a week.
 */
export const AUTOMATED_SENDER_TXS = 1000, SHARED_LAUNCHES = 20;

/**
 * Name the wallet behind Uniswap swaps the indexer stored without one, from the coin's own transfers in the same
 * transaction (which it already stores): no chain read. The indexer resolves the sender only for Pons coins (it reads
 * a block's receipts for that); every other pool's swaps stayed without a trader, so those coins had no buyers, no
 * holder checks and no sell check (2026-10-13: 38,600 swaps an hour). The buyer is the wallet whose balance of the
 * coin rose most in the transaction, the seller the one whose balance fell most; pools, the pool manager and the mint
 * and burn addresses never count, and a router that only passes coins on nets to zero. When no balance moved that way
 * (a wallet that bought and sold in one transaction), it is the wallet that took the coins from the pool, or sent them
 * to it. A v4 swap that moved no coins at all (the coin was one hop of a route inside the pool manager) has no wallet:
 * a buy is marked as delivered to the pool manager, so it is not mistaken for an unknown buyer. A swap whose
 * transaction has no stored transfers from before transfers were recorded stays unnamed. Checked against 10,629 swaps
 * on 2026-10-13: 92% named by balance change (99% on v3), 2% moved no coins.
 * `coins` limits it to those coins; otherwise every coin with a launch wallet that is not a Pons launch. Returns the
 * swaps settled.
 */
export async function attributeSwaps(db: ChainDb, a: AttributionAddresses, from: Date, to: Date, limit = ATTRIBUTE_BATCH, coins?: Uint8Array[]): Promise<number> {
  const scope = coins ? 's.coin=ANY($6::bytea[])' : 'EXISTS(SELECT 1 FROM tokens k WHERE k.address=s.coin AND k.deployer IS NOT NULL AND k.launchpad IS NULL)';
  return (await db.sql.query(`WITH c AS MATERIALIZED (
      SELECT s.ts,s.tx_hash,s.log_index,s.block,s.coin,s.pool_id,s.side,s.venue,s.recipient FROM swaps s
      WHERE s.senders_pending AND s.venue<>'pons_curve' AND s.ts>=$1 AND s.ts<$2 AND ${scope} ORDER BY s.block DESC,s.log_index DESC LIMIT $3),
    m AS (SELECT c.ts,c.tx_hash,c.log_index,c.side,x.addr,x.net,x.gin,x.gout,x.from_pool,x.to_pool FROM c CROSS JOIN LATERAL (
      SELECT d.addr,sum(d.delta) AS net,coalesce(sum(d.delta) FILTER (WHERE d.delta>0),0) AS gin,coalesce(-sum(d.delta) FILTER (WHERE d.delta<0),0) AS gout,
        bool_or(d.delta>0 AND (d.other=c.pool_id OR d.other=$4)) AS from_pool,bool_or(d.delta<0 AND (d.other=c.pool_id OR d.other=$4)) AS to_pool
      FROM (SELECT t.to_address AS addr,t.amount AS delta,t.from_address AS other FROM token_transfers t WHERE t.token=c.coin AND t.block=c.block AND t.tx_hash=c.tx_hash AND t.kind='Transfer'
        UNION ALL SELECT t.from_address,-t.amount,t.to_address FROM token_transfers t WHERE t.token=c.coin AND t.block=c.block AND t.tx_hash=c.tx_hash AND t.kind='Transfer') d
      WHERE NOT d.addr=ANY($5::bytea[]) AND d.addr<>c.pool_id AND NOT EXISTS(SELECT 1 FROM pools p WHERE p.id=d.addr)
      GROUP BY d.addr) x),
    ranked AS (SELECT m.*,CASE WHEN (side=1 AND net>0) OR (side=-1 AND net<0) THEN 0 WHEN (side=1 AND from_pool) OR (side=-1 AND to_pool) THEN 1
        WHEN (side=1 AND gin>0) OR (side=-1 AND gout>0) THEN 2 END AS tier FROM m),
    pick AS (SELECT DISTINCT ON (ts,tx_hash,log_index) ts,tx_hash,log_index,addr FROM ranked WHERE tier IS NOT NULL
      ORDER BY ts,tx_hash,log_index,tier,CASE WHEN tier=0 THEN abs(net) WHEN side=1 THEN gin ELSE gout END DESC,addr),
    -- No coins moved: nobody took delivery, when the coin's transfers were being stored by then.
    r AS (SELECT c.*,p.addr,p.addr IS NULL AND c.venue='uniswap_v4' AND c.side=1
        AND NOT EXISTS(SELECT 1 FROM token_transfers t WHERE t.token=c.coin AND t.block=c.block AND t.tx_hash=c.tx_hash)
        AND EXISTS(SELECT 1 FROM token_transfers t WHERE t.token=c.coin AND t.block<c.block) AS undelivered
      FROM c LEFT JOIN pick p ON p.ts=c.ts AND p.tx_hash=c.tx_hash AND p.log_index=c.log_index)
    UPDATE swaps s SET trader=r.addr,senders_pending=false,
      recipient=CASE WHEN r.side<>1 THEN s.recipient WHEN r.addr IS NOT NULL THEN r.addr WHEN r.undelivered THEN $4 ELSE s.recipient END
    FROM r WHERE s.ts=r.ts AND s.tx_hash=r.tx_hash AND s.log_index=r.log_index RETURNING 1`,
    [from, to, limit, binary(a.poolManager), [ZERO, DEAD, a.poolManager].map(binary), ...(coins ? [coins] : [])])).rows.length;
}

/**
 * Name the wallet behind liquidity events stored without one, the same way: whoever's balance of the pool's coin (its
 * token other than WETH and USDG) fell most in the transaction added the liquidity, whoever's rose most took it out. Most positions are held
 * through a position manager contract, so the event's own owner says nothing about who controls them; an event with
 * no such wallet keeps the owner or sender it names, or the pool manager or pool. `coins` limits it to pools of those
 * coins, otherwise events from `fromBlock` on in pools of coins with a launch wallet that are not Pons launches.
 */
export async function attributeLiquidity(db: ChainDb, a: AttributionAddresses, limit = ATTRIBUTE_BATCH, scope: { coins: Uint8Array[] } | { fromBlock: string }): Promise<number> {
  const where = 'coins' in scope ? '(p.currency0=ANY($4::bytea[]) OR p.currency1=ANY($4::bytea[]))'
    : 'e.block>=$4::bigint AND EXISTS(SELECT 1 FROM tokens k WHERE k.address IN (p.currency0,p.currency1) AND k.deployer IS NOT NULL AND k.launchpad IS NULL)';
  const word = (field: string) => `CASE WHEN lower(e.data->>'${field}') ~ '^0x[0-9a-f]{40}$' THEN decode(substr(lower(e.data->>'${field}'),3),'hex') END`;
  return (await db.sql.query(`WITH c AS MATERIALIZED (
      SELECT e.tx_hash,e.log_index,e.block,e.pool_id,p.currency0,p.currency1,
        CASE WHEN e.kind='Mint' OR (e.kind='ModifyLiquidity' AND (e.data->>'liquidityDelta') ~ '^[0-9]+$' AND (e.data->>'liquidityDelta')<>'0') THEN -1
          WHEN e.kind IN ('Burn','Collect') OR (e.kind='ModifyLiquidity' AND (e.data->>'liquidityDelta') ~ '^-[0-9]+$') THEN 1 ELSE 0 END AS way,
        coalesce(${word('owner')},${word('sender')},${word('recipient')},CASE WHEN length(e.pool_id)=20 THEN e.pool_id ELSE $2 END) AS named
      FROM liquidity_events e JOIN pools p ON p.id=e.pool_id WHERE e.senders_pending AND ${where} ORDER BY e.block DESC LIMIT $1),
    pick AS (SELECT c.tx_hash,c.log_index,(SELECT d.addr FROM (
        SELECT x.addr,sum(x.delta) AS net FROM (
          SELECT t.to_address AS addr,t.amount AS delta FROM token_transfers t WHERE t.token IN (c.currency0,c.currency1) AND NOT t.token=ANY($5::bytea[]) AND t.block=c.block AND t.tx_hash=c.tx_hash AND t.kind='Transfer'
          UNION ALL SELECT t.from_address,-t.amount FROM token_transfers t WHERE t.token IN (c.currency0,c.currency1) AND NOT t.token=ANY($5::bytea[]) AND t.block=c.block AND t.tx_hash=c.tx_hash AND t.kind='Transfer') x
        WHERE NOT x.addr=ANY($3::bytea[]) AND x.addr<>c.pool_id AND NOT EXISTS(SELECT 1 FROM pools q WHERE q.id=x.addr) GROUP BY x.addr) d
        WHERE c.way<>0 AND d.net*c.way>0 ORDER BY abs(d.net) DESC,d.addr LIMIT 1) AS addr FROM c)
    UPDATE liquidity_events e SET actor=coalesce(pick.addr,c.named),senders_pending=false FROM c JOIN pick USING (tx_hash,log_index)
    WHERE e.tx_hash=c.tx_hash AND e.log_index=c.log_index RETURNING 1`,
    [limit, binary(a.poolManager), [ZERO, DEAD, a.poolManager].map(binary), 'coins' in scope ? scope.coins : scope.fromBlock, a.reference.map(binary)])).rows.length;
}

export interface TokenFacts { decimals: number | null; symbol: string | null; name: string | null; totalSupply: bigint | null }
export interface LaunchWallet { wallet: string; to: string | null; block: bigint; tx: string; mintTo: string | null }
/** The chain reads onboarding needs (the worker uses the public RPC; tests supply fixtures). */
export interface OnboardingChain {
  facts(token: string): Promise<TokenFacts>;
  /** The sender (and target) of the transaction that first minted the token at or below `upTo`, or null when it has no mint there. */
  firstMint(token: string, upTo: bigint): Promise<LaunchWallet | null>;
  /** A transaction's sender and target. */
  transaction(tx: string): Promise<{ from: string; to: string | null } | null>;
  /** Transactions the wallet has sent (its nonce), or null when unreadable. */
  sent(wallet: string): Promise<number | null>;
}

const erc20 = parseAbi(['function decimals() view returns (uint8)', 'function symbol() view returns (string)', 'function name() view returns (string)', 'function totalSupply() view returns (uint256)']);
const multicall3 = parseAbi(['struct Call3 { address target; bool allowFailure; bytes callData; }', 'struct Result { bool success; bytes returnData; }',
  'function aggregate3(Call3[] calls) view returns (Result[] returnData)']);
const SELECTORS = { decimals: '0x313ce567', symbol: '0x95d89b41', name: '0x06fdde03', totalSupply: '0x18160ddd' } as const;
/** A string return, or the bytes32 some older tokens return for name and symbol; null when neither decodes to text. */
export function decodeText(data: Hex): string | null {
  let text: string | null = null;
  try { text = decodeAbiParameters([{ type: 'string' }], data)[0]; }
  catch { if (data.length === 66) try { text = hexToString(data, { size: 32 }); } catch { /* not text */ } }
  // Postgres text cannot hold a NUL byte.
  text = text?.replaceAll('\u0000', '').trim() ?? null;
  return text ? text.slice(0, 256) : null;
}
/** A provider refusing a log query for the size of its answer (never a rate limit, which is retried by the meter). */
const sizeLimited = (error: unknown) => { const e = error as { details?: string; shortMessage?: string; message?: string };
  return /more than \d+ results|too many results|query returned more|response size|result set too large|exceeds? (the )?max/i.test(`${e?.details ?? ''} ${e?.shortMessage ?? ''} ${e?.message ?? ''}`); };
/** Log requests one token's mint search may make. */
const MINT_REQUESTS = 24;
/** Onboarding reads through a metered client (the worker passes one bound to the public RPC, so nothing here is billed). */
export function chainOnboarding(client: () => PublicClient, registry = loadRegistry()): OnboardingChain {
  const multicall = registry.requireAddress('multicall3');
  const stop = (error: unknown) => { if (rpcStopReason(error) || isTransientRpcUnavailable(error)) throw error; };
  const mints = (token: string, from: bigint, to: bigint) => client().request({ method: 'eth_getLogs',
    params: [{ address: token as Hex, topics: [TRANSFER, ZERO_TOPIC], fromBlock: `0x${from.toString(16)}`, toBlock: `0x${to.toString(16)}` }] } as never) as Promise<{ blockNumber: Hex; logIndex: Hex; transactionHash: Hex; topics: Hex[] }[]>;
  const earliest = async (token: string, from: bigint, to: bigint, budget: { left: number }): Promise<{ blockNumber: Hex; logIndex: Hex; transactionHash: Hex; topics: Hex[] } | null> => {
    let logs;
    if (budget.left-- <= 0) throw new Error('Mint search exceeded its request budget');
    try { logs = await mints(token, from, to); }
    catch (error) {
      stop(error);
      // A token that mints constantly returns more logs than one reply holds: its first mint is in the lower half.
      if (!sizeLimited(error) || from >= to) throw error;
      const mid = from + (to - from) / 2n;
      return await earliest(token, from, mid, budget) ?? await earliest(token, mid + 1n, to, budget);
    }
    return logs.reduce<typeof logs[number] | null>((first, log) => !first || BigInt(log.blockNumber) < BigInt(first.blockNumber)
      || (BigInt(log.blockNumber) === BigInt(first.blockNumber) && BigInt(log.logIndex) < BigInt(first.logIndex)) ? log : first, null);
  };
  const transaction = async (tx: string) => {
    try {
      const found = (await client().request({ method: 'eth_getTransactionByHash', params: [tx as Hex] } as never)) as { from?: string; to?: string | null } | null;
      return found?.from ? { from: found.from.toLowerCase(), to: found.to?.toLowerCase() ?? null } : null;
    } catch (error) { stop(error); return null; }
  };
  return {
    transaction,
    async sent(wallet) {
      try { return Number(BigInt((await client().request({ method: 'eth_getTransactionCount', params: [wallet as Hex, 'latest'] } as never)) as Hex)); }
      catch (error) { stop(error); return null; }
    },
    async facts(token) {
      const calls = Object.values(SELECTORS).map(callData => ({ target: token as Hex, allowFailure: true, callData: callData as Hex }));
      let results: readonly { success: boolean; returnData: Hex }[];
      try { results = await client().readContract({ address: multicall, abi: multicall3, functionName: 'aggregate3', args: [calls] }); }
      catch (error) { stop(error); return { decimals: null, symbol: null, name: null, totalSupply: null }; }
      const [decimals, symbol, name, supply] = results;
      const number = (r: { success: boolean; returnData: Hex }) => { try { return r.success && r.returnData.length === 66 ? BigInt(r.returnData) : null; } catch { return null; } };
      const d = number(decimals), total = number(supply);
      return { decimals: d != null && d <= 36n ? Number(d) : null, symbol: symbol.success ? decodeText(symbol.returnData) : null, name: name.success ? decodeText(name.returnData) : null, totalSupply: total };
    },
    async firstMint(token, upTo) {
      let found: Awaited<ReturnType<typeof earliest>> = null;
      const budget = { left: MINT_REQUESTS };
      // Newest window first; the first window without a mint below one that had some ends the search.
      for (let hi = upTo; hi >= 0n;) {
        let log: Awaited<ReturnType<typeof earliest>>;
        const lo = hi > MINT_SPAN ? hi - MINT_SPAN : 0n;
        try { log = await earliest(token, lo, hi, budget); }
        catch (error) { stop(error); if (found) break; return null; }
        if (log) found = log; else if (found) break;
        if (lo === 0n) break;
        hi = lo - 1n;
      }
      if (!found) return null;
      const sent = await transaction(found.transactionHash);
      return sent ? { wallet: sent.from, to: sent.to, block: BigInt(found.blockNumber), tx: found.transactionHash, mintTo: found.topics[2] ? `0x${found.topics[2].slice(-40)}`.toLowerCase() : null } : null;
    },
  };
}

interface Candidate { coin: Uint8Array; first_block: string }
export interface OnboardingOptions { now?: () => number; intervalMs?: number; budgetMs?: number; perTick?: number; batch?: number; assets?: PricingAssets; addresses?: AttributionAddresses }
const HOUR = 3_600_000;
/**
 * Worker role. Every 30 s: name the traders and liquidity providers of new Uniswap swaps of coins already onboarded,
 * then onboard a few more coins, newest launches first, then the most traded in the last day. Onboarding a coin reads
 * its name, symbol, decimals and supply (one call) and the wallet that sent its first mint (its launch wallet, the
 * `deployer` every rating check is written against), prices its stored swaps and names their traders, and only then
 * records the launch wallet: that makes the coin visible to the rating engine and the Radar with its history complete.
 * A launch sent by a relayer, a bundler or a bot (launchWallet below) has no wallet that is its creator's: the coin's
 * own address is recorded instead, which every check reads as "no deployer wallet" (it never trades, holds only what
 * the contract holds, and has no other launches), so hundreds of unrelated coins are not tied to one sender.
 * A coin whose history does not fit a pass is resumed on the next. A token without readable decimals, or without a
 * name and symbol, or with no mint to find, is retried after a growing wait (six hours to two days).
 */
export class CoinOnboardingWorker {
  private timer?: NodeJS.Timeout;
  private running?: Promise<void>;
  private queue: Candidate[] = [];
  private traded: Candidate[] = [];
  private tradedAt = -Infinity;
  private readonly now: () => number;
  private readonly addresses: AttributionAddresses;
  private assets?: PricingAssets;
  constructor(private readonly db: ChainDb, private readonly chain: OnboardingChain, private readonly log: (event: string, fields: Record<string, unknown>) => void,
    private readonly options: OnboardingOptions = {}) {
    this.now = options.now ?? (() => Date.now());
    this.addresses = options.addresses ?? attributionAddresses();
    this.assets = options.assets;
  }
  start() { if (this.timer) return; void this.tick(); this.timer = setInterval(() => void this.tick(), this.options.intervalMs ?? 30_000); this.timer.unref(); }
  async stop() { if (this.timer) clearInterval(this.timer); this.timer = undefined; await this.running; }
  tick(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.pass().catch(error => this.log('coin_onboarding_failed', { error: String((error as Error)?.message ?? error).slice(0, 200) })).finally(() => { this.running = undefined; });
    return this.running;
  }
  /** Coins to onboard: launched in the last hour first (newest first, read every pass), then by swaps in the last day (read every five minutes). */
  private async candidates(started: number) {
    const skip = `t.deployer IS NULL AND t.launchpad IS NULL AND NOT t.address=ANY($2::bytea[]) AND NOT EXISTS(SELECT 1 FROM coin_onboarding o WHERE o.coin=t.address
      AND o.status IN ('unreadable','no_launch_wallet','skipped') AND o.updated_at>to_timestamp($1::double precision)-interval '6 hours'*least(o.attempts,8))`;
    const params = [started / 1000, [ZERO, ...this.addresses.reference].map(binary)];
    const fresh = (await this.db.sql.query<Candidate>(`SELECT t.address AS coin,t.first_block::text FROM tokens t
      WHERE t.first_block>coalesce((SELECT number FROM chain_blocks WHERE ts<to_timestamp($1::double precision)-interval '1 hour' ORDER BY ts DESC LIMIT 1),0) AND ${skip}
        AND EXISTS(SELECT 1 FROM pools p WHERE p.currency0=t.address OR p.currency1=t.address) ORDER BY t.first_block DESC LIMIT 100`, params)).rows;
    if (started - this.tradedAt >= 300_000 || !this.traded.length && started - this.tradedAt >= 60_000) {
      this.traded = (await this.db.sql.query<Candidate>(`SELECT t.address AS coin,t.first_block::text FROM (SELECT s.coin,count(*) AS n FROM swaps s
          WHERE s.ts>to_timestamp($1::double precision)-interval '24 hours' AND s.venue<>'pons_curve' GROUP BY s.coin) a JOIN tokens t ON t.address=a.coin
        WHERE ${skip} ORDER BY a.n DESC,t.address LIMIT 400`, params)).rows;
      this.tradedAt = started;
    }
    const seen = new Set<string>();
    this.queue = [...fresh, ...this.traded].filter(row => { const key = hex(row.coin); if (seen.has(key)) return false; seen.add(key); return true; });
  }
  private done(coin: Uint8Array) { const key = hex(coin); this.traded = this.traded.filter(row => hex(row.coin) !== key); this.queue = this.queue.filter(row => hex(row.coin) !== key); }
  private async mark(coin: Uint8Array, status: string, data: Record<string, unknown> = {}) {
    // Waits are measured on the worker's clock, so the row's time is too.
    await this.db.sql.query(`INSERT INTO coin_onboarding(coin,status,attempts,data,created_at,updated_at) VALUES($1,$2,1,$3::jsonb,to_timestamp($4::double precision),to_timestamp($4::double precision))
      ON CONFLICT(coin) DO UPDATE SET status=excluded.status,attempts=coin_onboarding.attempts+1,data=coin_onboarding.data||excluded.data,updated_at=excluded.updated_at`, [coin, status, JSON.stringify(data), this.now() / 1000]);
  }
  /**
   * Why a launch's sender is not the coin's own launch wallet, or null when it is: the transaction went through an
   * ERC-4337 entry point (sent by a bundler), the sender has sent AUTOMATED_SENDER_TXS transactions or its count
   * cannot be read, or this worker has seen it launch SHARED_LAUNCHES coins in a week.
   */
  private async shared(sent: { from: string; to: string | null }): Promise<string | null> {
    if (sent.to && this.addresses.entryPoints?.includes(sent.to.toLowerCase())) return 'entry_point';
    const launches = Number((await this.db.sql.query<{ n: string }>(`SELECT count(*) AS n FROM coin_onboarding WHERE data->>'sender'=$1 AND created_at>to_timestamp($2::double precision)-interval '7 days'`,
      [sent.from, this.now() / 1000])).rows[0].n);
    if (launches >= SHARED_LAUNCHES) return 'many_launches';
    const txs = await this.chain.sent(sent.from);
    return txs == null ? 'unreadable_sender' : txs >= AUTOMATED_SENDER_TXS ? 'automated_sender' : null;
  }
  /** One coin, through to its launch wallet; 'unfinished' when the pass ran out of time first, 'set_aside' when it cannot be read yet. */
  private async onboard(candidate: Candidate, deadline: number): Promise<'onboarded' | 'set_aside' | 'unfinished'> {
    const coin = candidate.coin, address = hex(coin), batch = this.options.batch ?? ATTRIBUTE_BATCH;
    const token = (await this.db.sql.query<{ decimals: number | null; name: string | null; symbol: string | null; total_supply: string | null; deployer: Uint8Array | null; launchpad: string | null }>(
      'SELECT decimals,name,symbol,total_supply::text,deployer,launchpad FROM tokens WHERE address=$1', [coin])).rows[0];
    if (!token || token.deployer || token.launchpad) return 'set_aside';
    if (token.decimals == null || token.name == null || token.symbol == null || token.total_supply == null) {
      const facts = await this.chain.facts(address);
      // A token that answers only one of name and symbol is listed under the one it has.
      const name = facts.name ?? facts.symbol, symbol = facts.symbol ?? facts.name;
      if (facts.decimals == null || name == null || symbol == null) { await this.mark(coin, 'unreadable', { decimals: facts.decimals, named: name != null }); return 'set_aside'; }
      await this.db.sql.query(`UPDATE tokens SET decimals=coalesce(decimals,$2),name=coalesce(name,$3),symbol=coalesce(symbol,$4),
          total_supply=coalesce(total_supply,$5::numeric),supply_block=CASE WHEN total_supply IS NULL AND $5::numeric IS NOT NULL THEN (SELECT max(number) FROM chain_blocks) ELSE supply_block END
        WHERE address=$1`, [coin, facts.decimals, name, symbol, facts.totalSupply?.toString() ?? null]);
    }
    const state = (await this.db.sql.query<{ data: { launchWallet?: string } }>('SELECT data FROM coin_onboarding WHERE coin=$1', [coin])).rows[0];
    let wallet = state?.data.launchWallet;
    if (!wallet) {
      // The mint is at or before the coin's first pool or trade; a few blocks of slack for a pool opened in the same block.
      const mint = await this.chain.firstMint(address, BigInt(candidate.first_block) + 100n);
      let sent: { from: string; to: string | null } | null = mint ? { from: mint.wallet, to: mint.to } : null;
      let found: Record<string, unknown> | undefined = mint ? { mintBlock: mint.block.toString(), mintTx: mint.tx, mintTo: mint.mintTo } : undefined;
      if (!sent) {
        // No mint from the zero address: the sender of the coin's first stored transfer.
        const first = (await this.db.sql.query<{ tx_hash: Uint8Array; block: string }>('SELECT tx_hash,block::text FROM token_transfers WHERE token=$1 ORDER BY block,log_index LIMIT 1', [coin])).rows[0];
        sent = first ? await this.chain.transaction(hex(first.tx_hash)) : null;
        if (sent) found = { firstTransferBlock: first!.block, firstTransferTx: hex(first!.tx_hash) };
      }
      if (!sent || !found) { await this.mark(coin, 'no_launch_wallet'); return 'set_aside'; }
      const shared = await this.shared(sent);
      wallet = shared ? address : sent.from;
      await this.mark(coin, 'working', { ...found, launchWallet: wallet, sender: sent.from, senderTo: sent.to, ...(shared ? { shared } : {}) });
    }
    // Stored swaps: priced, then named, a batch at a time. Liquidity events the same way. Pricing goes an hour at a
    // time, newest first: each hour reads only that hour's ETH/USD reference swaps.
    const epoch = new Date(0), end = new Date(this.now() + HOUR), floor = new Date(this.now() - 2 * 24 * HOUR);
    const hours = (await this.db.sql.query<{ hour: Date }>(`SELECT DISTINCT date_trunc('hour',ts) AS hour FROM swaps WHERE coin=$1 AND usd IS NULL AND amount_coin>0 AND amount_quote>0 ORDER BY 1 DESC`, [coin])).rows;
    for (const { hour } of hours) for (;;) {
      if (this.now() >= deadline) return 'unfinished';
      const from = new Date(hour);
      if (await repricePonsSwaps(this.db, this.assets ??= pricingAssets(), from, new Date(from.getTime() + HOUR), REPRICE_BATCH, floor, [coin]) < REPRICE_BATCH) break;
    }
    for (;;) {
      if (this.now() >= deadline) return 'unfinished';
      if (await attributeSwaps(this.db, this.addresses, epoch, end, batch, [coin]) < batch) break;
    }
    for (;;) {
      if (this.now() >= deadline) return 'unfinished';
      if (await attributeLiquidity(this.db, this.addresses, batch, { coins: [coin] }) < batch) break;
    }
    await this.db.tx(async tx => {
      await tx.sql.query('UPDATE tokens SET deployer=$2 WHERE address=$1 AND deployer IS NULL AND launchpad IS NULL', [coin, binary(wallet!)]);
      await tx.sql.query(`INSERT INTO coin_onboarding(coin,status,attempts,created_at,updated_at) VALUES($1,'done',1,to_timestamp($2::double precision),to_timestamp($2::double precision))
        ON CONFLICT(coin) DO UPDATE SET status='done',updated_at=excluded.updated_at`, [coin, this.now() / 1000]);
    });
    return 'onboarded';
  }
  private async pass() {
    const started = this.now(), deadline = started + (this.options.budgetMs ?? 20_000), batch = this.options.batch ?? ATTRIBUTE_BATCH;
    // New swaps and liquidity events of onboarded coins first: the two hours behind the head, newest first.
    let swaps = 0, liquidity = 0;
    for (let n = batch; n === batch && this.now() < deadline;) { n = await attributeSwaps(this.db, this.addresses, new Date(started - 2 * HOUR), new Date(started + HOUR), batch); swaps += n; }
    const recent = (await this.db.sql.query<{ number: string | null }>(`SELECT (SELECT number FROM chain_blocks WHERE ts<to_timestamp($1::double precision)-interval '2 hours' ORDER BY ts DESC LIMIT 1)::text AS number`, [started / 1000])).rows[0]?.number ?? '0';
    for (let n = batch; n === batch && this.now() < deadline;) { n = await attributeLiquidity(this.db, this.addresses, batch, { fromBlock: recent }); liquidity += n; }
    await this.candidates(started);
    let onboarded = 0, set = 0, unfinished = 0;
    for (let tried = 0; this.queue.length && tried < (this.options.perTick ?? 4) && this.now() < deadline; tried++) {
      const candidate = this.queue[0], outcome = await this.onboard(candidate, deadline);
      if (outcome === 'unfinished') { unfinished++; break; }
      this.done(candidate.coin);
      if (outcome === 'onboarded') onboarded++; else set++;
    }
    if (swaps || liquidity || onboarded || set || unfinished) this.log('coin_onboarding', { swaps, liquidity, onboarded, setAside: set, unfinished, queued: this.queue.length, ms: this.now() - started });
  }
}
