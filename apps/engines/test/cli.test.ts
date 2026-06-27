import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { openDb } from '@eko/db';
import { replayFixture } from './replay-fixture.js';

describe('replay CLI shutdown',()=>{
 it.each(['SIGINT','SIGTERM'] as const)('drains the current evaluation on %s, prints the summary and closes PGlite',async signal=>{
  const directory=await mkdtemp(join(tmpdir(),'eko-replay-'));
  try {
    const seed=await replayFixture(60,10,directory);await seed.close();
    const child=spawn(process.execPath,['--import','tsx','src/cli.ts'],{
      cwd:process.cwd(),env:{PATH:process.env.PATH,APP_ROLE:'engines',ENGINE_MODE:'replay',PGLITE_DIR:directory,FROM:'1',TO:'10',ENGINE_CONCURRENCY:'4'},stdio:['ignore','pipe','pipe'],
    });
    let output='',errors='',sent=false;
    const timeout=setTimeout(()=>child.kill('SIGKILL'),15000);
    child.stdout.on('data',chunk=>{output+=chunk.toString();if(!sent && output.includes('engine_progress')){sent=true;child.kill(signal);}});
    child.stderr.on('data',chunk=>{errors+=chunk.toString();});
    const result=await new Promise<{code:number|null;signal:NodeJS.Signals|null}>((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));}).finally(()=>clearTimeout(timeout));
    expect(sent).toBe(true);expect(result,errors).toEqual({code:0,signal:null});
    const summary=output.split('\n').filter(Boolean).map(line=>JSON.parse(line)).find(row=>row.event==='replay_interrupted');
    expect(summary,output).toBeDefined();
    const planned=output.split('\n').filter(Boolean).map(line=>JSON.parse(line)).find(row=>row.event==='replay_planned');
    expect(planned).toMatchObject({tasks:600,coins:60,from:1,to:10});
    expect(summary.evaluationsPerSec).toBeGreaterThan(0);expect(summary.rssMb).toBeGreaterThan(0);expect(summary.rpcCalls).toEqual({});expect(summary.timeShare.sourceLoading).toBeGreaterThan(0);expect(summary.timeShare.writeTransaction).toBeGreaterThan(0);
    expect(summary.evaluations).toBeGreaterThanOrEqual(100);expect(summary.evaluations).toBeLessThan(600);
    expect(summary.coinsEvaluated).toBe(60);expect(summary.verdicts).toEqual({clear:0,pending:60,monitor:0,danger:0});expect(summary.playbooks).toEqual({});
    const reopened=await openDb({pgliteDir:directory});
    try {expect(Number((await reopened.sql.query<{n:string}>('SELECT count(*) AS n FROM engine_runs')).rows[0].n)).toBe(summary.evaluations);}
    finally {await reopened.close();}
  } finally {await rm(directory,{recursive:true,force:true});}
 },20000);
});
