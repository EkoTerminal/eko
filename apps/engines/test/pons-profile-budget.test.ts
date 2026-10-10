import { afterEach, describe, expect, it } from 'vitest';
import { binary, migrate, migrateEngines, openDb, type ChainDb } from '@eko/db';
import { RpcGuardError, type PonsProfileClient } from '@eko/chain';
import type { Address } from '@eko/shared';
import { ponsProfiles } from '../src/pons-profile.js';

// A spent daily paid budget must not stop the scanner: the restart's cold refresh met the same spent budget, so the
// process restarted all night without rating anything. The checkpoint's getters stay unknown instead.
const coin = `0x${'a1'.repeat(20)}` as Address, curve = `0x${'c1'.repeat(20)}` as Address, hash = new Uint8Array(32).fill(7);
const handles: ChainDb[] = [];
afterEach(async () => { await Promise.all(handles.splice(0).map(db => db.close())); });
async function database() {
  const db = await openDb({ pgliteDir: ':memory:' }); handles.push(db);
  await migrate(db); await migrateEngines(db);
  return db;
}
const failing = (code: RpcGuardError['code']): PonsProfileClient => ({
  getCode: async () => { throw new RpcGuardError(code); }, readContract: async () => { throw new RpcGuardError(code); },
});

describe('Pons profile reads without paid budget', () => {
  it('leaves the checkpoint unknown and unstored when the daily budget is spent', async () => {
    const db = await database();
    await expect(ponsProfiles(db).read(coin, curve, 10, hash, failing('rpc_budget_exhausted'))).resolves.toBeUndefined();
    expect((await db.sql.query('SELECT 1 FROM engine_reads WHERE coin=$1', [binary(coin)])).rows).toHaveLength(0);
  });
  it('still stops on a session budget or shutdown', async () => {
    const db = await database();
    await expect(ponsProfiles(db).read(coin, curve, 11, hash, failing('rpc_session_budget_reached'))).rejects.toMatchObject({ code: 'rpc_session_budget_reached' });
  });
});
