import { compactGuardVerdict, type GuardConsumerRequest, type GuardAssessmentV2, type Verdict } from '@eko/shared';
import { VerdictChip } from './ui';
import { AnalysisPolicyNotice } from './PolicyLinks';
import { Link } from '../lib/Link';
import { GUARD_REFRESH_FAILED, GUARD_UNAVAILABLE, GUARD_COPY } from '../copy/guard';
import { GUARD2_UNAVAILABLE_TITLE, GUARD_LEGEND, LEGACY_TITLE } from '../copy/availability';

/** Lists can show a shadow alongside the original grade without replacing it. */
export function CompactVerdictChip({ level, guard, pending = false, failed = false, linked = true, ...context }: { level: Verdict['level'] | 'info'; guard?: GuardAssessmentV2 | null; pending?: boolean; failed?: boolean; linked?: boolean; evaluatedPlaybooks?: import('@eko/shared').PlaybookId[]; missing?: string[]; scanDelayed?: boolean }) {
  const snapshot = guard ? compactGuardVerdict({version:2,assessment:guard}) : null;
  const detailText = guard && `Block ${guard.cursor.blockNumber} · $100 / $1,000 · EOA / smart account`;
  const details = snapshot && (linked ? <Link to={snapshot.evidencePath!} title={snapshot.snapshot}>{detailText} · {GUARD_COPY.allReasons}</Link> : <span title={snapshot.snapshot}>{detailText}</span>);
  if (guard?.mode === 'active') return <><VerdictChip level={level} guard={guard} />{details}{failed && <span>{GUARD_REFRESH_FAILED}</span>}</>;
  // No Guard 2 result: one compact disclosure beside the legacy grade; the full wording stays in its tooltip and accessible name.
  if (guard === null) {
    const disclosure = `Legacy assessment · rules 1.0.x: ${LEGACY_TITLE} ${GUARD_UNAVAILABLE}: ${GUARD2_UNAVAILABLE_TITLE}`;
    return <>{failed && <span>{GUARD_REFRESH_FAILED}</span>}<VerdictChip level={level} verdictPending={pending} {...context} />
      <span className="tag guard-disclosure" title={disclosure} aria-label={disclosure}>Legacy grade · Guard 2 pending</span></>;
  }
  return <>{failed && <span>{GUARD_REFRESH_FAILED}</span>}{guard !== undefined && <span className="tag" title={LEGACY_TITLE}>Legacy assessment · rules 1.0.x</span>}<VerdictChip level={level} verdictPending={pending} {...context} />
    {guard ? <VerdictChip level={level} guard={guard} /> : null}{details}</>;
}
/** Lists that show the legacy grade beside a missing or shadow Guard 2 result explain both labels once, above the rows. */
export function GuardLegend({ rows }: { rows: { guardV2?: GuardAssessmentV2 | null }[] }) {
  return rows.some((row) => row.guardV2 !== undefined && row.guardV2?.mode !== 'active') ? <p className="availability-legend guard-legend">{GUARD_LEGEND}</p> : null;
}
/** Three summary lines; full findings stay accessible on the detail surface. */
export function GuardCompact({ verdict }: { verdict: GuardConsumerRequest }) {
  const view = compactGuardVerdict(verdict);
  return <section className="guard-compact">
    <strong>{view.label}</strong>{view.mode && <p>{view.mode}</p>}{view.gap && <strong className="guard-gap">{view.gap}</strong>}
    <p>{view.snapshot}</p><ul>{view.lines.map((line, i) => <li key={i}>{line}</li>)}</ul>
    {view.evidencePath && <Link to={view.evidencePath}>{GUARD_COPY.allReasons}</Link>}
    <AnalysisPolicyNotice />
  </section>;
}
