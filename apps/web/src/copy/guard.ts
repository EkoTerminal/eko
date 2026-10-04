import { type GuardAssessmentV2, type GuardCoverage, type Metric } from '@eko/shared';
import { formatAge, formatUtcTime } from '../lib/format';

export { BUYER_RISK, GUARD_LABELS, GUARD_SHADOW, GUARD_CANDIDATE, GUARD_UNAVAILABLE, GUARD_REFRESH_FAILED, GUARD_PENDING, GUARD_EMPTY, GUARD_NO_RECORDS, GUARD_DENOMINATORS, guardName, guardGapText, GUARD_CHECK_LABELS } from '@eko/shared';
import { guardName, GUARD_CHECK_LABELS, GUARD_DENOMINATORS } from '@eko/shared';
export function guardBuyText(guard: GuardAssessmentV2 | null, mode: 'safe' | 'balanced' | 'degen') {
  if (!guard || guard.mode !== 'active') return 'Buys unavailable · no active Guard 2 assessment';
  if (guard.level === 'high') return 'Buys refused · High risk in every mode';
  if (guard.level === 'incomplete' || !guard.completeness.buyCriticalComplete) return 'Buys refused · unresolved buy-critical checks';
  if (guard.level === 'elevated' && mode === 'safe') return 'Buys refused · Careful mode denies Elevated risk';
  return 'Continue through policy limits and actual-order checks';
}

export const GUARD_CHECK_STATUS: Record<GuardAssessmentV2['checks'][number]['status'], string> = {
  complete: 'Complete', not_applicable: 'Not applicable', missing: 'Missing', stale: 'Stale', failed: 'Failed', unsupported: 'Unsupported',
};
export const GUARD_COPY = {
  buyerRisk: 'Buyer risk', allReasons: 'All reasons, checks and evidence', measurement: 'Measurement and evidence',
  copyText: 'Copy text', yes: 'Yes', no: 'No', unknown: 'unknown', notApplicable: 'Not applicable', evidence: 'Evidence',
  mode: 'Buyer policy mode', sellState: 'Sells use a separate existing-position check.', receipt: 'Receipt', verify: 'Verify',
  receiptNote: 'inclusion does not establish the analysis.', routeTable: 'Route, size and account class',
  source: 'Snapshot, source and retries', captured: 'Captured evidence and factor measurements', how: 'How we got this',
  signal: 'Signal · five readings', beta: 'Beta', descriptive: 'Descriptive activity', recordedInputs: 'recorded inputs',
  shadowInputs: 'shadow inputs', composite: 'Composite', high: 'High risk', block: 'block', points: 'points', spark: 'Last 8h', change: '24h change',
  eoa: 'EOA', smartAccount: 'Smart account', originalReceipt: 'Verify original receipt',
};
export const GUARD_POLICY_OPTIONS = [{ value: 'safe', label: 'Careful' }, { value: 'balanced', label: 'Balanced' }, { value: 'degen', label: 'Degen' }] as const;
export const GUARD_METRIC_NAMES: Record<string, string> = {
  total: 'Outstanding supply (S)', circulating: 'Circulating supply (C)', holderFloat: 'Holder float (F)',
  raw: 'Raw units', liquid: 'Liquid units', locked: 'Locked units', supplyPct: '% of outstanding supply (S)', floatPct: '% of holder float (F)',
  top10RawPct: 'Top 10 raw addresses / holder float', top10ControlPct: 'Top 10 verified control groups / holder float',
  principal: 'Launch principal', operator: 'Operator', cohorts: 'Cohort bags', candidates: 'Coordination candidates',
  venueCostPct: 'Venue round-trip cost', allInCostPct: 'All-in round-trip cost', gasUsd: 'Network fee',
  unclassifiedPct: 'Unclassified share', feeBreakdown: 'Fee breakdown',
};
export const GUARD_GROUPS = [['tradeability', 'Tradeability and per-size entry'], ['liquidity', 'Liquidity and custody'], ['supply', 'Supply and denominators'], ['holdings', 'Holdings, funding and history'], ['control', 'Control and queued changes'], ['selling', 'Selling, campaigns and recovery'], ['flow', 'Flow · Beta'], ['identity', 'Identity and services'], ['text', 'Untrusted token text']] as const;
export const GUARD_QUOTE_HEADINGS = ['Size', 'Account', 'Route', 'Entry', 'Sellability', 'Venue cost', 'All-in cost', 'Network fee'];
export const guardRawAmount = (value: { raw: string; decimals: number; asset: string }) => `${value.raw} raw units · ${value.decimals} decimals · ${value.asset}`;
export const guardSnapshotText = (guard: GuardAssessmentV2, nowMs: number) => `Snapshot block ${guard.cursor.blockNumber} · ${formatUtcTime(guard.cursor.timestampSec)} · ${formatAge(nowMs / 1000 - Number(guard.cursor.timestampSec))} ago · $100 / $1,000 · EOA / smart account · rules ${guard.rulesVersion}`;
export const guardLegacyText = (legacy: NonNullable<import('@eko/shared').CoinCardV2['legacy']>) => `Legacy assessment · rules ${legacy.rulesVersion} · ${legacy.level} · block ${legacy.asOfBlock}`;
export const guardDecisiveText = (id: string) => `Decisive fact: ${guardName(id)}`;
export function guardCoverageText(value: GuardCoverage) {
  return `Coverage ${value.complete ? 'complete' : 'incomplete'}${value.gaps.length ? ` · ${value.gaps.map(guardName).join(', ')}` : ''} · blocks ${value.from?.blockNumber ?? 'unknown'}–${value.through?.blockNumber ?? 'unknown'} · method ${value.methodVersion}${value.coveredUnits ? ` · covered ${value.coveredUnits.raw} raw units` : ''}${value.excludedUnits ? ` · excluded ${value.excludedUnits.raw} raw units` : ''}`;
}
export function guardMeasurementText(metric: Metric<unknown>) {
  const amount = (v: Metric<unknown>['numerator']) => typeof v === 'string' ? v : v ? guardRawAmount(v) : GUARD_COPY.unknown;
  return [
    `Block ${metric.cursor.blockNumber} · known at block ${metric.knownAt.cursor.blockNumber} · method ${metric.methodVersion}`,
    `Numerator ${amount(metric.numerator)} / denominator ${amount(metric.denominator)}${metric.denominatorKind ? ` · ${GUARD_DENOMINATORS[metric.denominatorKind]}` : ''}`,
    `Window ${metric.fromSec ?? 'unknown'}–${metric.throughSec} · snapshot ${metric.cursor.blockHash}`,
  ];
}
export { formatGuardReason } from '@eko/shared';
