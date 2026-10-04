import { afterEach, describe, expect, it } from 'vitest';
import { openDb, migrate, migrateEngines, binary, type ChainDb } from '@eko/db';
import { encodeFunctionData, parseAbi, type Address, type Hex } from 'viem';
import { walletFeatures, sizeBucket, entropy, type FeatureInput, type FingerprintSwap, type WalletFeatures } from '../src/watcher/features.js';
import { FP_MODEL, likelyAgentScore, resolveFingerprintLabel } from '../src/watcher/score.js';
import { calldataShape } from '../src/watcher/calldata.js';
import { loadFingerprintInput, updateFingerprintWallet, replayFingerprints, refreshFingerprints } from '../src/watcher/store.js';
import { walletLabelsAt, writeRegistryLabels } from '../src/registry-labels.js';
const address=(n:number)=>`0x${n.toString(16).padStart(40,'0')}` as Address;
const hash=(n:number)=>`0x${n.toString(16).padStart(64,'0')}` as Hex;
const wallet=address(1),router=address(2),coin=address(3);
const sec=1790985600;
const swap=(n:number,changes:Partial<FingerprintSwap>={}):FingerprintSwap=>({block:n,sec:sec+n,txHash:hash(n),logIndex:1,coin:address(n),buy:true,router,aa4337:false,shape:'shape',selector:'0x12345678',ethNotional:'1000000000000000000',gasLimit:'100000',gasUsed:'80000',orbio:false,...changes});
const input=(swaps:FingerprintSwap[],changes:Partial<FeatureInput>={}):FeatureInput=>({swaps,block:1000,sec:sec+1000,delegated7702:false,knownRouters:[router],userops:[],useropsComplete:true,reactions:[],...changes});
const empty=():WalletFeatures=>walletFeatures(input([]));
describe('fp-1.0.0 pure features',()=>{
  it('uses at most 200 swaps within an inclusive 14-day cut, excludes future blocks and deduplicates',()=>{
    const swaps=Array.from({length:201},(_,n)=>swap(n+1));
    swaps.push(swap(1001),swap(999,{sec:sec+1001}),swap(0,{sec:sec+1000-14*86400-1}),swap(201));
    expect(walletFeatures(input(swaps)).swaps).toBe(200);
    expect(walletFeatures(input([swap(1,{sec:sec+1000-14*86400})])).swaps).toBe(1);
    expect(()=>walletFeatures(input([swap(1),swap(1,{aa4337:true})]))).toThrow('Conflicting');
  });
  it('computes actor shares, modal routers/shapes, buy sizes and distinct transaction gas patterns',()=>{
    const swaps=Array.from({length:20},(_,n)=>swap(n+1,{aa4337:n<11,router:n<17?router:address(4),shape:n<19?'a':'b',ethNotional:n<13?'10004':'10009',gasLimit:String((n+1)*1000),gasUsed:String((n+1)*500)}));
    const f=walletFeatures(input(swaps,{userops:[{hash:hash(1),block:1,sec,paymaster:true},{hash:hash(1),block:1,sec,paymaster:true},{hash:hash(2),block:2,sec,paymaster:false}]}));
    expect(f).toMatchObject({aa4337Share:0.55,paymasterShare:0.5,routerTopShare:0.85,routerKnownAgent:true,calldataShapeShare:0.95,sizeRepeatShare:0.65,gasLimitRepeatShare:1,intervalCv:0,orbioCredit:false});
    expect(sizeBucket('99999')).toBe('100000');expect(sizeBucket('10004')).toBe('10000');expect(sizeBucket('0')).toBe('0');
  });
  it('uses block gaps and reaction times for same-second trades with sample floors',()=>{
    const swaps=Array.from({length:20},(_,n)=>swap(n+1,{sec}));
    expect(walletFeatures(input(swaps)).intervalCv).toBe(0);expect(walletFeatures(input(swaps.slice(1))).intervalCv).toBeNull();
    const reactions=Array.from({length:5},(_,n)=>({coin:address(n+10),firstBuyBlock:10+n,launchBlock:1,buyerRank:50}));
    expect(walletFeatures(input(swaps,{reactions})).reactionP10Blocks).toBe(9);
    expect(walletFeatures(input(swaps,{reactions:reactions.slice(1)})).reactionP10Blocks).toBeNull();
    expect(walletFeatures(input(swaps,{reactions:reactions.map(r=>({...r,buyerRank:51}))})).reactionP10Blocks).toBeNull();
    expect(walletFeatures(input(swaps,{block:9,reactions})).reactionP10Blocks).toBeNull();
  });
  it('computes Shannon entropies, seven-day UTC hours, selector/counterparty pairs and explicit missing observations',()=>{
    expect(entropy(Array.from({length:60},(_,n)=>String(n)))).toBeCloseTo(Math.log2(60));
    const swaps=Array.from({length:24},(_,n)=>swap(n+1,{sec:sec+n*3600}));
    expect(walletFeatures(input(swaps,{sec:sec+86400})).hourEntropy).toBeCloseTo(Math.log2(24));
    expect(walletFeatures(input([swap(1,{sec:sec-8*86400})],{sec})).hourEntropy).toBeNull();
    const f=walletFeatures(input([swap(1,{aa4337:null,shape:null,gasLimit:null,ethNotional:null,orbio:null})],{delegated7702:null,knownRouters:null,useropsComplete:false}));
    expect(f.missing).toEqual(expect.arrayContaining(['aa4337Share','calldataShapeShare','gasLimitRepeatShare','sizeRepeatShare','orbioCredit','paymasterShare','delegated7702','routerKnownAgent']));
    expect(f.txEntropy).toBe(0);expect(empty().swaps).toBe(0);
    expect(walletFeatures(input([swap(1,{buy:false,orbio:true})])).orbioCredit).toBeNull();
    expect(walletFeatures(input([swap(1,{orbio:true}),swap(2,{orbio:null})])).orbioCredit).toBe(true);
  });
  it.each([
    ['routerTopShare',0.8,0.80001,0.6],['calldataShapeShare',0.9,0.90001,0.9],['intervalCv',0.35,0.34999,1.3],
    ['secOfMinuteEntropy',3,2.99999,1.1],['hourEntropy',4.3,4.30001,0.7],['reactionP10Blocks',11,10,1.8],
    ['sizeRepeatShare',0.6,0.60001,0.9],['gasLimitRepeatShare',0.8,0.80001,0.7],
  ] as const)('honors exact %s score boundary',(key,off,on,weight)=>{
    const f={...empty(),swaps:5,[key]:off},base=likelyAgentScore(f);
    const logit=(v:number)=>Math.log(v/(1-v));
    expect(logit(likelyAgentScore({...f,[key]:on}))-logit(base)).toBeCloseTo(weight);
  });
  it('implements all continuous and boolean weights and precedence independently of risk bands',()=>{
    const f={...empty(),swaps:5};
    for(const [key,weight] of [['aa4337Share',1.6],['paymasterShare',0.8],['delegated7702',1.2],['routerKnownAgent',2],['orbioCredit',1.5]] as const) {
      const on=typeof f[key]==='boolean'||key==='delegated7702'||key==='routerKnownAgent'||key==='orbioCredit'?true:1;
      expect(likelyAgentScore({...f,[key]:on})).toBeCloseTo(1/(1+Math.exp(-(-3.2+weight))));
    }
    const model={...FP_MODEL,bias:0,threshold:0.5};
    expect(resolveFingerprintLabel(f,{model})).toMatchObject({label:'likely_agent',confidence:0.5,tier:null,beta:true});
    expect(resolveFingerprintLabel({...f,swaps:4})).toMatchObject({label:'human',tier:'low',score:0});
    const crew={status:'qualified' as const,crewId:'crew_fixture',confidence:0.95,evidence:[]};
    expect(resolveFingerprintLabel(f,{model,crew})).toMatchObject({label:'crew',tier:'high'});
    expect(resolveFingerprintLabel(f,{model,crew,declared:true})).toMatchObject({label:'declared_agent',confidence:0.99,crewId:'crew_fixture'});
    expect(()=>resolveFingerprintLabel(f,{crew:{...crew,status:'candidate'} as never})).toThrow('Unqualified');
    for(const confidence of [0.6,0.75,0.9])expect(resolveFingerprintLabel(f,{crew:{...crew,confidence}}).tier).toBe(confidence===0.6?'low':confidence===0.75?'medium':'high');
  });
  it('decodes supported multicall shapes without conflating deadlines or missing minimum-output observations',()=>{
    const abi=parseAbi(['function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) payable returns (uint256)','function multicall(uint256 deadline,bytes[] data) payable returns (bytes[])']);
    const call=(minimum:bigint)=>encodeFunctionData({abi,functionName:'exactInputSingle',args:[{tokenIn:coin,tokenOut:router,fee:3000,recipient:wallet,amountIn:1n,amountOutMinimum:minimum,sqrtPriceLimitX96:0n}]});
    const data=(minimum:bigint,deadline:number)=>encodeFunctionData({abi,functionName:'multicall',args:[BigInt(deadline),[call(minimum)]]});
    expect(calldataShape(data(0n,sec+120),sec).shape).toBe(calldataShape(data(0n,sec+130),sec).shape);
    expect(calldataShape(data(1n,sec+120),sec).shape).not.toBe(calldataShape(data(0n,sec+120),sec).shape);
    expect(calldataShape('0x12345678',sec)).toEqual({selector:'0x12345678',shape:null});
  });
});
let db:ChainDb|undefined;
afterEach(async()=>{await db?.close();db=undefined;});
async function setup(){db=await openDb({pgliteDir:':memory:'});await migrate(db);await migrateEngines(db);await db.ensurePartitions(new Date(sec*1000));return db;}
async function indexed(db:ChainDb,block:number,a=wallet,fork=0) {
  await db.insert('chain_blocks',{number:String(block),block:String(block),hash:binary(hash(block+fork)),parent_hash:binary(hash(block-1)),ts:new Date(sec*1000)});
  await db.insert('swaps',{ts:new Date(sec*1000),block:String(block),tx_hash:binary(hash(block)),log_index:1,venue:'uniswap_v3',pool_id:binary(router),coin:binary(coin),quote_asset:binary(address(0)),trader:binary(a),tx_from:binary(a),tx_to:binary(block%2?router:address(4)),side:1,amount_coin:'1',amount_quote:'1000000000000000000',price_quote:1});
}
describe('indexed wallet fingerprint storage',()=>{
  it('updates changed wallets incrementally, replays bounded original cuts and snapshots without duplicate labels',async()=>{
    const db=await setup();for(let b=1;b<=6;b++)await indexed(db,b);
    expect(walletFeatures((await loadFingerprintInput(db,wallet,6)).input).swaps).toBe(6);
    const first=await replayFingerprints(db,1,6,{limit:2});expect(first).toMatchObject({processed:2,runs:2,labels:1,next:{block:2}});
    const next=await replayFingerprints(db,1,6,{limit:10,after:first.next!});expect(next).toMatchObject({processed:4,runs:4,labels:1,next:null});
    expect(await replayFingerprints(db,1,6)).toMatchObject({runs:0,labels:0});
    expect((await walletLabelsAt(db,[wallet],4n))[0]).toMatchObject({label:'human',tier:'low',features:{swaps:1,beta:true}});
    expect((await walletLabelsAt(db,[wallet],6n))[0]).toMatchObject({label:'human',tier:'medium',features:{swaps:5}});
    expect(await refreshFingerprints(db,6)).toMatchObject({wallets:1,runs:0});expect(await refreshFingerprints(db,6)).toMatchObject({wallets:0});
    await indexed(db,7);expect(await refreshFingerprints(db,7)).toMatchObject({wallets:1,runs:1,labels:0});
    await expect(db.sql.query('UPDATE wallet_fingerprint_runs SET score=0')).rejects.toThrow('append-only');
    await expect(db.sql.query('DELETE FROM wallet_labels')).rejects.toThrow('append-only');
  });
  it('relabels original history for a new immutable model version and retains declared/crew precedence',async()=>{
    const db=await setup();for(let b=1;b<=5;b++)await indexed(db,b);
    await replayFingerprints(db,1,5);
    const model={...FP_MODEL,version:'fp-fixture-2',bias:10};
    await replayFingerprints(db,1,5,{model,crewAt:async()=>({status:'qualified',crewId:'crew_fixture',confidence:0.95,evidence:['qualified_fixture']})});
    expect((await walletLabelsAt(db,[wallet],5n,model.version))[0]).toMatchObject({label:'crew',crew_id:'crew_fixture'});
    expect((await walletLabelsAt(db,[wallet],5n,FP_MODEL.version))[0].label).toBe('human');
    await db.insert('agent_registry',{agent_id:'1',owner:binary(address(8)),wallet:binary(wallet),registered_block:'2',wallet_block:'2',block:'2',block_hash:binary(hash(2)),evidence:'{}'});
    await replayFingerprints(db,1,5,{model,crewAt:async()=>({status:'qualified',crewId:'crew_fixture',confidence:0.95,evidence:['qualified_fixture']})});
    expect((await walletLabelsAt(db,[wallet],5n,model.version))[0]).toMatchObject({label:'declared_agent',crew_id:'crew_fixture'});
    await writeRegistryLabels(db,{crewAt:async()=>({status:'qualified',crewId:'crew_fixture',confidence:0.95,evidence:[]})});expect((await walletLabelsAt(db,[wallet],5n))[0]).toMatchObject({label:'declared_agent',crew_id:'crew_fixture'});
  });
  it('keeps orphaned feature and label rows immutable and unavailable, appends replacement-fork generations',async()=>{
    const db=await setup();for(let b=1;b<=5;b++)await indexed(db,b);
    await replayFingerprints(db,1,5);
    const before=(await db.sql.query('SELECT * FROM wallet_labels ORDER BY id')).rows;
    await db.tx(tx=>tx.deleteAbove(4n));expect((await walletLabelsAt(db,[wallet],5n))[0].tier).toBe('low');
    await indexed(db,5,wallet,100);await updateFingerprintWallet(db,wallet,5);
    expect((await walletLabelsAt(db,[wallet],5n))[0]).toMatchObject({tier:'medium',features:{swaps:5}});
    for(const old of before)expect((await db.sql.query('SELECT * FROM wallet_labels WHERE id=$1',[(old as {id:string}).id])).rows[0]).toEqual(old);
    expect((await db.sql.query("SELECT * FROM wallet_labels WHERE model_version LIKE '%:correction:%'")).rows).toHaveLength(1);
  });
  it('binds each UserOp to the swap log and actor; shared bundlers/paymasters never become agents or crews',async()=>{
    const db=await setup();await indexed(db,1);await indexed(db,2,address(9));
    const coverage={holderAttribution:{bindings:[{logIndex:'1',sender:wallet,operationHash:hash(100)},{logIndex:'3',sender:address(9),operationHash:hash(101)}],gaps:[]}};
    await db.insert('wallet_protocol_coverage',{chain_id:4663,block:'1',block_hash:binary(hash(1)),tx_hash:binary(hash(1)),timestamp_sec:String(sec),scope:'scoped_receipt',input_hash:binary(hash(50)),data:JSON.stringify(coverage)});
    expect(walletFeatures((await loadFingerprintInput(db,wallet,1)).input).aa4337Share).toBe(1);
    expect(walletFeatures((await loadFingerprintInput(db,address(9),2)).input).aa4337Share).toBeNull();
    await replayFingerprints(db,1,2);expect(await walletLabelsAt(db,[router],2n)).toEqual([]);
    expect((await walletLabelsAt(db,[wallet],2n))[0].crew_id).toBeNull();
    await db.insert('tokens',{address:binary(coin),first_block:'1',block:'1'});
    await db.insertMany('swaps',Array.from({length:50},(_,n)=>({ts:new Date(sec*1000),block:'1',tx_hash:binary(hash(500+n)),log_index:1,venue:'uniswap_v3',pool_id:binary(router),coin:binary(coin),quote_asset:binary(address(0)),trader:null,senders_pending:true,side:1,amount_coin:'1',amount_quote:'1',price_quote:1})));
    expect((await loadFingerprintInput(db,wallet,1)).input.reactions[0].buyerRank).toBe(51);
  });

  it('computes sponsored UserOp shares only with explicit history coverage and respects known-at cuts and code revocation',async()=>{
    const db=await setup();await indexed(db,1);await indexed(db,2);
    for(const b of [1,2])await db.insert('userops',{chain_id:4663,block:String(b),block_hash:binary(hash(b)),tx_hash:binary(hash(b)),timestamp_sec:String(sec),log_index:3,
      entry_point:binary(router),version:'0.7',user_op_hash:binary(hash(100+b)),sender:binary(wallet),paymaster:binary(b===1?address(8):address(0)),nonce:String(b),success:true,actual_gas_cost:'1',actual_gas_used:'1',data:'{}'});
    const history={useropHistoryAt:async()=>({complete:true,evidence:['coverage_fixture']})};
    expect(walletFeatures((await loadFingerprintInput(db,wallet,2,history)).input).paymasterShare).toBe(0.5);
    expect(walletFeatures((await loadFingerprintInput(db,wallet,2)).input).paymasterShare).toBeNull();
    await db.insert('wallet_protocol_coverage',{chain_id:4663,block:'1',block_hash:binary(hash(1)),tx_hash:binary(hash(1)),timestamp_sec:String(sec),scope:'scoped_receipt',input_hash:binary(hash(70)),
      data:JSON.stringify({knownAt:{cursor:{blockNumber:'2'}},holderAttribution:{bindings:[{logIndex:'1',sender:wallet,operationHash:hash(101)}],gaps:[]}})});
    expect(walletFeatures((await loadFingerprintInput(db,wallet,1)).input).aa4337Share).toBeNull();
    expect(walletFeatures((await loadFingerprintInput(db,wallet,2)).input).aa4337Share).toBeNull(); // the other swap is unobserved
    for(const b of [1,2])await db.insert('delegations_7702',{chain_id:4663,block:String(b),block_hash:binary(hash(b)),tx_hash:binary(hash(b)),timestamp_sec:String(sec),kind:'code',evidence_index:0,authority:binary(wallet),implementation:b===1?binary(router):null,
      data:JSON.stringify({code:b===1?`0xef0100${router.slice(2)}`:'0x'})});
    expect(walletFeatures((await loadFingerprintInput(db,wallet,1,{knownDelegates:[router]})).input).delegated7702).toBe(true);
    expect(walletFeatures((await loadFingerprintInput(db,wallet,2,{knownDelegates:[router]})).input).delegated7702).toBe(false);
  });
  it('does not look ahead to future swaps or delegation code and detects late protocol enrichment',async()=>{
    const db=await setup();await indexed(db,1);await indexed(db,2);
    await db.insert('delegations_7702',{chain_id:4663,block:'2',block_hash:binary(hash(2)),tx_hash:binary(hash(2)),timestamp_sec:String(sec),kind:'code',evidence_index:0,authority:binary(wallet),implementation:binary(router),data:JSON.stringify({code:`0xef0100${router.slice(2)}`})});
    expect(walletFeatures((await loadFingerprintInput(db,wallet,1,{knownDelegates:[router]})).input)).toMatchObject({swaps:1,delegated7702:null});
    expect(walletFeatures((await loadFingerprintInput(db,wallet,2,{knownDelegates:[router]})).input).delegated7702).toBe(true);
    await refreshFingerprints(db,2);
    await db.insert('wallet_protocol_coverage',{chain_id:4663,block:'1',block_hash:binary(hash(1)),tx_hash:binary(hash(1)),timestamp_sec:String(sec),scope:'full_transaction',input_hash:binary(hash(60)),data:JSON.stringify({principalBindings:'direct_transaction'})});
    expect(await refreshFingerprints(db,2)).toMatchObject({wallets:1,runs:2});
    expect(await refreshFingerprints(db,2)).toMatchObject({wallets:0});
  });
});
