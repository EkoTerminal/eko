import pino from 'pino';
import { z } from 'zod';
import { openDb, type DbHandle } from '../../server/src/db/client.js';
import { HarnessService } from '../../server/src/harness/service.js';
import { EntitlementsService } from '../../server/src/harness/entitlements.js';
import { FileJournalDestructionLedger } from '../../../packages/db/src/crypto/destruction.js';
import { buildMcpApp } from './app.js';
import { SqlRateLimits } from './limits.js';
import { ToolRegistry } from './tools.js';
import { pruneOAuthDiscovery } from './oauth.js';

const optional = <T extends z.ZodType>(schema: T) => z.preprocess(v => v === '' ? undefined : v, schema.optional());
export function mcpConfig(env: NodeJS.ProcessEnv) {
  const parsed = z.object({
    NODE_ENV: z.enum(['test', 'development', 'production']).default('development'),
    HOST: z.string().default('0.0.0.0'), PORT: z.coerce.number().int().min(1).max(65535).default(8710),
    DATABASE_URL: optional(z.url().refine(v => ['postgres:', 'postgresql:'].includes(new URL(v).protocol))),
    PGLITE_DIR: z.string().default('.data/pglite'), HARNESS_KEY_PEPPER: z.string().min(32),
    JOURNAL_TOMBSTONE_PATH: optional(z.string().min(1)),
    MCP_PUBLIC_URL: z.url(), MCP_OAUTH_ENABLED: z.enum(['false', '0']).default('false'),
    PUBLIC_ORIGIN: z.string().default(''),
    OAUTH_ISSUER: optional(z.url()),
    OAUTH_REDIRECT_ALLOWLIST: z.string().default('["https://claude.ai/api/mcp/auth_callback"]')
      .transform((value, ctx) => {
        try { return z.array(z.url()).min(1).max(100).parse(JSON.parse(value)); }
        catch { ctx.addIssue({ code: 'custom', message: 'Invalid redirect allowlist' }); return z.NEVER; }
      }),
    LAUNCH_WEEK_AGENT_LIMIT: optional(z.coerce.number().int().nonnegative()),
    FEE_ACTIVE_FROM: optional(z.iso.datetime({ offset: true })), TIERS_ACTIVE_FROM: optional(z.iso.datetime({ offset: true })),
  }).safeParse(env);
  if (!parsed.success) throw new Error('Invalid MCP environment');
  if (parsed.data.NODE_ENV === 'production' && !parsed.data.DATABASE_URL) throw new Error('MCP requires Postgres in production');
  return parsed.data;
}

export const mcpLogger = (stream?: pino.DestinationStream) => pino({
  level: 'info', base: undefined,
  redact: { paths: ['req.headers.authorization', 'req.headers.cookie', 'headers.authorization', 'headers.cookie'], censor: '[redacted]' },
}, stream);

/** No chain/model clients, workers or migrations start here. OAuth stays inactive until 099. */
export async function createMcpRuntime(env: NodeJS.ProcessEnv, tools = new ToolRegistry(),
  open: typeof openDb = openDb) {
  const cfg = mcpConfig(env);
  const handle: DbHandle = await open({ databaseUrl: cfg.DATABASE_URL, pgliteDir: cfg.PGLITE_DIR });
  let prune: NodeJS.Timeout | undefined;
  try {
    const destruction = cfg.JOURNAL_TOMBSTONE_PATH ? new FileJournalDestructionLedger(cfg.JOURNAL_TOMBSTONE_PATH) : undefined;
    const auth = new HarnessService(handle.db, cfg.HARNESS_KEY_PEPPER, undefined,
      destruction ? accountId => !!destruction.destroyedAt(accountId) : undefined);
    const entitlements = new EntitlementsService(cfg);
    const limits = new SqlRateLimits(handle.chain.sql, cfg.HARNESS_KEY_PEPPER);
    // Fail startup if the separately applied API migration is absent.
    await limits.prune();
    await pruneOAuthDiscovery(handle.chain);
    const app = buildMcpApp({ authenticate: key => auth.authenticate(key), entitlements: () => entitlements.get(),
      limits, tools, publicUrl: cfg.MCP_PUBLIC_URL,
      allowedOrigins: cfg.PUBLIC_ORIGIN.split(',').map(v => v.trim()).filter(Boolean),
      close: async () => { if (prune) clearInterval(prune); await handle.close(); },
    }, { loggerInstance: mcpLogger() });
    // Deliberately omit oauth from buildMcpApp: 098 consent + 099 token lifecycle and
    // real-connector acceptance are required before discovery advertises a working connector.
    prune = setInterval(() => {
      void Promise.all([limits.prune(), pruneOAuthDiscovery(handle.chain)]).catch(() => app.log.warn('MCP state cleanup unavailable'));
    }, 60_000);
    prune.unref();
    return { app, host: cfg.HOST, port: cfg.PORT };
  } catch (error) { if (prune) clearInterval(prune); await handle.close(); throw error; }
}

/** Signals during startup are remembered; close drains requests and releases the DB. */
export async function runMcpProcess(start = () => createMcpRuntime(process.env), signals: {
  on(event: string, listener: () => void): unknown;
  removeListener(event: string, listener: () => void): unknown;
} = process) {
  let stopped = false;
  let runtime: Awaited<ReturnType<typeof createMcpRuntime>> | undefined;
  let resolveStop!: () => void;
  const stopRequested = new Promise<void>(resolve => { resolveStop = resolve; });
  const stop = () => { stopped = true; resolveStop(); };
  signals.on('SIGINT', stop); signals.on('SIGTERM', stop);
  let force: NodeJS.Timeout | undefined;
  try {
    runtime = await start();
    if (!stopped) {
      await runtime.app.listen({ host: runtime.host, port: runtime.port });
      runtime.app.log.info('EKO MCP ready');
    }
    await stopRequested;
    runtime.app.log.info('shutting down MCP');
    force = setTimeout(() => { process.exit(1); }, 10_000); force.unref();
    await runtime.app.close();
  } catch {
    await runtime?.app.close().catch(() => {});
    throw new Error('MCP startup or shutdown failed (details withheld)');
  } finally {
    if (force) clearTimeout(force);
    signals.removeListener('SIGINT', stop); signals.removeListener('SIGTERM', stop);
  }
}
