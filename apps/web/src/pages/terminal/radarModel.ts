import { z } from 'zod';
import { RadarRowSchema, type RadarRow } from '@eko/shared';
import type { ChannelEvent } from '../../lib/realtime';
import { heatOf } from '../../lib/heat';
import { SCAN_DELAYED_AFTER_SEC } from '../../copy/availability';
export { RadarResponseSchema } from '@eko/shared';
export const SORTS = ['Rank', 'Hottest', '1h move', 'Agent flow', 'Newest', 'Exit cost'] as const;
export type Sort = typeof SORTS[number];
export const ascending = (sort: Sort) => ['Rank', 'Newest', 'Exit cost'].includes(sort);
// CA-31 signal is descriptive. Hot ranking uses price and flow; Rank keeps the exact server order.
export const heatScore = (c: RadarRow) => Math.max(0, c.change1hPct) * (c.flow.agentPct + 20);
/**
 * Live rows do not measure agent buying yet, so no row can be Hot. Until they do, the strip shows the strongest
 * measured movers instead: a Clear or Monitor guard, a rise over the last hour and an 8h price line, ranked by
 * the size of the move weighted by the beta signal. A ranking of real readings, not a recommendation.
 */
export const topMovers = (rows: readonly RadarRow[], n = 3): RadarRow[] => rows
  .filter((c) => !c.verdictPending && (c.verdict === 'clear' || c.verdict === 'monitor') && !c.unavailable?.includes('change')
    && c.change1hPct > 0 && !c.unavailable?.includes('spark') && (c.spark8h?.length ?? 0) >= 2)
  .map((c) => ({ c, score: Math.log1p(c.change1hPct / 100) * (c.signal?.composite ?? 50) }))
  .sort((a, b) => b.score - a.score || a.c.address.localeCompare(b.c.address)).slice(0, n).map(({ c }) => c);
/** Percent change across the 8h price line, or undefined when the line is too short or starts at zero. */
export const change8hPct = (c: Pick<RadarRow, 'spark8h'>) => { const s = c.spark8h; return s && s.length >= 2 && s[0]! > 0 ? (s.at(-1)! / s[0]! - 1) * 100 : undefined; };
/** When each row version arrived, in client milliseconds. `ageSec` is only meaningful relative to it. */
export type ReceivedAt = ReadonlyMap<string, number>;
/**
 * Launch time on the client clock. A row's `ageSec` is its age when the server sent it, so rows received at
 * different times cannot be compared by `ageSec`: a quiet row keeps the small age it had on arrival and would
 * outrank every later launch. Without receipt times all rows share one clock and this reduces to `ageSec`.
 */
export const launchedAt = (row: { address: string; ageSec: number }, received?: ReceivedAt) => (received?.get(row.address) ?? 0) - row.ageSec * 1000;
/** Map a WS envelope's server timestamp onto the client clock, never into the future. */
export const receivedAt = (serverTs: number, clientNow: number, serverOffsetMs: number) => Math.min(clientNow, serverTs - serverOffsetMs);
/** A row's age now, from the age it carried when it arrived. */
export const currentAgeSec = (row: { address: string; ageSec: number }, received: ReceivedAt | undefined, now: number) => row.ageSec + Math.max(0, now - (received?.get(row.address) ?? now)) / 1000;
/** "Scanning…" only while a first scan is plausibly running; after that the row says the scan is delayed. */
export const scanDelayed = (row: { verdictPending?: boolean }, ageNowSec: number) => !!row.verdictPending && ageNowSec >= SCAN_DELAYED_AFTER_SEC;
export const sortAvailable = (rows: readonly RadarRow[], sort: Sort) => rows.some(c => sortField(sort) === undefined || !c.unavailable?.includes(sortField(sort)!));
const sortField = (sort: Sort): NonNullable<RadarRow['unavailable']>[number] | undefined => ({ '1h move':'change', 'Agent flow':'flow', 'Exit cost':'exitCost' } as const)[sort as '1h move'|'Agent flow'|'Exit cost'];
export function sortRows(rows: readonly RadarRow[], sort: Sort, received?: ReceivedAt): RadarRow[] {
  const list = [...rows];
  if (sort === 'Rank') return list;
  const value = (c: RadarRow) => (sortField(sort) && c.unavailable?.includes(sortField(sort)!)) || (sort === 'Hottest' && (c.unavailable?.includes('flow') || c.unavailable?.includes('change'))) ? undefined : sort === 'Hottest' ? heatScore(c) : sort === '1h move' ? c.change1hPct : sort === 'Agent flow' ? c.flow.agentPct : sort === 'Newest' ? -launchedAt(c, received) : c.exitCost1kPct;
  return list.sort((a, b) => { const av = value(a), bv = value(b); return av === undefined ? bv === undefined ? 0 : 1 : bv === undefined ? -1 : ascending(sort) ? av - bv : bv - av; });
}
export const filterRows = (rows: readonly RadarRow[], show: string, stage: string) => rows.filter((c) =>
  (show === 'All' || (show === 'Hot' ? heatOf(c) === 'hot' : c.verdict === show.toLowerCase())) &&
  (stage === 'All' || c.stage === (stage === 'Curve' ? 'curve' : 'graduated')));
export function applyRadarEvents(rows: readonly RadarRow[], events: readonly ChannelEvent<'radar'>[]): RadarRow[] {
  let next = [...rows];
  for (const event of events) {
    if (event.kind === 'row_upsert') { const index = next.findIndex((c) => c.address === event.data.address); if (index < 0) next.push(event.data); else next[index] = { ...event.data, ...(event.data.guardV2 === undefined && next[index].guardV2 !== undefined ? {guardV2:next[index].guardV2,guardRefreshFailed:next[index].guardRefreshFailed} : {}) }; }
    else if (event.kind === 'row_remove') next = next.filter((c) => c.address !== event.data.address);
    else { const byAddress = new Map(next.map((c) => [c.address, c])); next = event.data.order.flatMap((a) => byAddress.has(a) ? [byAddress.get(a)!] : []).concat(next.filter((c) => !event.data.order.includes(c.address))); }
  }
  return next;
}
export const PLAYBOOK_NAMES: Record<string, string> = { honeypot: 'Honeypot', tax_trap: 'Tax trap', removable_liquidity: 'Removable liquidity', fee_trap_pool: 'Fee-trap pool', stuck_at_bonding: 'Stuck at bonding', wash_to_trend: 'Wash to trend', clone_swarm: 'Clone', exempt_insiders: 'Exempt insiders', bundle_dump: 'Bundle dump', migration_dump: 'Migration dump', malicious_hook: 'Malicious hook', agent_bait: 'Agent bait', serial_deployer: 'Serial deployer' };
export const pct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
export const usd = (v: number) => v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1000 ? `$${Math.round(v / 1000)}K` : `$${v.toLocaleString('en-US')}`;
export const price = (v: number) => `$${v.toFixed(v < .01 ? 7 : 2)}`;
export const age = (sec: number) => sec < 3600 ? `${Math.round(sec / 60)}m` : sec < 86400 ? `${(sec / 3600).toFixed(1)}h` : `${(sec / 86400).toFixed(1)}d`;
export const exitText = (v: number) => v >= 100 ? 'Blocked' : `${v.toFixed(1)}%`;

/** A failed/missing V2 refresh cannot erase an already persisted compact verdict. */
export function retainCompactGuard<T extends import('@eko/shared').CoinSummary>(previous: T | undefined, incoming: T): T {
  if (previous?.guardV2 && incoming.guardV2 === null) return {...incoming,guardV2:previous.guardV2,guardRefreshFailed:true};
  return incoming;
}
