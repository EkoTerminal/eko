import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const temp=mkdtempSync(join(tmpdir(),'eko-probe-'));
try {
  const built=spawnSync('forge',['build','--root',root,'--out',join(temp,'out'),'--cache-path',join(temp,'cache')],{stdio:'inherit'});
  if(built.status!==0)process.exit(built.status ?? 1);
  const artifact=JSON.parse(readFileSync(join(temp,'out','BwProbe.sol','BwProbe.json'),'utf8'));
  const source=`// BwProbe.sol: solc 0.8.26, Cancun, optimizer 10000 runs. NEVER DEPLOY.\nexport const EKO_PROBE_RUNTIME = ${JSON.stringify(artifact.deployedBytecode.object)} as const;\n`;
  const target=new URL('../src/simulation/probe-runtime.ts',import.meta.url);
  if(process.argv.includes('--check')) {
    if(readFileSync(target,'utf8')!==source)throw new Error('Probe runtime is stale; run node probe/build.mjs');
  } else writeFileSync(target,source);
} finally {rmSync(temp,{recursive:true,force:true});}
