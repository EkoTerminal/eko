import { walletProtocolTopics } from './wallet-protocol.js';
import { decodePoolEvents } from './pool-events.js';
import { loadSenderScope, extendSenderScope, needsSender, type SenderScope } from './sender-scope.js';
import { decodePonsResult, decodeResult, ponsFactoryAbi, ponsCurveAbi, v3Abi, v4Abi, erc20Abi, wethAbi, rpcStopReason } from '@eko/chain';
import { binary, hex, type ChainDb } from '@eko/db';
import { toHex, toEventSelector, type Address, type Hex } from 'viem';
import { lower, native } from './clients.js';
import { isRangeLimit } from './backfill.js';
import { budgetedQueries, type LogFilter } from './log-budget.js';
import { Semaphore } from './concurrency.js';
import { ReorgDepthError } from './head.js';
import type { BlockDecoder, Prepared, TokenRow } from './decode.js';
import { log, type ChainClient, type Logger, type RpcBlock, type RpcLog, type RpcReceipt, type TokenMetadata } from './types.js';
import { BlockRows } from './rows.js';
import { safeError } from './safe-error.js';

const userOpTopics = walletProtocolTopics;
export const headTopics = [...new Set([...ponsFactoryAbi, ...ponsCurveAbi, ...v3Abi, ...v4Abi, ...erc20Abi, ...wethAbi].filter(e => e.type === 'event').map(toEventSelector))];
const transferTopic=toEventSelector(erc20Abi[0]),poolCreatedTopic=toEventSelector(v3Abi[0]),initializeTopic=toEventSelector(v4Abi[0]);
const v3PoolTopics=new Set(v3Abi.slice(1).map(toEventSelector));
const identity = (l: RpcLog) => `${lower(l.transactionHash)}:${BigInt(l.logIndex)}`;
const order = (a: RpcLog, b: RpcLog) => BigInt(a.blockNumber) === BigInt(b.blockNumber) ? Number(BigInt(a.logIndex) - BigInt(b.logIndex)) : BigInt(a.blockNumber) < BigInt(b.blockNumber) ? -1 : 1;
class ReorgDuringTick extends Error {}
interface WindowData { from:bigint;to:bigint;head:bigint;scope:SenderScope;candidates:RpcLog[];blocks:Map<bigint,RpcLog[]>;hashes:Map<bigint,Hex>;headers:Map<bigint,RpcBlock>;receiptsByBlock:Map<bigint,RpcReceipt[]>;discoveredPools:Map<string,import('./types.js').PoolMetadata>;timings:LogHeadFollower['timings'];meterBefore:ReturnType<NonNullable<ChainClient['rpcTiming']>>|undefined }
type ReceiptReason = 'pons_coin_trade' | 'other_indexed_token' | 'launch' | 'liquidity' | 'other_event';
const emptyReasons = (): Record<ReceiptReason,number> => ({pons_coin_trade:0,other_indexed_token:0,launch:0,liquidity:0,other_event:0});
const emptyTimings=()=>({rpcWallMs:0,dbWriteMs:0,logsMs:0,discoveryMs:0,timestampMs:0,receiptsMs:0,headersMs:0,parentHeadersMs:0,timestampHeadersMs:0,enrichmentMs:0,prepareMs:0,windowScopeMs:0,receiptRpcMs:0,receiptMaxMs:0,receiptConcurrency:0,enrichmentConcurrency:0,blocks:0,logs:0,receipts:0,receiptReasons:emptyReasons(),headers:0,cursorReads:0,timestampHeaders:0,parentHeaders:0,timestampScans:0});
interface Options { pipeline?:boolean; startBlock?: bigint; tickMs?: number; maxRange?: number; codeCacheSec?: number; reorgDepth: number; concurrency?: number; logger?: Logger }

/** Sparse head anchor plus a separate scan cursor: empty windows need neither headers nor chain rows. */
export class LogHeadFollower {
  private stopping = false;
  private ticking?:Promise<void>;
  private pipeline=false;
  private timestampProbe?:boolean;
  private ahead?:Promise<{ok:true;data:WindowData}|{ok:false;error:unknown}>;
  private aheadFrom?:bigint;
  private wake?: () => void;
  private rpc: Semaphore;
  private window: number;
  private timings = emptyTimings();
  private async remote<T>(read:()=>Promise<T>): Promise<T> { const began=performance.now(); try { return await read(); } finally { this.timings.rpcWallMs += performance.now()-began; } }
  constructor(readonly client: ChainClient, readonly db: ChainDb, readonly decoder: BlockDecoder, readonly options: Options) {
    for (const value of [options.tickMs ?? 1000, options.maxRange ?? 200, options.codeCacheSec ?? 3600, options.reorgDepth]) if (!Number.isInteger(value) || value < 1) throw new Error('Invalid log head configuration');
    this.pipeline=options.pipeline??false;
    this.window = options.maxRange ?? 200;
    this.rpc = new Semaphore(options.concurrency ?? 32);
  }
  stop() { this.stopping = true; this.wake?.(); }
  private get logger() { return this.options.logger ?? log; }
  private header(n: bigint) { return this.client.header?.(n) ?? this.client.block(n); }
  private async anchor(n: bigint) {
    const b = await this.header(n);this.timings.cursorReads++;
    if (!b || BigInt(b.number) !== n) throw new Error('Invalid cursor header');
    await this.db.tx(async tx => {
      await tx.insert('chain_blocks', { number: n.toString(), block: n.toString(), hash: binary(b.hash), parent_hash: binary(b.parentHash), ts: new Date(Number(BigInt(b.timestamp)) * 1000) });
      await tx.setCursor('head', n, b.hash);
      await tx.setCursor('head_logs', n, null);
    });
    return b;
  }
  async rollback(from: bigint) {
    for (let depth = 0, n = from; n >= 0n && depth < this.options.reorgDepth; depth++, n--) {
      const stored = await this.db.blockHash(n);
      // Sparse storage still counts depth in blocks, not in stored rows.
      if (!stored) continue;
      const canonical = await this.header(n);
      if(!canonical)throw new Error('Invalid reorg header');
      if (BigInt(canonical.number) !== n || stored !== lower(canonical.hash)) continue;
      await this.db.tx(async tx => {
        await tx.deleteAbove(n);
        await tx.setCursor('head', n, canonical.hash);
        await tx.setCursor('head_logs', n, null);
        await tx.notify('chain_reorg', { fromBlock: (n + 1n).toString() });
      });
      this.decoder.invalidate();
      this.logger('chain_reorg', { fromBlock: (n + 1n).toString() });
      return;
    }
    this.logger('alert', { reason: 'reorg_depth_exceeded', depth: this.options.reorgDepth });
    throw new ReorgDepthError('Reorg exceeds INDEX_REORG_DEPTH; indexer halted');
  }
  private async query(filter: LogFilter): Promise<RpcLog[]> {
    try { return await this.client.logs(filter); }
    catch (error) {
      if (rpcStopReason(error) || this.client.rpcStopped?.()) throw error;
      const arrayLimit = /too many addresses|address.*limit|array.*limit/i.test(safeError(error));
      if (!arrayLimit && isRangeLimit(error) && filter.from < filter.to) {
        const mid = (filter.from + filter.to) / 2n;
        return [...await this.query({ ...filter, to: mid }), ...await this.query({ ...filter, from: mid + 1n })];
      }
      if ((arrayLimit || isRangeLimit(error)) && filter.addresses && filter.addresses.length > 1) {
        const mid = Math.ceil(filter.addresses.length / 2);
        return [...await this.query({ ...filter, addresses: filter.addresses.slice(0, mid) }), ...await this.query({ ...filter, addresses: filter.addresses.slice(mid) })];
      }
      throw error;
    }
  }
  private async logs(filter: LogFilter) {
    const result: RpcLog[] = [];
    for (const part of budgetedQueries(filter)) result.push(...await this.query(part));
    return result;
  }
  /** One bounded window. Exposed for offline replay and a lead's budgeted comparison. */
  tick():Promise<void> {
    return this.ticking??=this.tickOnce().finally(()=>{this.ticking=undefined;});
  }
  private async tickOnce() {
    const began=performance.now(), meterBefore=this.client.rpcTiming?.();
    this.timings=emptyTimings();
    try { await this.processTick(); }
    finally {
      const meterAfter=this.client.rpcTiming?.();
      this.logger('head_tick',{headers_fetched:this.timings.headers+this.timings.cursorReads,headers_by_reason:{cursor:this.timings.cursorReads,missing_timestamp:this.timings.timestampHeaders,missing_parent:this.timings.parentHeaders},timestamp_scans:this.timings.timestampScans, blocks_covered:this.timings.blocks,logs_kept:this.timings.logs,receipts_fetched:this.timings.receipts,receipts_by_reason:this.timings.receiptReasons,tick_ms:performance.now()-began,
        rpc_wait_ms:meterAfter && meterBefore ? meterAfter.rpcMs-meterBefore.rpcMs : this.timings.rpcWallMs,
        rpc_wall_ms:this.timings.rpcWallMs,meter_admission_ms:meterAfter && meterBefore ? meterAfter.admissionMs-meterBefore.admissionMs : 0,
        meter_rate_wait_ms:meterAfter && meterBefore ? meterAfter.rateWaitMs-meterBefore.rateWaitMs : 0,meter_public_rate_wait_ms:meterAfter&&meterBefore?(meterAfter.publicRateWaitMs??0)-(meterBefore.publicRateWaitMs??0):0,meter_paid_rate_wait_ms:meterAfter&&meterBefore?(meterAfter.paidRateWaitMs??0)-(meterBefore.paidRateWaitMs??0):0,db_write_ms:this.timings.dbWriteMs,logs_ms:this.timings.logsMs,discovery_ms:this.timings.discoveryMs,timestamp_ms:this.timings.timestampMs,receipts_ms:this.timings.receiptsMs,headers_ms:this.timings.headersMs,parent_headers_ms:this.timings.parentHeadersMs,timestamp_headers_ms:this.timings.timestampHeadersMs,enrichment_ms:this.timings.enrichmentMs,prepare_ms:this.timings.prepareMs,window_scope_ms:this.timings.windowScopeMs,receipt_rpc_ms:this.timings.receiptRpcMs,receipt_max_ms:this.timings.receiptMaxMs,receipt_concurrency:this.timings.receiptConcurrency,enrichment_concurrency:this.timings.enrichmentConcurrency });
    }
  }
  private async processTick() {
    const head=await this.remote(()=>this.client.head());
    let previousHash:Hex|undefined;
    let anchored:RpcBlock|undefined;
    let cursor=await this.db.cursor('head');
    let scanned=await this.db.cursor('head_logs')??cursor;
    if(scanned==null){const first=this.options.startBlock??head;if(first>0n){anchored=await this.remote(()=>this.anchor(first-1n));cursor=first-1n;}scanned=first-1n;}
    if(cursor!=null){const canonical=anchored??await this.remote(()=>this.header(cursor));if(!anchored)this.timings.cursorReads++;if(!canonical||BigInt(canonical.number)!==cursor)throw new Error('Invalid cursor header');previousHash=canonical.hash;if(await this.db.blockHash(cursor)!==lower(canonical.hash)){await this.discardAhead();await this.rollback(cursor);return;}}
    if(this.stopping||this.client.rpcStopped?.())return;
    const from=scanned+1n;
    if(head<from){this.decoder.metrics.observeLogs(null,0n);return;}
    try {
      let data:WindowData;
      if(this.ahead && this.aheadFrom===from){const read=await this.ahead;this.ahead=undefined;this.aheadFrom=undefined;if(!read.ok)throw read.error;data=read.data;}
      else {await this.discardAhead();data=await this.fetchWindow(from,head,await loadSenderScope(this.db),cursor===from-1n?previousHash:undefined);}
      data.timings.rpcWallMs+=this.timings.rpcWallMs;data.timings.cursorReads+=this.timings.cursorReads;this.timings=data.timings;
      data.head=head;
      if(this.pipeline && head-data.to>=BigInt(this.window) && !this.stopping){
        this.aheadFrom=data.to+1n;
        const scopeBegan=performance.now();
        const scope=this.windowScope(data);
        this.timings.windowScopeMs+=performance.now()-scopeBegan;
        this.ahead=this.fetchWindow(data.to+1n,head,scope,data.candidates.find(l=>BigInt(l.blockNumber)===data.to)?.blockHash).then(data=>({ok:true as const,data}),error=>({ok:false as const,error}));
      }
      await this.applyWindow(data);
    } catch(error) {
      await this.discardAhead();this.decoder.invalidate();
      if(!(error instanceof ReorgDuringTick))throw error;
      const anchor=await this.db.cursor('head');if(anchor==null)throw error;await this.rollback(anchor);
    }
  }
  private async discardAhead(){if(this.ahead)await this.ahead;this.ahead=undefined;this.aheadFrom=undefined;}
  private windowScope(data:WindowData):SenderScope {
    const scope={...data.scope,tokenRows:[...data.scope.tokenRows],poolRows:[...data.scope.poolRows]};
    // Set membership replaces repeated whole-registry .some()/hex conversions.
    const tokens=new Set<string>(scope.tokenRows.map(t=>hex(t.address))),pools=new Set<string>(scope.poolRows.map(p=>hex(p.id)));
    const initializations=new Map<string,Address>(data.candidates.filter(l=>l.topics[0]===initializeTopic).flatMap(l=>decodePoolEvents(l,{registry:this.decoder.registry}).events).flatMap(e=>e.source==='uniswap_v4'&&e.eventName==='Initialize'?[[lower(e.args.id),e.args.hooks] as const]:[]));
    for(const [curve,token] of scope.curves)if(!tokens.has(lower(token))){tokens.add(lower(token));scope.tokenRows.push({address:binary(token),curve:binary(curve),launchpad:'pons',symbol:null,name:null,decimals:null});}
    for(const [id,pool] of data.discoveredPools)scope.pools.set(id,pool);
    for(const [id,pool] of scope.pools){
      for(const address of [pool.currency0,pool.currency1])if(lower(address)!==native&&!tokens.has(lower(address))){tokens.add(lower(address));scope.tokenRows.push({address:binary(address),curve:null,launchpad:scope.tokens.has(lower(address))?'pons':null,symbol:null,name:null,decimals:null});}
      if(pools.has(id))continue;pools.add(id);
      const hooks=initializations.get(id);
      scope.poolRows.push({id:binary(id),venue:id.length===66?'uniswap_v4':'uniswap_v3',currency0:binary(pool.currency0),currency1:binary(pool.currency1),fee:pool.fee,tick_spacing:pool.tickSpacing,hooks:hooks?binary(hooks):null});
    }
    return scope;
  }
  private async fetchWindow(from:bigint,head:bigint,initialScope:SenderScope,previousHash?:Hex):Promise<WindowData> {
    const timings=emptyTimings();
    const meterBefore=this.client.rpcTiming?.();
    const remote=async<T>(read:()=>Promise<T>):Promise<T>=>{const began=performance.now();try{return await read();}finally{timings.rpcWallMs+=performance.now()-began;}};
    let to=from+BigInt(this.window)-1n<head?from+BigInt(this.window)-1n:head;
      let candidates: RpcLog[]; let chunkTransfers=false;
      const logsBegan=performance.now();
      for (;;) {
        try { candidates=await remote(()=>this.client.logs({from,to,topics:headTopics})); break; }
        catch(error) {
          if (rpcStopReason(error) || !isRangeLimit(error)) throw error;
          if(to===from) { chunkTransfers=true; candidates=await remote(()=>this.logs({from,to,topics:headTopics.filter(t=>t!==transferTopic)}));break; }
          this.window=Math.max(1,Math.floor(Number(to-from+1n)/2)); to=from+BigInt(this.window)-1n;
        }
      }
      timings.logsMs=performance.now()-logsBegan;
      timings.blocks=Number(to-from+1n);
      const validate = (logs: RpcLog[]) => {
        if (logs.some(l => l.removed)) throw new ReorgDuringTick('Removed log');
        if (logs.some(l => BigInt(l.blockNumber) < from || BigInt(l.blockNumber) > to)) throw new Error('Head logs require a consistent block range');
      };
      validate(candidates);
      const candidateHashes = new Map<bigint, string>();
      for (const l of candidates) {
        const n = BigInt(l.blockNumber), previous = candidateHashes.get(n);
        if (previous && previous !== lower(l.blockHash)) throw new ReorgDuringTick('Conflicting block hashes');
        candidateHashes.set(n, lower(l.blockHash));
      }
      const registry = this.decoder.registry;
      const scope=extendSenderScope(initialScope,candidates,registry);
      const tokenRows=scope.tokenRows;
      const knownTokens=new Map<string,TokenMetadata>(tokenRows.map(r=>[hex(r.address),{...r,totalSupply:r.total_supply==null?null:BigInt(r.total_supply),supplyBlock:r.supply_block==null?null:BigInt(r.supply_block)}]));
      const tokens=new Set(knownTokens.keys());
      const curves=scope.curves;
      const pools=new Set<string>(scope.pools.keys());
      const poolCurrencies=new Map<string,string[]>([...scope.pools].map(([id,p])=>[id,[lower(p.currency0),lower(p.currency1)]]));
      const ponsTokens=scope.tokens;
      const known = new Set((['pons.factory', 'uniswapV3.factory', 'uniswapV4.poolManager', 'tokens.WETH'] as const).map(k => lower(registry.requireAddress(k))));
      const discoveryBegan=performance.now();
      const discoveredPools = await remote(()=>this.decoder.discoverV3Pools(candidates,pools,scope));
      timings.discoveryMs=performance.now()-discoveryBegan;
      for (const [id,pool] of discoveredPools) { poolCurrencies.set(id,[lower(pool.currency0),lower(pool.currency1)]); pools.add(id); scope.pools.set(id,pool); tokens.add(lower(pool.currency0)); tokens.add(lower(pool.currency1)); }
      const deferredTopics=v3PoolTopics;
      const activeFrom = new Map<string, bigint>();
      const selected: RpcLog[] = [];
      const receiptBlocks = new Set<bigint>();
      const receiptReasons = new Map<bigint,Set<ReceiptReason>>();
      for (const l of candidates.sort(order)) {
        const dummy = { from: native, to: null };
        // Discover before filtering, including launches that follow curve trades within the same block.
        for (const e of decodePonsResult(l, dummy, { registry, tokenForCurve: c => curves.get(lower(c)) ?? null }).events) if (e.kind === 'launch') { ponsTokens.add(lower(e.token)); tokens.add(lower(e.token)); curves.set(lower(e.curve), e.token); activeFrom.set(lower(e.curve), BigInt(l.blockNumber)); }
        for (const e of decodePoolEvents(l, { registry }).events) {
          if (e.source === 'uniswap_v3' && e.eventName === 'PoolCreated') { poolCurrencies.set(lower(e.args.pool),[lower(e.args.token0),lower(e.args.token1)]); pools.add(lower(e.args.pool)); activeFrom.set(lower(e.args.pool), BigInt(l.blockNumber)); tokens.add(lower(e.args.token0)); tokens.add(lower(e.args.token1)); }
          if (e.source === 'uniswap_v4' && e.eventName === 'Initialize') { poolCurrencies.set(lower(e.args.id),[lower(e.args.currency0),lower(e.args.currency1)]); pools.add(lower(e.args.id)); activeFrom.set(lower(e.args.id), BigInt(l.blockNumber)); tokens.add(lower(e.args.currency0)); tokens.add(lower(e.args.currency1)); }
        }
      }
      for (const l of candidates.sort(order)) {
        const emitter = lower(l.address);
        const activation = activeFrom.get(emitter === lower(registry.requireAddress('uniswapV4.poolManager')) ? lower(l.topics[1] ?? '0x') : emitter);
        if (activation != null && BigInt(l.blockNumber) < activation) continue;
        const transfer = l.topics[0] === transferTopic;
        if (transfer ? !tokens.has(emitter) : !known.has(emitter) && !curves.has(emitter) && !pools.has(emitter) && !deferredTopics.has(l.topics[0]) && l.topics[0]!==poolCreatedTopic) continue;
        selected.push(l);
        const pons = decodePonsResult(l, { from: native, to: null }, { registry, tokenForCurve: c => curves.get(lower(c)) ?? null });
        const standard = decodePoolEvents(l, { registry, isV3Pool: a => pools.has(lower(a)) });
        if (needsSender(l,scope,registry)) {
          const n = BigInt(l.blockNumber), reasons = receiptReasons.get(n) ?? new Set<ReceiptReason>();
          receiptBlocks.add(n); receiptReasons.set(n,reasons);
          for (const e of pons.events) reasons.add(e.kind === 'trade' ? 'pons_coin_trade' : e.kind === 'launch' ? 'launch' : 'other_event');
          for (const e of standard.events) if (e.source === 'uniswap_v3' || e.source === 'uniswap_v4') {
            if (e.eventName === 'Swap') {
              const id = e.source === 'uniswap_v3' ? emitter : lower(e.args.id);
              reasons.add(poolCurrencies.get(id)?.some(a=>ponsTokens.has(a)) ? 'pons_coin_trade' : 'other_indexed_token');
            } else if (e.eventName !== 'PoolCreated') reasons.add('liquidity');
          }
        }
      }
      if(chunkTransfers) {
        const addresses=[...tokens].filter(a=>a!==native) as Address[];
        if(addresses.length) { const transfers=await remote(()=>this.logs({from,to,addresses,topics:[transferTopic]}));validate(transfers);selected.push(...transfers.filter(l=>tokens.has(lower(l.address)))); }
      }
      // Transfer is already in the OR topic scan. Reuse it; address chunks are a size-error fallback only.
      timings.logs=selected.length;
      const unique = new Map<string, RpcLog>();
      for (const l of selected) {
        const previous = unique.get(identity(l));
        if (previous && (lower(previous.blockHash) !== lower(l.blockHash) || previous.data !== l.data || previous.address !== l.address || previous.topics.join() !== l.topics.join())) throw new ReorgDuringTick('Conflicting logs');
        unique.set(identity(l), l);
      }
      const blocks = new Map<bigint, RpcLog[]>();
      for (const l of [...unique.values()].sort(order)) { const n = BigInt(l.blockNumber); const group = blocks.get(n) ?? []; group.push(l); blocks.set(n, group); }
      const headers = new Map<bigint, RpcBlock>();
      const rawHashes = new Map(candidates.map(l => [BigInt(l.blockNumber), l.blockHash]));
      if(previousHash)rawHashes.set(from-1n,previousHash);
      const headerBegan=performance.now();
      const parentRead=Promise.allSettled([...blocks].filter(([n])=>!rawHashes.has(n-1n)).map(([n])=>this.rpc.run(async()=>{
        // TODO(spec): Logs omit parentHash. Preserve exact sparse parent links until the
        // spec defines their representation; public-only recovery avoids paid header spill.
        headers.set(n,await (this.client.parentHeader?.(n)??this.client.timestampHeader?.(n)??this.header(n)));
        timings.headers++;timings.parentHeaders++;
      }))).then(reads=>{timings.parentHeadersMs=performance.now()-headerBegan;return reads;});
      const receiptBegan=performance.now();
      let receiptActive=0;
      const receiptRead = Promise.allSettled([...receiptBlocks].map(n => this.rpc.run(async () => {
        const began=performance.now();
        timings.receiptConcurrency=Math.max(timings.receiptConcurrency,++receiptActive);
        try {
          const receipts=await this.client.receipts(n);
          timings.receipts++;
          for(const reason of receiptReasons.get(n)??[])timings.receiptReasons[reason]++;
          return [n,receipts] as const;
        } finally {
          receiptActive--;
          const elapsed=performance.now()-began;
          timings.receiptRpcMs+=elapsed;timings.receiptMaxMs=Math.max(timings.receiptMaxMs,elapsed);
        }
      }))).then(reads=>{timings.receiptsMs=performance.now()-receiptBegan;return reads;});
      // Timestamp capability recovery and receipt loading use independent providers.
      const timestampRead = (async()=>{
        const began=performance.now();
        try {
          if(this.timestampProbe!==false && this.client.timestampLogs && [...blocks].some(([n,ls])=>!receiptBlocks.has(n)&&ls.every(l=>!l.blockTimestamp||BigInt(l.blockTimestamp)===0n))){
            timings.timestampScans++;
            let stamped:RpcLog[]=[];
            try {stamped=await this.client.timestampLogs!({from,to,topics:headTopics});}
            catch(error){if(rpcStopReason(error)||!isRangeLimit(error))throw error;}
            validate(stamped);
            const timestamps=new Map<bigint,Hex>();
            for(const l of stamped){const n=BigInt(l.blockNumber);if(candidateHashes.has(n)&&candidateHashes.get(n)!==lower(l.blockHash))throw new ReorgDuringTick('Timestamp provider hash mismatch');if(!l.blockTimestamp||BigInt(l.blockTimestamp)===0n)continue;const prior=timestamps.get(n);if(prior&&BigInt(prior)!==BigInt(l.blockTimestamp))throw new ReorgDuringTick('Conflicting provider timestamps');timestamps.set(n,l.blockTimestamp);}
            this.timestampProbe=timestamps.size>0;
            for(const [n,ls] of blocks){const timestamp=timestamps.get(n);if(timestamp){if(ls.some(l=>l.blockTimestamp&&BigInt(l.blockTimestamp)>0n&&BigInt(l.blockTimestamp)!==BigInt(timestamp)))throw new ReorgDuringTick('Timestamp provider mismatch');blocks.set(n,ls.map(l=>({...l,blockTimestamp:timestamp})));}}
          }
        } finally {timings.timestampMs=performance.now()-began;}
      })();
      // Drain both siblings even on failure before retrying or invalidating caches.
      const results=await remote(()=>Promise.allSettled([receiptRead,timestampRead,parentRead]));
      for(const result of results)if(result.status==='rejected')throw result.reason;
      const parents=await parentRead;
      const parentFailure=parents.find(r=>r.status==='rejected');if(parentFailure?.status==='rejected')throw parentFailure.reason;
      const reads=await receiptRead;
      const failed=reads.find(r=>r.status==='rejected');
      if(failed?.status==='rejected')throw failed.reason;
      const receiptsByBlock=new Map(reads.flatMap(r=>r.status==='fulfilled'?[[r.value[0],r.value[1]] as const]:[]));
      const fallbackBegan=performance.now();
      await remote(async()=>{
        const reads=await Promise.allSettled([...blocks].map(([n,logs])=>this.rpc.run(async()=>{
          const timestampKnown=[...logs,...(receiptsByBlock.get(n)?.flatMap(r=>r.logs)??[])].some(l=>l.blockTimestamp&&BigInt(l.blockTimestamp)>0n);
          if(headers.has(n)){if(!timestampKnown)timings.timestampHeaders++;return;}
          if(timestampKnown)return;
          const header=await (this.client.timestampHeader?.(n)??this.header(n));
          headers.set(n,header);timings.headers++;
          timings.timestampHeaders++;
        })));
        const failure=reads.find(r=>r.status==='rejected');if(failure?.status==='rejected')throw failure.reason;
      });
      timings.timestampHeadersMs=performance.now()-fallbackBegan;
      timings.headersMs=performance.now()-headerBegan;
      return {from,to,head,scope,candidates,blocks,hashes:rawHashes,headers,receiptsByBlock,discoveredPools,timings,meterBefore};
  }
  private async applyWindow(data:WindowData) {
      const {from,to,head,scope,candidates,blocks,hashes,headers,receiptsByBlock,discoveredPools}=data;
      const registry=this.decoder.registry;
      const knownTokens=new Map<string,TokenMetadata>(scope.tokenRows.map(r=>[hex(r.address),{...r,totalSupply:r.total_supply==null?null:BigInt(r.total_supply),supplyBlock:r.supply_block==null?null:BigInt(r.supply_block)}]));
      const storedHashes=new Map((await this.db.sql.query<{number:string;hash:Uint8Array}>('SELECT number,hash FROM chain_blocks WHERE number BETWEEN $1 AND $2',[(from-1n).toString(),to.toString()])).rows.map(r=>[BigInt(r.number),hex(r.hash)]));
      let newest: Hex | null = null;
      const entries=[...blocks];
      const batchSize=Math.min(this.options.maxRange??200,200);
      for (let offset=0;offset<entries.length;offset+=batchSize) {
        const batch=new BlockRows(), states:Prepared[]=[], dates:Date[]=[], pending:Pick<Prepared,'tokens'|'pools'>={tokens:new Map(),pools:new Map()};
        let last:RpcBlock|null=null;
        const contexts=entries.slice(offset,offset+batchSize).map(([n,logs])=>{
          const first = logs[0];
          if (logs.some(l => lower(l.blockHash) !== lower(first.blockHash))) throw new ReorgDuringTick('Inconsistent block logs');
          const storedHash = storedHashes.get(n);
          if (storedHash && storedHash !== lower(first.blockHash)) throw new ReorgDuringTick('Stored block hash mismatch');
          const all = receiptsByBlock.get(n);
          let receipts: RpcReceipt[];
          if (all) {
            if (new Set(all.map(r => lower(r.transactionHash))).size !== all.length || all.some(r => r.logs.some(l => l.removed || lower(l.blockHash) !== lower(first.blockHash) || BigInt(l.blockNumber) !== n || lower(l.transactionHash) !== lower(r.transactionHash)) || BigInt(r.blockNumber) !== n || lower(r.blockHash) !== lower(first.blockHash) || !r.from || !('to' in r))) throw new ReorgDuringTick('Inconsistent receipts');
            const observed = new Map(all.flatMap(r => r.logs).map(l => [identity(l), l]));
            for (const l of logs) { const r = observed.get(identity(l)); if (!r || r.removed || lower(r.blockHash) !== lower(l.blockHash) || r.data !== l.data || lower(r.address) !== lower(l.address) || r.topics.join() !== l.topics.join()) throw new ReorgDuringTick('Log missing from canonical receipts'); }
            receipts = all;
          } else {
            receipts = [...new Set(logs.map(l => lower(l.transactionHash)))].map(hash => ({ transactionHash: hash, blockHash: first.blockHash, blockNumber: first.blockNumber, logs: logs.filter(l => lower(l.transactionHash) === hash), from: native, to: null, synthetic:true }));
          }
          const times=[...logs,...(all?.flatMap(r=>r.logs)??[])].flatMap(l=>l.blockTimestamp && BigInt(l.blockTimestamp)>0n ? [BigInt(l.blockTimestamp)] : []);
          if (new Set(times).size>1) throw new ReorgDuringTick('Conflicting block timestamps');
          let timestamp=times[0] == null ? null : toHex(times[0]);
          let parentHash=hashes.get(n-1n) ?? storedHashes.get(n-1n);
          if (!timestamp || !parentHash) {
            const header=headers.get(n);
            if(!header)throw new Error('Missing validated block header');
            if (BigInt(header.number)!==n || lower(header.hash)!==lower(first.blockHash) || BigInt(header.timestamp)<=0n) throw new ReorgDuringTick('Invalid timestamp/header');
            if (timestamp && BigInt(timestamp)!==BigInt(header.timestamp)) throw new ReorgDuringTick('Timestamp/header mismatch');
            timestamp=header.timestamp; parentHash=header.parentHash;
          }
          const block: RpcBlock = { number: first.blockNumber, hash: first.blockHash, parentHash, timestamp, transactionsComplete:false, transactions: receipts.map(r => ({ hash: r.transactionHash, from: r.from!, to: r.to!, type: r.type, transactionIndex:r.transactionIndex })) };
          const keys = new Set(logs.map(identity));
          const contextReceipts = receipts.map(r => ({ ...r, logs: r.logs.filter(l => keys.has(identity(l)) || userOpTopics.includes(l.topics[0])) }));
          return {n,logs,receipts,block,keys,contextReceipts,scope:this.decoder.scopeForBlock(scope,contextReceipts.flatMap(r=>r.logs)).scope};
        });
        const barrier=(ctx:typeof contexts[number])=>ctx.receipts.some(r=>r.type!=null&&BigInt(r.type)===4n)
          || ctx.logs.some(l=>l.topics[0]===poolCreatedTopic || decodePonsResult(l,{from:native,to:null},{registry,tokenForCurve:()=>null}).events.some(e=>e.kind==='launch')
            || decodePoolEvents(l,{registry}).events.some(e=>e.source==='uniswap_v4'&&e.eventName==='Initialize'));
        for(let start=0;start<contexts.length;) {
          // Creation and SetCode blocks are ordered barriers: later prefetch must see
          // committed metadata and the new delegation code, never an earlier cache entry.
          let end=start+1;
          if(!barrier(contexts[start]))while(end<contexts.length&&end-start<this.rpc.limit&&!barrier(contexts[end]))end++;
          if(this.stopping||this.client.rpcStopped?.())return;
          const enrichmentBegan=performance.now();
          this.timings.enrichmentConcurrency=Math.max(this.timings.enrichmentConcurrency,end-start);
          const reads=await this.remote(()=>Promise.allSettled(contexts.slice(start,end).map(ctx=>this.decoder.prefetch(ctx.block,ctx.contextReceipts,{head:true,codeCacheSec:this.options.codeCacheSec,knownTokens,discoveredPools,scope:ctx.scope}))));
          this.timings.enrichmentMs+=performance.now()-enrichmentBegan;
          const failed=reads.find(r=>r.status==='rejected');if(failed?.status==='rejected')throw failed.reason;
          for(let i=start;i<end;i++) {
            if(this.stopping||this.client.rpcStopped?.())return;
            const {n,logs,receipts,block,keys,contextReceipts}=contexts[i];
            dates.push(new Date(Number(BigInt(block.timestamp))*1000));
            const read=reads[i-start];if(read.status!=='fulfilled')throw new Error('Missing enrichment');
            const remote=read.value;
            const prepareBegan=performance.now();
            const scoped=this.decoder.scopeForBlock(scope,contextReceipts.flatMap(r=>r.logs),pending);
            const prepared = await this.decoder.prepare(this.db, block, contextReceipts, { remote,pending:scoped.pending,scope:scoped.scope,tokenRows:scoped.scope.tokenRows,poolRows:scoped.scope.poolRows });
            const filtered = receipts.map(r => ({ ...r, logs: r.logs.filter(l => keys.has(identity(l))) }));
            for(const r of filtered)for(const l of r.logs)if(v3PoolTopics.has(l.topics[0])&&!prepared.pools.has(lower(l.address))&&lower(l.address)!==lower(registry.requireAddress('uniswapV4.poolManager'))){const hints=candidates.filter(t=>lower(t.transactionHash)===lower(l.transactionHash)&&t.topics[0]===transferTopic&&t.topics.slice(1,3).some(a=>lower(`0x${a.slice(-40)}`)===lower(l.address))).map(t=>lower(t.address));(l as RpcLog&{currencyHints?:string[]}).currencyHints=[...new Set(hints)];}
            batch.add('chain_blocks',{ number:n.toString(),block:n.toString(),hash:binary(block.hash),parent_hash:binary(block.parentHash),ts:new Date(Number(BigInt(block.timestamp))*1000) });
            batch.merge(this.decoder.collect(block,filtered,prepared));
            for (const [id,pool] of prepared.pools) pending.pools.set(id,{...pool,currency0:lower(pool.currency0) as Address,currency1:lower(pool.currency1) as Address,...(pool.hooks?{hooks:lower(pool.hooks) as Address}:{})});
            for (const [id,token] of prepared.tokens) pending.tokens.set(id,{...token,address:lower(token.address) as Address,curve:token.curve?lower(token.curve) as Address:null});
            states.push(prepared); last=block;
            this.decoder.committed(prepared);
            for (const [address, token] of prepared.tokens) knownTokens.set(address, token);
            newest = block.timestamp;
            this.timings.prepareMs+=performance.now()-prepareBegan;
          }
          start=end;
        }
        if (this.stopping || this.client.rpcStopped?.()) { this.decoder.invalidate(); return; }
        const writeBegan=performance.now();
        try {
          await this.db.tx(async tx=>{
            for(const date of dates) await tx.ensurePartitions(date);
            await batch.flush(tx);
            // A larger fetch still commits bounded prefixes. Never skip uncommitted suffixes.
            const covered=offset+batchSize>=entries.length?to:BigInt(last!.number);
            await tx.setCursor('head_logs',covered,null);
            if(last) { const applied=await tx.cursor('head');if(applied==null||BigInt(last.number)>=applied)await tx.setCursor('head',BigInt(last.number),last.hash); }
          });
        } catch(error) { this.decoder.invalidate();throw error; }
        finally { this.timings.dbWriteMs+=performance.now()-writeBegan; }
        this.decoder.metrics.blocks+=states.length;
      }
      if(!entries.length)await this.db.setCursor('head_logs',to,null);
      this.decoder.metrics.observeLogs(newest, head - to);
      this.window=Math.min(this.options.maxRange??200,this.window*2);
  }
  async run() {
    if (await this.client.chainId() !== 4663) throw new Error('RPC chain ID must be 4663');
    this.pipeline=true;
    try { while (!this.stopping && !this.client.rpcStopped?.()) {
      const began = Date.now();
      await this.tick();
      if (this.stopping || this.client.rpcStopped?.()) break;
      await new Promise<void>(resolve => { const timer = setTimeout(resolve, Math.max(0, (this.options.tickMs ?? 1000) - (Date.now() - began))); this.wake = () => { clearTimeout(timer); resolve(); }; });
      this.wake = undefined;
    }} finally {await this.discardAhead();this.pipeline=false;}
  }
}
