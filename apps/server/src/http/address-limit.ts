import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/**
 * A per-client-address cap layered over the per-session limits. GET /v1/me mints a guest session for anyone,
 * so session buckets alone never bound one client. Unlike a second route limiter, this does not mark the
 * request as already limited, so the route's own per-session limit still applies.
 */
export function addressLimit(app: FastifyInstance, max: number, skip: (req: FastifyRequest) => boolean = () => false) {
  const limit = app.createRateLimit({ max, timeWindow: '1 minute', keyGenerator: req => req.ip, allowList: skip });
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const result = await limit(req);
    if (result.isAllowed || !result.isExceeded) return;
    return reply.code(429).header('retry-after', String(result.ttlInSeconds)).send({ error: 'rate_limited', message: 'Rate limit exceeded' });
  };
}
