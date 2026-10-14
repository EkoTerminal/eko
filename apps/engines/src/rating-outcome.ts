import type { CoinCard } from '@eko/shared';
import { digest } from './card.js';

/**
 * Outcome is structural. Numeric evidence, confidence, history counts, explanations, signal and section blocks are
 * latest measurements in the mutable card. Published verdicts/receipts retain their original inputs and decision.
 */
export function ratingOutcome(card: CoinCard, rulesVersion: string) {
  const { curvePct: _, pools, ...identity } = card.identity;
  const poolIdentity=pools.map(({liquidityUsd: _liquidity, ...pool})=>pool).sort((a,b)=>a.id.localeCompare(b.id));
  return digest({ rulesVersion, schemaVersion: card.verdict.schemaVersion, level: card.verdict.level,
    matches: card.verdict.playbooks.map(m => ({ id: m.id, level: m.level })).sort((a,b) => a.id.localeCompare(b.id)),
    evaluated: [...new Set(card.verdict.evaluatedPlaybooks ?? [])].sort(),
    identity: {...identity,pools:poolIdentity}, setupGrade:card.verdict.beta?.setupGrade ?? null, control: card.control, clone: card.clone ?? null,
    honeypot: card.tradeability.honeypot, lpStatus: card.liquidity.lpStatus,
    antiSnipe: !!card.tradeability.antiSnipe,
    meta: Object.fromEntries(Object.entries(card.meta ?? {}).sort(([a],[b])=>a.localeCompare(b)).map(([key,m]) => [key, {
      unavailable: m.unavailable ?? false, missing: [...(m.missing ?? [])].sort(), flags: [...(m.flags ?? [])].sort(),
      coverage: Object.fromEntries(Object.entries(m.coverageGaps ?? {}).sort(([a],[b])=>a.localeCompare(b)).map(([key,g])=>[key,{status:g.status,reason:g.reason,window:g.window,threshold:g.threshold}])) }])) });
}
