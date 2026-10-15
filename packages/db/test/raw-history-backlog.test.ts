import { afterEach, expect, it } from 'vitest';
import { ChainDb, migrate, openDb } from '../src/client.js';
import { migrateEngines } from '../src/engines-migrate.js';
import { runRetention } from '../src/retention.js';
import { sealRawPartition } from '../src/raw-partitions.js';
let db:ChainDb;
afterEach(async()=>{await db?.close();});
async function fixture() {
 db=await openDb({pgliteDir:':memory:'});await migrate(db);await migrateEngines(db);
 const ts=new Date('2026-09-01T00:00:00Z');await db.ensurePartitions(ts);
 await db.insert('token_transfers',{ts,block:1,tx_hash:Buffer.alloc(32,1),log_index:0,token:Buffer.alloc(20,1),from_address:Buffer.alloc(20),to_address:Buffer.alloc(20,2),amount:'10'});
 return db;
}
const options={quoteTokens:[],swapDays:7,transferDays:3,dryRun:false,now:()=>Date.parse('2026-09-20T00:00:00Z')};
it('excludes a second owner through the existing mutex, without changing data',async()=>{
 const queries:string[]=[];
 const sql={query:async(text:string)=>{queries.push(text);return {rows:[{acquired:false}]};}};
 const handle=new ChainDb(sql as never,async work=>work(sql as never));
 const result=await runRetention(handle,options);
 expect(result.skippedRules).toEqual(['raw_partitions']);
 expect(queries).toEqual(['SELECT pg_try_advisory_lock(4663,208) AS acquired']);
});
it('dry run does not fence, seal, detach, drop or set a cursor',async()=>{
 await fixture();const before=await db.sql.query('SELECT * FROM raw_history_watermarks ORDER BY name');
 const result=await runRetention(db,{...options,dryRun:true});expect(result.tables?.length).toBeGreaterThan(0);
 expect(await db.sql.query('SELECT * FROM raw_history_watermarks ORDER BY name')).toEqual(before);
 expect((await db.sql.query('SELECT * FROM raw_history_seals')).rows).toHaveLength(0);
 expect((await db.sql.query('SELECT * FROM token_transfers')).rows).toHaveLength(1);
});
it('seals before detach/drop, advances the watermark last, uses dedicated unlimited maintenance and bounded DDL',async()=>{
 await fixture();const events:string[]=[],transact=db.tx.bind(db);
 db.tx=work=>transact(async tx=>{
  const query=tx.sql.query.bind(tx.sql);
  tx.sql.query=(async(sql:string,params?:unknown[])=>{events.push(sql);return query(sql,params);}) as typeof tx.sql.query;
  return work(tx);
 });
 const result=await runRetention(db,options);
 const baseline=events.findIndex(q=>q.startsWith('INSERT INTO transfer_baselines'));
 const marked=events.findIndex((q,i)=>i>baseline && q.startsWith('UPDATE raw_history_seals SET sealed=true'));
 const detach=events.findIndex(q=>q==='ALTER TABLE token_transfers DETACH PARTITION token_transfers_d2026_09_01');
 const drop=events.findIndex(q=>q==='DROP TABLE IF EXISTS token_transfers_d2026_09_01');
 const watermark=events.findIndex((q,i)=>i>drop && q.startsWith('UPDATE raw_history_watermarks'));
 expect(marked).toBeGreaterThanOrEqual(0);expect(detach).toBeGreaterThan(marked);expect(drop).toBeGreaterThan(detach);expect(watermark).toBeGreaterThan(drop);
 expect(events).toContain('SET LOCAL statement_timeout=0');expect(events).toContain("SET LOCAL lock_timeout='5s'");
 expect(result.partitions?.find(p=>p.partition==='token_transfers_d2026_09_01')?.rows).toBe(1);
 expect((await db.sql.query("SELECT through_block FROM raw_history_watermarks WHERE name='token_transfers'")).rows).toEqual([{through_block:1}]);
});
it('a lock conflict retains the sealed partition and retries without adding its balances twice',async()=>{
 await fixture();const transact=db.tx.bind(db);let blocked=true;
 db.tx=work=>transact(async tx=>{
  const query=tx.sql.query.bind(tx.sql);
  tx.sql.query=(async(sql:string,params?:unknown[])=>{
   if(blocked && sql==='ALTER TABLE token_transfers DETACH PARTITION token_transfers_d2026_09_01')throw Object.assign(new Error('lock'),{code:'55P03'});
   return query(sql,params);
  }) as typeof tx.sql.query;return work(tx);
 });
 expect((await runRetention(db,options)).skippedRules).toContain('token_transfers_d2026_09_01');
 expect((await db.sql.query("SELECT through_block FROM raw_history_watermarks WHERE name='token_transfers'")).rows).toEqual([{through_block:-1}]);
 blocked=false;await runRetention(db,options);
 expect((await db.sql.query('SELECT amount FROM transfer_baselines WHERE holder=$1',[Buffer.alloc(20,2)])).rows).toEqual([{amount:'10'}]);
});
it('range fences reject late inserts and mutations after seal, before detach and the block watermark',async()=>{
 await fixture();await sealRawPartition(db,'token_transfers','token_transfers_d2026_09_01');
 await expect(db.insert('token_transfers',{ts:new Date('2026-09-01T01:00:00Z'),block:2,tx_hash:Buffer.alloc(32,3),log_index:0,token:Buffer.alloc(20,1),from_address:Buffer.alloc(20),to_address:Buffer.alloc(20,2),amount:'1'})).rejects.toThrow('compacted raw history');
 await expect(db.sql.query('UPDATE token_transfers SET amount=11 WHERE block=1')).rejects.toThrow('sealed raw history');
 expect((await db.sql.query('SELECT amount FROM token_transfers')).rows).toEqual([{amount:'10'}]);
});
it('recovers a crash after detach and after drop, before watermark advance',async()=>{
 await fixture();await sealRawPartition(db,'token_transfers','token_transfers_d2026_09_01');
 await db.sql.query('ALTER TABLE token_transfers DETACH PARTITION token_transfers_d2026_09_01');
 await runRetention(db,options);
 expect((await db.sql.query("SELECT to_regclass('token_transfers_d2026_09_01') AS p")).rows).toEqual([{p:null}]);
 await db.sql.query("UPDATE raw_history_watermarks SET through_block=-1 WHERE name='token_transfers'");
 await runRetention(db,options);
 expect((await db.sql.query("SELECT through_block FROM raw_history_watermarks WHERE name='token_transfers'")).rows).toEqual([{through_block:1}]);
});
