import type { RpcMeter } from '@eko/chain';
import type { PublicClient } from 'viem';
import type { FastifyInstance } from 'fastify';
import type { Config } from '../../config.js';
import type { FlagService } from '../../flags/service.js';
import { reportError } from '../../obs/errors.js';
import { configRoutes } from './config.js';
import { demoRoutes } from './demo.js';
import { readRoutes, type ReadServices } from './reads.js';
import { healthRoutes } from './health.js';
import { InputError, notFound, sendError } from './helpers.js';
import { accountRoutes, type AccountServices } from './account.js';
import { agentRoutes, type AgentServices } from './agents.js';
import { journalRoutes, type JournalServices } from './journal.js';
import { rpcRoutes } from './rpc.js';
import { TradeAccessService } from '../../exec/trade-access.js';
import { tradeAdminRoutes } from './trade-admin.js';
import type { ReceiptApiStore } from '@eko/db';
import { receiptRoutes } from './receipts.js';

export async function registerV1(app: FastifyInstance, cfg: Config, flags: FlagService, rpcUsage: () => ReturnType<RpcMeter['usage']>, reads?: ReadServices, account?: AccountServices, rpc?: PublicClient, agents?: AgentServices, journal?: JournalServices, receipts?: ReceiptApiStore) {
  const access = account ? TradeAccessService.fromDb(cfg, flags, account.db) : new TradeAccessService(cfg, flags, async () => undefined);
  await app.register(async (v1) => {
    v1.setNotFoundHandler((_req, reply) => notFound(reply));
    v1.setErrorHandler((err, req, reply) => {
      if (err instanceof InputError) return sendError(reply, 'bad_request', err.message);
      const e = err as Error & { statusCode?: number };
      if (e.statusCode === 429) return sendError(reply, 'rate_limited', e.message);
      if (e.statusCode === 403) return sendError(reply, 'forbidden', e.message);
      if (e.statusCode === 401) return sendError(reply, 'wallet_auth_required', e.message);
      if (e.statusCode && e.statusCode < 500) return sendError(reply, 'bad_request', e.message);
      reportError(err, { where: 'v1', method: req.method });
      return sendError(reply, 'internal_error', 'Internal error');
    });
    if (reads) await v1.register(async area => readRoutes(area, reads, account?.auth));
    if (receipts) await v1.register(async area => receiptRoutes(area, receipts));
    if (account) await v1.register(async area => accountRoutes(area, cfg, account));
    if (journal) await v1.register(async area => journalRoutes(area, journal));
    if (agents) await v1.register(async area => agentRoutes(area, cfg, flags, agents));
    if (account) await v1.register(async area => tradeAdminRoutes(area, cfg, account));
    if (rpc) await v1.register(async area => rpcRoutes(area, rpc));
    await v1.register(async area => healthRoutes(area, rpcUsage));
    await v1.register(async (area) => configRoutes(area, cfg, flags, access, account));
    await v1.register(async (area) => demoRoutes(area, cfg));
  }, { prefix: '/v1' });
}
