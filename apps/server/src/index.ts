import { buildApp } from './app.js';
import { startDev } from './dev.js';
import { loadConfig } from './config.js';
import { reportError } from './obs/errors.js';
import { logger } from './obs/logger.js';
import { workerSecurityCollectors } from './obs/security-worker.js';
import { runtimeIdentity } from './build-identity.js';

const cfg = loadConfig();
const identity = runtimeIdentity(cfg);
if (!process.env.SESSION_SECRET) logger.warn('SESSION_SECRET not set — using a generated development secret stored under .data/ (never do this in production).');

let closeApp: (() => Promise<void>) | undefined;
let startupResolve!: () => void;
const startupReady = new Promise<void>(resolve => { startupResolve = resolve; });
let shuttingDown = false;
const shutdown = async (sig: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ sig }, 'shutting down');
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  await startupReady;
  await closeApp?.().catch((err) => reportError(err, { where: 'shutdown' }));
  process.exit(sig === 'dev worker halted' ? 1 : 0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('unhandledRejection', (err) => reportError(err, { where: 'unhandledRejection' }));
process.on('uncaughtException', (err) => reportError(err, { where: 'uncaughtException' }));

const workerOnly = cfg.APP_ROLE === 'worker';
const { app, ctx, close } = await buildApp(cfg, workerOnly ? { startBackground: false } : {});
const securityCollectors = workerOnly ? workerSecurityCollectors(ctx) : undefined;
if (workerOnly) { ctx.exec.start(); ctx.sanctionsWorker.start(); ctx.retentionWorker.start(); }
securityCollectors?.start();
let dev: Awaited<ReturnType<typeof startDev>> | undefined;
try { dev = cfg.APP_ROLE === 'dev' ? await startDev(ctx) : undefined; } catch(error) { await close(); startupResolve(); throw error; }
closeApp = async () => { try { await securityCollectors?.stop(); await dev?.close(); } finally { await close(); } }; startupResolve();
void dev?.done.catch(error => { reportError(error, { where:'dev role' }); void shutdown('dev worker halted'); });
if (!shuttingDown && !workerOnly) await app.listen({ host: cfg.HOST, port: cfg.PORT });
logger.info(
  {
    port: cfg.PORT,
    identity,
    db: ctx.dbh.driver,
    marketData: ctx.market.source,
    simulated: ctx.market.simulated,
    liveTrading: cfg.LIVE_TRADING_ENABLED,
    aiProviders: ctx.providers.healthList().filter((p) => p.configured).map((p) => p.id),
  },
  workerOnly ? 'EKO worker ready' : 'EKO server ready',
);
