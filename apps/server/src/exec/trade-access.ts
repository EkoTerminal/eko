import { createHash } from 'node:crypto';
import { loadRegistry, type AddressRegistry } from '@eko/chain';
import type { ErrorCode, GuardCheck, TradeQuote } from '@eko/shared';
import { eq } from 'drizzle-orm';
import type { Config } from '../config.js';
import type { Db } from '../db/client.js';
import { auditLog, tradingAllowlist } from '../db/schema.js';
import type { FlagService } from '../flags/service.js';

export type AllowlistRow = typeof tradingAllowlist.$inferSelect;
export class TradeAccessError extends Error {
  constructor(readonly code: ErrorCode, message: string) { super(message); }
}

/** Access only. Route, sanctions and mandatory Guard checks keep their own ownership. */
export class TradeAccessService {
  constructor(
    private readonly cfg: Config,
    private readonly flags: FlagService,
    private readonly lookup: (wallet: string) => Promise<AllowlistRow | undefined>,
    private readonly clock: () => number = Date.now,
    private readonly registry: AddressRegistry = loadRegistry(),
  ) {}

  static fromDb(cfg: Config, flags: FlagService, db: Db): TradeAccessService {
    return new TradeAccessService(cfg, flags, async wallet => (await db.select().from(tradingAllowlist).where(eq(tradingAllowlist.wallet, wallet)))[0]);
  }

  async liveEnabled(): Promise<boolean> {
    return this.cfg.LIVE_TRADING_ENABLED && await this.flags.isOpsOn('trading_live');
  }

  async cap(wallet?: string | null): Promise<number> {
    const row = this.cfg.TRADING_ALLOWLIST_ONLY && wallet ? await this.lookup(wallet.toLowerCase()) : undefined;
    return this.capFor(row);
  }

  private capFor(row?: AllowlistRow): number {
    let cap = 0;
    if (this.cfg.TRADING_ALLOWLIST_ONLY) {
      cap = row ? Math.min(row.capUsd, this.cfg.tradeCaps.beta.defaultCapUsd[row.role]) : Math.max(...Object.values(this.cfg.tradeCaps.beta.defaultCapUsd));
    } else if (this.cfg.TRADE_CAPS_FROM) {
      const hours = (this.clock() - Date.parse(this.cfg.TRADE_CAPS_FROM)) / 3_600_000;
      for (const step of this.cfg.tradeCaps.public) if (hours >= step.afterHours) cap = step.perTradeUsd;
    }
    return Number.isFinite(cap) && cap >= 0 ? Math.min(cap, this.cfg.TRADE_MAX_USD ?? Infinity) : 0;
  }

  verifiedTargets() {
    // Only the accepted v3 wiring is exposed. Code-only Pons and unaccepted v4 stay unavailable.
    const entry = this.registry.data.uniswapV3.swapRouter02;
    const routers = entry.verified && entry.check === 'router02_wiring' && entry.address !== 'TODO' ? [entry.address] : [];
    return { routers, spenders: [...routers] };
  }

  async refusal(wallet: string | null | undefined, amountUsd: number, demo = false): Promise<TradeAccessError | null> {
    if (demo) return new TradeAccessError('forbidden', 'Demo sessions cannot trade');
    if (!await this.liveEnabled()) return new TradeAccessError('trading_paused', 'Live trading paused');
    const row = this.cfg.TRADING_ALLOWLIST_ONLY && wallet ? await this.lookup(wallet.toLowerCase()) : undefined;
    if (this.cfg.TRADING_ALLOWLIST_ONLY && !row)
      return new TradeAccessError('not_allowlisted', 'Wallet is not on the trading allowlist');
    const cap = this.capFor(row);
    if (!Number.isFinite(amountUsd) || amountUsd <= 0 || cap <= 0 || amountUsd > cap)
      return new TradeAccessError('trade_cap_exceeded', 'Trade exceeds the effective per-trade cap');
    return null;
  }

  async assertOrder(wallet: string | null | undefined, amountUsd: number, demo = false): Promise<void> {
    const refusal = await this.refusal(wallet, amountUsd, demo);
    if (refusal) throw refusal;
  }

  /** Packet 075 can preserve quote/verdict/fee data while removing binding on access refusal. */
  async informationalQuote(quote: TradeQuote, demo = false): Promise<TradeQuote> {
    const refusal = await this.refusal(quote.account, quote.amountUsd, demo);
    if (!refusal) return quote;
    const check: GuardCheck = { code: refusal.code, status: 'refuse', label: refusal.message };
    return { ...quote, binding: false, guard: { decision: 'refuse', checks: [...quote.guard.checks, check] } };
  }
}

/** Snapshot every process load/config release in existing append-only audit storage. No secrets or paths. */
export async function auditTradeConfig(db: Db, cfg: Config) {
  const data = { caps: cfg.tradeCaps, from: cfg.TRADE_CAPS_FROM ?? null, ceiling: cfg.TRADE_MAX_USD ?? null,
    allowlistOnly: cfg.TRADING_ALLOWLIST_ONLY, liveCeiling: cfg.LIVE_TRADING_ENABLED };
  await db.insert(auditLog).values({ action: 'trading.config_loaded', data: { ...data, hash: createHash('sha256').update(JSON.stringify(data)).digest('hex') } });
}
