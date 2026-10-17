import { describe, expect, it } from 'vitest';
import { canonicalize, createGuardReceiptCodec } from '@eko/shared';
import { concat, encodeAbiParameters, keccak256, stringToHex } from 'viem';
import { binary, ChainDb, migrate, migrateEngines, runRetention, type SqlClient } from '../src/index.js';
import { receiptSelection, ratingRetention } from '../src/rating-retention.js';
import { retentionDb } from '../src/retention-control.js';
import { openDb } from './helpers/historical-db.js';

const coin=`0x${'ab'.repeat(20)}` as const, other=`0x${'cd'.repeat(20)}` as const;
const old=new Date('2026-10-01T00:00:00Z'),now=Date.parse('2026-10-17T00:00:00Z');
const codec=createGuardReceiptCodec({concat,encodeAbiParameters,keccak256,stringToHex});
function publication(id:string,address:string=coin,recordedAt=old,kind:'verdict'|'forecast'='verdict',producer='engines') {
  const data={schemaVersion:'public-receipt-1',canonicalization:'jcs-rfc8785/v1',receiptId:id,revisionId:id,kind,chainId:4663,coin:address,
    recordedAt:recordedAt.toISOString(),modelIds:[],personaSetVersion:null,cardSchemaVersion:'fixture-card',rulesVersion:'1.0.0',outputSchemaVersion:'verdict-1',
    snapshotHash:codec.hash({fixture:true}),deterministicInput:{fixture:true},decision:{level:'clear'},
    window:{kind:'snapshot',blockNumber:1,blockHash:`0x${'ab'.repeat(32)}`},supersedes:null,reorgOf:null};
  return {id,producer,kind,chain_id:4663,revision_id:id,payload_hash:codec.hash(data),canonical_payload:canonicalize(data),data,recorded_at:recordedAt};
}
async function insert(db:ChainDb,rows:ReturnType<typeof publication>[]) {
  await db.sql.query(`INSERT INTO receipt_publications(id,producer,kind,chain_id,revision_id,payload_hash,canonical_payload,data,recorded_at)
    SELECT id,producer,kind,chain_id,revision_id,payload_hash,canonical_payload,data,recorded_at
    FROM jsonb_populate_recordset(NULL::receipt_publications,$1::jsonb)`,[JSON.stringify(rows)]);
}
describe('retention batch plans and throughput',()=>{
  it('strips thousands in one pass with indexed newest-sequence probes and unchanged eligibility',async()=>{
    const db=await openDb({pgliteDir:':memory:'});
    try {
      await migrate(db);await migrateEngines(db);
      const backlog=Array.from({length:2048},(_,n)=>publication(`sample-${n.toString().padStart(4,'0')}`));
      await insert(db,[...backlog,publication('sample-latest'),publication('sample-recent',coin,new Date(now)),
        publication('sample-other',other),publication('sample-forecast',other,old,'forecast'),publication('sample-producer',other,old,'verdict','other')]);
      await db.sql.query("INSERT INTO coin_cards VALUES('sample-card',$1,1,'fixture','{}','1.0.0')",[binary(coin)]);
      await db.sql.query("INSERT INTO coin_card_latest VALUES($1,'sample-card',1,$2)",[binary(coin),{verdict:{receipt:{id:'sample-0000'}}}]);
      await db.sql.query('ANALYZE receipt_publications');
      const plan=await retentionDb(db).sql.query(`EXPLAIN ${receiptSelection} AND p.id=ANY($2::text[])`,[new Date(now-7*86400000),backlog.slice(0,64).map(r=>r.id)]);
      const text=JSON.stringify(plan.rows);
      expect(text).toContain('receipt_publications_live_coin_sequence');expect(text).toContain('Index Cond:');expect(text).not.toContain('Seq Scan');
      const started=performance.now();
      const result=await runRetention(db,{quoteTokens:[],ratingDays:7,dryRun:false,pauseMs:0,now:()=>now+performance.now()-started});
      console.info('receipt stripping fixture',{rows:result.ratingRows?.receipt_publications,elapsedMs:Math.round(performance.now()-started)});
      expect(result.ratingRows?.receipt_publications).toBe(2048);
      expect(result.skippedRules).toEqual([]);
      const kept=(await db.sql.query<{id:string}>('SELECT id FROM receipt_publications WHERE data IS NOT NULL ORDER BY id')).rows.map(r=>r.id);
      expect(kept).toEqual(['sample-0000','sample-forecast','sample-other','sample-producer','sample-recent']);
      expect((await db.sql.query("SELECT canonical_payload,summary->>'coin' AS coin FROM receipt_publications WHERE id='sample-0001'")).rows).toEqual([{canonical_payload:null,coin}]);
    }finally{await db.close();}
  });
  it('refuses corrupt payloads before stripping',async()=>{
    const db=await openDb({pgliteDir:':memory:'});
    try {
      await migrate(db);await migrateEngines(db);
      await insert(db,[{...publication('sample-corrupt'),canonical_payload:'{}'},publication('sample-newest')]);
      await expect(runRetention(db,{quoteTokens:[],ratingDays:7,dryRun:false,pauseMs:0,now:()=>now})).rejects.toThrow('integrity failure');
      expect((await db.sql.query('SELECT id FROM receipt_publications WHERE data IS NULL')).rows).toEqual([]);
    }finally{await db.close();}
  });
  it('bounds fingerprint eligibility and both sides of its delete by the primary-key window',async()=>{
    const db=await openDb({pgliteDir:':memory:'});
    try {
      await migrate(db);await migrateEngines(db);
      await db.sql.query("INSERT INTO engine_block_times VALUES(1,$1,NULL,'head')",[old]);
      await db.sql.query(`INSERT INTO wallet_fingerprint_runs SELECT 'sample-run-'||lpad(n::text,5,'0'),$1,1,$2,'fixture-model',n::text,'{}',0.5 FROM generate_series(1,20000) n`,[binary(coin),binary(`0x${'ab'.repeat(32)}`)]);
      await db.sql.query(`INSERT INTO wallet_fingerprint_dependencies SELECT id,1,block_hash FROM wallet_fingerprint_runs`);
      await db.sql.query('ANALYZE wallet_fingerprint_dependencies');
      const plans:string[]=[];
      const wrap=(sql:SqlClient):SqlClient=>({query:async <T>(text:string,params?:unknown[])=>{
        if(text.startsWith('SELECT x.run_id,x.block FROM wallet_fingerprint_dependencies') || text.includes('gone AS (DELETE FROM wallet_fingerprint_dependencies')) {
          const plan=JSON.stringify((await sql.query(`EXPLAIN ${text}`,params)).rows);plans.push(plan);
          expect(plan).not.toContain('Seq Scan on wallet_fingerprint_dependencies');
          expect(plan).toContain('wallet_fingerprint_dependencies_pkey');
          expect(plan).toContain('Index Cond:');expect(plan).toContain('>=');expect(plan).toContain('<=');
        }
        return sql.query<T>(text,params);
      }});
      const traced=new ChainDb(wrap(db.sql),work=>db.tx(tx=>work(wrap(tx.sql))));
      const result=await runRetention(db,{quoteTokens:[],dryRun:true});
      await ratingRetention(retentionDb(traced),{quoteTokens:[],dryRun:false,pauseMs:0},result,now,async(name,work)=>{
        if(name!=='wallet_fingerprint_dependencies')return;
        let batches=0;await work(()=>batches++===0,32);
      },new Map());
      expect(plans).toHaveLength(2);expect(result.ratingRows?.wallet_fingerprint_dependencies).toBe(32);
      expect((await db.sql.query('SELECT count(*)::integer AS n FROM wallet_fingerprint_dependencies')).rows).toEqual([{n:19968}]);
    }finally{await db.close();}
  });
});
