import { mkdir, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { z } from 'zod';
import { pilotHash } from './coverage-pilot.js';
import { pilotCandidateRevision } from './coverage-pilot-cli.js';
import { atomicPilotJson, readPilotJson } from './coverage-pilot-store.js';
import { BackfillResponseSchema, SelectiveBackfillManifestSchema, backfillRequestKey,
  initialBackfillCheckpoint, runSelectiveBackfill, type BackfillCheckpoint, type BackfillResponse } from './selective-backfill.js';

export const BackfillFixtureSchema = z.strictObject({ version: z.literal('selective-backfill-fixture-048.1'),
  responses: z.record(z.string().regex(/^[a-f0-9]{64}$/), BackfillResponseSchema) });
/** Offline fixture driver only. No endpoint, environment secret or RPC transport is read. */
export async function selectiveBackfillMain(args: string[]) {
  if (args.length !== 4 || args[0] !== '--fixture') throw new Error('Usage: selective-backfill-cli.ts --fixture manifest.json fixture.json output-directory');
  const m = SelectiveBackfillManifestSchema.parse(JSON.parse(await readFile(args[1], 'utf8')));
  const fixture = BackfillFixtureSchema.parse(JSON.parse(await readFile(args[2], 'utf8')));
  if (m.validation !== 'fixture' || m.sourceRevision !== `0x${pilotHash(fixture)}`) throw new Error('Fixture source mismatch');
  const output = resolve(args[3]);
  if ([args[1], args[2]].some(p => resolve(p) === output || resolve(p).startsWith(`${output}/`))) throw new Error('Source and output must be separate');
  await mkdir(output, { recursive: true });
  const lock = join(output, 'runner.lock'); await mkdir(lock);
  let stopped = false;
  const stop = () => { stopped = true; };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  try {
    const candidate = await pilotCandidateRevision(), manifestHash = pilotHash(m), owner = 'fixture-runner';
    const c = await readPilotJson<BackfillCheckpoint>(join(output, 'checkpoint.json')) ?? initialBackfillCheckpoint(m, candidate, owner);
    const saved = await readPilotJson<{ hash: string }>(join(output, 'manifest.json'));
    if (saved && saved.hash !== manifestHash) throw new Error('Output manifest mismatch');
    await atomicPilotJson(join(output, 'manifest.json'), { hash: manifestHash, manifest: m });
    await mkdir(join(output, 'artifacts'), { recursive: true });
    const result = await runSelectiveBackfill(m, c, {
      sourceRevision: async () => m.sourceRevision, stopped: () => stopped,
      now: () => performance.now(), rss: () => process.memoryUsage().rss,
      save: async value => {
        await atomicPilotJson(join(output, 'checkpoint.json'), value);
        console.log(JSON.stringify({ event: 'selective_backfill_checkpoint', status: value.status,
          reason: value.reason, fixtureCalls: value.calls, fixtureUnits: value.units }));
      },
      artifact: key => readPilotJson<BackfillResponse>(join(output, 'artifacts', `${key}.json`)),
      putArtifact: (key, response) => atomicPilotJson(join(output, 'artifacts', `${key}.json`), response),
      request: async r => fixture.responses[backfillRequestKey(r)] ?? { kind: 'missing', reason:
        r.kind === 'header' ? 'header_unavailable' : r.kind === 'boundary' ? 'boundary_unavailable' : 'range_unavailable' },
    }, candidate, owner);
    await atomicPilotJson(join(output, 'report.json'), { ...result,
      pricing: { kind: 'fixture_arithmetic_only', unitNanoUsd: m.budget.unitNanoUsd, weights: m.budget.weights },
      actualLiveRequestCalls: 0, actualLiveRequestUnits: 0, actualPaidNanoUsd: '0',
      process: { checkpoint: 'checkpoint.json', artifacts: 'artifacts', logEvent: 'selective_backfill_checkpoint',
        nextAction: result.status === 'complete' ? 'review_fixture_tape_then_prepare_verified_source_and_owner_resource_decision' :
          'inspect_named_gap_or_unconfirmed_attempt_before_resuming_same_source_candidate' } });
    return result.status === 'failed' ? 1 : result.status === 'stopped' ? 2 : 0;
  } finally {
    process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
    await rm(lock, { recursive: true });
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  selectiveBackfillMain(process.argv.slice(2)).then(code => { process.exitCode = code; }).catch(() => {
    console.error('Selective backfill halted; inspect fixture, manifest and checkpoint.'); process.exitCode = 1;
  });
}
