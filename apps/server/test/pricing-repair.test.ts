import { afterEach, describe, expect, it } from 'vitest';
import { binary, migrate, migrateEngines, openDb, type ChainDb } from '@eko/db';
import { PricingRepairWorker, repricePonsSwaps, retagPairQuotes, type PricingAssets } from '../src/pricing-repair.js';

// 2026-10-11: 694,000 of 1.96 million Pons swaps in seven days had no USD (USDG quotes, and curve swaps decoded before
// the coin's decimals were known), so those coins never got wash and curve checks and could never be rated Clear.
const now = Date.parse('2026-10-11T12:00:00Z');
const address = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
const hash = (n: number) => `0x${n.toString(16).padStart(64, '0')}`;
const weth = address(0xee), usdg = address(0xd0), pool = address(0x77), coin = address(0xa1), other = address(0xb1), native = address(0);
const assets: PricingAssets = { weth, usdg, usdgDecimals: 6 };
const handles: ChainDb[] = [];
afterEach(async () => { await Promise.all(handles.splice(0).map(db => db.close())); });
let id = 1;
async function swap(db: ChainDb, n: number, c: string, quote: string, amountQuote: string, extra: Record<string, unknown> = {}) {
  const row = { ts: new Date(now - (100 - n) * 60_000), block: String(n), tx_hash: binary(hash(id++)), log_index: 0, venue: 'pons_curve', pool_id: binary(c === weth ? pool : c),
    coin: binary(c), quote_asset: binary(quote), trader: null, tx_from: null, tx_to: null, senders_pending: false, side: 1, amount_coin: '2000000000000000000', amount_quote: amountQuote,
    price_quote: null, usd: null, priced_block: null, pricing_pending: true, ...extra };
  await db.insert('swaps', row);
  return row;
}
const priced = async (db: ChainDb) => (await db.sql.query<{ block: string; usd: number | null; pending: boolean; priced_block: string | null }>(
  'SELECT block::text,usd,pricing_pending AS pending,priced_block::text FROM swaps WHERE coin<>$1 ORDER BY swaps.block', [binary(weth)])).rows;

describe('Pons swap repricing', () => {
  it('prices pending ETH swaps at the reference rate of their block and USDG swaps at par, then refreshes candles', async () => {
    const db = await openDb({ pgliteDir: ':memory:' }); handles.push(db);
    await migrate(db); await migrateEngines(db); await db.ensurePartitions(new Date(now));
    for (const [c, launchpad] of [[coin, 'pons'], [other, null]] as const)
      await db.insert('tokens', { address: binary(c), name: 'Sample token', symbol: 'DEMO', decimals: 18, launchpad, first_block: '1', block: '1' });
    await db.insert('eth_usd_reference_sources', { block: '10', pool_id: binary(pool), venue: 'uniswap_v3', fee: 100 });
    // Reference swaps: 2,000 then 3,000 USDG per WETH.
    await swap(db, 10, weth, usdg, '1', { venue: 'uniswap_v3', price_quote: 2000, pricing_pending: false });
    await swap(db, 30, weth, usdg, '1', { venue: 'uniswap_v3', price_quote: 3000, pricing_pending: false });
    await swap(db, 5, coin, native, '1000000000000000000');              // before any reference: stays unpriced
    await swap(db, 20, coin, native, '1000000000000000000');             // 1 ETH at 2,000
    await swap(db, 40, coin, native, '500000000000000000');              // 0.5 ETH at 3,000
    await swap(db, 41, coin, usdg, '25000000', { pricing_pending: false }); // 25 USDG
    await swap(db, 42, other, native, '1000000000000000000');            // not a Pons coin
    expect(await repricePonsSwaps(db, assets, new Date(now - 200 * 60_000), new Date(now))).toBe(3);
    expect(await priced(db)).toEqual([
      { block: '5', usd: null, pending: true, priced_block: null },
      { block: '20', usd: 2000, pending: false, priced_block: '10' },
      { block: '40', usd: 1500, pending: false, priced_block: '30' },
      { block: '41', usd: 25, pending: false, priced_block: '41' },
      { block: '42', usd: null, pending: true, priced_block: null },
    ]);
    const bars = (await db.sql.query<{ volume: number }>('SELECT sum(volume_usd) AS volume FROM bars_1m WHERE coin=$1', [binary(coin)])).rows[0];
    expect(Number(bars.volume)).toBe(3525);
    expect(await repricePonsSwaps(db, assets, new Date(now - 200 * 60_000), new Date(now))).toBe(0);
  });
  it('resumes an hour the budget cut short instead of skipping it', async () => {
    const db = await openDb({ pgliteDir: ':memory:' }); handles.push(db);
    await migrate(db); await migrateEngines(db); await db.ensurePartitions(new Date(now - 30 * 3_600_000));
    await db.insert('tokens', { address: binary(coin), name: 'Sample token', symbol: 'DEMO', decimals: 18, launchpad: 'pons', first_block: '1', block: '1' });
    // Twelve USDG swaps one hour apart from twenty hours ago: beyond the six recent hours, in the backfill.
    for (let i = 0; i < 12; i++) await db.insert('swaps', { ts: new Date(now - (20 - i * 0.1) * 3_600_000), block: String(10 + i), tx_hash: binary(hash(500 + i)), log_index: 0,
      venue: 'uniswap_v3', pool_id: binary(pool), coin: binary(coin), quote_asset: binary(usdg), trader: null, tx_from: null, tx_to: null, senders_pending: false, side: 1,
      amount_coin: '1000000000000000000', amount_quote: '1000000', price_quote: 1, usd: null, priced_block: null, pricing_pending: false });
    // Each clock read advances 10 s against a 100 s budget: a pass checks the six recent hours, then prices about three
    // batches of two, so an hour of ten swaps spans passes.
    let clock = now;
    const worker = new PricingRepairWorker(db, () => undefined, () => (clock += 10_000), 30_000, 100_000, assets, 2);
    for (let pass = 0; pass < 40; pass++) await worker.tick();
    expect((await db.sql.query('SELECT 1 FROM swaps WHERE usd IS NULL')).rows).toHaveLength(0);
  });
  it('re-tags a non-native curve pair recorded as ETH and prices pair-token quotes from the pair token itself', async () => {
    const db = await openDb({ pgliteDir: ':memory:' }); handles.push(db);
    await migrate(db); await migrateEngines(db); await db.ensurePartitions(new Date(now));
    const stock = address(0x5a), curve = address(0xc1), stockCoin = address(0xa2);
    for (const [c, launchpad] of [[coin, 'pons'], [stockCoin, 'pons'], [stock, null]] as const)
      await db.insert('tokens', { address: binary(c), name: 'Sample token', symbol: 'DEMO', decimals: 18, launchpad, first_block: '1', block: '1' });
    // coin's curve pairs with USDG; stockCoin's curve pairs with a stock token that trades at 150 USD.
    for (const [c, pair] of [[coin, usdg], [stockCoin, stock]] as const) await db.insert('pons_events', { block: '1', tx_hash: binary(hash(9000 + Number(BigInt(c)))), log_index: 0,
      token: binary(c), emitter: binary(curve), kind: 'launch', data: JSON.stringify({ kind: 'launch', token: c, curve: c === coin ? curve : address(0xc2), pairToken: pair }) });
    await swap(db, 10, stock, usdg, '150000000', { venue: 'uniswap_v3', amount_coin: '1000000000000000000', price_quote: 150, usd: 150, pricing_pending: false });
    await swap(db, 20, coin, native, '25000000', { pool_id: binary(curve), price_quote: 1e-11, usd: 0.00000005, pricing_pending: false });   // recorded as ETH
    await swap(db, 21, stockCoin, stock, '2000000000000000000', { pool_id: binary(address(0xc2)), pricing_pending: false });                 // 2 stock tokens
    expect(await retagPairQuotes(db)).toBe(1);expect(await retagPairQuotes(db)).toBe(0);
    expect(await repricePonsSwaps(db, assets, new Date(now - 200 * 60_000), new Date(now))).toBe(2);
    const rows = (await db.sql.query<{ block: string; quote: Uint8Array; usd: number }>('SELECT block::text,quote_asset AS quote,usd FROM swaps WHERE block IN (20,21) ORDER BY swaps.block')).rows;
    expect(rows.map(r => [r.block, `0x${Buffer.from(r.quote).toString('hex')}`, r.usd])).toEqual([['20', usdg, 25], ['21', stock, 300]]);
  });
});
