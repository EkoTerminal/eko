// Offline checks of the deliberately small Railway config subset used by packet 083.
// This does not contact Railway, provision resources or validate provider-side settings.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const roles = ['api', 'indexer', 'engines', 'worker', 'mcp', 'receipts', 'bots', 'og'];
const inert = {
  LIVE_TRADING_ENABLED: 'false', TRADING_ALLOWLIST_ONLY: 'true', TRADE_MAX_USD: '25',
  TRADE_CAPS_FROM: '', FEE_BPS_DEFAULT: '0', FEE_ACTIVE_FROM: '', TIERS_ACTIVE_FROM: '',
  FLAGS: '', LEGACY_API: 'false', LEGACY_SIGNALS: 'false', ENABLE_DEV_ROUTES: 'false',
  SWARM_ENABLED: 'false', MCP_OAUTH_ENABLED: 'false', AI_DAILY_BUDGET_USD: '0',
  RPC_PAID_DAILY_BUDGET: '0', RPC_SESSION_BUDGET: '0',
};
export function validateStaging(catalog, manifests, roleSource) {
  assert.equal(catalog.formatVersion, 1);
  assert.equal(catalog.purpose, 'staging-only');
  assert.match(catalog.candidateRevision, /^[a-f0-9]{40}$/);
  assert.equal(catalog.rollbackTargetSeconds, 600);
  assert.deepEqual(catalog.identityAttestation, {
    buildArgument: 'EKO_SOURCE_REVISION', buildRoute: '/v1/build', configVersion: 1, workerReadyMessage: 'EKO worker ready',
  });
  assert.deepEqual(catalog.opsDefaults, { trading_live: false, swarm_ranking: false });
  assert.deepEqual(Object.keys(catalog.services).sort(), [...roles].sort());
  const dispatch = roleSource.match(/export const imageRoles = \{([\s\S]*?)\} as const;/)?.[1];
  assert.ok(dispatch, 'Image role dispatch must be explicitly inspectable');
  for (const role of roles) {
    const service = catalog.services[role];
    const handler = dispatch.match(new RegExp(`\\b${role}: (null|\\{[^}]+\\})`))?.[1];
    assert.ok(handler, `Missing image role ${role}`);
    assert.equal(service.available, handler !== 'null', `Stale availability for ${role}`);
    if (!service.available) assert.ok(service.requiresPackets.length > 0);
    assert.equal(service.config, `infra/railway/${role}.json`);
    assert.equal(service.environment.APP_ROLE, role);
    assert.equal(service.environment.RUN_WORKER, role === 'worker' ? 'true' : 'false');
    assert.equal(service.environment.SERVE_WEB, role === 'api' ? 'true' : 'false');
    // Only API/web has public ingress in the pinned candidate.
    assert.equal(service.public, role === 'api');
    const env = { ...catalog.commonEnvironment, ...service.environment };
    for (const [key, value] of Object.entries(inert)) assert.equal(env[key], value, `${role}:${key}`);
    assert.equal(env.NODE_ENV, 'production');
    assert.equal(env.TRUST_PROXY_HOPS, '1', `${role}: Railway edge requires one trusted hop`);
    assert.equal(env.MARKET_DATA_SOURCE, 'onchain');
    assert.ok(service.secretNames.includes('DATABASE_URL'));
    for (const key of service.secretNames) {
      assert.match(key, /^[A-Z][A-Z0-9_]+$/);
      assert.ok(!(key in env), `${role}: ${key} must remain a secret name only`);
    }
    for (const key of ['KEEPER_KEY', 'SWEEP_KEY', 'X402_FACILITATOR_KEY', 'PREFLIGHT_SIGNER_KEY']) {
      assert.ok(!service.secretNames.includes(key) && !(key in env), `Dormant key ${key}`);
    }
    assert.ok(service.limits.cpu > 0 && service.limits.memoryMb >= 1024);
    const manifest = manifests[role];
    assert.deepEqual(Object.keys(manifest).sort(), ['$schema', 'build', 'deploy'].sort());
    assert.equal(manifest.$schema, 'https://railway.com/railway.schema.json');
    assert.deepEqual(manifest.build, { builder: 'DOCKERFILE', dockerfilePath: 'Dockerfile' });
    assert.deepEqual(manifest.deploy, {
      startCommand: 'node dist/launch.js', numReplicas: 1,
      restartPolicyType: 'ON_FAILURE', restartPolicyMaxRetries: 3,
      ...(role === 'api' ? { healthcheckPath: '/v1/health', healthcheckTimeout: 120 } : {}),
    });
  }
  assert.equal(catalog.postgres.major, 16);
  assert.equal(catalog.postgres.private, true);
  assert.equal(catalog.postgres.replicas, 1);
  assert.equal(catalog.sim.railway, false);
  assert.equal(catalog.sim.private, true);
  assert.equal(catalog.sim.chainId, 4663);
  assert.match(catalog.sim.upstream, /metered/);
}

const catalog = JSON.parse(readFileSync(resolve(root, 'infra/railway/staging.json'), 'utf8'));
const manifests = Object.fromEntries(roles.map(role => [role, JSON.parse(readFileSync(resolve(root, catalog.services[role].config), 'utf8'))]));
const roleSource = readFileSync(resolve(root, 'apps/server/src/roles.ts'), 'utf8');
validateStaging(catalog, manifests, roleSource);
if (process.argv.includes('--self-test')) {
  const mutations = [
    c => { c.commonEnvironment.LIVE_TRADING_ENABLED = 'true'; },
    c => { c.services.worker.environment.RUN_WORKER = 'false'; },
    c => { c.services.api.environment.RUN_WORKER = 'true'; },
    c => { c.commonEnvironment.RPC_SESSION_BUDGET = '100'; },
    c => { c.commonEnvironment.FLAGS = 'd0'; },
    c => { delete c.commonEnvironment.TRUST_PROXY_HOPS; },
    c => { c.commonEnvironment.TRUST_PROXY_HOPS = '2'; },
    c => { c.services.api.environment.TRUST_PROXY_HOPS = 'true'; },
    c => { c.opsDefaults.trading_live = true; },
    c => { c.services.mcp.available = !c.services.mcp.available; },
    c => { c.services.engines.environment.DATABASE_URL = 'postgres://fixture.invalid/sample'; },
    c => { c.services.receipts.secretNames.push('KEEPER_KEY'); },
    c => { c.sim.private = false; },
    c => { c.candidateRevision = 'main'; },
    c => { delete c.identityAttestation; },
    c => { c.identityAttestation.configVersion = 2; },
    c => { c.identityAttestation.buildArgument = 'SOURCE_REVISION'; },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(catalog); mutate(changed);
    assert.throws(() => validateStaging(changed, manifests, roleSource));
  }
  for (const mutate of [
    m => { m.worker.deploy.numReplicas = 2; },
    m => { m.engines.deploy.healthcheckPath = '/v1/health'; },
    m => { m.api.build.dockerfilePath = 'missing'; },
  ]) {
    const changed = structuredClone(manifests); mutate(changed);
    assert.throws(() => validateStaging(catalog, changed, roleSource));
  }
  console.log('Staging rejection checks passed (20 invalid configurations).');
}
const availableRoles = Object.values(catalog.services).filter(service => service.available).length;
console.log(`Staging manifests passed; source=${catalog.candidateRevision}; ${availableRoles} available roles, ${roles.length - availableRoles} gated roles; no Railway or live evidence.`);
