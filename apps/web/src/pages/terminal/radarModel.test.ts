import { describe, expect, it } from 'vitest';
import { createRadarRows } from '../../mocks/demo/radar';
import { applyRadarEvents, filterRows, SORTS, sortRows } from './radarModel';
import type { ChannelEvent } from '../../lib/realtime';
const event = (kind: string, data: unknown) => ({t:'ev',ch:'radar',seq:1,ts:1,kind,data}) as ChannelEvent<'radar'>;
describe('Radar server order and user sorting', () => {
  it('keeps server Rank order even when numeric rank disagrees', () => { const rows = createRadarRows().reverse(); expect(sortRows(rows,'Rank')).toEqual(rows); expect(sortRows(rows,'Rank')).not.toBe(rows); });
  it('sorts all controls without mutating the snapshot', () => {
    const rows = createRadarRows(), original = structuredClone(rows);
    for (const sort of SORTS) expect(sortRows(rows,sort)).toHaveLength(30);
    for (const [sort,field,direction] of [['1h move','change1hPct',-1],['Newest','ageSec',1],['Exit cost','exitCost1kPct',1]] as const) {
      const sorted = sortRows(rows,sort); for (let i=1;i<sorted.length;i++) expect((sorted[i][field]-sorted[i-1][field])*direction).toBeGreaterThanOrEqual(0);
    }
    expect(SORTS).not.toContain('Signal');
    expect(sortRows(rows,'Agent flow')[0].flow.agentPct).toBe(Math.max(...rows.map(c=>c.flow.agentPct)));
    expect(rows).toEqual(original);
  });
  it('preserves ranking and Hottest ordering with missing or changed Signal', () => {
    const rows = createRadarRows().slice(0,2); rows[0].signal = undefined; expect(sortRows(rows,'Rank')).toEqual(rows);
    const before=sortRows(rows,'Hottest').map(c=>c.address); rows[1].signal!.composite=0; expect(sortRows(rows,'Hottest').map(c=>c.address)).toEqual(before);
  });
  it('filters stage/verdict/heat and combines filters', () => { const rows=createRadarRows(); expect(filterRows(rows,'Danger','Curve').every(c=>c.verdict==='danger'&&c.stage==='curve')).toBe(true); expect(filterRows(rows,'Hot','All').some(c=>c.verdict==='danger')).toBe(false); expect(filterRows(rows,'All','Migrated').every(c=>c.stage==='graduated')).toBe(true); });
  it('upserts in place, removes, and applies authoritative rerank', () => {
    const rows=createRadarRows().slice(0,3), changed={...rows[1],change1hPct:99};
    const next=applyRadarEvents(rows,[event('row_upsert',changed),event('row_remove',{address:rows[0].address}),event('rerank',{order:[rows[2].address,rows[1].address]})]);
    expect(next).toEqual([rows[2],changed]); expect(next[0]).toBe(rows[2]); expect(rows[1].change1hPct).not.toBe(99);
    expect(applyRadarEvents(rows,[event('row_upsert',createRadarRows()[3])])).toHaveLength(4);
  });
});
