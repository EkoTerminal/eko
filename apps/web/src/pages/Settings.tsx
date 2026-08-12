import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_PREFERENCES,
  NETWORKS,
  PreferencesSchema,
  formatDuration,
  formatMs,
  formatUsd,
  shortAddress,
  type NetworkHealth,
  type Preferences,
  type SystemHealth,
} from '@eko/shared';
import { useConnection } from 'wagmi';
import { api } from '../lib/api';
import { navigate } from '../lib/router';
import { localStats } from '../lib/telemetry';
import { prefersReducedMotion, useApp } from '../store/app';
import { useOnboarding } from '../store/onboarding';
import { requestMode } from '../components/Header';
import { IconAlert, IconClose, IconExternal, IconInfo, IconLock, IconPlus } from '../components/icons';
import { Kv, Panel, Sub, Switch, TableWrap, fmtAgo, fmtClock } from '../components/lab/ui';

const SECTIONS = [
  { id: 'set-trading', label: 'Trade amounts' },
  { id: 'set-wallet', label: 'Wallet & network' },
  { id: 'set-display', label: 'Display' },
  { id: 'set-help', label: 'Help' },
  { id: 'set-diag', label: 'Diagnostics' },
] as const;

interface MetricSummary {
  metric: string;
  description: string;
  count: number;
  p50: number | null;
  p90: number | null;
  p99: number | null;
  mean: number | null;
  last: number | null;
  lastAt: number | null;
}

type HealthResp = SystemHealth & { ok: boolean; version: string; uptimeSec: number; db: string };

export function Settings() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const [metrics, setMetrics] = useState<{ list: MetricSummary[]; at: number } | null>(null);
  const [srvHealth, setSrvHealth] = useState<HealthResp | null>(null);
  const [errors, setErrors] = useState<{ metrics?: string; health?: string }>({});
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    const [m, h] = await Promise.allSettled([
      api<{ metrics: MetricSummary[]; at: number }>('/api/metrics'),
      api<HealthResp>('/api/health'),
    ]);
    if (m.status === 'fulfilled') setMetrics({ list: m.value.metrics, at: m.value.at });
    if (h.status === 'fulfilled') setSrvHealth(h.value);
    setErrors({
      metrics: m.status === 'rejected' ? (m.reason as Error).message : undefined,
      health: h.status === 'rejected' ? (h.reason as Error).message : undefined,
    });
    tick((x) => x + 1);
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 10_000);
    return () => clearInterval(t);
  }, [load]);

  // Highlight the section currently in view.
  useEffect(() => {
    const root = pageRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id);
      },
      { root, rootMargin: '-8% 0px -70% 0px' },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  // Deep links to retained settings sections.
  useEffect(() => {
    const id = location.hash.slice(1);
    if (id && SECTIONS.some((x) => x.id === id)) window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 50);
  }, []);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    setActive(id);
    el.focus({ preventScroll: true });
  };

  return (
    <div className="page" ref={pageRef}>
      <div className="page-inner set">
        <header className="page-head">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-sub">Your trade amounts, wallet, and display preferences.</p>
          </div>
        </header>

        <div className="set-layout">
          <nav className="set-nav" aria-label="Settings sections">
            {SECTIONS.map((s) => (
              <button key={s.id} className={`set-nav-item ${active === s.id ? 'is-on' : ''}`} aria-current={active === s.id ? 'true' : undefined} onClick={() => jump(s.id)}>
                {s.label}
              </button>
            ))}
          </nav>

          <div className="set-main">
            <section className="section set-sec" id="set-trading" tabIndex={-1} aria-labelledby="set-trading-h">
              <SectionHead id="set-trading-h" title="Trade amounts" note="The Buy and Sell presets on the Trade screen" />
              <PresetsForm />
            </section>

            <section className="section set-sec" id="set-wallet" tabIndex={-1} aria-labelledby="set-wallet-h">
              <SectionHead id="set-wallet-h" title="Wallet & network" note="Only needed for Live" />
              <WalletNetwork />
            </section>

            <section className="section set-sec" id="set-display" tabIndex={-1} aria-labelledby="set-display-h">
              <SectionHead id="set-display-h" title="Display" note="Saved as you change them" />
              <Display />
            </section>

            <section className="section set-sec" id="set-help" tabIndex={-1} aria-labelledby="set-help-h">
              <SectionHead id="set-help-h" title="Help" />
              <div className="panel set-form">
                <div className="set-row">
                  <div className="set-row-label">
                    <strong>Guided tour</strong>
                    <p>A short tour of Radar, the guarded trade, and your positions.</p>
                  </div>
                  <div className="set-row-control">
                    <button
                      className="btn primary"
                      onClick={() => {
                        navigate('/trade');
                        useOnboarding.getState().startTour();
                      }}
                    >
                      Replay the tour
                    </button>
                  </div>
                </div>
                <div className="set-row">
                  <div className="set-row-label">
                    <strong>Help centre</strong>
                    <p>How EKO works, what each term means, and how to go Live.</p>
                  </div>
                  <div className="set-row-control set-inline">
                    <button className="btn" onClick={() => useOnboarding.getState().openHelp()}>
                      Open help
                    </button>
                    <button className="btn ghost" onClick={() => useApp.getState().set({ helpOpen: true })}>
                      Keyboard shortcuts
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="section set-sec" id="set-diag" tabIndex={-1} aria-labelledby="set-diag-h">
              <SectionHead id="set-diag-h" title="Diagnostics" note="For whoever runs this server" />
              <details className="set-diag">
                <summary>Latency and system health</summary>
                <div className="set-diag-body">
                  <h3 className="set-sub">
                    Latency <span className="muted num">{metrics ? `· updated ${fmtClock(metrics.at)}` : ''}</span>
                  </h3>
                  <Latency metrics={metrics?.list ?? null} error={errors.metrics} />
                  <h3 className="set-sub">System health</h3>
                  <Health srv={srvHealth} error={errors.health} />
                  <h3 className="set-sub">About</h3>
                  <About />
                </div>
              </details>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ id, title, note, action }: { id: string; title: string; note?: ReactNode; action?: ReactNode }) {
  return (
    <div className="section-head set-sec-head">
      <h2 className="section-title" id={id}>
        {title}
      </h2>
      {note ? <span className="section-note">{note}</span> : null}
      <span className="grow" />
      {action}
    </div>
  );
}

// ═════════════════════════ Presets ═════════════════════════

type FieldErrors = Partial<Record<keyof Preferences, string>>;

function validate(p: Preferences): FieldErrors {
  const e: FieldErrors = {};
  const list = (k: keyof Preferences, xs: number[], min: number, max: number, lo: number, hi: number, int: boolean, what: string) => {
    if (xs.length < min || xs.length > max) e[k] = `Between ${min} and ${max} values`;
    else if (xs.some((x) => !Number.isFinite(x) || x < lo || x > hi || (int && !Number.isInteger(x)))) e[k] = what;
  };
  list('quickAmounts', p.quickAmounts, 1, 6, 0.01, 1e9, false, 'Each amount must be a positive number');
  if (!Number.isInteger(p.defaultSlippageBps) || p.defaultSlippageBps < 1 || p.defaultSlippageBps > 500) e.defaultSlippageBps = 'Whole basis points from 1 to 500';
  if (!Number.isFinite(p.confirmLargeTradeUsd) || p.confirmLargeTradeUsd <= 0) e.confirmLargeTradeUsd = 'Must be a positive amount';
  return e;
}

const sortNums = (xs: number[]) => [...xs].sort((a, b) => a - b);

function PresetsForm() {
  const prefs = useApp((s) => s.preferences);
  const setPreferences = useApp((s) => s.setPreferences);
  const toast = useApp((s) => s.toast);
  const [draft, setDraft] = useState<Preferences>(prefs);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(prefs);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    if (!dirtyRef.current) setDraft(prefs);
  }, [prefs]);

  const errs = validate(draft);
  const invalid = Object.keys(errs).length > 0;
  const set = <K extends keyof Preferences>(k: K, v: Preferences[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    if (invalid) return;
    const next: Preferences = {
      ...draft,
      quickAmounts: sortNums(draft.quickAmounts),
      defaultMode: draft.defaultMode === 'live' ? 'paper' : draft.defaultMode,
    };
    const parsed = PreferencesSchema.safeParse(next);
    if (!parsed.success) {
      toast({ kind: 'error', title: 'Preferences not saved', body: parsed.error.issues[0]?.message ?? 'Invalid value' });
      return;
    }
    const patch: Partial<Preferences> = {};
    for (const k of Object.keys(parsed.data) as (keyof Preferences)[]) {
      if (JSON.stringify(parsed.data[k]) !== JSON.stringify(prefs[k])) (patch as Record<string, unknown>)[k] = parsed.data[k];
    }
    setSaving(true);
    try {
      await setPreferences(patch);
      setDraft(parsed.data);
      toast({ kind: 'ok', title: 'Preferences saved', body: `${Object.keys(patch).length} setting${Object.keys(patch).length === 1 ? '' : 's'} updated.` });
    } catch (e) {
      toast({ kind: 'error', title: 'Preferences not saved', body: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="panel set-form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      noValidate
    >
      <SettingRow title="Trade amounts" desc="The dollar presets above Buy and Sell. One tap trades the selected amount — USDG on Live. Up to 6." error={errs.quickAmounts}>
        <NumberList label="Trade amount" values={draft.quickAmounts} onChange={(v) => set('quickAmounts', v)} max={6} step={10} prefix="$" invalid={!!errs.quickAmounts} />
      </SettingRow>
      <SettingRow title="Max slippage (Live)" desc="A live swap is cancelled if the price moves further than this before it lands." error={errs.defaultSlippageBps}>
        <div className="set-inline">
          <input
            className="input num set-input-s"
            type="number"
            min={1}
            max={500}
            step={1}
            value={Number.isFinite(draft.defaultSlippageBps) ? draft.defaultSlippageBps : ''}
            onChange={(e) => set('defaultSlippageBps', e.target.valueAsNumber)}
            aria-label="Default slippage in basis points"
            aria-invalid={!!errs.defaultSlippageBps}
          />
          <span className="set-unit">bps</span>
          <span className="set-hint num">{Number.isFinite(draft.defaultSlippageBps) ? `= ${(draft.defaultSlippageBps / 100).toFixed(2)}%` : ''}</span>
        </div>
      </SettingRow>
      <SettingRow title="Ask before large Live trades" desc="Live trades worth more than this wait for an extra Confirm before your wallet opens." error={errs.confirmLargeTradeUsd}>
        <div className="set-inline">
          <span className="set-unit">$</span>
          <input
            className="input num set-input-m"
            type="number"
            min={1}
            step={100}
            value={Number.isFinite(draft.confirmLargeTradeUsd) ? draft.confirmLargeTradeUsd : ''}
            onChange={(e) => set('confirmLargeTradeUsd', e.target.valueAsNumber)}
            aria-label="Large trade confirmation threshold in USD"
            aria-invalid={!!errs.confirmLargeTradeUsd}
          />
        </div>
      </SettingRow>

      <div className={`set-savebar ${dirty ? 'is-dirty' : ''}`}>
        <span className="set-savebar-state">
          {invalid ? (
            <span className="lx-err">Fix the highlighted settings to save.</span>
          ) : dirty ? (
            <>
              <span className="dot" aria-hidden /> Unsaved changes
            </>
          ) : (
            <span className="muted">All changes saved</span>
          )}
        </span>
        <span className="grow" />
        <button type="button" className="btn ghost" onClick={() => setDraft({ ...DEFAULT_PREFERENCES })}>
          Restore defaults
        </button>
        <button type="button" className="btn" onClick={() => setDraft(prefs)} disabled={!dirty || saving}>
          Discard
        </button>
        <button type="submit" className="btn primary" disabled={!dirty || invalid || saving} aria-busy={saving}>
          {saving ? <span className="spinner" aria-hidden /> : null}
          Save
        </button>
      </div>
    </form>
  );
}

// ═════════════════════════ Wallet & network ═════════════════════════

function WalletNetwork() {
  const conn = useConnection();
  const account = useApp((s) => s.account);
  const config = useApp((s) => s.config);
  const mode = useApp((s) => s.mode);
  const nh = useApp((s) => s.health?.networks.find((n) => n.id === 'robinhood-mainnet'));
  const net = NETWORKS['robinhood-mainnet'];
  const verified = !!conn.address && account?.kind === 'wallet' && account.walletAddress === conn.address.toLowerCase();
  const openWallet = () => window.dispatchEvent(new CustomEvent('eko:open-wallet'));
  return (
    <div className="panel set-form">
      <SettingRow title="Wallet" desc="Paper needs no wallet. For Live you connect your own — EKO never asks for your seed phrase or private key.">
        {conn.address ? (
          <div className="set-inline">
            <span className="num set-strong">{shortAddress(conn.address)}</span>
            <span className={`badge ${verified ? 'set-st-ok' : 'outline'}`}>{verified ? 'Verified' : 'Not verified yet'}</span>
            <button className="btn sm" onClick={openWallet}>
              Manage
            </button>
          </div>
        ) : (
          <button className="btn" onClick={openWallet}>
            Connect wallet
          </button>
        )}
      </SettingRow>
      <SettingRow title="Network" desc={`Live trades swap ETH ⇄ USDG on Uniswap v3 on ${net.name} (chain ${net.chainId}). Every trade is signed in your wallet.`}>
        <span className="num">{nh ? `${nh.status[0]!.toUpperCase()}${nh.status.slice(1)}${nh.blockNumber ? ` · block ${nh.blockNumber.toLocaleString()}` : ''}` : '—'}</span>
      </SettingRow>
      <SettingRow title="Live trading" desc={config?.liveTradingEnabled ? 'Available on this server. Switching to Live walks you through the checks first.' : 'Switched off on this server — only Paper is available.'}>
        {mode === 'live' ? (
          <div className="set-inline">
            <span className="badge live">Trading Live</span>
            <button className="btn sm" onClick={() => requestMode('paper')}>
              Back to Paper
            </button>
          </div>
        ) : (
          <button className="btn" onClick={() => requestMode('live')}>
            Set up Live
          </button>
        )}
      </SettingRow>
    </div>
  );
}

// ═════════════════════════ Display ═════════════════════════

function Display() {
  const prefs = useApp((s) => s.preferences);
  const setPreferences = useApp((s) => s.setPreferences);
  const toast = useApp((s) => s.toast);
  const save = (p: Partial<Preferences>) => void setPreferences(p).catch((e) => toast({ kind: 'error', title: 'Not saved', body: (e as Error).message }));
  return (
    <div className="panel set-form">
      <SettingRow title="Reduce motion" desc="Follows your system by default. Reduced motion removes transitions.">
        <div className="seg set-seg" role="group" aria-label="Reduce motion">
          {(
            [
              ['system', 'System'],
              ['on', 'Reduce'],
              ['off', 'Full motion'],
            ] as const
          ).map(([v, l]) => (
            <button type="button" key={v} aria-pressed={prefs.reducedMotion === v} onClick={() => save({ reducedMotion: v })}>
              {l}
            </button>
          ))}
        </div>
      </SettingRow>
    </div>
  );
}

function SettingRow({ title, desc, error, children }: { title: string; desc: string; error?: string; children: ReactNode }) {
  return (
    <div className={`set-row ${error ? 'has-error' : ''}`}>
      <div className="set-row-label">
        <strong>{title}</strong>
        <p>{desc}</p>
      </div>
      <div className="set-row-control">
        {children}
        {error ? (
          <span className="lx-err" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function NumberList({ label, values, onChange, max, step, prefix, suffix, invalid }: { label: string; values: number[]; onChange: (v: number[]) => void; max: number; step: number; prefix?: string; suffix?: string; invalid?: boolean }) {
  return (
    <div className="set-list" role="group" aria-label={label + 's'}>
      {values.map((v, i) => (
        <span className={`set-list-item ${invalid && (!Number.isFinite(v) || v <= 0) ? 'is-bad' : ''}`} key={i}>
          {prefix ? <span className="set-affix">{prefix}</span> : null}
          <input
            className="set-list-input num"
            type="number"
            step={step}
            min={0}
            value={Number.isFinite(v) ? v : ''}
            aria-label={`${label} ${i + 1}`}
            onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.valueAsNumber : x)))}
          />
          {suffix ? <span className="set-affix">{suffix}</span> : null}
          <button type="button" className="set-list-rm" aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} disabled={values.length <= 1} onClick={() => onChange(values.filter((_, j) => j !== i))}>
            <IconClose size={10} />
          </button>
        </span>
      ))}
      {values.length < max ? (
        <button type="button" className="set-list-add" onClick={() => onChange([...values, (values.filter(Number.isFinite).at(-1) ?? 0) + step])} aria-label={`Add ${label.toLowerCase()}`}>
          <IconPlus size={11} /> Add
        </button>
      ) : null}
    </div>
  );
}

// ═════════════════════════ Providers ═════════════════════════

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  ok: { cls: 'set-st-ok', label: 'Operational' },
  degraded: { cls: 'warn', label: 'Degraded' },
  down: { cls: 'danger', label: 'Down' },
  unconfigured: { cls: 'outline', label: 'Inactive' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] ?? { cls: 'outline', label: status };
  return (
    <span className={`badge ${s.cls}`}>
      {status === 'ok' ? <span className="dot" aria-hidden /> : null}
      {s.label}
    </span>
  );
}

const price = (v: number | null) => (v === null ? null : `$${v < 1 ? v.toFixed(2) : v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}`);

// ═════════════════════════ Budget ═════════════════════════

const OUTCOME: Record<string, { cls: string; label: string }> = {
  ok: { cls: 'set-st-ok', label: 'ok' },
  abstained: { cls: '', label: 'abstained' },
  rejected: { cls: 'warn', label: 'rejected' },
  error: { cls: 'danger', label: 'error' },
  skipped_cache: { cls: 'outline', label: 'cached' },
  skipped_budget: { cls: 'outline', label: 'skipped · budget' },
  skipped_unconfigured: { cls: 'outline', label: 'skipped · no key' },
};

// ═════════════════════════ Latency ═════════════════════════

const CLIENT_METRICS = ['ws.rtt_ms', 'ui.tap_to_fill_ms', 'ui.chart_load_ms'] as const;
const CLIENT_DESC: Record<string, string> = {
  'ws.rtt_ms': 'WebSocket ping round trip',
  'ui.tap_to_fill_ms': 'Buy/Sell tap → paper fill shown',
  'ui.chart_load_ms': 'Chart history requested → drawn',
};
const STAGE: Record<string, string> = { market: 'Market data', ai: 'AI', quote: 'Execution', order: 'Execution', ui: 'Client (all sessions)', ws: 'Client (all sessions)' };

function Latency({ metrics, error }: { metrics: MetricSummary[] | null; error?: string }) {
  const rows = useMemo(() => {
    if (!metrics) return null;
    const order = ['market', 'signal', 'ai', 'quote', 'order', 'ws', 'ui'];
    return [...metrics].sort((a, b) => {
      const pa = order.indexOf(a.metric.split('.')[0]!);
      const pb = order.indexOf(b.metric.split('.')[0]!);
      return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb) || a.metric.localeCompare(b.metric);
    });
  }, [metrics]);
  const local = CLIENT_METRICS.map((m) => ({ metric: m, s: localStats(m) }));

  return (
    <>
      <Panel title="Server" note="Rolling window of recent samples per metric">
        {error && !rows ? (
          <div className="lx-pad">
            <div className="callout warn">
              <IconAlert size={14} />
              <span>Could not load metrics: {error}</span>
            </div>
          </div>
        ) : !rows ? (
          <div className="skel" style={{ height: 160, margin: 12 }} />
        ) : (
          <TableWrap label="Server latency metrics">
            <table className="table set-metrics">
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col">Measures</th>
                  <th scope="col" className="r">
                    Samples
                  </th>
                  <th scope="col" className="r">
                    p50
                  </th>
                  <th scope="col" className="r">
                    p90
                  </th>
                  <th scope="col" className="r">
                    p99
                  </th>
                  <th scope="col" className="r">
                    Last
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m, i) => {
                  const stage = STAGE[m.metric.split('.')[0]!] ?? 'Other';
                  const prev = i > 0 ? (STAGE[rows[i - 1]!.metric.split('.')[0]!] ?? 'Other') : null;
                  return (
                    <tr key={m.metric} className={prev !== null && prev !== stage ? 'set-stage-start' : undefined}>
                      <th scope="row">
                        <span className="num set-metric">{m.metric}</span>
                        <Sub>{stage}</Sub>
                      </th>
                      <td className="set-wrap set-desc">{m.description}</td>
                      <td className="r num">{m.count ? m.count.toLocaleString() : <span className="muted">none</span>}</td>
                      <td className="r num set-p50">{formatMs(m.p50)}</td>
                      <td className="r num">{formatMs(m.p90)}</td>
                      <td className="r num">{formatMs(m.p99)}</td>
                      <td className="r num">
                        {formatMs(m.last)}
                        {m.lastAt ? <Sub>{fmtAgo(m.lastAt)}</Sub> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      <Panel title="This browser" note="Measured in this tab since it loaded; last 200 samples">
        <TableWrap label="Client latency metrics">
          <table className="table set-metrics">
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col">Measures</th>
                <th scope="col" className="r">
                  Samples
                </th>
                <th scope="col" className="r">
                  p50
                </th>
                <th scope="col" className="r">
                  p90
                </th>
                <th scope="col" className="r">
                  Last
                </th>
              </tr>
            </thead>
            <tbody>
              {local.map(({ metric, s }) => (
                <tr key={metric}>
                  <th scope="row">
                    <span className="num set-metric">{metric}</span>
                  </th>
                  <td className="set-wrap set-desc">{CLIENT_DESC[metric]}</td>
                  <td className="r num">{s ? s.count : <span className="muted">none yet</span>}</td>
                  <td className="r num set-p50">{formatMs(s?.p50 ?? null)}</td>
                  <td className="r num">{formatMs(s?.p90 ?? null)}</td>
                  <td className="r num">{formatMs(s?.last ?? null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Panel>
    </>
  );
}

// ═════════════════════════ Health ═════════════════════════

const TONE: Record<string, string> = { live: 'set-st-ok', ok: 'set-st-ok', connecting: 'outline', reconnecting: 'warn', stale: 'warn', degraded: 'warn', down: 'danger', unconfigured: 'outline' };

function Pill({ s }: { s: string }) {
  return (
    <span className={`badge ${TONE[s] ?? 'outline'}`}>
      {s === 'live' || s === 'ok' ? <span className="dot" aria-hidden /> : null}
      {s}
    </span>
  );
}

function Health({ srv, error }: { srv: HealthResp | null; error?: string }) {
  const live = useApp((s) => s.health);
  const wsState = useApp((s) => s.wsState);
  const h: SystemHealth | null = live ?? srv;
  if (!h)
    return error ? (
      <div className="callout warn">
        <IconAlert size={14} />
        <span>Could not load system health: {error}</span>
      </div>
    ) : (
      <div className="skel" style={{ height: 180 }} />
    );
  return (
    <div className="set-health">

      <Panel title="Networks" className="set-health-wide">
        <TableWrap label="Network health">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Network</th>
                <th scope="col" className="r">
                  Chain ID
                </th>
                <th scope="col">Status</th>
                <th scope="col" className="r">
                  Block
                </th>
                <th scope="col" className="r">
                  Checked
                </th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              {h.networks.map((n: NetworkHealth) => (
                <tr key={n.id}>
                  <th scope="row">{n.name}</th>
                  <td className="r num">{n.chainId}</td>
                  <td>
                    <Pill s={n.status} />
                  </td>
                  <td className="r num">{n.blockNumber !== null ? `#${n.blockNumber.toLocaleString()}` : '—'}</td>
                  <td className="r num">{fmtAgo(n.lastCheckedAt)}</td>
                  <td className="set-wrap set-detail">{n.detail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Panel>
    </div>
  );
}

// ═════════════════════════ About ═════════════════════════

function About() {
  const config = useApp((s) => s.config);
  return (
    <div className="set-about">
      <Panel title="Build">
        <div className="lx-pad">
          <Kv
            rows={[
              ['Version', <span className="num">v{config?.version ?? '—'}</span>],
              ['Market data', config ? `${config.dataSource}${config.simulatedData ? ' (simulated)' : ''}` : '—'],
              ['Live trading', config ? (config.liveTradingEnabled ? 'Enabled on this server' : 'Disabled on this server') : '—'],
              ['AI daily budget', <span className="num">{config ? formatUsd(config.aiBudget.dailyUsd) : '—'}</span>],
            ]}
          />
        </div>
      </Panel>
      <Panel title="Notices">
        <ul className="set-notices">
          <li>
            <IconLock size={14} />
            <div>
              <strong>Wallet safety.</strong> EKO never asks for seed phrases or private keys. Every on-chain transaction is signed in your own wallet.
            </div>
          </li>
          <li>
            <IconAlert size={14} />
            <div>
              <strong>Not advice.</strong> EKO provides observations and policy checks, not recommendations.
            </div>
          </li>
          <li>
            <IconExternal size={14} />
            <div>
              <a className="linkish" href="https://www.tradingview.com/" target="_blank" rel="noreferrer">
                Charts by TradingView
              </a>{' '}
              — built with TradingView Lightweight Charts™.
            </div>
          </li>
        </ul>
      </Panel>
    </div>
  );
}
