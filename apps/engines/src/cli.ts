import { openDb, migrate, migrateEngines, PostgresBus, launchEmitter } from '@eko/db';
import { createMeteredClients, loadRegistry, ProgressWatchdog, type PonsProfileClient } from '@eko/chain';
import { z } from 'zod';
import type { BlockReader } from './activity.js';
import { EngineWorker } from './worker.js';
import { SellChecker, SellCheckScheduler } from './sell-check.js';
const flag=z.enum(['true','false','1','0','']).optional().transform(v=>v==='true' || v==='1');
const config=z.object({
  APP_ROLE:z.literal('engines').default('engines'),ENGINE_MODE:z.enum(['live','replay']).default('live'),
  DATABASE_URL:z.string().optional(),PGLITE_DIR:z.string().default('.data/indexer'),RPC_HTTP_URL:z.url().optional(),
  FROM:z.coerce.number().int().nonnegative().safe().optional(),TO:z.coerce.number().int().nonnegative().safe().optional(),
  ENGINE_CONCURRENCY:z.coerce.number().int().min(1).max(32).default(4),ENGINE_POLL_MS:z.coerce.number().int().min(100).max(60000).default(2000),
  // Live catch-up: checkpoints further behind head than this are coalesced into one current evaluation per coin.
  // 604800 (seven days) keeps full catch-up; ENGINE_MODE=replay fills skipped history.
  ENGINE_LIVE_BACKLOG_SEC:z.coerce.number().int().min(60).max(604800).default(900),
  ENGINE_LIVE_SLICE_MS:z.coerce.number().int().min(1000).max(3600000).default(60000),
  // Live loop silent (no poll completed, no evaluation finished) this long: log engines_stalled and exit 1.
  ENGINE_STALL_SEC:z.coerce.number().int().min(60).max(86400).default(600),
  // Live sell checks (BACKEND §6.2, eth_call probe). Off unless set; needs RPC_HTTP_URL and runs in live mode only.
  SELL_CHECK_ENABLED:flag,
  SELL_CHECK_POLL_MS:z.coerce.number().int().min(1000).max(600000).default(5000),
  SELL_CHECK_BATCH:z.coerce.number().int().min(1).max(64).default(8),
  SELL_CHECK_DAILY_REQUESTS:z.coerce.number().int().min(0).max(5000000).default(60000),
  SELL_CHECK_MIN_INTERVAL_SEC:z.coerce.number().int().min(60).max(86400).default(600),
  SELL_CHECK_MAX_AGE_SEC:z.coerce.number().int().min(600).max(604800).default(86400),
});
async function main() {
  const parsed=config.safeParse(process.env);
  if (!parsed.success) throw new Error(`Invalid engine environment: ${parsed.error.issues.map(i=>i.path.join('.')).join(', ')}`);
  const env=parsed.data;
  loadRegistry();
  if (env.ENGINE_MODE==='replay' && (env.FROM==null || env.TO==null || env.TO<env.FROM)) throw new Error('Replay requires FROM <= TO');
  const db=await openDb({ databaseUrl:env.DATABASE_URL,pgliteDir:env.PGLITE_DIR });
  let readBlock:BlockReader | undefined;
  let client: PonsProfileClient | undefined;
  let stopWorker:() => void=() => {};
  let watchdog: ProgressWatchdog | undefined;
  // Every chain read goes through the metered transport (task 024), sharing this process's database for usage.
  const rpc=env.RPC_HTTP_URL ? createMeteredClients(process.env,{ db,onSessionBudget:() => { rpc?.meter.stop('rpc_session_budget_reached');stopWorker(); } }) : undefined;
  if (rpc) {
    if (await rpc.paid.getChainId()!==4663) throw new Error('RPC chain ID must be 4663');
    readBlock=async block=>{const header=await rpc.header(BigInt(block));return {timestamp:header.timestamp,hash:header.hash};};
    readBlock.readMany=blocks=>Promise.all(blocks.map(block=>readBlock!(block)));
    client={ getCode:input=>rpc.archive.getCode(input),readContract:async input=>{
      const value=await rpc.archive.readContract(input);
      if (typeof value!=='bigint') throw new Error('Unexpected Pons read result');
      return value;
    } };
  }
  try {
    await migrate(db);await migrateEngines(db);
    const telemetry=launchEmitter(db.sql,()=>console.log(JSON.stringify({event:'launch_metrics_unavailable'})));
    let heartbeatAt=0;
    let progressAt=Date.now();
    const log=(event:string,fields:Record<string,unknown>)=>console.log(JSON.stringify({event,...fields}));
    // The live loop shares the indexer's metered RPC; a loop that goes silent exits non-zero for a platform restart.
    const stallWatch=watchdog=env.ENGINE_MODE==='live' ? new ProgressWatchdog({ role:'engines',stallMs:env.ENGINE_STALL_SEC*1000,log,reportMs:Infinity }) : undefined;
    if(env.SELL_CHECK_ENABLED && (!rpc || env.ENGINE_MODE!=='live'))log('sell_check_unavailable',{reason:rpc ? 'replay_mode' : 'rpc_not_configured'});
    // Every probe goes through the process meter (paid archive route, pinned block) and the daily cap below.
    const sellChecks=env.SELL_CHECK_ENABLED && rpc && env.ENGINE_MODE==='live' ? new SellCheckScheduler(db,new SellChecker(db,{request:request=>rpc.archive.request(request as never)}),
      {batch:env.SELL_CHECK_BATCH,dailyRequests:env.SELL_CHECK_DAILY_REQUESTS,minIntervalSec:env.SELL_CHECK_MIN_INTERVAL_SEC,maxAgeSec:env.SELL_CHECK_MAX_AGE_SEC},log) : undefined;
    const worker=new EngineWorker(db,{ client,readBlock,onScanComplete:ms=>telemetry.emit('pair_to_complete_verdict_ms',ms),onQueueCompletion:ms=>telemetry.emit('queue_completion_ms',ms),onHeartbeat:()=>{stallWatch?.progress();if(Date.now()-heartbeatAt>=30000){telemetry.emit('role_engines',1);heartbeatAt=Date.now();}},onPlanned:plan=>console.log(JSON.stringify({event:'replay_planned',...plan})),onProgress:(evaluations,block)=>{stallWatch?.progress();if(evaluations%100===0 || Date.now()-progressAt>=30000){console.log(JSON.stringify({event:'engine_progress',evaluations,block,...worker.telemetry()}));progressAt=Date.now();}},concurrency:env.ENGINE_CONCURRENCY,pollMs:env.ENGINE_POLL_MS,liveBacklogSec:env.ENGINE_LIVE_BACKLOG_SEC,liveSliceMs:env.ENGINE_LIVE_SLICE_MS,onLivePlanned:plan=>{if(plan.coalescedCheckpoints || plan.firstScans>10)console.log(JSON.stringify({event:'live_planned',...plan}));},bus:env.DATABASE_URL ? new PostgresBus(env.DATABASE_URL) : db.bus });
    let interrupted=false;
    const stop=()=>{interrupted=true;worker.stop();sellChecks?.stop();};stopWorker=stop;process.on('SIGINT',stop);process.on('SIGTERM',stop);
    try {
      console.log(JSON.stringify({ event:'engines_started',role:env.APP_ROLE,mode:env.ENGINE_MODE }));
      if (env.ENGINE_MODE==='replay') {const evaluations=await worker.replay(env.FROM!,env.TO!);console.log(JSON.stringify({event:interrupted?'replay_interrupted':'replay_complete',evaluations,...worker.summary(),...worker.telemetry()}));}
      else {
        if(sellChecks)log('sell_check_started',{pollMs:env.SELL_CHECK_POLL_MS,batch:env.SELL_CHECK_BATCH,dailyRequests:env.SELL_CHECK_DAILY_REQUESTS});
        const checks=sellChecks?.run(env.SELL_CHECK_POLL_MS);
        stallWatch?.start();
        try {await worker.run();} finally {sellChecks?.stop();await checks;}
      }
      console.log(JSON.stringify({ event:'engines_stopped',mode:env.ENGINE_MODE }));
    } finally { process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);await telemetry.drain(); }
  } finally { try { await rpc?.meter.close();await db.close(); } finally { watchdog?.stop(); } }
}
main().catch(error=>{ console.error(error instanceof Error && /^Missing (launch|activity) timestamp at block [0-9]+; provide RPC_HTTP_URL for archive headers$/.test(error.message) ? error.message : 'Engines halted: check environment, indexed range and database.');process.exitCode=1; });
