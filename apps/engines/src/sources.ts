import { attributionGap } from './attribution-coverage.js';
import { loadReferenceInputs } from './reference-simulation.js';
import { binary, type ChainDb } from '@eko/db';
import { loadRegistry, type PonsProfileClient } from '@eko/chain';
import { toUntrusted } from '@eko/untrusted';
import { CONFIG_V1, RULES_VERSION, type CardSources, type HistoryView, type PriorLaunch } from '@eko/playbooks';
import type { Address, EvidenceRef, PoolRef } from '@eko/shared';
import { curveProgress, curveProgressAt, type PonsEventRow } from './curve-progress.js';
import { liveRanks } from './market.js';
import { ponsProfiles } from './pons-profile.js';
import { resolveClock, type ClockCache } from './activity.js';
import type { ReplayCache } from './replay-cache.js';
import { upperBlock } from './replay-cache.js';
import { rowHex, prepareSwap, prepareHolding, isSink, TradeAggregate, HolderAggregate, timeWindow, type TradeView } from './aggregates.js';

export interface TokenRow {
  address: Uint8Array; deployer: Uint8Array | null; curve: Uint8Array | null;
  name: string | null; symbol: string | null; launchpad: CardSources['launchpad'] | null;
  first_block: string; total_supply: string | null; decimals: number | null; supply_block: string | null;
  graduated_block: string | null; graduated_pool: Uint8Array | null;
}
export interface SwapRow {
  block: string; ts: Date; tx_hash: Uint8Array; log_index: number; trader: Uint8Array | null; senders_pending?:boolean;
  traderHex?:Address;quoteHex?:Address;poolHex?:Address;txHex?:Address;sec?:number;
  side: number; amount_coin: string; amount_quote: string; price_quote: number; usd: number | null;
  venue: string; pool_id: Uint8Array; quote_asset: Uint8Array;
}
export interface PoolRow { id: Uint8Array; currency0: Uint8Array; currency1: Uint8Array; venue: PoolRef['venue']; fee: number; hooks: Uint8Array | null; created_block:string }
export interface EventRow { block: string; ts: Date; tx_hash: Uint8Array; log_index: number; kind: string; actor: Uint8Array | null; senders_pending?:boolean; pool_id: Uint8Array; data: Record<string, string> }
export interface Holding { holder: Uint8Array; amount: string; block: string; holderHex?:Address }
export interface LoadedSources extends CardSources {
  attributionCoverage?: Record<string,import('@eko/shared').AttributionCoverageGap>;
  referenceResults?: import('@eko/chain').ReferenceResult[];
  curvePct?:number;trade:TradeView;holderSummary:{count:number;previousCount:number;top10:number;dev:number;burned:bigint;inventory:bigint};
  token: TokenRow; swaps: SwapRow[]; holdings: Holding[]; previousHoldings: Holding[]; events: EventRow[];
  poolRefs: PoolRef[]; supply?: { total: bigint; circulating: bigint; burned: bigint; block: number };
  profile?: { creatorTaxPct: number; feePct: number; antiSnipeActive: boolean; codehash: string; curve: Address; observationVersion: 'pons-getters-2' };
  sectionBlocks: { identity: number; supply?: number; liquidity?: number };
  history: HistoryView; usdComplete: boolean; trendingRank?: number; exemptionWallets: Address[]; previousHolderBlock?: number;
}
export const seconds = (date: string | Date) => new Date(date).getTime() / 1000;
export const evidence = (r: { tx_hash: Uint8Array; log_index: number; block: string }, label: string): EvidenceRef =>
  ({ kind: 'log', ref: `${rowHex(r.tx_hash)}:${r.log_index}`, block: Number(r.block), label });
const eq = (a: Uint8Array, b: Uint8Array) => rowHex(a) === rowHex(b);

export async function holdingsAt(db: ChainDb, coin: Address, block: number, cache?:ReplayCache,lane='now'): Promise<Holding[]> {
  if(cache)return cache.holdingsAt(coin,block,lane);
  // Latest balances are used only when the requested view contains all indexed transfers.
  const future = (await db.sql.query('SELECT 1 FROM token_transfers WHERE token=$1 AND block>$2 LIMIT 1', [binary(coin), block])).rows.length;
  if (!future) return (await db.sql.query<Holding>('SELECT holder,amount,last_block AS block FROM balances WHERE token=$1 AND amount>0 ORDER BY holder', [binary(coin)])).rows.map(prepareHolding);
  return (await db.sql.query<Holding>(`SELECT holder,sum(amount)::text AS amount,max(block)::text AS block FROM (
    SELECT to_address AS holder,amount,block FROM token_transfers WHERE token=$1 AND block<=$2 AND kind='Transfer'
    UNION ALL SELECT from_address,-amount,block FROM token_transfers WHERE token=$1 AND block<=$2 AND kind='Transfer'
    -- Compacted history (retention) is one net row per holder, exact for views at or after its newest block.
    UNION ALL SELECT holder,amount,through_block FROM transfer_baselines WHERE token=$1 AND through_block<=$2
    ) m GROUP BY holder HAVING sum(amount)>0 ORDER BY holder`, [binary(coin), block])).rows.map(prepareHolding);
}
export async function historyAt(db: ChainDb, deployer: Address, coin: Address, block: number, cache?:ReplayCache): Promise<HistoryView> {
  if(cache)return cache.historyAt(deployer,coin,block);
  const stats = (await db.sql.query<{ data: PriorLaunch }>(`SELECT DISTINCT ON(coin) data FROM deployer_stats
    WHERE deployer=$1 AND coin<>$2 AND valid_from_block<=$3 AND rules_version=$4 ORDER BY coin,valid_from_block DESC`, [binary(deployer), binary(coin), block, RULES_VERSION])).rows;
  return { launches: stats.map(r => r.data) };
}
/** Reads shared by every coin evaluated in one live poll (most of them at the same head block). */
export interface SourceMemo { ranks: Map<string, Promise<Map<Address, number>>> }
async function readSources(db: ChainDb, coin: Address, block: number, client?: PonsProfileClient, clock?:ClockCache,cache?:ReplayCache,retrospective=false,memo?:SourceMemo): Promise<LoadedSources | null> {
  const token = cache ? cache.tokens.get(coin) : (await db.sql.query<TokenRow>('SELECT * FROM tokens WHERE address=$1 AND first_block<=$2', [binary(coin), block])).rows[0];
  if(token && Number(token.first_block)>block)return unavailable(db,coin,block,'launch_after_checkpoint');
  if (!token?.deployer || token.name == null || token.symbol == null) return unavailable(db,coin,block,'missing_launch_identity');
  const [now,created]=await Promise.all([resolveClock(db,block,undefined,clock),resolveClock(db,Number(token.first_block),undefined,clock)]);
  if (!now || !created) return unavailable(db,coin,block,'missing_block_clock');
  const asOfSec = seconds(now.ts), createdAtSec = seconds(created.ts);
  const cachedRows=cache ? await cache.coinRows(coin) : undefined;
  const swaps = cachedRows ? cachedRows.swaps : (await db.sql.query<SwapRow>('SELECT * FROM swaps WHERE coin=$1 AND block<=$2 ORDER BY block,log_index,tx_hash', [binary(coin), block])).rows.map(prepareSwap);
  const swapEnd=cachedRows ? upperBlock(swaps,block) : swaps.length;
  const poolRows = cachedRows ? cachedRows.pools.filter(p=>Number(p.created_block)<=block) : (await db.sql.query<PoolRow>('SELECT * FROM pools WHERE (currency0=$1 OR currency1=$1) AND created_block<=$2 ORDER BY id', [binary(coin), block])).rows;
  const events = cachedRows ? cachedRows.events.slice(0,upperBlock(cachedRows.events,block)) : (await db.sql.query<EventRow>(`SELECT e.* FROM liquidity_events e JOIN pools p ON p.id=e.pool_id
    WHERE (p.currency0=$1 OR p.currency1=$1) AND e.block<=$2 ORDER BY e.block,e.log_index,e.tx_hash`, [binary(coin), block])).rows;
  const exemptions = cachedRows ? cachedRows.exemptions.filter(e=>Number(e.block)<=block) : (await db.sql.query<{ wallet: Uint8Array; block: string; tx_hash: Uint8Array; log_index: number }>('SELECT * FROM pons_exemptions WHERE token=$1 AND block<=$2 ORDER BY wallet', [binary(coin), block])).rows;
  const exSet=new Set(exemptions.map(e=>rowHex(e.wallet))),deployer=rowHex(token.deployer);
  const priorBlock = cache ? cache.priorBlock(asOfSec-3600,block) : (await db.sql.query<{ number: string }>('SELECT number FROM engine_block_times WHERE ts<=to_timestamp($1) AND number<=$2 ORDER BY number DESC LIMIT 1', [asOfSec - 3600, block])).rows[0];
  let holdings:Holding[]=[],previousHoldings:Holding[]=[];
  const makeHolders=(rows:Holding[])=>{const state=new HolderAggregate(coin,token.curve ? rowHex(token.curve) : undefined,loadRegistry().addressOf('ours.burnWallet')?.toLowerCase() as Address|undefined);for(const r of rows)state.set(rowHex(r.holder),BigInt(r.amount),Number(r.block));return state;};
  const wallets=[...(token.curve ? [rowHex(token.curve)] : []),deployer,...exSet,...poolRows.map(p=>rowHex(p.id))];
  if(!cache){holdings=await holdingsAt(db,coin,block);previousHoldings=priorBlock ? await holdingsAt(db,coin,Number(priorBlock.number)) : [];}
  const holderView=cache ? await cache.holderViewAt(coin,block,wallets) : (()=>{const a=makeHolders(holdings);return {count:a.count,top10:a.top10(),burned:a.burned,inventory:a.inventory,amounts:new Map(wallets.map(wallet=>[wallet,a.amount(wallet)]))};})();
  const previousCount=priorBlock ? cache ? (await cache.holderViewAt(coin,Number(priorBlock.number),[],'previous')).count : makeHolders(previousHoldings).count : 0;
  const scratch=cache ? undefined : new TradeAggregate(swaps);
  const trade=cache ? await cache.tradeAt(coin,block,asOfSec,exSet) : {...scratch!.advance(swapEnd,asOfSec),bought:scratch!.boughtFor(exSet)};
  const history=await historyAt(db,deployer,coin,block,cache);
  const s:LoadedSources={coin,deployer,asOfBlock:block,asOfSec,createdAtBlock:Number(token.first_block),createdAtSec,
    launchpad:token.launchpad ?? 'other',name:toUntrusted(token.name,120).text,symbol:toUntrusted(token.symbol,32).text,
    tokenText:[{ref:`${coin}:name`,raw:token.name},{ref:`${coin}:symbol`,raw:token.symbol}],token,swaps,holdings,previousHoldings,events,history,trade,
    holderSummary:{count:holderView.count,previousCount,top10:holderView.top10,dev:!isSink(deployer,coin) && (!token.curve || deployer!==rowHex(token.curve)) ? Number(holderView.amounts.get(deployer) ?? 0n) : 0,burned:holderView.burned,inventory:holderView.inventory},
    poolRefs:[],exemptionWallets:[...exSet],usdComplete:trade.usdComplete,sectionBlocks:{identity:Number(token.first_block)},...(priorBlock ? {previousHolderBlock:Number(priorBlock.number)} : {})};
  if(token.curve && s.launchpad==='pons') {
    if(token.graduated_block != null && Number(token.graduated_block)<=block) s.curvePct=100;
    else {
      const progress=cachedRows ? cachedRows.progress : curveProgress((await db.sql.query<PonsEventRow>(
        "SELECT block,kind,data FROM pons_events WHERE token=$1 AND block<=$2 AND kind IN ('launch','trade') ORDER BY block,log_index,tx_hash",[binary(coin),block])).rows,Number(token.first_block));
      s.curvePct=curveProgressAt(progress,block);
    }
  }
  // Full historical arrays are materialized only for horizon outcomes/debug consumers.
  if(cache){let prefix:SwapRow[]|undefined,materialized=false,previousMaterialized=false;Object.defineProperty(s,'swaps',{enumerable:false,get:()=>prefix ??= swaps.slice(0,swapEnd)});Object.defineProperty(s,'holdings',{enumerable:false,get:()=>{if(!materialized){holdings=cache.materializeHoldings(coin,cachedRows!,block);materialized=true;}return holdings;}});Object.defineProperty(s,'previousHoldings',{enumerable:false,get:()=>{if(!previousMaterialized){previousHoldings=priorBlock ? cache.materializeHoldings(coin,cachedRows!,Number(priorBlock.number)) : [];previousMaterialized=true;}return previousHoldings;}});}

  if (token.curve && s.launchpad === 'pons') {
    s.profile=await ponsProfiles(db).read(coin,rowHex(token.curve),block,now.hash,client,clock);
    if (s.profile) {
      s.antiSnipeActive = s.profile.antiSnipeActive;
      // Getter amounts do not prove reconciled effective charges or immutability.
      // Validated effective fees and reachable powers live in the captured Guard profile path.
    }
  }
  // Do not read a future supply sample into historical cards. Mint/burn reconstruction is not assumed complete.
  if (token.total_supply != null && token.supply_block != null && Number(token.supply_block) <= block) {
    const total = BigInt(token.total_supply);
    const burned=holderView.burned,inventory=holderView.inventory;
    s.supply = { total, burned, circulating: total > burned + inventory ? total - burned - inventory : 0n, block: Number(token.supply_block) };
    s.sectionBlocks.supply = Math.min(block, s.supply.block);
  }
  if (s.supply && s.supply.total > 0n) {
    const ex: NonNullable<CardSources['pons']>['exemptions'] = [];
    for (const e of exemptions) {
      const rugs = (await db.sql.query<{ n: string }>(`SELECT count(DISTINCT d.coin) AS n FROM deployer_stats d JOIN outcomes o ON o.coin=d.coin
        WHERE d.deployer=$1 AND d.coin<>$2 AND d.valid_from_block<=$3 AND o.valid_from_block<=$3 AND o.outcome='rugged'`, [e.wallet, binary(coin), block])).rows[0];
      // TODO(spec): without crews, prior rugs use this exempt wallet's own deployer history only.
      ex.push({ wallet: rowHex(e.wallet), crewRugRuns: Number(rugs.n), log: evidence(e, 'Snipe-tax exemption') });
    }
    s.pons = { ...(s.profile ? { creatorTaxPct: s.profile.creatorTaxPct, feePct: s.profile.feePct } : {}), exemptions: ex,
      boughtShare: trade.bought / Number(s.supply.total),
      heldShare: [...exSet].sort().reduce((n,wallet)=>n+Number(holderView.amounts.get(wallet) ?? 0n),0) / Number(s.supply.total) };
  }
  const recent=trade.recent;
  if (s.usdComplete) {
    const trips: NonNullable<CardSources['wash']>['roundTrips'] = [];
    const cfg = CONFIG_V1.wash_to_trend;
    const actors=trade.actors;
    for (const [actor,{rows}] of actors) {
      const actorTrips: typeof trips = [];
      let open: SwapRow[] = [], net = 0, gross = 0;
      for (const r of rows) {
        if (open.length && r.sec! - open[0].sec! > cfg.roundTripSec) { open = []; net = 0; gross = 0; }
        open.push(r); net += r.side * Number(r.amount_coin); gross += r.side===1 ? Number(r.amount_coin) : 0;
        if (gross > 0 && open.some(r => r.side === -1) && Math.abs(net) / gross <= cfg.maxNetShare) {
          actorTrips.push({ actor, durationSec: r.sec! - open[0].sec!, netShare: net / gross,
            volumeUsd: open.reduce((n, r) => n + r.usd!, 0), evidence: open.map(r => evidence(r, 'Actor round trip')) });
          open = []; net = 0; gross = 0;
        }
      }
      if (actorTrips.length >= cfg.minRoundTripsPerActor) trips.push(...actorTrips);
    }
    const volumeUsd1h=trade.volumeUsd1h;
    s.wash = { volumeUsd1h, traders1h: actors.size, roundTrips: trips,
      washEstPct: volumeUsd1h > 0 ? 100 * trips.reduce((n, r) => n + r.volumeUsd, 0) / volumeUsd1h : 0 };
    if (token.curve) s.curve = { ageH: (asOfSec - createdAtSec) / 3600, volumeUsd: trade.curveVolume,
      progressUsd: trade.curveProgress, clusters: [], feeClaims: [] };
    // TODO(spec): dominant pair is the leading buy actor and leading sell actor's combined volume share.
    const leader=(side:number)=>{let best:{actor:Address;volume:number}|undefined;for(const [actor,values] of actors){const volume=side===1 ? values.buy : values.sell;if(!best || volume>best.volume || volume===best.volume && actor.localeCompare(best.actor)<0)best={actor,volume};}return best;};
    const buyer = leader(1), seller = leader(-1);
    if (buyer && seller && buyer.volume > 0 && seller.volume > 0) s.dominantPair = { buyer: buyer.actor, seller: seller.actor, share: (buyer.volume + seller.volume) / volumeUsd1h,
      evidence: recent.filter(r => (r.side === 1 ? buyer.actor : seller.actor) === r.traderHex!).map(r => evidence(r, 'Dominant actor')) };
  }
  const positions: (NonNullable<CardSources['liquidity']>['positions'][number] & { pool:string })[] = [];
  const weights = new Map<string, number>();
  for (const p of poolRows) {
    const pe = events.filter(e => eq(e.pool_id, p.id));
    const owned = new Map<string, { actor: Address; amount: bigint; refs: EvidenceRef[] }>();
    for (const e of pe) {
      if (!['Mint', 'Burn', 'ModifyLiquidity'].includes(e.kind)) continue;
      if(e.actor==null || e.senders_pending)continue;
      const actor = (e.data.owner ?? e.data.sender ?? rowHex(e.actor)).toLowerCase() as Address;
      const key = `${actor}:${e.data.tickLower}:${e.data.tickUpper}:${e.data.salt ?? ''}`;
      const o = owned.get(key) ?? { actor, amount: 0n, refs: [] };
      const delta = BigInt(e.data.liquidityDelta ?? e.data.amount ?? '0');
      o.amount += e.kind === 'Burn' ? -delta : delta; o.refs.push(evidence(e, 'Liquidity position')); owned.set(key, o);
    }
    const positive = [...owned.values()].filter(o => o.amount > 0n);
    const total = positive.reduce((n, o) => n + Number(o.amount), 0);
    const locked = token.graduated_pool && eq(p.id, token.graduated_pool) && Number(token.graduated_block) <= block;
    for (const o of positive) positions.push({ owner: o.actor, controlledBy: o.actor === deployer ? 'deployer' : 'other', share: total ? Number(o.amount) / total : 0, pool:rowHex(p.id),
      status: locked ? 'pons_locked' : 'removable', evidence: o.refs });
    // Only address-based v3 pool token balances expose reserves; v4 PoolManager balances are shared.
    const reserve = p.venue === 'uniswap_v3' ? holderView.amounts.get(rowHex(p.id)) : undefined;
    const last=trade.lastPriced;
    const usd = reserve && last ? Number(reserve) * last.usd! / Number(last.amount_coin) * 2 : 0;
    weights.set(rowHex(p.id), usd);
    s.poolRefs.push({ id: rowHex(p.id), venue: p.venue, ...(p.id.length === 20 ? { address: rowHex(p.id) } : { poolId: rowHex(p.id) }),
      quote: rowHex(eq(p.currency0, token.address) ? p.currency1 : p.currency0), feeBps: p.fee / 100,
      ...(p.hooks ? { hooks: rowHex(p.hooks) } : {}), liquidityUsd: usd, executable: false });
  }
  const reserveTotal = [...weights.values()].reduce((n,v) => n+v,0), maxReserve = Math.max(0,...weights.values());
  s.pools = poolRows.filter(p=>p.fee<0x800000).map(p => ({ id: rowHex(p.id), feeBps: p.fee / 100, liquidityShare: reserveTotal ? weights.get(rowHex(p.id))! / reserveTotal : 0,
    deepest: [...weights.values()].every(v=>v>0) && weights.get(rowHex(p.id)) === maxReserve,
    defaultRoute: !!token.graduated_pool && Number(token.graduated_block) <= block && eq(p.id, token.graduated_pool), evidence: events.filter(e => eq(e.pool_id,p.id)).map(e => evidence(e,'Pool liquidity')) }));
  // TODO(spec): aggregate LP shares across pools only when observed reserve USD supplies a denominator.
  // Single-pool ownership uses its actual position units; incomparable multi-pool units remain absent.
  if (positions.length && (poolRows.length===1 || [...weights.values()].every(v=>v>0))) {
    s.liquidity = { positions:positions.map(({ pool,...p })=>({...p,share:p.share*(poolRows.length===1 ? 1 : weights.get(pool)!/reserveTotal)})), priorRemovals: [] };
    const priorCoins = history.launches.map(p => p.coin);
    if (priorCoins.length) s.liquidity.priorRemovals = (await db.sql.query<EventRow>(`SELECT e.* FROM liquidity_events e JOIN pools p ON p.id=e.pool_id JOIN tokens t ON t.address=p.currency0 OR t.address=p.currency1
      WHERE t.deployer=$1 AND t.address<>$2 AND e.actor=$1 AND e.block<=$3 AND (e.kind='Burn' OR (e.kind='ModifyLiquidity' AND (e.data->>'liquidityDelta')::numeric<0)) ORDER BY e.block,e.log_index`, [binary(deployer), binary(coin), block])).rows.map(e => evidence(e, 'Prior liquidity removal'));
    s.sectionBlocks.liquidity = block;
  }
  if (token.graduated_block != null && Number(token.graduated_block) <= block) {
    const gb = Number(token.graduated_block);
    const gt = clock?.get(gb) ?? (await db.sql.query<{ ts: Date }>('SELECT ts FROM engine_block_times WHERE number=$1', [gb])).rows[0];
    const postBlock=upperBlock(swaps,gb-1);
    const candidates=cachedRows?.nonCurveSwaps ?? swaps.slice(0,swapEnd).filter(r=>r.venue!=='pons_curve');
    const candidate=candidates[upperBlock(candidates,gb-1)];
    const first=candidate && Number(candidate.block)<=block ? candidate : undefined;
    if (gt && first) {
      const atSec = seconds(gt.ts), insiders = new Set([deployer, ...exemptions.map(e => rowHex(e.wallet))]);
      const held=cache ? [...(await cache.holderViewAt(coin,gb-1,[...insiders],'graduation')).amounts].sort(([a],[b])=>a.localeCompare(b)).reduce((n,[,amount])=>n+Number(amount),0) : (await holdingsAt(db,coin,gb-1)).filter(r=>insiders.has(rowHex(r.holder))).reduce((n,r)=>n+Number(r.amount),0);
      const before=swaps[Math.min(postBlock,swapEnd)-1];
      s.graduation = { atSec, tx: evidence(first,'Graduation marker: first indexed pool swap'), insiderSells: held > 0 ? timeWindow(swaps,atSec-0.001,atSec+300,swapEnd,trade.monotonic).filter(r=>r.side===-1 && insiders.has(r.traderHex!) && r.usd!=null).map(r => ({
        atSec: r.sec!, soldShare: Number(r.amount_coin) / held,
        priceImpactShare: before?.usd != null ? Math.max(0,1 - (r.usd! / Number(r.amount_coin)) / (before.usd / Number(before.amount_coin))) : 0,
        evidence: [evidence(r,'Insider sell after graduation')] })) : [] };
    }
  }
  // TODO(spec): trend onset is not indexed; use the first priced trade in the preceding hourly window.
  const trending=async():Promise<NonNullable<CardSources['trending']>>=> (await db.sql.query<{ coin: Uint8Array; name: string; symbol: string; created: Date; started: Date; volume: number }>(`SELECT s.coin,t.name,t.symbol,b.ts AS created,min(s.ts) AS started,sum(s.usd) AS volume
    FROM swaps s JOIN tokens t ON t.address=s.coin JOIN engine_block_times b ON b.number=t.first_block
    WHERE s.block<=$1 AND s.ts>to_timestamp($2) AND s.usd>0 AND t.name IS NOT NULL AND t.symbol IS NOT NULL
    GROUP BY s.coin,t.name,t.symbol,b.ts ORDER BY volume DESC,s.coin LIMIT 50`, [s.createdAtBlock, createdAtSec - 3600])).rows.map((r,i) => ({ coin: rowHex(r.coin), name: toUntrusted(r.name,120).text, symbol: toUntrusted(r.symbol,32).text,
      rank: i+1, createdAtSec: seconds(r.created), trendStartedAtSec: seconds(r.started), evidence: [{ kind:'stat', ref:`${rowHex(r.coin)}:trending:${s.createdAtBlock}`, block:s.createdAtBlock, label:'Hourly USD volume rank', value:i+1 }] }));
  s.trending=cache ? await cache.trending(s.createdAtBlock,trending) : await trending();
  const ranked=cache ? await cache.ranked(block,asOfSec) : memo ? await sharedRanks(db,memo,block,asOfSec) : await liveRanks(db,block,asOfSec);
  const rank=ranked.get(coin);if(rank!=null)s.trendingRank=rank;
  const lifetime=trade.attribution,hour=attributionGap(trade.recent,'trailing_1h');
  const liquidityMissing=events.filter(e=>e.actor==null || e.senders_pending).length;
  const deferred=Number((await db.sql.query<{n:string}>(`SELECT count(*) AS n FROM pending_pool_events e JOIN pools p ON p.id=e.emitter
    WHERE (p.currency0=$1 OR p.currency1=$1) AND e.block<=$2`,[binary(coin),block])).rows[0].n);
  const liquidityGap:import('@eko/shared').AttributionCoverageGap={reason:'unattributed_liquidity',window:'pool_creation_to_checkpoint',status:liquidityMissing || deferred ? 'incomplete':'complete',
    threshold:0,totalCount:events.length+deferred,unattributedCount:liquidityMissing+deferred,countShare:events.length+deferred ? (liquidityMissing+deferred)/(events.length+deferred):0,
    totalVolumeUsd:null,unattributedVolumeUsd:null,volumeShare:null,unknownVolumeCount:liquidityMissing+deferred};
  let graduationGap=lifetime;
  if(s.graduation)graduationGap=attributionGap(timeWindow(swaps,s.graduation.atSec-0.001,s.graduation.atSec+300,swapEnd,trade.monotonic),'graduation_to_5m');
  s.attributionCoverage={holder_concentration:lifetime,insider_sells:graduationGap,deployer_sells:lifetime,bundles:lifetime,fresh_wallet_share:lifetime,
    wallet_flow:hour,wash_trading:hour,exempt_insiders:lifetime,liquidity_ownership:liquidityGap};
  if(hour.status==='incomplete'){delete s.wash;delete s.dominantPair;}
  if(lifetime.status==='incomplete')delete s.pons;
  if(graduationGap.status==='incomplete')delete s.graduation;
  if(liquidityGap.status==='incomplete')delete s.liquidity;
  await loadReferenceInputs(db,s,retrospective || cache!==undefined);
  return s;
}

async function unavailable(db:ChainDb,coin:Address,block:number,reason:string):Promise<null> {
  await db.sql.query(`INSERT INTO engine_card_failures(coin,attempts,last_block,reason) VALUES($1,1,$2,$3)
    ON CONFLICT(coin) DO UPDATE SET attempts=engine_card_failures.attempts+1,last_block=excluded.last_block,reason=excluded.reason`,[binary(coin),block,reason]);
  return null;
}
/** One hourly priced-swap read per (block, time) per poll, instead of one per evaluated coin. */
function sharedRanks(db:ChainDb,memo:SourceMemo,block:number,sec:number) {
  const key=`${block}:${sec}`;let found=memo.ranks.get(key);
  if(!found){found=liveRanks(db,block,sec);memo.ranks.set(key,found);found.catch(()=>memo.ranks.delete(key));
    // Tasks run in block order, so only the most recent few (block, time) pairs are reused.
    if(memo.ranks.size>8)memo.ranks.delete(memo.ranks.keys().next().value!);}
  return found;
}
export async function loadSources(db:ChainDb,coin:Address,block:number,client?:PonsProfileClient,clock?:ClockCache,cache?:ReplayCache,retrospective=false,memo?:SourceMemo) {
  try {return await readSources(db,coin,block,client,clock,cache,retrospective,memo);}
  catch(error){await unavailable(db,coin,block,'source_load_failed');throw error;}
}
