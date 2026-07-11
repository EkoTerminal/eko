import { and, desc, eq } from 'drizzle-orm';
import { PAPER_QUOTE_ASSET, PAPER_STARTING_CASH, type Balance, type Fill, type Position, type TradingMode } from '@eko/shared';
import type { Db } from '../db/client.js';
import { fills, paperBalances, positions } from '../db/schema.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** Applies a fill to a spot position (average-cost method). Selling never takes quantity below zero. */
export async function applyFillToPosition(
  tx: Tx | Db,
  accountId: string,
  mode: TradingMode,
  market: string,
  side: 'buy' | 'sell',
  baseQty: number,
  quoteQty: number,
  fee: number,
) {
  const [cur] = await tx.select().from(positions).where(and(eq(positions.accountId, accountId), eq(positions.mode, mode), eq(positions.market, market)));
  let quantity = cur?.quantity ?? 0;
  let costBasis = cur?.costBasis ?? 0;
  let realized = cur?.realizedPnl ?? 0;
  if (side === 'buy') {
    quantity += baseQty;
    costBasis += quoteQty + fee;
  } else {
    // Only the part of the sale backed by recorded buys has a known cost basis. Selling assets
    // acquired outside EKO (possible on-chain) must not be booked as realized profit.
    const sold = Math.min(baseQty, quantity);
    const avg = quantity > 0 ? costBasis / quantity : 0;
    const share = baseQty > 0 ? sold / baseQty : 0;
    realized += (quoteQty - fee) * share - avg * sold;
    costBasis -= avg * sold;
    quantity -= sold;
    if (quantity < 1e-12) {
      quantity = 0;
      costBasis = 0;
    }
  }
  const avgCost = quantity > 0 ? costBasis / quantity : 0;
  await tx
    .insert(positions)
    .values({ accountId, mode, market, quantity, avgCost, costBasis, realizedPnl: realized })
    .onConflictDoUpdate({
      target: [positions.accountId, positions.mode, positions.market],
      set: { quantity, avgCost, costBasis, realizedPnl: realized, updatedAt: new Date() },
    });
}

export class PortfolioService {
  constructor(private db: Db) {}

  async ensurePaperAccount(accountId: string) {
    await this.db.insert(paperBalances).values({ accountId, asset: PAPER_QUOTE_ASSET, amount: PAPER_STARTING_CASH }).onConflictDoNothing();
  }

  async paperBalances(accountId: string): Promise<Balance[]> {
    await this.ensurePaperAccount(accountId);
    const rows = await this.db.select().from(paperBalances).where(eq(paperBalances.accountId, accountId));
    return rows.map((r) => ({ asset: r.asset, amount: r.amount }));
  }

  async positions(accountId: string, mode: TradingMode, marks: (market: string) => number | null): Promise<Position[]> {
    const rows = await this.db.select().from(positions).where(and(eq(positions.accountId, accountId), eq(positions.mode, mode)));
    return rows
      .filter((r) => r.quantity > 0 || r.realizedPnl !== 0)
      .map((r) => {
        const mark = marks(r.market);
        return {
          mode: r.mode,
          market: r.market,
          asset: r.market.split('-')[0]!,
          quantity: r.quantity,
          avgCost: r.avgCost,
          costBasis: r.costBasis,
          realizedPnl: r.realizedPnl,
          markPrice: mark,
          unrealizedPnl: mark !== null && r.quantity > 0 ? r.quantity * mark - r.costBasis : null,
          updatedAt: r.updatedAt.getTime(),
        };
      });
  }

  async fills(accountId: string, mode: TradingMode, limit = 200): Promise<Fill[]> {
    const rows = await this.db
      .select()
      .from(fills)
      .where(and(eq(fills.accountId, accountId), eq(fills.mode, mode)))
      .orderBy(desc(fills.at))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      mode: r.mode,
      market: r.market,
      side: r.side,
      price: r.price,
      baseQty: r.baseQty,
      quoteQty: r.quoteQty,
      fee: r.fee,
      feeAsset: r.feeAsset,
      txHash: r.txHash,
      at: r.at.getTime(),
    }));
  }

  /** Resets the PAPER account only. Order and fill history is kept (and remains labelled paper). */
  async resetPaper(accountId: string) {
    await this.db.transaction(async (tx) => {
      await tx.delete(paperBalances).where(eq(paperBalances.accountId, accountId));
      await tx.delete(positions).where(and(eq(positions.accountId, accountId), eq(positions.mode, 'paper')));
      await tx.insert(paperBalances).values({ accountId, asset: PAPER_QUOTE_ASSET, amount: PAPER_STARTING_CASH });
    });
  }
}
