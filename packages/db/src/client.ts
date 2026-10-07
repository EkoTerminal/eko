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
  constructor(readonly sql: SqlClient, private transaction: <T>(fn: (client: SqlClient) => Promise<T>) => Promise<T>, readonly close: () => Promise<void> = async () => {}, private partitions = new Set<string>(), private pendingPartitions: Set<string> | null = null, readonly bus = new InProcessBus(), private pendingMessages: BusMessage[] | null = null) {}
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
    await this.sql.query('LOCK TABLE tokens,pools,swaps,token_transfers IN SHARE ROW EXCLUSIVE MODE');
    for (const table of chainTables) await this.sql.query(`DELETE FROM ${table} WHERE block > $1`, [n.toString()]);
    await this.sql.query('UPDATE tokens SET graduated_pool=NULL,graduated_block=NULL WHERE graduated_block > $1', [n.toString()]);
    await rebuildBalances(this);
    await this.sql.query('DELETE FROM bars_1m WHERE last_block > $1', [n.toString()]);
    await rebuildBars(this, 0n, n);
    const ancestorHash = await this.blockHash(n);
    await this.sql.query('UPDATE ingest_cursors SET block=$1,hash=$2 WHERE block > $1', [n.toString(), ancestorHash ? binary(ancestorHash) : null]);
    await this.sql.query("UPDATE ingest_ranges SET status='todo',lease_owner=NULL,lease_until=NULL,attempts=0,last_error=NULL,error_repeats=0 WHERE to_block > $1", [n.toString()]);
  }
  /** Include the timestamp's month and the following two months, even for historical replay. */
  async ensurePartitions(date: Date) {
    const month = `${date.getUTCFullYear()}_${date.getUTCMonth()}`;
    if (this.partitions.has(month) || this.pendingPartitions?.has(month)) return;
    await this.tx(async tx => {
    // Serialize partition DDL across Postgres backfill workers.
    await tx.sql.query('LOCK TABLE swaps,token_transfers,bars_1m IN SHARE UPDATE EXCLUSIVE MODE');
    if (this.partitions.has(month)) return;
    for (let offset = 0; offset <= 2; offset++) {
      const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
      const suffix = `${start.getUTCFullYear()}_${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
      for (const table of ['swaps', 'token_transfers', 'bars_1m']) {
        await tx.sql.query(`CREATE TABLE IF NOT EXISTS ${table}_${suffix} PARTITION OF ${table} FOR VALUES FROM ('${start.toISOString()}') TO ('${end.toISOString()}')`);
      }
    }
    tx.pendingPartitions!.add(month);
    });
  }
}
export async function openDb(options: { databaseUrl?: string; pgliteDir?: string; poolOptions?: pg.PoolConfig } = {}): Promise<ChainDb> {
  if (process.env.NODE_ENV === 'production' && !options.databaseUrl?.trim()) throw new Error('DATABASE_URL is required in production; PGlite is for local development and tests');
  if (options.databaseUrl) {
    const pool = new pg.Pool({ ...options.poolOptions, connectionString: options.databaseUrl });
    return new ChainDb(pool, async fn => {
      const client = await pool.connect();
      try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
      catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    }, () => pool.end());
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
  const migrations = await Promise.all(['0101_chain', '0102_market', '0103_range_errors', '0110_rpc_usage', '0111_pending_senders', '0112_pending_pricing', '0115_guard_sources', '0117_pons_progress', '0136_wallet_protocol', '0150_agent_registry', '0180_eth_usd_reference_sources', '0181_transfer_baselines', '0184_sparse_parent_links'].map(async id => ({ id, sql: await readFile(new URL(`${import.meta.url.includes('/dist/') ? './chain-drizzle/' : '../drizzle/'}${id}.sql`, import.meta.url), 'utf8') })));
  await db.sql.query('CREATE TABLE IF NOT EXISTS eko_indexer_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  await db.tx(async tx => {
    await tx.sql.query('LOCK TABLE eko_indexer_migrations IN EXCLUSIVE MODE');
    for (const migration of migrations) {
      const { rows } = await tx.sql.query('SELECT id FROM eko_indexer_migrations WHERE id=$1', [migration.id]);
      if (!rows.length) {
        for (const statement of (migration.id === '0115_guard_sources' ? migration.sql.split('-- statement-breakpoint') : migration.sql.split(';')).map(s => s.trim()).filter(Boolean)) await tx.sql.query(statement);
        await tx.sql.query('INSERT INTO eko_indexer_migrations(id) VALUES($1)', [migration.id]);
      }
    }
    await tx.ensurePartitions(new Date());
  });
}
// TODO(spec): Move the heritage server schema into packages/db in the later §2.1 migration task.
