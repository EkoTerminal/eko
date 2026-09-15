import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { binary, openDb, migrate, migrateEngines } from '../src/index.js';
import type { ChainDb } from '../src/index.js';

// Main's migration ledgers at the merge boundary. Use the actual retained SQL,
// not a synthetic schema, to exercise upgrades from a fully migrated main DB.
const mainIndexer = ['0101_chain','0102_market','0103_range_errors','0110_rpc_usage','0111_pending_senders','0112_pending_pricing','0117_pons_progress'];
const mainEngines = ['0104_engines','0105_engine_activity','0106_engine_rules_versions','0107_engine_pons_static','0108_engine_query_indexes','0113_v1_reads','0114_batched_read_models'];
const mergedIndexer = [...mainIndexer.slice(0,-1),'0115_guard_sources','0117_pons_progress','0136_wallet_protocol'];
const mergedEngines = [...mainEngines,'0116_guard_revisions','0118_guard_receipts','0119_guard_shadow','0120_receipt_outbox','0121_v3_reference_simulation','0122_private_receipts','0123_receipt_committer','0124_signal_shadow','0134_directional_depth','0135_scan_jobs'];
async function applyMain(db: ChainDb) {
  for(const [ledger,ids] of [['eko_indexer_migrations',mainIndexer],['eko_engine_migrations',mainEngines]] as const) {
    await db.sql.query(`CREATE TABLE ${ledger}(id text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now())`);
    for(const id of ids) {
      const sql=await readFile(new URL(`../drizzle/${id}.sql`,import.meta.url),'utf8');
      const statements=['0113_v1_reads','0114_batched_read_models'].includes(id)
        ? sql.split('-- statement-breakpoint').flatMap(s=>s.includes('CREATE FUNCTION')?[s]:s.split(';')) : sql.split(';');
      for(const statement of statements.map(s=>s.trim()).filter(Boolean))await db.sql.query(statement);
      await db.sql.query(`INSERT INTO ${ledger}(id) VALUES($1)`,[id]);
    }
  }
}
async function assertMerged(db: ChainDb) {
  expect((await db.sql.query("SELECT tablename FROM pg_tables WHERE tablename IN ('scan_jobs','scan_timings')")).rows).toHaveLength(2);
  expect((await db.sql.query("SELECT tgname FROM pg_trigger WHERE tgname IN ('scan_launch_discovery','scan_pair_discovery')")).rows).toHaveLength(2);
  expect((await db.sql.query("SELECT tablename FROM pg_tables WHERE tablename='directional_depth_runs'")).rows).toHaveLength(1);
  expect((await db.sql.query("SELECT tablename FROM pg_tables WHERE tablename='signal_shadow_runs'")).rows).toHaveLength(1);
  expect((await db.sql.query("SELECT tablename FROM pg_tables WHERE tablename IN ('receipt_worker_lease','receipt_commit_attempts','receipt_commit_failures','receipt_commit_anchors','receipt_commit_anchor_events')")).rows).toHaveLength(5);
  expect((await db.sql.query('SELECT * FROM receipt_commit_health')).rows).toHaveLength(1);
  expect((await db.sql.query<{id:string}>('SELECT id FROM eko_indexer_migrations ORDER BY id')).rows.map(r=>r.id)).toEqual(mergedIndexer);
  expect((await db.sql.query<{id:string}>('SELECT id FROM eko_engine_migrations ORDER BY id')).rows.map(r=>r.id)).toEqual(mergedEngines);
  expect((await db.sql.query("SELECT tablename FROM pg_tables WHERE tablename='sim_runs'")).rows).toHaveLength(1);
  expect((await db.sql.query("SELECT indexname FROM pg_indexes WHERE indexname='pons_events_token_block'")).rows).toHaveLength(1);
  expect((await db.sql.query("SELECT tablename FROM pg_tables WHERE tablename IN ('guard_availability','guard_verdict_revisions','guard_receipt_payloads','guard_shadow_runs')")).rows).toHaveLength(4);
}
describe('main and Guard migration union',()=>{
  it('applies all migrations on a fresh DB, then replays idempotently',async()=>{
    const db=await openDb({pgliteDir:':memory:'});
    try {
      await migrate(db);await migrateEngines(db);await assertMerged(db);
      await migrate(db);await migrateEngines(db);await assertMerged(db);
    }finally{await db.close();}
  });
  it('upgrades a main-migrated DB without replaying its migrations or losing launch/verdict data',async()=>{
    const db=await openDb({pgliteDir:':memory:'});
    try {
      await applyMain(db);
      const coin=binary(`0x${'ab'.repeat(20)}`),txHash=binary(`0x${'cd'.repeat(32)}`),data={kind:'launch',graduationThreshold:'1000',creatorTaxBps:250};
      await db.sql.query('INSERT INTO pons_events(block,tx_hash,log_index,token,emitter,kind,data) VALUES(1,$1,0,$2,$2,$3,$4)',[txHash,coin,'launch',JSON.stringify(data)]);
      await db.sql.query("INSERT INTO verdicts(id,coin,valid_from_block,rules_version,signature,data) VALUES('main-fixture',$1,1,'1.0.2','fixture','{}')",[coin]);
      const before=(await db.sql.query('SELECT * FROM eko_indexer_migrations ORDER BY id')).rows;
      await migrate(db);await migrateEngines(db);await assertMerged(db);
      expect((await db.sql.query<{data:unknown}>('SELECT data FROM pons_events')).rows[0].data).toEqual(data);
      expect((await db.sql.query("SELECT id FROM verdicts WHERE id='main-fixture'")).rows).toHaveLength(1);
      const after=(await db.sql.query('SELECT * FROM eko_indexer_migrations WHERE id NOT IN ($1,$2) ORDER BY id',['0115_guard_sources','0136_wallet_protocol'])).rows;
      expect(after).toEqual(before);
      await migrate(db);await migrateEngines(db);await assertMerged(db);
    }finally{await db.close();}
  });
  it('renumbers a pre-merge Guard ledger while retaining the immutable journal',async()=>{
    const db=await openDb({pgliteDir:':memory:'});
    try {
      await migrate(db);await migrateEngines(db);
      const id=`0x${'de'.repeat(32)}`,coin=`0x${'ab'.repeat(20)}`;
      await db.sql.query("INSERT INTO verdicts(id,coin,valid_from_block,rules_version,signature,data) VALUES('guard-fixture',$1,1,'1.0.2','fixture','{}')",[binary(coin)]);
      await db.sql.query("INSERT INTO guard_shadow_runs(id,coin,block,legacy_verdict_id,status,data,recorded_at) VALUES($1,$2,1,'guard-fixture','missing_cursor','{}',now())",[id,coin]);
      const before=(await db.sql.query('SELECT * FROM guard_shadow_runs')).rows;
      await db.sql.query('UPDATE eko_engine_migrations SET id=$1 WHERE id=$2',[['0117','guard_shadow'].join('_'),'0119_guard_shadow']);
      await migrate(db);await migrateEngines(db);await assertMerged(db);
      expect((await db.sql.query('SELECT * FROM guard_shadow_runs')).rows).toEqual(before);
      await expect(db.sql.query('DELETE FROM guard_shadow_runs')).rejects.toThrow('append-only');
    }finally{await db.close();}
  });
});
