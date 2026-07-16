import { binary } from '@eko/db';
import { FeedItemSchema, type Address, type FeedItem } from '@eko/shared';
import { InputError } from '../http/v1/helpers.js';
import { toUntrusted } from '@eko/untrusted';
import type { ReadStore } from './store.js';
import { decodeCursor, encodeCursor } from './pagination.js';
export class FeedService {
  constructor(readonly store:ReadStore) {}
  private async page(kinds?:FeedItem['kind'][],coin?:Address,block?:number,cursor?:string) {
    await this.store.refreshModels();
    const scope=`feed:${[...(kinds ?? [])].sort().join(',')}`,key=decodeCursor(cursor,scope);
    if(key && (key.length!==2 || !Number.isSafeInteger(key[0]) || typeof key[1]!=='string'))throw new InputError('Invalid feed cursor');
    const params:unknown[]=[],where:string[]=[];
    const bind=(v:unknown)=>{params.push(v);return `$${params.length}`;};
    if(coin)where.push(`coin=${bind(binary(coin))} AND block=${bind(block)}`);
    if(key)where.push(`(block,id)<(${bind(key[0])},${bind(key[1])})`);
    const condition=where.length ? 'WHERE '+where.join(' AND ') : '';
    const filtered=kinds?.length ? [...new Set(kinds)].map(kind=>`(SELECT * FROM read_feed WHERE kind=${bind(kind)} ${where.length ? 'AND '+where.join(' AND ') : ''} ORDER BY block DESC,id DESC LIMIT 101)`).join(' UNION ALL ') : null;
    const page=filtered ? `SELECT * FROM (${filtered}) kinds ORDER BY block DESC,id DESC LIMIT 101` : `SELECT * FROM read_feed ${condition} ORDER BY block DESC,id DESC LIMIT 101`;
    // Chain block and id form an immutable chronological cursor. Enrichment is bounded to 101 events.
    const result=await this.store.db.sql.query<{id:string;coin:Uint8Array;symbol:string;block:string;kind:FeedItem['kind'];data:Record<string,unknown>;first_block:string|null}>(page,params);
    const coins=result.rows.map(r=>r.coin);
    const firstVerdicts=coins.length ? (await this.store.db.sql.query<{coin:Uint8Array;block:string}>('SELECT coin,block FROM read_first_verdict WHERE coin=ANY($1::bytea[])',[coins])).rows : [];
    const verdictBlocks=new Map(firstVerdicts.map(r=>[Buffer.from(r.coin).toString('hex'),Number(r.block)]));
    const blocks=[...new Set([...result.rows.flatMap(r=>r.first_block==null ? [Number(r.block)] : [Number(r.block),Number(r.first_block)]),...verdictBlocks.values()])];
    const clocks=blocks.length ? (await this.store.db.sql.query<{number:string;ts:Date}>(`SELECT number,ts FROM engine_block_times WHERE number=ANY($1::bigint[])
      UNION ALL SELECT number,ts FROM chain_blocks WHERE number=ANY($1::bigint[])`,[blocks])).rows : [];
    // Engine clocks take precedence. Explicit block keys keep the planner off the complete header history.
    const timestamps=new Map<number,Date>();
    for(const clock of clocks)if(!timestamps.has(Number(clock.number)))timestamps.set(Number(clock.number),clock.ts);
    const enriched=result.rows.map(r=>({...r,ts:timestamps.get(Number(r.block)),first_ts:r.first_block==null ? undefined : timestamps.get(Number(r.first_block)),first_verdict_ts:timestamps.get(verdictBlocks.get(Buffer.from(r.coin).toString('hex')) ?? -1)}));
    const rows:FeedItem[]=enriched.slice(0,100).filter(r=>r.ts).map(r=>FeedItemSchema.parse({id:r.id,coin:`0x${Buffer.from(r.coin).toString('hex')}`,symbol:toUntrusted(r.symbol ?? '',32),
      guardV2:r.data.guardV2,guardFactorId:r.data.guardFactorId,guardReasonCode:r.data.guardReasonCode,guardReason:r.data.guardReason,
      block:Number(r.block),ts:new Date(r.ts!).getTime(),kind:r.kind,level:r.data.level==='pending' ? undefined : r.data.level,
      playbookId:r.kind==='playbook' || r.kind==='wash' ? r.data.id : undefined,
      matchPct:typeof r.data.confidence==='number' ? r.data.confidence*100 : undefined,
      firstVerdictMs:r.kind==='verdict' && r.first_ts && r.first_verdict_ts ? Math.max(0,new Date(r.first_verdict_ts).getTime()-new Date(r.first_ts).getTime()) : undefined}));
    const last=result.rows[99];
    return {rows,cursor:result.rows.length>100 ? encodeCursor(scope,[Number(last.block),last.id]) : null,delayedSec:0,unavailable:['agent_trade','crew_trade','clone','swarm','burn']};
  }
  async all(kinds?:FeedItem['kind'][],coin?:Address,block?:number) {return (await this.page(kinds,coin,block)).rows;}
  list(kinds?:FeedItem['kind'][],cursor?:string) {return this.page(kinds,undefined,undefined,cursor);}
}
