import { parseYaml, rpcConfig, type RpcEnv } from '@eko/chain';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { AddressSchema } from '@eko/shared';
import { parseFlagOverride } from './flags/service.js';
import { parsePointsRates } from './points/config.js';

export const TradeCapsSchema = z.strictObject({
  beta: z.strictObject({ defaultCapUsd: z.strictObject({ team: z.number().positive().max(25), beta_user: z.number().positive().max(100) }) }),
  public: z.array(z.strictObject({ afterHours: z.number().nonnegative(), perTradeUsd: z.number().positive().max(1000) })).min(1)
    .superRefine((steps, ctx) => {
      if (steps[0]?.afterHours !== 0 || steps.some((step, i) => i > 0 && step.afterHours <= steps[i - 1]!.afterHours) || steps.some(step => step.afterHours < 72 && step.perTradeUsd > 250))
        ctx.addIssue({ code: 'custom', message: 'Ordered schedule must start at zero and hold at most $250 for the first 72 hours' });
    }),
  // TODO(spec): Daily caps require an atomic daily spend ledger; refuse non-null until that path exists.
  dailyPerWalletUsd: z.null(),
});
export type TradeCaps = z.infer<typeof TradeCapsSchema>;
export function parseTradeCaps(text: string): TradeCaps { return TradeCapsSchema.parse(parseYaml(text)); }

const bool = z
  .enum(['true', 'false', '1', '0', ''])
  .optional()
  .transform((v) => v === 'true' || v === '1');

const optionalValue = <T extends z.ZodType>(schema: T) => z.preprocess((v) => v === '' ? undefined : v, schema.optional());
// TODO(spec): Deployment addresses are unset locally; zero is an inert placeholder, never a fee target.
const address = z.preprocess((v) => v === '' ? undefined : v, AddressSchema.default('0x0000000000000000000000000000000000000000'));

const EnvSchema = z.object({
  APP_ROLE: z.enum(['api', 'worker', 'dev']).default('api'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().default(8710),
  /** Origin of the web app (CORS + SIWE domain). Comma-separate multiple origins. */
  PUBLIC_ORIGIN: z.string().default('http://localhost:5180'),
  /** Shared cookie scope for app/api/mcp; inferred from PUBLIC_ORIGIN when unset. */
  SESSION_COOKIE_DOMAIN: optionalValue(z.string().regex(/^\.?[a-zA-Z0-9.-]+$/)),
  /** Unset launch quotas remain unavailable until a launch limit is approved. */
  LAUNCH_WEEK_AGENT_LIMIT: optionalValue(z.coerce.number().int().nonnegative()),
  POINTS_ACTIVE_FROM: optionalValue(z.iso.datetime({ offset: true })),
  POINTS_RATES: z.string().default('{}').transform(parsePointsRates),
  DATABASE_URL: z.string().optional(),
  PGLITE_DIR: z.string().default('.data/pglite'),
  SESSION_SECRET: z.string().optional(),
  JOURNAL_KEK: optionalValue(z.string().regex(/^[0-9a-fA-F]{64}$/)),
  JOURNAL_KEK_ID: optionalValue(z.string().min(1)),
  JOURNAL_TOMBSTONE_PATH: optionalValue(z.string().min(1)),
  HARNESS_KEY_PEPPER: optionalValue(z.string().min(32)),
  FLAGS: z.string().default(''),
  DEMO_SECRET: optionalValue(z.string().min(32)),
  LEGACY_API: z.enum(['true', 'false', '1', '0']).default('true').transform((v) => v === 'true' || v === '1'),
  // TODO(spec): Retained for the §2.4 env table; the removed analyst feed has no consumers.
  LEGACY_SIGNALS: bool,
  TIERS_ACTIVE_FROM: optionalValue(z.iso.datetime({ offset: true })),
  FEE_ACTIVE_FROM: optionalValue(z.iso.datetime({ offset: true })),
  FEE_BPS_DEFAULT: z.coerce.number().int().min(0).max(10_000).default(50),
  TRADE_MAX_USD: optionalValue(z.coerce.number().positive()),
  TRADE_CAPS_FILE: optionalValue(z.string()),
  TRADE_CAPS_FROM: optionalValue(z.iso.datetime({ offset: true })),
  TRADING_ALLOWLIST_ONLY: z.enum(['true', 'false', '1', '0']).default('true').transform(v => v === 'true' || v === '1'),
  BURN_WALLET_ADDRESS: address,
  RECEIPTS_REGISTRY_ADDRESS: address,
  DEV_FEE_WALLET: address,
  MARKET_DATA_SOURCE: z.enum(['onchain', 'demo']).optional(),
  DEMO_SEED: z.coerce.number().int().default(42),
  ENABLE_DEV_ROUTES: bool,
  SERVE_WEB: bool,
  /** Run the order reconciler in this process. Exactly one process should. */
  RUN_WORKER: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  WEB_DIST_DIR: z.string().default('../web/dist'),
  // TODO(spec): §2.4 leaves the OFAC URL/format unverified; configure a verified Treasury SDN XML source before trading.
  OFAC_SDN_URL: optionalValue(z.url().refine(value => {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.hash &&
      (url.hostname === 'treasury.gov' || url.hostname.endsWith('.treasury.gov'));
  }, 'OFAC source must be a public Treasury HTTPS URL')),
  LOG_LEVEL: z.string().default('info'),
  SENTRY_DSN: z.string().optional(),

  // AI providers — each is enabled only when its key is present.
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  XAI_MODEL: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_MODEL: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  MISTRAL_MODEL: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  /**
   * One OpenAI-compatible gateway key (PPQ.ai by default) serves every provider that has no
   * direct key. `pnpm setup:ai` writes these two values.
   */
  GATEWAY_BASE_URL: z.preprocess((v) => (v === '' ? undefined : v), z.string().url().default('https://api.ppq.ai')),
  GATEWAY_API_KEY: z.string().optional(),
  GATEWAY_MODEL_ANTHROPIC: z.string().optional(),
  GATEWAY_MODEL_OPENAI: z.string().optional(),
  GATEWAY_MODEL_GOOGLE: z.string().optional(),
  GATEWAY_MODEL_XAI: z.string().optional(),
  GATEWAY_MODEL_DEEPSEEK: z.string().optional(),
  GATEWAY_MODEL_MISTRAL: z.string().optional(),
  GATEWAY_MODEL_GROQ: z.string().optional(),
  /** Hard ceiling on estimated AI spend per UTC day across all providers. */
  AI_DAILY_BUDGET_USD: z.coerce.number().nonnegative().default(2),
  /** Hard ceiling on model calls per bot per hour. */
  AI_MAX_CALLS_PER_BOT_HOUR: z.coerce.number().int().nonnegative().default(12),
  AI_TIMEOUT_MS: z.coerce.number().int().default(25_000),

  // Robinhood Chain
  RPC_HTTP_URL: optionalValue(z.url()),
  RPC_WS_URL: optionalValue(z.url()),
  RPC_PUBLIC_HTTP_URL: optionalValue(z.url()),
  RPC_PAID_MAX_RPM: z.string().optional(),
  RPC_PUBLIC_MAX_RPM: z.string().optional(),
  RPC_PAID_DAILY_BUDGET: z.string().optional(),
  RPC_SESSION_BUDGET: z.string().optional(),
  RPC_WEIGHTS: z.string().optional(),
  RH_TESTNET_RPC_URL: z.string().optional(),
  RH_MAINNET_RPC_URL: z.string().optional(),
  /** Mainnet execution stays disabled unless this is explicitly true. */
  LIVE_TRADING_ENABLED: bool,
  ADMIN_WALLETS: z.string().default(''),
});

export type Config = Omit<z.infer<typeof EnvSchema>, 'MARKET_DATA_SOURCE'> & {
  MARKET_DATA_SOURCE: 'onchain' | 'demo';
  sessionSecret: string;
  origins: string[];
  adminWallets: Set<string>;
  tradeCaps: TradeCaps;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${msg}`);
  }
  const c = { ...parsed.data, MARKET_DATA_SOURCE: parsed.data.MARKET_DATA_SOURCE ?? (parsed.data.NODE_ENV === 'production' ? 'onchain' : 'demo') };
  if (c.APP_ROLE === 'dev' && (c.NODE_ENV === 'production' || c.DATABASE_URL)) throw new Error('APP_ROLE=dev is for local PGlite only');
  if (c.NODE_ENV === 'production' && !c.DATABASE_URL?.trim()) throw new Error('DATABASE_URL is required in production; PGlite is for local development and tests');
  if (c.NODE_ENV === 'production' && c.APP_ROLE === 'api' && c.RUN_WORKER) throw new Error('API replicas require RUN_WORKER=false; use APP_ROLE=worker for the reconciler');
  if (c.APP_ROLE === 'worker' && !c.RUN_WORKER) throw new Error('APP_ROLE=worker requires RUN_WORKER=true');
  if (c.APP_ROLE === 'dev' && (!c.RPC_HTTP_URL || !c.RPC_WS_URL)) throw new Error('APP_ROLE=dev requires RPC_HTTP_URL and RPC_WS_URL');
  if (c.NODE_ENV === 'production' && (!c.SESSION_SECRET || c.SESSION_SECRET.length < 32)) {
    throw new Error('SESSION_SECRET (≥32 chars) is required in production');
  }
  rpcConfig(c as RpcEnv);
  const origins = c.PUBLIC_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
  if (!origins.length || origins.some(o => { try { return new URL(o).origin !== o || !/^https?:/.test(o); } catch { return true; } })) {
    throw new Error('PUBLIC_ORIGIN must contain exact HTTP(S) origins');
  }
  const cookieDomain = (c.SESSION_COOKIE_DOMAIN ?? new URL(origins[0]!).hostname.replace(/^(app|api|mcp)\./, '')).replace(/^\./, '').toLowerCase();
  if ((c.NODE_ENV === 'production' || c.SESSION_COOKIE_DOMAIN) && origins.some(o => { const host = new URL(o).hostname; return host !== cookieDomain && !host.endsWith(`.${cookieDomain}`); })) {
    throw new Error('Session cookie domain must contain every PUBLIC_ORIGIN host');
  }
  parseFlagOverride(c.FLAGS); // Reject unknown flags and ops switches before opening the database.
  if (c.NODE_ENV === 'production' && !c.DEMO_SECRET) {
    throw new Error('DEMO_SECRET (≥32 chars) is required in production');
  }
  if (c.NODE_ENV === 'production' && c.ENABLE_DEV_ROUTES) {
    throw new Error('ENABLE_DEV_ROUTES must not be set in production');
  }
  if (c.NODE_ENV === 'production' && c.LIVE_TRADING_ENABLED && /localhost|127\.0\.0\.1/.test(c.PUBLIC_ORIGIN)) {
    throw new Error('PUBLIC_ORIGIN must be the public https origin of the app when LIVE_TRADING_ENABLED=true (it is the Sign-In With Ethereum domain)');
  }
  // Fees and burns go to the public burn wallet only, never the dev wallet (AGENTS rule 4, BACKEND §12.5).
  const ZERO = '0x0000000000000000000000000000000000000000';
  if (c.BURN_WALLET_ADDRESS !== ZERO && c.BURN_WALLET_ADDRESS.toLowerCase() === c.DEV_FEE_WALLET.toLowerCase()) {
    throw new Error('BURN_WALLET_ADDRESS must not be the dev wallet');
  }
  if (c.NODE_ENV === 'production' && c.BURN_WALLET_ADDRESS === ZERO) {
    throw new Error('BURN_WALLET_ADDRESS is required in production');
  }
  return {
    ...c,
    tradeCaps: parseTradeCaps(readFileSync(c.TRADE_CAPS_FILE ?? new URL(import.meta.url.includes('/dist/') ? './trading-caps.yaml' : '../config/trading-caps.yaml', import.meta.url), 'utf8')),
    sessionSecret: c.SESSION_SECRET ?? devSecret(c.PGLITE_DIR),
    origins,
    adminWallets: new Set(
      c.ADMIN_WALLETS.split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  };
}

/** Development only: a generated secret persisted next to the local database so sessions survive restarts. */
function devSecret(pgliteDir: string): string {
  const file = join(dirname(pgliteDir === ':memory:' ? '.data/x' : pgliteDir), 'dev-session-secret');
  try {
    if (existsSync(file)) return readFileSync(file, 'utf8').trim();
    mkdirSync(dirname(file), { recursive: true });
    const s = randomBytes(32).toString('hex');
    writeFileSync(file, s, { mode: 0o600 });
    return s;
  } catch {
    return randomBytes(32).toString('hex');
  }
}
