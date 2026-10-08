import { runRetention, type ChainDb, type RetentionResult } from '@eko/db';
import { loadRegistry } from '@eko/chain';

export interface RetentionSettings { quoteDays?: number; idleTokenDays?: number; pendingPoolDays?: number; feedDays?: number; dangerQuietDays?: number; quietCoinDays?: number }

/**
 * Run the configured retention (packages/db/src/retention.ts) on the singleton worker every ten minutes, each enabled
 * rule bounded to about a minute of batched work per pass. Nothing runs unless a retention setting is configured. Quote
 * tokens are the address registry's verified `tokens.*` entries.
 */
export class RetentionWorker {
  private timer?: NodeJS.Timeout;
  private running?: Promise<void>;
  constructor(private readonly db: ChainDb, private readonly settings: RetentionSettings,
    private readonly report: (result: RetentionResult | { failed: true }) => void, private readonly intervalMs = 600_000) {}
  get enabled() { return Object.values(this.settings).some(value => value !== undefined); }
  start() {
    if (this.timer || !this.enabled) return;
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
  }
  async stop() { if (this.timer) clearInterval(this.timer); this.timer = undefined; await this.running; }
  tick(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.pass().finally(() => { this.running = undefined; });
    return this.running;
  }
  private async pass() {
    try {
      const quoteTokens = loadRegistry().entries()
        .filter(([key, entry]) => key.startsWith('tokens.') && entry.address !== 'TODO')
        .map(([, entry]) => String(entry.address).toLowerCase());
      this.report(await runRetention(this.db, { quoteTokens, ...this.settings }));
    } catch { this.report({ failed: true }); } // Retry next interval; no SQL or row data enters logs.
  }
}
