import type { RadarRow } from '@eko/shared';
export type HeatRow = Omit<RadarRow, 'rank' | 'exitCost1kPct'> & { exitCost1kPct?: number };
export type Heat = 'hot' | 'fading' | 'normal' | 'avoid' | 'scanning';
export type Mark = { kind: 'shimmer' | 'ember'; level: 1 | 2 | 3 } | null;
export function heatOf(c: HeatRow, { pending = false } = {}): Heat {
  if (pending || c.verdictPending || c.verdict === 'pending') return 'scanning';
  if (c.verdict === 'danger') return 'avoid';
  // TODO(spec): without CA-31 signal, apply the price/flow predicates alone; never invent a reading.
  if (!c.unavailable?.includes('flow') && !c.unavailable?.includes('change') && (c.signal === undefined || c.signal.composite >= 70) && c.change1hPct >= 0 && c.flow.agentPct >= 30) return 'hot';
  if (!c.unavailable?.includes('change') && c.change1hPct <= -2 && (c.signal === undefined || c.signal.composite < 62)) return 'fading';
  return 'normal';
}
export function marking(c: HeatRow, { pending = false, redFlag = false } = {}): Mark {
  if (pending || c.verdictPending || c.verdict === 'pending') return null;
  if (c.verdict === 'danger') {
    // TODO(spec): RadarRow has no match confidence; the inspector supplies CoinCard's redFlag predicate.
    return { kind: 'ember', level: redFlag || (c.exitCost1kPct ?? 0) >= 75 || c.topPlaybook === 'honeypot' ? 3 : 2 };
  }
  if (!c.unavailable?.includes('change') && c.change1hPct <= -8 && (c.signal === undefined || c.signal.composite < 65)) return { kind: 'ember', level: 1 };
  if (heatOf(c) === 'hot') return { kind: 'shimmer', level: c.change1hPct >= 10 && c.flow.agentPct >= 40 ? 3 : 2 };
  if (!c.unavailable?.includes('change') && !c.unavailable?.includes('flow') && c.change1hPct >= 3 && c.flow.agentPct >= 25 && (c.signal === undefined || c.signal.composite >= 60)) return { kind: 'shimmer', level: 1 };
  return null;
}
export const markClass = (m: Mark) => m ? `mk-${m.kind}-${m.level}` : '';
