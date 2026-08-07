import { api, MOCKS } from './api';
/** Batches client-side latency samples (ui.* / ws.*) and reports uncaught errors to the server. */
const queue: { metric: string; value: number }[] = [];
let timer: number | null = null;
const local = new Map<string, number[]>();

export function track(metric: string, value: number) {
  if (!Number.isFinite(value) || value < 0) return;
  queue.push({ metric, value: Math.round(value * 10) / 10 });
  const arr = local.get(metric) ?? [];
  arr.push(value);
  if (arr.length > 200) arr.shift();
  local.set(metric, arr);
  if (queue.length >= 40) void flush();
  else if (timer === null) timer = window.setTimeout(() => void flush(), 5000);
}

export function localStats(metric: string) {
  const arr = [...(local.get(metric) ?? [])].sort((a, b) => a - b);
  if (!arr.length) return null;
  const q = (p: number) => arr[Math.min(arr.length - 1, Math.floor(p * arr.length))]!;
  return { count: arr.length, p50: q(0.5), p90: q(0.9), last: local.get(metric)!.at(-1)! };
}

async function flush() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  if (!queue.length) return;
  const samples = queue.splice(0, 50);
  try {
    await api(MOCKS ? '/telemetry' : '/api/telemetry', { body: { samples } });
  } catch {
    /* best effort */
  }
}

export function reportClientError(err: unknown) {
  const e = err instanceof Error ? err : new Error(String(err));
  void api(MOCKS ? '/telemetry' : '/api/telemetry', {
    method: 'POST',
    body: { error: { message: e.message.slice(0, 500), stack: e.stack?.slice(0, 4000), url: location.pathname } },
  }).catch(() => undefined);
}

export function installErrorReporting() {
  window.addEventListener('error', (e) => reportClientError(e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => reportClientError(e.reason));
  window.addEventListener('pagehide', () => void flush());
}
