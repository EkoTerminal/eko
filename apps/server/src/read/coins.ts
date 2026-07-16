import { binary, candles, type Timeframe } from '@eko/db';
import type { Address } from '@eko/shared';
import type { ReadStore } from './store.js';
export class CoinsService {
  constructor(readonly store:ReadStore) {}
  card(address:Address) {return this.store.card(address);}
  verdict(address:Address) {return this.store.verdict(address);}
  async candles(address:Address,tf:Timeframe,from:number,to:number) {
    if(tf==='1s' || tf==='15s')return {...await candles(this.store.db,address,tf,from,to,this.store.now()/1000),delayedSec:0};
    const [result,history]=await Promise.all([candles(this.store.db,address,tf,from,to,this.store.now()/1000),this.store.db.sql.query<{first:Date|null;last:Date|null}>('SELECT min(ts) AS first,max(ts) AS last FROM swaps WHERE coin=$1',[binary(address)])]);
    const h=history.rows[0];return {...result,firstTradeTs:h.first ? new Date(h.first).getTime()/1000 : null,lastTradeTs:h.last ? new Date(h.last).getTime()/1000 : null,delayedSec:0};
  }
  async flow(address:Address,window:'5m'|'1h'|'24h') {
    const card=await this.card(address);
    return card ? {...card.flow,window,meta:card.meta?.flow,delayedSec:0} : null;
  }
}
