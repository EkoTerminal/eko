import { PackSchema } from '@eko/shared';
import type { FastifyInstance } from 'fastify';
import generated from '../../../../../harness-packs/generated/packs.json' with { type: 'json' };

export const harnessPacks = generated.map(pack => PackSchema.parse(pack));
/**
 * Register the public no-store pack listing. Keep the connector pack at D0 until accepted OAuth
 * readiness; no authentication, connector activation or generated pack mutation occurs.
 */
export async function packRoutes(app: FastifyInstance) {
  // TODO(spec): Promote the connector only after task 099's accepted OAuth
  // readiness evidence. An environment toggle alone is not readiness.
  app.get('/packs', async (_req, reply) => {
    reply.header('Cache-Control', 'no-store');
    return harnessPacks.map(pack => pack.platform === 'claude_connector' ? { ...pack, stage: 'D0' as const } : pack);
  });
}
