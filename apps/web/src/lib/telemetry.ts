import {
  TelemetryEventSchema, TelemetrySampleSchema, telemetryRoute, telemetryErrorKind,
  type Telemetry, type TelemetryEvent, type TelemetrySample,
} from '@eko/shared';
import { api, MOCKS } from './api';
import { useShell } from '../store/shell';

const samples: TelemetrySample[] = [];
const events: TelemetryEvent[] = [];
let error: Telemetry['error'];
let timer: ReturnType<typeof setTimeout> | null = null;
let sending = false;
const local = new Map<string, number[]>();
const MAX_QUEUE = 200;
function schedule() {
  if (timer === null) timer = setTimeout(() => void flushTelemetry(), 5000);
}
function enqueue<T>(queue: T[], item: T) {
  queue.push(item);
  if (queue.length > MAX_QUEUE) queue.shift();
  if (queue.length >= 40) void flushTelemetry();
  else schedule();
}

/** Closed client latency names; unknown labels and values never leave the browser. */
export function track(metric: string, value: number, demo = MOCKS) {
  const parsed = TelemetrySampleSchema.safeParse({ metric, value: Math.round(value * 10) / 10, demo: MOCKS || demo });
  if (!Number.isFinite(value) || value < 0 || !parsed.success) return;
  enqueue(samples, parsed.data);
  const arr = local.get(metric) ?? [];
  arr.push(value);
  if (arr.length > 200) arr.shift();
  local.set(metric, arr);
}
export function localStats(metric: string) {
  const arr = [...(local.get(metric) ?? [])].sort((a, b) => a - b);
  if (!arr.length) return null;
  const q = (p: number) => arr[Math.min(arr.length - 1, Math.floor(p * arr.length))]!;
  return { count: arr.length, p50: q(0.5), p90: q(0.9), last: local.get(metric)!.at(-1)! };
}

type EventInput<T = TelemetryEvent> = T extends TelemetryEvent
  ? Pick<T, 'name' | 'props'> & { demo?: boolean } : never;
let sessionId: string | undefined;
function telemetrySession() {
  if (sessionId) return sessionId;
  // Never reuse arbitrary storage content as an analytics identifier.
  try { sessionId = sessionStorage.getItem('eko_telemetry_session') ?? undefined; } catch { /* storage unavailable */ }
  if (!TelemetryEventSchema.options[0].shape.sessionId.safeParse(sessionId).success) sessionId = crypto.randomUUID();
  try { sessionStorage.setItem('eko_telemetry_session', sessionId!); } catch { /* storage unavailable */ }
  return sessionId!;
}
export function trackEvent(input: EventInput) {
  const me = useShell.getState().me;
  const build = import.meta.env.VITE_BUILD_SHA ?? 'unknown';
  const candidate = {
    ts: Date.now(), route: telemetryRoute(typeof location === 'undefined' ? 'other' : location.pathname),
    sessionId: telemetrySession(), buildSha: /^(?:[a-f0-9]{7,40}|unknown)$/.test(build) ? build : 'unknown',
    tier: me?.entitlements.tier ?? 'listener', trial: me?.trial.status === 'active', device: 'unknown',
    ...input, demo: MOCKS || !!input.demo,
  };
  const parsed = TelemetryEventSchema.safeParse(candidate);
  if (parsed.success) enqueue(events, parsed.data);
}

export async function flushTelemetry() {
  if (timer !== null) { clearTimeout(timer); timer = null; }
  if (sending || (!samples.length && !events.length && !error)) return;
  const body: Telemetry = { samples: samples.splice(0, 50), events: events.splice(0, 50), ...(error ? { error } : {}) };
  error = undefined;
  sending = true;
  try { await api('/telemetry', { body }); } catch { /* best effort, no recursive error report */ }
  finally {
    sending = false;
    if (samples.length || events.length || error) schedule();
  }
}

export function reportClientError(err: unknown) {
  // No message/stack/path/query, wallet/order context or string coercion of untrusted errors.
  error = { kind: telemetryErrorKind(err), demo: MOCKS };
  schedule();
}
export function installErrorReporting() {
  window.addEventListener('error', (e) => reportClientError(e.error));
  window.addEventListener('unhandledrejection', (e) => reportClientError(e.reason));
  window.addEventListener('pagehide', () => void flushTelemetry());
}
