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
  bundle_dump: 'Early buyers (bundled wallets, snipers or the deployer) took a large share of supply.',
  migration_dump: 'Insiders sold holdings in the graduation window.',
  malicious_hook: 'Hook permissions or observed quote/fee behavior meet a threshold.',
  agent_bait: 'Token text contains instructions aimed at agents.',
  serial_deployer: 'Deployer/crew launch history meets a repeat-launch threshold.',
  holder_concentration: 'A few wallets hold a large share of supply.',
  dev_dump: 'The deployer sold on buyers or holds a large share of supply.',
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
  if (match.id === 'bundle_dump') {
    const value = (label: string) => { const v = match.evidence.find((e) => e.kind === 'stat' && e.label === label)?.value; return typeof v === 'number' && Number.isFinite(v) ? v : null; };
    const bought = value('Early buyers bought supply share'), held = value('Early buyers still hold supply share'), wallets = value('Early buyer wallets'), bundled = value('Wallets bought by one funder');
    const dev = value('Deployer early bought supply share');
    const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;
    const who = wallets != null ? `${wallets} wallet${wallets === 1 ? '' : 's'}${dev ? ', the deployer among them,' : ''}` : '';
    // Held counts only the same wallets: early wallets often send tokens on to others, so a low share is not an exit.
    const now = held == null ? '' : `; ${wallets === 1 ? 'that wallet now holds' : 'those wallets now hold'} ${pct(held)}${bought != null && held < bought / 2 ? ' (sold or moved to other wallets)' : ''}`;
    const parts = [bought != null && wallets != null ? `${who} bought ${pct(bought)} of supply in the first 5 seconds${now}` : null,
      bundled != null ? `${bundled} wallets were bought for by one funder` : null].filter(Boolean);
    if (parts.length) return `${parts.join('; ')}.`.replace(/^./, (c) => c.toUpperCase());
  }
  if (match.id === 'holder_concentration' || match.id === 'dev_dump') {
    const value = (label: string) => { const v = match.evidence.find((e) => e.kind === 'stat' && e.label === label)?.value; return typeof v === 'number' && Number.isFinite(v) ? v : null; };
    const pct = (n: number) => `${Math.round(n * 1000) / 10}%`, usd = (n: number) => `$${n >= 100 ? Math.round(n).toLocaleString('en-US') : n.toFixed(2)}`;
    const parts: string[] = [];
    if (match.id === 'holder_concentration') {
      const top10 = value('Top 10 holders supply share'), largest = value('Largest non-deployer holder supply share'), moved = value('Supply held by top holders that never bought'), wallets = value('Top holders that never bought');
      if (top10 != null && top10 >= 0.2) parts.push(`The top 10 holders own ${pct(top10)} of supply`);
      if (largest != null && largest >= 0.1) parts.push(`one wallet other than the deployer owns ${pct(largest)}`);
      if (moved != null && moved >= 0.05 && wallets) parts.push(`${wallets} of the largest holders never bought and hold${wallets === 1 ? 's' : ''} ${pct(moved)} (transferred in)`);
    } else {
      const held = value('Deployer holds supply share'), sold = value('Deployer sold supply share'), into = value('Deployer bought (USD)'), out = value('Deployer sold (USD)'), first = value('Deployer first sell (seconds after launch)');
      if (value('Deployer dumped') && into != null && out != null && sold != null && first != null)
        parts.push(`The deployer put in ${usd(into)}, took out ${usd(out)} (${pct(sold)} of supply) and first sold ${Math.round(first)} seconds after launch`);
      if (held != null && held >= 0.05) parts.push(`${parts.length ? 'it' : 'The deployer'} still holds ${pct(held)} of supply`);
    }
    if (parts.length) return `${parts.join('; ')}.`.replace(/^./, (c) => c.toUpperCase());
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

/**
 * Choose danger over monitor over clear and emit up to three deduplicated reasons ordered by
 * severity then id, retaining supplied metadata/matches. Pure rule-consumer call without auth;
 * assumes typed evidence, does not prove completeness or validate schema, and malformed input can
 * throw.
 * @see {@link ../../../SECURITY.md#privileged-powers | Privileged powers}
 * @see {@link ../../../docs/security/INVARIANTS.md | Guard, policy and approval invariants}
 */
export function assembleVerdict(matches: PlaybookMatch[], meta: VerdictMeta): Verdict {
  const level = matches.some((m) => m.level === 'danger') ? 'danger' : matches.some((m) => m.level === 'monitor') ? 'monitor' : 'clear';
  // TODO(spec): reason ordering is unspecified; severity first, then stable
  // playbook id, deduplicated to three. No beta is emitted before the swarm.
  const ordered = [...matches].sort((a, b) => rank[b.level] - rank[a.level] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { ...meta, level, reasons: [...new Set(ordered.map(reasonForMatch))].slice(0, 3), playbooks: matches,
    schemaVersion: 'verdict-1' };
}
