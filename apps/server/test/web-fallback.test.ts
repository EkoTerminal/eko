import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

it('boots with static web assets and shares one API 404 / SPA fallback handler', async () => {
  const web = await mkdtemp(join(tmpdir(), 'eko-spa-fixture-'));
  const html = '<!doctype html><head><!--eko:head--><title>EKO</title></head><main>Fixture</main>';
  await writeFile(join(web, 'index.html'), html);
  try {
    const built = await buildApp(loadConfig({
      NODE_ENV: 'test', PGLITE_DIR: ':memory:', SESSION_SECRET: 'spa-fixture-placeholder'.repeat(3),
      RUN_WORKER: 'false', LEGACY_API: 'false', MARKET_DATA_SOURCE: 'onchain', SERVE_WEB: 'true', WEB_DIST_DIR: web,
    }), { startBackground: false });
    try {
      await built.app.ready();
      for (const path of ['/v1/missing', '/api/missing', '/ws/missing']) {
        const result = await built.app.inject(path);
        expect(result.statusCode).toBe(404);
        expect(result.json()).toMatchObject({ error: 'not_found' });
      }
      const spa = await built.app.inject('/mission/connect');
      expect(spa.statusCode).toBe(200);
      expect(spa.body).toBe(html);
      expect(spa.headers['content-type']).toContain('text/html');
    } finally { await built.close(); }
  } finally { await rm(web, { recursive: true, force: true }); }
});
