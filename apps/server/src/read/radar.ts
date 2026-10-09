import { hex } from '@eko/db';
import { sellRefusalTotals } from '@eko/engines';
import { InputError } from '../http/v1/helpers.js';
import type { RadarRow } from '@eko/shared';
import type { ReadRow, ReadStore } from './store.js';
import { decodeCursor, encodeCursor } from './pagination.js';
// TODO(spec): Pending tier is unspecified; place it between Monitor and Danger (task 023).
const tier = { clear:0, monitor:1, pending:2, danger:3 };
export function rankRadar(rows: ReadRow[]): RadarRow[] {
  return rows.sort((a,b) => {
    const level=tier[a.row.verdict]-tier[b.row.verdict]; if(level)return level;
    // Skip a ranking key unless both rows have observations for it; signal never ranks.
    if (!a.row.unavailable?.includes('flow') && !b.row.unavailable?.includes('flow')) {
      const flow=b.row.flow.agentPct+b.row.flow.crewPct-a.row.flow.agentPct-a.row.flow.crewPct;if(flow)return flow;
    }
    if (!a.row.unavailable?.includes('exitCost') && !b.row.unavailable?.includes('exitCost')) {
      const exit=a.row.exitCost1kPct-b.row.exitCost1kPct;if(exit)return exit;
    }
    return b.volume-a.volume || a.row.address.localeCompare(b.row.address);
  }).map((r,i)=>({...r.row,rank:i+1}));
}
export class RadarService {
  constructor(readonly store: ReadStore) {}
  async order() {await this.store.refreshRanks();return (await this.store.db.sql.query<{coin:Uint8Array}>('SELECT coin FROM read_coins WHERE activity>$1 ORDER BY tier,-volume,coin',[new Date(this.store.now()-7*86400000)])).rows.map(r=>hex(r.coin));}
  async list(cursor?:string) {
    await this.store.refreshRanks();
    const key=decodeCursor(cursor,'radar');
    if(key && (key.length!==4 || !Number.isInteger(key[0]) || typeof key[1]!=='number' || typeof key[2]!=='string' || !/^0x[0-9a-f]{40}$/.test(key[2]) || !Number.isInteger(key[3])))throw new InputError('Invalid radar cursor');
    const cutoff=new Date(this.store.now()-7*86400000),params:unknown[]=[cutoff];
    if(key)params.push(key[0],-Number(key[1]),Buffer.from(String(key[2]).slice(2),'hex'));
    const selected=await this.store.db.sql.query<{coin:Uint8Array;tier:number;volume:number}>(`SELECT coin,tier,volume FROM read_coins
      WHERE activity>$1 ${key ? 'AND (tier,-volume,coin)>($2,$3,$4)' : ''} ORDER BY tier,-volume,coin LIMIT 101`,params);
    const page=selected.rows.slice(0,100),details=await this.store.rows(undefined,page.map(r=>hex(r.coin)));
    const indexed=new Map(details.map(e=>[e.row.address,e.row]));
    const rows=page.map((r,i)=>({...indexed.get(hex(r.coin))!,rank:i+1+(key ? Number(key[3]) : 0)}));
    const totals=await this.totals();
    const last=page.at(-1);
    return {rows,cursor:selected.rows.length>100 && last ? encodeCursor('radar',[last.tier,last.volume,hex(last.coin),(key ? Number(key[3]) : 0)+page.length]) : null,delayedSec:0,totals};
  }
  private cachedTotals?: { at: number; value: ReturnType<RadarService['computeTotals']> };
  /** Header counts change slowly; serve them from a 30-second cache so a radar request never recomputes them inline. */
  totals() {
    if(!this.store.background)return this.computeTotals();
    const now=this.store.now();
    if(!this.cachedTotals || now-this.cachedTotals.at>=30_000) {
      const value=this.computeTotals();
      this.cachedTotals={at:now,value};
      value.catch(()=>{ if(this.cachedTotals?.value===value)this.cachedTotals=undefined; });
    }
    return this.cachedTotals.value;
  }
  private async computeTotals() {
    const result=await this.store.db.sql.query<{tier:number;n:string}>('SELECT tier,count(*) AS n FROM read_coins WHERE activity>$1 GROUP BY tier',[new Date(this.store.now()-7*86400000)]);
    const midnight=Math.floor(this.store.now()/86400000)*86400;
    const today=await this.store.db.sql.query<{n:string}>('SELECT count(DISTINCT e.coin) AS n FROM engine_runs e JOIN read_coins r ON r.coin=e.coin WHERE e.sec>=$1 AND e.sec<$2 AND r.activity>$3',[midnight,midnight+86400,new Date(this.store.now()-7*86400000)]);
    const count=(tier:number)=>Number(result.rows.find(r=>r.tier===tier)?.n ?? 0);
    const from=Math.floor(this.store.now()/3600000)*3600-23*3600,live=new Date(this.store.now()-7*86400000);
    const [scanned,danger]=await Promise.all([
      this.store.db.sql.query<{h:number;n:string}>('SELECT floor((e.sec-$1)/3600)::int AS h,count(DISTINCT e.coin) AS n FROM engine_runs e JOIN read_coins r ON r.coin=e.coin WHERE e.sec>=$1 AND r.activity>$2 GROUP BY 1',[from,live]),
      this.store.db.sql.query<{h:number;n:string}>(`SELECT floor((e.sec-$1)/3600)::int AS h,count(DISTINCT v.coin) AS n FROM verdicts v JOIN engine_runs e ON e.coin=v.coin AND e.block=v.valid_from_block
        WHERE e.sec>=$1 AND v.data->>'level'='danger' GROUP BY 1`,[from]),
    ]);
    const hourly=(rows:{h:number;n:string}[])=>Array.from({length:24},(_,i)=>Number(rows.find(r=>Number(r.h)===i)?.n ?? 0));
    // Refusals exist only while buy quotes run the sell check; otherwise the stat has no source and is omitted (CA-36).
    const refused=this.store.sellCheckQuotes ? await sellRefusalTotals(this.store.db,this.store.now()) : null;
    return {coins:result.rows.reduce((n,r)=>n+Number(r.n),0),clear:count(0),monitor:count(1),pending:count(2),danger:count(3),evaluatedToday:Number(today.rows[0].n),
      evaluatedByHour:hourly(scanned.rows),dangerByHour:hourly(danger.rows),...(refused ? {honeypotsRefused:refused.today,refusedByHour:refused.byHour} : {})};
  }
}
