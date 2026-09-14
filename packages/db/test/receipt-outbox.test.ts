import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { concat, encodeAbiParameters, keccak256, stringToHex } from 'viem';
import { canonicalize, createGuardReceiptCodec } from '@eko/shared';
import type { PublicReceiptPayload } from '@eko/shared';
import { openDb, migrate, migrateEngines, publishReceipt, publishPrivateReceipt, ReceiptOutbox } from '../src/index.js';
import type { ChainDb } from '../src/index.js';

const codec=createGuardReceiptCodec({concat,encodeAbiParameters,keccak256,stringToHex});
const at='2026-10-02T00:00:00.000Z',coin=`0x${'ab'.repeat(20)}` as const;
let db:ChainDb;
function payload(id:string, overrides:Partial<PublicReceiptPayload>={}):PublicReceiptPayload {
  const deterministicInput={rawAmount:'900719925474099312345',heldShare:0.123456789,status:'observed',sourceHash:codec.hash('fixture-source')};
  return {schemaVersion:'public-receipt-1',canonicalization:'jcs-rfc8785/v1',receiptId:id,revisionId:id,kind:'verdict',
    chainId:4663,coin,recordedAt:at,modelIds:[],personaSetVersion:null,cardSchemaVersion:'fixture-card-1',rulesVersion:'fixture-rules-1',
    outputSchemaVersion:'verdict-1',snapshotHash:codec.hash(deterministicInput),deterministicInput,decision:{level:'pending',heldShare:0.123456789},
    window:{kind:'snapshot',blockNumber:20,blockHash:codec.hash('fixture-block')},supersedes:null,reorgOf:null,...overrides};
}
beforeAll(async()=>{db=await openDb({pgliteDir:':memory:'});await migrate(db);await migrateEngines(db);});
afterAll(async()=>{await db?.close();});
describe('079 immutable public outbox, synthetic PGlite only',()=>{
  it('recovers after a crash between producer commit and enqueue, with no acknowledgement cursor',async()=>{
    const original=payload('crash-recovery');
    await db.tx(async tx=>{await publishReceipt(tx,'fixture-producer',original);});
    // Producer has committed; process exits before any receipts action.
    const restarted=new ReceiptOutbox(db);
    expect(await restarted.get(original.receiptId)).toBeNull();
    expect(await restarted.recover(1)).toBe(1);expect(await restarted.recover(1)).toBe(0);
    const item=(await restarted.get(original.receiptId))!;
    expect(item.canonicalPayload).toBe(canonicalize(original));expect(item.item.hash).toBe(codec.hash(original));
    expect(item.receipt).toEqual({status:'recorded',id:original.receiptId,payloadHash:item.item.hash});
    expect(item.receipt).not.toHaveProperty('root');expect(item.receipt).not.toHaveProperty('batchId');expect(item.receipt).not.toHaveProperty('txHash');
  });
  it('rolls producer persistence back if its transaction crashes and retries an interrupted enqueue',async()=>{
    const raw=payload('rollback');
    await expect(db.tx(async tx=>{await publishReceipt(tx,'fixture-producer',raw);throw new Error('fixture crash');})).rejects.toThrow('fixture crash');
    expect((await db.sql.query('SELECT id FROM receipt_publications WHERE id=$1',[raw.receiptId])).rows).toHaveLength(0);
    await publishReceipt(db,'fixture-producer',raw);
    await expect(db.tx(async tx=>{await new ReceiptOutbox(tx).enqueue(raw.receiptId);throw new Error('enqueue crash');})).rejects.toThrow('enqueue crash');
    expect(await new ReceiptOutbox(db).get(raw.receiptId)).toBeNull();
    expect(await new ReceiptOutbox(db).recover()).toBe(1);
  });
  it('accepts exact duplicates, rejects altered input and identity collisions, and retains raw precision',async()=>{
    const raw=payload('duplicate'),outbox=new ReceiptOutbox(db);
    await publishReceipt(db,'fixture-producer',raw);await publishReceipt(db,'fixture-producer',raw);
    const items=await Promise.all([outbox.enqueue(raw.receiptId),outbox.enqueue(raw.receiptId)]);expect(items[0]).toEqual(items[1]);
    await expect(publishReceipt(db,'fixture-producer',{...raw,decision:{level:'danger'}})).rejects.toThrow('different input');
    await expect(publishReceipt(db,'fixture-producer',{...raw,receiptId:'other-id'})).rejects.toThrow('different input');
    await expect(publishReceipt(db,'fixture-producer',{...raw,snapshotHash:codec.hash('wrong')})).rejects.toThrow('snapshot hash');
    const stored=(await outbox.get(raw.receiptId))!;
    expect(stored.item.hash).not.toBe(codec.hash({...raw,decision:{level:'pending',heldShare:0.125}}));
    expect(stored.payload.deterministicInput).toEqual(raw.deterministicInput);
    expect(stored.leaf).toBe(codec.encodeReceiptLeaf(stored.item));
    await expect(db.sql.query('UPDATE receipt_items SET data=$1 WHERE id=$2',['{}',raw.receiptId])).rejects.toThrow('append-only');
    await expect(db.sql.query('DELETE FROM receipt_publications WHERE id=$1',[raw.receiptId])).rejects.toThrow('append-only');
    await expect(outbox.enqueue('invented-forecast')).rejects.toThrow('durable');
  });
  it('replays same-block corrections and reorg references without changing the original bytes',async()=>{
    const old=payload('same-block-original');await publishReceipt(db,'fixture-producer',old);
    const correction=payload('same-block-correction',{decision:{level:'monitor'},supersedes:old.receiptId,reorgOf:old.receiptId});
    await publishReceipt(db,'fixture-producer',correction);
    const outbox=new ReceiptOutbox(db);expect(await outbox.recover(1)).toBe(1);expect(await outbox.recover(1)).toBe(1);expect(await outbox.recover()).toBe(0);
    expect((await outbox.get(old.receiptId))!.canonicalPayload).toBe(canonicalize(old));
    expect((await outbox.get(correction.receiptId))!.payload).toEqual(correction);
    expect(correction.window).toEqual(old.window);
  });
  it('preserves actual forecast model/persona/schema/window metadata without inventing its commit block',async()=>{
    const forecast=payload('fixture-forecast',{kind:'forecast',modelIds:['fixture-model-v1'],personaSetVersion:'fixture-personas-v2',
      outputSchemaVersion:'forecast-1',window:{kind:'forecast',startsAt:'commit_block',durationSec:3600},decision:{summary:'Fixture output'}});
    await publishReceipt(db,'fixture-swarm',forecast);const outbox=new ReceiptOutbox(db);await outbox.recover();
    const stored=(await outbox.get(forecast.receiptId))!;expect(stored.payload).toEqual(forecast);expect(stored.item.kind).toBe('forecast');
    expect(stored.receipt.status).toBe('recorded');expect(stored.receipt).not.toHaveProperty('batchId');
    const tree=codec.buildReceiptTree([stored.item]);
    await db.sql.query('INSERT INTO receipt_batches VALUES($1,$2,$3,$4,$5,$6)',['fixture-prepared',4663,tree.root,1,'2026-10-02T00:05:00.000Z',at]);
    await db.sql.query('INSERT INTO receipt_batch_items VALUES($1,$2,$3,$4)',['fixture-prepared',forecast.receiptId,0,JSON.stringify(tree.proofs[0])]);
    expect((await outbox.get(forecast.receiptId))!.receipt.status).toBe('recorded');
    await expect(db.sql.query('DELETE FROM receipt_batches')).rejects.toThrow('append-only');
    await expect(publishReceipt(db,'fixture-swarm',{...forecast,receiptId:'missing-model',revisionId:'missing-model',modelIds:[]})).rejects.toThrow('model/persona');
  });
});

it('092 recovers private commitments independently of deleted harness rows, with no private reveal',async()=>{
  const id='private-fixture-receipt',hash=keccak256(stringToHex('fixture-salted-commitment')),outbox=new ReceiptOutbox(db);
  await expect(db.tx(async tx=>{await publishPrivateReceipt(tx,'private-rollback',hash,at);throw new Error('fixture crash');})).rejects.toThrow('fixture crash');
  expect((await db.sql.query('SELECT id FROM receipt_private_publications WHERE id=$1',['private-rollback'])).rows).toHaveLength(0);
  await publishPrivateReceipt(db,id,hash,at);await publishPrivateReceipt(db,id,hash,at);
  await expect(publishPrivateReceipt(db,id,keccak256(stringToHex('other')),at)).rejects.toThrow('identity reused');
  expect(await outbox.getPrivate(id)).toBeNull();expect(await outbox.recover()).toBe(1);expect(await outbox.recover()).toBe(0);
  expect(await outbox.getPrivate(id)).toEqual({id,kind:'harness_private',hash});expect(await outbox.get(id)).toBeNull();
  const row=(await db.sql.query<{data:unknown;canonical_payload:string;leaf:string}>('SELECT * FROM receipt_items WHERE id=$1',[id])).rows[0]!;
  expect(row.data).toEqual({id,kind:'harness_private',hash});expect(row.canonical_payload).toBe(canonicalize(row.data));
  expect(row.leaf).toBe(codec.encodeReceiptLeaf({id,kind:'harness_private',hash}));
  await expect(db.sql.query('DELETE FROM receipt_private_publications WHERE id=$1',[id])).rejects.toThrow('append-only');
});
