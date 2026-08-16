import { guardConsumerReasons } from '@eko/shared';
import { type ReactNode } from 'react';
import { type CoinCardV2, type GuardAssessmentV2, type GuardCoverage, type Metric, type Untrusted } from '@eko/shared';
import { AnalysisPolicyNotice } from '../../components/PolicyLinks';
import { Seg, UntrustedText, VerdictChip, inertText } from '../../components/ui';
import { BUYER_RISK, GUARD_EMPTY, GUARD_NO_RECORDS, GUARD_PENDING, GUARD_COPY as C, GUARD_CHECK_LABELS, GUARD_CHECK_STATUS, GUARD_POLICY_OPTIONS, GUARD_METRIC_NAMES, GUARD_GROUPS, GUARD_QUOTE_HEADINGS, guardBuyText, guardName, guardCoverageText, guardMeasurementText, guardRawAmount, guardSnapshotText, guardLegacyText, guardDecisiveText, formatGuardReason } from '../../copy/guard';
import { useNow } from '../../components/hooks';
import { NOT_CHECKED } from '../../copy/availability';
import { API_BASE } from '../../lib/api';
import { Link } from '../../lib/Link';
import { useUi } from '../../store/ui';
import { Spark } from '../../components/ui/charts';

const label = (key: string) => GUARD_METRIC_NAMES[key] ?? guardName(key);
function evidenceUrl(coin: string, id: string) {
  return `${API_BASE.replace(/\/v1$/, '')}/v2/coins/${encodeURIComponent(coin)}/evidence/${encodeURIComponent(id)}`;
}
function EvidenceLinks({ coin, ids }: { coin: string; ids: string[] }) {
  return <>{ids.map((id, i) => <a key={id} href={evidenceUrl(coin, id)}>{C.evidence} {i + 1} · {id.slice(0, 10)} </a>)}</>;
}
function Coverage({ value }: { value: GuardCoverage }) {
  return <span className="guard-coverage">{guardCoverageText(value)}</span>;
}
function CardDetails({ title, children }: { title: string; children: ReactNode }) {
  return <details className="panel guard-section"><summary className="panel-head">{title}</summary><div className="panel-body">{children}</div></details>;
}
function MetricView({ metric, coin, card }: { metric: Metric<unknown>; coin: string; card: CoinCardV2 }) {
  const known = metric.status !== 'unknown' && metric.status !== 'not_applicable';
  const scalar = metric.value === null || typeof metric.value !== 'object';
  let value: ReactNode = metric.status === 'not_applicable' ? C.notApplicable : NOT_CHECKED;
  if (known && scalar) {
    const text = typeof metric.value === 'boolean' ? metric.value ? C.yes : C.no : String(metric.value);
    value = `${metric.unit === 'usd' ? '$' : ''}${guardName(text)}${metric.unit === 'pct' ? '%' : metric.unit === 'seconds' ? ' s' : ''}`;
  } else if (known) value = <Fields value={metric.value} coin={coin} card={card} />;
  return <div className="guard-metric" data-status={metric.status}>
    <div>{value} <span className="tag">{guardName(metric.status)}</span>{metric.failureCode && <span> · {guardName(metric.failureCode)}</span>}</div>
    <Coverage value={metric.coverage} />
    <details className="ev"><summary>{C.measurement}</summary>
      {guardMeasurementText(metric).map(line => <p key={line}>{line}</p>)}
      <EvidenceLinks coin={coin} ids={metric.evidenceIds} />
    </details>
  </div>;
}
// Walk only the closed CoinCardV2 contract after runtime parsing. Untrusted text,
// metrics and coverage have dedicated boundaries; no HTML/Markdown/linkification.
function Fields({ value, coin, card, field = '' }: { value: unknown; coin: string; card: CoinCardV2; field?: string }) {
  if (value === null) return <span>{NOT_CHECKED}</span>;
  if (Array.isArray(value)) {
    const key = field === 'fields' ? 'textFields' : field;
    const coverage = card.collectionCoverage?.[key as keyof NonNullable<CoinCardV2['collectionCoverage']>];
    if (!value.length) return <div>{coverage?.complete ? GUARD_NO_RECORDS : GUARD_EMPTY}{coverage && <Coverage value={coverage} />}</div>;
    return <div className="guard-records">{coverage && <Coverage value={coverage} />}{value.map((v, i) => <div className="guard-record" key={i}><Fields value={v} coin={coin} card={card} /></div>)}</div>;
  }
  if (typeof value !== 'object') return <span>{typeof value === 'boolean' ? value ? C.yes : C.no : String(value)}</span>;
  if ('text' in value && 'flags' in value) {
    const text = value as Untrusted;
    return <><UntrustedText value={text} /><button className="btn btn-sm" onClick={() => void navigator.clipboard?.writeText(inertText(text.text))}>{C.copyText}</button></>;
  }
  if ('unit' in value && 'knownAt' in value && 'status' in value) return <MetricView metric={value as Metric<unknown>} coin={coin} card={card} />;
  if ('scopeId' in value && 'complete' in value) return <Coverage value={value as GuardCoverage} />;
  if ('raw' in value && 'decimals' in value && 'asset' in value) return <span className="num">{guardRawAmount(value as { raw: string; decimals: number; asset: string })}</span>;
  return <dl className="kv guard-fields">{Object.entries(value).map(([key, v]) => <div key={key}><dt>{label(key)}</dt><dd><Fields value={v} coin={coin} card={card} field={key} /></dd></div>)}</dl>;
}
const familyOrder = ['E', 'Ff', 'O', 'C', 'I'];
export function GuardPolicyControls({ guard, mode, onChange }: { guard: GuardAssessmentV2; mode: 'safe' | 'balanced' | 'degen'; onChange: (mode: 'safe' | 'balanced' | 'degen') => void }) {
  return <><Seg options={GUARD_POLICY_OPTIONS} value={mode} onChange={v => onChange(v as typeof mode)} label={C.mode} />
    <p role="status">{guardBuyText(guard, mode)}</p><p>{C.sellState}</p></>;
}
export function GuardAssessment({ guard, evidenceOpen = false }: { guard: GuardAssessmentV2; evidenceOpen?: boolean }) {
  const now = useNow();
  const mode = useUi(s => s.riskMode), setUi = useUi(s => s.set);
  const factors = [...guard.factors].sort((a, b) => b.assignedPoints - a.assignedPoints || familyOrder.indexOf(a.family) - familyOrder.indexOf(b.family) || a.id.localeCompare(b.id));
  // Packet 035 supplies decisive/points/family ordering; preserve it. Only
  // same-factor size ties need the consumer's $100-before-$1k ordering.
  const reasons = guardConsumerReasons(guard);
  return <section className="panel guard-assessment" id={guard.mode === 'active' ? 'coin-evidence' : 'guard-shadow-evidence'} tabIndex={-1}>
    <div className="panel-head coin-section-head"><h3>{C.buyerRisk}</h3><VerdictChip level="pending" guard={guard} size="lg" /></div>
    <div className="panel-body"><p>{BUYER_RISK}</p><p className="num">{guardSnapshotText(guard, now)}</p>
      <ul className="guard-reasons">{reasons.slice(0, 3).map((r, i) => <li key={i}>{formatGuardReason(r)}</li>)}</ul>
      <details className="ev" open={evidenceOpen || undefined}><summary>{C.allReasons}</summary>
        <ul>{reasons.map((r, i) => <li key={i}>{formatGuardReason(r)} <EvidenceLinks coin={guard.coin} ids={r.evidenceIds} /></li>)}</ul>
        <ul>{guard.decisiveIds.map(id => <li key={id}>{guardDecisiveText(id)}</li>)}{factors.map(f => <li key={f.id}>{formatGuardReason({ code: f.template, factorId: f.id, parameters: f.parameters, evidenceIds: f.evidenceIds } as Parameters<typeof formatGuardReason>[0])} · {guardName(f.state)} · {f.assignedPoints} {C.points} · {f.calibration}{f.suppressionCode && ` · ${guardName(f.suppressionCode)}`} <EvidenceLinks coin={guard.coin} ids={f.evidenceIds} /></li>)}</ul>
        <div className="guard-checks">{guard.checks.map(c => <details className="ev guard-check" key={c.id}><summary>{GUARD_CHECK_LABELS[c.id]} · {GUARD_CHECK_STATUS[c.status]}</summary><Coverage value={c.coverage} /><EvidenceLinks coin={guard.coin} ids={c.evidenceIds} /></details>)}</div>
      </details>
      <GuardPolicyControls guard={guard} mode={mode} onChange={riskMode => setUi({ riskMode })} />
      <p>{C.receipt} {guard.receipt.status} · <Link to={`/receipt/${guard.receipt.id}`}>{C.verify}</Link> · {C.receiptNote}</p>
      <AnalysisPolicyNotice />
    </div>
  </section>;
}
export function GuardCard({ card, assessment, evidenceOpen = false }: { card: CoinCardV2; assessment?: GuardAssessmentV2; evidenceOpen?: boolean }) {
  const guard = assessment ?? card.verdict;
  return <div className="guard-card">
    {guard ? <GuardAssessment guard={guard} evidenceOpen={evidenceOpen} /> : <section className="panel panel-body"><VerdictChip level="pending" verdictPending /><p>{GUARD_PENDING}</p><p>{BUYER_RISK}</p><AnalysisPolicyNotice /></section>}
    {card.legacy && <p>{guardLegacyText(card.legacy)} · <Link to={`/receipt/${card.legacy.receiptId}`}>{C.originalReceipt}</Link></p>}
    {(card.signal || card.spark8h || card.change24hPct) && <CardDetails title={C.signal}>
      {card.signal && <><h3>{C.signal} <span className="tag">{C.beta}</span></h3><p>{C.descriptive} · {card.verdict?.mode === 'active' ? C.recordedInputs : C.shadowInputs}</p><p>{C.composite} {guard?.level === 'high' ? C.high : card.signal.composite} / 100 · {C.block} {card.signal.asOfBlock}</p><details className="ev"><summary>{C.how}</summary><dl className="kv">{Object.entries(card.signal.readings).map(([key, value]) => <div key={key}><dt>{guardName(key)} · {Math.round(card.signal!.weights[key as keyof typeof card.signal.weights] * 100)}%</dt><dd>{card.signal!.lowData.includes(key as keyof typeof card.signal.readings) ? NOT_CHECKED : `${value} · ${(value * card.signal!.weights[key as keyof typeof card.signal.weights]).toFixed(1)} ${C.points}`}</dd></div>)}</dl></details></>}
      {card.spark8h && <Spark series={card.spark8h.map(b => b.c)} label={C.spark} />}
      {card.change24hPct && <><h3>{C.change}</h3><MetricView metric={card.change24hPct} card={card} coin={card.identity.address} /></>}
    </CardDetails>}
    <CardDetails title={C.routeTable}><div className="guard-quotes"><table className="table"><thead><tr>{GUARD_QUOTE_HEADINGS.map(v => <th key={v}>{v}</th>)}</tr></thead><tbody>{[...card.tradeability.quotes].sort((a, b) => a.sizeUsd - b.sizeUsd || a.accountClass.localeCompare(b.accountClass)).map(q => <tr key={`${q.sizeUsd}:${q.accountClass}`}><th>${q.sizeUsd.toLocaleString('en-US')}</th><td>{q.accountClass === 'eoa' ? C.eoa : C.smartAccount}</td><td>{q.routeId ?? NOT_CHECKED}</td>{[q.entry, q.sellability, q.venueCostPct, q.allInCostPct, q.gasUsd].map((m, i) => <td key={i}><MetricView metric={m} card={card} coin={card.identity.address} /></td>)}</tr>)}</tbody></table></div></CardDetails>
    <div className="guard-groups">{GUARD_GROUPS.map(([key, title]) => <CardDetails title={title} key={key}><Fields value={card[key]} coin={card.identity.address} card={card} /></CardDetails>)}</div>
    <CardDetails title={C.source}><Fields value={card.freshness} coin={card.identity.address} card={card} /><Fields value={card.source ?? null} coin={card.identity.address} card={card} /><Fields value={card.jobs ?? []} field="jobs" coin={card.identity.address} card={card} />
      <details className="ev"><summary>{C.captured}</summary><Fields value={card.evidence} coin={card.identity.address} card={card} /><Fields value={card.factorMeasurements ?? []} coin={card.identity.address} card={card} /></details><AnalysisPolicyNotice />
    </CardDetails>
  </div>;
}
