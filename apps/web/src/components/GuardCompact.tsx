import { compactGuardVerdict, type GuardConsumerRequest, type GuardAssessmentV2, type Verdict } from '@eko/shared';
import { VerdictChip } from './ui';
import { AnalysisPolicyNotice } from './PolicyLinks';
import { Link } from '../lib/Link';
import { GUARD_REFRESH_FAILED, GUARD_UNAVAILABLE, GUARD_COPY } from '../copy/guard';

/** Lists can show a shadow alongside the original grade without replacing it. */
export function CompactVerdictChip({ level, guard, pending = false, failed = false, linked = true, ...context }: { level: Verdict['level'] | 'info'; guard?: GuardAssessmentV2 | null; pending?: boolean; failed?: boolean; linked?: boolean; evaluatedPlaybooks?: import('@eko/shared').PlaybookId[]; missing?: string[] }) {
  const snapshot = guard ? compactGuardVerdict({version:2,assessment:guard}) : null;
  const detailText = guard && `Block ${guard.cursor.blockNumber} · $100 / $1,000 · EOA / smart account`;
  const details = snapshot && (linked ? <Link to={snapshot.evidencePath!} title={snapshot.snapshot}>{detailText} · {GUARD_COPY.allReasons}</Link> : <span title={snapshot.snapshot}>{detailText}</span>);
  if (guard?.mode === 'active') return <><VerdictChip level={level} guard={guard} />{details}{failed && <span>{GUARD_REFRESH_FAILED}</span>}</>;
  return <>{failed && <span>{GUARD_REFRESH_FAILED}</span>}{guard !== undefined && <span className="tag">Legacy assessment · rules 1.0.x</span>}<VerdictChip level={level} verdictPending={pending} {...context} />
    {guard ? <VerdictChip level={level} guard={guard} /> : guard === null ? <span className="tag">{GUARD_UNAVAILABLE}</span> : null}{details}</>;
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
