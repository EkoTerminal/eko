import { describe, expect, it } from 'vitest';
import { binary, migrate, migrateEngines, openDb } from '@eko/db';
import { refreshClock } from '../src/activity.js';

const epoch = Date.parse('2026-10-01T00:00:00Z');
const hash = (n: number) => binary(`0x${n.toString(16).padStart(64, '0')}`);
const sample = binary(`0x${'1'.repeat(40)}`);

describe('engine block clock', () => {
  it('copies indexed headers on every poll without rewriting rows that did not change', async () => {
    const db = await openDb({ pgliteDir: ':memory:' });
    try {
      await migrate(db); await migrateEngines(db); await db.ensurePartitions(new Date(epoch));
      for (const n of [1, 2, 3]) await db.insert('chain_blocks', { number: String(n), block: String(n), hash: hash(n), parent_hash: hash(n - 1), ts: new Date(epoch + n * 1000) });
      // Block 4 is known only from an indexed transfer until its header is stored.
      await db.insert('token_transfers', { ts: new Date(epoch + 4000), block: '4', tx_hash: hash(400), log_index: 0, token: sample, from_address: sample, to_address: sample, amount: '1', kind: 'Transfer' });
      const rows = async () => (await db.sql.query<{ number: string; version: string; source: string; hash: Uint8Array | null }>(
        'SELECT number::text, xmin::text AS version, source, hash FROM engine_block_times ORDER BY number')).rows;
      await refreshClock(db);
      const first = await rows();
      expect(first.map(r => [r.number, r.source])).toEqual([['1', 'head'], ['2', 'head'], ['3', 'head'], ['4', 'activity']]);
      // A second poll leaves every unchanged row version in place.
      await refreshClock(db);
      expect(await rows()).toEqual(first);
      // A replaced header and a newly stored header are still written.
      await db.sql.query('UPDATE chain_blocks SET hash=$1 WHERE number=3', [hash(33)]);
      await db.insert('chain_blocks', { number: '4', block: '4', hash: hash(4), parent_hash: hash(33), ts: new Date(epoch + 4000) });
      await refreshClock(db);
      const after = await rows();
      expect(after.slice(0, 2)).toEqual(first.slice(0, 2));
      expect(after.slice(2).map(r => [r.number, r.source, Buffer.from(r.hash!).toString('hex')])).toEqual([
        ['3', 'head', Buffer.from(hash(33)).toString('hex')], ['4', 'head', Buffer.from(hash(4)).toString('hex')]]);
      expect(after[2]!.version).not.toBe(first[2]!.version);
    } finally { await db.close(); }
  });
});
