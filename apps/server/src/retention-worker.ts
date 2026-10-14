import { runRetention, type ChainDb, type RetentionResult } from '@eko/db';
import { RETENTION_RULE_INPUTS } from '@eko/engines';
import { loadRegistry } from '@eko/chain';

export interface RetentionSettings { enabled?: boolean; settleHours?: number; rawDays?: number; ratingDays?: number; dryRun?: boolean; quoteDays?: number; idleTokenDays?: number; pendingPoolDays?: number; feedDays?: number; dangerQuietDays?: number; quietCoinDays?: number }

/**
 * Run the configured retention (packages/db/src/retention.ts) on the singleton worker while backlogged, otherwise every ten minutes, each enabled
 * rule bounded to six seconds with a two-minute pass ceiling. The app supplies report-only defaults. Quote
 * tokens are the address registry's verified `tokens.*` entries.
 */
export class RetentionWorker {
  private timer?: NodeJS.Timeout;
  private running?: Promise<void>;
  private started = false;
  private backlogged = false;
  constructor(private readonly db: ChainDb, private readonly settings: RetentionSettings,
    private readonly report: (result: RetentionResult | { failed: true }) => void, private readonly intervalMs = 600_000) {}
  get enabled() { return this.settings.enabled !== false && Object.entries(this.settings).some(([key,value]) => key !== 'enabled' && value !== undefined); }
  start() {
    if (this.started || !this.enabled) return;
    this.started = true;
    void this.tick();
  }
  async stop() { this.started = false; if (this.timer) clearTimeout(this.timer); this.timer = undefined; await this.running; }
  tick(): Promise<void> {
    if (!this.enabled) return Promise.resolve();
    if (this.running) return this.running;
    if (this.timer) clearTimeout(this.timer); this.timer = undefined;
    this.running = this.pass().finally(() => {
      this.running = undefined;
      if (this.started) this.timer = setTimeout(() => { this.timer = undefined; void this.tick(); }, this.backlogged ? 100 : this.intervalMs);
    });
    return this.running;
  }
  private async pass() {
    try {
      const registry=loadRegistry();
      const quoteTokens = registry.entries()
        .filter(([key, entry]) => key.startsWith('tokens.') && entry.address !== 'TODO')
        .map(([, entry]) => String(entry.address).toLowerCase());
      const result = await runRetention(this.db, { quoteTokens, ...RETENTION_RULE_INPUTS, poolManager:registry.addressOf('uniswapV4.poolManager') ?? undefined, ...this.settings });
      this.backlogged = !result.dryRun && !result.finished;
      this.report(result);
    } catch { this.backlogged = false; this.report({ failed: true }); } // Retry next interval; no SQL or row data enters logs.
  }
}
