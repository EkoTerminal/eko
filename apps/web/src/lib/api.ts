import { ApiErrorSchema, type ErrorCode } from '@eko/shared';
import type { z } from 'zod';

export const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/v1').replace(/\/$/, '');
export const MOCKS = import.meta.env.VITE_MOCKS === '1';
export type FetchTransport = (url: string, init: RequestInit) => Promise<Response>;
export interface ApiOptions { method?: string; body?: unknown; signal?: AbortSignal }

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly body: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
  }
}
const statusCode = (status: number): ErrorCode => ({
  400: 'bad_request', 401: 'wallet_auth_required', 403: 'forbidden', 404: 'not_found',
  409: 'conflict', 402: 'payment_required', 429: 'rate_limited',
} as Record<number, ErrorCode>)[status] ?? 'internal_error';

export function createApi(base = API_BASE, transport: FetchTransport = (url, init) => fetch(url, init)) {
  async function request(path: string, opts: ApiOptions = {}): Promise<unknown> {
    // TODO(spec): Move retained execution callers to /v1 when the backend
    // exposes their new contracts. Preserve existing wallet behavior meanwhile.
    const legacy = path.startsWith('/api/');
    const root = base.replace(/\/$/, '');
    const url = legacy ? path : path.startsWith('/v2/') ? `${root.replace(/\/v1$/, '')}${path}` : `${root}/${path.replace(/^\/?v1\//, '').replace(/^\//, '')}`;
    let res: Response;
    try {
      res = await transport(url, {
        method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
        headers: opts.body !== undefined ? { 'content-type': 'application/json' } : undefined,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        credentials: 'include', signal: opts.signal,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
      throw new ApiError(0, legacy ? 'network' : 'internal_error', 'Cannot reach the EKO server. Check your connection.');
    }
    let body: unknown;
    try { const text = await res.text(); body = text ? JSON.parse(text) : {}; }
    catch { throw new ApiError(res.status, res.ok ? 'internal_error' : statusCode(res.status), 'Invalid server response.'); }
    if (!res.ok) {
      const parsed = ApiErrorSchema.safeParse(body);
      const raw = body && typeof body === 'object' ? body as Record<string, unknown> : {};
      // Legacy codes are required by the retained trade flow; new responses use ErrorCode.
      const code = parsed.success ? parsed.data.error : legacy && typeof raw.error === 'string' ? raw.error : statusCode(res.status);
      throw new ApiError(res.status, code, parsed.success ? parsed.data.message : typeof raw.message === 'string' ? raw.message : `Request failed (${res.status})`, raw);
    }
    return body;
  }
  return {
    request,
    async parse<T>(path: string, schema: z.ZodType<T>, opts?: ApiOptions): Promise<T> {
      const parsed = schema.safeParse(await request(path, opts));
      if (!parsed.success) throw new ApiError(502, 'internal_error', 'The server response did not match the shared contract.');
      return parsed.data;
    },
  };
}
const client = createApi(API_BASE, async (url, init) => MOCKS
  ? (await import('../mocks/transport')).mockFetch(url, init)
  : fetch(url, init));
export const fetchParsed = client.parse;
/** Compatibility entry point for retained trading helpers. New APIs use fetchParsed. */
export async function api<T>(path: string, opts?: ApiOptions): Promise<T> { return await client.request(path, opts) as T; }
