/** Offline full-handler benchmark: pnpm --filter @eko/server exec node --import tsx test/radar-benchmark.ts */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { ChainDb, binary } from '@eko/db';
import { refreshLiquidityModels } from '../src/read/liquidity-model.js';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { seedReadFixture } from './read-fixture.js';

const temporary:URL[]=[];
const now=Date.parse('2026-10-17T12:00:00Z');
const built=await buildApp(loadConfig({NODE_ENV:'test',PGLITE_DIR:':memory:',SESSION_SECRET:'test-placeholder'.repeat(3),LEGACY_API:'false',RUN_WORKER:'false',MARKET_DATA_SOURCE:'onchain'}),{startBackground:false});
try {
  const db=built.ctx.dbh.chain,store=built.ctx.reads.store;
  store.now=()=>now;
  const card=await seedReadFixture(db,now);
  const initial=Number((await db.sql.query<{n:string}>('SELECT count(*) n FROM tokens')).rows[0].n);
  await db.sql.query(`INSERT INTO tokens(address,deployer,name,symbol,first_block,block,total_supply,decimals,launchpad)
    SELECT decode(lpad(to_hex(100000+n),40,'0'),'hex'),decode(lpad(to_hex(999999),40,'0'),'hex'),'Sample coin','DEMO',1,1,1000,0,'other'
    FROM generate_series(1,$1::int) n`,[30000-initial]);
  const source=(await db.sql.query<{card_id:string}>('SELECT card_id FROM coin_card_latest LIMIT 1')).rows[0].card_id;
  // Real card shape and size on every candidate, rather than an empty JSON object that hides detoasting cost.
  await db.sql.query('ALTER TABLE coin_card_latest DISABLE TRIGGER read_card_change');
  await db.sql.query(`INSERT INTO coin_card_latest(coin,card_id,as_of_block,data)
    SELECT address,$1,1,jsonb_set($2::jsonb,'{identity,address}',to_jsonb('0x'||encode(address,'hex'))) FROM tokens
    WHERE address BETWEEN decode(lpad(to_hex(100001),40,'0'),'hex') AND decode(lpad(to_hex(130000),40,'0'),'hex')`,[source,JSON.stringify(card)]);
  await db.sql.query('ALTER TABLE coin_card_latest ENABLE TRIGGER read_card_change');
  await db.sql.query(`INSERT INTO bars_1m
    SELECT decode(lpad(to_hex(100000+c),40,'0'),'hex'),to_timestamp($1::double precision-m*60),1,1,1,1,c,1,1,1
    FROM generate_series(1,100) c CROSS JOIN generate_series(0,1439) m`,[now/1000]);
  // Seed maintained projections directly so fixture setup does not benchmark 30,000 ingest refreshes.
  await db.sql.query(`INSERT INTO read_coins(coin,tier,activity,first_block,pair_column,pair_block,launchpad,volume)
    SELECT address,2,to_timestamp($1),1,'new',1,launchpad,CASE WHEN address BETWEEN decode(lpad(to_hex(100001),40,'0'),'hex') AND decode(lpad(to_hex(100100),40,'0'),'hex') THEN 600000 ELSE 0 END
    FROM tokens ON CONFLICT(coin) DO UPDATE SET activity=excluded.activity,volume=excluded.volume`,[now/1000]);
  await db.sql.query('INSERT INTO read_coin_liquidity(coin,usd,unavailable) SELECT address,0,true FROM tokens ON CONFLICT DO NOTHING');
  await db.sql.query('DELETE FROM read_dirty');
  await db.sql.query('UPDATE read_rank_clock SET window_sec=$1',[Math.floor(now/60000)*60]);
  for(const table of ['tokens','coin_card_latest','bars_1m','read_coins','read_coin_liquidity'])await db.sql.query(`ANALYZE ${table}`);
  const statements:{sql:string;params:unknown[]}[]=[];
  const original=db.sql.query.bind(db.sql);
  db.sql.query=async<T>(sql:string,params?:unknown[])=>{statements.push({sql,params:params ?? []});return original<T>(sql,params);};
  // Load HEAD's read classes into task-local temporary modules for the same fixture and HTTP router.
  for(const name of ['store','radar','guard-store']) {
    const path=new URL(`../src/read/.radar-baseline-${name}.ts`,import.meta.url);temporary.push(path);
    await writeFile(path,execFileSync('git',['show',`HEAD:apps/server/src/read/${name}.ts`]));
  }
  const {ReadStore}=await import('../src/read/.radar-baseline-store.ts' as string);
  const {RadarService}=await import('../src/read/.radar-baseline-radar.ts' as string);
  const {GuardReadStore}=await import('../src/read/.radar-baseline-guard-store.ts' as string);
  const current={prototype:Object.getPrototypeOf(store),radar:built.ctx.reads.radar,guard:built.ctx.reads.guard};
  const prior={prototype:ReadStore.prototype,radar:new RadarService(store),guard:new GuardReadStore(store)};
  store.start(3_600_000);
  await store.refreshSummaries();
  const times={before:[] as number[],after:[] as number[]};
  const captured={before:[] as typeof statements,after:[] as typeof statements};
  // Alternate order to reduce warm-cache and host-load bias. No gates run concurrently with this script.
  const bodies:Partial<Record<'before'|'after',unknown>>={};
  for(let i=0;i<26;i++)for(const phase of (i%2?['after','before']:['before','after']) as ('before'|'after')[]) {
    const implementation=phase==='before'?prior:current;
    Object.setPrototypeOf(store,implementation.prototype);
    built.ctx.reads.radar=implementation.radar;built.ctx.reads.guard=implementation.guard;
    statements.length=0;
    const started=performance.now(),response=await built.app.inject('/v2/radar');
    const elapsed=performance.now()-started;
    assert.equal(response.statusCode,200);assert.equal(response.json().rows.length,100);
    bodies[phase]=response.json();
    if(bodies.before && bodies.after)assert.deepEqual(bodies.before,bodies.after);
    if(i>0)times[phase].push(elapsed);
    captured[phase]=[...statements];
  }
  Object.setPrototypeOf(store,current.prototype);
  built.ctx.reads.radar=current.radar;built.ctx.reads.guard=current.guard;
  const nodes=(node:Record<string,unknown>):Record<string,unknown>[]=>[node,...((node.Plans ?? []) as Record<string,unknown>[]).flatMap(nodes)];
  for(const phase of ['before','after'] as const)for(const s of captured[phase].filter(s=>s.sql.startsWith('WITH selected AS') || s.sql.includes('SELECT coin,tier,volume FROM read_coins'))) {
    const result=(await original<{'QUERY PLAN':{Plan:Record<string,unknown>;'Execution Time':number}[]}>('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) '+s.sql,s.params)).rows[0]['QUERY PLAN'][0];
    const plan=nodes(result.Plan);
    const selection=s.sql.includes('SELECT coin,tier,volume FROM read_coins');
    if(selection)assert(plan.some(n=>n['Index Name']==='read_coins_volume_rank'));
    else {
      if(phase==='after')for(const relation of ['tokens','read_coins','read_coin_liquidity','engine_block_times','chain_blocks']) {
        assert(plan.filter(n=>n['Relation Name']===relation).every(n=>Number(n['Actual Rows'])*Number(n['Actual Loops'])<=100));
      }
      const cards=plan.filter(n=>n['Relation Name']==='coin_card_latest');
      assert(cards.length>0);assert(cards.every(n=>Number(n['Actual Rows'])*Number(n['Actual Loops'])<=100));
      assert(plan.some(n=>n['Index Name']==='read_coin_liquidity_pkey'));
    }
    console.info('radar_plan',JSON.stringify({phase,query:selection?'selection':'details',ms:result['Execution Time'],nodes:plan.map(n=>({node:n['Node Type'],relation:n['Relation Name'],index:n['Index Name'],subplan:n['Subplan Name'],rows:n['Actual Rows'],loops:n['Actual Loops'],ms:n['Actual Total Time'],removed:n['Rows Removed by Filter']}))}));
  }
  const stats=(values:number[])=>{const sorted=values.toSorted((a,b)=>a-b);return {p50Ms:sorted[Math.floor(sorted.length/2)],p95Ms:sorted[Math.ceil(sorted.length*.95)-1]};};
  assert(!captured.after.some(s=>s.sql.includes('WITH cut AS') || s.sql.includes('GROUP BY tier') || s.sql.includes('life.data') || s.sql.includes('read_pool_positions')));

  // Profile the lock and refresh entry points in the same fixture, after handler timing has finished.
  await store.close();
  const lockPlans:unknown[]=[];
  await db.tx(async tx=>{
    const keys=[binary(card.identity.address)];
    const queries:{sql:string;params:unknown[]}[]=[];
    const traced=new ChainDb({query:async<T>(sql:string,params?:unknown[])=>{
      queries.push({sql,params:params ?? []});return tx.sql.query<T>(sql,params);
    }},fn=>fn(tx.sql));
    await refreshLiquidityModels(traced,[card.identity.address],now);
    for(const q of [
      {sql:'SELECT read_lock_coins($1::bytea[])',params:[keys]},
      {sql:'SELECT coin FROM read_projection_locks WHERE coin=ANY($1::bytea[]) ORDER BY coin FOR UPDATE',params:[keys]},
      {sql:'SELECT refresh_read_models($1::bytea[],$2::bigint)',params:[keys,Math.floor(now/60000)*60]},
      ...queries.filter(q=>!q.sql.includes('WITH saved AS')),
    ]) {
      const result=(await tx.sql.query<{'QUERY PLAN':{Plan:Record<string,unknown>;'Execution Time':number}[]}>('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) '+q.sql,q.params)).rows[0]['QUERY PLAN'][0];
      lockPlans.push({statement:q.sql.trim().split('\n')[0],ms:result['Execution Time'],nodes:nodes(result.Plan).map(n=>({node:n['Node Type'],relation:n['Relation Name'],index:n['Index Name'],rows:n['Actual Rows'],loops:n['Actual Loops'],sort:n['Sort Key']}))});
    }
  });
  console.info('refresh_plans',JSON.stringify(lockPlans));
  console.info('radar_handler_benchmark',JSON.stringify({baselineRevision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runtime:'PGlite',version:(await original<{v:string}>('SELECT version() v')).rows[0].v,coins:30000,bars:144000,cardBytes:JSON.stringify(card).length,page:100,samples:25,before:stats(times.before),after:stats(times.after),statements:{before:captured.before.length,after:captured.after.length}}));
} finally {await built.close();await Promise.all(temporary.map(path=>unlink(path)));}
