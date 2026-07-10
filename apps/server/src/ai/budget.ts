import { and, eq, gte, sql } from 'drizzle-orm';
import { FALLBACK_PRICE_PER_M, modelInfo, type ProviderId } from '@eko/shared';
import type { Db } from '../db/client.js';
import { inferenceRuns } from '../db/schema.js';

export function estimateCost(provider: ProviderId, model: string, inputTokens: number | null, outputTokens: number | null, route: 'direct' | 'gateway' = 'direct'): number {
  const info = modelInfo(provider, model, route);
  const pin = info?.inputPerM ?? FALLBACK_PRICE_PER_M.input;
  const pout = info?.outputPerM ?? FALLBACK_PRICE_PER_M.output;
  return ((inputTokens ?? 3000) * pin + (outputTokens ?? 2000) * pout) / 1_000_000;
}

/**
 * Inference cost controls: a hard daily ceiling across all providers and a per-bot hourly
 * call cap. Budgets are enforced BEFORE a call; spend is read back from recorded runs.
 */
export class InferenceBudget {
  constructor(
    private db: Db,
    private dailyUsd: number,
    private maxCallsPerBotHour: number,
  ) {}

  async spentToday(now = Date.now()): Promise<number> {
    const dayStart = Math.floor(now / 86_400_000) * 86_400_000;
    const [row] = await this.db
      .select({ total: sql<number>`coalesce(sum(${inferenceRuns.estCostUsd}), 0)` })
      .from(inferenceRuns)
      .where(gte(inferenceRuns.startedAt, dayStart));
    return Number(row?.total ?? 0);
  }

  async check(botId: string, now = Date.now()): Promise<{ ok: true } | { ok: false; reason: string }> {
    if (this.dailyUsd <= 0) return { ok: false, reason: 'AI_DAILY_BUDGET_USD is 0 — AI inference disabled' };
    const spent = await this.spentToday(now);
    if (spent >= this.dailyUsd) return { ok: false, reason: `Daily AI budget reached ($${spent.toFixed(2)} of $${this.dailyUsd.toFixed(2)})` };
    const [row] = await this.db
      .select({ n: sql<number>`count(*)` })
      .from(inferenceRuns)
      .where(and(eq(inferenceRuns.botId, botId), gte(inferenceRuns.startedAt, now - 3_600_000), sql`${inferenceRuns.outcome} in ('ok','abstained','rejected','error')`));
    if (Number(row?.n ?? 0) >= this.maxCallsPerBotHour) return { ok: false, reason: `Bot hourly call cap reached (${this.maxCallsPerBotHour}/h)` };
    return { ok: true };
  }

  get limits() {
    return { dailyUsd: this.dailyUsd, maxCallsPerBotHour: this.maxCallsPerBotHour };
  }
}
