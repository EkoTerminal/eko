import type { Level, PlaybookId, PlaybookMatch, Verdict } from '@eko/shared';
import type { VerdictMeta } from './types.js';

const templates: Record<PlaybookId, string> = {
  honeypot: 'A deep simulation confirmed a failed sell or less than 5% returned.',
  tax_trap: 'Measured trading tax meets a fixed-tax or mutable-tax threshold.',
  removable_liquidity: 'Deployer/crew liquidity is removable or 2% depth is thin.',
  fee_trap_pool: 'A pool charges a fee of at least 15%.',
  stuck_at_bonding: 'Curve volume is concentrated in clusters with little progress.',
  wash_to_trend: 'Estimated wash activity or volume per trader meets a threshold.',
  clone_swarm: 'Normalized identity matches an older trending coin.',
  exempt_insiders: 'Snipe-tax-exempt wallets bought supply or have crew rug history.',
  bundle_dump: 'Same-funder early buyers hold a bundle or sell into net inflow.',
  migration_dump: 'Insiders sold holdings in the graduation window.',
  malicious_hook: 'Hook permissions or observed quote/fee behavior meet a threshold.',
  agent_bait: 'Token text contains instructions aimed at agents.',
  serial_deployer: 'Deployer/crew launch history meets a repeat-launch threshold.',
};
const rank: Record<Level, number> = { danger: 3, monitor: 2, info: 1, clear: 0 };

export function reasonForMatch(match: PlaybookMatch): string {
  if (match.id === 'honeypot' && match.level === 'info') return 'The contract probe failed; a honeypot has not been confirmed by deep simulation.';
  if (match.id === 'tax_trap') {
    const creator = match.evidence.find((e) => e.kind === 'stat' && e.label === 'Creator tax getter (%)');
    const fee = match.evidence.find((e) => e.kind === 'stat' && e.label === 'Pons fee getter (%)');
    if (typeof creator?.value === 'number' && Number.isFinite(creator.value) && typeof fee?.value === 'number' && Number.isFinite(fee.value))
      return `Observed creator-tax getter ${creator.value}% and Pons-fee getter ${fee.value}%.`;
  }
  if (match.id === 'serial_deployer' && match.level === 'danger') {
    for (const relation of ['deployer', 'crew'] as const) for (const outcome of ['rugged', 'honeypot', 'dumped'] as const) {
      const count = match.evidence.find((e) => e.kind === 'stat' && e.label === `Earlier ${relation} launches ${outcome}`)?.value;
      if (typeof count === 'number' && Number.isSafeInteger(count) && count >= 3) {
        const subject = relation === 'deployer' ? 'this deployer' : 'this crew';
        return outcome === 'honeypot' ? `${count} earlier launches by ${subject} ended as honeypots.` : outcome === 'rugged' ? `${count} earlier launches by ${subject} were rugged.` : `${count} earlier launches by ${subject} dumped.`;
      }
    }
  }
  return templates[match.id];
}

export function assembleVerdict(matches: PlaybookMatch[], meta: VerdictMeta): Verdict {
  const level = matches.some((m) => m.level === 'danger') ? 'danger' : matches.some((m) => m.level === 'monitor') ? 'monitor' : 'clear';
  // TODO(spec): reason ordering is unspecified; severity first, then stable
  // playbook id, deduplicated to three. No beta is emitted before the swarm.
  const ordered = [...matches].sort((a, b) => rank[b.level] - rank[a.level] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { ...meta, level, reasons: [...new Set(ordered.map(reasonForMatch))].slice(0, 3), playbooks: matches,
    schemaVersion: 'verdict-1' };
}
