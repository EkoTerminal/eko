import { repairRatingPricesAfterReorg } from './rating-checks.js';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { lockPglite } from './lock.js';
import { InProcessBus } from './bus.js';
import { binary, hex, type Hex } from './types.js';
import { rebuildBalances, rebuildBars } from './market.js';
import { GuardBusEventSchema } from '@eko/shared';
export interface SqlClient { query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }> }
export const chainTables = ['chain_blocks', 'tokens', 'pools', 'swaps', 'liquidity_events', 'token_transfers', 'pons_events', 'pons_exemptions', 'wallets', 'pending_pool_events', 'userops', 'delegations_7702', 'wallet_protocol_coverage', 'agent_registry_events', 'agent_registry', 'agent_registry_checkpoints', 'eth_usd_reference_sources'] as const;
export interface BusMessage { topic: 'chain_block' | 'chain_reorg' | 'swap' | 'pair_created' | 'liquidity' | 'pons_exempt' | 'flow_updated' | 'card_updated' | 'verdict_created' | 'guard_evidence_created' | 'guard_coverage_created' | 'guard_role_created' | 'guard_verdict_created' | 'guard_revision_invalidated'; ids: Record<string, string | number> }
export class ChainDb {
  constructor(readonly sql: SqlClient, private transaction: <T>(fn: (client: SqlClient) => Promise<T>) => Promise<T>, readonly close: () => Promise<void> = async () => {}, private partitions = new Set<string>(), private pendingPartitions: Set<string> | null = null, readonly bus = new InProcessBus(), private pendingMessages: BusMessage[] | null = null, private sessionProvider?: <T>(work: (db: ChainDb) => Promise<T>) => Promise<T>) {}
  /** Pin one backend across separately committed maintenance transactions. */
  session<T>(work: (db: ChainDb) => Promise<T>): Promise<T> { return this.sessionProvider ? this.sessionProvider(work) : work(this); }
  async tx<T>(fn: (db: ChainDb) => Promise<T>): Promise<T> {
    if (this.pendingPartitions) return fn(this);
    const pending = new Set<string>();
    const messages: BusMessage[] = [];
    const result = await this.transaction(client => fn(new ChainDb(client, async nested => nested(client), async () => {}, this.partitions, pending, this.bus, messages)));
    for (const month of pending) this.partitions.add(month);
    for (const message of messages) this.bus.publish(message);
    return result;
  }
  async cursor(stream: string): Promise<bigint | null> {
    const { rows } = await this.sql.query<{ block: string }>('SELECT block FROM ingest_cursors WHERE stream=$1', [stream]);
    return rows[0] ? BigInt(rows[0].block) : null;
  }
  async blockHash(n: bigint): Promise<Hex | null> {
    const { rows } = await this.sql.query<{ hash: Uint8Array }>('SELECT hash FROM chain_blocks WHERE number=$1', [n.toString()]);
    return rows[0] ? hex(rows[0].hash) : null;
  }
  async setCursor(stream: string, n: bigint, hash: Hex | null) {
    await this.sql.query('INSERT INTO ingest_cursors(stream,block,hash) VALUES($1,$2,$3) ON CONFLICT(stream) DO UPDATE SET block=excluded.block, hash=excluded.hash', [stream, n.toString(), hash ? binary(hash) : null]);
  }
  async insert(table: typeof chainTables[number], row: Record<string, unknown>): Promise<boolean> {
    return (await this.insertMany(table, [row])).length > 0;
  }
  /** Bound SQL parameters and return only inserted rows, so notifications remain replay-idempotent. */
  async insertMany(table: typeof chainTables[number], rows: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
    if (!chainTables.includes(table)) throw new Error('Invalid chain table');
    if (!rows.length) return [];
    if (table==='swaps' || table==='token_transfers') {
      for(const day of new Set(rows.map(r=>new Date(r.ts as Date).toISOString().slice(0,10)))) await this.ensurePartitions(new Date(`${day}T00:00:00Z`));
    }
    const keys = [...new Set(rows.flatMap(Object.keys))];
    if (keys.some(k => !/^[a-z_][a-z0-9_]*$/.test(k))) throw new Error('Invalid column');
    const inserted: Record<string, unknown>[] = [];
    const size = Math.min(500, Math.floor(10000 / keys.length));
    for (let offset = 0; offset < rows.length; offset += size) {
      const params: unknown[] = [];
      const values = rows.slice(offset, offset + size).map(row => `(${keys.map(k => {
        if (!(k in row)) return 'DEFAULT';
        params.push(row[k]); return `$${params.length}`;
      }).join(',')})`);
      const result = await this.sql.query(`INSERT INTO ${table} (${keys.join(',')}) VALUES ${values.join(',')} ON CONFLICT DO NOTHING RETURNING *`, params);
      inserted.push(...result.rows);
    }
    return inserted;
  }
  async notify(topic: BusMessage['topic'], ids: BusMessage['ids']) {
    await this.notifyMany([{ topic, ids }]);
  }
  async notifyMany(messages: BusMessage[]) {
    for (const message of messages) if (message.topic.startsWith('guard_')) GuardBusEventSchema.parse({ topic: message.topic.replaceAll('_', '.'), ids: message.ids });
    for (let offset = 0; offset < messages.length; offset += 500) {
      const params: unknown[] = [];
      const values = messages.slice(offset, offset + 500).map(message => {
        params.push(`eko_${message.topic}`, JSON.stringify(message.ids));
        return `($${params.length - 1}::text,$${params.length}::text)`;
      });
      await this.sql.query(`SELECT pg_notify(topic,payload) FROM (VALUES ${values.join(',')}) AS messages(topic,payload)`, params);
      for (const message of messages.slice(offset,offset+500)) {
        if (this.pendingMessages) this.pendingMessages.push(message); else this.bus.publish(message);
      }
    }
  }
  async deleteAbove(n: bigint) {
    await this.sql.query('SELECT pg_advisory_xact_lock(4663,208)');
    await this.sql.query('LOCK TABLE tokens,pools,swaps,token_transfers IN SHARE ROW EXCLUSIVE MODE');
    const compacted=(await this.sql.query('SELECT 1 FROM raw_history_watermarks WHERE through_block>$1 LIMIT 1',[n.toString()])).rows.length;
    const frozen=(await this.sql.query('SELECT 1 FROM raw_history_bar_keys k JOIN bars_1m b USING(coin,minute) WHERE b.last_block>$1 LIMIT 1',[n.toString()])).rows.length;
    const sealed=(await this.sql.query('SELECT 1 FROM raw_history_seals WHERE through_block>$1 LIMIT 1',[n.toString()])).rows.length;
    if(compacted || frozen || sealed)throw new Error('Reorg crosses compacted raw history: restore an archive before replay');
    for (const table of chainTables) await this.sql.query(`DELETE FROM ${table} WHERE block > $1`, [n.toString()]);
    await this.sql.query('UPDATE tokens SET graduated_pool=NULL,graduated_block=NULL WHERE graduated_block > $1', [n.toString()]);
    await rebuildBalances(this);
    await this.sql.query('DELETE FROM bars_1m WHERE last_block > $1', [n.toString()]);
    await rebuildBars(this, 0n, n);
    await repairRatingPricesAfterReorg(this,n);
    const ancestorHash = await this.blockHash(n);
    await this.sql.query('UPDATE ingest_cursors SET block=$1,hash=$2 WHERE block > $1', [n.toString(), ancestorHash ? binary(ancestorHash) : null]);
    await this.sql.query("UPDATE ingest_ranges SET status='todo',lease_owner=NULL,lease_until=NULL,attempts=0,last_error=NULL,error_repeats=0 WHERE to_block > $1", [n.toString()]);
  }
  /** UTC days for raw history; bars retain their existing monthly layout. Legacy months cover days until replaced. */
  async ensurePartitions(date: Date, options: { daysAhead?: number } = {}) {
    const daysAhead = options.daysAhead ?? Number(process.env.DAYS_AHEAD ?? 3);
    if (!Number.isInteger(daysAhead) || daysAhead < 0 || daysAhead > 366 || !Number.isFinite(date.getTime())) throw new Error('Invalid partition date or DAYS_AHEAD');
    const swapDays=Number(process.env.RETENTION_SWAP_DAYS ?? 7),transferDays=Number(process.env.RETENTION_TRANSFER_DAYS ?? 3);
    if(!Number.isInteger(swapDays) || swapDays<7 || swapDays>365 || !Number.isInteger(transferDays) || transferDays<1 || transferDays>365)throw new Error('Invalid raw partition window');
    const day = date.toISOString().slice(0,10), cacheKey = `${day}:${daysAhead}:${swapDays}:${transferDays}`;
    if (this.partitions.has(cacheKey) || this.pendingPartitions?.has(cacheKey)) return;
    await this.tx(async tx => {
      await tx.sql.query('LOCK TABLE swaps,token_transfers,bars_1m IN SHARE UPDATE EXCLUSIVE MODE');
      const bounds = (await tx.sql.query<{parent:string;bound:string}>(`SELECT p.relname AS parent,pg_get_expr(c.relpartbound,c.oid) AS bound
        FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid JOIN pg_class p ON p.oid=i.inhparent
        WHERE i.inhparent IN ('swaps'::regclass,'token_transfers'::regclass)`)).rows;
      for (let offset=-Math.max(swapDays,transferDays);offset<=daysAhead;offset++) {
        const start = new Date(Date.parse(`${day}T00:00:00Z`)+offset*86400000), end = new Date(start.getTime()+86400000);
        const suffix = `d${start.toISOString().slice(0,10).replaceAll('-','_')}`;
        for (const table of ['swaps','token_transfers']) {
          if(offset<-(table==='swaps'?swapDays:transferDays))continue;
          const covered = bounds.some(b => {
            if(b.parent!==table)return false;
            const range = [...b.bound.matchAll(/'([^']+)'/g)].map(m=>Date.parse(m[1]!));
            return range.length===2 && range[0]!<=start.getTime() && range[1]!>=end.getTime();
          });
          if (!covered) await tx.sql.query(`CREATE TABLE IF NOT EXISTS ${table}_${suffix} PARTITION OF ${table} FOR VALUES FROM ('${start.toISOString()}') TO ('${end.toISOString()}')`);
        }
      }
      for (let offset=0;offset<=2;offset++) {
        const start=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+offset,1));
        const end=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,1));
        const suffix=`${start.getUTCFullYear()}_${String(start.getUTCMonth()+1).padStart(2,'0')}`;
        await tx.sql.query(`CREATE TABLE IF NOT EXISTS bars_1m_${suffix} PARTITION OF bars_1m FOR VALUES FROM ('${start.toISOString()}') TO ('${end.toISOString()}')`);
      }
      tx.pendingPartitions!.add(cacheKey);
    });
  }
}
export async function openDb(options: { databaseUrl?: string; pgliteDir?: string; poolOptions?: pg.PoolConfig } = {}): Promise<ChainDb> {
  if (process.env.NODE_ENV === 'production' && !options.databaseUrl?.trim()) throw new Error('DATABASE_URL is required in production; PGlite is for local development and tests');
  if (options.databaseUrl) {
    const pool = new pg.Pool({ ...options.poolOptions, connectionString: options.databaseUrl });
    const transact = async <T>(fn: (client: SqlClient) => Promise<T>): Promise<T> => {
      const client = await pool.connect();
      try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
      catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    };
    return new ChainDb(pool, transact, () => pool.end(), undefined, null, undefined, null, async work => {
      const client=await pool.connect();
      const pinned=new ChainDb(client,async fn=>{
        try {await client.query('BEGIN');const result=await fn(client);await client.query('COMMIT');return result;}
        catch(error){await client.query('ROLLBACK');throw error;}
      });
      try {return await work(pinned);} finally {client.release();}
    });
  }
  const directory = options.pgliteDir ?? '.data/indexer';
  const release = await lockPglite(directory);
  try {
    const client = new PGlite(directory === ':memory:' ? undefined : directory);
    await client.waitReady;
    return new ChainDb(client, fn => client.transaction(fn), async () => { try { await client.close(); } finally { await release(); } });
  } catch (error) { await release(); throw error; }
}
export async function migrate(db: ChainDb) {
  const migrations = await Promise.all(['0101_chain', '0102_market', '0103_range_errors', '0110_rpc_usage', '0111_pending_senders', '0112_pending_pricing', '0115_guard_sources', '0117_pons_progress', '0136_wallet_protocol', '0150_agent_registry', '0180_eth_usd_reference_sources', '0181_transfer_baselines', '0184_sparse_parent_links', '0187_drop_holder_transfer_indexes', '0188_block_and_pool_lookups', '0190_chain_block_time_index', '0195_reference_swaps_unnamed', '0199_swaps_index_diet', '0205_chain_read_indexes', '0206_watcher_read_indexes', '0207_raw_history_indexes', '0208_raw_history_progress', '0209_bar_write_locks', '0210_daily_raw_history'].map(async id => ({ id, sql: await readFile(new URL(`${import.meta.url.includes('/dist/') ? './chain-drizzle/' : '../drizzle/'}${id}.sql`, import.meta.url), 'utf8') })));
  await db.sql.query('CREATE TABLE IF NOT EXISTS eko_indexer_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  await db.tx(async tx => {
    await tx.sql.query('LOCK TABLE eko_indexer_migrations IN EXCLUSIVE MODE');
    for (const migration of migrations) {
      const { rows } = await tx.sql.query('SELECT id FROM eko_indexer_migrations WHERE id=$1', [migration.id]);
      if (!rows.length) {
        for (const statement of (['0205_chain_read_indexes','0207_raw_history_indexes', '0208_raw_history_progress', '0210_daily_raw_history'].includes(migration.id) ? migration.sql.split('-- statement-breakpoint').flatMap(s=>(s.includes('CREATE FUNCTION') || s.includes('CREATE OR REPLACE FUNCTION') || s.includes('DO $$')) ? [s] : s.split(';')) : migration.id === '0115_guard_sources' ? migration.sql.split('-- statement-breakpoint') : migration.sql.split(';')).map(s => s.trim()).filter(Boolean)) await tx.sql.query(statement);
        await tx.sql.query('INSERT INTO eko_indexer_migrations(id) VALUES($1)', [migration.id]);
      }
    }
    await tx.ensurePartitions(new Date());
  });
}
// TODO(spec): Move the heritage server schema into packages/db in the later §2.1 migration task.
