import { binary, refreshBars, type ChainDb } from '@eko/db';
import { loadRegistry } from '@eko/chain';

export interface PricingAssets { weth: string; usdg: string; usdgDecimals: number }
const NATIVE = '0x0000000000000000000000000000000000000000';
export const pricingAssets = (registry = loadRegistry()): PricingAssets => ({
  weth: registry.requireAddress('tokens.WETH'), usdg: registry.requireAddress('tokens.USDG'), usdgDecimals: registry.data.tokens.USDG.decimals ?? 6,
});

/**
 * Price a Pons coin's swaps the decoder left without USD, newest first within [from, to), and refresh their candles.
 * Two causes on 2026-10-11 (694,000 of 1.96 million Pons swaps in seven days): USDG quotes had no USD conversion,
 * though USDG is the dollar the ETH/USD reference is quoted in, and curve swaps decoded before the coin's decimals
 * were known stayed pricing_pending. A coin with one unpriced swap never gets its wash and curve checks, so it could
 * never be rated Clear. ETH and WETH quotes use the reference rate the decoder uses: the latest swap on the recorded
 * reference pool at or before the swap's block. Swaps without a reference stay unpriced. Returns the number priced.
 */
export async function repricePonsSwaps(db: ChainDb, assets: PricingAssets, from: Date, to: Date, limit = 2000): Promise<number> {
  return db.tx(async tx => {
    const rows = (await tx.sql.query<{ coin: Uint8Array; ts: Date }>(`WITH c AS (
        SELECT s.ts,s.tx_hash,s.log_index,s.block,s.amount_coin,s.amount_quote,t.decimals,s.quote_asset=$3 AS dollar
        FROM swaps s JOIN tokens t ON t.address=s.coin
        WHERE s.ts>=$5 AND s.ts<$6 AND s.usd IS NULL AND t.launchpad='pons' AND t.decimals IS NOT NULL
          AND s.amount_coin>0 AND s.amount_quote>0 AND s.quote_asset=ANY($1::bytea[])
        ORDER BY s.ts DESC LIMIT $7),
      r AS (SELECT c.*,CASE WHEN c.dollar THEN 1::double precision ELSE x.price_quote END AS rate,CASE WHEN c.dollar THEN c.block ELSE x.block END AS rate_block,
          c.amount_quote::double precision/10^(CASE WHEN c.dollar THEN $4 ELSE 18 END) AS quote
        FROM c LEFT JOIN LATERAL (SELECT x.price_quote,x.block FROM swaps x
          WHERE NOT c.dollar AND x.pool_id=(SELECT e.pool_id FROM eth_usd_reference_sources e WHERE e.block<=c.block ORDER BY e.block DESC LIMIT 1)
            AND x.coin=$2 AND x.quote_asset=$3 AND x.block<=c.block AND x.price_quote>0 AND x.price_quote<'Infinity'::double precision
          ORDER BY x.block DESC,x.log_index DESC LIMIT 1) x ON true)
      UPDATE swaps s SET usd=r.quote*r.rate,price_quote=coalesce(s.price_quote,r.quote/(r.amount_coin::double precision/10^r.decimals)),
        pricing_pending=false,priced_block=r.rate_block
      FROM r WHERE s.ts=r.ts AND s.tx_hash=r.tx_hash AND s.log_index=r.log_index AND r.rate IS NOT NULL
      RETURNING s.coin,s.ts`, [[NATIVE, assets.weth, assets.usdg].map(binary), binary(assets.weth), binary(assets.usdg), assets.usdgDecimals, from, to, limit])).rows;
    if (rows.length) await refreshBars(tx, rows.map(row => ({ coin: row.coin, minute: new Date(Math.floor(new Date(row.ts).getTime() / 60000) * 60000) })));
    return rows.length;
  });
}

const HOUR = 3_600_000;
/**
 * Worker role: every 30 s, price the newest six hours of Pons swaps, then walk an in-memory cursor back one hour at a
 * time through the last eight days within a 20 s budget per pass. A restart walks the history again; hours already
 * priced cost one indexed range read each.
 */
export class PricingRepairWorker {
  private timer?: NodeJS.Timeout;
  private running?: Promise<void>;
  private cursor?: number;
  constructor(private readonly db: ChainDb, private readonly log: (event: string, fields: Record<string, unknown>) => void,
    private readonly now = () => Date.now(), private readonly intervalMs = 30_000, private readonly budgetMs = 20_000, private assets?: PricingAssets) {}
  start() { if (this.timer) return; void this.tick(); this.timer = setInterval(() => void this.tick(), this.intervalMs); this.timer.unref(); }
  async stop() { if (this.timer) clearInterval(this.timer); this.timer = undefined; await this.running; }
  tick(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.pass().catch(() => this.log('pricing_repair_failed', {})).finally(() => { this.running = undefined; });
    return this.running;
  }
  private async hour(end: number, deadline: number) {
    let priced = 0;
    for (;;) {
      const n = await repricePonsSwaps(this.db, this.assets ??= pricingAssets(), new Date(end - HOUR), new Date(end));
      priced += n;
      if (n < 2000 || this.now() >= deadline) return priced;
    }
  }
  private async pass() {
    const started = this.now(), deadline = started + this.budgetMs, top = Math.ceil(started / HOUR) * HOUR;
    let recent = 0, backfilled = 0;
    for (let end = top; end > top - 6 * HOUR && this.now() < deadline; end -= HOUR) recent += await this.hour(end, deadline);
    this.cursor ??= top - 6 * HOUR;
    while (this.cursor > top - 8 * 24 * HOUR && this.now() < deadline) { backfilled += await this.hour(this.cursor, deadline); this.cursor -= HOUR; }
    if (recent || backfilled) this.log('pricing_repair', { recent, backfilled, cursor: new Date(this.cursor).toISOString(), ms: this.now() - started });
  }
}
