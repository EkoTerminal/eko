import type { ChainDb } from './client.js';
import { hex, type Hex } from './types.js';

/** One coin of the hourly USD volume ranking before a launch block, as clone_swarm reads it (engines `sources.ts`). */
export interface TrendingRow { coin: Hex; name: string; symbol: string; created: Date; started: Date; volume: number }
interface Stored { coin: Hex; name: string; symbol: string; created: string; started: string; volume: string }

/**
 * The 50 coins with the most priced swap volume in the hour before `block` (whose time is `sinceSec + 3600`). Rows come
 * from `trending_snapshots` when retention saved one for this block (it does before deleting swaps such a window
 * reads); otherwise they are computed from swaps. `untilSec` (the block's time) only bounds the scan: swaps at or
 * before a block are never later than it, so the rows are the same.
 */
export async function trendingAt(db: ChainDb, block: number, sinceSec: number, untilSec?: number): Promise<TrendingRow[]> {
  const saved = (await db.sql.query<{ data: Stored[] }>('SELECT data FROM trending_snapshots WHERE created_block=$1', [block])).rows[0];
  if (saved) return saved.data.map(r => ({ coin: r.coin, name: r.name, symbol: r.symbol, created: new Date(r.created), started: new Date(r.started), volume: Number(r.volume) }));
  return computeTrending(db, block, sinceSec, untilSec);
}
async function computeTrending(db: ChainDb, block: number, sinceSec: number, untilSec?: number): Promise<TrendingRow[]> {
  const bounded = untilSec === undefined ? '' : ' AND s.ts<=to_timestamp($3)';
  return (await db.sql.query<{ coin: Uint8Array; name: string; symbol: string; created: Date; started: Date; volume: number }>(`SELECT s.coin,t.name,t.symbol,b.ts AS created,min(s.ts) AS started,sum(s.usd) AS volume
    FROM swaps s JOIN tokens t ON t.address=s.coin JOIN engine_block_times b ON b.number=t.first_block
    WHERE s.block<=$1 AND s.ts>to_timestamp($2)${bounded} AND s.usd>0 AND t.name IS NOT NULL AND t.symbol IS NOT NULL
    GROUP BY s.coin,t.name,t.symbol,b.ts ORDER BY volume DESC,s.coin LIMIT 50`, [block, sinceSec, ...(untilSec === undefined ? [] : [untilSec])])).rows
    .map(r => ({ coin: hex(r.coin), name: r.name, symbol: r.symbol, created: new Date(r.created), started: new Date(r.started), volume: r.volume }));
}

/**
 * Save the trending rows of up to `limit` launch blocks whose window starts before `horizon`'s time and which have no
 * snapshot yet, oldest first. Returns how many were saved and whether none is left. Launch blocks without a known
 * time are skipped: the engines cannot evaluate such a coin either.
 */
export async function snapshotTrending(db: ChainDb, horizon: bigint, limit: number): Promise<{ saved: number; complete: boolean }> {
  // Launch times as the engines resolve them (engine clock first, then the indexed header).
  const due = (await db.sql.query<{ block: string; ts: Date }>(`SELECT DISTINCT t.first_block AS block,coalesce(e.ts,c.ts) AS ts
    FROM tokens t LEFT JOIN engine_block_times e ON e.number=t.first_block LEFT JOIN chain_blocks c ON c.number=t.first_block
    WHERE coalesce(e.ts,c.ts)<(SELECT ts FROM chain_blocks WHERE number=$1)+interval '1 hour'
      AND NOT EXISTS(SELECT 1 FROM trending_snapshots s WHERE s.created_block=t.first_block)
    ORDER BY t.first_block LIMIT $2`, [horizon.toString(), limit + 1])).rows;
  for (const row of due.slice(0, limit)) {
    const sec = new Date(row.ts).getTime() / 1000;
    const rows = await computeTrending(db, Number(row.block), sec - 3600, sec + 1);
    const data: Stored[] = rows.map(r => ({ coin: r.coin, name: r.name, symbol: r.symbol, created: r.created.toISOString(), started: r.started.toISOString(), volume: String(r.volume) }));
    await db.sql.query('INSERT INTO trending_snapshots VALUES($1,$2) ON CONFLICT(created_block) DO NOTHING', [row.block, JSON.stringify(data)]);
  }
  return { saved: Math.min(limit, due.length), complete: due.length <= limit };
}
