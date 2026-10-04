// Read-only live verification; local rebuilds write only ignored dist artifacts.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bundleBuildInfo, compareIdentity } from './lib/staging-identity.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export function assertPinnedCheckout(revision, run = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })) {
  assert.match(revision, /^[a-f0-9]{40}$/, 'Use a full lowercase source SHA');
  assert.equal(run(['rev-parse', 'HEAD']).trim(), revision, 'Checkout HEAD must equal --revision');
  assert.equal(run(['status', '--porcelain', '--untracked-files=normal']).trim(), '', 'Checkout must be clean, including untracked source');
}
export function parseArguments(args) {
  const [origin, ...options] = args;
  const url = new URL(origin);
  assert.equal(url.protocol, 'https:', 'Exact TLS origin required');
  assert.equal(url.origin, origin, 'Exact TLS origin required');
  assert.equal(url.username + url.password, '', 'Credential URLs forbidden');
  const result = { origin, expectedConfig: 'infra/railway/staging.json' };
  for (let i = 0; i < options.length; i += 2) {
    const key = { '--revision': 'revision', '--expected-config': 'expectedConfig', '--worker-identity': 'workerIdentity', '--indexer-identity': 'indexerIdentity', '--engines-identity': 'enginesIdentity' }[options[i]];
    assert.ok(key && options[i + 1] && !options[i + 1].startsWith('--'), 'Invalid arguments');
    assert.ok(!options.slice(0, i).includes(options[i]), 'Duplicate option');
    result[key] = options[i + 1];
  }
  assert.match(result.revision ?? '', /^[a-f0-9]{40}$/, '--revision is required');
  return result;
}
export function expectedIdentity(catalog, revision, build, role, configDigest, capsText) {
  assert.match(revision, /^[a-f0-9]{40}$/);
  assert.equal(build.sourceRevision, revision);
  const env = { ...catalog.commonEnvironment, ...catalog.services[role].environment };
  assert.equal(env.APP_ROLE, role);
  assert.equal(env.RUN_WORKER, role === 'worker' ? 'true' : 'false');
  // Refuse secret values in the reviewed inventory; never echo values on failure.
  for (const key of catalog.services[role].secretNames) assert.ok(!(key in env), 'Expected config must contain secret names only');
  return { build, role, configVersion: 1, configDigest: configDigest(env, capsText) };
}
export async function fetchIdentity(origin, request = fetch) {
  const response = await request(new URL('/v1/build', origin), {
    method: 'GET', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10_000),
  });
  assert.equal(response.status, 200, 'Live identity request failed');
  // Bound unexpected/proxy responses and never print their contents.
  const body = await response.text();
  assert.ok(body.length <= 16_384, 'Identity response too large');
  return JSON.parse(body);
}
export function workerIdentityFromLog(text) {
  const record = JSON.parse(text);
  assert.equal(record.msg, 'EKO worker ready', 'Expected the worker ready JSON line');
  assert.equal(record.identity.role, 'worker');
  return record.identity;
}
/** Headless roles (indexer, engines) log one "EKO role identity" line from the dispatcher before they start. */
export function roleIdentityFromLog(text, role) {
  const record = JSON.parse(text);
  assert.equal(record.msg, 'EKO role identity', 'Expected the role identity JSON line');
  assert.equal(record.identity.role, role);
  return record.identity;
}
export async function verify(options) {
  assertPinnedCheckout(options.revision);
  const catalog = JSON.parse(readFileSync(resolve(root, options.expectedConfig), 'utf8'));
  // Run the same pinned esbuild build used by Docker. Do not inherit deployment
  // secrets into the build or derive expected values from the remote response.
  execFileSync(process.execPath, [resolve(root, 'apps/server/build.mjs')], {
    cwd: root, env: { PATH: process.env.PATH, EKO_SOURCE_REVISION: options.revision }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  assertPinnedCheckout(options.revision);
  const directory = resolve(root, 'apps/server/dist');
  const build = bundleBuildInfo(directory, options.revision);
  assert.deepEqual(JSON.parse(readFileSync(resolve(directory, 'build-info.json'), 'utf8')), build);
  const { expectedConfigDigest } = await import(pathToFileURL(resolve(directory, 'build-identity.js')).href);
  // File contents, not deployment-specific file paths, determine the cap identity.
  // Any mounted/changed cap schedule must match this reviewed source schedule.
  const caps = readFileSync(resolve(root, 'apps/server/config/trading-caps.yaml'), 'utf8');
  const expected = expectedIdentity(catalog, options.revision, build, 'api', expectedConfigDigest, caps);
  compareIdentity(await fetchIdentity(options.origin), expected);
  let worker = 'not-checked';
  if (options.workerIdentity) {
    const observed = workerIdentityFromLog(readFileSync(resolve(options.workerIdentity), 'utf8'));
    compareIdentity(observed, expectedIdentity(catalog, options.revision, build, 'worker', expectedConfigDigest, caps));
    worker = 'matched';
  }
  const roles = {};
  for (const [role, file] of [['indexer', options.indexerIdentity], ['engines', options.enginesIdentity]]) {
    roles[role] = 'not-checked';
    if (!file) continue;
    const observed = roleIdentityFromLog(readFileSync(resolve(file), 'utf8'), role);
    compareIdentity(observed, expectedIdentity(catalog, options.revision, build, role, expectedConfigDigest, caps));
    roles[role] = 'matched';
  }
  return { event: 'staging_identity_verified', api: 'matched', worker, ...roles, ...expected };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await verify(parseArguments(process.argv.slice(2))))); }
  catch {
    // Fixed diagnostics only: no local paths, Git output, configs or provider text.
    console.error('Staging identity verification failed: check clean pinned HEAD, build, reviewed config and API/worker/indexer/engines identities.');
    process.exitCode = 1;
  }
}
