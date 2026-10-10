import { refreshFlows, refreshCoinFlow, type FlowOptions } from './watcher/flow-store.js';
import { refreshFingerprints, replayFingerprints, type FingerprintOptions } from './watcher/store.js';
import { writeRegistryLabels } from './registry-labels.js';
import { expireSimulationTraces } from './reference-simulation.js';
import { expireV4ReferenceTraces } from './v4-reference.js';
import { binary, hex, publishReceipt, ScanJobs, scanTarget, recordScanStart, recordScanVerdict, type ChainDb, type EngineBus } from '@eko/db';
import { assembleVerdict, evaluatePlaybooks, rules, RULES_VERSION } from '@eko/playbooks';
import { shouldRecomputeSignal } from '@eko/signal';
import type { PonsProfileClient } from '@eko/chain';
import type { Address, CoinCard, PlaybookId, Verdict } from '@eko/shared';
import { assembleCard, cardHash, digest, evaluatedPlaybooks, UNSOURCED_PLAYBOOKS } from './card.js';
import { loadSources, historyAt, seconds, type LoadedSources, type SourceMemo } from './sources.js';
import { refreshClock, resolveClock, coinActivity, checkpoints, blockIndex, type ActivityBase, type BlockReader, type BlockTime, type ClockCache, type Checkpoint, type CoinActivity } from './activity.js';
import { LiveActivity, baseColumns, leaveActivityFeed, type LiveActivityStats } from './live-activity.js';
import { materializeHistory, updateOutcomes, OUTCOME_LOADS_PER_WRITE, type OutcomeBudget, type OutcomeQueue } from './outcomes.js';
/** Blocks to wait before reloading a coin whose sources were unavailable: doubles per attempt, from about two minutes to about twelve hours. */
export const retryAfterBlocks=(attempts:number)=>Math.min(2**Math.max(1,Math.min(attempts,10)),1024)*600;
import { performance } from 'node:perf_hooks';
import { ReplayCache, type WriteState } from './replay-cache.js';
import { persistShadowGuardV2 } from './shadow-v2.js';
import { ReplayMetrics } from './metrics.js';
import { verdictReceipt } from './receipt.js';
import { historyPrune, historyPrunes, revivedBy } from './history-prunes.js';

export interface WorkerOptions {
  fingerprints?:FingerprintOptions;
  flow?:FlowOptions;
  /** Explicit configured normalizer acquisition; never called for retrospective replay. */
  referenceSimulation?: (coin:Address,block:number)=>Promise<void>;
  onScanComplete?: (ms:number)=>void; onScanQueueDelay?: (ms:number)=>void;
  onQueueCompletion?: (ms: number) => void; onHeartbeat?: () => void;
  concurrency?: number; pollMs?: number; client?: PonsProfileClient; bus?: EngineBus; readBlock?: BlockReader; now?: () => number; replayCache?:boolean;marketWindow?:boolean; onPlanned?:(plan:{tasks:number;coins:number;from:number;to:number})=>void; onProgress?: (completed:number,block:number) => void;
  /**
   * Live only. Checkpoints older than this many seconds behind the indexed head are not replayed one by one:
   * the coin is evaluated once at its newest checkpoint (or at head). Unset keeps full catch-up, as replay does.
   * Skipped history can be filled later with ENGINE_MODE=replay, which skips runs that already exist.
   */
  liveBacklogSec?: number;
  /** Live only. After this long, a poll yields to a newer launch so its first scan is not queued behind backlog. */
  liveSliceMs?: number;
  /** Overdue outcome horizons per live card write; defaults to OUTCOME_LOADS_PER_WRITE. */
  outcomeLoadsPerWrite?: number;
  /**
   * Live only. 'incremental' (default) reads only what changed since the previous poll and plans from per-coin progress
   * (live-activity.ts); 'full' aggregates every coin's whole history on every poll, as replay does.
   */
  liveActivity?: 'incremental' | 'full';
  /** Live, incremental only: what each poll's activity refresh read. */
  onLiveActivity?: (stats:LiveActivityStats) => void;
  /** Live only: every planned checkpoint, in execution order (tests compare plans across activity modes). */
  onLiveTasks?: (tasks:readonly Checkpoint[]) => void;
  /**
   * Live only: evaluation-phase progress, every `evaluationReportMs` (default 60000) while a poll evaluates, whether or
   * not any card completed, and once when the phase ends.
   */
  onEvaluation?: (progress:EvaluationProgress) => void;
  evaluationReportMs?: number;
  onLivePlanned?: (plan:LivePlan) => void }
export interface LivePlan { tasks:number; coins:number; firstScans:number; coalescedCheckpoints:number; to:number }
/**
 * One live poll's evaluation phase so far: tasks attempted, skipped (a run already exists), failed (sources
 * unavailable) and completed (cards written), outcome horizons evaluated in write transactions and whether outcomes are
 * still being caught up, and what the poll is doing now.
 */
export interface EvaluationProgress {
  to:number; tasks:number; attempted:number; skipped:number; failed:number; completed:number;
  outcomeLoads:number; outcomesPending:boolean; phase:'sources'|'write'|'outcomes'|'done'; sec:number;
}
interface Schedule { coin: Uint8Array; first_block: string; last_block: string | null; last_sec: string | null; price: number | null; last_trade: Date | null }
/** A coin a poll may plan: its newest event time, revision (as stored), progress base and retention revival. */
interface PlanInput { coin:Address; firstBlock:number; lastSec:number; revision:string; base:ActivityBase | null; revived:(watermark:number)=>number | undefined; inRange:boolean; activity?:CoinActivity }
/** Blocks commit in order (in live polls, first scans of new launches commit ahead of older backlog). Source reads are
 * bounded; rule/history writes remain serial to preserve prior-launch ordering. */
export class EngineWorker {
  private stopped=false;
  private clock:ClockCache=new Map();
  private evaluated=new Map<Address,Pick<Verdict, 'level' | 'playbooks'>>();
  private live:LiveActivity;
  private feedLeft=false;
  private cache:ReplayCache | undefined;
  private metrics=new ReplayMetrics();
  private completed=0;
  private cardFailures=0;
  /**
   * Return replay/work counters and card-failure totals without new I/O or authentication. Host
   * diagnostic read; counters describe this worker instance, not whole-system completeness.
   * @see {@link ../../../SECURITY.md#privileged-powers | Privileged powers}
   * @see {@link ../../../docs/security/INVARIANTS.md | Implemented core invariants}
   */
  telemetry(){return {...this.metrics.snapshot(this.completed),cardFailures:this.cardFailures};}
  private client:PonsProfileClient | undefined;
  private readBlock:BlockReader | undefined;
  /**
   * Count this instance's evaluated coin verdicts and playbook levels without new
   * I/O/authentication. Host diagnostic read; absent evaluations are not inferred to be clear.
   * @see {@link ../../../SECURITY.md#privileged-powers | Privileged powers}
   * @see {@link ../../../docs/security/INVARIANTS.md | Implemented core invariants}
   */
  summary() {
    const verdicts={clear:0,pending:0,monitor:0,danger:0};
    const playbooks:Record<string,{info:number;monitor:number;danger:number}>={};
    for(const verdict of this.evaluated.values()) {
      verdicts[verdict.level]++;
      for(const match of verdict.playbooks) {
        const counts=playbooks[match.id] ??= {info:0,monitor:0,danger:0};
        if(match.level!=='clear')counts[match.level]++;
      }
    }
    return {coinsEvaluated:this.evaluated.size,verdicts,playbooks};
  }
  private wake: (() => void) | undefined;
  /**
   * Wire storage and optional acquisition callbacks, enforcing concurrency 1-32 and positive finite
   * poll interval. Engines operator construction only; invalid options throw and no work starts yet.
   * @see {@link ../../../SECURITY.md#privileged-powers | Privileged powers}
   * @see {@link ../../../docs/security/INVARIANTS.md | Implemented core invariants}
   */
  constructor(readonly db: ChainDb, readonly options: WorkerOptions = {}) {
    this.client=options.client ? this.metrics.profile(options.client) : undefined;
    this.live=new LiveActivity(db);
    this.readBlock=options.readBlock ? this.metrics.headers(options.readBlock) : undefined;
    if (!Number.isInteger(options.concurrency ?? 4) || (options.concurrency ?? 4)<1 || (options.concurrency ?? 4)>32) throw new Error('Invalid engine concurrency');
    if (!Number.isFinite(options.pollMs ?? 2000) || (options.pollMs ?? 2000)<1) throw new Error('Invalid engine poll interval');
  }
  /**
   * Set stop state and wake polling sleeps. Host lifecycle only; in-flight source reads/current
   * transaction may finish and prior writes remain.
   * @see {@link ../../../SECURITY.md#privileged-powers | Privileged powers}
   * @see {@link ../../../docs/security/INVARIANTS.md | Implemented core invariants}
   */
  stop() { this.stopped=true; this.wake?.(); }
  /**
   * Validate interval and replay retained activity with ordered rule/history writes, clearing replay
   * cache in finally. Engines operator only; invalid interval/source/provider/SQL failures reject.
   * Retrospective mode does not invoke live reference simulation.
   * @see {@link ../../../SECURITY.md#privileged-powers | Privileged powers}
   * @see {@link ../../../docs/security/INVARIANTS.md | Implemented core invariants}
   */
  async replay(from: number, to: number) {
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from<0 || to<from) throw new Error('Invalid replay interval');
    await refreshClock(this.db,this.clock);
    await this.refreshRegistryLabels();
    let after:import('./watcher/store.js').ReplayCursor|undefined;
    do {const batch=await replayFingerprints(this.db,from,to,{...this.options.fingerprints,after});after=batch.next??undefined;}while(after&&!this.stopped);
    const flowCoins=(await this.db.sql.query<{coin:Uint8Array}>('SELECT DISTINCT coin FROM swaps WHERE block BETWEEN $1 AND $2',[from,to])).rows;
    const fromTime=(await resolveClock(this.db,from,undefined,this.clock))?.ts;
    for(const row of flowCoins)if(await this.db.blockHash(BigInt(to)))await refreshCoinFlow(this.db,hex(row.coin),to,this.flowOptions,fromTime==null?undefined:seconds(fromTime)-1);
    try{return await this.evaluateActivity(from,to,false);}finally{this.cache=undefined;}
  }
  private get flowOptions():FlowOptions {
    return {...this.options.flow,modelVersion:this.options.flow?.modelVersion??this.options.fingerprints?.model?.version};
  }
  private registryLabelRevision:string|null=null;
  private async refreshRegistryLabels() {
    const revision=(await this.db.sql.query<{revision:string}>(`SELECT md5(coalesce((SELECT string_agg(agent_id::text || ':' || wallet_block::text || ':' || encode(block_hash,'hex'),',' ORDER BY agent_id,wallet_block) FROM agent_registry),'') || ':' ||
      coalesce((SELECT string_agg(id,',' ORDER BY id) FROM wallet_labels WHERE source<>'erc8004'),'')) AS revision`)).rows[0].revision;
    if(revision===this.registryLabelRevision)return;
    await writeRegistryLabels(this.db);this.registryLabelRevision=revision;
  }
  private startup=true;
  private yielded=false;
  /** Coins whose head refresh already ran in the current startup sequence. */
  private startupDone=new Set<Address>();
  /** Outcomes that could not be decided yet, by coin and horizon, with the time they were last tried. */
  private outcomeSkips=new Map<string,number>();
  /**
   * Expire traces, refresh registry/clock state, reconcile cursor and process bounded scan/activity
   * work before advancing the engine cursor. Engines role only; missing head returns zero, orphaned
   * cursor/provider/source/SQL failures reject; incomplete inputs remain explicit failures/pending
   * results.
   * @see {@link ../../../SECURITY.md#privileged-powers | Privileged powers}
   * @see {@link ../../../docs/security/INVARIANTS.md | Implemented core invariants}
   */
  async poll() {
    await expireSimulationTraces(this.db);
    await expireV4ReferenceTraces(this.db);
    await this.refreshRegistryLabels();
    await refreshClock(this.db,this.clock);
    await this.reconcile();
    // One indexed max per table: a max over their UNION read every row of every table on each poll.
    const head=(await this.db.sql.query<{number:string | null}>(`SELECT greatest(
      (SELECT max(number) FROM engine_block_times), (SELECT max(first_block) FROM tokens), (SELECT max(block) FROM pons_events),
      (SELECT max(block) FROM pons_exemptions), (SELECT max(created_block) FROM pools)) AS number`)).rows[0];
    if (head.number==null) return 0;
    const to=Number(head.number);
    await refreshFingerprints(this.db,to,this.options.fingerprints);
    await refreshFlows(this.db,to,this.flowOptions);
    // Recover post-commit timing/job acknowledgements after process failure. Bound each poll.
    const unrecorded=(await this.db.sql.query<{data:CoinCard}>(`SELECT c.data FROM coin_card_latest c JOIN scan_timings t ON t.coin=c.coin
      WHERE c.as_of_block>=t.discovery_block AND (t.first_verdict_at IS NULL OR (t.critical_complete_at IS NULL AND c.data->'verdict'->>'level'<>'pending'
        AND jsonb_array_length(coalesce(c.data->'verdict'->'evaluatedPlaybooks','[]'::jsonb))+(NOT coalesce(c.data->'verdict'->'evaluatedPlaybooks','[]'::jsonb) ? 'bundle_dump')::int=13)) ORDER BY t.discovered_at LIMIT 256`)).rows;
    for(const row of unrecorded)await this.recordScan(row.data);
    const scans=await this.processScanJobs(to);
    const count=scans+await this.evaluateActivity(0,to,true,this.startup);
    // A startup poll that yielded to a new launch has not refreshed every coin yet; the next poll continues it.
    // Only a startup poll continues: a yielded ordinary poll must not restart the full refresh.
    this.startup=this.startup && this.yielded;
    if(!this.startup)this.startupDone.clear();
    await this.db.sql.query("INSERT INTO engine_cursors VALUES('engines',$1,$2) ON CONFLICT(stream) DO UPDATE SET block=excluded.block,hash=excluded.hash",[to,(await resolveClock(this.db,to,undefined,this.clock))?.hash ?? null]);
    return count;
  }
  /** On-demand jobs reuse source acquisition, pure rules and the existing receipt writer.
   * @remarks
   * Claim bounded engine jobs and acquire sources/probes, then verify lease/current block and
   * persist rule/history/receipt state before acknowledgement. Engines role only; missing evidence
   * leaves waiting/pending and processing errors record job failure. Job-store failure may reject
   * and no API writes chain truth.
   * @see {@link ../../../SECURITY.md#privileged-powers | Privileged powers}
   * @see {@link ../../../docs/security/INVARIANTS.md | Implemented core invariants}
   */
  async processScanJobs(block:number) {
    const jobs=new ScanJobs(this.db,()=> (this.options.now?.() ?? Date.now()/1000)*1000);
    let completed=0;
    for(let i=0;i<(this.options.concurrency ?? 4) && !this.stopped;i++) {
      const job=await jobs.claim('engine');if(!job)break;
      this.options.onScanQueueDelay?.(Math.max(0,jobs.now()-new Date(job.created_at).getTime()));
      try {
        const coin=scanTarget(job)!;
        const header=await resolveClock(this.db,block,this.readBlock,this.clock);
        if(!header)throw new Error('Missing scan block');
        // A quiet coin whose raw history retention dropped keeps its last card until it trades again: a rescan could
        // only re-check it with partial history.
        const prune=await historyPrune(this.db,coin);
        if(prune && !(await revivedBy(this.db,coin,prune,block)) && (await this.db.sql.query('SELECT 1 FROM coin_card_latest WHERE coin=$1',[binary(coin)])).rows.length) {
          await jobs.finish(job,'done','ready');completed++;continue;
        }
        await recordScanStart(this.db,coin,(this.options.now?.() ?? Date.now()/1000)*1000);
        await this.options.referenceSimulation?.(coin,block);
        const sources=await loadSources(this.db,coin,block,this.client,this.clock);
        if(!sources){this.cardFailures++;await jobs.finish(job,'waiting','pending','indexed_launch_evidence_unavailable');continue;}
        const card=await this.db.tx(async tx=>{
          const owner=(await tx.sql.query<{lease_id:string}>('SELECT lease_id FROM scan_jobs WHERE id=$1 FOR UPDATE',[job.id])).rows[0];
          if(owner?.lease_id!==job.lease_id)return;
          await tx.sql.query('LOCK TABLE engine_schedule IN EXCLUSIVE MODE');
          const canonicalHash=await tx.blockHash(BigInt(block));
          if(header.hash && canonicalHash!=null && canonicalHash!==hex(header.hash))throw new Error('Indexed block changed during scan preparation');
          await updateOutcomes(tx,sources.asOfBlock,sources.asOfSec,this.clock,undefined,this.outcomeSkips,{loads:this.options.outcomeLoadsPerWrite ?? OUTCOME_LOADS_PER_WRITE,used:0});
          sources.history=await historyAt(tx,sources.deployer,coin,sources.asOfBlock);
          return this.persistRun(tx,sources);
        });
        if(card){await this.recordScan(card);await jobs.finish(job,'done','ready');completed++;}
      } catch {await jobs.fail(job,'engine');}
    }
    return completed;
  }
  private async recordScan(card:CoinCard) {
    const ms=await recordScanVerdict(this.db,card,(this.options.now?.() ?? Date.now()/1000)*1000);
    if(ms!==undefined)this.options.onScanComplete?.(ms);
  }
  private async evaluateActivity(from:number,to:number,live:boolean,startup=false) {
    // Live polls read only what changed since the previous poll (live-activity.ts) and plan exactly what the full
    // history plans; replay and ENGINE_LIVE_ACTIVITY=full read every coin's whole history.
    const incremental=live && this.options.liveActivity!=='full';
    const prunes=await historyPrunes(this.db);
    let inputs:PlanInput[],clock:BlockTime[];
    if(incremental) {
      const loaded=await this.live.refresh(to,this.options.now?.() ?? Date.now()/1000,prunes,{readBlock:this.readBlock,cache:this.clock,concurrency:this.options.concurrency ?? 4,stopped:()=>this.stopped});
      if(!loaded){this.yielded=false;return 0;}
      clock=loaded.clock;
      inputs=loaded.coins.map(coin=>({coin:coin.coin,firstBlock:coin.firstBlock,lastSec:coin.lastSec,revision:coin.revision,base:coin.base,revived:()=>coin.revived,inRange:true}));
      if(this.live.stats)this.options.onLiveActivity?.(this.live.stats);
    } else {
      if(live && !this.feedLeft){await leaveActivityFeed(this.db);this.feedLeft=true;}
      const coins=await coinActivity(this.db,to,this.readBlock,this.clock,this.options.concurrency ?? 4,()=>this.stopped,live);
      clock=(await this.db.sql.query<{number:string;ts:Date}>('SELECT number,ts FROM engine_block_times WHERE number<=$1 ORDER BY number',[to])).rows.map(row=>({number:Number(row.number),sec:seconds(row.ts)}));
      inputs=coins.map(coin=>({coin:coin.coin,firstBlock:coin.firstBlock,lastSec:coin.events.reduce((latest,event)=>Math.max(latest,event.sec),coin.createdSec),
        revision:digest({activity:coin.revision,rulesVersion:RULES_VERSION}),base:coin.base ?? null,
        revived:watermark=>coin.events.find(event=>event.block>watermark && (event.kind==='swap' || event.kind==='transfer'))?.block,
        inRange:coin.firstBlock>=from || coin.events.some(event=>event.block>=from && event.block<=to),activity:coin}));
    }
    // A token without a deployer (WETH, USDG and every other non-launchpad token) never gets a card (readSources). It
    // trades often, so the failure backoff below never held it: it stayed a first scan and went ahead of every real
    // launch on each poll. It is planned again once the indexer records a deployer.
    if(live && inputs.length) {
      const ready=new Set((await this.db.sql.query<{address:Uint8Array}>('SELECT address FROM tokens WHERE address=ANY($1) AND deployer IS NOT NULL',
        [inputs.map(input=>binary(input.coin))])).rows.map(row=>hex(row.address)));
      inputs=inputs.filter(input=>ready.has(input.coin));
    }
    const index=blockIndex(clock);
    const now=this.options.now?.() ?? Date.now()/1000;
    const states=new Map((incremental ? await this.db.sql.query<{coin:Uint8Array;revision:string;through_block:string}>('SELECT * FROM engine_activity_state WHERE coin=ANY($1)',[inputs.map(input=>binary(input.coin))])
      : await this.db.sql.query<{coin:Uint8Array;revision:string;through_block:string}>('SELECT * FROM engine_activity_state')).rows.map(row=>[hex(row.coin),row]));
    // Live: a coin with no card yet shows "Scanning…". Its sources may be unavailable for a while (launch identity
    // not enriched yet, no block clock): a failed load is retried after a growing number of blocks, not on every
    // poll and every restart. At head, thousands of such retries starved the scans that could succeed.
    const scanned=!live ? undefined : new Set((incremental ? await this.db.sql.query<{coin:Uint8Array}>('SELECT coin FROM coin_card_latest WHERE coin=ANY($1)',[inputs.map(input=>binary(input.coin))])
      : await this.db.sql.query<{coin:Uint8Array}>('SELECT coin FROM coin_card_latest')).rows.map(row=>hex(row.coin)));
    const failures=!live ? undefined : new Map((await this.db.sql.query<{coin:Uint8Array;attempts:string;last_block:string}>('SELECT coin,attempts::text,last_block::text FROM engine_card_failures WHERE coin=ANY($1)',
      [inputs.filter(input=>!scanned!.has(input.coin)).map(input=>binary(input.coin))])).rows.map(row=>[hex(row.coin),{attempts:Number(row.attempts),block:Number(row.last_block)}]));
    const tasks:Checkpoint[]=[];
    const revised=new Set<Address>();
    const pending:PlanInput[]=[];
    const backlog=live ? this.options.liveBacklogSec : undefined,head=clock.at(-1);
    let coalesced=0;
    const since=new Map<Address,number>();
    const decisions:{input:PlanInput;refreshHead:boolean;changed:boolean;planFrom:number;revived?:number}[]=[];
    for (const input of inputs) {
      // Retention removed this coin's raw history up to its watermark (the removed rows also change its revision).
      // It is evaluated again only from its first swap or transfer after that, never at a checkpoint in the gap.
      const prune=prunes.get(input.coin);
      const revived=prune ? input.revived(prune.watermark) : undefined;
      if(prune && (revived===undefined || revived>to))continue;
      if (!input.inRange && !live) continue;
      if(live && now-input.lastSec>=7*86400)continue;
      const state=states.get(input.coin);
      const refreshHead=startup && !this.startupDone.has(input.coin);
      if(live && !refreshHead && state?.revision===input.revision && Number(state.through_block)>=to)continue;
      const failure=failures?.get(input.coin);
      if(failure && state?.revision===input.revision && to-failure.block<retryAfterBlocks(failure.attempts))continue;
      if(live && state?.revision!==input.revision)revised.add(input.coin);
      decisions.push({input,refreshHead,changed:state?.revision!==input.revision,planFrom:live && state ? Math.max(from,Number(state.through_block)+1) : from,revived});
    }
    // Incremental plans are read in one batch; they equal checkpoints() over the coin's whole history.
    const resumed=incremental ? await this.live.plans(decisions.map(decision=>({coin:decision.input.coin,from:decision.planFrom})),to) : undefined;
    for (const {input,refreshHead,changed,planFrom,revived} of decisions) {
      let plan=resumed ? resumed.get(input.coin)! : checkpoints(input.activity!,clock,planFrom,to,index);
      if(live && (refreshHead || changed) && clock.length && now-clock.at(-1)!.sec<7*86400) {
        const head=clock.at(-1)!;
        if(!plan.some(point=>point.block===head.number))plan.push({coin:input.coin,block:head.number,sec:head.sec});
      }
      if(revived!==undefined)plan=plan.filter(point=>point.block>=revived);
      if(backlog!==undefined && head) {
        // A lagging live engine replayed every historical checkpoint in block order. Each one reloads the coin's
        // whole history and rebuilds holders, so lag fed itself. TODO(spec): §6.5 triggers assume no lag; skip, then replay.
        const recent=plan.filter(point=>head.sec-point.sec<=backlog);
        if(recent.length<plan.length) {
          coalesced+=plan.length-recent.length;
          // The coin keeps the queue place of its oldest dropped checkpoint, or newer work would starve it.
          since.set(input.coin,plan[0].block);
          plan=recent.length ? recent : [{coin:input.coin,block:head.number,sec:head.sec}];
        }
      }
      tasks.push(...plan);pending.push(input);
    }
    // Live: a coin with no card yet shows "Scanning…"; its first scan goes before any refresh of scanned coins,
    // newest launch first. One deployer's launches run oldest first, so each sees its siblings in deployer history.
    // Each coin's own checkpoints stay in block order. Replay keeps strict block order.
    const launched=new Map(inputs.map(input=>[input.coin,input.firstBlock]));
    const first=(coin:Address)=>!!scanned && !scanned.has(coin);
    const firstCoins=[...new Set(tasks.filter(task=>first(task.coin)).map(task=>task.coin))];
    const deployerOf=new Map<Address,string>(firstCoins.map(coin=>[coin,coin]));
    if(firstCoins.length)for(const row of (await this.db.sql.query<{address:Uint8Array;deployer:Uint8Array|null}>('SELECT address,deployer FROM tokens WHERE address=ANY($1)',[firstCoins.map(binary)])).rows)
      if(row.deployer)deployerOf.set(hex(row.address),hex(row.deployer));
    const newestOf=new Map<string,number>();
    for(const coin of firstCoins){const group=deployerOf.get(coin)!;newestOf.set(group,Math.max(newestOf.get(group) ?? -1,launched.get(coin)!));}
    const firstOrder=(a:Checkpoint,b:Checkpoint)=>{
      const ga=deployerOf.get(a.coin)!,gb=deployerOf.get(b.coin)!;
      return newestOf.get(gb)!-newestOf.get(ga)! || ga.localeCompare(gb) || launched.get(a.coin)!-launched.get(b.coin)! || a.coin.localeCompare(b.coin) || a.block-b.block;
    };
    const queued=(task:Checkpoint)=>since.get(task.coin) ?? task.block;
    tasks.sort((a,b)=>Number(first(b.coin))-Number(first(a.coin)) || (first(a.coin) ? firstOrder(a,b) : queued(a)-queued(b) || a.coin.localeCompare(b.coin) || a.block-b.block));
    const firstScans=tasks.findIndex(task=>!first(task.coin)),priority=firstScans<0 ? tasks.length : firstScans;
    if(live)this.options.onLiveTasks?.(tasks);
    if(live)this.options.onLivePlanned?.({tasks:tasks.length,coins:new Set(tasks.map(t=>t.coin)).size,firstScans:new Set(tasks.slice(0,priority).map(t=>t.coin)).size,coalescedCheckpoints:coalesced,to});
    const remaining=new Map<Address,number>();for(const task of tasks)remaining.set(task.coin,(remaining.get(task.coin) ?? 0)+1);
    const memo:SourceMemo|undefined=live ? {ranks:new Map()} : undefined;
    const sliceStart=performance.now();let yielded=false;this.yielded=false;
    if(!live) {
      this.options.onPlanned?.({tasks:tasks.length,coins:new Set(tasks.map(t=>t.coin)).size,from,to});
      if(this.options.replayCache!==false){const start=performance.now();this.cache=new ReplayCache(this.db,to,this.clock,this.options.marketWindow);await this.cache.initialize();this.metrics.sourceMs+=performance.now()-start;}
    }
    const idleAt=new Map(inputs.map(input=>[input.coin,input.lastSec+7*86400]));
    const expiry=[...idleAt].sort((a,b)=>a[1]-b[1]);let expired=0;
    const expire=(sec:number)=>{while(expired<expiry.length && expiry[expired][1]<=sec){this.cache?.evict(expiry[expired][0]);expired++;}};
    const queuedAt=performance.now();
    const width=this.options.concurrency ?? 4;
    let completed=0;
    let outcomesBlock=-1;
    // Live writes catch up outcomes a bounded number of horizons at a time (updateOutcomes) until one call finishes.
    let outcomesDone=true;
    const progress:EvaluationProgress={to,tasks:tasks.length,attempted:0,skipped:0,failed:0,completed:0,outcomeLoads:0,outcomesPending:false,phase:'sources',sec:0};
    const report=()=>{progress.sec=Math.round((performance.now()-queuedAt)/1000);progress.outcomesPending=!outcomesDone;this.options.onEvaluation?.({...progress});};
    const reporter=live && this.options.onEvaluation ? setInterval(report,this.options.evaluationReportMs ?? 60_000) : undefined;
    const queue:OutcomeQueue={};
    const outcomes=async (tx:ChainDb,block:number,sec:number)=>{
      const budget:OutcomeBudget|undefined=live ? {loads:this.options.outcomeLoadsPerWrite ?? OUTCOME_LOADS_PER_WRITE,used:0} : undefined,phase=progress.phase;
      progress.phase='outcomes';
      try{outcomesDone=await updateOutcomes(tx,block,sec,this.clock,this.cache,this.outcomeSkips,budget,live ? queue : undefined);}
      finally{progress.phase=phase;progress.outcomeLoads+=budget?.used ?? 0;}
      outcomesBlock=Math.max(outcomesBlock,block);
    };
    try {
    for(let offset=0;offset<tasks.length && !this.stopped;) {
      if(live && offset>=priority && this.options.liveSliceMs!==undefined && performance.now()-sliceStart>=this.options.liveSliceMs
        && (await this.db.sql.query('SELECT 1 FROM tokens WHERE first_block>$1 LIMIT 1',[to])).rows.length) {yielded=true;break;}
      // First scans never share a batch with backlog, so a yield happens right after them.
      const batch=tasks.slice(offset,Math.min(offset+width,offset<priority ? priority : tasks.length));offset+=batch.length;
      const sourceStart=performance.now();progress.phase='sources';
      // Prepare the shared market lane in task order before asynchronous coin loads.
      if(this.cache)for(const point of batch)await this.cache.ranked(point.block,point.sec);
      const loaded=await Promise.all(batch.map(async point=>{
        progress.attempted++;
        const existing=this.cache ? this.cache.runs.has(`${point.coin}:${point.block}`) : (await this.db.sql.query('SELECT 1 FROM engine_runs WHERE coin=$1 AND block=$2 AND rules_version=$3',[binary(point.coin),point.block,RULES_VERSION])).rows.length;
        if(existing && !(live && revised.has(point.coin) && point.block===to)){progress.skipped++;return null;}
        await resolveClock(this.db,point.block,this.readBlock,this.clock);
        if(live){await recordScanStart(this.db,point.coin,(this.options.now?.() ?? Date.now()/1000)*1000);await this.options.referenceSimulation?.(point.coin,point.block);}
        const sources=await loadSources(this.db,point.coin,point.block,this.client,this.clock,this.cache,!live,memo);
        if(!sources){this.cardFailures++;progress.failed++;}
        return sources;
      }));
      this.metrics.sourceMs+=performance.now()-sourceStart;
      for(let i=0;i<batch.length;i++) {
        if(i>0 && this.stopped)break;
        remaining.set(batch[i].coin,remaining.get(batch[i].coin)!-1);
        const sources=loaded[i];if(!sources){this.cache?.writes.delete(batch[i].coin);expire(batch[i].sec);continue;}
        progress.phase='write';
        const writeStart=performance.now();const card=await this.db.tx(async tx=>{
          await tx.sql.query('LOCK TABLE engine_schedule IN EXCLUSIVE MODE');
          if(!this.cache && !(live && revised.has(sources.coin) && sources.asOfBlock===to) && (await tx.sql.query('SELECT 1 FROM engine_runs WHERE coin=$1 AND block=$2 AND rules_version=$3',[binary(sources.coin),sources.asOfBlock,RULES_VERSION])).rows.length)return;
          // Outcomes are keyed by horizon time, so a later block covers every earlier one. Replay runs in block
          // order (unchanged); live first scans run ahead of older backlog, which must not re-run this per write.
          // A live call stops after a few horizons, so the next write continues it instead of the card waiting for all.
          if(sources.asOfBlock>outcomesBlock || !outcomesDone)await outcomes(tx,sources.asOfBlock,sources.asOfSec);
          const {historyAt}=await import('./sources.js');sources.history=await historyAt(tx,sources.deployer,sources.coin,sources.asOfBlock,this.cache);
          return this.persistRun(tx,sources,!live);
        });
        this.metrics.writeMs+=performance.now()-writeStart;
        expire(sources.asOfSec);
        if(!card){progress.skipped++;continue;}
        progress.completed++;
        this.evaluated.set(sources.coin,{level:card.verdict.level,playbooks:card.playbooks});
        if(live){await this.recordScan(card);this.options.onQueueCompletion?.(performance.now()-queuedAt);}
        completed++;this.completed++;this.options.onProgress?.(completed,sources.asOfBlock);
        // PGlite can resolve a long SQL chain entirely through microtasks. Yield
        // between coins so signal handlers and progress output run promptly.
        await new Promise<void>(resolve=>setImmediate(resolve));
      }
    }
    // Outcome horizons still mature after a coin stops receiving card evaluations.
    const end=clock.at(-1);
    if(!this.stopped && end && (outcomesBlock<end.number || !outcomesDone)){const start=performance.now();await this.db.tx(async tx=>{
      await tx.sql.query('LOCK TABLE engine_schedule IN EXCLUSIVE MODE');
      await outcomes(tx,end.number,end.sec);
    });this.metrics.writeMs+=performance.now()-start;}
    } finally {clearInterval(reporter);progress.phase='done';if(live)report();}
    // A yielded poll records only coins whose checkpoints all ran; the rest are planned again next poll.
    this.yielded=yielded;
    if(!this.stopped && live)for(const coin of pending)if(!yielded || !remaining.get(coin.coin)) {
      if(startup)this.startupDone.add(coin.coin);
      // The progress base lets the next poll (or the next process) read only this coin's rows above it.
      await this.db.sql.query(`INSERT INTO engine_activity_state(coin,revision,through_block,base_block,base_sum,base_sec,last_sec) VALUES($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT(coin) DO UPDATE SET revision=excluded.revision,through_block=excluded.through_block,base_block=excluded.base_block,base_sum=excluded.base_sum,
        base_sec=excluded.base_sec,last_sec=excluded.last_sec`,[binary(coin.coin),coin.revision,to,...baseColumns(coin.base),coin.lastSec]);
      if(incremental)this.live.written(coin.coin,coin.revision,to);
    } else await this.db.sql.query('UPDATE engine_activity_state SET last_sec=$2 WHERE coin=$1',[binary(coin.coin),coin.lastSec]);
    return completed;
  }
  /**
   * Subscribe for wakeups with durable polling fallback, process ordered work until stop and
   * unsubscribe in finally. Engines operator only; bus subscription failure preserves polling while
   * poll/SQL/source errors reject. No trading or wallet signing is enabled.
   * @see {@link ../../../SECURITY.md#privileged-powers | Privileged powers}
   * @see {@link ../../../docs/security/INVARIANTS.md | Implemented core invariants}
   */
  async run() {
    let unsubscribe: (()=>Promise<void>) | undefined;
    try { unsubscribe=await (this.options.bus ?? this.db.bus).subscribe(message => { if (!['card_updated','verdict_created'].includes(message.topic)) this.wake?.(); }); }
    catch { /* A disconnected bus does not disable the durable cursor poll. */ }
    try {
      while (!this.stopped) {
        const completed=await this.poll();
        this.options.onHeartbeat?.();
        if (completed) continue;
        await new Promise<void>(resolve => {
          const timer=setTimeout(() => { this.wake=undefined; resolve(); },this.options.pollMs ?? 2000);
          this.wake=()=>{ clearTimeout(timer);this.wake=undefined;resolve(); };
          if (this.stopped) this.wake();
        });
      }
    } finally { await unsubscribe?.(); }
  }
  /**
   * Schedule a block's eligible coins, acquire sources outside the transaction and serialize
   * current-block/history/receipt writes with canonical hash/cursor checks. Engines role only;
   * missing block, source/provider/SQL or canonical mismatch rejects. Replay uses historical
   * schedule state; absent sources increment failure counts.
   * @see {@link ../../../SECURITY.md#privileged-powers | Privileged powers}
   * @see {@link ../../../docs/security/INVARIANTS.md | Implemented core invariants}
   */
  async processBlock(block: number, replay=false) {
    const b=await resolveClock(this.db,block,this.options.readBlock,this.clock);
    if (!b) throw new Error('Missing engine block');
    const now=seconds(b.ts);
    const candidates=(await this.db.sql.query<Schedule>(`SELECT t.address AS coin,t.first_block,e.last_block,e.last_sec,e.price,
      (SELECT max(ts) FROM swaps s WHERE s.coin=t.address AND s.block<=$1) AS last_trade
      FROM tokens t LEFT JOIN engine_schedule e ON e.coin=t.address WHERE t.first_block<=$1 ORDER BY t.first_block,t.address`, [block])).rows;
    const selected: Address[]=[];
    for (const row of candidates) {
      const coin=hex(row.coin);
      // Historical replays derive the last schedule from blocks already processed, not the live schedule.
      let lastBlock=Number(row.last_block ?? -1),lastSec=Number(row.last_sec ?? 0),lastPrice=row.price;
      if (replay) {
        const prior=(await this.db.sql.query<{ block:string;sec:string;price:number | null }>('SELECT block,sec,price FROM engine_runs WHERE coin=$1 AND block<$2 AND rules_version=$3 ORDER BY block DESC LIMIT 1',[row.coin,block,RULES_VERSION])).rows[0];
        lastBlock=Number(prior?.block ?? -1);lastSec=Number(prior?.sec ?? 0);lastPrice=prior?.price ?? null;
      }
      const latestTrade=row.last_trade ? seconds(row.last_trade) : seconds((await this.db.sql.query<{ ts:Date }>('SELECT ts FROM engine_block_times WHERE number=$1',[row.first_block])).rows[0].ts);
      if (now-latestTrade>=7*86400) continue;
      const current=(await this.db.sql.query<{ low:number | null;high:number | null }>('SELECT min(price_quote) AS low,max(price_quote) AS high FROM swaps WHERE coin=$1 AND block=$2',[row.coin,block])).rows[0];
      const change=current.low!=null && current.high!=null && (lastPrice!=null && lastPrice>0 ?
        current.high>lastPrice*1.05 || current.low<lastPrice*0.95 : lastPrice==null);
      const event=(await this.db.sql.query(`SELECT 1 FROM token_transfers WHERE token=$1 AND block=$2
        UNION ALL SELECT 1 FROM pons_exemptions WHERE token=$1 AND block=$2
        UNION ALL SELECT 1 FROM liquidity_events e JOIN pools p ON p.id=e.pool_id WHERE (p.currency0=$1 OR p.currency1=$1) AND e.block=$2
        UNION ALL SELECT 1 FROM pools WHERE (currency0=$1 OR currency1=$1) AND created_block=$2 LIMIT 1`,[row.coin,block])).rows.length>0;
      const interval=now-latestTrade<3600 ? 600 : 3600;
      if (lastBlock<0 || Number(row.first_block)===block || change || event || now-lastSec>=interval) selected.push(coin);
    }
    // PGlite transactions are serialized. Preparation only performs archive RPC reads outside the write transaction.
    const prepared=new Map<Address,LoadedSources | null>();
    const width=this.options.concurrency ?? 4;
    for (let offset=0;offset<selected.length;offset+=width) {
      const batch=selected.slice(offset,offset+width);
      const sources=await Promise.all(batch.map(async coin=>{
        if(!replay){await recordScanStart(this.db,coin,(this.options.now?.() ?? Date.now()/1000)*1000);await this.options.referenceSimulation?.(coin,block);}
        return loadSources(this.db,coin,block,this.options.client,this.clock,undefined,replay);
      }));
      batch.forEach((coin,i)=>prepared.set(coin,sources[i]));
    }
    const cards:CoinCard[]=[];
    await this.db.tx(async tx => {
      await tx.sql.query('LOCK TABLE engine_cursors,engine_schedule IN EXCLUSIVE MODE');
      if (!replay) {
        const cursor=(await tx.sql.query<{ block:string }>("SELECT block FROM engine_cursors WHERE stream='engines'")).rows[0];
        if (cursor && Number(cursor.block)>=block) return;
      }
      const canonicalHash=await tx.blockHash(BigInt(block));
      if (b.hash && canonicalHash!=null && canonicalHash!==hex(b.hash)) throw new Error('Indexed block changed during engine preparation');
      await updateOutcomes(tx,block,now,this.clock,undefined,this.outcomeSkips);
      for (const coin of selected) {
        const s=prepared.get(coin); if (!s){this.cardFailures++;continue;}
        // Refresh after outcomes/earlier launches in this block have materialized.
        const { historyAt }=await import('./sources.js');
        s.history=await historyAt(tx,s.deployer,coin,block);
        const card=await this.persistRun(tx,s,replay);if(card)cards.push(card);
      }
      if (!replay) await tx.sql.query("INSERT INTO engine_cursors VALUES('engines',$1,$2) ON CONFLICT(stream) DO UPDATE SET block=excluded.block,hash=excluded.hash",[block,b.hash]);
    });
    if(!replay)for(const card of cards)await this.recordScan(card);
  }
  private async persistRun(tx:ChainDb,s:LoadedSources,replay=false) {
    if(this.cache){const claim=await tx.sql.query('INSERT INTO engine_runs VALUES($1,$2,$3,$4,NULL,$5) ON CONFLICT DO NOTHING RETURNING coin',[binary(s.coin),s.asOfBlock,s.asOfSec,s.trade.last?.price_quote ?? null,RULES_VERSION]);if(!claim.rows.length)return;}
    const card=await this.writeCoin(tx,s);
    await persistShadowGuardV2(tx,{coin:s.coin,block:s.asOfBlock,sec:s.asOfSec,legacyVerdictId:card.verdict.receipt.id,legacySignal:card.signal,replayMode:replay ? 'retrospective' : 'production'});
    if(this.cache){await tx.sql.query('UPDATE engine_runs SET signal=$3 WHERE coin=$1 AND block=$2 AND rules_version=$4',[binary(s.coin),s.asOfBlock,JSON.stringify(card.signal),RULES_VERSION]);this.cache.runs.add(`${s.coin}:${s.asOfBlock}`);}
    else await tx.sql.query('INSERT INTO engine_runs VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(coin,block,rules_version) DO UPDATE SET price=excluded.price,signal=excluded.signal',[binary(s.coin),s.asOfBlock,s.asOfSec,s.trade.last?.price_quote ?? null,JSON.stringify(card.signal),RULES_VERSION]);
    await materializeHistory(tx,s.coin,s.asOfBlock,this.cache);
    await tx.sql.query(`INSERT INTO engine_schedule VALUES($1,$2,$3,$4) ON CONFLICT(coin) DO UPDATE SET last_block=excluded.last_block,last_sec=excluded.last_sec,price=excluded.price
      WHERE engine_schedule.last_block<=excluded.last_block`,[binary(s.coin),s.asOfBlock,s.asOfSec,s.trade.last?.price_quote ?? null]);
    return card;
  }
  private async writeState(tx:ChainDb,s:LoadedSources):Promise<WriteState | undefined> {
    if(!this.cache)return;
    const found=this.cache.writes.get(s.coin);if(found)return found;
    const [prior,previous,run]=await Promise.all([
      tx.sql.query<{id:string;signature:string;data:Verdict}>('SELECT v.id,v.signature,v.data FROM verdicts v LEFT JOIN receipt_publications p ON p.id=v.id WHERE v.coin=$1 AND valid_from_block<=$2 ORDER BY (v.rules_version=$3) DESC,valid_from_block DESC,v.rules_version DESC,p.publication_sequence DESC NULLS LAST,v.id DESC LIMIT 1',[binary(s.coin),s.asOfBlock,RULES_VERSION]),
      tx.sql.query<{id:string;hash:string}>('SELECT id,hash FROM coin_cards WHERE coin=$1 AND valid_from_block<$2 AND rules_version=$3 ORDER BY valid_from_block DESC LIMIT 1',[binary(s.coin),s.asOfBlock,RULES_VERSION]),
      tx.sql.query<{signal:CoinCard['signal']}>('SELECT signal FROM engine_runs WHERE coin=$1 AND block<$2 AND rules_version=$3 ORDER BY block DESC LIMIT 1',[binary(s.coin),s.asOfBlock,RULES_VERSION]),
    ]);
    const state={prior:prior.rows[0],previous:previous.rows[0],signal:run.rows[0]?.signal};this.cache.writes.set(s.coin,state);return state;
  }
  private async writeCoin(tx: ChainDb,s: LoadedSources) {
    const state=await this.writeState(tx,s);
    const matches=evaluatePlaybooks({ ...s,history:s.history });
    const evaluated=evaluatedPlaybooks(s);
    const assembled=assembleVerdict(matches,{ coin:s.coin,asOfBlock:s.asOfBlock,receipt:{ id:'pending',hash:'',status:'pending' } });
    const incomplete=Object.entries(s.attributionCoverage ?? {}).filter(([,gap])=>gap.status==='incomplete');
    if(incomplete.length)assembled.reasons.push(`Not fully checked: ${incomplete.map(([key,gap])=>`${key.replaceAll('_',' ')} (${gap.reason.replaceAll('_',' ')})`).join(', ')}`);
    // CA-34: Clear needs every check that has an input source (UNSOURCED_PLAYBOOKS has none yet and is named instead).
    const notRun=(Object.keys(rules) as PlaybookId[]).filter(id=>!evaluated.includes(id)),blocking=notRun.filter(id=>!UNSOURCED_PLAYBOOKS.includes(id));
    if (assembled.level==='clear' && (blocking.length>0 || incomplete.length>0)) assembled.level='pending';
    if (assembled.level==='clear' && notRun.length)assembled.reasons.push(`Not checked yet: ${notRun.map(id=>id.replaceAll('_',' ')).join(', ')} (no data source yet)`);
    // Rated Danger when retention pruned its history: the checks behind that rating cannot be re-run on what is left,
    // so a revived coin is never published as less severe than Danger.
    if(s.dangerBeforePrune) {
      const playbooks=s.dangerBeforePrune.playbooks.map(id=>id.replaceAll('_',' '));
      assembled.reasons.unshift(`Rated Danger before its history was pruned${playbooks.length ? ` (${playbooks.join(', ')})` : ''}`);
      assembled.level='danger';
    }
    assembled.evaluatedPlaybooks=evaluated;
    const signature=digest({ level:assembled.level,playbooks:matches,reasons:assembled.reasons,rulesVersion:RULES_VERSION,evaluated,attributionCoverage:s.attributionCoverage });
    const prior=state ? state.prior : (await tx.sql.query<{ id:string; signature:string; data:Verdict }>('SELECT v.id,v.signature,v.data FROM verdicts v LEFT JOIN receipt_publications p ON p.id=v.id WHERE v.coin=$1 AND valid_from_block<=$2 ORDER BY (v.rules_version=$3) DESC,valid_from_block DESC,v.rules_version DESC,p.publication_sequence DESC NULLS LAST,v.id DESC LIMIT 1',[binary(s.coin),s.asOfBlock,RULES_VERSION])).rows[0];
    let verdict=assembled;
    if (prior?.signature===signature) verdict={ ...prior.data,asOfBlock:s.asOfBlock,playbooks:matches };
    else {
      const blockHash=await tx.blockHash(BigInt(s.asOfBlock));
      const payload=verdictReceipt(s,assembled,blockHash,prior?.id ?? null,new Date((this.options.now?.() ?? Date.now()/1000)*1000).toISOString());
      const id=payload.receiptId;
      verdict.receipt={id,hash:digest(payload),status:'pending'};
      const inserted=(await tx.sql.query('INSERT INTO verdicts VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id',[id,binary(s.coin),s.asOfBlock,RULES_VERSION,signature,JSON.stringify(verdict)])).rows.length;
      if (inserted) {
        await publishReceipt(tx,'engines',payload);
        await tx.sql.query('INSERT INTO verdict_events VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',[`${id}:created`,id,'created',s.asOfBlock,'{}']);
        if (prior) await tx.sql.query('INSERT INTO verdict_events VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',[`${prior.id}:superseded:${id}`,prior.id,'superseded',s.asOfBlock,JSON.stringify({ replacementId:id })]);
        await tx.notify('verdict_created',{ id,coin:s.coin });
      } else verdict=(await tx.sql.query<{data:Verdict}>('SELECT data FROM verdicts WHERE id=$1',[id])).rows[0].data;
    }
    for (const m of matches) await tx.sql.query('INSERT INTO playbook_matches VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',[binary(s.coin),s.asOfBlock,RULES_VERSION,m.id,JSON.stringify(m)]);
    for(const match of matches)this.cache?.recordMatch(s.coin,String(s.asOfBlock),match);
    const card=assembleCard(s,verdict);
    const previous=state ? state.previous : (await tx.sql.query<{ id:string; hash:string; data:CoinCard; ts:Date }>('SELECT c.*,b.ts FROM coin_cards c JOIN engine_block_times b ON b.number=c.valid_from_block WHERE c.coin=$1 AND c.valid_from_block<$2 AND c.rules_version=$3 ORDER BY c.valid_from_block DESC LIMIT 1',[binary(s.coin),s.asOfBlock,RULES_VERSION])).rows[0];
    const priorRun=state ? {signal:state.signal} : (await tx.sql.query<{ signal:CoinCard['signal'] }>('SELECT signal FROM engine_runs WHERE coin=$1 AND block<$2 AND rules_version=$3 ORDER BY block DESC LIMIT 1',[binary(s.coin),s.asOfBlock,RULES_VERSION])).rows[0];
    if (priorRun?.signal) {
      const signalTime=this.clock.get(priorRun.signal.asOfBlock) ?? (await tx.sql.query<{ ts:Date }>('SELECT ts FROM engine_block_times WHERE number=$1',[priorRun.signal.asOfBlock])).rows[0];
      if (signalTime && !shouldRecomputeSignal(seconds(signalTime.ts)*1000,s.asOfSec*1000)) card.signal=priorRun.signal;
    }
    const hash=cardHash(card);
    const sameBlock=(await tx.sql.query<{id:string;hash:string}>('SELECT id,hash FROM coin_cards WHERE coin=$1 AND valid_from_block=$2 AND rules_version=$3 ORDER BY id',[binary(s.coin),s.asOfBlock,RULES_VERSION])).rows;
    const id=sameBlock.find(c=>c.hash===hash)?.id ?? (previous?.hash===hash ? previous.id : `card:${s.coin}:${s.asOfBlock}:${RULES_VERSION}${sameBlock.length ? `:${hash}` : ''}`);
    const inserted=(await tx.sql.query('INSERT INTO coin_cards VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id',[id,binary(s.coin),s.asOfBlock,hash,JSON.stringify(card),RULES_VERSION])).rows.length;
    await tx.sql.query(`INSERT INTO coin_card_latest VALUES($1,$2,$3,$4) ON CONFLICT(coin) DO UPDATE SET card_id=excluded.card_id,as_of_block=excluded.as_of_block,data=excluded.data
      WHERE coin_card_latest.as_of_block<=excluded.as_of_block`,[binary(s.coin),id,s.asOfBlock,JSON.stringify(card)]);
    if(state){state.prior={id:verdict.receipt.id,signature,data:verdict};state.previous={id,hash};state.signal=card.signal;}
    if (inserted) await tx.notify('card_updated',{ id,coin:s.coin });
    return card;
  }
  private async reconcile() {
    const cursor=(await this.db.sql.query<{ block:string; hash:Uint8Array }>("SELECT block,hash FROM engine_cursors WHERE stream='engines'")).rows[0];
    if (!cursor || !cursor.hash) return;
    const current=await this.db.blockHash(BigInt(cursor.block));
    const observed=(await resolveClock(this.db,Number(cursor.block)))?.hash;
    if (current===hex(cursor.hash) || current==null && observed && hex(observed)===hex(cursor.hash)) return;
    // Reorged verdicts are retained with orphaned events. Replay correction requires a fresh version identity.
    // TODO(spec): cross-task canonical recovery is conservative: stop for explicit derived-history reconciliation instead of deleting verdict history.
    throw new Error('Engine cursor is on an orphaned block; reconcile derived history before continuing');
  }
}
