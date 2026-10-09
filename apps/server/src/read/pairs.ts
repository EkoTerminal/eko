import { binary, hex, type Hex } from '@eko/db';
import { InputError } from '../http/v1/helpers.js';
import type { PairRow } from '@eko/shared';
import type { ReadRow, ReadStore } from './store.js';
import { decodeCursor, encodeCursor } from './pagination.js';
export function pairStage(row: Pick<PairRow,'stage'|'curvePct'>): PairRow['column'] {
  // TODO(spec): Owner tunes the near-graduation threshold; use 75% until then.
  return row.stage==='graduated' ? 'migrated' : (row.curvePct ?? 0)>=75 ? 'near_grad' : 'new';
}
/** Pairs show exit cost at $100: unavailable unless the sell check measured that size (CA-35). */
function exit100(entry:ReadRow):Pick<PairRow,'exitCost100Pct'|'unavailable'> {
  const unavailable=(entry.row.unavailable ?? []).filter(field=>field!=='exitCost');
  return {exitCost100Pct:entry.exit100 ?? 0,unavailable:entry.exit100==null ? [...unavailable,'exitCost'] : unavailable};
}
export class PairsService {
  constructor(readonly store:ReadStore) {}
  async row(address:Hex):Promise<PairRow | null> {
    const entry=(await this.store.rows(address))[0];
    if(!entry?.eligible || entry.row.launchpad!=='pons')return null;
    const count=await this.store.db.sql.query<{count:string}>('SELECT buyers AS count FROM read_coins WHERE coin=$1',[binary(address)]);
    return {...entry.row,column:pairStage(entry.row),buyers:Number(count.rows[0]?.count ?? 0),...exit100(entry),
      antiSnipe:entry.card?.meta?.tradeability?.missing?.includes('antiSnipeTiming') ? undefined : entry.card?.tradeability.antiSnipe,
      verdictPending:entry.row.verdictPending ?? false};
  }
  async list(stage:PairRow['column'],cursor?:string) {
    await this.store.currentModels();
    const key=decodeCursor(cursor,`pairs:${stage}`);
    if(key && (key.length!==2 || !Number.isSafeInteger(key[0]) || typeof key[1]!=='string' || !/^0x[0-9a-f]{40}$/.test(key[1])))throw new InputError('Invalid pairs cursor');
    const params:unknown[]=[stage];if(key)params.push(key[0],binary(key[1] as Hex));
    const selected=await this.store.db.sql.query<{coin:Uint8Array;pair_block:string;buyers:string}>(`SELECT coin,pair_block,buyers FROM read_coins
      WHERE launchpad='pons' AND pair_column=$1 ${key ? 'AND (pair_block,coin)<($2,$3)' : ''} ORDER BY pair_block DESC,coin DESC LIMIT 101`,params);
    const page=selected.rows.slice(0,100),details=await this.store.rows(undefined,page.map(r=>hex(r.coin)));
    const indexed=new Map(details.map(e=>[e.row.address,e]));
    const last=page.at(-1);
    return {rows:page.map(r=>{const e=indexed.get(hex(r.coin))!;return {...e.row,column:stage,buyers:Number(r.buyers),...exit100(e),verdictPending:e.row.verdictPending ?? false,antiSnipe:e.card?.meta?.tradeability?.missing?.includes('antiSnipeTiming') ? undefined : e.card?.tradeability.antiSnipe};}),
      cursor:selected.rows.length>100 && last ? encodeCursor(`pairs:${stage}`,[Number(last.pair_block),hex(last.coin)]) : null,delayedSec:0};
  }
}
