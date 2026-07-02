import { acquireScanJob } from './scan-jobs.js';
import { enrichSenders } from './enrich.js';
import { isAddress, type Address } from 'viem';
import { reportIndexerError } from './guard-stop.js';
import { z } from 'zod';
import { loadRegistry, createMeteredClients, RpcGuardError, type RpcEnv } from '@eko/chain';
import { openDb, migrate, migrateEngines, rebuildBars, launchEmitter } from '@eko/db';
import { createClients } from './clients.js';
import { BlockDecoder } from './decode.js';
import { LogHeadFollower } from './log-head.js';
import { HeadFollower } from './head.js';
import { PonsBackfill, blockAtTime, type Stream } from './backfill.js';
import { log, Metrics } from './types.js';
const integer = (fallback: number) => z.coerce.number().int().positive().default(fallback);
const config = z.object({
  APP_ROLE: z.literal('indexer').default('indexer'), DATABASE_URL: z.string().optional(), PGLITE_DIR: z.string().default('.data/indexer'),
  RPC_HTTP_URL: z.url(), RPC_PUBLIC_HTTP_URL: z.url().optional(), RPC_WS_URL: z.url().optional(),
  INDEX_HEAD_MODE: z.enum(['logs', 'blocks']).default('logs'), INDEX_HEAD_TICK_MS: integer(1000), INDEX_HEAD_MAX_RANGE: integer(200), INDEX_CODE_CACHE_SEC: integer(3600), INDEX_TRANSIENT_RETRY_SEC: integer(300),
  INDEX_START_BLOCK: z.preprocess(v => v === '' ? undefined : v, z.coerce.bigint().min(0n).optional()), INDEX_PREFETCH_BLOCKS: integer(32).pipe(z.number().max(128)), INDEX_BACKFILL_WORKERS: integer(4), INDEX_LOG_RANGE: integer(2000).pipe(z.number().max(20000)), INDEX_REORG_DEPTH: integer(256),
});
async function main() {
  const args = process.argv.slice(2).filter(a => a !== '--');
  const option = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
  if (args[0] === 'bars:rebuild') {
    const range = z.object({ from: z.coerce.bigint().min(0n), to: z.coerce.bigint().min(0n) }).parse({ from: option('from'), to: option('to') });
    const db = await openDb({ databaseUrl: process.env.DATABASE_URL, pgliteDir: process.env.PGLITE_DIR });
    try { await migrate(db); await db.tx(tx => rebuildBars(tx, range.from, range.to)); log('bars_rebuilt', { from: range.from.toString(), to: range.to.toString() }); }
    finally { await db.close(); }
    return;
  }
  const parsed = config.safeParse(process.env);
  if (!parsed.success) throw new Error(`Invalid indexer environment: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`);
  const env = { ...process.env, ...parsed.data } as RpcEnv & typeof parsed.data; const registry = loadRegistry();
  const db = await openDb({ databaseUrl: env.DATABASE_URL, pgliteDir: env.PGLITE_DIR });
  const telemetry=launchEmitter(db.sql,()=>log('launch_metrics_unavailable'));
  let worker: HeadFollower | LogHeadFollower | PonsBackfill | undefined;
  let interrupted = false; let failed = false;
  const stop = (reason: 'shutdown_requested' | 'rpc_session_budget_reached' = 'shutdown_requested') => { interrupted = true; if (reason === 'shutdown_requested') log(reason, { finishing_current_transaction: true }); worker?.stop(); meter.stop(reason); };
  const meter = createMeteredClients(env, { db, log, transientRetrySec: env.INDEX_TRANSIENT_RETRY_SEC, onSessionBudget: () => stop('rpc_session_budget_reached') }).meter;
  const signalStop = () => stop();
  process.once('SIGTERM', signalStop); process.once('SIGINT', signalStop);
  meter.start();
  try {
    await migrate(db);
    if(args[0]!=='backfill' && args[0]!=='enrich')await migrateEngines(db);
    const client = createClients(env, registry, meter, { enrich:args[0]==='enrich', head: args[0] !== 'backfill' && env.INDEX_HEAD_MODE === 'logs' });
    if (await client.chainId() !== 4663) throw new Error('RPC chain ID must be 4663');
    if(args[0]==='enrich'){const coin=option('coin');if(!coin||!isAddress(coin))throw new Error('enrich requires --coin <address>');log('senders_enriched',{coin,...await enrichSenders(db,coin as Address,client)});return;}
    const liveMetrics=new Metrics((event,fields)=>{
      log(event,fields);
      if(event==='ingest_metrics' && args[0]!=='backfill'){
        telemetry.emit('role_indexer',1);
        if(liveMetrics.hasHeadMeasurement())telemetry.emit('head_lag_ms',Number(fields?.head_lag_ms));
      }
    });
    const decoder = new BlockDecoder(client, registry, liveMetrics);
    const backfill = args[0] === 'backfill';
    let from = 0n, to = 0n, stream: Stream = 'logs:pons_factory';
    if (backfill) {
      const toBlock = option('to') ?? (await client.head()).toString();
      const fromBlock = option('from') ?? (await blockAtTime(client, BigInt((await (client.header?.(BigInt(toBlock)) ?? client.block(BigInt(toBlock)))).timestamp) - 30n * 86400n, BigInt(toBlock))).toString();
      const parsed = z.object({ stream: z.enum(['logs:pons_factory','logs:pons_curves','logs:pools','logs:pair_swaps','logs:holders']), from: z.coerce.bigint().min(0n), to: z.coerce.bigint().min(0n), workers: integer(env.INDEX_BACKFILL_WORKERS) }).parse({ stream: option('stream'), from: fromBlock, to: toBlock, workers: option('workers') });
      from = parsed.from; to = parsed.to; stream = parsed.stream;
      worker = new PonsBackfill(client, db, decoder, { workers: parsed.workers, logRange: env.INDEX_LOG_RANGE });
    } else {
      worker = env.INDEX_HEAD_MODE === 'blocks'
        ? new HeadFollower(client, db, decoder, { startBlock: env.INDEX_START_BLOCK, prefetchBlocks: env.INDEX_PREFETCH_BLOCKS, reorgDepth: env.INDEX_REORG_DEPTH })
        : new LogHeadFollower(client, db, decoder, { startBlock: env.INDEX_START_BLOCK, tickMs: env.INDEX_HEAD_TICK_MS, maxRange: env.INDEX_HEAD_MAX_RANGE, codeCacheSec: env.INDEX_CODE_CACHE_SEC, reorgDepth: env.INDEX_REORG_DEPTH });
    }
    if (interrupted) return;
    try { log('indexer_started', { role: env.APP_ROLE, mode: backfill ? 'backfill' : 'head' }); if (worker instanceof HeadFollower || worker instanceof LogHeadFollower) {
      const scanClient=createClients(env,registry,meter,{enrich:true});
      const scanLoop=(async()=>{
        while(!interrupted){
          await acquireScanJob(db,scanClient);
          if(!interrupted)await new Promise<void>(resolve=>setTimeout(resolve,1000));
        }
      })().catch(error=>{stop();throw error;});
      const results=await Promise.allSettled([worker.run().finally(()=>{interrupted=true;}),scanLoop]);
      for(const result of results)if(result.status==='rejected')throw result.reason;
    } else await worker.run(stream, from, to); }
    finally { process.removeListener('SIGTERM', signalStop); process.removeListener('SIGINT', signalStop); }
  } catch (error) { failed = true; throw error; } finally {
    process.removeListener('SIGTERM', signalStop); process.removeListener('SIGINT', signalStop);
    try { await telemetry.drain();await meter.close(); } finally { await db.close(); }
    if (!failed && (meter.stopReason === 'rpc_session_budget_reached' || meter.stopReason === 'shutdown_requested')) reportIndexerError(new RpcGuardError(meter.stopReason), log);
  }
}
main().catch(error => { process.exitCode = reportIndexerError(error, log); });
