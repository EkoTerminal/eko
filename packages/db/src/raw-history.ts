import type { ChainDb } from './client.js';
import type { RetentionOptions, RetentionResult } from './retention.js';
import type { RetentionRuleRunner } from './retention-control.js';
import { retentionHorizon, compactTransfers } from './retention.js';
import { compactLifetimeSwaps, preserveGraduation, retentionBatch, reportRows, addReport } from './determination-retention.js';
import { emptyLifetime, readLifetime, saveLifetime } from './lifetime.js';
import { preserveGradePrices } from './rating-retention.js';
import { snapshotTrending } from './trending.js';
import { preserveOutcomeSwaps, preserveOutcomeHoldings } from './raw-history-checkpoints.js';
import { refreshBars } from './market.js';

/** All identities, including quotes, pending and unrated coins. The oldest block is drained before advancing. */
export async function rawHistoryPass(db: ChainDb, options: RetentionOptions, result: RetentionResult, now: number, run: RetentionRuleRunner) {
  const swapDays=options.swapDays ?? 7,transferDays=options.transferDays ?? 3;
  if(!Number.isInteger(swapDays) || swapDays<7 || !Number.isInteger(transferDays) || transferDays<1)throw new Error('Raw history requires at least seven swap days and one transfer day');
  for(const swaps of [true,false]) await run(swaps ? 'raw_swaps' : 'raw_transfers',async(timeLeft,limit)=>{
    const table=swaps ? 'swaps' : 'token_transfers',key=swaps ? 'coin' : 'token';
    if(options.dryRun) {addReport(result,await reportRows(db,table,'',[]));return;}
    const through=await retentionHorizon(db,swaps ? swapDays : transferDays,now);
    if(through==null)return;
    if(swaps) {
      let complete=false;
      while(timeLeft() && !complete) {
        const saved=await retentionBatch(db,tx=>snapshotTrending(tx,through,1),options.pauseMs);result.trendingSnapshots+=saved.saved;complete=saved.complete;
      }
      if(!complete){result.finished=false;return;}
    }
    while(timeLeft()) {
      const moved=await retentionBatch(db,async tx=>{
        // Shares the reorg lock. No deletion can race a rollback or a partition rewrite.
        await tx.sql.query(`LOCK TABLE swaps,token_transfers IN SHARE ROW EXCLUSIVE MODE`);
        const oldest=(await tx.sql.query<{coin:Uint8Array;block:string}>(`SELECT ${key} AS coin,block FROM ${table}
          WHERE ts<$2 AND block<=$1
          ORDER BY ts,block,tx_hash,log_index LIMIT 1 FOR UPDATE`,[through.toString(),new Date(Math.floor((now-(swaps ? swapDays : transferDays)*86400000)/60000)*60000)])).rows[0];
        if(!oldest) {
          // A completed horizon also rejects later backfills into already summarised gaps.
          await tx.sql.query(`INSERT INTO raw_history_watermarks(name,through_block) VALUES($1,$2)
            ON CONFLICT(name) DO UPDATE SET through_block=greatest(raw_history_watermarks.through_block,excluded.through_block)`,[table,through.toString()]);
          return 0;
        }
        const coin=oldest.coin,target=BigInt(oldest.block);
        if(!await readLifetime(tx,coin)) {
          const data=emptyLifetime();
          if((await tx.sql.query('SELECT 1 FROM history_prunes WHERE coin=$1 AND transfers+swaps+liquidity+pons>0',[coin])).rows.length) {
            data.legacyIncomplete=true;data.earlyComplete=false;data.usdComplete=false;
          }
          await saveLifetime(tx,coin,data);
        }
        await preserveGraduation(tx,coin,target);
        let n:number;
        if(swaps) {
          await preserveOutcomeSwaps(tx,coin,(await readLifetime(tx,coin))!,through);
          // Capture every completed grade while all of its raw samples still exist.
          await preserveGradePrices(tx,coin,new Date(now),new Date(now-swapDays*86400000+3600000));
          const minutes=(await tx.sql.query<{minute:Date}>(`SELECT DISTINCT date_trunc('minute',ts) AS minute FROM (
            SELECT ts FROM swaps WHERE coin=$1 AND block<=$2 ORDER BY block,log_index,tx_hash LIMIT $3) s`,[coin,target.toString(),limit])).rows;
          // Freeze the complete bar before the first partial-minute batch. Later rebuilds keep this summary.
          for(const {minute} of minutes) {
            const frozen=(await tx.sql.query('SELECT 1 FROM raw_history_bar_keys WHERE coin=$1 AND minute=$2',[coin,minute])).rows.length;
            if(!frozen) {
              await refreshBars(tx,[{coin,minute}]);
              await tx.sql.query('INSERT INTO raw_history_bar_keys VALUES($1,$2) ON CONFLICT DO NOTHING',[coin,minute]);
            }
          }
          n=await compactLifetimeSwaps(tx,coin,target,limit,options.firstBlocks,options.cohortSec,options.poolManager,false,true);
          await preserveOutcomeSwaps(tx,coin,(await readLifetime(tx,coin))!,through);
        } else {
          await preserveOutcomeHoldings(tx,coin,through);
          n=await compactTransfers(tx,[coin],target,limit);
          if(n)await tx.sql.query('UPDATE coin_lifetime SET revision=revision+1 WHERE coin=$1',[coin]);
        }
        if(n)await tx.sql.query(`INSERT INTO raw_history_watermarks(name,through_block) VALUES($1,$2)
          ON CONFLICT(name) DO UPDATE SET through_block=greatest(raw_history_watermarks.through_block,excluded.through_block)`,[table,target.toString()]);
        return n;
      },options.pauseMs);
      result[swaps ? 'historySwaps' : 'historyTransfers']+=moved;
      if(!moved)return;
    }
    result.finished=false;
  });
}
