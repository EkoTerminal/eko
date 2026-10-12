import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { binary } from '@eko/db';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { seedReadFixture, sampleAddress } from './read-fixture.js';

// Synthetic bars and trades only.
const hash = (n: number) => `0x${n.toString(16).padStart(64, '0')}`;
const now = 1_790_986_620_000, minute = (ago: number) => new Date(Math.floor(now / 60000) * 60000 - ago * 60000);
let built: Awaited<ReturnType<typeof buildApp>>, coin: ReturnType<typeof sampleAddress>;
const spark = async () => (await built.ctx.reads.store.rows(coin))[0].row.spark8h!;
const bars = async (minutesAgo: number[], close: (ago: number) => number) => {
  for (const ago of minutesAgo) await built.ctx.dbh.chain.sql.query('INSERT INTO bars_1m VALUES($1,$2,$3,$3,$3,$3,10,1,1,1)', [binary(coin), minute(ago), close(ago)]);
};
beforeAll(async () => {
  built = await buildApp(loadConfig({ NODE_ENV: 'test', PGLITE_DIR: ':memory:', SESSION_SECRET: 'test-only-placeholder'.repeat(2), LEGACY_API: 'false', RUN_WORKER: 'false', MARKET_DATA_SOURCE: 'onchain' }), { startBackground: false });
  built.ctx.reads.store.now = () => now;
  coin = (await seedReadFixture(built.ctx.dbh.chain, now)).identity.address;
  await built.ctx.dbh.chain.ensurePartitions(new Date(now));
});
afterAll(async () => { await built.close(); });
const reset = async () => { await built.ctx.dbh.chain.sql.query('DELETE FROM bars_1m WHERE coin=$1', [binary(coin)]); await built.ctx.dbh.chain.sql.query('DELETE FROM swaps WHERE coin=$1', [binary(coin)]); };

describe('the price series on a row', () => {
  it('gives a young coin one point per minute', async () => {
    await reset(); await bars(Array.from({ length: 30 }, (_, i) => 30 - i), (ago) => 100 - ago);
    expect(await spark()).toEqual(Array.from({ length: 30 }, (_, i) => 70 + i));
  });
  it('covers eight hours in about 96 points, oldest first, ending on the latest close', async () => {
    await reset(); await bars(Array.from({ length: 480 }, (_, i) => 479 - i), (ago) => 1000 - ago);
    const points = await spark();
    expect(points.length).toBeGreaterThan(90); expect(points.length).toBeLessThanOrEqual(97);
    expect(points.at(-1)).toBe(1000); expect(points).toEqual([...points].sort((a, b) => a - b));
    // A bar older than eight hours is outside the series.
    await bars([600], () => 5); expect((await spark())[0]).toBeGreaterThan(5);
  });
  it('uses the latest trades when there are only a few minutes of bars', async () => {
    await reset(); await bars([1, 0], (ago) => 3 - ago);
    const db = built.ctx.dbh.chain;
    for (const [n, usd] of [[1, 1], [2, 2], [3, 4], [4, 3]] as const) await db.insert('swaps', { ts: new Date(now - 120_000 + n * 1000), block: 9000 + n, tx_hash: binary(hash(9200 + n)), log_index: 0, venue: 'pons_curve', pool_id: binary(coin),
      coin: binary(coin), quote_asset: binary(sampleAddress(0)), trader: binary(sampleAddress(70)), tx_from: binary(sampleAddress(70)), tx_to: binary(coin), side: 1, amount_coin: '1000000000000000000', amount_quote: '1', price_quote: 1, usd, priced_block: 9000 + n });
    expect(await spark()).toEqual([1, 2, 4, 3]);
  });
});
