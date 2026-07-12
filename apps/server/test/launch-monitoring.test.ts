import { readFile } from 'node:fs/promises';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { accounts, auditLog, featureFlags } from '../src/db/schema.js';
import { LaunchMonitor, metricNames } from '../src/obs/launch.js';
import { deliverError, initErrorReporting } from '../src/obs/errors.js';
import { createDemoToken } from '../src/http/v1/demo.js';

const origin = 'https://app.eko.example';
const wallet = `0x${'a'.repeat(40)}`;
const secret = 'monitoring-fixture-placeholder'.repeat(2);
const page = vi.fn(async () => {}), sentry = vi.fn(async () => {});
let built: Awaited<ReturnType<typeof buildApp>>, cookie: string, userCookie: string, privilegedUserCookie: string;
beforeAll(async () => {
  built = await buildApp(loadConfig({ NODE_ENV: 'test', PGLITE_DIR: ':memory:', SESSION_SECRET: secret, DEMO_SECRET: secret,
    ADMIN_WALLETS: wallet, PUBLIC_ORIGIN: origin, LEGACY_API: 'false', LIVE_TRADING_ENABLED: 'true' }),
  { startBackground: false, alertSinks: { page, sentry } });
  const [admin, user, privileged] = await built.ctx.dbh.db.insert(accounts).values([
    { kind: 'wallet', walletAddress: wallet }, { kind: 'wallet', walletAddress: `0x${'b'.repeat(40)}` },
    { kind: 'wallet', walletAddress: `0x${'c'.repeat(40)}`, role: 'admin' },
  ]).returning();
  const cookieFor = async (id: string) => `eko_sid=${built.app.signCookie(await built.ctx.auth.createSession(id))}`;
  cookie = await cookieFor(admin!.id); userCookie = await cookieFor(user!.id); privilegedUserCookie = await cookieFor(privileged!.id);
});
afterAll(async () => { await built.close(); });
const post = (url: string, payload: object, session = cookie, from = origin) => built.app.inject({ method: 'POST', url, payload, headers: { cookie: session, origin: from } });
const read = (check: string) => built.app.inject(`/v1/health/checks/${check}`);

describe('launch monitoring (offline migrated database, fake delivery)', () => {
  it('requires an allowlisted wallet, origin and non-demo session for every mutation', async () => {
    for (const path of ['/admin/incident', '/v1/admin/monitoring/measurements']) {
      const payload = path === '/admin/incident' ? { kind: 'guard_miss' } : { metric: 'quote_ms', value: 10 };
      expect((await post(path, payload, '')).statusCode).toBe(401);
      expect((await post(path, payload, userCookie)).statusCode).toBe(403);
      expect((await post(path, payload, privilegedUserCookie)).statusCode).toBe(403);
      expect((await post(path, payload, cookie, 'https://invalid.example')).statusCode).toBe(403);
      const demo = createDemoToken([], built.ctx.cfg.DEMO_SECRET!);
      expect((await built.app.inject({ method: 'POST', url: path, payload, headers: { cookie: `${cookie}; eko_demo=${demo}`, origin } })).statusCode).toBe(403);
    }
    expect(page).not.toHaveBeenCalled();
    expect((await post('/admin/incident', { kind: 'key_compromise' })).statusCode).toBe(422);
  });
  it('does not certify missing roles/measurements and keeps D0 checks inactive', async () => {
    for (const check of ['indexer', 'engines', 'mcp', 'oauth', 'guard', 'scan', 'telegram', 'receipts', 'head', 'queue', 'preflight', 'simulation', 'backup']) {
      const r = await read(check); expect(r.statusCode).toBe(503); expect(r.json().state).toBe('unavailable');
    }
    expect((await read('api')).json().state).toBe('healthy');
    for (const check of ['x', 'farcaster', 'daily_burn']) expect((await read(check)).json()).toEqual({ state: 'inactive', value: null });
    expect((await read('absent-check')).statusCode).toBe(404);
    const r = await built.app.inject('/api/metrics/prometheus');
    expect(r.statusCode).toBe(200); expect(r.headers['content-type']).toContain('text/plain');
    expect(r.body).toContain('eko_measurement_available{metric="pair_to_complete_verdict_ms"} 0');
    expect(r.body).not.toContain(wallet); expect(r.body).not.toContain(secret);
  });
  it('clears receipt observations when no canonical anchor or live role exists', async () => {
    await built.ctx.monitoring.record({ metric: 'receipt_commit_timestamp_s', value: Date.now()/1000 });
    await built.ctx.monitoring.record({ metric: 'role_receipts', value: 1 });
    expect((await built.ctx.monitoring.checks(false)).receipts.state).toBe('healthy');
    await built.ctx.monitoring.collect();
    expect((await built.ctx.monitoring.checks(false)).receipts.state).toBe('unavailable');
  });
  it('bounds names/labels and distinguishes queue completion from complete verdict latency', async () => {
    for (const payload of [{ metric: wallet, value: 1 }, { metric: 'quote_ms', value: -1 }, { metric: 'role_guard', value: .5 },
      { metric: 'quote_ms', value: 1, labels: { wallet } }])
      expect((await post('/v1/admin/monitoring/measurements', payload)).statusCode).toBe(422);
    expect((await post('/v1/admin/monitoring/measurements', { metric: 'queue_completion_ms', value: 1 })).statusCode).toBe(200);
    expect((await read('queue')).json().state).toBe('unavailable');
    await post('/v1/admin/monitoring/measurements', { metric: 'role_engines', value: 1 });
    expect((await read('queue')).json().state).toBe('healthy');
    expect((await read('scan')).json().state).toBe('unavailable');
    await post('/v1/admin/monitoring/measurements', { metric: 'role_scan', value: 1 });
    await post('/v1/admin/monitoring/measurements', { metric: 'pair_to_complete_verdict_ms', value: 5001 });
    expect((await read('scan')).json()).toEqual({ state: 'unhealthy', value: 5001 });
  });
  it('exercises RPC outage, simulation failure, stale committer and guard miss without external calls', async () => {
    const db = built.ctx.dbh.db;
    for (const kind of ['rpc_outage', 'simulation_failure', 'stale_committer', 'guard_miss']) {
      await db.insert(featureFlags).values({ key: 'trading_live', enabled: true, audience: 'public' }).onConflictDoUpdate({ target: featureFlags.key, set: { enabled: true } });
      // Prime the prior cache, then prove the next execution check reads the stop.
      expect(await built.ctx.flags.isOpsOn('trading_live')).toBe(true);
      const result = await post('/admin/incident', { kind }); expect(result.statusCode).toBe(200);
      expect(await built.ctx.tradeAccess.liveEnabled()).toBe(kind === 'stale_committer');
      const [row] = await db.select().from(auditLog).where(eq(auditLog.id, result.json().incidentId));
      expect(row!.data).toMatchObject({ kind, delivery: 'prepared' });
      if (kind === 'guard_miss') expect(row!.data).toMatchObject({ scoreboardDraft: 'honeypots_missed', postMortemWithinHours: 24 });
    }
    expect(page).toHaveBeenCalledTimes(4); expect(sentry).toHaveBeenCalledTimes(4);
    expect(page.mock.calls[0]).toEqual(sentry.mock.calls[0]);
    expect(JSON.stringify(page.mock.calls)).not.toContain(wallet);
    const deliveries = await db.select().from(auditLog).where(eq(auditLog.action, 'ops.incident_delivery'));
    expect(deliveries).toHaveLength(8); expect(deliveries.every(r => (r.data as { outcome: string }).outcome === 'delivered')).toBe(true);
  });
  it('marks stale data unavailable, computes p95 and failure denominator, and crosses D0 burn boundaries', async () => {
    let now = Date.now(); const monitor = new LaunchMonitor(built.ctx.dbh.chain.sql, () => now);
    await monitor.record({ metric: 'preflight_ms', value: 149 });
    expect((await monitor.checks(false)).preflight.state).toBe('healthy');
    await monitor.record({ metric: 'preflight_ms', value: 150 });
    expect((await monitor.checks(false)).preflight.state).toBe('unhealthy');
    await monitor.record({ metric: 'simulation_failure', value: 0 });
    await monitor.record({ metric: 'simulation_failure', value: 1 });
    expect((await monitor.snapshot()).simulation_failure!.value).toBe(.5);
    await monitor.record({ metric: 'burn_due_timestamp_s', value: now / 1000 - 3600 });
    await monitor.record({ metric: 'burn_confirmed_timestamp_s', value: now / 1000 - 86400 });
    expect((await monitor.checks(false)).daily_burn.state).toBe('inactive');
    expect((await monitor.checks(true)).daily_burn.state).toBe('healthy');
    now += 1000; expect((await monitor.checks(true)).daily_burn.state).toBe('unhealthy');
    await monitor.record({ metric: 'burn_confirmed_timestamp_s', value: now / 1000 });
    expect((await monitor.checks(true)).daily_burn.state).toBe('healthy');
    await monitor.record({ metric: 'role_mcp', value: 1 });
    now += 90001; expect((await monitor.checks(false)).mcp.state).toBe('unavailable');
    now += 300001; expect((await monitor.checks(false)).preflight.state).toBe('unavailable');
    // Concurrent writers retain samples and cap storage independently of lifetime call count.
    await Promise.all(Array.from({ length: 520 }, (_, value) => monitor.record({ metric: 'quote_ms', value })));
    const rows = await built.ctx.dbh.chain.sql.query<{ n: number }>("SELECT jsonb_array_length(samples) AS n FROM launch_measurements WHERE metric='quote_ms'");
    expect(rows.rows[0]!.n).toBe(512);
    expect(metricNames.length).toBeLessThan(40);
  });
});

describe('prepared delivery and operational definitions', () => {
  it('records failed/unconfigured sinks while keeping the stop durable', async () => {
    const { IncidentService } = await import('../src/obs/incidents.js');
    const service = new IncidentService(built.ctx.dbh.db, { page: async () => { throw new Error('fixture unavailable'); } });
    const [actor] = await built.ctx.dbh.db.select().from(accounts).where(eq(accounts.walletAddress, wallet));
    const result = await service.raise(actor!.id, 'guard_miss');
    const deliveries = await built.ctx.dbh.db.select().from(auditLog).where(eq(auditLog.action, 'ops.incident_delivery'));
    expect(deliveries.filter(r => (r.data as { incidentId: number }).incidentId === result.incidentId).map(r => r.data)).toEqual([
      { incidentId: result.incidentId, channel: 'page', outcome: 'failed' }, { incidentId: result.incidentId, channel: 'sentry', outcome: 'unavailable' },
    ]);
    expect(await built.ctx.tradeAccess.liveEnabled()).toBe(false);
  });
  it('keeps missing migration/collector delivery unavailable without leaking database errors', async () => {
    const { launchEmitter } = await import('@eko/db');
    const unavailable = vi.fn();
    const emitter = launchEmitter({ query: async () => { throw new Error('fixture database unavailable'); } }, unavailable);
    emitter.emit('queue_completion_ms', 12); emitter.emit('role_engines', 1);
    await emitter.drain(); expect(unavailable).toHaveBeenCalledTimes(1);
  });
  it('invalidates overflowing emitter windows instead of presenting a biased quantile', async () => {
    const { launchEmitter } = await import('@eko/db');
    const query = vi.fn(async () => ({ rows: [] })), unavailable = vi.fn();
    const emitter = launchEmitter({ query }, unavailable);
    for (let value=0;value<520;value++) emitter.emit('queue_completion_ms', value);
    await emitter.drain();
    expect(unavailable).toHaveBeenCalledTimes(1);
    expect(query.mock.calls).toEqual([['DELETE FROM launch_measurements WHERE metric=$1', ['queue_completion_ms']]]);
  });
  it('verifies Sentry envelopes with a fake HTTP sink and resets disabled delivery', async () => {
    const send = vi.fn(async () => ({ ok: true })); vi.stubGlobal('fetch', send);
    try {
      initErrorReporting('https://fixture-key@sentry.example/123', 'test');
      expect(await deliverError(new Error('launch_incident_rpc_outage'), { severity: '2' })).toBe(true);
      const body = (send.mock.calls as unknown as [string, { body: string }][])[0]![1].body;
      expect(body.split('\n')).toHaveLength(3); expect(body).not.toContain(wallet); expect(body).not.toContain(secret);
      send.mockResolvedValueOnce({ ok: false }); expect(await deliverError(new Error('fixture_failure'))).toBe(false);
      initErrorReporting(undefined, 'test'); expect(await deliverError(new Error('fixture_disabled'))).toBe(false);
      expect(send).toHaveBeenCalledTimes(2);
    } finally { vi.unstubAllGlobals(); initErrorReporting(undefined, 'test'); }
  });
  it('loads severity thresholds, disabled Kuma checks and empty external receivers', async () => {
    const readJson = async (name: string) => JSON.parse(await readFile(new URL(`../../../infra/monitoring/${name}.json`, import.meta.url), 'utf8'));
    const alerts = (await readJson('launch-alerts')).groups[0].rules as { alert: string; expr: string; labels: { severity: string }; for?: string }[];
    expect(alerts.find(r => r.alert === 'SimulationFailures')).toMatchObject({ expr: 'eko_launch_value{metric="simulation_failure"} > 0.05', for: '5m', labels: { severity: '2' } });
    expect(alerts.find(r => r.alert === 'GuardMiss')!.labels.severity).toBe('1');
    expect(alerts.find(r => r.alert === 'PreflightLatency')!.labels.severity).toBe('3');
    const kuma = await readJson('uptime-kuma-checks');
    expect(kuma.checks.filter((c: { active: boolean }) => !c.active).map((c: { name: string }) => c.name)).toEqual(['x', 'farcaster', 'daily_burn']);
    expect((await readJson('alertmanager')).receivers.every((r: object) => Object.keys(r).length === 1)).toBe(true);
  });
  it('prepares ops commands by default and tests authenticated dispatch with a fake sink', async () => {
    // @ts-expect-error Repo-local operational script has no TypeScript declaration.
    const { runOps, prepareOps } = await import('../../../scripts/ops.mjs');
    const send = vi.fn(async () => ({ ok: true }));
    expect(await runOps(['guard_miss'], {}, send)).toMatchObject({ prepared: true, body: { kind: 'guard_miss' } });
    expect(send).not.toHaveBeenCalled();
    const env = { OPS_API_ORIGIN: 'https://api.eko.test', OPS_PUBLIC_ORIGIN: origin, OPS_SESSION_COOKIE: 'eko_sid=fixture-placeholder' };
    expect(await runOps(['rpc_outage', '--execute'], env, send)).toEqual({ submitted: true, kind: 'rpc_outage' });
    expect(send.mock.calls).toHaveLength(1);
    expect(() => prepareOps(['guard_miss', '--execute'], {})).toThrow();
    expect(() => prepareOps(['key_compromise'], {})).toThrow();
    expect(() => prepareOps(['guard_miss'], { OPS_API_ORIGIN: 'https://secret@api.eko.test' })).toThrow();
  });
});
