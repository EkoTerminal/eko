import { describe, expect, it, vi } from 'vitest';
import { ChainDb, type SqlClient } from '../src/client.js';

describe('chain database transaction boundaries', () => {
  it('publishes notifications only after commit and discards them on rollback', async () => {
    const query = vi.fn(async (_sql: string, _params?: unknown[]) => ({ rows: [] }));
    const sql: SqlClient = { query };
    let abort = true;
    const db = new ChainDb(sql, async fn => {
      const result = await fn(sql);
      if (abort) throw new Error('fixture rollback');
      return result;
    });
    const publish = vi.spyOn(db.bus, 'publish');
    await expect(db.tx(async tx => {
      await tx.tx(nested => nested.notify('chain_block', { block: 7 }));
      expect(publish).not.toHaveBeenCalled();
    })).rejects.toThrow('fixture rollback');
    expect(publish).not.toHaveBeenCalled();
    abort = false;
    await db.tx(tx => tx.notify('chain_block', { block: 8 }));
    expect(publish).toHaveBeenCalledExactlyOnceWith({ topic: 'chain_block', ids: { block: 8 } });
  });

  it('refuses invalid tables and columns before SQL, treats empty batches as no-ops, and binds sparse values', async () => {
    const query = vi.fn(async (_sql: string, _params?: unknown[]) => ({ rows: [{ address: 'fixture-coin' }] }));
    const db = new ChainDb({ query } as SqlClient, fn => fn({ query } as SqlClient));
    await expect(db.insertMany('tokens; DROP TABLE tokens' as 'tokens', [{ address: 'x' }])).rejects.toThrow('Invalid chain table');
    await expect(db.insertMany('tokens', [{ 'bad-column': 'x' }])).rejects.toThrow('Invalid column');
    expect(await db.insertMany('tokens', [])).toEqual([]);
    expect(query).not.toHaveBeenCalled();
    expect(await db.insertMany('tokens', [{ address: 'fixture-coin' }, { address: 'fixture-other', symbol: 'DEMO' }]))
      .toEqual([{ address: 'fixture-coin' }]);
    expect(query).toHaveBeenCalledWith(
      'INSERT INTO tokens (address,symbol) VALUES ($1,DEFAULT),($2,$3) ON CONFLICT DO NOTHING RETURNING *',
      ['fixture-coin', 'fixture-other', 'DEMO']);
  });

  it('retries partition creation after rollback and caches it only after successful commit', async () => {
    const query = vi.fn(async (_sql: string, _params?: unknown[]) => ({ rows: [] }));
    const sql: SqlClient = { query };
    let abort = true;
    const db = new ChainDb(sql, async fn => {
      const result = await fn(sql);
      if (abort) throw new Error('fixture rollback');
      return result;
    });
    const date = new Date('2026-12-15T00:00:00Z');
    await expect(db.ensurePartitions(date)).rejects.toThrow('fixture rollback');
    expect(query.mock.calls.filter(([text]) => String(text).startsWith('CREATE TABLE'))).toHaveLength(9);
    abort = false; query.mockClear();
    await db.ensurePartitions(date);
    expect(query.mock.calls.filter(([text]) => String(text).startsWith('CREATE TABLE'))).toHaveLength(9);
    expect(query.mock.calls.some(([text]) => String(text).includes('swaps_2027_02'))).toBe(true);
    query.mockClear(); await db.ensurePartitions(date);
    expect(query).not.toHaveBeenCalled();
  });
});
