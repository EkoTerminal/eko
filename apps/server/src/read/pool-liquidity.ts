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
    LEFT JOIN LATERAL (SELECT amount_coin,amount_quote,usd FROM swaps s
      WHERE s.coin=t.address AND s.block>=t.graduated_block AND s.pool_id=t.graduated_pool AND s.usd>0 AND s.amount_coin>0 AND s.amount_quote>0
      ORDER BY s.block DESC LIMIT 1) s ON true
    WHERE t.address=ANY($1::bytea[]) AND t.graduated_pool IS NOT NULL AND t.graduated_block IS NOT NULL`, [coins.map(binary)])).rows;
  for (const row of rows) {
    if (row.liquidity == null || row.coin_amount == null || row.quote_amount == null || row.usd == null) continue;
    const value = poolValueUsd(Number(row.liquidity), Number(row.coin_amount), Number(row.quote_amount), Number(row.usd));
    if (value != null) found.set(hex(row.coin) as Address, value);
  }
  return found;
}
