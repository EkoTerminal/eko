import type { ChainDb } from './client.js';
import type { RetentionOptions, RetentionResult } from './retention.js';
import { retentionHorizon } from './retention.js';
import { retentionDb } from './retention-control.js';
import { rawHistoryPass, type RawHistoryBatch } from './raw-history.js';

export class BacklogError extends Error {}
export interface BacklogOptions {
  statementMs: number; batchRows: number; pauseMs: number; dryRun: boolean;
}
export function parseBacklogOptions(args: string[]): BacklogOptions {
  const options: BacklogOptions = {statementMs:60_000,batchRows:2_000,pauseMs:50,dryRun:false};
  for(let i=0;i<args.length;i++) {
    const flag=args[i];
    if(flag==='--dry-run') {options.dryRun=true;continue;}
    const keys:Record<string,'statementMs'|'batchRows'|'pauseMs'>={'--statement-timeout-ms':'statementMs','--batch-rows':'batchRows','--pause-ms':'pauseMs'};
    const key=keys[flag!];
    if(!Object.hasOwn(keys,flag!) || !key)throw new BacklogError('Unknown backlog option');
    const value=Number(args[++i]);
    if(!Number.isSafeInteger(value) || value<(key==='pauseMs'?0:1) || value>2_147_483_647)throw new BacklogError('Invalid backlog option value');
    options[key]=value;
  }
  return options;
}
export interface BacklogProgress {
  event:'batch'|'dry_run'|'retry'|'complete'|'stopped';
  rule?:string; rows?:number; totalRows?:number; throughBlock?:string|null;
  oldestRemainingBlock?:string|null; rowsPerMinute?:number; batchRows?:number; snapshots?:number; code?:string;
}
export interface BacklogHooks {
  stopped?:()=>boolean;
  report:(progress:BacklogProgress)=>void;
  now?:()=>number;
}
/** source MUST be a dedicated session, never a pool: the mutex spans short committed transactions. */
export async function runRawHistoryBacklog(source:ChainDb,options:BacklogOptions,hooks:BacklogHooks,inputs:Pick<RetentionOptions,'firstBlocks'|'cohortSec'|'poolManager'>={}) {
  const clock=hooks.now ?? Date.now,started=clock(),stopped=hooks.stopped ?? (()=>false);
  const db=retentionDb(source,()=>Infinity,()=>options.statementMs);
  if(options.dryRun) {
    // No fences, summaries, cursors or deletes. Exact counts can themselves be I/O intensive.
    for(const [table,days] of [['swaps',7],['token_transfers',3]] as const) {
      const through=await retentionHorizon(db,days,Math.floor(started/60000)*60000);
      const r=(await db.sql.query<{n:string;oldest:string|null}>(`SELECT count(*)::text AS n,min(block)::text AS oldest FROM ${table} WHERE block<=$1`,[through?.toString() ?? '-1'])).rows[0]!;
      hooks.report({event:'dry_run',rule:table==='swaps'?'raw_swaps':'raw_transfers',rows:Number(r.n),throughBlock:through?.toString() ?? null,oldestRemainingBlock:r.oldest,batchRows:options.batchRows});
    }
    return;
  }
  const acquired=(await source.sql.query<{acquired:boolean}>('SELECT pg_try_advisory_lock(4663,208) AS acquired')).rows[0]?.acquired;
  if(!acquired)throw new BacklogError('Raw history mutex is busy; retry after the active batch or command finishes');
  let total=0;
  const result:RetentionResult={quoteRows:0,idleTokens:0,idleRows:0,pendingRows:0,feedRows:0,dangerCoins:0,quietCoins:0,
    historyTransfers:0,historyLiquidity:0,historyPons:0,historySwaps:0,trendingSnapshots:0,finished:true,skippedRules:[]};
  const progress=async(batch:RawHistoryBatch)=>{
    total+=batch.rows;
    const table=batch.rule==='raw_swaps'?'swaps':'token_transfers';
    const oldest=(await db.sql.query<{block:string|number}>(`SELECT block FROM ${table} WHERE block>=(SELECT after_block FROM raw_history_progress WHERE name=$1) ORDER BY block LIMIT 1`,[table])).rows[0]?.block ?? null;
    hooks.report({event:'batch',...batch,totalRows:total,oldestRemainingBlock:oldest==null?null:String(oldest),
      rowsPerMinute:Math.round(total*60_000/Math.max(1,clock()-started))});
  };
  try {
    let passStarted=started;
    do {
      await rawHistoryPass(db,{quoteTokens:[],swapDays:7,transferDays:3,dryRun:false,pauseMs:options.pauseMs,...inputs},result,passStarted,
        async(rule,work)=>{
          let rows=options.batchRows;
          while(!stopped()) {
            try {await work(()=>!stopped(),rows);break;}
            catch(error) {
              const code=(error as {code?:string})?.code;
              if(code!=='57014' && code!=='55P03' && code!=='40P01')throw error;
              if(stopped())break;
              // Only a failed statement reduces the operator's setting. At one row, fail visibly.
              if(rows===1)throw new BacklogError(`Raw history ${rule} cannot progress even at one row (${code})`);
              rows=Math.max(1,Math.floor(rows/2));
              hooks.report({event:'retry',rule,code,batchRows:rows,totalRows:total});
              if(options.pauseMs)await new Promise(resolve=>setTimeout(resolve,options.pauseMs));
            }
          }
        },{onBatch:progress,pauseEveryBatch:true});
      const latest=clock();
      if(stopped() || Math.floor(latest/60000)===Math.floor(passStarted/60000))break;
      passStarted=latest;
    } while(!stopped());
    hooks.report({event:stopped()?'stopped':'complete',totalRows:total,
      rowsPerMinute:Math.round(total*60_000/Math.max(1,clock()-started))});
  } finally {await source.sql.query('SELECT pg_advisory_unlock(4663,208)');}
}
