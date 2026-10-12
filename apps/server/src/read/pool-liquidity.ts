import { binary, hex, type ChainDb } from '@eko/db';
import type { Address } from '@eko/shared';

/**
 * USD value of both sides of a full-range Uniswap position with liquidity L, from one trade on the pool: the reserves are
 * L*sqrt(p) of the quote and L/sqrt(p) of the coin at price p (quote per coin, base units), each worth
 * L*usd/sqrt(quote*coin) by a trade of `coin` for `quote` base units priced at `usd`. The trade's amounts include the
 * hook's fee, so the price is off by that fee and the value by about half of it.
 */
export function poolValueUsd(liquidity: number, coinAmount: number, quoteAmount: number, usd: number): number | null {
  if (!(coinAmount > 0) || !(quoteAmount > 0) || !(usd > 0) || !Number.isFinite(liquidity)) return null;
  return Math.max(0, 2 * liquidity * usd / Math.sqrt(quoteAmount * coinAmount));
}
/**
 * Liquidity of graduated coins' pools in USD, by coin: the pool's full-range positions (a Pons graduation deposits one,
 * tick -887200 to 887200) valued at the pool's latest priced trade. Absent for a coin that has not graduated, has no
 * such position on record, or has not traded on its pool yet. Narrower positions are not counted.
 */
export async function readPoolLiquidity(db: ChainDb, coins: Address[]): Promise<Map<Address, number>> {
  const found = new Map<Address, number>();
  if (!coins.length) return found;
  const rows = (await db.sql.query<{ coin: Uint8Array; liquidity: number | null; coin_amount: number | null; quote_amount: number | null; usd: number | null }>(`
    SELECT t.address AS coin,l.liquidity::float8 AS liquidity,s.amount_coin::float8 AS coin_amount,s.amount_quote::float8 AS quote_amount,s.usd
    FROM tokens t
    LEFT JOIN LATERAL (SELECT sum((e.data->>'liquidityDelta')::numeric) AS liquidity FROM liquidity_events e
      WHERE e.pool_id=t.graduated_pool AND e.kind='ModifyLiquidity' AND (e.data->>'tickLower')::int<=-887000 AND (e.data->>'tickUpper')::int>=887000) l ON true
    -- The coin's latest 50 swaps by its (coin, block) index, then the newest of them on its pool with a price. Filtering
    -- by pool inside the index scan made the planner sort every swap of a busy coin: 2.5 s for one Radar page.
    LEFT JOIN LATERAL (SELECT recent.amount_coin,recent.amount_quote,recent.usd FROM (
        SELECT s.amount_coin,s.amount_quote,s.usd,s.pool_id,s.block FROM swaps s WHERE s.coin=t.address AND s.block>=t.graduated_block ORDER BY s.block DESC LIMIT 50) recent
      WHERE recent.pool_id=t.graduated_pool AND recent.usd>0 AND recent.amount_coin>0 AND recent.amount_quote>0 ORDER BY recent.block DESC LIMIT 1) s ON true
    WHERE t.address=ANY($1::bytea[]) AND t.graduated_pool IS NOT NULL AND t.graduated_block IS NOT NULL`, [coins.map(binary)])).rows;
  for (const row of rows) {
    if (row.liquidity == null || row.coin_amount == null || row.quote_amount == null || row.usd == null) continue;
    const value = poolValueUsd(Number(row.liquidity), Number(row.coin_amount), Number(row.quote_amount), Number(row.usd));
    if (value != null) found.set(hex(row.coin) as Address, value);
  }
  return found;
}

/**
 * Where a Pons launch curve stands at its latest priced trade: progress toward graduation (percent of the graduation
 * reserve raised) and the USD held in the curve, which is what sellers can take out in all. A Pons curve is a
 * constant product over a virtual quote reserve of 0.4 times the graduation reserve and the whole token supply
 * (measured 2026-10-12: card progress = 40 x s/(1-s) for s = share of supply bought, median 40.0 on every curve size),
 * so a trade at price p (quote per coin, base units) puts the quote side at sqrt(0.4 x T x supply x p) and the real
 * reserve at that less 0.4 x T. The trade's amounts include the fee, which moves the result by under one point of
 * progress (checked against 14 current cards). Absent without a launch record, a supply or a priced trade.
 */
export function curveState(threshold: number, supply: number, coinAmount: number, quoteAmount: number, usd: number): { curvePct: number; usd: number } | null {
  if (!(threshold > 0) || !(supply > 0) || !(coinAmount > 0) || !(quoteAmount > 0) || !(usd > 0)) return null;
  const virtual = 0.4 * threshold, reserve = Math.min(threshold, Math.max(0, Math.sqrt(virtual * supply * quoteAmount / coinAmount) - virtual));
  return { curvePct: 100 * reserve / threshold, usd: reserve * usd / quoteAmount };
}
/** `curveState` for Pons coins that have not graduated, by coin, from indexed rows only. */
export async function readCurveStates(db: ChainDb, coins: Address[]): Promise<Map<Address, { curvePct: number; usd: number }>> {
  const found = new Map<Address, { curvePct: number; usd: number }>();
  if (!coins.length) return found;
  const rows = (await db.sql.query<{ coin: Uint8Array; threshold: number | null; supply: number | null; coin_amount: number | null; quote_amount: number | null; usd: number | null }>(`
    SELECT t.address AS coin,(e.data->>'graduationThreshold')::numeric::float8 AS threshold,t.total_supply::float8 AS supply,
      s.amount_coin::float8 AS coin_amount,s.amount_quote::float8 AS quote_amount,s.usd
    FROM tokens t
    JOIN LATERAL (SELECT data FROM pons_events e WHERE e.token=t.address AND e.kind='launch' ORDER BY e.block,e.log_index LIMIT 1) e ON true
    JOIN LATERAL (SELECT amount_coin,amount_quote,usd FROM swaps s WHERE s.coin=t.address AND s.usd>0 AND s.amount_quote>0 AND s.amount_coin>0 ORDER BY s.block DESC LIMIT 1) s ON true
    WHERE t.address=ANY($1::bytea[]) AND t.launchpad='pons' AND t.graduated_block IS NULL AND t.total_supply>0`, [coins.map(binary)])).rows;
  for (const row of rows) {
    const state = curveState(Number(row.threshold), Number(row.supply), Number(row.coin_amount), Number(row.quote_amount), Number(row.usd));
    if (state) found.set(hex(row.coin) as Address, state);
  }
  return found;
}
