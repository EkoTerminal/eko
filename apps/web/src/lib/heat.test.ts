import { describe, expect, it } from 'vitest';
import { createRadarRows } from '../mocks/demo/radar';
import { heatOf, marking, markClass } from './heat';
const coin = (change1hPct: number, score: number, agents: number) => { const c = createRadarRows()[0]; return { ...c, verdict: 'clear' as const, change1hPct, flow: { ...c.flow, agentPct: agents }, signal: { ...c.signal!, composite: score } }; };
describe('prototype heat and dither thresholds', () => {
  it.each([[3,60,25,'shimmer',1], [0,70,30,'shimmer',2], [10,70,40,'shimmer',3], [-8,64,10,'ember',1]] as const)('marks %s%%, signal %s, agents %s', (move, signal, flow, kind, level) => expect(marking(coin(move,signal,flow))).toEqual({ kind, level }));
  it('checks exact boundaries and pending precedence', () => {
    expect(marking(coin(2.9,60,25))).toBeNull(); expect(marking(coin(3,59,25))).toBeNull(); expect(marking(coin(3,60,24.9))).toBeNull();
    expect(marking(coin(-8,65,10))).toBeNull(); expect(heatOf(coin(-2,61,20))).toBe('fading'); expect(heatOf(coin(-2,62,20))).toBe('normal');
    expect(heatOf(coin(0,70,30))).toBe('hot'); expect(heatOf(coin(0,69,30))).toBe('normal');
    expect(marking(coin(10,90,80), {pending:true})).toBeNull(); expect(heatOf(coin(10,90,80), {pending:true})).toBe('scanning');
  });
  it('Danger wins over activity and carries red flags', () => {
    const c = { ...coin(30,90,80), verdict:'danger' as const, exitCost1kPct:74.9, topPlaybook:undefined };
    expect(heatOf(c)).toBe('avoid'); expect(marking(c)).toEqual({kind:'ember',level:2});
    for (const red of [{...c,exitCost1kPct:75},{...c,topPlaybook:'honeypot' as const}]) expect(marking(red)).toEqual({kind:'ember',level:3});
    expect(marking(c,{redFlag:true})).toEqual({kind:'ember',level:3});
  });
  it('applies remaining predicates without inventing optional readings', () => {
    for (const [move, agents, expected] of [[3,25,'mk-shimmer-1'],[0,30,'mk-shimmer-2'],[10,40,'mk-shimmer-3'],[-8,10,'mk-ember-1']] as const) expect(markClass(marking({...coin(move,50,agents),signal:undefined}))).toBe(expected);
    expect(markClass(null)).toBe('');
  });
});
