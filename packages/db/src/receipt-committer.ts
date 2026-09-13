import { randomUUID } from 'node:crypto';
import { concat, encodeAbiParameters, keccak256, stringToHex } from 'viem';
import type { Address, Hex } from 'viem';
import { canonicalize, createReceiptEncoder } from '@eko/shared';
import type { ReceiptItem } from '@eko/shared';
import type { ChainDb } from './client.js';
import { ReceiptOutbox } from './receipt-outbox.js';

const codec = createReceiptEncoder({ concat, encodeAbiParameters, keccak256, stringToHex });
export interface ReceiptBatch { id: string; root: Hex; items: ReceiptItem[]; proofs: Hex[][]; through: string }
export interface ReceiptCommitAttempt { tx_hash: Hex; batch_id: string; registry: Address; committer: Address; nonce: string; raw_transaction: Hex }
export interface ReceiptCommitAnchor { batchId: number; txHash: Hex; registry: Address; committer: Address; root: Hex; leafCount: number; blockNumber: string; blockHash: Hex; logIndex: number }

/** Database clock leases plus row locking fence every journal mutation. An expired
 * worker may only have an already persisted identical raw broadcast in flight. */
export class ReceiptCommitJournal {
  readonly owner = randomUUID();
  constructor(readonly db: ChainDb, readonly leaseMs = 60000) {
    if (!Number.isInteger(leaseMs) || leaseMs < 1000) throw new Error('Invalid receipt lease');
  }
  async acquire() {
    return (await this.db.sql.query(`UPDATE receipt_worker_lease SET owner=$1,lease_until=clock_timestamp()+$2*interval '1 millisecond'
      WHERE chain_id=4663 AND (owner=$1 OR lease_until<=clock_timestamp()) RETURNING owner`, [this.owner, this.leaseMs])).rows.length === 1;
  }
  async fenced<T>(fn: (db: ChainDb) => Promise<T>) {
    return this.db.tx(async tx => {
      const rows = (await tx.sql.query(`UPDATE receipt_worker_lease SET lease_until=clock_timestamp()+$2*interval '1 millisecond'
        WHERE chain_id=4663 AND owner=$1 AND lease_until>clock_timestamp() RETURNING owner`, [this.owner, this.leaseMs])).rows;
      if (!rows.length) throw new Error('Receipt lease lost');
      return fn(tx);
    });
  }
  async heartbeat() { await this.fenced(tx => tx.sql.query('UPDATE receipt_worker_lease SET heartbeat_at=clock_timestamp() WHERE chain_id=4663')); }
  async release() { await this.db.sql.query("UPDATE receipt_worker_lease SET owner='',lease_until=clock_timestamp() WHERE chain_id=4663 AND owner=$1", [this.owner]); }
  async health() { return (await this.db.sql.query<{ heartbeat_age_s: string; heartbeat_missing: boolean }>('SELECT * FROM receipt_commit_health WHERE chain_id=4663')).rows[0]!; }
  async batch(now: number): Promise<ReceiptBatch | null> {
    if (!Number.isFinite(now)) throw new Error('Invalid receipt time');
    return this.fenced(async tx => {
      const pending = (await tx.sql.query<{id:string;root:Hex;through:Date;leaf_count:number}>(`SELECT b.* FROM receipt_batches b WHERE b.chain_id=4663
        AND NOT EXISTS(SELECT 1 FROM receipt_commit_anchors a WHERE a.batch_id=b.id AND NOT EXISTS(
          SELECT 1 FROM receipt_commit_anchor_events e WHERE e.anchor_id=a.id AND e.kind='orphaned')) ORDER BY b.recorded_at,b.id LIMIT 1`)).rows[0];
      if (pending) {
        const rows = (await tx.sql.query<{id:string;kind:ReceiptItem['kind'];payload_hash:Hex;proof:Hex[]}>(`SELECT r.id,r.kind,r.payload_hash,i.proof FROM receipt_batch_items i
          JOIN receipt_items r ON r.id=i.receipt_id WHERE i.batch_id=$1 ORDER BY i.item_index`, [pending.id])).rows;
        const items = rows.map(r => ({id:r.id,kind:r.kind,hash:r.payload_hash}));
        const tree = codec.buildReceiptTree(items);
        if (items.length !== pending.leaf_count || tree.root !== pending.root || canonicalize(tree.proofs) !== canonicalize(rows.map(r => r.proof))) throw new Error('Receipt batch integrity failure');
        return {id:pending.id,root:tree.root,items,proofs:tree.proofs,through:new Date(pending.through).toISOString()};
      }
      const through = new Date(Math.floor(now / 300000) * 300000).toISOString();
      const rows = (await tx.sql.query<{id:string}>(`SELECT r.id FROM receipt_items r WHERE r.chain_id=4663 AND r.recorded_at<$1
        AND NOT EXISTS(SELECT 1 FROM receipt_batch_items i WHERE i.receipt_id=r.id)
        AND NOT EXISTS(SELECT 1 FROM guard_receipt_anchors a WHERE a.receipt_id=r.id AND NOT EXISTS(
          SELECT 1 FROM guard_receipt_anchor_events e WHERE e.anchor_id=a.id)) ORDER BY r.recorded_at,r.id`, [through])).rows;
      if (!rows.length) return null;
      const outbox = new ReceiptOutbox(tx);
      const items: ReceiptItem[] = [];
      for (const row of rows) items.push((await outbox.get(row.id))!.item);
      const tree = codec.buildReceiptTree(items);
      const id = keccak256(stringToHex(canonicalize({chainId:4663,through,items})));
      await tx.sql.query('INSERT INTO receipt_batches VALUES($1,4663,$2,$3,$4,$5)', [id,tree.root,items.length,through,new Date(now)]);
      for (const [index,item] of items.entries()) await tx.sql.query('INSERT INTO receipt_batch_items VALUES($1,$2,$3,$4)', [id,item.id,index,JSON.stringify(tree.proofs[index])]);
      return {id,root:tree.root,items,proofs:tree.proofs,through};
    });
  }
  async attempt(batch: ReceiptBatch) {
    return (await this.db.sql.query<ReceiptCommitAttempt>(`SELECT a.*,a.nonce::text AS nonce FROM receipt_commit_attempts a WHERE a.batch_id=$1
      AND NOT EXISTS(SELECT 1 FROM receipt_commit_failures f WHERE f.tx_hash=a.tx_hash)
      ORDER BY a.recorded_at,a.tx_hash DESC LIMIT 1`, [batch.id])).rows[0];
  }
  async saveAttempt(attempt: ReceiptCommitAttempt) {
    await this.fenced(tx => tx.sql.query(`INSERT INTO receipt_commit_attempts(tx_hash,batch_id,registry,committer,nonce,raw_transaction)
      VALUES($1,$2,$3,$4,$5,$6)`, [attempt.tx_hash,attempt.batch_id,attempt.registry,attempt.committer,attempt.nonce,attempt.raw_transaction]));
  }
  async failed(attempt: ReceiptCommitAttempt, blockNumber: bigint, blockHash: Hex) {
    await this.fenced(tx => tx.sql.query('INSERT INTO receipt_commit_failures(tx_hash,block_number,block_hash) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [attempt.tx_hash,String(blockNumber),blockHash]));
  }
  async anchor(batch: ReceiptBatch, data: ReceiptCommitAnchor) {
    await this.fenced(async tx => {
      const existing=(await tx.sql.query<{data:ReceiptCommitAnchor}>(`SELECT a.data FROM receipt_commit_anchors a WHERE a.batch_id=$1
        AND NOT EXISTS(SELECT 1 FROM receipt_commit_anchor_events e WHERE e.anchor_id=a.id AND e.kind='orphaned')`,[batch.id])).rows[0];
      if (existing) {
        if (canonicalize(existing.data)!==canonicalize(data)) throw new Error('Receipt batch already anchored differently');
        return;
      }
      // Inclusion may disappear and later return in the very same block. Preserve
      // both observations instead of reusing an ID permanently marked orphaned.
      const id = randomUUID();
      await tx.sql.query('INSERT INTO receipt_commit_anchors(id,batch_id,tx_hash,data) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING', [id,batch.id,data.txHash,JSON.stringify(data)]);
      await tx.sql.query("SELECT pg_notify('eko_receipt_committed',$1)", [JSON.stringify({batchId:data.batchId,txHash:data.txHash})]);
    });
  }
  async unfinalized() {
    return (await this.db.sql.query<{id:string;data:ReceiptCommitAnchor}>(`SELECT a.id,a.data FROM receipt_commit_anchors a
      WHERE NOT EXISTS(SELECT 1 FROM receipt_commit_anchor_events e WHERE e.anchor_id=a.id)`)).rows;
  }
  async anchorEvent(id: string, kind: 'orphaned' | 'finalized') {
    await this.fenced(tx => tx.sql.query('INSERT INTO receipt_commit_anchor_events(anchor_id,kind) VALUES($1,$2) ON CONFLICT DO NOTHING', [id,kind]));
  }
}
