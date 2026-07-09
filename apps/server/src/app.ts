import { FileJournalDestructionLedger, migrate, migrateEngines, PostgresBus, ReceiptApiStore } from '@eko/db';
import { ReadStore } from './read/store.js';
import { readServices } from './http/v1/reads.js';
import { ReadLive } from './read/live.js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import websocket from '@fastify/websocket';
import Fastify, { type FastifyInstance } from 'fastify';
import { MARKETS, type ServerMessage, type SystemHealth } from '@eko/shared';
import { InferenceBudget } from './ai/budget.js';
import { ProviderRegistry } from './ai/registry.js';
import type { Config } from './config.js';
import { openDb, runMigrations, type DbHandle } from './db/client.js';
import { latencySamples } from './db/schema.js';
import { ChainClients, UniswapV3Adapter } from './exec/chain.js';
import { PortfolioService } from './exec/portfolio.js';
import { SanctionsService, SanctionsWorker } from './sanctions/service.js';
import { QuoteStore } from './exec/quotes.js';
import { ExecutionService } from './exec/service.js';
import { JournalService } from './harness/journal.js';
import { PointsService } from './points/service.js';
import { HarnessService } from './harness/service.js';
import { auditTradeConfig, TradeAccessService } from './exec/trade-access.js';
import { AuthService } from './http/auth.js';
import { registerRoutes } from './http/routes.js';
import { FlagService } from './flags/service.js';
import { guardReadRoutes } from './http/v2-guard.js';
import { registerV1 } from './http/v1/index.js';
import { fixtureRoutes } from './http/v1/fixtures.js';
import { journalFixtureProducer } from './fixtures/producers.js';
import { installDemoGuard } from './http/v1/demo.js';
import { notFound } from './http/v1/helpers.js';
import { DemoFeed } from './market/demoFeed.js';
import { storedFeed } from './market/stored.js';
import { MarketDataService } from './market/service.js';
import type { Feed } from './market/types.js';
import { initErrorReporting, reportError } from './obs/errors.js';
import { logger } from './obs/logger.js';
import { metrics } from './obs/metrics.js';
import { LaunchMonitor, type Measurement } from './obs/launch.js';
import { IncidentService, sentryIncidentSink, type AlertSink } from './obs/incidents.js';
import { launchMonitoringRoutes } from './http/launch-monitoring.js';
import { QuantService } from './quant/service.js';
import { Hub } from './ws/hub.js';

export const VERSION = '0.1.0';

export interface Ctx {
  cfg: Config;
  flags: FlagService;
  tradeAccess: TradeAccessService;
  sanctions: SanctionsService;
  sanctionsWorker: SanctionsWorker;
  dbh: DbHandle;
  reads: ReturnType<typeof readServices>;
  hub: Hub;
  market: MarketDataService;
  providers: ProviderRegistry;
  budget: InferenceBudget;
  chains: ChainClients;
  exec: ExecutionService;
  portfolio: PortfolioService;
  quant: QuantService;
  auth: AuthService;
  harness: HarnessService;
  journal: JournalService;
  points: PointsService;
  receipts: ReceiptApiStore;
  demoFeed: DemoFeed | null;
  monitoring: LaunchMonitor;
  incidents: IncidentService;
  health(): SystemHealth;
}

export async function buildApp(cfg: Config, opts: { feed?: Feed; startBackground?: boolean; alertSinks?: { page?: AlertSink; sentry?: AlertSink } } = {}): Promise<{ app: FastifyInstance; ctx: Ctx; close(): Promise<void> }> {
  initErrorReporting(cfg.SENTRY_DSN, cfg.NODE_ENV);
  const dbh = await openDb({ databaseUrl: cfg.DATABASE_URL, pgliteDir: cfg.PGLITE_DIR });
  await runMigrations(dbh);
  await migrate(dbh.chain);
  await migrateEngines(dbh.chain);
  const points = new PointsService(dbh.chain,cfg.POINTS_RATES,cfg.POINTS_ACTIVE_FROM);
  const reads = readServices(new ReadStore(dbh.chain),points);
  await reads.store.refreshModels();
  const db = dbh.db;
  const flags = FlagService.fromDb(db, cfg.FLAGS);
  await flags.all();
  const tradeAccess = TradeAccessService.fromDb(cfg, flags, db);
  await auditTradeConfig(db, cfg);
  const sanctions = new SanctionsService(dbh.chain);
  const sanctionsWorker = new SanctionsWorker(dbh.chain, cfg.OFAC_SDN_URL, undefined, Date.now,
    failed => logger[failed ? 'warn' : 'info']({ failed }, 'Sanctions dataset refresh'));


  const monitoring = new LaunchMonitor(dbh.chain.sql);
  const incidents = new IncidentService(db, opts.alertSinks ?? (cfg.SENTRY_DSN ? { sentry: sentryIncidentSink } : {}));
  const launchMetricMap: Record<string, Measurement['metric']> = {
    'quote.latency_ms': 'quote_ms', 'harness.preflight_ms': 'preflight_ms', 'simulation.failure': 'simulation_failure',
    'scan.pair_to_complete_verdict_ms': 'pair_to_complete_verdict_ms', 'queue.completion_ms': 'queue_completion_ms',
  };

  // Persist latency samples in small batches so measurements survive restarts.
  const sampleBuf: (typeof latencySamples.$inferInsert)[] = [];
  metrics.setSink((metric, valueMs, labels, at) => {
    sampleBuf.push({ metric, valueMs, labels, at });
    const launchMetric = launchMetricMap[metric];
    // Paper quotes are fixtures, never launch latency evidence.
    if (launchMetric && (!labels.mode || labels.mode === 'live')) void monitoring.record({ metric: launchMetric, value: valueMs }).catch(() => reportError(new Error('launch_measurement_write_failed')));
    if (sampleBuf.length > 5000) sampleBuf.splice(0, sampleBuf.length - 5000);
  });
  const flushSamples = setInterval(() => {
    if (!sampleBuf.length) return;
    const batch = sampleBuf.splice(0, sampleBuf.length);
    db.insert(latencySamples).values(batch).catch((err) => reportError(err, { where: 'latency flush' }));
  }, 10_000);

  const hub = new Hub();
  const demoFeed = opts.feed instanceof DemoFeed ? opts.feed : cfg.MARKET_DATA_SOURCE === 'demo' && !opts.feed ? new DemoFeed(cfg.DEMO_SEED) : null;
  const feed: Feed = opts.feed ?? demoFeed ?? storedFeed;
  const market = new MarketDataService(feed, db, MARKETS);
  const providers = new ProviderRegistry(cfg);
  const budget = new InferenceBudget(db, cfg.AI_DAILY_BUDGET_USD, cfg.AI_MAX_CALLS_PER_BOT_HOUR);
  const chains = new ChainClients({ mainnet: cfg.RH_MAINNET_RPC_URL, testnet: cfg.RH_TESTNET_RPC_URL }, cfg, dbh.rpcUsage);
  chains.meter.start();
  const receipts = new ReceiptApiStore(dbh.chain, cfg.RECEIPTS_REGISTRY_ADDRESS, chains.get('robinhood-mainnet'));
  const portfolio = new PortfolioService(db);
  const quotes = new QuoteStore();
  const auth = new AuthService(db, cfg);
  const destruction = cfg.JOURNAL_TOMBSTONE_PATH ? new FileJournalDestructionLedger(cfg.JOURNAL_TOMBSTONE_PATH) : undefined;
  const journal = new JournalService(dbh.chain, destruction, cfg.JOURNAL_KEK && cfg.JOURNAL_KEK_ID
    ? { kek: Buffer.from(cfg.JOURNAL_KEK, 'hex'), id: cfg.JOURNAL_KEK_ID } : undefined, undefined, undefined, points);
  const harness = new HarnessService(db, cfg.HARNESS_KEY_PEPPER, (accountId, agent) => hub.publishAgent(accountId, agent),
    destruction ? accountId => !!destruction.destroyedAt(accountId) : undefined);

  let lastHealthJson = '';
  const health = (): SystemHealth => ({
    marketData: market.health(),
    providers: providers.healthList(),
    networks: chains.healthList(),
    worker: { running: cfg.RUN_WORKER && opts.startBackground !== false, lastTickAt: null, activeBots: 0 },
  });
  const pushHealth = () => {
    const h = health();
    const j = JSON.stringify({ ...h, worker: { ...h.worker, lastTickAt: null } });
    if (j === lastHealthJson) return;
    lastHealthJson = j;
    hub.broadcast({ type: 'health', health: h });
  };

  const ethUsd = () => market.lastPrice('ETH-USD')?.price ?? null;
  const exec = new ExecutionService(
    db,
    market,
    portfolio,
    quotes,
    {
      testnet: new UniswapV3Adapter(chains, 'robinhood-testnet', ethUsd),
      live: new UniswapV3Adapter(chains, 'robinhood-mainnet', ethUsd),
    },
    { liveEnabled: cfg.LIVE_TRADING_ENABLED, paperFeeBps: 10, tradeAccess, sanctions },
    {
      onOrder: (acc, o) => hub.toAccount(acc, { type: 'order', order: o }),
      onPortfolio: (acc, mode) => hub.toAccount(acc, { type: 'portfolio', mode }),
    },
  );
  const quant = new QuantService(market);
  const ctx: Ctx = { cfg, flags, tradeAccess, sanctions, sanctionsWorker, dbh, reads, hub, market, providers, budget, chains, exec, portfolio, quant, auth, harness, journal, points, receipts, demoFeed, health, monitoring, incidents };

  // Market data → WebSocket, throttled to ~4 Hz per stream (closed bars always go out immediately).
  const pendingCandles = new Map<string, Extract<ServerMessage, { type: 'candle' }>>();
  const pendingTickers = new Map<string, Extract<ServerMessage, { type: 'ticker' }>>();
  const pendingBooks = new Map<string, Extract<ServerMessage, { type: 'book' }>>();
  market.on('candle', (m, tf, c, closed) => {
    const msg = { type: 'candle' as const, market: m, timeframe: tf, candle: { ...c }, closed };
    if (closed) hub.broadcastCandle(msg);
    else pendingCandles.set(`${m}|${tf}`, msg);
  });
  market.on('ticker', (t) => pendingTickers.set(t.market, { type: 'ticker', ticker: t }));
  market.on('book', (b) => pendingBooks.set(b.market, { type: 'book', book: b }));
  hub.onSubscriptionsChanged = () => market.watchBooks([...hub.watchedMarkets()]);
  market.on('health', () => pushHealth());
  providers.onHealthChange = () => pushHealth();
  const flush = setInterval(() => {
    for (const m of pendingCandles.values()) hub.broadcastCandle(m);
    pendingCandles.clear();
    for (const m of pendingTickers.values()) hub.broadcast(m, true);
    pendingTickers.clear();
    for (const m of pendingBooks.values()) hub.broadcastBook(m);
    pendingBooks.clear();
  }, 250);
  const healthTimer = setInterval(() => {
    if (cfg.LEGACY_API && (cfg.RUN_WORKER || cfg.LIVE_TRADING_ENABLED)) void chains.checkHealth().then(pushHealth);
  }, 20_000);
  const heartbeat = setInterval(() => hub.broadcast({ type: 'health', health: health() }), 5_000);

  // ─────────────── HTTP ───────────────
  const app = Fastify({ logger: false, trustProxy: true, bodyLimit: 256 * 1024, routerOptions: { maxParamLength: 4096 } });
  await app.register(cookie, { secret: cfg.sessionSecret });
  await app.register(cors, { origin: cfg.origins, credentials: true });
  await app.register(rateLimit, {
    global: true,
    max: 600,
    timeWindow: '1 minute',
    keyGenerator: (req) => auth.readCookie(req) ?? req.ip,
    allowList: (req) => req.url.startsWith('/assets/'),
  });
  await app.register(websocket, { options: { maxPayload: 64 * 1024 } });
  app.decorateRequest('account', null);
  app.setErrorHandler((err, req, reply) => {
    const e = err as Error & { statusCode?: number; code?: string; validation?: unknown };
    const status = e.statusCode ?? 500;
    if (status >= 500) reportError(err, { url: req.url, method: req.method });
    reply.status(status).send({ error: e.code && typeof e.code === 'string' && !e.code.startsWith('FST_') ? e.code : status >= 500 ? 'internal_error' : 'bad_request', message: status >= 500 ? 'Internal error' : e.message });
  });
  installDemoGuard(app, cfg);
  await registerV1(app, cfg, flags, () => chains.meter.usage(), reads, { auth, db, client: chains.get('robinhood-mainnet') }, chains.get('robinhood-mainnet'), { auth, harness }, { auth, journal }, receipts);
  await fixtureRoutes(app, cfg, flags, cfg.JOURNAL_KEK && cfg.JOURNAL_KEK_ID && cfg.JOURNAL_TOMBSTONE_PATH
    ? { journal: journalFixtureProducer(journal) } : {}, auth);
  const live = new ReadLive(reads, hub);
  await live.start(cfg.DATABASE_URL ? new PostgresBus(cfg.DATABASE_URL) : dbh.chain.bus);
  await guardReadRoutes(app,reads.guard,reads);
  app.get('/v2/ws', { websocket: true }, (socket) => { hub.addV2(socket,async coin=>reads.guard.card(coin)); });
  app.get('/v1/ws', { websocket: true, preValidation: async (req) => { req.account = await auth.fromToken(auth.readCookie(req)); } }, (socket, req) => { hub.addV1(socket, req.account?.kind === 'wallet' ? req.account.id : undefined); });
  await registerRoutes(app, ctx);
  await launchMonitoringRoutes(app, ctx);

  let serveSpa = false;
  if (cfg.SERVE_WEB) {
    const dist = resolve(process.cwd(), cfg.WEB_DIST_DIR);
    if (existsSync(dist)) {
      await app.register(fastifyStatic, { root: dist, prefix: '/', wildcard: false, maxAge: '1h', immutable: false });
      serveSpa = true;
    } else logger.warn({ dist }, 'SERVE_WEB set but web build not found');
  }
  app.setNotFoundHandler((req, reply) => {
    if (!serveSpa || req.url.startsWith('/v1') || req.url.startsWith('/api') || req.url.startsWith('/ws') || req.url.startsWith('/dev')) return notFound(reply);
    return reply.sendFile('index.html');
  });

  if (opts.startBackground !== false) {
    reads.store.start();
    await market.start();
    if (cfg.RUN_WORKER) {
      exec.start();
      if (cfg.APP_ROLE === 'worker' || cfg.APP_ROLE === 'dev') sanctionsWorker.start();
    } else logger.info('RUN_WORKER=false — API-only process (no order reconciler)');
    if (cfg.LEGACY_API && (cfg.RUN_WORKER || cfg.LIVE_TRADING_ENABLED)) void chains.checkHealth().then(pushHealth);
  }

  return {
    app,
    ctx,
    async close() {
      clearInterval(flush);
      clearInterval(healthTimer);
      clearInterval(heartbeat);
      clearInterval(flushSamples);
      await live.close();
      await reads.store.close();
      exec.stop();
      await sanctionsWorker.stop();
      market.stop();
      hub.closeAll();
      await app.close();
      try { await chains.meter.close(); } finally { await dbh.close(); }
    },
  };
}
