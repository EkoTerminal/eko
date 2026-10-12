import type { ReadStore } from './store.js';

/** The rules the grades are measured under went live at this time (RATING_CODE_AT in the engines, 2026-10-12). */
export const GRADE_RULES_SINCE = '2026-10-12T18:30:00Z';
export const GRADE_HORIZONS_SEC = [3600, 86400] as const;
export interface GradeOutcome {
  level: 'clear' | 'monitor' | 'danger'; horizonSec: typeof GRADE_HORIZONS_SEC[number];
  /** Coins whose first grade under these rules is old enough for the horizon and that traded in the hour before it. */
  ratings: number;
  /** Of those, the price at the horizon was at most half the price when graded. */
  down50: number;
  /** Of those, the price was also never 20% above the price when graded: no exit ahead. */
  down50NeverUp20: number;
}
export interface GradeOutcomes { since: string; computedAt: string; rows: GradeOutcome[] }

/**
 * What happened after EKO graded a coin, from indexed trades only: for each Pons coin's first grade under the current
 * rules, the last traded price at the grade and one hour and one day later. A coin counts only if it traded in the
 * hour before its grade, so a buyer could have bought it then. It is EKO's own measurement, not the accepted-outcome
 * record the Scoreboard's counters wait for, and is labelled so where shown.
 */
export class GradeOutcomesService {
  constructor(readonly store: ReadStore) {}
  private cached?: { at: number; value: Promise<GradeOutcomes>; last?: GradeOutcomes };
  /** Served from a ten-minute cache; a stale entry is served while its replacement is computed. */
  read(): Promise<GradeOutcomes> {
    if (!this.store.background) return this.compute();
    const now = this.store.now(), cached = this.cached;
    if (cached && now - cached.at < 600_000) return cached.last ? Promise.resolve(cached.last) : cached.value;
    const value = this.compute(), next: { at: number; value: Promise<GradeOutcomes>; last?: GradeOutcomes } = { at: now, value, last: cached?.last };
    this.cached = next;
    value.then(v => { next.last = v; }, () => { if (this.cached === next) this.cached = cached?.last ? { at: 0, value: Promise.resolve(cached.last), last: cached.last } : undefined; });
    return next.last ? Promise.resolve(next.last) : value;
  }
  private async compute(): Promise<GradeOutcomes> {
    const now = this.store.now(), rows: GradeOutcome[] = [];
    for (const horizonSec of GRADE_HORIZONS_SEC) {
      const result = await this.store.db.sql.query<{ level: GradeOutcome['level']; ratings: string; down50: string; never_up: string }>(`
        WITH cut AS (SELECT (SELECT min(number) FROM engine_block_times WHERE ts>=$1) AS first),
        graded AS (
          SELECT DISTINCT ON (v.coin) v.coin,v.data->>'level' AS level,bt.ts
          FROM verdicts v JOIN read_coins r ON r.coin=v.coin AND r.launchpad='pons' CROSS JOIN cut JOIN engine_block_times bt ON bt.number=v.valid_from_block
          WHERE v.valid_from_block>=cut.first AND bt.ts>=$1 AND bt.ts<=$2 AND v.data->>'level' IN ('clear','monitor','danger')
          ORDER BY v.coin,v.valid_from_block),
        priced AS (
          SELECT g.level,
            (SELECT s.usd/s.amount_coin::double precision FROM swaps s WHERE s.coin=g.coin AND s.ts<=g.ts AND s.ts>g.ts-interval '1 hour' AND s.usd>0 AND s.amount_coin>0 ORDER BY s.ts DESC LIMIT 1) AS p0,
            (SELECT s.usd/s.amount_coin::double precision FROM swaps s WHERE s.coin=g.coin AND s.ts<=g.ts+$3*interval '1 second' AND s.usd>0 AND s.amount_coin>0 ORDER BY s.ts DESC LIMIT 1) AS p1,
            (SELECT max(s.usd/s.amount_coin::double precision) FROM swaps s WHERE s.coin=g.coin AND s.ts>g.ts AND s.ts<=g.ts+$3*interval '1 second' AND s.usd>0 AND s.amount_coin>0) AS hi
          FROM graded g)
        SELECT level,count(*) AS ratings,count(*) FILTER (WHERE p1<=0.5*p0) AS down50,count(*) FILTER (WHERE p1<=0.5*p0 AND coalesce(hi,p0)<1.2*p0) AS never_up
        FROM priced WHERE p0 IS NOT NULL GROUP BY level`, [new Date(GRADE_RULES_SINCE), new Date(now - horizonSec * 1000), horizonSec]);
      for (const level of ['clear', 'monitor', 'danger'] as const) {
        const row = result.rows.find(r => r.level === level);
        rows.push({ level, horizonSec, ratings: Number(row?.ratings ?? 0), down50: Number(row?.down50 ?? 0), down50NeverUp20: Number(row?.never_up ?? 0) });
      }
    }
    return { since: GRADE_RULES_SINCE, computedAt: new Date(now).toISOString(), rows };
  }
}
