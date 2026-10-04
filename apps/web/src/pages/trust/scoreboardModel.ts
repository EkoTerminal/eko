import type { ScoreboardResponse, ScoreboardRow } from '@eko/shared';
export const SCOREBOARD_TABS = [
  ['calls', 'Calls'], ['honeypots_refused', 'Refused'], ['honeypots_missed', 'Missed'], ['cohort', 'Weekly cohort'], ['milestones', 'Milestone buys'],
] as const;
export function availabilityMessage(value: ScoreboardResponse['availability']['cohort']) {
  if (value.status === 'observed') return `Measured through ${value.through}`;
  return ({ monitoring_missing: 'Monitoring is unavailable.', coverage_gap: 'Monitoring coverage has a gap.', outcomes_unaccepted: 'Measured outcomes have not been accepted yet.', forecast_dependency: 'Forecast grades are unavailable.', d0_gated: 'Milestone buys open at token launch.', milestones_unaccepted: 'Measured milestone buys are unavailable.' })[value.reason];
}
export function counterText(data: ScoreboardResponse | null, metric: 'refused' | 'missed') {
  if (!data || data.availability[metric].status !== 'observed' || data.counters[metric] === null) return 'Unavailable';
  return data.counters[metric]!.toLocaleString('en-US');
}
export function safePostMortem(value: unknown): value is string {
  return typeof value === 'string' && /^\/[a-z0-9/_-]+$/.test(value);
}
export function receiptPath(id: string) { return `/receipt/${encodeURIComponent(id)}`; }
export function rowAnchor(id: string) { return `record-${encodeURIComponent(id)}`; }
export function gradeText(row: ScoreboardRow) {
  return row.grade ?? (row.detail.gradeStatus === 'immature' ? 'Immature' : 'n/a · grade unavailable');
}
