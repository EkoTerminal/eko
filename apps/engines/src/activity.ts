import { binary, hex, type ChainDb } from '@eko/db';
import type { Address, Hex } from '@eko/shared';
import { seconds } from './sources.js';
export interface BlockTime { number: number; sec: number }
export interface Header { timestamp: bigint; hash: Hex | null }
export interface BlockReader { (block: number): Promise<Header>; readMany?: (blocks:number[]) => Promise<Header[]> }
export interface ClockRow { ts:Date; hash:Uint8Array | null }
export type ClockCache = Map<number,ClockRow>;
export interface Activity { coin: Address; block: number; sec: number; kind: string; low: number | null; high: number | null; price: number | null }
export interface CoinActivity { coin: Address; firstBlock: number; createdSec: number; events: Activity[]; revision: string }
/** Timestamped event rows establish real block times; never populate the indexer's head-follower table. */
export async function refreshClock(db: ChainDb, cache?:ClockCache) {
  await db.sql.query(`INSERT INTO engine_block_times(number,ts,hash,source)
    SELECT block,min(ts),NULL,'activity' FROM (
      SELECT block,ts FROM swaps UNION ALL SELECT block,ts FROM token_transfers UNION ALL SELECT block,ts FROM liquidity_events
    ) e GROUP BY block ON CONFLICT(number) DO NOTHING`);
  await db.sql.query(`INSERT INTO engine_block_times(number,ts,hash,source) SELECT number,ts,hash,'head' FROM chain_blocks
    ON CONFLICT(number) DO UPDATE SET ts=excluded.ts,hash=excluded.hash,source=excluded.source`);
  // Legacy Pons/pool rows may lack timestamps entirely. Accept actual stored fields
  // when present, including JSON payload timestamps; never infer a block interval.
  const stored=(await db.sql.query<{block:string;data:Record<string,unknown>}>(`SELECT block,data FROM pons_events
    UNION ALL SELECT created_block,to_jsonb(p) FROM pools p`)).rows;
  const timestamps=new Map<number,Date>();
  for(const row of stored) {
    const raw=row.data.ts ?? row.data.timestamp ?? row.data.blockTimestamp;
    if(typeof raw!=='string' && typeof raw!=='number')continue;
    const numeric=typeof raw==='number' || /^(?:0x[\da-f]+|\d+)$/.test(raw);
    const ms=numeric ? Number(raw)*1000 : Date.parse(raw);
    if(Number.isFinite(ms) && ms>=0 && ms<=8640000000000000)timestamps.set(Number(row.block),new Date(ms));
  }
  const entries=[...timestamps];
  for(let offset=0;offset<entries.length;offset+=250) {
    const params:unknown[]=[],values=entries.slice(offset,offset+250).map(([block,ts])=>{params.push(block,ts);return `($${params.length-1},$${params.length},NULL,'activity')`;});
    await db.sql.query(`INSERT INTO engine_block_times VALUES ${values.join(',')} ON CONFLICT(number) DO NOTHING`,params);
  }
  if(cache) {
    cache.clear();
    for(const row of (await db.sql.query<ClockRow & {number:string}>('SELECT number,ts,hash FROM engine_block_times')).rows)cache.set(Number(row.number),{ts:row.ts,hash:row.hash});
  }
}
export async function resolveClock(db: ChainDb, block: number, readBlock?: BlockReader, cache?:ClockCache) {
  if(cache?.has(block))return cache.get(block);
  let row=(await db.sql.query<{ ts:Date;hash:Uint8Array | null }>('SELECT ts,hash FROM engine_block_times WHERE number=$1',[block])).rows[0];
  if (!row) {
    const head=(await db.sql.query<{ ts:Date;hash:Uint8Array }>('SELECT ts,hash FROM chain_blocks WHERE number=$1',[block])).rows[0];
    if (head) { await db.sql.query("INSERT INTO engine_block_times VALUES($1,$2,$3,'head') ON CONFLICT DO NOTHING",[block,head.ts,head.hash]);row=head; }
  }
  if (!row && readBlock) {
    const header=await readBlock(block);
    await db.sql.query("INSERT INTO engine_block_times VALUES($1,to_timestamp($2),$3,'archive') ON CONFLICT(number) DO UPDATE SET ts=excluded.ts,hash=excluded.hash,source=excluded.source",[block,Number(header.timestamp),header.hash ? binary(header.hash) : null]);
    row=(await db.sql.query<{ ts:Date;hash:Uint8Array | null }>('SELECT ts,hash FROM engine_block_times WHERE number=$1',[block])).rows[0];
  }
  if(row)cache?.set(block,row);
  return row;
}
/** Aggregate once across coins, rather than scanning every coin at every indexed block. */
export async function coinActivity(db: ChainDb, to: number, readBlock?: BlockReader, cache:ClockCache=new Map(), concurrency=4, stopped:()=>boolean=()=>false): Promise<CoinActivity[]> {
  // Pons/pool logs have no timestamp column. Resolve their missing clocks explicitly;
  // silently dropping them would also drop catch-up candidates from backfilled ranges.
  const gaps=(await db.sql.query<{block:string}>(`SELECT DISTINCT e.block FROM (
    SELECT block FROM pons_events UNION ALL SELECT block FROM pons_exemptions UNION ALL SELECT created_block FROM pools
    UNION ALL SELECT first_block FROM tokens
    ) e LEFT JOIN engine_block_times b ON b.number=e.block WHERE e.block<=$1 AND b.number IS NULL ORDER BY e.block`,[to])).rows;
  const width=readBlock?.readMany ? 50 : concurrency;
  for(let offset=0;offset<gaps.length;offset+=width) {
    if(stopped())return [];
    const blocks=gaps.slice(offset,offset+width).map(gap=>Number(gap.block));
    if(!readBlock)throw new Error(`Missing activity timestamp at block ${blocks[0]}; provide RPC_HTTP_URL for archive headers`);
    const headers=readBlock.readMany ? await readBlock.readMany(blocks) : await Promise.all(blocks.map(block=>readBlock(block)));
    if(headers.length!==blocks.length)throw new Error('Incomplete archive header batch');
    const params:unknown[]=[],values=headers.map((header,i)=>{
      const ts=new Date(Number(header.timestamp)*1000),hash=header.hash ? binary(header.hash) : null;
      cache.set(blocks[i],{ts,hash});params.push(blocks[i],ts,hash);
      return `($${params.length-2},$${params.length-1},$${params.length},'archive')`;
    });
    await db.sql.query(`INSERT INTO engine_block_times VALUES ${values.join(',')} ON CONFLICT(number) DO NOTHING`,params);
  }
  const rows=(await db.sql.query<{ coin:Uint8Array;block:string;ts:Date;kind:string;low:number | null;high:number | null;price:number | null;revision:string }>(`WITH activity AS (
    SELECT coin,block,'swap' AS kind,min(ts) AS ts,min(price_quote) AS low,max(price_quote) AS high,
      (array_agg(price_quote ORDER BY log_index DESC,tx_hash DESC))[1] AS price,
      count(*)::text||':'||count(usd)::text AS revision FROM swaps WHERE block<=$1 GROUP BY coin,block
    UNION ALL SELECT token,block,'transfer',min(ts),NULL,NULL,NULL,count(*)::text FROM token_transfers WHERE block<=$1 GROUP BY token,block
    UNION ALL SELECT t.address,e.block,'liquidity',min(e.ts),NULL,NULL,NULL,count(*)::text FROM liquidity_events e
      JOIN pools p ON p.id=e.pool_id JOIN tokens t ON t.address=p.currency0 OR t.address=p.currency1 WHERE e.block<=$1 GROUP BY t.address,e.block
    UNION ALL SELECT token,e.block,'pons',b.ts,NULL,NULL,NULL,count(*)::text FROM pons_events e
      JOIN engine_block_times b ON b.number=e.block WHERE e.block<=$1 GROUP BY token,e.block,b.ts
    UNION ALL SELECT token,e.block,'exemption',b.ts,NULL,NULL,NULL,count(*)::text FROM pons_exemptions e
      JOIN engine_block_times b ON b.number=e.block WHERE e.block<=$1 GROUP BY token,e.block,b.ts
    UNION ALL SELECT t.address,p.created_block,'pair',b.ts,NULL,NULL,NULL,'1' FROM pools p
      JOIN tokens t ON t.address=p.currency0 OR t.address=p.currency1 JOIN engine_block_times b ON b.number=p.created_block WHERE p.created_block<=$1
    ) SELECT * FROM activity ORDER BY coin,block,kind`,[to])).rows;
  const events=new Map<Address,Activity[]>(), revisions=new Map<Address,string[]>();
  for (const row of rows) {
    const coin=hex(row.coin), list=events.get(coin) ?? [], revision=revisions.get(coin) ?? [];
    list.push({coin,block:Number(row.block),sec:seconds(row.ts),kind:row.kind,low:row.low,high:row.high,price:row.price});
    revision.push(`${row.block}:${row.kind}:${row.revision}`);events.set(coin,list);revisions.set(coin,revision);
  }
  const tokens=(await db.sql.query<{ address:Uint8Array;first_block:string;supply_block:string | null;graduated_block:string | null }>('SELECT address,first_block,supply_block,graduated_block FROM tokens WHERE first_block<=$1 ORDER BY first_block,address',[to])).rows;
  const result:CoinActivity[]=[];
  for (const token of tokens) {
    const coin=hex(token.address), time=await resolveClock(db,Number(token.first_block),readBlock,cache);
    if (!time) throw new Error(`Missing launch timestamp at block ${token.first_block}; provide RPC_HTTP_URL for archive headers`);
    result.push({coin,firstBlock:Number(token.first_block),createdSec:seconds(time.ts),events:events.get(coin) ?? [],
      revision:`${token.supply_block}:${token.graduated_block}:${(revisions.get(coin) ?? []).join('|')}`});
  }
  return result;
}
function lowerBound(clock: BlockTime[], sec:number) {
  let low=0,high=clock.length;
  while(low<high){const mid=(low+high)>>>1;if(clock[mid].sec<sec)low=mid+1;else high=mid;}
  return low;
}
export interface Checkpoint { coin:Address;block:number;sec:number }
/** TODO(spec): without header history, a deadline maps to the first timestamped activity block at/after it, within TO. */
export function checkpoints(coin:CoinActivity,clock:BlockTime[],from:number,to:number,clockIndex?:ReadonlyMap<number,BlockTime>):Checkpoint[] {
  if (!clock.length) return [];
  const end=clock.at(-1)!.sec, chosen=new Map<number,Checkpoint>();
  const events=new Map<number,Activity[]>();
  for(const event of coin.events){const list=events.get(event.block) ?? [];list.push(event);events.set(event.block,list);}
  const fixed=[0,2,10,60,300].map(offset=>({block:clock[lowerBound(clock,coin.createdSec+offset)]?.number,sec:coin.createdSec+offset}));
  const fixedBlocks=new Set(fixed.flatMap(p=>p.block==null?[]:[p.block]));fixedBlocks.add(coin.firstBlock);
  const interesting=[...new Set([...events.keys(),...fixedBlocks])].sort((a,b)=>a-b);
  let lastRun=coin.createdSec,lastActivity=coin.createdSec,lastTrade=-Infinity,lastPrice:number | null=null,lastObservedPrice:number | null=null;
  const add=(point:BlockTime)=>{if(point.number>=from && point.number<=to)chosen.set(point.number,{coin:coin.coin,block:point.number,sec:point.sec});lastRun=point.sec;lastPrice=lastObservedPrice;};
  const periodic=(untilBlock:number,untilSec:number)=>{
    while(lastRun<untilSec){
      const deadline=lastRun+(lastRun+600-lastTrade<3600 ? 600 : 3600);
      if(deadline>=lastActivity+7*86400 || deadline>end)break;
      const point=clock[lowerBound(clock,deadline)];
      if(!point || point.number>=untilBlock || point.sec>untilSec || point.sec>=lastActivity+7*86400)break;
      add(point);
    }
  };
  const byBlock=clockIndex ?? new Map(clock.map(point=>[point.number,point]));
  for(const block of interesting){
    const point=byBlock.get(block);if(!point || block>to)continue;
    periodic(block,point.sec);
    const activity=events.get(block) ?? [], swaps=activity.filter(e=>e.kind==='swap');
    if(!activity.length && point.sec>=lastActivity+7*86400)continue;
    if(activity.length)lastActivity=point.sec;
    if(swaps.length){lastTrade=point.sec;lastObservedPrice=swaps.at(-1)!.price;}
    const changed=swaps.some(e=>lastPrice==null || (e.high!=null && e.high>lastPrice*1.05) || (e.low!=null && e.low<lastPrice*0.95));
    if(fixedBlocks.has(block) || changed || activity.some(e=>e.kind!=='swap'))add(point);
  }
  periodic(to+1,end);
  return [...chosen.values()].sort((a,b)=>a.block-b.block);
}
