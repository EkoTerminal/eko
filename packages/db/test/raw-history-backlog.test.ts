import { afterEach, expect, it } from 'vitest';
import { ChainDb, migrate, openDb } from '../src/client.js';
import { migrateEngines } from '../src/engines-migrate.js';
import { parseBacklogOptions, runRawHistoryBacklog, type BacklogProgress } from '../src/raw-history-backlog.js';
import { runRetention } from '../src/retention.js';
const epoch=Date.parse('2026-10-01T00:00:00Z'),now=epoch+20*86400000;
const options={...parseBacklogOptions([]),batchRows:2,pauseMs:0};
const bytes=(n:number,size=20)=>Buffer.alloc(size,n);
let db:ChainDb|undefined;
afterEach(async()=>{await db?.close();db=undefined;});
async function fixture() {
  const handle=await openDb({pgliteDir:':memory:'});db=handle;
  await migrate(handle);await migrateEngines(handle);await handle.ensurePartitions(new Date(epoch));
  for(const [block,day] of [[1,0],[2,1],[3,2],[4,8],[5,12],[6,16],[7,20]]) {
    await handle.insert('chain_blocks',{number:block,block,hash:bytes(block!,32),parent_hash:bytes(0,32),ts:new Date(epoch+day!*86400000)});
  }
  await handle.insert('tokens',{address:bytes(1),first_block:1,block:1,decimals:0,deployer:bytes(3)});
  // No pool FK on the configured reference sources; the source set controls baseline preservation.
  await handle.sql.query("INSERT INTO pools(id,venue,currency0,currency1,created_block,block,fee,tick_spacing) VALUES($1,'uniswap_v3',$2,$3,1,1,3000,60)",[bytes(2),bytes(1),bytes(4)]);
  await handle.sql.query("INSERT INTO eth_usd_reference_sources(block,pool_id,venue,fee) VALUES(1,$1,'uniswap_v3',3000)",[bytes(2)]);
  for(let i=0;i<5;i++) {
    await handle.insert('swaps',{ts:new Date(epoch+i*1000),block:1,tx_hash:bytes(i,32),log_index:i,venue:'uniswap_v3',pool_id:bytes(2),coin:bytes(1),quote_asset:bytes(4),side:1,amount_coin:'10',amount_quote:'5',price_quote:i+1,usd:10});
    await handle.insert('token_transfers',{ts:new Date(epoch+i*1000),block:1,tx_hash:bytes(i,32),log_index:i,token:bytes(1),from_address:bytes(0),to_address:bytes(3),amount:'10'});
  }
  return handle;
}
it('parses explicit settings and rejects invalid or unknown flags',()=>{
  expect(parseBacklogOptions([])).toEqual({statementMs:60000,batchRows:2000,pauseMs:50,dryRun:false});
  expect(parseBacklogOptions(['--statement-timeout-ms','90000','--batch-rows','500','--pause-ms','0','--dry-run'])).toEqual({statementMs:90000,batchRows:500,pauseMs:0,dryRun:true});
  for(const args of [['--other'],['--batch-rows','0'],['--pause-ms','-1'],['--statement-timeout-ms'],['--batch-rows','1.5']])expect(()=>parseBacklogOptions(args)).toThrow();
});
it('dry run counts exact eligible rows without summaries, fences, cursor writes or deletes',async()=>{
  const handle=await fixture(),events:BacklogProgress[]=[];
  const before=await handle.sql.query('SELECT * FROM raw_history_watermarks ORDER BY name');
  await runRawHistoryBacklog(handle,{...options,dryRun:true},{now:()=>now,report:e=>events.push(e)});
  expect(events.map(e=>[e.event,e.rule,e.rows])).toEqual([['dry_run','raw_swaps',5],['dry_run','raw_transfers',5]]);
  expect(await handle.sql.query('SELECT * FROM raw_history_watermarks ORDER BY name')).toEqual(before);
  expect((await handle.sql.query('SELECT * FROM coin_lifetime')).rows).toHaveLength(0);
  expect((await handle.sql.query('SELECT after_block FROM raw_history_progress')).rows).toEqual([{after_block:-1},{after_block:-1}]);
});
it('commits a partial block, stops, resumes without double counting, and allows fresh indexer inserts',async()=>{
  const handle=await fixture(),events:BacklogProgress[]=[];let stopped=false;
  await runRawHistoryBacklog(handle,options,{now:()=>now,stopped:()=>stopped,report:e=>{events.push(e);if(e.event==='batch' && e.rows)stopped=true;}});
  expect(events.at(-1)?.event).toBe('stopped');expect(events.at(-1)?.totalRows).toBe(2);
  expect((await handle.sql.query('SELECT count(*)::int AS n FROM swaps')).rows).toEqual([{n:3}]);
  await handle.insert('token_transfers',{ts:new Date(now),block:7,tx_hash:bytes(99,32),log_index:0,token:bytes(1),from_address:bytes(0),to_address:bytes(3),amount:'1'});
  events.length=0;
  await runRawHistoryBacklog(handle,options,{now:()=>now,report:e=>events.push(e)});
  expect(events.at(-1)).toMatchObject({event:'complete',totalRows:8});
  expect(events.filter(e=>e.rows).map(e=>e.rows)).toEqual([2,1,2,2,1]);
  expect(events.filter(e=>e.event==='batch').every(e=>typeof e.rowsPerMinute==='number' && e.throughBlock==='1')).toBe(true);
  expect((await handle.sql.query('SELECT amount FROM transfer_baselines WHERE holder=$1',[bytes(3)])).rows).toEqual([{amount:'50'}]);
  expect((await handle.sql.query('SELECT block,log_index,price_quote FROM reference_price_baselines')).rows).toEqual([{block:1,log_index:4,price_quote:5}]);
  expect((await handle.sql.query('SELECT * FROM token_transfers')).rows).toHaveLength(1);
});
it('does no raw work when the session mutex is held by another owner',async()=>{
  const queries:string[]=[];
  const sql={query:async(text:string)=>{queries.push(text);return {rows:[{acquired:false}]};}};
  const handle=new ChainDb(sql as never,async work=>work(sql as never));
  await expect(runRawHistoryBacklog(handle,options,{report:()=>{}})).rejects.toThrow('mutex is busy');
  expect(queries).toEqual(['SELECT pg_try_advisory_lock(4663,208) AS acquired']);
});
it('the in-process worker skips both raw rules when the same advisory mutex is busy',async()=>{
  const queries:string[]=[];
  const sql={query:async(text:string)=>{queries.push(text);return {rows:text.includes('AS n FROM chain_blocks')?[{n:'1'}]:text.includes('pg_try_advisory_xact_lock')?[{acquired:false}]:[]};}};
  const handle=new ChainDb(sql as never,async work=>work(sql as never));
  const result=await runRetention(handle,{quoteTokens:[],swapDays:7,transferDays:3,dryRun:false});
  expect(result.skippedRules).toEqual(['raw_swaps','raw_transfers']);
  expect(queries.some(q=>/UPDATE raw_history|DELETE FROM/.test(q))).toBe(false);
});
it('shrinks only after a failed statement and releases the mutex after failure',async()=>{
  const handle=await fixture(),events:BacklogProgress[]=[],statements:string[]=[];
  const query=handle.sql.query.bind(handle.sql),transact=handle.tx.bind(handle);let failures=1,alwaysFail=false;
  handle.sql.query=(async(text:string,params?:unknown[])=>{statements.push(text);return query(text,params);}) as typeof handle.sql.query;
  handle.tx=work=>transact(async tx=>{
    const execute=tx.sql.query.bind(tx.sql);
    tx.sql.query=(async(text:string,params?:unknown[])=>{
      statements.push(text);
      if(text.startsWith('SELECT number::text AS n') && (alwaysFail || failures-->0))throw Object.assign(new Error('timeout'),{code:'57014'});
      return execute(text,params);
    }) as typeof tx.sql.query;
    return work(tx);
  });
  await runRawHistoryBacklog(handle,options,{now:()=>now,report:e=>events.push(e)});
  expect(events.find(e=>e.event==='retry')).toMatchObject({code:'57014',batchRows:1});
  expect(events.filter(e=>e.event==='batch' && e.rule==='raw_swaps' && e.rows).map(e=>e.rows)).toEqual([1,1,1,1,1]);
  expect(statements).toContain("SET LOCAL statement_timeout='60000ms'");
  expect(statements.at(-1)).toBe('SELECT pg_advisory_unlock(4663,208)');
  alwaysFail=true;
  await expect(runRawHistoryBacklog(handle,{...options,batchRows:1},{now:()=>now,report:()=>{}})).rejects.toThrow('cannot progress');
  expect(statements.at(-1)).toBe('SELECT pg_advisory_unlock(4663,208)');
});
