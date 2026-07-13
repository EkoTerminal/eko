import type { RpcMeter } from '@eko/chain';
import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance, rpcUsage: () => ReturnType<RpcMeter['usage']>) {
  app.get('/health', async () => ({ ok: true, rpc: await rpcUsage() }));
}
