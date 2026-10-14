import { runRetention, type ChainDb, type RetentionResult } from '@eko/db';
import { RETENTION_RULE_INPUTS } from '@eko/engines';
import { loadRegistry } from '@eko/chain';

export interface RetentionSettings { enabled?: boolean; settleHours?: number; rawDays?: number; ratingDays?: number; dryRun?: boolean; quoteDays?: number; idleTokenDays?: number; pendingPoolDays?: number; feedDays?: number; dangerQuietDays?: number; quietCoinDays?: number }

/**
 * Run the configured retention (packages/db/src/retention.ts) on the singleton worker every ten minutes, each enabled
 * rule bounded to six seconds with a two-minute pass ceiling. The app supplies report-only defaults. Quote
 * tokens are the address registry's verified `tokens.*` entries.
 */
export class RetentionWorker {
  private timer?: NodeJS.Timeout;
  private running?: Promise<void>;
  constructor(private readonly db: ChainDb, private readonly settings: RetentionSettings,
    private readonly report: (result: RetentionResult | { failed: true }) => void, private readonly intervalMs = 600_000) {}
  get enabled() { return this.settings.enabled !== false && Object.entries(this.settings).some(([key,value]) => key !== 'enabled' && value !== undefined); }
  start() {
    if (this.timer || !this.enabled) return;
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
  }
  async stop() { if (this.timer) clearInterval(this.timer); this.timer = undefined; await this.running; }
  tick(): Promise<void> {
    if (!this.enabled) return Promise.resolve();
    if (this.running) return this.running;
    this.running = this.pass().finally(() => { this.running = undefined; });
    return this.running;
  }
  private async pass() {
    try {
      const registry=loadRegistry();
      const quoteTokens = registry.entries()
        .filter(([key, entry]) => key.startsWith('tokens.') && entry.address !== 'TODO')
        .map(([, entry]) => String(entry.address).toLowerCase());
      this.report(await runRetention(this.db, { quoteTokens, ...RETENTION_RULE_INPUTS, poolManager:registry.addressOf('uniswapV4.poolManager') ?? undefined, ...this.settings }));
    } catch { this.report({ failed: true }); } // Retry next interval; no SQL or row data enters logs.
  }
}
