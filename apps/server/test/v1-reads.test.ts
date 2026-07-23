import { EventEmitter } from 'node:events';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { binary, InProcessBus } from '@eko/db';
import { BarSchema, CoinCardSchema, FeedItemSchema, FlowSchema, PairRowSchema, RadarRowSchema, ScanResultSchema, VerdictSchema, WsServerSchema } from '@eko/shared';
import type { WebSocket } from 'ws';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { ReadLive } from '../src/read/live.js';
import { Hub } from '../src/ws/hub.js';
import { seedReadFixture, sampleAddress } from './read-fixture.js';
const envelope=<T>(schema:z.ZodType<T>)=>z.object({rows:z.array(schema),cursor:z.string().nullable(),delayedSec:z.literal(0),unavailable:z.array(z.string()).optional()});
class Socket extends EventEmitter {
  readyState=1;bufferedAmount=0;messages:unknown[]=[];
  send(raw:string){this.messages.push(JSON.parse(raw));}
  close(){this.emit('close');}
}
let built:Awaited<ReturnType<typeof buildApp>>,card:import('@eko/shared').CoinCard;
const now=Date.now();
beforeAll(async()=>{
  built=await buildApp(loadConfig({NODE_ENV:'test',PGLITE_DIR:':memory:',SESSION_SECRET:'test-only-placeholder'.repeat(2),LEGACY_API:'false',RUN_WORKER:'false',MARKET_DATA_SOURCE:'onchain'}),{startBackground:false});
  built.ctx.reads.store.now=()=>now;
  card=await seedReadFixture(built.ctx.dbh.chain,now);
});
afterAll(async()=>{await built.close();});
describe('v1 indexed read routes',()=>{
  it('parses every route, reports measured gaps, and never uses RPC',async()=>{
    const routes=[['/v1/radar',envelope(RadarRowSchema)],['/v1/pairs?stage=new',envelope(PairRowSchema)],['/v1/feed',envelope(FeedItemSchema)],
      [`/v1/coins/${card.identity.address}`,CoinCardSchema],[`/v1/coins/${card.identity.address}/verdict`,VerdictSchema],
      [`/v1/coins/${card.identity.address}/candles?tf=5m&from=${Math.floor(now/1000)-86400}&to=${Math.floor(now/1000)}`,z.object({bars:z.array(BarSchema),tf:z.literal('5m'),asOfBlock:z.number()})],
      [`/v1/coins/${card.identity.address}/flow?window=5m`,FlowSchema],[`/v1/scan?q=${card.identity.address}`,ScanResultSchema]] as const;
    const before=JSON.stringify(built.ctx.chains.meter.usage());
    for(const [url,schema] of routes){const res=await built.app.inject(url);expect(res.statusCode,url).toBe(200);expect(schema.safeParse(res.json()).success,url).toBe(true);}
    expect(JSON.stringify(built.ctx.chains.meter.usage())).toBe(before);
    const radar=(await built.app.inject('/v1/radar')).json().rows[0];
    expect(radar.unavailable).toEqual(expect.arrayContaining(['exitCost','flow','liquidity']));
    expect(radar.unavailable).not.toContain('change');expect(radar.priceUsd).toBeGreaterThan(0);expect(radar.change1hPct).toBe(0);expect(radar.change24hPct).toBeUndefined();
    const feedResponse=(await built.app.inject('/v1/feed')).json();expect(feedResponse.unavailable).toEqual(['agent_trade','crew_trade','clone','swarm','burn']);const feedRows=feedResponse.rows;expect(feedRows[0].ts).toBeGreaterThan(now-86400000);
    expect(radar.verdict).toBe('pending');expect(radar.verdictPending).toBe(false);
    const flow=(await built.app.inject(`/v1/coins/${card.identity.address}/flow?window=24h`)).json();expect(flow.meta.unavailable).toBe(true);
    const markers=await built.app.inject(`/v1/coins/${card.identity.address}/markers?from=1&to=2`);expect(markers.json()).toEqual({rows:[],markers:[],cursor:null,unavailable:['labels'],delayedSec:0});
    for(const tf of ['1m','15m','1h','4h','1d','1s','15s'])expect((await built.app.inject(`/v1/coins/${card.identity.address}/candles?tf=${tf}&from=1&to=2`)).statusCode).toBe(200);
    const feed=(await built.app.inject('/v1/feed')).json().rows;expect(feed.some((r:{kind:string})=>r.kind==='verdict')).toBe(true);expect(feed.find((r:{kind:string})=>r.kind==='verdict').firstVerdictMs).toBe(0);
  });
  it('keeps identity-only tokens pending in search and never fabricates a card',async()=>{
    const db=built.ctx.dbh.chain;
    await db.insert('tokens',{address:binary(sampleAddress(801)),first_block:'1',block:'1',name:'Pool sample',symbol:'POOL',launchpad:'other'});
    const scan=ScanResultSchema.parse((await built.app.inject('/v1/scan?q=$POOL')).json());expect(scan.status).toBe('pending');expect(scan.card).toBeUndefined();expect(scan.candidates?.[0].verdictPending).toBe(true);
    for(const url of ['/v1/radar','/v1/pairs?stage=migrated'])expect((await built.app.inject(url)).json().rows.some((r:{address:string})=>r.address===sampleAddress(801))).toBe(false);
    const waiting=sampleAddress(802);
    await db.insert('tokens',{address:binary(waiting),deployer:binary(sampleAddress(804)),curve:binary(sampleAddress(803)),launchpad:'pons',first_block:String(card.verdict.asOfBlock),block:String(card.verdict.asOfBlock),name:'Pending launch',symbol:'WAIT'});
    for(const url of ['/v1/radar','/v1/pairs?stage=new']) {const row=(await built.app.inject(url)).json().rows.find((r:{address:string})=>r.address===waiting);expect(row.verdictPending).toBe(true);expect(row.verdict).toBe('pending');}
    expect((await built.app.inject(`/v1/coins/${waiting}`)).statusCode).toBe(404);
    await db.sql.query('DELETE FROM tokens WHERE address=$1',[binary(waiting)]);
    const coin=await built.app.inject(`/v1/coins/${sampleAddress(801)}`);expect(coin.statusCode).toBe(404);expect(coin.json().message).toContain('No coin card');
    expect((await built.app.inject(`/v1/scan?q=${sampleAddress(999)}`)).json().status).toBe('pending');
    expect((await built.app.inject(`/v1/coins/${sampleAddress(999)}`)).statusCode).toBe(404);
    for(const url of ['/v1/radar?cursor=invalid','/v1/pairs?stage=wrong','/v1/feed?kinds=wrong','/v1/coins/not-an-address','/v1/scan?q=','/v1/coins/'+card.identity.address+'/candles?tf=bad&from=2&to=1'])expect((await built.app.inject(url)).statusCode,url).toBe(422);
  });
  it('ranks tiers then measured volume and address, paginates, and drops idle coins',async()=>{
    const db=built.ctx.dbh.chain;
    for(let i=0;i<104;i++) {
      const address=sampleAddress(1000+i),level=(['clear','monitor','pending','danger'] as const)[i%4];
      const copy=structuredClone(card);copy.identity.address=address;copy.identity.createdAt=new Date(now).toISOString();copy.identity.curvePct=i===0?75:20;copy.verdict={...copy.verdict,coin:address,level};
      const id=`synthetic-${i}`;
      await db.insert('tokens',{address:binary(address),deployer:binary(sampleAddress(2000+i)),curve:binary(sampleAddress(3000+i)),launchpad:'pons',first_block:String(card.verdict.asOfBlock),block:String(card.verdict.asOfBlock),name:'Sample',symbol:'DEMO'});
      await db.sql.query('INSERT INTO coin_cards(id,coin,valid_from_block,hash,data) VALUES($1,$2,$3,$4,$5)',[id,binary(address),card.verdict.asOfBlock,id,copy]);
      await db.sql.query('INSERT INTO coin_card_latest(coin,card_id,as_of_block,data) VALUES($1,$2,$3,$4)',[binary(address),id,card.verdict.asOfBlock,copy]);
      await db.sql.query('INSERT INTO verdicts(id,coin,valid_from_block,rules_version,signature,data) VALUES($1,$2,$3,$4,$5,$6)',[id,binary(address),card.verdict.asOfBlock,'test',id,copy.verdict]);
    }
    for(const [address,volume] of [[sampleAddress(1000),100],[sampleAddress(1004),200]] as const) {
      await db.sql.query('UPDATE tokens SET total_supply=100,decimals=0 WHERE address=$1',[binary(address)]);
      for(const [offset,price] of [[25*3600,2],[2*3600,4],[600,8]])await db.sql.query('INSERT INTO bars_1m(coin,minute,open,high,low,close,volume_usd,trades,first_block,last_block) VALUES($1,$2,$3,$3,$3,$3,$4,1,$5,$5)',[binary(address),new Date(Math.floor((now/1000-offset)/60)*60000),price,volume,card.verdict.asOfBlock]);
    }
    await db.sql.query('INSERT INTO bars_1m(coin,minute,open,high,low,close,volume_usd,trades,first_block,last_block) VALUES($1,$2,1,1,1,1,1,1,$3,$3)',[binary(sampleAddress(1008)),new Date(now-2*3600000),card.verdict.asOfBlock]);
    const hourOnly=(await built.app.inject('/v1/radar')).json().rows.find((r:{address:string})=>r.address===sampleAddress(1008));expect(hourOnly.unavailable).not.toContain('change');expect(hourOnly.change24hPct).toBeUndefined();
    const measured=RadarRowSchema.parse((await built.app.inject('/v1/radar')).json().rows.find((r:{address:string})=>r.address===sampleAddress(1000)));
    expect(measured.priceUsd).toBe(8);expect(measured.change1hPct).toBe(100);expect(measured.change24hPct).toBe(300);expect(measured.marketCapUsd).toBe(800);expect(measured.unavailable).not.toContain('change');expect(measured.unavailable).not.toContain('marketCap');
    const bars=(await built.app.inject(`/v1/coins/${sampleAddress(1000)}/candles?tf=5m&from=${Math.floor(now/1000)-26*3600}&to=${Math.floor(now/1000)}`)).json().bars;
    expect(bars.map((b:{c:number})=>b.c)).toEqual([2,4,8]);
    const empty=(await built.app.inject(`/v1/coins/${card.identity.address}/candles?tf=5m&from=${Math.floor(now/1000)-3600}&to=${Math.floor(now/1000)}`)).json();
    expect(empty.bars).toEqual([]);expect(empty.lastTradeTs).toBe(Math.floor(now/1000)-7200);expect(empty.firstTradeTs).toBe(empty.lastTradeTs);
    await db.sql.query('UPDATE tokens SET graduated_block=$2 WHERE address=$1',[binary(sampleAddress(1001)),card.verdict.asOfBlock+10]);
    await db.sql.query('UPDATE tokens SET graduated_block=$2 WHERE address=$1',[binary(sampleAddress(1005)),card.verdict.asOfBlock+20]);
    expect((await built.app.inject('/v1/pairs?stage=migrated')).json().rows.map((r:{address:string})=>r.address)).toEqual([sampleAddress(1005),sampleAddress(1001)]);
    const global=(await built.app.inject('/v1/radar')).json().totals;expect(global.coins).toBe(105);expect(global.danger).toBe(26);expect(global.pending).toBe(27);expect(global.evaluatedToday).toBe(now%86400000>=7200000 ? 1 : 0);
    const first=envelope(RadarRowSchema).parse((await built.app.inject('/v1/radar')).json());expect(first.rows).toHaveLength(100);expect(first.rows[0].address).toBe(sampleAddress(1004));expect(first.rows[1].address).toBe(sampleAddress(1000));expect(first.cursor).not.toBeNull();
    const second=envelope(RadarRowSchema).parse((await built.app.inject(`/v1/radar?cursor=${first.cursor}`)).json());expect(second.cursor).toBeNull();
    const rows=[...first.rows,...second.rows],tier={clear:0,monitor:1,pending:2,danger:3};
    expect(new Set(rows.map(r=>r.address)).size).toBe(rows.length);
    expect(rows.map(r=>tier[r.verdict])).toEqual(rows.map(r=>tier[r.verdict]).sort((a,b)=>a-b));
    expect((await built.app.inject('/v1/scan?q=$DEMO')).json().status).toBe('ambiguous');
    const feedPage=envelope(FeedItemSchema).parse((await built.app.inject('/v1/feed?kinds=new_pair')).json());expect(feedPage.rows).toHaveLength(100);expect(feedPage.cursor).not.toBeNull();
    const feedNext=envelope(FeedItemSchema).parse((await built.app.inject(`/v1/feed?kinds=new_pair&cursor=${feedPage.cursor}`)).json());expect(feedNext.rows.length).toBeGreaterThan(0);expect(feedNext.rows.every(r=>r.kind==='new_pair')).toBe(true);
    const near=envelope(PairRowSchema).parse((await built.app.inject('/v1/pairs?stage=near_grad')).json());expect(near.rows.map(r=>r.address)).toContain(sampleAddress(1000));
    built.ctx.reads.store.now=()=>now+8*86400000;
    expect((await built.app.inject('/v1/radar')).json().rows).toHaveLength(0); // identity-only tokens are searchable, never live plays
    built.ctx.reads.store.now=()=>now;
  });
  it('orders typed live events, coalesces reranks/ticks, and signals backpressure',async()=>{
    const socket=new Socket(),hub=new Hub(),bus=new InProcessBus();hub.addV1(socket as unknown as WebSocket);
    socket.emit('message',JSON.stringify({op:'sub',ch:['radar','pairs','feed',`coin:${card.identity.address}`]}));
    const live=new ReadLive(built.ctx.reads,hub);await live.start(bus);
    try {
      const id=(await built.ctx.dbh.chain.sql.query<{card_id:string}>('SELECT card_id FROM coin_card_latest WHERE coin=$1',[binary(card.identity.address)])).rows[0].card_id;
      bus.publish({topic:'card_updated',ids:{id}});bus.publish({topic:'card_updated',ids:{id}});await live.drain();
      const db=built.ctx.dbh.chain;
      const tx=`0x${'1'.repeat(64)}`;
      await db.insert('swaps',{ts:new Date(now),block:card.verdict.asOfBlock,tx_hash:binary(tx),log_index:0,venue:'pons_curve',pool_id:binary(card.identity.address),coin:binary(card.identity.address),quote_asset:binary(sampleAddress(0)),trader:binary(sampleAddress(2)),tx_from:binary(sampleAddress(2)),tx_to:binary(card.identity.address),side:1,amount_coin:'1000000000000000000',amount_quote:'1',price_quote:1,usd:10,priced_block:card.verdict.asOfBlock});
      bus.publish({topic:'swap',ids:{txHash:tx,logIndex:0}});bus.publish({topic:'swap',ids:{txHash:tx,logIndex:0}});await live.drain();
      await new Promise(resolve=>setTimeout(resolve,1100));await live.drain();
      const events=socket.messages.flatMap(m=>{const parsed=WsServerSchema.parse(m);return parsed.t==='ev' ? [parsed] : [];});
      expect(events.filter(e=>e.kind==='card')).toHaveLength(2);expect(events.filter(e=>e.kind==='tick')).toHaveLength(1);expect(events.filter(e=>e.kind==='rerank')).toHaveLength(1);
      const seq=events.filter(e=>e.ch==='radar').map(e=>e.seq);expect(seq).toEqual(seq.map((_,i)=>i+1));
      socket.bufferedAmount=3*1024*1024;hub.publish<'radar','rerank'>('radar','rerank',{order:[]});hub.publish<'radar','rerank'>('radar','rerank',{order:[]});
      expect(socket.messages.filter(m=>(m as {t:string}).t==='resync')).toHaveLength(1);
    } finally {await live.close();hub.closeAll();}
  });
});
