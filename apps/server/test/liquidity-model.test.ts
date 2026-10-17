import { afterAll, beforeAll, expect, it } from 'vitest';
import { binary, hex, ChainDb, type SqlClient } from '@eko/db';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { readCurveStates, readPoolLiquidity, readPoolMoney } from '../src/read/pool-liquidity.js';
import { seedReadFixture, sampleAddress } from './read-fixture.js';

const now=Date.parse('2026-10-17T12:00:00Z'),coins=Array.from({length:7},(_,i)=>sampleAddress(700+i));
const pool=(i:number)=>`0x${(700+i).toString(16).padStart(64,'0')}`;
let built:Awaited<ReturnType<typeof buildApp>>;
beforeAll(async()=>{
  built=await buildApp(loadConfig({NODE_ENV:'test',PGLITE_DIR:':memory:',SESSION_SECRET:'test-placeholder'.repeat(3),LEGACY_API:'false',RUN_WORKER:'false',MARKET_DATA_SOURCE:'onchain'}),{startBackground:false});
  built.ctx.reads.store.now=()=>now;
  await seedReadFixture(built.ctx.dbh.chain,now);
});
afterAll(async()=>{await built.close();});

it('publishes legacy values and flags for live, retained, migrated, Uniswap, curve and absent pools, then tracks revisions',async()=>{
  const db=built.ctx.dbh.chain,store=built.ctx.reads.store;
  for(const [i,coin] of coins.entries()) {
    await db.insert('tokens',{address:binary(coin),deployer:binary(sampleAddress(900)),name:'Sample coin',symbol:'DEMO',first_block:1,block:1,total_supply:'1000',decimals:0,
      launchpad:i<2 || i===5 ? 'pons' : 'other',graduated_block:i<2 ? 10 : null,graduated_pool:i<2 ? binary(pool(i)) : null});
    if(i===4 || i===6)continue;
    await db.insert('pools',{id:binary(pool(i)),currency0:binary(i===3 ? sampleAddress(0) : coin),currency1:binary(i===3 ? coin : sampleAddress(0)),venue:'uniswap_v4',fee:3000,tick_spacing:60,created_block:1,block:1});
    const swap={pool_id:pool(i),block:20,log_index:0,tx_hash:pool(100+i),amount_coin:'100',amount_quote:'400',usd:8,ts:new Date(now-1000).toISOString()};
    const kept={tail:[swap],lastPositivePriced:swap,liquidity:{[pool(i)]:{fullRangeDelta:'500',moneyPositions:{sample:{lower:-887200,upper:887200,liquidity:'500'}}}},curve:{launchThreshold:'10'}};
    await db.sql.query('INSERT INTO coin_lifetime(coin,data) VALUES($1,$2)',[binary(coin),JSON.stringify(kept)]);
    if(i!==1)await db.insert('liquidity_events',{block:10,ts:new Date(now-1000),tx_hash:binary(pool(200+i)),log_index:0,venue:'uniswap_v4',pool_id:binary(pool(i)),kind:'ModifyLiquidity',data:JSON.stringify({tickLower:-887200,tickUpper:887200,liquidityDelta:'1000'})});
  }
  const compare=async()=>{
    const grad=(await db.sql.query<{address:Uint8Array}>('SELECT address FROM tokens WHERE address=ANY($1::bytea[]) AND graduated_block IS NOT NULL',[coins.map(binary)])).rows.map(r=>hex(r.address));
    const expected=await readPoolLiquidity(db,grad),curves=await readCurveStates(db,[coins[5]]),money=await readPoolMoney(db,coins.filter(c=>!grad.includes(c) && c!==coins[5]),now,true);
    for(const [c,s] of curves)expected.set(c,s.usd);for(const [c,v] of money)expected.set(c,v);
    const rows=await store.rows(undefined,coins);
    for(const {row} of rows) {
      expect(row.liquidityUsd,row.address).toBe(expected.get(row.address) ?? 0);
      expect(row.unavailable?.includes('liquidity'),row.address).toBe(!expected.has(row.address));
      expect(row.curvePct).toBe(curves.has(row.address) ? Math.round(curves.get(row.address)!.curvePct*100)/100 : undefined);
    }
    return rows;
  };
  await compare();
  expect((await db.sql.query('SELECT coin FROM read_coin_liquidity WHERE coin=ANY($1::bytea[])',[coins.map(binary)])).rows).toHaveLength(7);
  // New trades, USD repairs and reorg deletes publish a new valuation without waiting for a request.
  await db.insert('swaps',{ts:new Date(now-500),block:50,tx_hash:binary(pool(500)),log_index:0,venue:'uniswap_v4',pool_id:binary(pool(0)),coin:binary(coins[0]),quote_asset:binary(sampleAddress(0)),side:1,amount_coin:'100',amount_quote:'400',usd:16});await compare();
  await db.sql.query('UPDATE swaps SET usd=32 WHERE coin=$1',[binary(coins[0])]);await compare();
  await db.sql.query('DELETE FROM swaps WHERE coin=$1',[binary(coins[0])]);await compare();
  // Liquidity-only updates and reorg deletes must invalidate values without a new swap or a TTL delay.
  await db.sql.query("UPDATE liquidity_events SET data=jsonb_set(data,'{liquidityDelta}','\"-500\"') WHERE pool_id=$1",[binary(pool(0))]);await compare();
  await db.sql.query('DELETE FROM liquidity_events WHERE pool_id=$1',[binary(pool(2))]);await compare();
  await db.sql.query("UPDATE coin_lifetime SET data=jsonb_set(data,ARRAY['liquidity',$2,'fullRangeDelta'],'100') WHERE coin=$1",[binary(coins[1]),pool(1)]);await compare();
  await db.sql.query('UPDATE tokens SET graduated_block=10,graduated_pool=$2 WHERE address=$1',[binary(coins[2]),binary(pool(2))]);await compare();
  await db.sql.query('UPDATE pools SET currency0=currency1,currency1=currency0 WHERE id=$1',[binary(pool(3))]);await compare();
  await db.sql.query('DELETE FROM coin_lifetime WHERE coin=$1',[binary(coins[1])]);await compare();
  await db.sql.query('DELETE FROM liquidity_events WHERE pool_id=$1',[binary(pool(3))]);
  await db.sql.query("UPDATE coin_lifetime SET data=jsonb_set(data,ARRAY['liquidity',$2,'moneyPositions','sample','liquidity'],'0') WHERE coin=$1",[binary(coins[3]),pool(3)]);
  const zero=(await compare()).find(r=>r.row.address===coins[3])!.row;
  expect(zero.liquidityUsd).toBe(0);expect(zero.unavailable).not.toContain('liquidity');
  await db.sql.query('DELETE FROM tokens WHERE address=$1',[binary(coins[6])]);await compare();
  expect((await db.sql.query('SELECT coin FROM read_coin_liquidity WHERE coin=$1',[binary(coins[6])])).rows).toHaveLength(0);
  // Requests with the background refresher running do no legacy liquidity work, even on a cold page.
  const statements:string[]=[];
  const wrap=(sql:SqlClient):SqlClient=>({query:async<T>(text:string,params?:unknown[])=>{statements.push(text);return sql.query<T>(text,params);}});
  const {ReadStore}=await import('../src/read/store.js');
  const reader=new ReadStore(new ChainDb(wrap(db.sql),fn=>db.tx(tx=>fn(wrap(tx.sql)))),()=>now);
  reader.start();
  try {await reader.rows(undefined,coins);}finally{await reader.close();}
  expect(statements.some(s=>s.includes('JOIN read_coin_liquidity'))).toBe(true);
  expect(statements.some(s=>s.includes('life.data') || s.includes('read_pool_positions') || s.includes('DISTINCT ON (x.pool_id)'))).toBe(false);
});

it('refreshes card fallback depth and availability when only card metadata changes',async()=>{
  const db=built.ctx.dbh.chain,store=built.ctx.reads.store;
  const card=(await db.sql.query<{coin:Uint8Array;data:unknown}>('SELECT coin,data FROM coin_card_latest LIMIT 1')).rows[0];
  const coin=hex(card.coin);
  await db.sql.query("UPDATE tokens SET launchpad='other',curve=NULL,graduated_block=NULL,graduated_pool=NULL WHERE address=$1",[card.coin]);
  await db.sql.query('DELETE FROM swaps WHERE coin=$1',[card.coin]);
  await db.sql.query('DELETE FROM coin_lifetime WHERE coin=$1',[card.coin]);
  await db.sql.query("UPDATE coin_card_latest SET data=jsonb_set(jsonb_set(data,'{liquidity,depthUsd,pct2}','123'),'{meta,liquidity}', '{\"confidence\":1,\"asOfBlock\":1,\"unavailable\":false,\"missing\":[]}') WHERE coin=$1",[card.coin]);
  let row=(await store.rows(coin))[0].row;expect(row.liquidityUsd).toBe(123);expect(row.unavailable).not.toContain('liquidity');
  await db.sql.query("UPDATE coin_card_latest SET data=jsonb_set(data,'{meta,liquidity,missing}','[\"depthUsd\"]') WHERE coin=$1",[card.coin]);
  row=(await store.rows(coin))[0].row;expect(row.liquidityUsd).toBe(0);expect(row.unavailable).toContain('liquidity');
});
