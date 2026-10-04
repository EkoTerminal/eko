import { TRADING_PAUSED_TITLE } from '../../copy/availability';
import { CompactVerdictChip, GuardLegend } from '../../components/GuardCompact';
import { AnalysisPolicyNotice } from '../../components/PolicyLinks';
import { CHECK_LEGEND, NEAR_GRAD } from '../../copy/availability';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PairRow } from '@eko/shared';
import { HeatTag, Info, Seg, UnavailableValue, UntrustedText, VerdictChip } from '../../components/ui';
import { fetchParsed, MOCKS } from '../../lib/api';
import { useRealtime } from '../../lib/RealtimeContext';
import { useMedia } from '../../lib/useMedia';
import { installDither } from '../../lib/dither';
import { heatOf, marking, markClass } from '../../lib/heat';
import { useShell } from '../../store/shell';
import { TradePanel } from '../../components/trade/TradePanel';
import { CoinInspector, FlowBar, HeatLegend } from './RadarParts';
import { Decode } from './radarMotion';
import { formatAge } from '../../lib/format';
import { retainCompactGuard, exitText, PLAYBOOK_NAMES, scanDelayed, usd } from './radarModel';
import { antiSnipeLeft, antiSnipeTax, applyPairEvents, COLUMNS, pairColumns, PairResponseSchema, pairTradeDisabled, receivedAt } from './pairsFeedModel';
import { serverNow } from '../../lib/clock';
import { useTerminalWindow } from './terminalWindow';
import type { ChannelEvent } from '../../lib/realtime';
import { launchpadLabel } from '../../copy/chain';
import './radar.css';
import './secondary.css';

const META = {
  new: { title: 'New', sub: 'On the bonding curve, newest first', about: 'Pairs still on the Pons bonding curve. New launches start with a decaying anti-sniper tax.' },
  near_grad: { title: 'Near graduation', sub: NEAR_GRAD, about: 'At 100% the curve fills and the pair migrates to a pool. The guard rescans at migration.' },
  migrated: { title: 'Migrated', sub: 'Graduated to a pool, most recent first', about: 'Pairs that have graduated to a pool. Trading routes and fees appear in the guarded panel.' },
};
const PAIR_HEIGHT = 132;
const GUARD_PAIR_HEIGHT = 224;
const hasGuardLabels = (row: PairRow) => row.guardV2 !== undefined || !!row.guardRefreshFailed;
export function PairView({ row, now, at, select, trade, stale }: { row: PairRow; now: number; at: number; select: (r: PairRow, el: HTMLElement) => void; trade: (r: PairRow, el: HTMLElement) => void; stale: boolean }) {
  const tradingLive = useShell((st) => st.config?.trading.liveEnabled !== false);
  const pending = row.verdictPending || row.verdict === 'pending', heat = heatOf(row, { pending });
  const ageNow = row.ageSec + Math.max(0, now - at) / 1000, delayed = scanDelayed(row, ageNow);
  const left = row.antiSnipe ? antiSnipeLeft(row.antiSnipe.endsInSec, at, now) : 0;
  const tax = row.antiSnipe ? antiSnipeTax(row.antiSnipe.taxPct, row.antiSnipe.endsInSec, at, now) : 0;
  return <li className={`prow tone ${heat} ${markClass(marking(row, { pending }))}${hasGuardLabels(row) ? ' guard-labels' : ''}`} data-address={row.address} data-pending={pending} onClick={(e) => select(row, e.currentTarget)}>
    <div className="pr-top"><div className="pr-id"><button className="pr-sym tone-sym" title={`$${row.symbol.text}`} data-pick aria-label={`Inspect $${row.symbol.text}`} onClick={(e) => { e.stopPropagation(); select(row, e.currentTarget); }}><Decode text={`$${row.symbol.text}`}><span>$<UntrustedText value={row.symbol} /></span></Decode></button><span className="pr-age num">{formatAge(ageNow)}</span></div><span className="pr-verdict"><HeatTag heat={heat} /><CompactVerdictChip level={row.verdict} guard={row.guardV2} failed={row.guardRefreshFailed} pending={row.verdictPending} scanDelayed={delayed} evaluatedPlaybooks={row.evaluatedPlaybooks} missing={row.missingChecks} /></span></div>
    <div className="pr-sub"><span className="pr-name"><UntrustedText value={row.name} /></span><span>·</span><span>{launchpadLabel(row.launchpad, row.column === 'migrated')}</span>{!pending && row.topPlaybook && <span className={`pr-play${row.verdict === 'danger' ? ' bad' : ''}`}>· {PLAYBOOK_NAMES[row.topPlaybook]}</span>}</div>
    <div className="pr-tax-line">{left > 0 && <span className="pr-snipe num">{tax}% buy tax → 0 in {left} s</span>}</div>
    <div className="pr-grid tone-dim"><div className="pr-cell">{row.column === 'migrated' ? <><span className="pr-l">Liquidity</span><span className="pr-v num">{row.unavailable?.includes('liquidity') ? <UnavailableValue /> : usd(row.liquidityUsd)}</span></> : <><span className="pr-l">Curve <b className="num">{row.curvePct === undefined ? <UnavailableValue /> : `${Math.floor(row.curvePct)}%`}</b></span><div className="pr-bar" hidden={row.curvePct === undefined}><div className="bar"><i style={{ width: `${row.curvePct ?? 0}%` }} /></div></div></>}</div><div className="pr-cell"><span className="pr-l">Agents</span>{row.unavailable?.includes('flow') ? <UnavailableValue /> : <><b className="num">{Math.round(row.flow.agentPct)}%</b><FlowBar flow={row.flow} compact /></>}</div><div className="pr-cell pr-exit"><span className="pr-l">Exit at $100</span><span className={`pr-v num${!row.unavailable?.includes('exitCost') && row.exitCost100Pct > 15 ? ' bad' : ''}`}>{row.unavailable?.includes('exitCost') ? <UnavailableValue /> : exitText(row.exitCost100Pct)}</span></div><button className={`btn btn-sm${row.verdict === 'danger' || !tradingLive ? '' : ' btn-primary'}`} disabled={pairTradeDisabled(row, stale, tradingLive)} title={row.verdictPending ? "Waiting for the guard's first scan." : stale ? 'Waiting for current data.' : row.verdict === 'danger' ? 'The guard refuses Danger coins' : !tradingLive ? TRADING_PAUSED_TITLE : undefined} aria-label={`Trade $${row.symbol.text}`} onClick={(e) => { e.stopPropagation(); trade(row, e.currentTarget); }}>{row.verdict === 'danger' && !pending ? 'Refused' : 'Trade'}</button></div>
  </li>;
}
function Column({ column, rows, now, times, select, trade, stale }: { column: PairRow['column']; rows: PairRow[]; now: number; times: Map<string, number>; select: (r: PairRow, el: HTMLElement) => void; trade: (r: PairRow, el: HTMLElement) => void; stale: boolean }) {
  // Guard labels get their own wrapping line; spacers use the same fixed height as the CSS rows.
  const height = rows.some(hasGuardLabels) ? GUARD_PAIR_HEIGHT : PAIR_HEIGHT;
  const ref = useRef<HTMLDivElement>(null), range = useTerminalWindow(ref, rows.length, height, true), meta = META[column];
  return <section className="pcol panel" style={{ '--pair-row-height': `${height}px` } as React.CSSProperties} aria-labelledby={`pcol-${column}`}><header className="pcol-head"><div><h2 id={`pcol-${column}`}>{meta.title}<span className="pcol-count num">{rows.length}</span><Info label={meta.title}>{meta.about}</Info></h2><p>{meta.sub}</p></div><span className="pcol-beta">Flow labels <span className="tag">Beta</span></span></header><div ref={ref} className="pcol-list">{rows.length ? <ul><li aria-hidden="true" style={{ height: range.start * height }} />{rows.slice(range.start, range.end).map((row) => <PairView key={row.address} row={row} now={now} at={times.get(row.address) ?? now} select={select} trade={trade} stale={stale} />)}<li aria-hidden="true" style={{ height: (rows.length - range.end) * height }} /></ul> : <div className="empty">Quiet right now.</div>}</div></section>;
}
export default function Pairs() {
  const rt = useRealtime(), narrow = useMedia('(max-width:900px)'), wide = useMedia('(min-width:1480px)'), ws = useShell((s) => s.wsState);
  const [rows, setRows] = useState<PairRow[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState<string | null>(null), [delayed, setDelayed] = useState(0);
  const [pad, setPad] = useState('All'), [show, setShow] = useState('All'), [tab, setTab] = useState<PairRow['column']>('new');
  const [selected, setSelected] = useState<string | null>(null), [tradeRow, setTradeRow] = useState<PairRow | null>(null), [now, setNow] = useState(Date.now()), [seen, setSeen] = useState(Date.now());
  const times = useRef(new Map<string, number>()), back = useRef<HTMLElement | null>(null), drawer = useRef<HTMLDialogElement>(null), snapshotEvents = useRef<ChannelEvent<'pairs'>[] | null>(null);
  const generation = useRef(0);
  const snapshot = useCallback(async (signal?: AbortSignal) => {
    const request = ++generation.current;
    snapshotEvents.current = []; setError(null);
    try {
      const result = await Promise.all(COLUMNS.map((stage) => fetchParsed(`${MOCKS ? '' : '/v2'}/pairs?stage=${stage}`, PairResponseSchema, { signal })));
      if (signal?.aborted || request !== generation.current) return;
      const at = Date.now(), buffered = snapshotEvents.current ?? [];
      result.flatMap((r) => r.rows).forEach((r) => { if (!buffered.some((e) => e.kind === 'pair_upsert' && e.data.address === r.address)) times.current.set(r.address, at); });
      // The updater may run after this function returns; it must not read the ref that is cleared below.
      setRows(old => applyPairEvents(result.flatMap((r) => r.rows).map(row => retainCompactGuard(old.find(r=>r.address===row.address),row)), buffered, times.current)); snapshotEvents.current = null; setDelayed(Math.max(...result.map((r) => r.delayedSec))); setSeen(at);
    } catch (e) { if ((e as Error).name !== 'AbortError') { if (request === generation.current) setError((e as Error).message); throw e; } }
    finally { if (request === generation.current) { snapshotEvents.current = null; if (!signal?.aborted) setLoading(false); } }
  }, []);
  useEffect(() => { const ac = new AbortController(); void snapshot(ac.signal).catch(() => {}); return () => ac.abort(); }, [snapshot]);
  useEffect(() => installDither(), []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => rt?.subscribeBatch('pairs', (events) => {
    const at = Date.now(), offset = serverNow() - at;
    if (snapshotEvents.current) snapshotEvents.current = [...snapshotEvents.current, ...events].slice(-300);
    // A row's ageSec was measured when the server sent it, not when this batch drained.
    events.forEach((e) => { if (e.kind === 'pair_upsert') times.current.set(e.data.address, receivedAt(e.ts, at, offset)); });
    setRows((old) => applyPairEvents(old, events, times.current)); setSeen(at);
  }, () => snapshot()), [rt, snapshot]);
  useEffect(() => { const active = new Set<string>(rows.map((r) => r.address)); for (const address of times.current.keys()) if (!active.has(address)) times.current.delete(address); }, [rows]);
  const close = useCallback(() => { setSelected(null); requestAnimationFrame(() => back.current?.focus()); }, []);
  useEffect(() => { if (!selected || tradeRow) return; const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.info-pop')) close(); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [selected, tradeRow, close]);
  useEffect(() => { if (tradeRow) drawer.current?.showModal(); else drawer.current?.close(); }, [tradeRow]);
  const columns = useMemo(() => pairColumns(rows.filter((r) => (pad === 'All' || (pad === 'Pons' ? r.launchpad === 'pons' : r.launchpad !== 'pons')) && (show === 'All' || (show === 'Hot' ? heatOf(r, { pending: r.verdictPending }) === 'hot' : !r.verdictPending && r.verdict !== 'pending' && r.verdict !== 'danger'))), times.current), [rows, pad, show]);
  // FRONTEND §5 stale indicators: Pairs is stale after 60 s without an event (150 s when delayed, as Radar).
  const coin = rows.find((r) => r.address === selected), stale = ws !== 'open' || now - seen > (delayed ? 150000 : 60000);
  const select = (r: PairRow, el: HTMLElement) => { back.current = el; setSelected(r.address); }, trade = (r: PairRow, el: HTMLElement) => { if (!pairTradeDisabled(r, stale)) { back.current = el; setTradeRow(r); } };
  const closeTrade = () => { setTradeRow(null); requestAnimationFrame(() => back.current?.focus()); };
  const column = (c: PairRow['column']) => <Column key={c} column={c} rows={columns[c]} now={now} times={times.current} select={select} trade={trade} stale={stale} />;
  // TODO(spec): CA-3 has no daily launch/refusal totals or median scan time; prototype totals appear only in the offline demo.
  return <div className={`with-insp pairs-layout${coin ? ' open' : ''}`}><div className="page sec-page pairs-page" inert={!wide && !!coin}><div className="page-head"><div><h1>New pairs</h1><p>Every Pons launch and new Uniswap pool on Robinhood Chain gets a Fast Scan before it gets a Trade button.</p></div><div className="stats-inline"><span><b className="num">{MOCKS ? 212 : '—'}</b> new pairs today</span><span><b className="num">{MOCKS ? '2.9 s' : '—'}</b> median first scan</span><span><VerdictChip level="danger" /><b className="num">{MOCKS ? 38 + rows.filter((r) => r.column === 'new' && !r.verdictPending && r.verdict === 'danger').length : '—'}</b> refused at launch</span></div></div><div className="toolbar"><Seg options={['All', 'Pons', 'Uniswap']} value={pad} onChange={setPad} label="Launchpad" /><Seg options={['All', 'Tradeable', 'Hot']} value={show} onChange={setShow} label="Show" /><div className="toolbar-end"><HeatLegend /><span className="toolbar-live" role="status"><span className={`sb-dot${stale ? ' stale' : ''}`} />{delayed ? `Delayed ~${delayed} s` : stale ? ws === 'reconnecting' ? 'Reconnecting' : 'Stale' : 'Live'} · updated {formatAge((now - seen) / 1000)} ago</span></div></div><p className="availability-legend">{CHECK_LEGEND}</p><GuardLegend rows={rows} />{error && <div className="radar-error" role="alert">{error} <button className="btn" onClick={() => void snapshot().catch(() => {})}>Retry</button></div>}{loading ? <div className="skel" style={{ height: 480 }} aria-label="Loading pairs" /> : narrow ? <><div className="pairs-seg"><Seg label="Column" value={tab} onChange={(v) => setTab(v as PairRow['column'])} options={COLUMNS.map((c) => ({ value: c, label: <>{c === 'near_grad' ? 'Near grad' : META[c].title}<span className="seg-n num">{columns[c].length}</span></> }))} /></div>{column(tab)}</> : <div className="pairs-cols">{COLUMNS.map(column)}</div>}<AnalysisPolicyNotice /></div>{coin && <CoinInspector key={coin.address} row={coin} close={close} onCard={() => {}} formatRowAge={formatAge} stale={stale} tradeVisible={!tradeRow} />}<dialog className="radar-trade-drawer" ref={drawer} onCancel={(e) => { e.preventDefault(); closeTrade(); }} onClick={(e) => { if (e.currentTarget === e.target) closeTrade(); }}><div className="insp-bar"><span>Trade {tradeRow && <>$<UntrustedText value={tradeRow.symbol} /></>}</span><button className="iconbtn" aria-label="Close trade" onClick={closeTrade}>×</button></div>{tradeRow && <TradePanel key={tradeRow.address} coin={tradeRow.address} priceUsd={tradeRow.priceUsd} priceUnavailable={tradeRow.priceUnavailable} guard={tradeRow.guardV2} stale={stale} antiSnipeEndsAt={tradeRow.antiSnipe ? (times.current.get(tradeRow.address) ?? seen) + tradeRow.antiSnipe.endsInSec * 1000 : undefined} />}</dialog></div>;
}
