// Offline verification of compiled entry points with web assets; no ports or provider traffic.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import guardCodeFiles from '../apps/engines/src/guard-code-files.json' with { type: 'json' };
import signalCodeFiles from '../apps/engines/src/signal-code-files.json' with { type: 'json' };

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'apps/server/dist');
const web = join(root, 'apps/web/dist');
assert.ok(existsSync(join(web, 'index.html')), 'Build @eko/web before running this check');
for (const entry of ['index.js', 'indexer.js', 'engines.js', 'receipts.js', 'launch.js', 'mcp.js']) assert.ok(existsSync(join(dist, entry)), entry);
function sameTree(source, target) {
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const from = join(source, entry.name), to = join(target, entry.name);
    if (entry.isDirectory()) sameTree(from, to);
    else assert.deepEqual(readFileSync(to), readFileSync(from), entry.name);
  }
}
sameTree(join(root, 'packages/db/drizzle'), join(dist, 'chain-drizzle'));
sameTree(join(root, 'packages/chain/abi'), join(dist, 'abi'));
for (const file of [...guardCodeFiles, ...signalCodeFiles]) assert.deepEqual(readFileSync(join(dist, 'guard-code', file)), readFileSync(join(root, file)), file);
assert.deepEqual(readFileSync(join(dist, 'addresses.4663.yaml')), readFileSync(join(root, 'packages/chain/addresses.4663.yaml')));
// The Dockerfile copies the heritage migration tree separately, retaining Drizzle metadata.
assert.ok(existsSync(join(root, 'apps/server/drizzle/meta/_journal.json')));

async function launch(role, signal, ready, extra = {}, direct = false, expectedError) {
  const entries = { api: 'index.js', worker: 'index.js', engines: 'engines.js', indexer: 'indexer.js', receipts: 'receipts.js', mcp: 'mcp.js' };
  let fixtureDb;
  if (role === 'mcp') {
    // Deployment applies API migrations separately; prepare the same schema offline.
    fixtureDb = mkdtempSync(join(tmpdir(), 'eko-mcp-image-'));
    const require = createRequire(join(root, 'apps/server/package.json'));
    const { PGlite } = require('@electric-sql/pglite');
    const { drizzle } = require('drizzle-orm/pglite');
    const { migrate } = require('drizzle-orm/pglite/migrator');
    const db = new PGlite(fixtureDb);
    try { await migrate(drizzle(db), { migrationsFolder: join(root, 'apps/server/drizzle') }); }
    finally { await db.close(); }
  }
  const child = spawn(process.execPath, [join(dist, direct ? entries[role] : 'launch.js')], {
    cwd: join(root, 'apps/server'),
    env: {
      PATH: process.env.PATH, NODE_ENV: 'development', APP_ROLE: role, PGLITE_DIR: ':memory:',
      ADDRESSES_FILE: join(dist, 'addresses.4663.yaml'),
      SESSION_SECRET: 'image-fixture-placeholder'.repeat(3), LEGACY_API: 'false',
      RUN_WORKER: role === 'worker' ? 'true' : 'false', SERVE_WEB: 'true', WEB_DIST_DIR: web,
      NODE_OPTIONS: `--import=${new URL('./fixtures/role-image-preload.mjs', import.meta.url).href}`,
      MARKET_DATA_SOURCE: 'onchain', LIVE_TRADING_ENABLED: 'false', ...extra,
      ...(fixtureDb ? { PGLITE_DIR: fixtureDb } : {}),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '', stderr = '', sent = false;
  const timeout = setTimeout(() => child.kill('SIGKILL'), 20000);
  child.stdout.on('data', chunk => {
    stdout += chunk;
    if (ready && stdout.includes(ready) && !sent) { sent = true; child.kill(signal); }
  });
  child.stderr.on('data', chunk => { stderr += chunk; });
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, exitSignal) => resolve({ code, signal: exitSignal }));
  }).finally(() => { clearTimeout(timeout); if (fixtureDb) rmSync(fixtureDb, { recursive: true, force: true }); });
  if (ready) {
    assert.ok(sent, `${role} readiness missing: ${stdout}\n${stderr}`);
    assert.deepEqual(result, { code: 0, signal: null }, stderr);
    if (role === 'engines') assert.ok(stdout.includes('engines_stopped'));
    else if (role === 'receipts') assert.ok(stdout.includes('receipts_stopped'));
    else if (role === 'indexer') {
      assert.ok(stdout.includes('indexer_started'));
      assert.ok(stdout.includes('fixture_rpc'));
      assert.ok(stdout.includes('shutdown_requested'));
      assert.ok(stdout.includes('indexer_stopped'));
    }
    else assert.ok(stdout.includes('shutting down'));
    if (role === 'api') assert.ok(stdout.includes('built_api_routes_ready'));
  } else {
    assert.equal(result.code, 1, `${role} must fail startup`);
    if (role === 'indexer') {
      const events = stdout.trim().split('\n').map(line => JSON.parse(line));
      // stack_frames (redacted function/file:line summaries, task 066) are diagnostic and may be empty.
      assert.deepEqual(events.map(({ stack_frames, ...rest }) => rest), [{ event: 'indexer_halted', reason: 'startup_or_ingest_failure', action: 'check_chain_config_and_database', error: 'Invalid indexer environment: RPC_HTTP_URL' }]);
    } else assert.equal(stdout, '', `${role} must not launch a fallback service`);
    if (expectedError) assert.ok(stderr.includes(expectedError), `Missing named requirement: ${stderr}`);
  }
  console.log(`role=${role} entry=${direct ? 'direct' : 'dispatcher'} check=${ready ? signal : 'startup-refused'} exit=${result.code}`);
}

// Exercise the actual compiled CLI and its dispatcher for every implemented role.
for (const role of ['api', 'worker', 'indexer', 'engines']) {
  const ready = { api: 'EKO server ready', worker: 'EKO worker ready', indexer: 'head_tick', engines: 'engines_started' }[role];
  const extra = role === 'indexer' ? {
    RPC_HTTP_URL: 'https://fixture.invalid', RPC_PUBLIC_HTTP_URL: 'https://fixture.invalid',
    INDEX_START_BLOCK: '1', INDEX_HEAD_TICK_MS: '100',
  } : {};
  for (const direct of [true, false]) await launch(role, 'SIGTERM', ready, extra, direct);
}
// A temporary registry and ephemeral in-memory key exercise empty receipts startup
// and draining only. The fixture rejects all signing/broadcast RPC methods.
const receiptFixture = mkdtempSync(join(tmpdir(), 'eko-receipts-image-'));
try {
  const addressFile = join(receiptFixture, 'addresses.yaml');
  writeFileSync(addressFile, readFileSync(join(dist, 'addresses.4663.yaml'), 'utf8')
    .replace('receiptsRegistry: TODO', `receiptsRegistry: { address: "0x${'1'.repeat(40)}" }`));
  for (const direct of [true, false]) await launch('receipts', 'SIGTERM', 'receipts_started', {
    RPC_HTTP_URL: 'https://fixture.invalid', RPC_PUBLIC_HTTP_URL: 'https://fixture.invalid',
    ADDRESSES_FILE: addressFile, RECEIPTS_COMMITTER_KEY: `0x${randomBytes(32).toString('hex')}`,
  }, direct);
} finally { rmSync(receiptFixture, { recursive: true, force: true }); }
for (const role of ['engines', 'worker']) {
  await launch(role, 'SIGINT', role === 'engines' ? 'engines_started' : 'EKO worker ready');
}
for (const direct of [true, false]) await launch('mcp', 'SIGTERM', 'EKO MCP ready', {
  HARNESS_KEY_PEPPER: 'image-fixture-placeholder'.repeat(3), MCP_PUBLIC_URL: 'https://mcp.eko.example/mcp',
  LAUNCH_WEEK_AGENT_LIMIT: '1',
}, direct);
for (const role of ['bots', 'og', 'swarm', 'research']) await launch(role, undefined, undefined, {}, false, 'unavailable in this image');
for (const role of ['keeper', 'unknown']) await launch(role, undefined, undefined, {}, false, 'Unknown or missing APP_ROLE');
await launch('api', undefined, undefined, { NODE_ENV: 'production' }, false, 'DATABASE_URL required in production');
await launch('receipts', undefined, undefined, {}, false, 'Receipts halted:');
await launch('indexer'); // Missing RPC configuration must fail before any chain access.
console.log('Built role fixture checks passed; real Fastify boot, injected routes and fixture metered RPC; no ports, providers or deployment evidence.');
