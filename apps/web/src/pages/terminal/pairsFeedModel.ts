import { formatGuardReason, GUARD_REASON_LABELS, GuardReasonV2Schema, GuardReasonCodeSchema, GuardFactorIdSchema, guardName } from '@eko/shared';
import { z } from 'zod';
import { FeedItemSchema, PairRowSchema, type FeedItem, type PairRow, type Untrusted } from '@eko/shared';
import type { ChannelEvent } from '../../lib/realtime';
import { launchedAt, PLAYBOOK_NAMES, receivedAt, type ReceivedAt } from './radarModel';
import { PLAYBOOK_DESCRIPTIONS } from '../../copy/playbooks';
import { WALLET_LABEL_WORD } from '../../components/ui';

export const COLUMNS = ['new', 'near_grad', 'migrated'] as const;
export const PairResponseSchema = z.object({ rows: z.array(PairRowSchema), cursor: z.string().nullable(), delayedSec: z.number(), unavailable:z.array(z.string()).optional() });
export const FeedResponseSchema = z.object({ rows: z.array(FeedItemSchema), cursor: z.string().nullable(), delayedSec: z.number(), unavailable:z.array(z.string()).optional() });
export { launchedAt, receivedAt, type ReceivedAt };
export function pairColumns(rows: readonly PairRow[], received?: ReceivedAt) {
  // TODO(spec): PairRow has no migration timestamp. Keep the server's migrated order; WS migrations prepend the row.
  const newest = (a: PairRow, b: PairRow) => launchedAt(b, received) - launchedAt(a, received) || (a.address < b.address ? -1 : a.address > b.address ? 1 : 0);
  return Object.fromEntries(COLUMNS.map((column) => [column, rows.filter((r) => r.column === column).sort((a, b) => column === 'migrated' ? 0 : column === 'near_grad' ? (b.curvePct ?? 0) - (a.curvePct ?? 0) : newest(a, b)).slice(0, 100)])) as Record<PairRow['column'], PairRow[]>;
}
export function applyPairEvents(rows: readonly PairRow[], events: readonly ChannelEvent<'pairs'>[], received?: ReceivedAt) {
  let next = [...rows];
  for (const event of events) {
    if (event.kind === 'pair_remove') next = next.filter((r) => r.address !== event.data.address || r.column !== event.data.column);
    else { const previous = next.find(r => r.address === event.data.address); next = next.filter((r) => r.address !== event.data.address); next.unshift({ ...event.data, ...(event.data.guardV2 === undefined && previous?.guardV2 !== undefined ? {guardV2:previous.guardV2,guardRefreshFailed:previous.guardRefreshFailed} : {}) }); }
  }
  const columns = pairColumns(next, received);
  return COLUMNS.flatMap((column) => columns[column]);
}
export function antiSnipeLeft(endsInSec: number, receivedAt: number, now: number) {
  return Math.max(0, Math.ceil(endsInSec - Math.max(0, now - receivedAt) / 1000));
}
// TODO(spec): antiSnipe has no decay curve. Interpolate linearly from the supplied tax to zero, matching the prototype, until a new reading arrives.
export function antiSnipeTax(taxPct: number, endsInSec: number, receivedAt: number, now: number) {
  if (endsInSec <= 0) return 0;
  return Math.max(0, Math.round(taxPct * Math.max(0, endsInSec - Math.max(0, now - receivedAt) / 1000) / endsInSec));
}
export const pairTradeDisabled = (row: PairRow, stale = false, tradingLive = true) => row.verdictPending || row.verdict === 'danger' || stale || !tradingLive;
export const FEED_RING = 500;
export interface FeedBuffer { items: FeedItem[]; waiting: FeedItem[] }
export function feedRing(rows: readonly FeedItem[]) {
  const unique = new Map<string, FeedItem>();
  rows.forEach((item) => { if (!unique.has(item.id)) unique.set(item.id, item); });
  return [...unique.values()].sort((a, b) => b.ts - a.ts).slice(0, FEED_RING);
}
export function receiveFeed(buffer: FeedBuffer, rows: readonly FeedItem[], paused: boolean): FeedBuffer {
  return paused ? { items: buffer.items, waiting: feedRing([...rows.filter((r) => !buffer.items.some((i) => i.id === r.id)), ...buffer.waiting]) }
    : { items: feedRing([...rows, ...buffer.waiting, ...buffer.items]), waiting: [] };
}
export const flushFeed = (buffer: FeedBuffer): FeedBuffer => ({ items: feedRing([...buffer.waiting, ...buffer.items]), waiting: [] });
export const FEED_GROUPS = ['trade', 'scan', 'alert', 'ghost', 'swarm', 'launch', 'burn'] as const;
export type FeedGroup = typeof FEED_GROUPS[number];
export const feedGroup = (kind: FeedItem['kind']): FeedGroup => ({ agent_trade: 'trade', crew_trade: 'trade', verdict: 'scan', playbook: 'alert', clone: 'ghost', wash: 'alert', swarm: 'swarm', new_pair: 'launch', graduation: 'launch', burn: 'burn' })[kind] as FeedGroup;
// CA-32: each optional field contributes only its own part of the description.
export type DescriptionStyle = 'label' | 'name' | 'address' | 'muted' | 'buy' | 'sell' | 'ghost';
export type DescriptionPart = { text: string; style?: DescriptionStyle } | { value: Untrusted; prefix?: string; style?: DescriptionStyle };
export function feedDescriptionParts(item: FeedItem): DescriptionPart[] {
  if (item.guardReason) return [{ text: formatGuardReason(GuardReasonV2Schema.parse(item.guardReason)) }];
  if (item.guardReasonCode) return [{ text: GUARD_REASON_LABELS[GuardReasonCodeSchema.parse(item.guardReasonCode)] }];
  if (item.guardFactorId) return [{ text: guardName(GuardFactorIdSchema.parse(item.guardFactorId)) }];
  const parts: DescriptionPart[] = [];
  const text = (value: string, style?: DescriptionStyle) => parts.push({ text: value, style });
  const separator = () => text('·', 'muted');
  switch (item.kind) {
    case 'agent_trade': case 'crew_trade':
      if (item.label) text(WALLET_LABEL_WORD[item.label], 'label');
      if (item.agentName) parts.push({ value: item.agentName, style: 'name' });
      else if (item.crewName) text(item.crewName, 'name');
      else if (item.wallet) text(`${item.wallet.slice(0, 6)}…${item.wallet.slice(-4)}`, 'address');
      if (item.crewWallets !== undefined) text(`${item.crewWallets} wallets`, 'muted');
      if (item.side) text(item.side === 'buy' ? 'bought' : 'sold', item.side);
      break;
    case 'verdict':
      text(item.firstVerdictMs === undefined ? 'First verdict' : `First verdict in ${(item.firstVerdictMs / 1000).toFixed(1)} s`);
      separator(); text(item.playbookId ? PLAYBOOK_NAMES[item.playbookId] : 'no playbook matched', 'muted');
      break;
    case 'playbook':
      if (item.playbookId) text(PLAYBOOK_NAMES[item.playbookId], 'name');
      text(item.matchPct === undefined ? 'matched' : `matched at ${Math.round(item.matchPct)}%`, 'muted');
      if (item.playbookId) { separator(); text(PLAYBOOK_DESCRIPTIONS[item.playbookId]); }
      break;
    case 'clone':
      text('Ghost Report', 'ghost');
      if (item.cloneOf) { separator(); text('Clone of'); parts.push({ value: item.cloneOf, prefix: '$', style: 'name' }); }
      if (item.clones7d !== undefined) { separator(); text(`${item.clones7d} clones from this crew this week`, 'muted'); }
      break;
    case 'wash': text('Playbook alert'); separator(); text('Wash trading'); break;
    case 'swarm':
      if (item.swarm) { text(`${item.swarm.pass} of ${item.swarm.of} personas pass`); separator(); }
      text('graded against all launches', 'muted');
      break;
    case 'new_pair': text('New pair created'); break;
    case 'graduation': text('Graduated to a pool'); break;
    case 'burn': text('Burn recorded'); break;
  }
  return parts;
}
export function feedDescription(item: FeedItem): string {
  return feedDescriptionParts(item).map((part) => 'text' in part ? part.text : `${part.prefix ?? ''}${part.value.text}`).join(' ');
}
