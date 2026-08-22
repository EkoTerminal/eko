import { spawnSync } from 'node:child_process';

const result = spawnSync('forge', ['test'], { stdio: 'inherit' });
if (result.error?.code === 'ENOENT') {
  console.log('@eko/contracts: skipping Foundry tests because forge is not on PATH.');
} else if (result.error) {
  throw result.error;
} else {
  process.exitCode = result.status ?? 1;
}
