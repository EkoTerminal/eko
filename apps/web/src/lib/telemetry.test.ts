import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TelemetrySchema, telemetryRoute } from '@eko/shared';
import { createApi } from './api';
import { createMockTransport } from '../mocks/transport';

const privateText = `0x${'b'.repeat(40)} Bearer fixture-placeholder`;
const send = vi.fn(async () => new Response('{"ok":true}', { status: 200 }));
beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers(); send.mockClear();
  vi.stubEnv('VITE_MOCKS', '0'); vi.stubEnv('VITE_API_URL', '/v1');
  vi.stubGlobal('fetch', send);
  vi.stubGlobal('location', { pathname: `/coin/0x${'b'.repeat(40)}`, search: '?key=fixture-placeholder' });
  vi.stubGlobal('sessionStorage', { getItem: () => privateText, setItem: vi.fn() });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('client telemetry privacy and v1 transport (offline fixtures)', () => {
  it('batches known durations and events through /v1 without private error text or route resources', async () => {
    const t = await import('./telemetry');
    t.track('ui.quote_roundtrip_ms', 123.45);
    t.track('ui.secret_fixture', 1); t.track('ws.rtt_ms', -1); t.track('ws.rtt_ms', Infinity); t.track('ws.rtt_ms', 600_001);
    t.trackEvent({ name: 'page_view' });
    t.trackEvent({ name: 'first_preflight_seen', props: { secondsSinceKey: 2.25 } });
    t.trackEvent({ name: 'approval_decided', props: { decision: 'approved', secondsToDecide: 3.5 } });
    t.reportClientError(new TypeError(privateText));
    await t.flushTelemetry();
    expect(send).toHaveBeenCalledTimes(1);
    const [url, init] = send.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/v1/telemetry');
    const body = JSON.parse(String(init.body)); expect(TelemetrySchema.safeParse(body).success).toBe(true);
    expect(body.samples).toEqual([{ metric: 'ui.quote_roundtrip_ms', value: 123.5, demo: false }]);
    expect(body.events[0].route).toBe('/coin/:address'); expect(body.events[0].sessionId).not.toBe(privateText);
    expect(body.events[1].props.secondsSinceKey).toBe(2.25); expect(body.events[2].props.secondsToDecide).toBe(3.5);
    expect(body.error).toEqual({ kind: 'type_error', demo: false });
    expect(String(init.body)).not.toContain(privateText); expect(String(init.body)).not.toContain('fixture-placeholder');
    expect(t.localStats('ui.quote_roundtrip_ms')?.count).toBe(1); expect(t.localStats('ui.secret_fixture')).toBeNull();
  });
  it('redacts untrusted thrown objects without invoking string coercion and drops unexpected props', async () => {
    const t = await import('./telemetry'), stringify = vi.fn(() => privateText);
    t.reportClientError({ toString: stringify, wallet: privateText });
    t.trackEvent({ name: 'page_view', props: { wallet: privateText } } as never);
    await vi.advanceTimersByTimeAsync(5000);
    expect(stringify).not.toHaveBeenCalled(); expect(send).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String((send.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body.events).toEqual([]); expect(body.error.kind).toBe('client_error');
    expect(JSON.stringify(body)).not.toContain(privateText);
  });
  it('keeps timers and batches bounded while a send is pending and contains transport failures', async () => {
    const t = await import('./telemetry');
    let release!: () => void;
    send.mockImplementationOnce(async () => { await new Promise<void>(r => { release = r; }); return new Response('{"ok":true}'); });
    for (let i = 0; i < 300; i++) t.track('ws.rtt_ms', i);
    expect(send).toHaveBeenCalledTimes(1);
    release(); await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(send).toHaveBeenCalledTimes(5);
    for (const call of send.mock.calls) {
      const body = JSON.parse(String((call as unknown as [string, RequestInit])[1].body));
      expect(body.samples.length).toBeLessThanOrEqual(50); expect(TelemetrySchema.safeParse(body).success).toBe(true);
    }
    expect(t.localStats('ws.rtt_ms')!.count).toBe(200);
    send.mockRejectedValueOnce(new Error('fixture transport unavailable'));
    t.track('ws.rtt_ms', 1); await t.flushTelemetry();
    await vi.advanceTimersByTimeAsync(10_000); expect(send).toHaveBeenCalledTimes(6);
  });
  it('uses v1-only telemetry and empty metrics fixtures in mock mode without fetch', async () => {
    vi.stubEnv('VITE_MOCKS', '1');
    const t = await import('./telemetry');
    t.track('ws.rtt_ms', 12); t.trackEvent({ name: 'page_view' }); t.reportClientError(privateText);
    await t.flushTelemetry(); expect(send).not.toHaveBeenCalled();
    const transport = vi.fn(createMockTransport()), client = createApi('/v1', transport);
    expect(await client.request('/telemetry', { body: { samples: [{ metric: 'ws.rtt_ms', value: 12, demo: true }] } })).toEqual({ ok: true });
    expect(transport.mock.calls[0]![0]).toBe('/v1/telemetry');
    expect(await client.request('/metrics')).toMatchObject({ metrics: [], telemetry: [] });
    await expect(client.request('/api/telemetry', { body: {} })).rejects.toMatchObject({ status: 404 });
    await expect(client.request('/telemetry', { body: { wallet: privateText } })).rejects.toMatchObject({ status: 422 });
    expect(send).not.toHaveBeenCalled();
  });
  it('normalizes dynamic paths, queries, fragments and unknown paths to bounded templates', () => {
    expect(telemetryRoute('/approve/fixture-placeholder?token=fixture-placeholder')).toBe('/approve/:id');
    expect(telemetryRoute('/coin/fixture-placeholder#order-context')).toBe('/coin/:address');
    expect(telemetryRoute('/unknown/fixture-placeholder')).toBe('other');
    expect(telemetryRoute('/radar?key=fixture-placeholder')).toBe('/radar');
  });
});
