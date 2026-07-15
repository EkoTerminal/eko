import { createHash } from 'node:crypto';
import { canonicalize } from '@eko/shared';
import type { SqlClient } from '@eko/db';

export const digest = (value: unknown) => createHash('sha256').update(canonicalize(value)).digest('hex');
const identifier = (name: string) => '"' + name.replaceAll('"', '""') + '"';
export function validateRestoreName(name: string) {
  if (!/^eko_restore_[a-z0-9_]{1,40}$/.test(name)) throw new Error('Restore requires a dedicated fresh database name');
}
export async function assertFreshRestoreTarget(source: SqlClient, admin: SqlClient, name: string, sourceClusterHash: string) {
  validateRestoreName(name);
  const identity = async (sql: SqlClient) => String((await sql.query<{ id: string }>('SELECT system_identifier::text AS id FROM pg_control_system()')).rows[0]!.id);
  const sourceId = await identity(source), targetId = await identity(admin);
  if (sourceId === targetId || digest(sourceId) !== sourceClusterHash) throw new Error('Source and restore clusters must be distinct and source must match backup');
  if ((await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [name])).rows.length) throw new Error('Restore database already exists');
}
export interface RestoreInventory {
  counts: Record<string, string>;
  ledgers: Record<string, { count: number; sha256: string }>;
  state: Record<string, { count: number; sha256: string }>;
  samples: Record<string, { count: number; sha256: string }>;
  leasedRanges: string;
}
/** Only counts and digests leave this boundary, never journal payloads, keys,
 * account identities or arbitrary database rows. Run in the dump's snapshot. */
export async function captureInventory(sql: SqlClient): Promise<RestoreInventory> {
  const result: RestoreInventory = { counts: {}, ledgers: {}, state: {}, samples: {}, leasedRanges: '0' };
  const tables = (await sql.query<{ name: string }>(`SELECT tablename AS name FROM pg_tables
    WHERE schemaname='public' ORDER BY tablename`)).rows.map(row => row.name);
  for (const table of tables) {
    // Heritage web notes are plaintext. They are intentionally excluded from dumps.
    if (table === 'journal_entries') continue;
    result.counts[table] = String((await sql.query<{ n: string }>(`SELECT count(*)::text AS n FROM public.${identifier(table)}`)).rows[0]!.n);
  }
  const queries: Record<string, string> = {
    'drizzle.__drizzle_migrations': 'SELECT hash,created_at::text FROM drizzle.__drizzle_migrations ORDER BY created_at,hash',
    eko_indexer_migrations: 'SELECT id FROM eko_indexer_migrations ORDER BY id',
    eko_engine_migrations: 'SELECT id FROM eko_engine_migrations ORDER BY id',
    ingest_cursors: 'SELECT stream,block::text,encode(hash,\'hex\') AS hash FROM ingest_cursors ORDER BY stream',
    engine_cursors: 'SELECT stream,block::text,encode(hash,\'hex\') AS hash FROM engine_cursors ORDER BY stream',
    ingest_ranges: `SELECT stream,from_block::text,to_block::text,status,lease_owner,lease_until::text,attempts,last_error,error_repeats
      FROM ingest_ranges ORDER BY stream,from_block`,
    coin_cards: 'SELECT id,hash,data FROM coin_cards ORDER BY id LIMIT 20',
    guard_verdict_revisions: 'SELECT id,payload_hash,semantic_hash,data FROM guard_verdict_revisions ORDER BY id LIMIT 20',
    receipt_items: 'SELECT id,payload_hash,leaf,canonical_payload FROM receipt_items ORDER BY id LIMIT 20',
    receipt_batches: 'SELECT id,root,leaf_count FROM receipt_batches ORDER BY id LIMIT 20',
  };
  for (const [table, query] of Object.entries(queries)) {
    if (!(await sql.query<{ name: string | null }>('SELECT to_regclass($1)::text AS name', [table])).rows[0]?.name)
      throw new Error('Required restore table is missing');
    const rows = (await sql.query(query)).rows;
    const group = table.includes('migrations') ? result.ledgers : table.includes('cursor') || table === 'ingest_ranges' ? result.state : result.samples;
    group[table] = { count: rows.length, sha256: digest(rows) };
  }
  result.leasedRanges = String((await sql.query<{ n: string }>("SELECT count(*)::text AS n FROM ingest_ranges WHERE status='leased'")).rows[0]!.n);
  // Detect plaintext harness schemas rather than accidentally exporting old payloads.
  const columns = (await sql.query<{ column_name: string }>("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='harness_journal'")).rows.map(row => row.column_name);
  if (!['ciphertext', 'salt_ct', 'iv', 'commitment'].every(column => columns.includes(column)) || columns.includes('payload'))
    throw new Error('Encrypted journal schema is required');
  return result;
}
export function compareInventories(before: RestoreInventory, after: RestoreInventory) {
  return (['counts', 'ledgers', 'state', 'samples', 'leasedRanges'] as const).map(name => ({
    assertion: name, status: digest(before[name]) === digest(after[name]) ? 'pass' as const : 'fail' as const,
  }));
}

/** Target-only: verify fidelity before reclaiming leases. A restored lease is
 * stale even if its old expiration is still in the future. No workers run here. */
export async function reclaimRestoreLeases(sql: SqlClient) {
  await sql.query(`UPDATE ingest_ranges SET status='todo',lease_owner=NULL,lease_until=NULL WHERE status='leased'`);
  return (await sql.query<{ n: string }>("SELECT count(*)::text AS n FROM ingest_ranges WHERE status='leased' OR lease_owner IS NOT NULL OR lease_until IS NOT NULL")).rows[0]!.n === '0';
}
