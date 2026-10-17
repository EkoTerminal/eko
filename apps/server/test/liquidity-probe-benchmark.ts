/** Offline index-plan proof: pnpm --filter @eko/server exec node --import tsx test/liquidity-probe-benchmark.ts */
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { binary, migrate, migrateEngines } from '@eko/db';
import { openDb } from '../../../packages/db/test/helpers/historical-db.js';
import { LIQUIDITY_PRICE_SQL, prepareLiquidityModels } from '../src/read/liquidity-model.js';

const db=await openDb({pgliteDir:':memory:'}),now=Date.parse('2026-10-17T12:00:00Z');
try {
  await migrate(db);await migrateEngines(db);await db.ensurePartitions(new Date(now));
  await db.sql.query(`INSERT INTO tokens(address,deployer,name,symbol,first_block,block,launchpad)
    SELECT decode(lpad(to_hex(n),40,'0'),'hex'),decode(lpad(to_hex(999999),40,'0'),'hex'),'Sample coin','DEMO',1,1,'other' FROM generate_series(1,30000) n`);
  // Two pools per hot coin. One stopped trading 500 swaps ago, exercising the ordered pool filter.
  await db.sql.query(`INSERT INTO swaps(ts,block,tx_hash,log_index,venue,pool_id,coin,quote_asset,side,amount_coin,amount_quote,usd)
    SELECT to_timestamp($1::double precision),b,decode(lpad(to_hex(c*10000+b),64,'0'),'hex'),0,'uniswap_v4',
      decode(lpad(to_hex(c*2+CASE WHEN b>500 THEN 1 ELSE 0 END),64,'0'),'hex'),decode(lpad(to_hex(c),40,'0'),'hex'),decode(repeat('00',20),'hex'),1,100,400,8
    FROM generate_series(1,100) c CROSS JOIN generate_series(1,1000) b`,[now/1000]);
  for(const t of ['tokens','swaps'])await db.sql.query(`ANALYZE ${t}`);
  const keys=Array.from({length:200},(_,i)=>({coin:`0x${(Math.floor(i/2)+1).toString(16).padStart(40,'0')}`,pool:`0x${(2*(Math.floor(i/2)+1)+i%2).toString(16).padStart(64,'0')}`}));
  const explain=(await db.sql.query<{'QUERY PLAN':{Plan:Record<string,unknown>;'Execution Time':number}[]}>('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) '+LIQUIDITY_PRICE_SQL,[JSON.stringify(keys)])).rows[0]['QUERY PLAN'][0];
  const walk=(n:Record<string,unknown>):Record<string,unknown>[]=>[n,...((n.Plans ?? []) as Record<string,unknown>[]).flatMap(walk)];
  const nodes=walk(explain.Plan);
  assert(!nodes.some(n=>n['Node Type']==='Seq Scan'),'probe must never sequentially scan swaps');
  assert(!nodes.some(n=>n['Node Type']==='Sort' || n['Node Type']==='Incremental Sort'),'probe must preserve index order without sorting history');
  const scans=nodes.filter(n=>String(n['Relation Name']).startsWith('swaps'));
  assert(scans.some(n=>String(n['Index Name']).includes('coin') && n['Actual Loops']===200));
  assert(scans.every(n=>String(n['Index Cond']).includes('coin')));
  const rows=(await db.sql.query<{coin:string;pool:string;trade:{block:string}}>(LIQUIDITY_PRICE_SQL,[JSON.stringify(keys)])).rows;
  assert.equal(rows.length,200);for(const r of rows)assert.equal(Number(r.trade.block),Number(BigInt(r.pool))%2 ? 1000 : 500);
  // The same 200 keys are two statements through the default production cap of 100.
  const query=db.sql.query.bind(db.sql),sizes:number[]=[];
  await db.sql.query(`INSERT INTO pools(id,currency0,currency1,venue,fee,tick_spacing,created_block,block)
    SELECT decode(substring(v->>'pool' FROM 3),'hex'),decode(substring(v->>'coin' FROM 3),'hex'),decode(repeat('00',20),'hex'),'uniswap_v4',3000,60,1,1 FROM jsonb_array_elements($1::jsonb) v`,[JSON.stringify(keys)]);
  db.sql.query=async<T>(sql:string,params?:unknown[])=>{if(sql===LIQUIDITY_PRICE_SQL)sizes.push((JSON.parse(String(params![0])) as unknown[]).length);return query<T>(sql,params);};
  await prepareLiquidityModels(db,keys.filter((_,i)=>i%2===0).map(k=>k.coin as `0x${string}`),now);
  assert.deepEqual(sizes,[100,100]);
  const report={runtime:'PGlite',coins:30000,swaps:100000,keys:200,defaultStatements:sizes,executionMs:explain['Execution Time'],nodes:nodes.map(n=>({node:n['Node Type'],relation:n['Relation Name'],index:n['Index Name'],condition:n['Index Cond'],rows:n['Actual Rows'],loops:n['Actual Loops'],removed:n['Rows Removed by Filter']}))};
  await writeFile(new URL('./liquidity-probe-benchmark-result.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.info('liquidity_probe_plan',JSON.stringify(report));
} finally {await db.close();}
