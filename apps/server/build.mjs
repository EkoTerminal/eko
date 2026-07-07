// Bundles implemented image roles and their workspace imports into dist/.
// Runtime dependencies stay external and are installed from package.json in production.
import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'node:fs';
import guardCodeFiles from '../engines/src/guard-code-files.json' with { type: 'json' };
import signalCodeFiles from '../engines/src/signal-code-files.json' with { type: 'json' };
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const external = Object.keys(pkg.dependencies ?? {}).filter((d) => !d.startsWith('@eko/'));

await build({
  entryPoints: {
    index: 'src/index.ts',
    launch: 'src/launch.ts',
    indexer: '../indexer/src/cli.ts',
    engines: '../engines/src/cli.ts',
    receipts: '../engines/src/receipts/cli.ts',
    mcp: '../mcp/src/cli.ts',
    'db/migrate-cli': 'src/db/migrate-cli.ts',
  },
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  external,
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  logLevel: 'info',
});

cpSync(new URL('../../packages/db/drizzle', import.meta.url), new URL('./dist/chain-drizzle', import.meta.url), { recursive: true });
cpSync(new URL('../../packages/chain/addresses.4663.yaml', import.meta.url), new URL('./dist/addresses.4663.yaml', import.meta.url));
cpSync(new URL('./config/trading-caps.yaml', import.meta.url), new URL('./dist/trading-caps.yaml', import.meta.url));
cpSync(new URL('../../packages/chain/abi', import.meta.url), new URL('./dist/abi', import.meta.url), { recursive: true });

// Retain the exact Guard and Signal implementation bytes hashed by source and bundled engines.
for (const file of [...guardCodeFiles, ...signalCodeFiles]) {
  mkdirSync(new URL(`./dist/guard-code/${file.slice(0, file.lastIndexOf('/') + 1)}`, import.meta.url), { recursive: true });
  cpSync(new URL(`../../${file}`, import.meta.url), new URL(`./dist/guard-code/${file}`, import.meta.url));
}
