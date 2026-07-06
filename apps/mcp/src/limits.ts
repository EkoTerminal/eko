import { createHmac } from 'node:crypto';
import type { DbHandle } from '../../server/src/db/client.js';

export interface RateLimits {
  consume(subject: string, maxPerMinute: number): Promise<{ allowed: boolean; retryAfterSec: number }>;
}

/** Atomic shared counters; no sessions or secrets are stored, and replicas share budgets. */
export class SqlRateLimits implements RateLimits {
  constructor(private sql: DbHandle['chain']['sql'], private pepper: string) {}
  async consume(subject: string, max: number) {
    const hash = createHmac('sha256', this.pepper).update(subject).digest('hex');
    const result = await this.sql.query<{ hits: number; retry: number }>(`
      INSERT INTO mcp_rate_limits (subject_hash, window_start, hits)
      VALUES ($1, date_trunc('minute', now()), 1)
      ON CONFLICT (subject_hash) DO UPDATE SET
        hits = CASE WHEN mcp_rate_limits.window_start < date_trunc('minute', now()) THEN 1
          ELSE LEAST(mcp_rate_limits.hits + 1, $2::int + 1) END,
        window_start = date_trunc('minute', now())
      RETURNING hits, GREATEST(1, CEIL(EXTRACT(EPOCH FROM window_start + interval '1 minute' - now())))::int AS retry
    `, [hash, max]);
    return { allowed: result.rows[0]!.hits <= max, retryAfterSec: result.rows[0]!.retry };
  }
  async prune() {
    await this.sql.query("DELETE FROM mcp_rate_limits WHERE window_start < date_trunc('minute', now()) - interval '1 minute'");
  }
}
