import type { RpcMeter } from '@eko/chain';
import type { FastifyInstance } from 'fastify';
import type { Config } from '../../config.js';
import { runtimeIdentity } from '../../build-identity.js';

/**
 * Register public liveness plus metered RPC usage reporting. No wallet auth or chain probe is
 * required; usage callback failure rejects the request. The additive /build route
 * returns only baked bundle metadata, role and an allowlisted config digest;
 * invalid production image identity prevents route registration.
 * @see {@link ../../../../../SECURITY.md#privileged-powers | Privileged powers}
 * @see {@link ../../../../../docs/security/INVARIANTS.md | Implemented core invariants}
 */
export async function healthRoutes(app: FastifyInstance, rpcUsage: () => ReturnType<RpcMeter['usage']>, cfg: Config) {
  const identity = runtimeIdentity(cfg);
  app.get('/health', async () => ({ ok: true, rpc: await rpcUsage() }));
  // Deployment-only additive endpoint; liveness/RPC health keeps its contract.
  app.get('/build', async (_request, reply) => reply.header('Cache-Control', 'no-store').send(identity));
}
