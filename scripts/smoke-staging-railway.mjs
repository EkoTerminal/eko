// Read-only deployment smoke; --self-test is entirely offline. No signing or chain calls.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { sha256, canonicalJson, validateIdentity } from './lib/staging-identity.mjs';
import contract from '../apps/server/src/build-identity-contract.json' with { type: 'json' };

export async function smoke(origin, request, socketProbe) {
  const url = new URL(origin);
  assert.equal(url.protocol, 'https:', 'TLS origin required');
  assert.equal(url.origin, origin, 'Exact origin required');
  assert.equal(url.username + url.password, '', 'Credentials in URLs are forbidden');
  const get = async path => {
    const response = await request(new URL(path, origin), { redirect: 'error', signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 200, `Unexpected status for ${path}`);
    return response;
  };
  const health = await (await get('/v1/health')).json();
  assert.equal(health.ok, true);
  assert.equal(typeof health.rpc.sessionUnits, 'number');
  const identity = await (await get('/v1/build')).json();
  validateIdentity(identity);
  assert.equal(identity.role, 'api');
  const config = await (await get('/v1/config')).json();
  assert.equal(config.trading.liveEnabled, false, 'Staging trading must be paused');
  assert.ok(config.trading.maxTradeUsd <= 25, 'Staging ceiling must stay bounded');
  assert.ok(Object.values(config.flags).every(value => value === false), 'Unaccepted flags must stay off');
  const page = await get('/mission/connect');
  assert.match(page.headers.get('content-type') ?? '', /text\/html/);
  assert.match(await page.text(), /<html[\s>]/i);
  const ws = new URL('/v1/ws', origin); ws.protocol = 'wss:';
  await socketProbe(ws);
  return { health: 'ok', identity: 'present', trading: 'paused', flags: 'off', spa: 'html', websocket: 'radar-ack' };
}

export async function probeWebSocket(url, Socket = WebSocket) {
  await new Promise((resolve, reject) => {
    const socket = new Socket(url);
    const finish = error => {
      clearTimeout(timer); socket.close(); error ? reject(error) : resolve();
    };
    const timer = setTimeout(() => finish(new Error('WS readiness timeout')), 10000);
    socket.addEventListener('error', () => finish(new Error('WS connection failed')), { once: true });
    socket.addEventListener('close', () => finish(new Error('WS closed before radar ack')), { once: true });
    socket.addEventListener('message', event => {
      try {
        const message = JSON.parse(String(event.data));
        if (message.t === 'hello') socket.send(JSON.stringify({ op: 'sub', ch: ['radar'] }));
        if (message.t === 'ack' && message.ch === 'radar') finish();
        if (message.t === 'err') finish(new Error('WS subscription refused'));
      } catch { finish(new Error('WS invalid message')); }
    });
  });
}

async function selfTest() {
  const bundles = Object.fromEntries(contract.bundleFiles.map(file => [file, 'a'.repeat(64)]));
  const identity = { role: 'api', configVersion: 1, configDigest: 'b'.repeat(64),
    build: { formatVersion: 1, sourceRevision: 'c'.repeat(40), bundles, bundleDigest: sha256(canonicalJson(bundles)) } };
  const healthy = { trading: { liveEnabled: false, maxTradeUsd: 25 }, flags: { approvals: false } };
  const fixture = (config = healthy, build = identity) => async url => {
    if (url.pathname === '/v1/health') return Response.json({ ok: true, rpc: { sessionUnits: 0 } });
    if (url.pathname === '/v1/build') return Response.json(build);
    if (url.pathname === '/v1/config') return Response.json(config);
    if (url.pathname === '/mission/connect') return new Response('<html><title>EKO</title></html>', { headers: { 'content-type': 'text/html' } });
    throw new Error('Unexpected fixture route');
  };
  let socketCalls = 0;
  const socket = async url => { assert.equal(url.href, 'wss://staging.example.invalid/v1/ws'); socketCalls++; };
  const checks = await smoke('https://staging.example.invalid', fixture(), socket);
  assert.equal(socketCalls, 1);
  await assert.rejects(() => smoke('http://staging.example.invalid', fixture(), socket));
  await assert.rejects(() => smoke('https://staging.example.invalid', fixture({ ...healthy, trading: { liveEnabled: true, maxTradeUsd: 25 } }), socket));
  await assert.rejects(() => smoke('https://staging.example.invalid', fixture({ ...healthy, flags: { approvals: true } }), socket));
  await assert.rejects(() => smoke('https://staging.example.invalid', async () => new Response('', { status: 503 }), socket));
  for (const change of [
    value => { value.build = null; },
    value => { value.build.sourceRevision = null; },
    value => { delete value.build.bundles['index.js']; },
    value => { value.build.bundleDigest = 'd'.repeat(64); },
    value => { value.configDigest = 'invalid'; },
    value => { value.role = 'worker'; },
    value => { value.secret = 'fixture-secret'; },
  ]) {
    const changed = structuredClone(identity); change(changed);
    await assert.rejects(() => smoke('https://staging.example.invalid', fixture(healthy, changed), socket));
  }
  class FixtureSocket extends EventTarget {
    constructor() { super(); queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', { data: '{"t":"hello"}' }))); }
    send(value) {
      assert.deepEqual(JSON.parse(value), { op: 'sub', ch: ['radar'] });
      queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', { data: '{"t":"ack","ch":"radar","seq":0}' })));
    }
    close() {}
  }
  await probeWebSocket(new URL('wss://staging.example.invalid/v1/ws'), FixtureSocket);
  console.log(JSON.stringify({ event: 'staging_smoke_fixture', checks, networkCalls: 0, deployed: false }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.includes('--self-test')) await selfTest();
    else {
      assert.equal(process.argv[2], '--authorized-run', 'Use --self-test offline; deployed smoke requires separate authorization and --authorized-run ORIGIN');
      const checks = await smoke(process.argv[3], fetch, probeWebSocket);
      // URL, revision and migration evidence must be recorded separately by the operator.
      console.log(JSON.stringify({ event: 'staging_http_smoke', checks }));
    }
  } catch {
    // Never echo a provider response, URL or credential-bearing exception.
    console.error('Staging smoke failed; check TLS, health, paused config, SPA and WS routing.');
    process.exitCode = 1;
  }
}
