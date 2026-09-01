import type { ChainDb, SqlClient } from '@eko/db';
import type { Provider } from './routes.js';
export type UsageRow = { provider: Provider; method: string; calls: number; units: number };
export type UsageBatch = UsageRow & { day: string; unleasedUnits: number };
export interface UsageStore {
  lease?(day: string, provider: Provider, units: number, minimum: number, limit: number): Promise<{ allowed: boolean; total: number; units: number }>;
  record?(rows: UsageBatch[]): Promise<void>;
  release?(day: string, provider: Provider, units: number): Promise<void>;
  reserve(day: string, provider: Provider, method: string, units: number, limit: number): Promise<{ allowed: boolean; total: number }>;
  today(day: string): Promise<UsageRow[]>;
  close?(): Promise<void>;
}
export const rpcUsageSchema = `CREATE TABLE IF NOT EXISTS rpc_usage (
  day date NOT NULL, provider text NOT NULL CHECK (provider IN ('paid','public')), method text NOT NULL,
  calls bigint NOT NULL DEFAULT 0, units double precision NOT NULL DEFAULT 0,
  PRIMARY KEY(day,provider,method)
)`;
/** The __total__ row serializes admissions across processes; detail and total commit together. */
export interface RpcUsageDb { sql: SqlClient; tx<T>(fn: (tx: { sql: SqlClient }) => Promise<T>): Promise<T> }
export function createSqlUsageStore(db: RpcUsageDb): UsageStore {
  let ready: Promise<unknown> | undefined;
  const init = () => ready ??= db.sql.query(rpcUsageSchema);
  return {
    async lease(day, provider, units, minimum, limit) {
      await init();
      const acquire = async (amount: number) => {
        const result = await db.sql.query<{ units: number }>(`INSERT INTO rpc_usage(day,provider,method,calls,units)
          SELECT $1,$2,'__total__',1,$3 WHERE $3::double precision <= $4::double precision
          ON CONFLICT(day,provider,method) DO UPDATE SET calls=rpc_usage.calls+1,units=rpc_usage.units+excluded.units
          WHERE rpc_usage.units+excluded.units <= $4::double precision RETURNING units`, [day,provider,amount,Number.isFinite(limit)?limit:Number.MAX_VALUE]);
        return result.rows[0] ? { allowed:true,total:Number(result.rows[0].units),units:amount } : null;
      };
      const first = await acquire(units); if (first) return first;
      const current = await db.sql.query<{ units: number }>("SELECT units FROM rpc_usage WHERE day=$1 AND provider=$2 AND method='__total__'",[day,provider]);
      const total = Number(current.rows[0]?.units ?? 0), remaining = Math.min(units,limit-total);
      if (remaining >= minimum) { const last = await acquire(remaining); if (last) return last; }
      return { allowed:false,total,units:0 };
    },
    async record(rows) {
      if (!rows.length) return;
      await init();
      const totals = new Map<string, UsageBatch>();
      for (const row of rows) if (row.unleasedUnits) {
        const key = `${row.day}:${row.provider}`, total = totals.get(key) ?? { ...row,method:'__total__',calls:0,units:0,unleasedUnits:0 };
        total.calls += row.calls; total.units += row.unleasedUnits; totals.set(key,total);
      }
      const params: unknown[] = [];
      const values = [...rows,...totals.values()].map(row => {
        const offset = params.length; params.push(row.day,row.provider,row.method,row.calls,row.units);
        return `($${offset+1}::date,$${offset+2}::text,$${offset+3}::text,$${offset+4}::bigint,$${offset+5}::double precision)`;
      });
      // One autocommit statement; no ChainDb transaction, no chain-table locks.
      await db.sql.query(`INSERT INTO rpc_usage(day,provider,method,calls,units) VALUES ${values.join(',')}
        ON CONFLICT(day,provider,method) DO UPDATE SET calls=rpc_usage.calls+excluded.calls,units=rpc_usage.units+excluded.units`,params);
    },
    async release(day, provider, units) {
      if (units > 0) await db.sql.query("UPDATE rpc_usage SET units=units-$3 WHERE day=$1 AND provider=$2 AND method='__total__' AND units >= $3",[day,provider,units]);
    },
    async reserve(day, provider, method, units, limit) {
      await init();
      return db.tx(async tx => {
        const { rows } = await tx.sql.query<{ units: number }>(`INSERT INTO rpc_usage(day,provider,method,calls,units)
          SELECT $1,$2,'__total__',1,$3 WHERE $3::double precision <= $4::double precision
          ON CONFLICT(day,provider,method) DO UPDATE SET calls=rpc_usage.calls+1,units=rpc_usage.units+excluded.units
          WHERE rpc_usage.units+excluded.units <= $4::double precision RETURNING units`, [day, provider, units, Number.isFinite(limit) ? limit : Number.MAX_VALUE]);
        if (!rows.length) {
          const current = await tx.sql.query<{ units: number }>("SELECT units FROM rpc_usage WHERE day=$1 AND provider=$2 AND method='__total__'", [day, provider]);
          return { allowed: false, total: Number(current.rows[0]?.units ?? 0) };
        }
        await tx.sql.query(`INSERT INTO rpc_usage(day,provider,method,calls,units) VALUES($1,$2,$3,1,$4)
          ON CONFLICT(day,provider,method) DO UPDATE SET calls=rpc_usage.calls+1,units=rpc_usage.units+excluded.units`, [day, provider, method, units]);
        return { allowed: true, total: Number(rows[0].units) };
      });
    },
    async today(day) {
      await init();
      const { rows } = await db.sql.query<UsageRow>("SELECT provider,method,calls,units FROM rpc_usage WHERE day=$1 AND method <> '__total__' ORDER BY provider,method", [day]);
      return rows.map(r => ({ ...r, calls: Number(r.calls), units: Number(r.units) }));
    },
  };
}
/** Lazy database creation keeps construction side-effect free, including offline CLI tests. */
export function persistentUsageStore(env: { DATABASE_URL?: string; RPC_USAGE_DIR?: string }): UsageStore {
  let opened: Promise<{ db: ChainDb; store: UsageStore }> | undefined;
  const get = () => opened ??= import('@eko/db').then(async ({ openDb }) => {
    const db = await openDb({ databaseUrl: env.DATABASE_URL, pgliteDir: env.RPC_USAGE_DIR ?? '.data/rpc-usage' });
    return { db, store: createSqlUsageStore(db) };
  });
  return {
    reserve: async (...args) => (await get()).store.reserve(...args),
    lease: async (...args) => (await get()).store.lease!(...args),
    record: async rows => (await get()).store.record!(rows),
    release: async (...args) => (await get()).store.release!(...args),
    today: async day => (await get()).store.today(day),
    close: async () => { if (opened) await (await opened).db.close(); },
  };
}
