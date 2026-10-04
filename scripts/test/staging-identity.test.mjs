import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, cpSync, symlinkSync, readdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import contract from '../../apps/server/src/build-identity-contract.json' with { type: 'json' };
import { bundleBuildInfo, compareIdentity } from '../lib/staging-identity.mjs';
import { assertPinnedCheckout, expectedIdentity, fetchIdentity, parseArguments, workerIdentityFromLog } from '../verify-staging-identity.mjs';

const revision = 'a'.repeat(40), origin = 'https://staging.example.invalid';
const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));

test('verifier requires exact TLS origin, SHA and a clean matching checkout', () => {
  assert.deepEqual(parseArguments([origin, '--revision', revision]), { origin, revision, expectedConfig: 'infra/railway/staging.json' });
  for (const args of [[origin], ['http://staging.example.invalid', '--revision', revision],
    ['https://demo-account:fixture-password@staging.example.invalid', '--revision', revision],
    [`${origin}/`, '--revision', revision], [origin, '--revision', 'main'],
    [origin, '--revision', revision, '--revision', revision]]) assert.throws(() => parseArguments(args));
  const git = (head, status) => args => args[0] === 'rev-parse' ? head : status;
  assertPinnedCheckout(revision, git(`${revision}\n`, ''));
  assert.throws(() => assertPinnedCheckout(revision, git('b'.repeat(40), '')));
  for (const status of [' M apps/server/src/index.ts', '?? apps/server/src/injected.ts'])
    assert.throws(() => assertPinnedCheckout(revision, git(revision, status)));
  const result = spawnSync(process.execPath, [resolve(root, 'scripts/verify-staging-identity.mjs'), origin, '--revision', 'invalid'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^Staging identity verification failed:/);
});

test('every entry/role is hashed; revision, each bundle and effective config mismatches reject', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'eko-bundle-digests-'));
  try {
    for (const file of contract.bundleFiles) {
      mkdirSync(dirname(join(directory, file)), { recursive: true });
      writeFileSync(join(directory, file), `// fixture ${file}\n`);
    }
    const build = bundleBuildInfo(directory, revision);
    const expected = { build, role: 'api', configVersion: 1, configDigest: 'b'.repeat(64) };
    let calls = 0;
    const actual = await fetchIdentity(origin, async (url, options) => {
      calls++;
      assert.equal(url.href, `${origin}/v1/build`);
      assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'error');
      return Response.json(expected);
    });
    compareIdentity(actual, expected); assert.equal(calls, 1);
    for (const file of contract.bundleFiles) {
      const original = readFileSync(join(directory, file));
      writeFileSync(join(directory, file), 'changed bundle');
      assert.throws(() => compareIdentity({ ...expected, build: bundleBuildInfo(directory, revision) }, expected));
      writeFileSync(join(directory, file), original);
    }
    for (const change of [
      value => { value.build.sourceRevision = 'c'.repeat(40); },
      value => { value.configDigest = 'c'.repeat(64); },
      value => { value.role = 'worker'; },
      value => { value.configVersion = 2; },
      value => { value.build.bundles['index.js'] = 'c'.repeat(64); },
      value => { value.build.secret = 'fixture-secret'; },
    ]) {
      const changed = structuredClone(expected); change(changed);
      assert.throws(() => compareIdentity(changed, expected));
    }
    await assert.rejects(() => fetchIdentity(origin, async () => new Response('', { status: 503 })));
    await assert.rejects(() => fetchIdentity(origin, async () => new Response('x'.repeat(16_385))));
    const catalog = { commonEnvironment: { NODE_ENV: 'production' }, services: {
      worker: { environment: { APP_ROLE: 'worker', RUN_WORKER: 'true' }, secretNames: ['SESSION_SECRET'] },
    } };
    const worker = expectedIdentity(catalog, revision, build, 'worker', () => 'b'.repeat(64), 'caps');
    compareIdentity(workerIdentityFromLog(JSON.stringify({ msg: 'EKO worker ready', identity: worker })), worker);
    assert.throws(() => workerIdentityFromLog(JSON.stringify({ msg: 'EKO server ready', identity: expected })));
    catalog.services.worker.environment.SESSION_SECRET = 'fixture-secret';
    assert.throws(() => expectedIdentity(catalog, revision, build, 'worker', () => 'b'.repeat(64), 'caps'));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('production bundle hashes reproduce across checkout paths without git metadata', () => {
  const directory = mkdtempSync(join(tmpdir(), 'eko-reproducible-build-'));
  try {
    const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
    const additions = ['apps/server/src/build-identity.ts', 'apps/server/src/build-identity-contract.json', 'scripts/lib/staging-identity.mjs'];
    const files = [...new Set([...tracked, ...additions])].filter(file => /^(apps|packages|harness-packs)\//.test(file) || /^(package.json|tsconfig.base.json|scripts\/lib\/staging-identity.mjs)$/.test(file));
    const results = [];
    for (const name of ['first-checkout', 'different-checkout']) {
      const checkout = join(directory, name);
      for (const file of files) {
        mkdirSync(dirname(join(checkout, file)), { recursive: true });
        cpSync(join(root, file), join(checkout, file));
      }
      // Reuse installed, locked tooling; no install, git metadata or network.
      for (const workspace of ['apps/server', 'apps/engines', 'apps/indexer', 'apps/mcp', 'apps/og-renderer',
        'packages/shared', 'packages/db', 'packages/chain', 'packages/policy', 'packages/playbooks', 'packages/untrusted', 'packages/signal']) {
        const modules = join(checkout, workspace, 'node_modules'); mkdirSync(modules, { recursive: true });
        for (const entry of readdirSync(join(root, workspace, 'node_modules'))) {
          if (entry !== '@eko') symlinkSync(join(root, workspace, 'node_modules', entry), join(modules, entry));
          else {
            mkdirSync(join(modules, '@eko'));
            for (const dependency of readdirSync(join(root, workspace, 'node_modules/@eko'))) {
              const target = realpathSync(join(root, workspace, 'node_modules/@eko', dependency));
              assert.ok(target.startsWith(`${root}/`));
              symlinkSync(join(checkout, target.slice(root.length + 1)), join(modules, '@eko', dependency));
            }
          }
        }
      }
      execFileSync(process.execPath, [join(checkout, 'apps/server/build.mjs')], {
        cwd: directory, env: { PATH: process.env.PATH, EKO_SOURCE_REVISION: revision }, stdio: 'pipe',
      });
      results.push(bundleBuildInfo(join(checkout, 'apps/server/dist'), revision));
    }
    assert.deepEqual(results[0], results[1]);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
