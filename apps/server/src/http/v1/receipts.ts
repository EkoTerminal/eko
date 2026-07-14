import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { ReceiptApiStore } from '@eko/db';
import { InputError, notFound, parse, sendError } from './helpers.js';

export async function receiptRoutes(app: FastifyInstance, receipts: ReceiptApiStore) {
  // Reveal timing/canonicality may change on every request, including reorgs.
  app.addHook('onRequest', async (_req, reply) => { reply.header('Cache-Control', 'no-store'); });
  app.setErrorHandler((err, _req, reply) => err instanceof InputError
    ? sendError(reply, 'bad_request', err.message)
    : sendError(reply, 'internal_error', 'Receipt verification data is unavailable'));
  app.get('/receipts/:id', async (req, reply) => {
    const { id } = parse(z.object({ id: z.string().min(1).max(256) }), req.params);
    return await receipts.get(id) ?? notFound(reply);
  });
  // CA-16: owner POST reveal is D0. No handler is registered at T; even an
  // authenticated owner GET receives commitments only for private receipts.
}
