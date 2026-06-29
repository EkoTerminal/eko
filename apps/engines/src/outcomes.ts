import { binary, type ChainDb } from '@eko/db';
import type { Address, EvidenceRef, PlaybookMatch } from '@eko/shared';
import { RULES_VERSION, type PriorLaunch } from '@eko/playbooks';
import type { ClockCache } from './activity.js';
import type { ReplayCache } from './replay-cache.js';
import { rowHex } from './aggregates.js';
import { evidence, holdingsAt, loadSources, seconds } from './sources.js';

export async function materializeHistory(db: ChainDb, coin: Address, block: number,cache?:ReplayCache) {
  const cachedToken=cache?.tokens.get(coin);
  const token = cachedToken ? {...cachedToken,ts:cache!.clock.get(Number(cachedToken.first_block))!.ts} : (await db.sql.query<{ deployer: Uint8Array; first_block: string; ts: Date }>('SELECT t.deployer,t.first_block,b.ts FROM tokens t JOIN engine_block_times b ON b.number=t.first_block WHERE t.address=$1', [binary(coin)])).rows[0];
  if (!token?.deployer) return;
  const matches = cache ? cache.matchesAt(coin,block) : (await db.sql.query<{ data: PlaybookMatch }>('SELECT data FROM playbook_matches WHERE coin=$1 AND valid_from_block<=$2 AND rules_version=$3 ORDER BY valid_from_block,playbook_id', [binary(coin),block,RULES_VERSION])).rows.map(r => r.data);
  const strongest = new Map<string,Pick<PlaybookMatch,'id'|'level'>>();
  const level = { danger:3,monitor:2,info:1,clear:0 };
  for (const m of matches) if (!strongest.has(m.id) || level[m.level]>level[strongest.get(m.id)!.level]) strongest.set(m.id,m);
  const outcomes = cache ? cache.outcomesAt(coin,block) : (await db.sql.query<{ valid_from_block: string; horizon: '1h'|'24h'|'7d'; outcome: PriorLaunch['outcomes'][number]['outcome']; data: { evidence: EvidenceRef[] } }>('SELECT horizon,outcome,data,valid_from_block FROM outcomes WHERE coin=$1 AND valid_from_block<=$2 ORDER BY horizon', [binary(coin),block])).rows;
  const data: PriorLaunch = { coin,createdAtSec:seconds(token.ts),relation:'deployer',matches:[...strongest.values()].map(m => ({ id:m.id,level:m.level })),
    outcomes:outcomes.map(r => ({ horizon:r.horizon,outcome:r.outcome,validFromBlock:Number(r.valid_from_block),evidence:r.data.evidence })),evidence:[{ kind:'address',ref:coin,block:Number(token.first_block),label:'Prior deployer launch' }] };
  await db.sql.query('INSERT INTO deployer_stats VALUES($1,$2,$3,$4,$5) ON CONFLICT(deployer,coin,valid_from_block,rules_version) DO UPDATE SET data=excluded.data', [token.deployer,binary(coin),block,JSON.stringify(data),RULES_VERSION]);
  cache?.recordHistory(rowHex(token.deployer),block,data);
}
export async function updateOutcomes(db: ChainDb, block: number, nowSec: number, clock?:ClockCache,cache?:ReplayCache) {
  const tokens = cache ? [...cache.tokens.values()].filter(t=>Number(t.first_block)<=block && seconds(cache.clock.get(Number(t.first_block))!.ts)<=nowSec-3600 && cache.outcomesAt(rowHex(t.address),Infinity).length<3).sort((a,b)=>Number(a.first_block)-Number(b.first_block) || rowHex(a.address).localeCompare(rowHex(b.address))).map(t=>({address:t.address,ts:cache.clock.get(Number(t.first_block))!.ts})) : (await db.sql.query<{ address: Uint8Array; ts: Date }>(`SELECT t.address,b.ts FROM tokens t JOIN engine_block_times b ON b.number=t.first_block
    WHERE t.first_block<=$1 AND b.ts<=to_timestamp($2-3600) AND (SELECT count(*) FROM outcomes o WHERE o.coin=t.address)<3 ORDER BY t.first_block,t.address`, [block,nowSec])).rows;
  for (const token of tokens) for (const [horizon,duration] of [['1h',3600],['24h',86400],['7d',604800]] as const) {
    if (nowSec<seconds(token.ts)+duration) continue;
    const coin=rowHex(token.address);
    const attempt=`${coin}:${horizon}`;
    if(cache ? cache.outcomesAt(coin,Infinity).some(o=>o.horizon===horizon) || cache.outcomeAttempts.has(attempt) : (await db.sql.query('SELECT 1 FROM outcomes WHERE coin=$1 AND horizon=$2', [token.address,horizon])).rows.length) continue;
    const end = cache ? cache.endBlock(seconds(token.ts)+duration,block) : (await db.sql.query<{ number:string; ts:Date }>('SELECT number,ts FROM engine_block_times WHERE number<=$1 AND ts>=to_timestamp($2) ORDER BY number LIMIT 1', [block,seconds(token.ts)+duration])).rows[0];
    if (!end) continue;
    cache?.outcomeAttempts.add(attempt);
    const s=await loadSources(db,coin,Number(end.number),undefined,clock,cache,true);
    if (!s || !s.swaps.length) continue;
    const insiders=new Set([s.deployer,...s.exemptionWallets]);
    const buys=s.swaps.filter(r=>r.side===1 && insiders.has(rowHex(r.trader)) && seconds(r.ts)<=s.createdAtSec+3600).reduce((n,r)=>n+Number(r.amount_coin),0);
    const sells=s.swaps.filter(r=>r.side===-1 && insiders.has(rowHex(r.trader)));
    const firstHourSold=sells.filter(r=>seconds(r.ts)<=s.createdAtSec+3600).reduce((n,r)=>n+Number(r.amount_coin),0);
    const opening=await holdingsAt(db,coin,s.createdAtBlock,cache,'outcome-opening');
    const initialHeld=opening.filter(r=>insiders.has(rowHex(r.holder))).reduce((n,r)=>n+Number(r.amount),0);
    const denominator=Math.max(initialHeld,buys);
    const first=s.swaps.find(r=>r.usd!=null && Number(r.amount_coin)>0),last=s.swaps.filter(r=>r.usd!=null && Number(r.amount_coin)>0).at(-1);
    const drop=first && last ? 1-(last.usd!/Number(last.amount_coin))/(first.usd!/Number(first.amount_coin)) : null;
    // Liquidity decline uses the same pool's observed position units, never compares unlike pools.
    let liquidityRug=false,liquidityObserved=false;
    for (const pool of new Set(s.events.map(e=>rowHex(e.pool_id)))) {
      let amount=0n, peak=0n;
      for (const e of s.events.filter(e=>rowHex(e.pool_id)===pool)) {
        if (!['Mint','Burn','ModifyLiquidity'].includes(e.kind)) continue;
        const delta=BigInt(e.data.liquidityDelta ?? e.data.amount ?? '0');
        amount+=e.kind==='Burn' ? -delta : delta; if (amount>peak) peak=amount;
      }
      if (peak>0n) { liquidityObserved=true; if (Number(amount)/Number(peak)<=0.2) liquidityRug=true; }
    }
    const matches=cache ? cache.matchesAt(coin,Number(end.number)) : (await db.sql.query<{ data:PlaybookMatch }>('SELECT data FROM playbook_matches WHERE coin=$1 AND valid_from_block<=$2 AND rules_version=$3', [token.address,end.number,RULES_VERSION])).rows.map(r=>r.data);
    // TODO(spec): survived requires an observed price or liquidity series. It records that outcome only;
    // it does not assert unperformed simulation/owner checks passed.
    if (drop==null && !liquidityObserved && !matches.some(m=>m.id==='honeypot' && m.level==='danger')) continue;
    const outcome = matches.some(m=>m.id==='honeypot' && m.level==='danger') ? 'honeypot' :
      liquidityRug || (drop!=null && drop>=0.9 && sells.length>0) ? 'rugged' :
      denominator>0 && firstHourSold/denominator>0.5 ? 'dumped' : 'survived';
    const refs: EvidenceRef[]=[...s.swaps.slice(0,1).map(r=>evidence(r,'Outcome initial price')),...s.swaps.slice(-1).map(r=>evidence(r,'Outcome horizon price')),
      ...sells.map(r=>evidence(r,'Outcome insider sell'))];
    const data={ evidence:refs,priceDrop:drop,liquidityRug,firstHourSoldShare:denominator ? firstHourSold/denominator : null };
    await db.sql.query('INSERT INTO outcomes VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', [token.address,horizon,end.number,outcome,JSON.stringify(data)]);
    cache?.recordOutcome(coin,{horizon,valid_from_block:String(end.number),outcome,data});
    await materializeHistory(db,coin,block,cache);
  }
}
