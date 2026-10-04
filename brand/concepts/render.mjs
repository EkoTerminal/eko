// Renders every concept board: brand/concepts/<concept>/index.html → <concept>/board-*.png (one PNG per .board).
// Run: node brand/concepts/render.mjs [concept-folder ...]
import { readdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '../../apps/web/package.json'));
const { chromium } = require('@playwright/test');

const only = process.argv.slice(2);
const concepts = readdirSync(here, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== 'shared' && existsSync(join(here, d.name, 'index.html')))
  .map((d) => d.name)
  .filter((n) => !only.length || only.includes(n));

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' });
for (const name of concepts) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.25 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(pathToFileURL(join(here, name, 'index.html')).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(Number(process.env.WAIT || 900));
  const boards = await page.$$('.board');
  for (let i = 0; i < boards.length; i++) await boards[i].screenshot({ path: join(here, name, `board-${i + 1}.png`) });
  console.log(`${name}: ${boards.length} boards${errs.length ? '  ERRORS: ' + errs.join(' | ') : ''}`);
  await page.close();
}
await browser.close();
