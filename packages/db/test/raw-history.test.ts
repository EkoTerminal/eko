import { afterEach, expect, it } from 'vitest';
import { binary, candles, holders, migrate, migrateEngines, openDb, rebuildBalances, rebuildBars, runRetention, trendingAt, type ChainDb } from '../src/index.js';
const epoch=Date.parse('2026-10-12T00:00:00Z'),DAY=86400000,now=()=>epoch+20*DAY;
const bytes=(n:number,size=20)=>binary(`0x${n.toString(16).padStart(size*2,'0')}`);
let db:ChainDb;
afterEach(async()=>{await db?.close();});
async function fixture() {
  db=await openDb({pgliteDir:':memory:'});await migrate(db);await migrateEngines(db);await db.ensurePartitions(new Date(epoch));
  for(let day=0;day<=20;day++) {
    await db.insert('chain_blocks',{number:day+1,block:day+1,hash:bytes(day+1,32),parent_hash:bytes(day,32),ts:new Date(epoch+day*DAY)});
    await db.sql.query("INSERT INTO engine_block_times VALUES($1,$2,$3,'head')",[day+1,new Date(epoch+day*DAY),bytes(day+1,32)]);
  }
  // Reverse address and block order, with active, unattributed, unrated and quote identities.
  for(const coin of [1,2,3]) {
    await db.insert('tokens',{address:bytes(coin),deployer:coin===3?null:bytes(10),first_block:1,block:1,decimals:0});
    for(const day of [0,1,2,12,16,18,19]) {
      const count=day===0?5:1;
      for(let log=0;log<count;log++)await db.insert('swaps',{ts:new Date(epoch+day*DAY+log*1000),block:day+1,tx_hash:bytes(coin*100+day,32),log_index:log,
        venue:'uniswap_v3',pool_id:bytes(50),coin:bytes(coin),quote_asset:bytes(3),trader:bytes(10+log),side:1,amount_coin:'10',amount_quote:'5',price_quote:0.5,usd:log+5,senders_pending:coin===2});
      await db.insert('token_transfers',{ts:new Date(epoch+day*DAY),block:day+1,tx_hash:bytes(coin*100+day,32),log_index:0,token:bytes(coin),from_address:bytes(0),to_address:bytes(10),amount:'10'});
    }
  }
  await db.tx(tx=>rebuildBalances(tx));await db.tx(tx=>rebuildBars(tx,0n,21n));
  await db.sql.query("INSERT INTO verdicts VALUES('grade',$1,2,'fixture','fixture','{\"level\":\"clear\"}')",[bytes(1)]);
}
const rows=async(sql:string)=>(await db.sql.query(sql)).rows;
const cap=()=>runRetention(db,{quoteTokens:[`0x${'3'.padStart(40,'0')}`],swapDays:7,transferDays:3,dryRun:false,pauseMs:0,batchRows:2,budgetMs:100000,now});
it('caps every identity and keeps charts, balances, first buyers, unknown counts, rating baselines and launch holdings',async()=>{
  await fixture();
  await db.sql.query('UPDATE swaps SET senders_pending=false WHERE coin=$1 AND block>13',[bytes(2)]);
  const projected=async()=>{await db.sql.query('SELECT refresh_read_models($1::bytea[],$2)',[[bytes(1),bytes(2)],now()/1000]);return rows('SELECT coin,buyers,buyers_pending,activity FROM read_coins ORDER BY coin');};
  const projectedBefore=await projected();
  const chart=()=>candles(db,`0x${'1'.padStart(40,'0')}`,'1m',epoch/1000,now()/1000);
  const balance=()=>holders(db,`0x${'1'.padStart(40,'0')}`,21n);
  const firsts=()=>rows('SELECT * FROM read_buyer_firsts ORDER BY coin,trader');
  const prices=()=>rows('SELECT * FROM coin_rating_prices ORDER BY coin');
  const [bars,held,first,price]=await Promise.all([chart(),balance(),firsts(),prices()]);
  const trending=await trendingAt(db,2,epoch/1000+86400-3600);
  const result=await cap();
  expect(result.skippedRules).toEqual([]);expect(result.ruleStats?.raw_swaps.rows).toBe(24);expect(result.ruleStats?.raw_transfers.rows).toBe(15);
  expect(await rows('SELECT DISTINCT block FROM swaps ORDER BY block')).toEqual([{block:17},{block:19},{block:20}]);
  expect(await rows('SELECT DISTINCT block FROM token_transfers ORDER BY block')).toEqual([{block:19},{block:20}]);
  await db.tx(tx=>rebuildBalances(tx));await db.tx(tx=>rebuildBars(tx,0n,21n));
  expect(await chart()).toEqual(bars);expect(await balance()).toEqual(held);expect(await firsts()).toEqual(first);expect(await prices()).toEqual(price);expect(await projected()).toEqual(projectedBefore);
  expect(await trendingAt(db,2,epoch/1000+86400-3600)).toEqual(trending);
  expect(await rows('SELECT sum(n)::int AS n FROM coin_unknown_buys')).toEqual([{n:8}]);
  expect(await rows('SELECT opening_holdings FROM coin_lifetime ORDER BY coin')).toEqual(Array.from({length:3},()=>({opening_holdings:{[Buffer.from(bytes(10)).toString('hex')]:'10'}})));
  const checkpoints=await db.sql.query<{block:number;data:Record<string,{amount:string;block:string}>}>('SELECT block,data FROM coin_holder_checkpoints WHERE coin=$1 ORDER BY block',[bytes(1)]);
  const holder=Buffer.from(bytes(10)).toString('hex');
  expect(checkpoints.rows).toEqual([{block:1,data:{[holder]:{amount:'10',block:'1'}}},{block:2,data:{[holder]:{amount:'20',block:'2'}}},{block:7,data:{[holder]:{amount:'30',block:'3'}}},{block:8,data:{[holder]:{amount:'30',block:'3'}}}]);
  const grade=await rows('SELECT p0,p1,hi FROM retention_grade_prices WHERE coin=decode(lpad(\'1\',40,\'0\'),\'hex\') ORDER BY since,horizon_sec');
  expect(grade.length).toBe(2);expect(grade.every(g=>g.p0===0.5)).toBe(true);
  expect((await cap()).historySwaps).toBe(0);expect((await cap()).historyTransfers).toBe(0);
});
it('deletes in oldest-block order across coins, writes summaries first, and never strands a dense minute',async()=>{
  await fixture();
  await db.sql.query('CREATE TABLE deletion_order(id bigserial,kind text,block bigint)');
  await db.sql.query(`CREATE FUNCTION observe_raw_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF TG_ARGV[0]='swaps' THEN
      IF NOT EXISTS(SELECT 1 FROM coin_lifetime WHERE coin=OLD.coin) THEN RAISE EXCEPTION 'missing summary'; END IF;
    END IF;
    INSERT INTO deletion_order(kind,block) VALUES(TG_ARGV[0],OLD.block);RETURN OLD;END $$`);
  for(const table of ['swaps','token_transfers'])await db.sql.query(`CREATE TRIGGER observe_delete AFTER DELETE ON ${table} FOR EACH ROW EXECUTE FUNCTION observe_raw_delete('${table}')`);
  await cap();
  for(const table of ['swaps','token_transfers']) {
    const order=(await db.sql.query<{block:string}>('SELECT block FROM deletion_order WHERE kind=$1 ORDER BY id',[table])).rows.map(r=>Number(r.block));
    expect(order.length).toBeGreaterThan(2);expect(order).toEqual([...order].sort((a,b)=>a-b));
  }
  expect(await rows('SELECT count(*)::int AS n FROM swaps WHERE block=1')).toEqual([{n:0}]);
  const before=await rows('SELECT * FROM bars_1m ORDER BY coin,minute');
  await db.tx(tx=>rebuildBars(tx,0n,21n));expect(await rows('SELECT * FROM bars_1m ORDER BY coin,minute')).toEqual(before);
});
it('rolls back normally inside the raw window and rejects reorgs across compacted evidence',async()=>{
  await fixture();await cap();
  await db.tx(tx=>tx.deleteAbove(19n));
  expect(await rows('SELECT max(block)::int AS n FROM swaps')).toEqual([{n:19}]);
  await expect(db.tx(tx=>tx.deleteAbove(10n))).rejects.toThrow('compacted raw history');
  await expect(db.insert('token_transfers',{ts:new Date(epoch),block:1,tx_hash:bytes(9999,32),log_index:0,token:bytes(1),from_address:bytes(0),to_address:bytes(10),amount:'1'})).rejects.toThrow('compacted raw history');
});
it('validates raw horizons and leaves report-only history untouched',async()=>{
  await fixture();const before=await rows('SELECT count(*)::int AS n FROM swaps');
  await expect(runRetention(db,{quoteTokens:[],swapDays:6})).rejects.toThrow('seven swap days');
  await expect(runRetention(db,{quoteTokens:[],transferDays:0})).rejects.toThrow('transfer day');
  const r=await runRetention(db,{quoteTokens:[],swapDays:7,transferDays:3,now});
  expect(r.dryRun).toBe(true);expect(await rows('SELECT count(*)::int AS n FROM swaps')).toEqual(before);
  expect(await rows('SELECT * FROM raw_history_watermarks ORDER BY name')).toEqual([{name:'swaps',through_block:-1},{name:'token_transfers',through_block:-1}]);
});

it('keeps legacy evidence explicitly incomplete when older deletions predate lifetime summaries',async()=>{
  await fixture();
  await db.sql.query("INSERT INTO history_prunes(coin,rule,through_block,liquidity) VALUES($1,'quiet_coin',1,1)",[bytes(1)]);
  await cap();
  expect((await db.sql.query<{data:{legacyIncomplete?:boolean}}>('SELECT data FROM coin_lifetime WHERE coin=$1',[bytes(1)])).rows[0].data.legacyIncomplete).toBe(true);
});

it('advances a separate scan cursor without locking hot tables and permits fresh inserts after the fence',async()=>{
  await fixture();
  const statements:string[]=[],transact=db.tx.bind(db);
  db.tx=work=>transact(async tx=>{
    const query=tx.sql.query.bind(tx.sql);
    tx.sql.query=(async(sql:string,params?:unknown[])=>{statements.push(sql);return query(sql,params);}) as typeof tx.sql.query;
    return work(tx);
  });
  await cap();
  expect(statements.some(sql=>sql==='LOCK TABLE swaps,token_transfers IN SHARE ROW EXCLUSIVE MODE')).toBe(false);
  expect(statements).toContain('SELECT pg_try_advisory_xact_lock(4663,208) AS acquired');
  expect(await rows('SELECT name,after_block FROM raw_history_progress ORDER BY name')).toEqual([
    {name:'swaps',after_block:13},{name:'token_transfers',after_block:17}]);
  await db.insert('token_transfers',{ts:new Date(epoch+20*DAY),block:21,tx_hash:bytes(9999,32),log_index:0,
    token:bytes(1),from_address:bytes(0),to_address:bytes(10),amount:'1'});
  expect((await rows('SELECT amount FROM token_transfers WHERE block=21'))[0]?.amount).toBe('1');
});
