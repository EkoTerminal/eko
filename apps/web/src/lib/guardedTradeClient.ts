import { z } from 'zod';
import { TradeOrderSchema, TradeQuoteSchema, UnsignedTxSchema } from '@eko/shared';
import { fetchParsed } from './api';
import type { TradeClient } from './tradeFlow';
const response = z.object({ order: TradeOrderSchema });
/** 075/076 v1 boundary. Missing downstream endpoints fail closed through runtime schemas. */
export function createGuardedTradeClient(parse: typeof fetchParsed = fetchParsed): TradeClient { return {
  quote: body => parse('/trade/quote', TradeQuoteSchema, { body }),
  order: body => parse('/trade/order', z.object({ order: TradeOrderSchema, tx: UnsignedTxSchema }), { body }),
  submitted: async (id, txHash) => (await parse(`/trade/order/${encodeURIComponent(id)}/submitted`, response, { body: { txHash } })).order,
  rejected: async (id, code) => (await parse(`/trade/order/${encodeURIComponent(id)}/rejected`, response, { body: { code } })).order,
  // TODO(spec): 076's packet names detail/history without freezing their wrappers. Use {order} detail and {rows} history at this typed boundary; integration must match the route owner's contract.
  detail: async id => (await parse(`/trade/order/${encodeURIComponent(id)}`, response)).order,
}; }
export const guardedTradeClient = createGuardedTradeClient();
export const guardedOrderHistory = () => fetchParsed('/trade/orders', z.object({ rows: z.array(TradeOrderSchema) }));
