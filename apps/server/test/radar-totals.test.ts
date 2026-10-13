import { describe, expect, it } from 'vitest';
import { RadarService } from '../src/read/radar.js';
import type { ReadStore } from '../src/read/store.js';

// 2026-10-13: the request that found the header totals expired computed them inline (3.4 to 7.5 s; 0.9 s for the next).
describe('radar header totals', () => {
  const fixture = () => {
    const state = { clock: Date.parse('2026-10-13T10:00:00Z'), coins: 1, computes: 0, fail: false, gate: Promise.resolve() };
    const query = async (text: string) => {
      if (text.includes('GROUP BY tier')) state.computes++;
      const coins = state.coins;
      await state.gate;
      if (state.fail) throw new Error('database unavailable');
      return { rows: [{ tier: 0, n: String(coins), h: 0 }] };
    };
    const store = { background: true, now: () => state.clock, sellCheckQuotes: false, db: { sql: { query } } } as unknown as ReadStore;
    return { state, radar: new RadarService(store) };
  };
  it('serves the last counts at once while a recompute runs, and only one recompute at a time', async () => {
    const { state, radar } = fixture();
    expect((await radar.totals()).coins).toBe(1);
    // Thirty-one seconds later the counts changed and the database is slow.
    state.clock += 31_000; state.coins = 2;
    let release!: () => void;
    state.gate = new Promise<void>(resolve => { release = resolve; });
    const stale = await Promise.race([radar.totals(), new Promise<'waited'>(resolve => setTimeout(() => resolve('waited'), 200))]);
    expect(stale).toMatchObject({ coins: 1 });
    expect((await radar.totals()).coins).toBe(1);
    expect(state.computes).toBe(2);
    release(); await new Promise(resolve => setTimeout(resolve, 20));
    expect((await radar.totals()).coins).toBe(2);
    expect(state.computes).toBe(2);
  });
  it('keeps the counts it had when a recompute fails, and tries again on the next request', async () => {
    const { state, radar } = fixture();
    expect((await radar.totals()).coins).toBe(1);
    state.clock += 31_000; state.fail = true;
    expect((await radar.totals()).coins).toBe(1);
    await new Promise(resolve => setTimeout(resolve, 20));
    state.fail = false; state.coins = 3;
    expect((await radar.totals()).coins).toBe(1);
    await new Promise(resolve => setTimeout(resolve, 20));
    expect((await radar.totals()).coins).toBe(3);
  });
  it('makes the first request after start wait, and computes inline without the background refresher', async () => {
    const { state, radar } = fixture();
    state.fail = true;
    await expect(radar.totals()).rejects.toThrow('database unavailable');
    state.fail = false;
    expect((await radar.totals()).coins).toBe(1);
    const inline = fixture();
    (inline.radar.store as unknown as { background: boolean }).background = false;
    await inline.radar.totals(); inline.state.coins = 5;
    expect((await inline.radar.totals()).coins).toBe(5);
  });
});
