import { custom, http, webSocket, type Transport } from 'viem';
import { routeRequest, supportsPublic, type Provider, type RpcRequest, type RouteContext } from './routes.js';
import { persistentUsageStore, createSqlUsageStore, type RpcUsageDb, type UsageRow, type UsageBatch, type UsageStore } from './usage.js';
import { safeError } from './safe-error.js';
import { isTransientRpcError } from './transient.js';
import { replyGuardFetch, RpcReplyError, type FetchFn } from './reply.js';
import { backoffDelay } from './backoff.js';
export interface RpcEnv {
  RPC_HTTP_URL?: string; RPC_PUBLIC_HTTP_URL?: string; RPC_WS_URL?: string;
  RPC_PAID_MAX_RPM?: string; RPC_PUBLIC_MAX_RPM?: string; RPC_PAID_DAILY_BUDGET?: string;
  RPC_SESSION_BUDGET?: string; RPC_WEIGHTS?: string; DATABASE_URL?: string; RPC_USAGE_DIR?: string; RPC_TIMEOUT_MS?: string;
}
export type RpcLog = (event: string, fields: Record<string, unknown>) => void;
export class RpcGuardError extends Error {
  /** `transient` marks a provider outage that outlasted the retry window, not a usage-store or request fault. */
  constructor(readonly code: 'rpc_budget_exhausted' | 'rpc_session_budget_reached' | 'shutdown_requested' | 'rpc_unavailable', message: string = code, readonly transient = false) { super(message); }
}
export type RpcStopReason = 'rpc_budget_exhausted' | 'rpc_session_budget_reached' | 'shutdown_requested';
/** viem wraps transport errors; inspect causes without trusting request text. */
function rpcGuardCode(error: unknown): RpcGuardError['code'] | undefined {
  const seen = new Set<unknown>();
  for (let depth = 0; error && depth < 16 && !seen.has(error); depth++) {
    seen.add(error);
    if (typeof error !== 'object') return undefined;
    const e = error as { code?: unknown; cause?: unknown };
    if (e.code === 'rpc_budget_exhausted' || e.code === 'rpc_session_budget_reached' || e.code === 'shutdown_requested' || e.code === 'rpc_unavailable') return e.code;
    error = e.cause;
  }
  return undefined;
}
export function rpcStopReason(error: unknown): RpcStopReason | undefined {
  const code=rpcGuardCode(error);return code==='rpc_unavailable'?undefined:code;
}
export const isRpcUnavailable = (error: unknown) => rpcGuardCode(error)==='rpc_unavailable';
/** Providers stayed unavailable for transient reasons (timeouts, 429/5xx, malformed replies); callers may back off and retry. */
export function isTransientRpcUnavailable(error: unknown): boolean {
  const seen = new Set<unknown>();
  for (let depth = 0; error && typeof error === 'object' && depth < 16 && !seen.has(error); depth++) {
    seen.add(error);
    const e = error as { code?: unknown; transient?: unknown; cause?: unknown };
    if (e.code === 'rpc_unavailable') return e.transient === true;
    if (e.code === 'rpc_budget_exhausted' || e.code === 'rpc_session_budget_reached' || e.code === 'shutdown_requested') return false;
    error = e.cause;
  }
  return false;
}
export const defaultPublicRpc = 'https://rpc.mainnet.chain.robinhood.com';
const numeric = (value: string | undefined, fallback: number, name: string, zero = false) => {
  const n = value === undefined || value === '' ? fallback : Number(value);
  if (!(n >= (zero ? 0 : 1)) || !Number.isFinite(n)) throw new Error(`Invalid ${name}`);
  return n;
};
export function rpcConfig(env: RpcEnv) {
  let weights: Record<string, number> = {};
  try {
    const input: unknown = JSON.parse(env.RPC_WEIGHTS || '{}');
    if (!input || Array.isArray(input) || typeof input !== 'object') throw new Error();
    for (const [method, weight] of Object.entries(input)) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(method) || typeof weight !== 'number' || !Number.isFinite(weight) || weight <= 0) throw new Error();
    }
    weights = input as Record<string, number>;
  } catch { throw new Error('Invalid RPC_WEIGHTS'); }
  // TODO(spec): Fill in the paid provider's per-method compute-unit table; unknown methods cost 1.
  return { weights, paidRpm: numeric(env.RPC_PAID_MAX_RPM, 1200, 'RPC_PAID_MAX_RPM'), publicRpm: numeric(env.RPC_PUBLIC_MAX_RPM, 300, 'RPC_PUBLIC_MAX_RPM'),
    // Every HTTP request, body included, is bounded; the meter adds a backstop for any transport.
    timeoutMs: numeric(env.RPC_TIMEOUT_MS, 10_000, 'RPC_TIMEOUT_MS'),
    dailyBudget: numeric(env.RPC_PAID_DAILY_BUDGET, 200_000, 'RPC_PAID_DAILY_BUDGET', true),
    sessionBudget: env.RPC_SESSION_BUDGET ? numeric(env.RPC_SESSION_BUDGET, 0, 'RPC_SESSION_BUDGET', true) : Infinity };
}
export interface MeterOptions {
  transientRetrySec?: number;
  /** Usage-store admission and flush deadline; a hung query must not hold a provider lane forever. */
  storeTimeoutMs?: number;
  /** HTTP fetch beneath the reply guard (tests inject provider replies here). */
  fetchFn?: FetchFn;
  db?: RpcUsageDb; standalone?: boolean; store?: UsageStore; log?: RpcLog; alert?: RpcLog; onSessionBudget?: () => void;
  now?: () => number; sleep?: (ms: number) => Promise<void>; random?: () => number;
}
/** Capacity one token buckets smooth traffic; all clients in a process share these buckets. */
export class RpcMeter {
  readonly config;
  readonly store: UsageStore;
  private readonly transientRetryMs: number;
  private readonly storeTimeoutMs: number;
  private readonly fetchFn?: FetchFn;
  private now; private sleep; private random; private log; private alert;
  // Consecutive transient paid failures; past the threshold, public-capable reads go public first.
  private paidFailures = 0; private paidDegradedUntil = 0; private paidCooldownMs = 0;
  private next: Record<Provider, number> = { paid: 0, public: 0 };
  private locks: Record<Provider, Promise<void>> = { paid: Promise.resolve(), public: Promise.resolve() };
  private activeAdmission: Record<Provider,boolean> = {paid:false,public:false};
  private queued: Record<Provider, number> = { paid: 0, public: 0 };
  private credits = new Map<string, number>();
  private pendingUsage = new Map<string, UsageBatch>();
  private flushing?: Promise<void>;
  private flushTimer?: ReturnType<typeof setInterval>;
  readonly timing = { admissionMs: 0, rpcMs: 0, rateWaitMs: 0, publicRateWaitMs:0, paidRateWaitMs:0 };
  private get leased() { return !!(this.store.lease && this.store.record && this.store.release); }
  private count(day: string, provider: Provider, method: string, units: number, unleasedUnits = 0) {
    const key = `${day}:${provider}:${method}`, row = this.pendingUsage.get(key) ?? { day,provider,method,calls:0,units:0,unleasedUnits:0 };
    row.calls++; row.units += units; row.unleasedUnits += unleasedUnits; this.pendingUsage.set(key,row);
  }
  private async flushUsage() {
    if (!this.leased) return;
    if (this.flushing) { await this.flushing; if (!this.pendingUsage.size) return; }
    const rows = [...this.pendingUsage.values()]; this.pendingUsage.clear();
    if (!rows.length) return;
    const write = this.deadline(this.store.record!(rows), this.storeTimeoutMs).catch(() => { this.stop('rpc_unavailable'); throw new RpcGuardError('rpc_unavailable', 'RPC usage persistence unavailable'); });
    this.flushing = write;
    try { await write; } finally { if (this.flushing === write) this.flushing = undefined; }
  }
  private sessionUnits = 0; private stopped = false;
  private reason?: RpcGuardError['code'];
  get isStopped() { return this.stopped; }
  /** Today's paid budget is spent: public-capable reads use the public lane until the UTC day changes. */
  get paidExhausted() { return this.exhaustedDay === this.day(); }
  get stopReason() { return this.reason; }
  private paidDay = ''; private paidTotal = 0;
  private notificationWrites = new Set<Promise<void>>();
  private pushLeases = new Set<string>();
  private warningDay = ''; private exhaustedDay = '';
  private minute: (UsageRow & { at: number })[] = [];
  private timer?: ReturnType<typeof setInterval>;
  private sockets = new Set<() => void>();
  private socketClosers = new WeakMap<object, () => void>();
  private onSessionBudget;
  private closing?: Promise<void>;
  private controller = new AbortController();
  constructor(readonly env: RpcEnv, options: MeterOptions = {}) {
    for (const [name, value] of Object.entries({ RPC_HTTP_URL: env.RPC_HTTP_URL, RPC_PUBLIC_HTTP_URL: env.RPC_PUBLIC_HTTP_URL, RPC_WS_URL: env.RPC_WS_URL })) {
      if (!value) continue;
      try { const url = new URL(value); if (!(name === 'RPC_WS_URL' ? ['ws:', 'wss:'] : ['http:', 'https:']).includes(url.protocol)) throw new Error(); }
      catch { throw new Error(`Invalid ${name}`); }
    }
    this.config = rpcConfig(env);
    this.transientRetryMs = numeric(options.transientRetrySec?.toString(),0,'transientRetrySec',true) * 1000;
    this.storeTimeoutMs = numeric(options.storeTimeoutMs?.toString(),30_000,'storeTimeoutMs');
    this.fetchFn = options.fetchFn;
    if (!options.store && !options.db && !options.standalone) throw new Error('RPC meter requires an application database/store, or standalone: true');
    this.store = options.db ? createSqlUsageStore(options.db) : options.store ?? persistentUsageStore(env);
    this.now = options.now ?? Date.now; this.sleep = options.sleep;
    this.random = options.random ?? Math.random;
    this.log = options.log ?? ((event, fields) => console.log(JSON.stringify({ event, ...fields })));
    this.alert = options.alert ?? ((event, fields) => this.log('alert', { reason: event, ...fields }));
    this.onSessionBudget = options.onSessionBudget ?? (() => {
      if (process.listenerCount('SIGINT')) process.kill(process.pid, 'SIGINT');
      else void this.close().finally(() => process.exit(0));
    });
  }
  private day() { return new Date(this.now()).toISOString().slice(0, 10); }
  start() {
    if (this.leased && !this.flushTimer) { this.flushTimer = setInterval(() => { void this.flushUsage().catch(() => this.log('rpc_usage_unavailable', {})); }, 3000); this.flushTimer.unref(); }
    if (!this.timer) { this.timer = setInterval(() => { void this.summary().catch(() => this.log('rpc_usage_unavailable', {})); }, 60_000); this.timer.unref(); }
  }
  private signalSession() {
    if (this.stopped) return;
    this.stop('rpc_session_budget_reached');
    this.log('rpc_session_budget_reached', { units: this.sessionUnits, budget: this.config.sessionBudget });
    this.onSessionBudget();
  }
  private closeSockets() {
    for (const close of this.sockets) { try { close(); } catch { this.log('rpc_socket_close_error', {}); } }
    this.sockets.clear();
  }
  stop(reason: RpcGuardError['code'] = 'shutdown_requested') { this.reason ??= reason; this.stopped = true; this.controller.abort(); this.closeSockets(); }
  private stopError() { return new RpcGuardError(this.reason ?? 'shutdown_requested'); }
  private observePaid(day: string, total: number, closed = false) {
    if (this.paidDay !== day) { this.paidDay = day; this.paidTotal = 0; }
    this.paidTotal = Math.max(this.paidTotal, total);
    if (this.paidTotal >= this.config.dailyBudget * .8 && this.warningDay !== day) {
      this.warningDay = day; this.log('rpc_budget_warning', { units: this.paidTotal, budget: this.config.dailyBudget }); this.alert('rpc_budget_warning', { provider: 'paid' });
    }
    if ((closed || this.paidTotal >= this.config.dailyBudget) && this.exhaustedDay !== day) {
      this.exhaustedDay = day; this.closeSockets(); this.log('rpc_budget_exhausted', { provider: 'paid' }); this.alert('rpc_budget_exhausted', { provider: 'paid' });
    }
  }
  private refillPushLease(day: string, units: number) {
    const key = `${day}:paid`;
    if (this.stopped || this.pushLeases.has(key) || (this.credits.get(key) ?? 0) > Math.max(50,units)) return;
    this.pushLeases.add(key);
    // Serialize lease refills with paid admissions; delivery itself remains synchronous.
    const previous = this.locks.paid; let release!: () => void;
    this.locks.paid = new Promise(resolve => { release = resolve; });
    const write = (async () => {
      await previous;
      try {
        if (this.stopped) return;
        const credit = this.credits.get(key) ?? 0;
        if (credit > Math.max(50,units)) return;
        const result = await this.deadline(this.store.lease!(day,'paid',Math.max(100,units)-credit,Math.max(Number.EPSILON,units-credit),this.config.dailyBudget),this.storeTimeoutMs);
        if (!result.allowed) { this.observePaid(day,result.total-(this.credits.get(key)??0),true); return; }
        this.credits.set(key,(this.credits.get(key)??0)+result.units);
      } finally { release(); }
    })().catch(() => { this.log('rpc_usage_unavailable',{}); this.stop('rpc_unavailable'); });
    this.notificationWrites.add(write);
    void write.finally(() => { this.pushLeases.delete(key); this.notificationWrites.delete(write); });
  }
  /** Pushes have already been billed: count immediately, persist without throttling or rejecting delivery. */
  private notification() {
    const method = 'eth_subscription', day = this.day();
    const units = Object.hasOwn(this.config.weights, method) ? this.config.weights[method] : 1;
    this.sessionUnits += units;
    this.minute.push({ provider: 'paid', method, calls: 1, units, at: this.now() });
    // Infinity records incurred cost even if this push crosses the remaining daily allowance.
    if (this.leased) {
      const key = `${day}:paid`, credit = this.credits.get(key) ?? 0, covered = Math.min(credit,units);
      this.credits.set(key,credit-covered);
      this.count(day, 'paid', method, units, units-covered);
      // Refill ahead of exhaustion. If persistence falls behind, close instead of receiving
      // an unbounded number of already-billed pushes without a reservation.
      if (covered < units) this.closeSockets();
      this.refillPushLease(day,units);
      if (this.sessionUnits >= this.config.sessionBudget) this.signalSession();
      this.observePaid(day, (this.paidDay === day ? this.paidTotal : 0) + units);
      return;
    }
    const write = Promise.resolve().then(() => this.store.reserve(day, 'paid', method, units, Infinity)).then(result => {
      if (day === this.day()) this.observePaid(day, result.total);
    }).catch(() => {
      this.log('rpc_usage_unavailable', {}); this.stop('rpc_unavailable');
    });
    this.notificationWrites.add(write);
    void write.finally(() => this.notificationWrites.delete(write));
    if (this.sessionUnits >= this.config.sessionBudget) this.signalSession();
    this.observePaid(day, (this.paidDay === day ? this.paidTotal : 0) + units);
  }
  private async flushNotifications() { while (this.notificationWrites.size) await Promise.all([...this.notificationWrites]); }
  /** Reject when work outlives its deadline; the timer is cleared as soon as the work settles. */
  private deadline<T>(work: Promise<T>, ms: number, error: () => Error = () => new Error('Deadline exceeded')): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    return Promise.race([work, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(error()), ms); })]).finally(() => clearTimeout(timer));
  }
  private paidDegraded() { return this.now() < this.paidDegradedUntil; }
  private paidFailed() {
    if (++this.paidFailures < 3 || this.paidDegraded()) return;
    // Each failed probe after a cool-down doubles it, up to ten minutes.
    this.paidCooldownMs = Math.min(600_000, this.paidCooldownMs ? this.paidCooldownMs * 2 : 60_000);
    this.paidDegradedUntil = this.now() + this.paidCooldownMs;
    this.log('rpc_paid_degraded', { failures: this.paidFailures, public_first_ms: this.paidCooldownMs });
  }
  private paidSucceeded() {
    if (this.paidCooldownMs) this.log('rpc_paid_recovered', { failures: this.paidFailures });
    this.paidFailures = 0; this.paidCooldownMs = 0; this.paidDegradedUntil = 0;
  }
  private async wait(ms: number) {
    if (this.stopped) throw this.stopError();
    const signal = this.controller.signal;
    if (this.sleep !== undefined) {
      let abort!: () => void;
      try {
        await Promise.race([this.sleep(ms), new Promise<never>((_, reject) => {
          abort = () => reject(this.stopError());
          signal.addEventListener('abort', abort, { once: true });
        })]);
      } finally { signal.removeEventListener('abort', abort); }
    } else {
      await new Promise<void>((resolve, reject) => {
        const abort = () => { clearTimeout(timer); reject(this.stopError()); };
        const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
        signal.addEventListener('abort', abort, { once: true });
      });
    }
  }
  async usage() {
    await this.flushNotifications();
    await this.flushUsage();
    const day = this.day();
    let today: UsageRow[];
    try { today = await this.store.today(day); } catch { throw new RpcGuardError('rpc_unavailable', 'RPC usage persistence unavailable'); }
    const paidUnits = today.filter(r => r.provider === 'paid').reduce((sum, r) => sum + r.units, 0);
    this.observePaid(day, paidUnits);
    return { day, today, paidOpen: this.exhaustedDay !== day && paidUnits < this.config.dailyBudget, budgetLeft: Math.max(0, this.config.dailyBudget - paidUnits), sessionUnits: this.sessionUnits };
  }
  async summary() {
    this.minute = this.minute.filter(r => r.at > this.now() - 60_000);
    const rows = new Map<string, UsageRow>();
    for (const r of this.minute) { const key = `${r.provider}:${r.method}`, old = rows.get(key) ?? { provider: r.provider, method: r.method, calls: 0, units: 0 }; old.calls += r.calls; old.units += r.units; rows.set(key, old); }
    const usage = await this.usage(); this.log('rpc_usage', { ...usage, lastMinute: [...rows.values()] }); return usage;
  }
  close(): Promise<void> {
    return this.closing ??= (async () => {
      this.stop();
      if (this.timer) clearInterval(this.timer);
      if (this.flushTimer) clearInterval(this.flushTimer);
      await Promise.all(Object.values(this.locks));
      try {
        await this.flushNotifications();
        await this.flushUsage();
        if (this.leased) for (const [key, units] of this.credits) { const [day,provider] = key.split(':'); await this.store.release!(day,provider as Provider,units); }
        this.credits.clear();
        await this.summary();
      } finally { await this.store.close?.(); }
    })();
  }
  /** Admission is serialized within the process; the SQL store serializes across processes. */
  private async admit(provider: Provider, request: RpcRequest, spill = false): Promise<{provider:Provider;finalCall:boolean}> {
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(request.method)) throw new RpcGuardError('rpc_unavailable', 'Invalid RPC method');
    const began = performance.now();
    const previous = this.locks[provider]; let release!: () => void;
    this.queued[provider]++;
    this.locks[provider] = new Promise(resolve => { release = resolve; }); await previous;
    this.activeAdmission[provider]=true;
    try {
      if (this.stopped) throw this.stopError();
      const units = Object.hasOwn(this.config.weights, request.method) ? this.config.weights[request.method] : 1;
      if (this.sessionUnits + units > this.config.sessionBudget) { this.signalSession(); throw new RpcGuardError('rpc_session_budget_reached'); }
      if (provider === 'paid' && this.exhaustedDay === this.day()) throw new RpcGuardError('rpc_budget_exhausted');
      if (spill && provider === 'paid' && this.queued.public === 0 && this.next.public <= this.now()) return await this.admit('public',request);
      const now = this.now(), start = Math.max(now, this.next[provider]);
      this.next[provider] = start + 60_000 / (provider === 'paid' ? this.config.paidRpm : this.config.publicRpm);
      if (start > now) { this.timing.rateWaitMs += start-now; this.timing[provider==='public'?'publicRateWaitMs':'paidRateWaitMs']+=start-now; await this.wait(start - now); }
      if (this.stopped) throw this.stopError();
      // A queued spill may find a replenished public token at dispatch time.
      if (spill && provider === 'paid' && this.queued.public === 0 && this.next.public <= this.now()) {
        this.next.paid = start;
        return await this.admit('public',request);
      }
      const day = this.day();
      if (provider === 'paid' && this.exhaustedDay === day) throw new RpcGuardError('rpc_budget_exhausted');
      if (this.sessionUnits + units > this.config.sessionBudget) { this.signalSession(); throw new RpcGuardError('rpc_session_budget_reached'); }
      if (this.leased) {
        if (provider === 'paid') {
          const key = `${day}:${provider}`;
          let credit = this.credits.get(key) ?? 0;
          if (credit < units) {
            // A single atomic lease outside ChainDb.tx; no database work on cached admissions.
            let reserved;
            try { reserved = await this.deadline(this.store.lease!(day,provider,Math.max(100,units)-credit,units-credit,this.config.dailyBudget),this.storeTimeoutMs); }
            catch { throw new RpcGuardError('rpc_unavailable', 'RPC usage persistence unavailable'); }
            if (!reserved.allowed) { this.observePaid(day,reserved.total-credit,true); throw new RpcGuardError('rpc_budget_exhausted'); }
            credit += reserved.units;
            this.credits.set(key,credit);
          }
          if (this.stopped) throw this.stopError();
          if (this.sessionUnits + units > this.config.sessionBudget) { this.signalSession(); throw new RpcGuardError('rpc_session_budget_reached'); }
          this.credits.set(key,credit-units);
          this.observePaid(day,(this.paidDay === day ? this.paidTotal : 0)+units);
        }
        this.count(day,provider,request.method,units,provider === 'public' ? units : 0);
      } else {
        let reserved;
        try { reserved = await this.deadline(this.store.reserve(day, provider, request.method, units, provider === 'paid' ? this.config.dailyBudget : Infinity),this.storeTimeoutMs); }
        catch { throw new RpcGuardError('rpc_unavailable', 'RPC usage persistence unavailable'); }
        if (provider === 'paid') this.observePaid(day, reserved.total, !reserved.allowed);
        if (!reserved.allowed) throw new RpcGuardError('rpc_budget_exhausted');
      }
      // Different providers may finish admission concurrently; session accounting is atomic in memory.
      if (this.sessionUnits + units > this.config.sessionBudget) { this.signalSession(); throw new RpcGuardError('rpc_session_budget_reached'); }
      // Persistence may outlast the reserved slot. Base the next slot on actual
      // dispatch readiness so the following admission cannot form a catch-up burst.
      this.next[provider]=Math.max(this.next[provider],this.now()+60_000/(provider==='paid'?this.config.paidRpm:this.config.publicRpm));
      this.sessionUnits += units;
      this.minute.push({ provider, method: request.method, calls: 1, units, at: this.now() });
      return {provider,finalCall:this.sessionUnits >= this.config.sessionBudget};
    } finally { this.activeAdmission[provider]=false;this.queued[provider]--; this.timing.admissionMs += performance.now()-began; release(); }
  }
  async attempt<T>(provider: Provider, request: RpcRequest, send: (provider:Provider) => Promise<T>, spill = false): Promise<T> {
    const admission = await this.admit(provider, request,spill);
    if (this.stopped) throw this.stopError();
    const began = performance.now();
    // Backstop beyond the transport's own timeout: no admitted request may wait forever.
    const limit = this.config.timeoutMs + 5_000;
    try { return await this.deadline(send(admission.provider), limit, () => new RpcReplyError('timeout', true, `RPC request timed out after ${limit} ms`)); }
    finally { this.timing.rpcMs += performance.now()-began; if (admission.finalCall) this.signalSession(); }
  }
  async request(request: RpcRequest | readonly RpcRequest[], send: Record<Provider, (r: RpcRequest) => Promise<unknown>>, context: RouteContext = 'default'): Promise<unknown> {
    if (Array.isArray(request)) return Promise.all(request.map(r => this.request(r, send, context)));
    const r = request as RpcRequest;
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(r.method)) throw new RpcGuardError('rpc_unavailable', 'Invalid RPC method');
    let provider = routeRequest(r, context);
    // Queue against the earliest free slot on either bucket. Reserving future public
    // slots keeps it busy even while paid-only enrichment is queued separately.
    if ((context === 'head' || context === 'head_timestamp') && provider === 'public' && this.env.RPC_HTTP_URL && this.config.dailyBudget > 0 && this.exhaustedDay !== this.day()) {
      const ready = (p: Provider) => Math.max(this.now(),this.next[p]) + Math.max(0,this.queued[p]-(this.activeAdmission[p]?1:0))*60_000/(p==='paid'?this.config.paidRpm:this.config.publicRpm);
      const publicSlot=ready('public')<=this.now()+Math.min(1000,2*60_000/this.config.publicRpm);
      if (!publicSlot && ready('paid') < ready('public') && !this.paidDegraded()) provider='paid';
    }
    if (!this.env.RPC_HTTP_URL && provider === 'paid') {
      if (!supportsPublic(r, context)) throw new RpcGuardError('rpc_budget_exhausted');
      provider = 'public';
    }
    if (context === 'public' && !supportsPublic(r, context)) throw new RpcGuardError('rpc_budget_exhausted');
    // Paid keeps failing: public-capable reads queue on the public lane (its own rate and metering) first.
    if (provider === 'paid' && this.paidDegraded() && supportsPublic(r, context)) provider = 'public';
    let switched = false;
    let transientSince: number | undefined, retries = 0;
    for (;;) {
      let actualProvider = provider;
      const spill = !switched && transientSince == null && (context === 'head' || context === 'head_timestamp') && routeRequest(r,context) === 'public';
      try {
        const result = await this.attempt(provider, r, actual => { actualProvider=actual;return send[actual](r); },spill);
        if (actualProvider === 'paid') this.paidSucceeded();
        return result;
      }
      catch (error) {
        provider = actualProvider;
        if (this.stopped) throw this.stopError();
        if (error instanceof RpcGuardError && error.code !== 'rpc_budget_exhausted') throw error;
        const reason = safeError(error);
        const transient = !(error instanceof RpcGuardError) && isTransientRpcError(error);
        if (transient && provider === 'paid') this.paidFailed();
        if (transient && this.transientRetryMs > 0) {
          transientSince ??= this.now();
          if (this.now() - transientSince >= this.transientRetryMs) throw new RpcGuardError('rpc_unavailable',reason,true);
        }
        if (!(transient && this.transientRetryMs > 0) && context !== 'head' && context !== 'head_timestamp' && provider === 'public' && /rate limit hit.*reset in 60 seconds/i.test(reason)) {
          await this.wait(60_000 + Math.floor(this.random() * 1000)); continue;
        }
        if (!switched && provider === 'paid' && supportsPublic(r, context)) { provider = 'public'; switched = true; continue; }
        if (!switched && provider === 'public' && this.env.RPC_HTTP_URL && context !== 'public') { provider = 'paid'; switched = true; continue; }
        if (error instanceof RpcGuardError) throw error;
        if (transient && transientSince != null && this.transientRetryMs > 0) {
          const remaining = this.transientRetryMs - (this.now()-transientSince);
          const delay = Math.min(remaining,backoffDelay(retries++,this.random));
          this.log('rpc_transient_retry',{provider,method:r.method,retry:retries,backoff_ms:delay});
          await this.wait(delay);
          if (this.now()-transientSince >= this.transientRetryMs) throw new RpcGuardError('rpc_unavailable',reason,true);
          switched = false;
          if (provider === 'paid' && supportsPublic(r,context)) provider = 'public';
          else if (provider === 'public' && this.env.RPC_HTTP_URL && context !== 'public') provider = 'paid';
          continue;
        }
        // Never preserve viem causes: they contain URLs and full request bodies.
        throw new RpcGuardError('rpc_unavailable', reason, transient);
      }
    }
  }
  transport(context: RouteContext = 'default', publicUrl?: string): Transport {
    return options => {
      // Batched replies are checked against their requests before viem pairs them up (see reply.ts).
      const config = { retryCount: 0, timeout: this.config.timeoutMs, fetchFn: replyGuardFetch(this.fetchFn), batch: { batchSize: 100, wait: 1 } };
      const paid = this.env.RPC_HTTP_URL ? http(this.env.RPC_HTTP_URL, config)(options) : undefined;
      const publicRpc = http(publicUrl ?? this.env.RPC_PUBLIC_HTTP_URL ?? defaultPublicRpc, config)(options);
      return custom({ request: (r: RpcRequest) => this.request(r, {
        paid: request => paid ? paid.request(request as never, { dedupe: false }) : Promise.reject(new RpcGuardError('rpc_budget_exhausted')),
        public: request => publicRpc.request(request as never, { dedupe: false }),
      }, context) }, { retryCount: 0 })(options);
    };
  }
  /** Disable hidden socket reconnects; the follower can restart through metered admission. */
  wsTransport(): Transport {
    return options => {
      const raw = webSocket(this.env.RPC_WS_URL, { retryCount: 0, reconnect: false, keepAlive: false })(options);
      const trackSocket = async () => {
        const socket = await raw.value!.getRpcClient();
        let close = this.socketClosers.get(socket);
        if (!close) { close = () => socket.close(); this.socketClosers.set(socket, close); }
        this.sockets.add(close); return close;
      };
      const guarded = custom({ request: (r: RpcRequest) => this.attempt('paid', r, async () => {
        try {
          const close = await trackSocket();
          try { return await raw.request(r as never, { dedupe: false }); }
          finally { if (this.stopped || this.exhaustedDay === this.day()) { close(); this.sockets.delete(close); } }
        } catch (e) { if (e instanceof RpcGuardError) throw e; throw new RpcGuardError('rpc_unavailable', safeError(e)); }
      }) }, { retryCount: 0 })(options);
      return { ...guarded, config: { ...guarded.config, type: 'webSocket' }, value: {
        subscribe: (input: Parameters<NonNullable<typeof raw.value>['subscribe']>[0]) => this.attempt('paid', { method: 'eth_subscribe', params: input.params }, async () => {
          try {
            const close = await trackSocket();
            const subscription = await raw.value!.subscribe({ ...input,
              onData: data => { this.notification(); input.onData(data); },
              onError: e => input.onError?.(this.stopped ? this.stopError() : this.exhaustedDay === this.day() ? new RpcGuardError('rpc_budget_exhausted') : new RpcGuardError('rpc_unavailable', safeError(e))),
            });
            if (this.stopped || this.exhaustedDay === this.day()) { close(); this.sockets.delete(close); }
            return { subscriptionId: subscription.subscriptionId, unsubscribe: async () => {
              // Closing a socket sends no JSON-RPC call and requires no paid allowance.
              if (this.stopped || this.exhaustedDay === this.day()) { close(); this.sockets.delete(close); return { jsonrpc: '2.0', id: 0, result: true }; }
              try { return await this.attempt('paid', { method: 'eth_unsubscribe' }, () => subscription.unsubscribe()); }
              catch (e) { throw new RpcGuardError('rpc_unavailable', safeError(e)); }
              finally { close(); this.sockets.delete(close); }
            } };
          } catch (e) { if (e instanceof RpcGuardError) throw e; throw new RpcGuardError('rpc_unavailable', safeError(e)); }
        }),
      } };
    };
  }
}
