import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { recoverMessageAddress, type Hex, type PublicClient } from 'viem';
import { generateSiweNonce, parseSiweMessage, validateSiweMessage } from 'viem/siwe';
import { NETWORKS, SIWE_STATEMENT, SiweNonceSchema, type SiweNonce } from '@eko/shared';
import type { Config } from '../config.js';
import type { Db } from '../db/client.js';
import { accounts, auditLog, sessions, siweNonces } from '../db/schema.js';

export const SESSION_COOKIE = 'eko_sid';
const SESSION_TTL_MS = 90 * 24 * 3600 * 1000;

export interface Account {
  id: string;
  kind: 'guest' | 'wallet';
  walletAddress: string | null;
  displayName: string | null;
  role: 'user' | 'admin';
}

declare module 'fastify' {
  interface FastifyRequest {
    account: Account | null;
  }
}

const hash = (t: string) => createHash('sha256').update(t).digest('hex');

export class AuthService {
  constructor(
    private db: Db,
    private cfg: Config,
  ) {}

  cookieOptions() {
    const prod = this.cfg.NODE_ENV === 'production';
    const url = new URL(this.cfg.origins[0]!);
    const host = url.hostname.replace(/^(app|api|mcp)\./, '');
    const domain = this.cfg.SESSION_COOKIE_DOMAIN ?? (host === 'localhost' || /^[\d.]+$/.test(host) ? undefined : `.${host}`);
    return { path: '/', ...(domain ? { domain } : {}), httpOnly: true, sameSite: 'lax' as const, secure: prod || url.protocol === 'https:', maxAge: SESSION_TTL_MS / 1000, signed: true };
  }

  private toAccount(r: typeof accounts.$inferSelect): Account {
    const isAdmin = r.walletAddress ? this.cfg.adminWallets.has(r.walletAddress.toLowerCase()) : false;
    return { id: r.id, kind: r.kind, walletAddress: r.walletAddress, displayName: r.displayName, role: isAdmin ? 'admin' : r.role };
  }

  async fromToken(token: string | undefined): Promise<Account | null> {
    if (!token) return null;
    const rows = await this.db
      .select({ a: accounts })
      .from(sessions)
      .innerJoin(accounts, eq(accounts.id, sessions.accountId))
      .where(and(eq(sessions.tokenHash, hash(token)), gt(sessions.expiresAt, new Date())));
    return rows[0] ? this.toAccount(rows[0].a) : null;
  }

  async createSession(accountId: string, userAgent?: string) {
    const token = randomBytes(32).toString('base64url');
    await this.db.insert(sessions).values({ tokenHash: hash(token), accountId, expiresAt: new Date(Date.now() + SESSION_TTL_MS), userAgent: userAgent?.slice(0, 200) });
    return token;
  }

  async createGuest(userAgent?: string) {
    const [a] = await this.db.insert(accounts).values({ kind: 'guest' }).returning();
    const token = await this.createSession(a!.id, userAgent);
    return { account: this.toAccount(a!), token };
  }

  async destroySession(token: string | undefined) {
    if (token) await this.db.delete(sessions).where(eq(sessions.tokenHash, hash(token)));
  }

  readCookie(req: FastifyRequest): string | undefined {
    const raw = req.cookies[SESSION_COOKIE];
    if (!raw) return undefined;
    const u = req.unsignCookie(raw);
    return u.valid ? (u.value ?? undefined) : undefined;
  }

  /** Resolve the session, creating a guest account when none exists. */
  async ensure(req: FastifyRequest, reply: FastifyReply): Promise<Account> {
    const token = this.readCookie(req);
    const acc = await this.fromToken(token);
    if (acc) return acc;
    const g = await this.createGuest(req.headers['user-agent']);
    reply.setCookie(SESSION_COOKIE, g.token, this.cookieOptions());
    req.cookies[SESSION_COOKIE] = reply.signCookie(g.token);
    return g.account;
  }

  // ─────────────── SIWE (EIP-4361) ───────────────

  async nonce(accountId: string) {
    const nonce = generateSiweNonce();
    await this.db.insert(siweNonces).values({ nonce, accountId, expiresAt: new Date(Date.now() + 10 * 60_000) });
    return nonce;
  }

  async challenge(req: FastifyRequest, accountId: string): Promise<SiweNonce> {
    const origin = this.originFor(req, true);
    const token = this.readCookie(req);
    if (!token) throw Object.assign(new Error('Session required'), { statusCode: 401 });
    const issuedAt = new Date();
    const expirationTime = new Date(issuedAt.getTime() + 10 * 60_000);
    const nonce = generateSiweNonce();
    await this.db.insert(siweNonces).values({ nonce, accountId, createdAt: issuedAt, expiresAt: expirationTime, origin, sessionHash: hash(token) });
    return SiweNonceSchema.parse({ nonce, domain: new URL(origin).host, uri: origin, issuedAt: issuedAt.toISOString(), expirationTime: expirationTime.toISOString() });
  }

  expectedDomain(): string {
    return new URL(this.cfg.origins[0] ?? 'http://localhost:5173').host;
  }

  /**
   * The configured origin the request came from (Origin, then Referer), falling back to the
   * first configured origin. Wallets warn when the SIWE domain differs from the page's origin,
   * so with several PUBLIC_ORIGIN values the message must name the one the user is on.
   */
  originFor(req: FastifyRequest, strict = false): string {
    const candidates = [req.headers.origin, req.headers.referer].filter((v): v is string => typeof v === 'string');
    for (const c of candidates) {
      try {
        const o = new URL(c).origin;
        if (strict && c === req.headers.origin && c !== o) throw new Error('Malformed Origin');
        if (this.cfg.origins.includes(o)) return o;
      } catch {
        /* ignore malformed header */
      }
      if (strict) throw Object.assign(new Error('Origin is not allowed'), { statusCode: 403 });
    }
    if (strict) throw Object.assign(new Error('Allowed Origin or Referer required'), { statusCode: 403 });
    return this.cfg.origins[0] ?? 'http://localhost:5173';
  }

  /**
   * Verifies a SIWE message + signature. EOAs are verified offline by signature recovery;
   * smart-contract wallets (ERC-1271/6492) fall back to on-chain verification via RPC.
   */
  async verifySiwe(
    req: FastifyRequest,
    reply: FastifyReply,
    current: Account,
    message: string,
    signature: Hex,
    clients: Record<number, PublicClient>,
    v1 = false,
  ): Promise<Account> {
    const fields = parseSiweMessage(message);
    const allowedChains = Object.values(NETWORKS).map((n) => n.chainId);
    if (!fields.address || !fields.nonce || !fields.chainId) throw Object.assign(new Error('Malformed SIWE message'), { statusCode: 400 });
    if (!allowedChains.includes(fields.chainId)) throw Object.assign(new Error('Unsupported chain in SIWE message'), { statusCode: 400 });
    const origin = v1 ? this.originFor(req, true) : undefined;
    if (v1 && (fields.chainId !== 4663 || fields.domain !== new URL(origin!).host || fields.uri !== origin || fields.statement !== SIWE_STATEMENT || fields.version !== '1'))
      throw Object.assign(new Error('SIWE chain, origin or statement mismatch'), { statusCode: 401 });
    const hosts = this.cfg.origins.map((o) => new URL(o).host);
    if (!fields.domain || !hosts.includes(fields.domain)) throw Object.assign(new Error('SIWE domain mismatch'), { statusCode: 400 });
    if (!validateSiweMessage({ message: fields, nonce: fields.nonce, domain: fields.domain, time: new Date() }))
      throw Object.assign(new Error('SIWE message expired or not yet valid'), { statusCode: 400 });
    const [n] = await this.db
      .select()
      .from(siweNonces)
      .where(and(eq(siweNonces.nonce, fields.nonce), eq(siweNonces.accountId, current.id), isNull(siweNonces.usedAt), gt(siweNonces.expiresAt, new Date())));
    if (!n) throw Object.assign(new Error('Invalid or reused nonce'), { statusCode: 401 });
    if (n.origin && !v1) throw Object.assign(new Error('Use v1 to verify this challenge'), { statusCode: 401 });
    if (v1 && (n.origin !== origin || n.sessionHash !== hash(this.readCookie(req) ?? '') || fields.issuedAt?.getTime() !== n.createdAt.getTime() || fields.expirationTime?.getTime() !== n.expiresAt.getTime()))
      throw Object.assign(new Error('SIWE challenge mismatch'), { statusCode: 401 });
    // Compare-and-set: only one concurrent verifier can consume a nonce.
    const consumed = await this.db.update(siweNonces).set({ usedAt: new Date() }).where(and(eq(siweNonces.nonce, fields.nonce), isNull(siweNonces.usedAt), gt(siweNonces.expiresAt, new Date()))).returning();
    if (!consumed.length) throw Object.assign(new Error('Invalid or reused nonce'), { statusCode: 401 });

    let ok = false;
    try {
      const rec = await recoverMessageAddress({ message, signature });
      ok = rec.toLowerCase() === fields.address.toLowerCase();
    } catch {
      ok = false;
    }
    if (!ok) {
      const client = clients[fields.chainId];
      if (client) ok = await client.verifySiweMessage({ message, signature, address: fields.address, nonce: fields.nonce, domain: fields.domain }).catch(() => false);
    }
    if (!ok) throw Object.assign(new Error('Signature verification failed'), { statusCode: 401 });

    const address = fields.address.toLowerCase();
    const [existing] = await this.db.select().from(accounts).where(eq(accounts.walletAddress, address));
    let account: Account;
    if (existing) {
      account = this.toAccount(existing);
    } else if (current.kind === 'guest') {
      // Another challenge may have upgraded this guest while the signature was
      // being checked. Never overwrite a wallet account during concurrent sign-in.
      const [u] = await this.db.update(accounts).set({ kind: 'wallet', walletAddress: address }).where(and(eq(accounts.id, current.id), eq(accounts.kind, 'guest'), isNull(accounts.walletAddress))).returning();
      if (u) account = this.toAccount(u);
      else {
        const [a] = await this.db.insert(accounts).values({ kind: 'wallet', walletAddress: address }).onConflictDoNothing({ target: accounts.walletAddress }).returning();
        const [existingWallet] = a ? [a] : await this.db.select().from(accounts).where(eq(accounts.walletAddress, address));
        account = this.toAccount(existingWallet!);
      }
    } else {
      const [a] = await this.db.insert(accounts).values({ kind: 'wallet', walletAddress: address }).returning();
      account = this.toAccount(a!);
    }
    // Rotate the session on privilege change.
    await this.destroySession(this.readCookie(req));
    const token = await this.createSession(account.id, req.headers['user-agent']);
    reply.setCookie(SESSION_COOKIE, token, this.cookieOptions());
    await this.db.insert(auditLog).values({ accountId: account.id, action: 'auth.siwe', data: { address, chainId: fields.chainId } });
    return account;
  }
}
