import { createHash } from 'node:crypto';
import { binary, hex, type ChainDb } from '@eko/db';
import { loadRegistry, type AddressRegistry } from '@eko/chain';
import type { Address } from 'viem';
import { walletLabelsAt, writeRegistryLabels, type QualifiedCrewAttachment } from '../registry-labels.js';
import { walletFeatures, type FingerprintSwap, type FeatureInput } from './features.js';
import { FP_MODEL, resolveFingerprintLabel, type FingerprintModel } from './score.js';
import { calldataShape } from './calldata.js';
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const zero=`0x${'0'.repeat(40)}`;
export const fingerprintCanonicalSql=(labelAlias:string)=>`NOT EXISTS(SELECT 1 FROM wallet_label_fingerprint_dependencies f
  JOIN wallet_fingerprint_dependencies d ON d.run_id=f.run_id WHERE f.label_id=${labelAlias}.id
  AND NOT EXISTS(SELECT 1 FROM chain_blocks b WHERE b.number=d.block AND b.hash=d.block_hash))`;
interface Coverage {
  transaction?:{input:string|null;gasLimit:string|null;gasUsed:string|null}|null;
  principalBindings?:string; userOperationEvents?:string;
  bindings?:{logIndex:string;sender:string;operationHash:string}[];
  holderAttribution?:{bindings:{logIndex:string;sender:string;operationHash:string}[];gaps:{logIndex:string}[]};
}
interface SwapRow {block:string;ts:Date;tx_hash:Uint8Array;log_index:number;coin:Uint8Array;side:number;tx_to:Uint8Array|null;quote_asset:Uint8Array;amount_quote:string;data:Coverage[]|null}
export interface FingerprintOptions {
  model?:FingerprintModel; registry?:AddressRegistry;
  /** Reviewed agent-kit implementations supplied by existing acquisition; no defaults are invented. */
  knownDelegates?:readonly Address[];
  crewAt?:(address:Address,block:bigint)=>Promise<QualifiedCrewAttachment|null>;
  /** Upstream qualified graph/history revisions trigger changed-wallet refresh without rebuilding a graph. */
  evidenceRevision?:string;
  useropHistoryAt?:(address:Address,fromSec:number,block:bigint)=>Promise<{complete:boolean;evidence:unknown}>;
}
export async function loadFingerprintInput(db:ChainDb,address:Address,block:number,options:FingerprintOptions={}) {
  const header=(await db.sql.query<{ts:Date;hash:Uint8Array}>('SELECT ts,hash FROM chain_blocks WHERE number=$1',[block])).rows[0];
  if(!header)throw new Error('Missing canonical fingerprint block');
  const sec=Math.floor(new Date(header.ts).getTime()/1000),registry=options.registry??loadRegistry();
  const rows=(await db.sql.query<SwapRow>(`SELECT s.*,(SELECT jsonb_agg(c.data ORDER BY c.scope,c.input_hash) FROM wallet_protocol_coverage c
    WHERE c.chain_id=4663 AND c.tx_hash=s.tx_hash AND c.block=s.block AND c.block_hash=b.hash AND ((c.data->'knownAt'->'cursor'->>'blockNumber') IS NULL OR (c.data->'knownAt'->'cursor'->>'blockNumber')::bigint<=$2)) AS data
    FROM swaps s JOIN chain_blocks b ON b.number=s.block WHERE s.trader=$1 AND s.block<=$2 AND s.ts BETWEEN $3 AND $4
    AND NOT s.senders_pending ORDER BY s.block DESC,s.tx_hash DESC,s.log_index DESC LIMIT 200`,[binary(address),block,new Date((sec-14*86400)*1000),header.ts])).rows;
  const knownRouters=registry.entries().filter(([k,v])=>k.startsWith('fingerprints.unknownRouters.')&&v.address!=='TODO'&&v.verified).map(([,v])=>v.address as string);
  const orbio=registry.data.fingerprints.orbioCreditExchange;
  const weth=registry.addressOf('tokens.WETH')?.toLowerCase();
  const swaps:FingerprintSwap[]=rows.map(r=>{
    const manifests=r.data??[],bindings=manifests.flatMap(c=>[...(c.bindings??[]),...(c.holderAttribution?.bindings??[])]).filter(b=>Number(b.logIndex)===r.log_index&&b.sender.toLowerCase()===address.toLowerCase());
    const direct=manifests.some(c=>c.principalBindings==='direct_transaction');
    const full=manifests.map(c=>c.transaction).filter(t=>t!=null);
    // Improved observations coexist; only consistent full inputs can describe a transaction.
    const transaction=full.length&&new Set(full.map(t=>JSON.stringify(t))).size===1?full[0]:null;
    const {selector,shape}=calldataShape(transaction?.input??null,Math.floor(new Date(r.ts).getTime()/1000));
    const quote=hex(r.quote_asset).toLowerCase();
    return {block:Number(r.block),sec:Math.floor(new Date(r.ts).getTime()/1000),txHash:hex(r.tx_hash),logIndex:r.log_index,coin:hex(r.coin),buy:r.side===1,
      router:r.tx_to?hex(r.tx_to):null,aa4337:bindings.length?true:direct?false:null,selector,shape,
      ethNotional:quote===zero||quote===weth?String(r.amount_quote):null,
      gasLimit:transaction?.gasLimit?BigInt(transaction.gasLimit).toString():null,gasUsed:transaction?.gasUsed?BigInt(transaction.gasUsed).toString():null,
      orbio:orbio.address!=='TODO'&&orbio.verified&&r.tx_to?hex(r.tx_to).toLowerCase()===orbio.address.toLowerCase():null};
  });
  const ops=(await db.sql.query<{block:string;timestamp_sec:string;user_op_hash:Uint8Array;paymaster:Uint8Array}>(`SELECT u.* FROM userops u JOIN chain_blocks b ON b.number=u.block AND b.hash=u.block_hash
    WHERE u.chain_id=4663 AND u.sender=$1 AND u.block<=$2 AND u.timestamp_sec BETWEEN $3 AND $4 AND ((u.data->'knownAt'->'cursor'->>'blockNumber') IS NULL OR (u.data->'knownAt'->'cursor'->>'blockNumber')::bigint<=$2) ORDER BY u.block DESC,u.log_index DESC LIMIT 201`,[binary(address),block,sec-14*86400,sec])).rows;
  const delegation=(await db.sql.query<{implementation:Uint8Array|null;data:{code?:string};block:string}>(`SELECT d.* FROM delegations_7702 d JOIN chain_blocks b ON b.number=d.block AND b.hash=d.block_hash
    WHERE d.chain_id=4663 AND d.authority=$1 AND d.kind='code' AND d.block=$2 ORDER BY d.tx_hash,d.evidence_index LIMIT 1`,[binary(address),block])).rows[0];
  // TODO(spec): No reviewed agent-kit implementation list or complete wallet UserOp-history certificate is specified. Missing lists/history remain null; authorizations alone never prove current code.
  const delegated7702=delegation?.data.code ? delegation.data.code.startsWith('0xef0100') ? options.knownDelegates ? options.knownDelegates.some(a=>a.toLowerCase()=== (delegation.implementation?hex(delegation.implementation):null)) : null : false : null;
  // Count each unresolved buy as a possible distinct buyer: this upper bound cannot promote a wallet into the first 50.
  // A coin whose old swaps retention deleted adds the deleted buys' buyer count (history_prunes), the same kind of bound.
  const reactions=(await db.sql.query<{coin:Uint8Array;first_buy:string;launch:string;rank:string}>(`WITH firsts AS (
    SELECT coin,min(block) AS first_buy FROM swaps WHERE trader=$1 AND side=1 AND block<=$2 AND coin=ANY($3::bytea[]) GROUP BY coin
  ) SELECT f.*,greatest((SELECT p.created_block FROM pools p WHERE p.id=(SELECT s.pool_id FROM swaps s WHERE s.trader=$1 AND s.coin=f.coin AND s.side=1 AND s.block=f.first_buy ORDER BY s.tx_hash,s.log_index LIMIT 1) AND p.created_block<=f.first_buy),
    (SELECT CASE WHEN t.graduated_block<=f.first_buy THEN t.graduated_block ELSE t.first_block END FROM tokens t WHERE t.address=f.coin AND t.first_block<=f.first_buy)) AS launch,
    (SELECT count(DISTINCT s.trader) FILTER (WHERE s.trader IS NOT NULL AND NOT s.senders_pending)
      + count(*) FILTER (WHERE s.trader IS NULL OR s.senders_pending)
      FROM swaps s WHERE s.coin=f.coin AND s.side=1 AND s.block<=f.first_buy)
      + coalesce((SELECT h.buyers FROM history_prunes h WHERE h.coin=f.coin AND h.swaps_through_block<f.first_buy),0) AS rank
    FROM firsts f`,[binary(address),block,rows.filter(r=>r.side===1).map(r=>r.coin)])).rows;
  const history=await options.useropHistoryAt?.(address,sec-14*86400,BigInt(block));
  const input:FeatureInput={block,sec,swaps,knownRouters:knownRouters.length?knownRouters:null,delegated7702,
    userops:ops.slice(0,200).map(o=>({block:Number(o.block),sec:Number(o.timestamp_sec),hash:hex(o.user_op_hash),paymaster:hex(o.paymaster)!==zero})),useropsComplete:history?.complete===true&&ops.length<=200,
    reactions:reactions.filter(r=>r.launch!=null).map(r=>({coin:hex(r.coin),firstBuyBlock:Number(r.first_buy),launchBlock:Number(r.launch),buyerRank:Number(r.rank)}))};
  const dependencies=(await db.sql.query<{number:string;hash:Uint8Array}>(`SELECT number,hash FROM chain_blocks WHERE number=ANY($1::bigint[]) ORDER BY number`,[[...new Set([block,...swaps.map(s=>s.block),...ops.map(o=>Number(o.block)),...input.reactions.flatMap(r=>[r.firstBuyBlock,r.launchBlock])])]])).rows;
  input.reactions=input.reactions.filter(r=>dependencies.some(d=>Number(d.number)===r.launchBlock)&&dependencies.some(d=>Number(d.number)===r.firstBuyBlock));
  return {input,dependencies,revision:digest({input,history,dependencies:dependencies.map(d=>[String(d.number),hex(d.hash)]),model:options.model??FP_MODEL})};
}
/** Append-only feature snapshots on every swap boundary, label rows on semantic changes only. */
export async function updateFingerprintWallet(db:ChainDb,address:Address,block:number,options:FingerprintOptions={}) {
  return db.tx(async tx=>{
    await tx.sql.query('LOCK TABLE wallet_fingerprint_state IN EXCLUSIVE MODE');
    const loaded=await loadFingerprintInput(tx,address,block,options),features=walletFeatures(loaded.input),model=options.model??FP_MODEL;
    const crew=await options.crewAt?.(address,BigInt(block))??null;
    const registrations=(await tx.sql.query<{agent_id:string;wallet:Uint8Array;wallet_block:string;block_hash:Uint8Array}>(`SELECT DISTINCT ON(agent_id) agent_id,wallet,wallet_block,block_hash FROM agent_registry WHERE wallet_block<=$2 AND agent_id IN(SELECT agent_id FROM agent_registry WHERE wallet=$1 AND wallet_block<=$2) ORDER BY agent_id,wallet_block DESC`,[binary(address),block])).rows;
    const declared=registrations.some(r=>hex(r.wallet).toLowerCase()===address.toLowerCase());
    const behavioral=resolveFingerprintLabel(features,{crew,model});
    const resolved=resolveFingerprintLabel(features,{crew,model,declared});
    const inputHash=digest({revision:loaded.revision,crew,registrations:registrations.map(r=>[String(r.agent_id),hex(r.wallet),String(r.wallet_block),hex(r.block_hash)])}),id=`fp-run:${digest({address:address.toLowerCase(),block,model:model.version,inputHash})}`;
    const inserted=(await tx.sql.query(`INSERT INTO wallet_fingerprint_runs VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING id`,
      [id,binary(address),block,loaded.dependencies.find(d=>Number(d.number)===block)!.hash,model.version,inputHash,JSON.stringify(features),resolved.score])).rows.length;
    if(!inserted)return {runs:0,labels:0};
    for(const d of loaded.dependencies)await tx.sql.query('INSERT INTO wallet_fingerprint_dependencies VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[id,d.number,d.hash]);
    const prior=(await walletLabelsAt(tx,[address],BigInt(block))).find(r=>r.source==='fingerprint');
    const generationPrior=(await tx.sql.query<{id:string;label:string;tier:string|null;crew_id:string|null}>(`SELECT l.* FROM wallet_labels l
      WHERE l.address=$1 AND l.valid_from_block<=$2 AND (l.model_version=$3 OR starts_with(l.model_version,$3||':correction:'))
      AND ${fingerprintCanonicalSql('l')} AND NOT EXISTS(SELECT 1 FROM wallet_label_registry_dependencies d WHERE d.label_id=l.id AND NOT EXISTS(SELECT 1 FROM agent_registry r WHERE r.agent_id=d.agent_id AND r.wallet_block=d.wallet_block AND r.block_hash=d.block_hash)) AND NOT EXISTS(SELECT 1 FROM wallet_label_supersessions s JOIN wallet_labels r ON r.id=s.replacement_id WHERE s.prior_id=l.id AND r.source='fingerprint' AND ${fingerprintCanonicalSql('r')})
      ORDER BY l.valid_from_block DESC,l.id DESC LIMIT 1`,[binary(address),block,model.version])).rows[0];
    const previous=generationPrior??(prior?.model_version===model.version?prior:undefined);
    if(previous&&previous.label===resolved.label&&previous.tier===resolved.tier&&previous.crew_id===resolved.crewId)return {runs:1,labels:0};
    const labelId=`wallet-label:fp:${digest({id,resolved})}`;
    const existing=(await tx.sql.query('SELECT id FROM wallet_labels WHERE address=$1 AND valid_from_block=$2 AND model_version=$3',[binary(address),block,model.version])).rows.length;
    const generation=existing?`${model.version}:correction:${digest(labelId)}`:model.version;
    await tx.sql.query(`INSERT INTO wallet_labels VALUES($1,$2,$3,$4,$5,'fingerprint',$6,$7,$8,$9)`,[labelId,binary(address),resolved.label,resolved.confidence,resolved.tier,resolved.crewId,
      JSON.stringify({...features,beta:true,score:resolved.score,behavioral,crewEvidence:crew?.evidence??null,registration:registrations.map(r=>({agentId:String(r.agent_id),wallet:hex(r.wallet),walletBlock:String(r.wallet_block)}))}),generation,block]);
    await tx.sql.query('INSERT INTO wallet_label_fingerprint_dependencies VALUES($1,$2)',[labelId,id]);
    for(const r of registrations)await tx.sql.query('INSERT INTO wallet_label_registry_dependencies VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[labelId,String(r.agent_id),String(r.wallet_block),r.block_hash]);
    await tx.sql.query(`INSERT INTO wallet_label_supersessions SELECT l.id,$1 FROM wallet_labels l WHERE l.address=$2 AND l.valid_from_block=$3
      AND l.id<>$1 AND (l.model_version=$4 OR starts_with(l.model_version,$4||':correction:')) ON CONFLICT DO NOTHING`,[labelId,binary(address),block,model.version]);
    return {runs:1,labels:1};
  });
}
export interface ReplayCursor {block:number;address:Address}
/** Bounded keyset replay. Call with next until complete; original swap blocks are preserved for new model generations. */
export async function replayFingerprints(db:ChainDb,from:number,to:number,options:FingerprintOptions&{limit?:number;after?:ReplayCursor}={}) {
  const limit=options.limit??256;
  if(!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<0||to<from||!Number.isSafeInteger(limit)||limit<1||limit>1000)throw new Error('Invalid fingerprint replay bounds');
  const events=(await db.sql.query<{block:string;trader:Uint8Array}>(`SELECT DISTINCT s.block,s.trader FROM swaps s JOIN chain_blocks b ON b.number=s.block WHERE s.block BETWEEN $1 AND $2 AND trader IS NOT NULL AND NOT senders_pending
    AND ($3::bigint IS NULL OR s.block>$3 OR (s.block=$3 AND trader>$4)) ORDER BY s.block,s.trader LIMIT $5`,[from,to,options.after?.block??null,options.after?binary(options.after.address):null,limit+1])).rows;
  let runs=0,labels=0;const batch=events.slice(0,limit);
  for(const e of batch){const result=await updateFingerprintWallet(db,hex(e.trader) as Address,Number(e.block),options);runs+=result.runs;labels+=result.labels;}
  await writeRegistryLabels(db,{crewAt:options.crewAt});
  const last=batch.at(-1);
  return {runs,labels,processed:batch.length,next:events.length>limit&&last?{block:Number(last.block),address:hex(last.trader) as Address}:null,modelVersion:(options.model??FP_MODEL).version,beta:true};
}
/** Incremental changed-wallet refresh: bounded wallets and at most 200 swap boundaries per wallet. */
export async function refreshFingerprints(db:ChainDb,to:number,options:FingerprintOptions&{walletLimit?:number}={}) {
  const limit=options.walletLimit??16,model=options.model??FP_MODEL;
  if(!Number.isSafeInteger(limit)||limit<1||limit>256)throw new Error('Invalid fingerprint wallet bound');
  const head=(await db.sql.query<{ts:Date}>('SELECT ts FROM chain_blocks WHERE number=$1',[to])).rows[0];
  if(!head)return {wallets:0,runs:0,labels:0};
  // Content revisions catch late sender/protocol enrichment and rollback, rather than max(block) alone.
  const changed=(await db.sql.query<{trader:Uint8Array;revision:string;blocks:string[]}>(`WITH wallets AS (
    SELECT DISTINCT trader FROM swaps WHERE block<=$1 AND ts BETWEEN $2 AND $3 AND trader IS NOT NULL AND NOT senders_pending
  ), revisions AS (SELECT w.trader, array_agg(s.block ORDER BY s.block) AS blocks,
    md5(string_agg(s.block::text||':'||encode(s.tx_hash,'hex')||':'||s.log_index::text||':'||s.amount_quote::text||':'||coalesce(encode(s.tx_to,'hex'),'')||':'||encode(b.hash,'hex'),',' ORDER BY s.block,s.tx_hash,s.log_index)
      ||coalesce((SELECT string_agg(encode(c.input_hash,'hex'),',' ORDER BY c.block,c.tx_hash,c.input_hash) FROM wallet_protocol_coverage c
        WHERE c.chain_id=4663 AND c.block<=$1 AND c.tx_hash=ANY(array_agg(s.tx_hash))),'')
      ||coalesce((SELECT string_agg(encode(d.block_hash,'hex')||d.data::text,',' ORDER BY d.block,d.tx_hash,d.evidence_index) FROM delegations_7702 d WHERE d.authority=w.trader AND d.block<=$1 AND d.timestamp_sec BETWEEN extract(epoch FROM $2::timestamptz) AND extract(epoch FROM $3::timestamptz)),'')
      ||coalesce((SELECT string_agg(encode(u.user_op_hash,'hex')||encode(u.paymaster,'hex'),',' ORDER BY u.block,u.log_index) FROM userops u WHERE u.sender=w.trader AND u.block<=$1 AND u.timestamp_sec BETWEEN extract(epoch FROM $2::timestamptz) AND extract(epoch FROM $3::timestamptz)),'')
      ||coalesce((SELECT string_agg(a.wallet_block::text||encode(a.wallet,'hex')||encode(a.block_hash,'hex'),',' ORDER BY a.agent_id,a.wallet_block) FROM agent_registry a WHERE a.wallet_block<=$1 AND a.agent_id IN(SELECT agent_id FROM agent_registry WHERE wallet=w.trader AND wallet_block<=$1)),'')||$6::text
    ) AS revision FROM wallets w CROSS JOIN LATERAL (SELECT * FROM swaps s WHERE s.trader=w.trader AND s.block<=$1 AND s.ts BETWEEN $2 AND $3 AND NOT s.senders_pending ORDER BY s.block DESC,s.tx_hash DESC,s.log_index DESC LIMIT 200) s
    JOIN chain_blocks b ON b.number=s.block GROUP BY w.trader
  ) SELECT r.* FROM revisions r LEFT JOIN wallet_fingerprint_state f ON f.address=r.trader AND f.model_version=$4
    WHERE f.revision IS DISTINCT FROM r.revision ORDER BY r.trader LIMIT $5`,[to,new Date(new Date(head.ts).getTime()-14*86400*1000),head.ts,model.version,limit,digest({model,registry:(options.registry??loadRegistry()).data,knownDelegates:options.knownDelegates,evidenceRevision:options.evidenceRevision})])).rows;
  let runs=0,labels=0;
  for(const w of changed) {
    const address=hex(w.trader) as Address;
    for(const block of [...new Set(w.blocks.map(Number))]){const r=await updateFingerprintWallet(db,address,block,options);runs+=r.runs;labels+=r.labels;}
    await db.sql.query(`INSERT INTO wallet_fingerprint_state VALUES($1,$2,$3,$4) ON CONFLICT(address,model_version) DO UPDATE SET revision=excluded.revision,through_block=excluded.through_block`,[w.trader,model.version,w.revision,to]);
  }
  if(changed.length)await writeRegistryLabels(db,{crewAt:options.crewAt});
  return {wallets:changed.length,runs,labels};
}
