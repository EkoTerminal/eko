import type { EvidenceRef, Level, PlaybookId, PlaybookMatch } from '@eko/shared';
import { isAgentBait, normalizeIdentity, toUntrusted } from '@eko/untrusted';
import type { PlaybookConfig } from '../config/v1.js';
import { CONFIG_V1 } from '../config/v1.js';
import type { CardSources, HistoryView, PlaybookInput, PriorLaunch, Rule, Simulation } from './types.js';

const elevated = (level: Level) => level === 'monitor' || level === 'danger';
const sameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
function prior(s: CardSources, h: HistoryView): PriorLaunch[] {
  // TODO(spec): count unique prior coins within deployer/crew history;
  // ignore self/future launches so a repeated materialized row cannot inflate runs.
  const seen = new Set<string>();
  return h.launches.filter((p) => {
    const key = p.coin.toLowerCase();
    if (sameAddress(p.coin, s.coin) || p.createdAtSec >= s.createdAtSec || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function history(s: CardSources, h: HistoryView, id: PlaybookId): NonNullable<PlaybookMatch['history']> {
  const launches = prior(s, h).filter((p) => p.matches.some((m) => m.id === id && elevated(m.level)));
  return {
    deployerRuns: launches.filter((p) => p.relation !== 'crew').length,
    ...(h.crewId ? { crewId: h.crewId, crewRuns: launches.filter((p) => p.relation !== 'deployer').length } : {}),
  };
}
function stat(s: CardSources, id: PlaybookId, field: string, label: string, value: number | string): EvidenceRef {
  return { kind: 'stat', ref: `${s.coin}:${id}:${field}`, block: s.asOfBlock, label, value };
}
function address(ref: string, label: string): EvidenceRef { return { kind: 'address', ref, label }; }
function match(s: CardSources, h: HistoryView, id: PlaybookId, level: Level, evidence: EvidenceRef[]): PlaybookMatch {
  // TODO(spec): confidence calibration is unspecified. 1 means the deterministic
  // condition is satisfied by supplied data, not a calibrated probability of fraud.
  return { id, level, confidence: 1, evidence, history: history(s, h, id) };
}
function simEvidence(sim: Simulation | NonNullable<Simulation['deep']>): EvidenceRef[] {
  return [
    { kind: 'sim', ref: sim.id, block: sim.block, label: 'Buy-then-sell simulation', value: sim.returnedInputShare },
    { kind: 'sim', ref: sim.traceDigest, block: sim.block, label: 'Simulation trace digest' },
    // Revert strings originate in token-controlled code and stay in Untrusted.
    ...(sim.revert ? [{ kind: 'text' as const, ref: sim.id, block: sim.block, label: 'Sell revert', text: toUntrusted(sim.revert, 280) }] : []),
  ];
}
const suspicious = (sim: Simulation | NonNullable<Simulation['deep']>, loss: number) =>
  sim.buyOk && (!sim.sellOk || sim.returnedInputShare < (100 - loss) / 100);

export const honeypot: Rule<'honeypot'> = {
  id: 'honeypot', evaluate(s, h, cfg) {
    if (s.launchpad === 'pons' && s.antiSnipeActive) return null;
    const suspect = s.simulations?.find((p) => (p.confirmedBlockedExit ?? suspicious(p, cfg.minLossPct)) &&
      (!cfg.requireDeepSim || (p.deep?.block === p.block && (p.confirmedBlockedExit === true || suspicious(p.deep, cfg.minLossPct)))));
    if (suspect) return match(s, h, this.id, 'danger', [...simEvidence(suspect), ...(suspect.deep ? simEvidence(suspect.deep) : [])]);
    // §6.2: probe-only failure remains Info (contract_restricted), not Danger.
    const restricted = s.simulations?.find((p) => p.contractRestricted ?? suspicious(p, cfg.minLossPct));
    return restricted ? match(s, h, this.id, 'info', simEvidence(restricted)) : null;
  },
};

export const taxTrap: Rule<'tax_trap'> = {
  id: 'tax_trap', evaluate(s, h, cfg) {
    if (!s.taxes) return null;
    // TODO(spec): skip transient Pons anti-snipe taxes until the window ends;
    // they are not the fixed creator/standard fee measured by this rule.
    if (s.launchpad === 'pons' && s.antiSnipeActive) return null;
    const t = s.taxes;
    const measured = [t.buyPct, t.sellPct].filter((v): v is number => v !== null);
    const pons = s.launchpad === 'pons' ? s.pons : undefined;
    const increased = t.mutable && t.changes.some((c) => c.afterPct > c.beforePct);
    if (!measured.length && !increased) return null;
    // Use reconciled effective measurements; neither launchpad name nor getters establish immutability.
    const tax = Math.max(0, ...measured);
    const mutable = t.mutable===null ? null : t.mutable;
    const level = mutable ? (increased || tax > cfg.mutableMonitorMaxPct ? 'danger' : 'monitor') :
      tax <= cfg.fixedInfoMaxPct ? 'info' : tax <= cfg.fixedMonitorMaxPct ? 'monitor' : 'danger';
    return match(s, h, this.id, level, [
      stat(s, this.id, 'buyPct', 'Measured buy tax (%)', t.buyPct ?? 'unavailable'),
      stat(s, this.id, 'sellPct', 'Measured sell tax (%)', t.sellPct ?? 'unavailable'),
      stat(s, this.id, 'mutable', 'Confirmed live tax setter', mutable===null ? 'unavailable' : mutable ? 'yes' : 'no'),
      ...(pons?.creatorTaxPct != null ? [stat(s, this.id, 'creatorTaxPct', 'Creator tax getter (%)', pons.creatorTaxPct)] : []),
      ...(pons?.feePct != null ? [stat(s, this.id, 'ponsFeePct', 'Pons fee getter (%)', pons.feePct)] : []),
      ...(t.setter ? [t.setter] : []), ...(t.owner ? [address(t.owner, 'Tax owner')] : []), ...t.changes.map((c) => c.evidence),
    ]);
  },
};

export const removableLiquidity: Rule<'removable_liquidity'> = {
  id: 'removable_liquidity', evaluate(s, h, cfg) {
    if (!s.liquidity) return null;
    const l = s.liquidity;
    const controlled = l.positions.filter((p) => p.status === 'removable' && p.controlledBy !== 'other');
    const share = controlled.reduce((sum, p) => sum + p.share, 0);
    const removable = share >= cfg.deployerLpShare;
    if (!removable && (l.depth2Usd == null || l.depth2Usd >= cfg.thinDepth2PctUsd)) return null;
    return match(s, h, this.id, removable && l.priorRemovals.length >= cfg.priorRemovalsDanger ? 'danger' : 'monitor', [
      stat(s, this.id, 'share', 'Removable deployer/crew LP share', share), stat(s, this.id, 'depth', 'Depth within 2% (USD)', l.depth2Usd ?? 'unavailable'),
      ...controlled.flatMap((p) => [address(p.owner, 'LP owner'), ...p.evidence]), ...l.priorRemovals,
    ]);
  },
};
export const feeTrapPool: Rule<'fee_trap_pool'> = {
  id: 'fee_trap_pool', evaluate(s, h, cfg) {
    const pools = s.pools?.filter((p) => p.feeBps >= cfg.feeTrapBps) ?? [];
    if (!pools.length) return null;
    return match(s, h, this.id, pools.some((p) => p.deepest || p.defaultRoute) ? 'danger' : 'monitor', pools.flatMap((p) => [
      stat(s, this.id, `${p.id}:fee`, 'Pool fee (bps)', p.feeBps), stat(s, this.id, `${p.id}:share`, 'Pool liquidity share', p.liquidityShare),
      { kind: 'address', ref: p.id, label: 'Fee-trap pool' }, ...p.evidence,
    ]));
  },
};
export const stuckAtBonding: Rule<'stuck_at_bonding'> = {
  id: 'stuck_at_bonding', evaluate(s, h, cfg) {
    const c = s.curve;
    if (!c || c.ageH < cfg.minAgeH || c.volumeUsd <= 0 || c.volumeUsd < cfg.volToProgress * c.progressUsd) return null;
    // TODO(spec): progress means net quote-asset curve inflow in USD, so volume/
    // progress is dimensionless. Sum the largest ≤ topClusters volume shares.
    const clusters = [...c.clusters].sort((a, b) => b.volumeShare - a.volumeShare).slice(0, cfg.topClusters);
    const share = clusters.reduce((sum, p) => sum + p.volumeShare, 0);
    if (share < cfg.topClusterShare) return null;
    const runs = history(s, h, this.id).deployerRuns;
    return match(s, h, this.id, runs >= cfg.deployerStuckDanger ? 'danger' : 'monitor', [
      stat(s, this.id, 'ageH', 'Curve age (hours)', c.ageH), stat(s, this.id, 'volume', 'Curve volume (USD)', c.volumeUsd),
      stat(s, this.id, 'progress', 'Net curve progress (USD)', c.progressUsd), stat(s, this.id, 'clusters', 'Top cluster volume share', share),
      ...clusters.flatMap((p) => p.evidence), ...c.feeClaims,
    ]);
  },
};
export const washToTrend: Rule<'wash_to_trend'> = {
  id: 'wash_to_trend', evaluate(s, h, cfg) {
    const w = s.wash;
    if (!w || w.volumeUsd1h < cfg.minVolumeUsd1h) return null;
    const qualifying = w.roundTrips.filter((p) => p.durationSec <= cfg.roundTripSec && Math.abs(p.netShare) <= cfg.maxNetShare);
    const counts = new Map<string, number>();
    for (const trip of qualifying) counts.set(trip.actor.toLowerCase(), (counts.get(trip.actor.toLowerCase()) ?? 0) + 1);
    const trips = qualifying.filter(p => counts.get(p.actor.toLowerCase())! >= cfg.minRoundTripsPerActor);
    // Derive from disjoint cycling-wallet volume; a legacy estimate cannot count single flips.
    const pct = 100 * trips.reduce((n, p) => n + p.volumeUsd, 0) / w.volumeUsd1h;
    const perTrader = w.traders1h > 0 ? w.volumeUsd1h / w.traders1h : 0;
    if (pct < cfg.monitorPct && !(perTrader >= cfg.usdPerTrader1h && w.traders1h <= cfg.maxTraders)) return null;
    return match(s, h, this.id, pct >= cfg.dangerPct ? 'danger' : 'monitor', [
      stat(s, this.id, 'wash', 'Estimated wash volume (%)', pct), stat(s, this.id, 'perTrader', '1h volume per trader (USD)', perTrader),
      stat(s, this.id, 'traders', '1h trader count', w.traders1h), stat(s, this.id, 'volume', '1h volume (USD)', w.volumeUsd1h), ...trips.flatMap((p) => [address(p.actor, 'Round-trip actor'), ...p.evidence]),
    ]);
  },
};

export const cloneSwarm: Rule<'clone_swarm'> = {
  id: 'clone_swarm', evaluate(s, h, cfg) {
    const name = normalizeIdentity(s.name), symbol = normalizeIdentity(s.symbol);
    // TODO(spec): a trend lasts trendWindowMin from trendStartedAtSec; require
    // originalMinAgeMin age at clone creation. Rank ties resolve by address.
    const original = [...(s.trending ?? [])].sort((a, b) => a.rank - b.rank ||
      (a.coin.toLowerCase() < b.coin.toLowerCase() ? -1 : a.coin.toLowerCase() > b.coin.toLowerCase() ? 1 : 0)).find((p) =>
      !sameAddress(p.coin, s.coin) && p.rank >= 1 && p.rank <= cfg.trendingTopN &&
      s.createdAtSec - p.createdAtSec >= cfg.originalMinAgeMin * 60 &&
      s.createdAtSec >= p.trendStartedAtSec && s.createdAtSec - p.trendStartedAtSec <= cfg.trendWindowMin * 60 &&
      ((name !== '' && name === normalizeIdentity(p.name)) || (symbol !== '' && symbol === normalizeIdentity(p.symbol))));
    if (!original) return null;
    return match(s, h, this.id, s.dominantPair && s.dominantPair.share >= cfg.dominantPairShare ? 'danger' : 'monitor', [
      // Evidence carries the card's clone.originalAddress without extending shared types.
      address(original.coin, 'clone.originalAddress'), stat(s, this.id, 'similarity', 'Normalized identity equality', 1), ...original.evidence,
      ...(s.dominantPair ? [stat(s, this.id, 'pair', 'Dominant buyer–seller share', s.dominantPair.share),
        address(s.dominantPair.buyer, 'Dominant buyer'), address(s.dominantPair.seller, 'Dominant seller'), ...s.dominantPair.evidence] : []),
    ]);
  },
};
export const exemptInsiders: Rule<'exempt_insiders'> = {
  id: 'exempt_insiders', evaluate(s, h, cfg) {
    const p = s.launchpad === 'pons' ? s.pons : undefined;
    if (!p?.exemptions.length) return null;
    // §7.1 explicitly permits Info below the monitor share.
    const danger = p.boughtShare >= cfg.boughtSupplyDanger || p.exemptions.some((e) => e.crewRugRuns > 0);
    return match(s, h, this.id, danger ? 'danger' : p.boughtShare >= cfg.boughtSupplyMonitor ? 'monitor' : 'info', [
      ...p.exemptions.flatMap((e) => [e.log, address(e.wallet, 'Snipe-tax-exempt wallet'), stat(s, this.id, `${e.wallet}:rugs`, 'Exempt wallet crew rug runs', e.crewRugRuns)]),
      stat(s, this.id, 'bought', 'Exempt wallets bought supply share', p.boughtShare), stat(s, this.id, 'held', 'Exempt wallets held supply share', p.heldShare),
    ]);
  },
};
export const bundleDump: Rule<'bundle_dump'> = {
  id: 'bundle_dump', evaluate(s, h, cfg) {
    const groups = new Map<string, NonNullable<CardSources['earlyBuyers']>>();
    // TODO(spec): firstBlocks is a zero-based exclusive offset from launch block;
    // fundingWindowH is elapsed funding-to-buy time. Aggregate qualifying groups.
    for (const b of s.earlyBuyers ?? []) {
      if (b.buyBlock < s.createdAtBlock || b.buyBlock - s.createdAtBlock >= cfg.firstBlocks ||
        b.fundedAtSec > b.buyAtSec || b.buyAtSec - b.fundedAtSec > cfg.fundingWindowH * 3600) continue;
      const key = b.funder.toLowerCase();
      const group = groups.get(key) ?? [];
      if (!group.some((p) => sameAddress(p.wallet, b.wallet))) group.push(b);
      groups.set(key, group);
    }
    const buyers = [...groups.values()].filter((g) => g.length >= cfg.minWallets).flat();
    if (!buyers.length) return null;
    const share = buyers.reduce((n, b) => n + b.heldShare, 0);
    const selling = buyers.some((b) => b.sellingIntoNetInflow);
    if (share < cfg.heldMonitor && !selling) return null;
    return match(s, h, this.id, share >= cfg.heldDanger || selling ? 'danger' : 'monitor', [
      stat(s, this.id, 'held', 'Same-funder bundle held supply share', share),
      ...buyers.flatMap((b) => [address(b.funder, 'Bundle funder'), address(b.wallet, 'Early-block buyer'), ...b.evidence]),
    ]);
  },
};
export const migrationDump: Rule<'migration_dump'> = {
  id: 'migration_dump', evaluate(s, h, cfg) {
    const g = s.graduation;
    if (!g) return null;
    // TODO(spec): soldShare is each sell's share of aggregate insider holdings
    // at graduation; sum window sells and use maximum observed price impact.
    const sells = g.insiderSells.filter((p) => p.atSec >= g.atSec && p.atSec <= g.atSec + cfg.windowMin * 60 && p.atSec <= s.asOfSec);
    const sold = sells.reduce((n, p) => n + p.soldShare, 0);
    const impact = Math.max(0, ...sells.map((p) => p.priceImpactShare));
    if (sold < cfg.soldMonitor) return null;
    return match(s, h, this.id, sold >= cfg.soldDanger && impact >= cfg.impactDanger ? 'danger' : 'monitor', [
      g.tx, stat(s, this.id, 'sold', 'Insider holdings sold after graduation', sold), stat(s, this.id, 'impact', 'Migration price impact share', impact),
      ...sells.flatMap((p) => p.evidence),
    ]);
  },
};
export const maliciousHook: Rule<'malicious_hook'> = {
  id: 'malicious_hook', evaluate(s, h, cfg) {
    const hook = s.hook;
    if (!hook) return null;
    // TODO(spec): caller decodes return-delta bits from verified v4 permissions.
    // Unverified bits alone use the table's Monitor exception. Observed quote/
    // fee anomalies remain Danger even on a reviewed hook; review is not a bypass.
    const anomaly = Math.abs(hook.quoteSimGapPct) > cfg.quoteSimGapPct || hook.sellFeePct - hook.buyFeePct > cfg.asymmetricFeePp;
    const bits = !hook.reviewed && hook.returnDeltaPermissionBits !== 0;
    if (!anomaly && !bits) return null;
    return match(s, h, this.id, anomaly || (bits && hook.sourceVerified) ? 'danger' : 'monitor', [
      address(hook.address, 'v4 hook'), stat(s, this.id, 'bits', 'Hook permission bits', hook.permissionBits),
      stat(s, this.id, 'deltaBits', 'Return-delta permission bits', hook.returnDeltaPermissionBits),
      stat(s, this.id, 'gap', 'Quote versus simulation gap (%)', hook.quoteSimGapPct),
      stat(s, this.id, 'asymmetry', 'Sell minus buy fee (pp)', hook.sellFeePct - hook.buyFeePct), ...hook.evidence,
    ]);
  },
};
export const agentBait: Rule<'agent_bait'> = {
  id: 'agent_bait', evaluate(s, h, cfg) {
    const text = [{ ref: `${s.coin}:name`, raw: s.name }, { ref: `${s.coin}:symbol`, raw: s.symbol }, ...(s.tokenText ?? [])];
    const hits = text.map((t) => ({ ...t, raw: t.raw.slice(0, cfg.maxScanChars) })).filter((t) => isAgentBait(t.raw, cfg.maxScanChars));
    if (!hits.length) return null;
    // TODO(spec): the detector exposes a boolean, not hit spans. Preserve a
    // bounded sanitized excerpt per hit and interpret action-word co-occurrence
    // within that detector-positive field as the specified combined instructions.
    const danger = hits.some((t) => /\b(buy|approve|transfer|send)\b/.test(normalizeIdentity(t.raw)));
    return match(s, h, this.id, danger ? 'danger' : 'monitor', hits.map((t) => ({
      kind: 'text', ref: t.ref, block: s.asOfBlock, label: 'Agent-bait detector hit', text: toUntrusted(t.raw, cfg.maxScanChars),
    })));
  },
};
export const serialDeployer: Rule<'serial_deployer'> = {
  id: 'serial_deployer', evaluate(s, h, cfg) {
    const launches = prior(s, h);
    // §7.2 / 1.0.2: serial_deployer never supplies its own prior evidence.
    const other = (p: PriorLaunch) => p.matches.filter((m) => m.id !== this.id && elevated(m.level));
    const duration = { '1h': 3600, '24h': 86400, '7d': 7 * 86400 };
    const matured = (p: PriorLaunch) => p.outcomes.filter((o) => p.createdAtSec + duration[o.horizon] <= s.asOfSec &&
      (o.validFromBlock == null || o.validFromBlock <= s.asOfBlock));
    const badOutcome = (outcome: PriorLaunch['outcomes'][number]['outcome']) => cfg.dangerOutcomes.some((o) => o === outcome);
    const monitor = launches.filter((p) => other(p).length > 0);
    const danger = launches.filter((p) => other(p).some((m) => m.level === 'danger') || matured(p).some((o) => badOutcome(o.outcome)));
    const recent = launches.filter((p) => p.createdAtSec >= s.asOfSec - 7 * 86400);
    const deployerCount = (list: PriorLaunch[]) => list.filter((p) => p.relation !== 'crew').length;
    const crewCount = (list: PriorLaunch[]) => list.filter((p) => p.relation !== 'deployer').length;
    const count = (list: PriorLaunch[]) => Math.max(deployerCount(list), crewCount(list));
    const dangerRuns = count(danger), monitorRuns = count(monitor), spam = count(recent);
    const level = dangerRuns >= cfg.dangerRuns ? 'danger' : monitorRuns >= cfg.monitorRuns || spam >= cfg.spamLaunches7d ? 'monitor' : null;
    if (!level) return null;
    const qualifying = level === 'danger' ? danger : monitor;
    const result = match(s, h, this.id, level, [
      stat(s, this.id, 'runs', 'Prior launches with another elevated playbook', monitorRuns),
      stat(s, this.id, 'dangerRuns', 'Prior launches with bad outcomes or another danger playbook', dangerRuns),
      stat(s, this.id, 'recent', 'Deployer or crew launches in the last 7 days', spam),
      ...(['deployer', 'crew'] as const).flatMap((relation) => cfg.dangerOutcomes.map((outcome) => {
        const list = launches.filter((p) => p.relation === relation || p.relation === 'both');
        return stat(s, this.id, `${relation}:${outcome}`, `Earlier ${relation} launches ${outcome}`, list.filter((p) => matured(p).some((o) => o.outcome === outcome)).length);
      })),
      ...launches.flatMap((p) => [address(p.coin, 'Prior launch'), ...p.evidence,
        ...matured(p).flatMap((o) => [{ ...stat(s, this.id, `${p.coin}:${o.horizon}:outcome`, 'Prior launch outcome', `${o.horizon}:${o.outcome}`), block: o.validFromBlock ?? s.asOfBlock }, ...o.evidence]),
        ...other(p).map((m) => stat(s, this.id, `${p.coin}:${m.id}`, 'Prior playbook level', `${m.id}:${m.level}`))]),
    ]);
    // The serial exception reports qualifying priors, not this rule's own spam matches.
    result.history = { deployerRuns: deployerCount(qualifying), ...(h.crewId ? { crewId: h.crewId, crewRuns: crewCount(qualifying) } : {}) };
    return result;
  },
};

export const rules: { [K in keyof PlaybookConfig]: Rule<K> } = { honeypot, tax_trap: taxTrap, removable_liquidity: removableLiquidity, fee_trap_pool: feeTrapPool,
  stuck_at_bonding: stuckAtBonding, wash_to_trend: washToTrend, clone_swarm: cloneSwarm, exempt_insiders: exemptInsiders,
  bundle_dump: bundleDump, migration_dump: migrationDump, malicious_hook: maliciousHook, agent_bait: agentBait, serial_deployer: serialDeployer,
};

export function evaluatePlaybooks(input: PlaybookInput, config: PlaybookConfig = CONFIG_V1): PlaybookMatch[] {
  const matches: PlaybookMatch[] = [];
  function evaluate<K extends keyof PlaybookConfig>(id: K) {
    const result = rules[id].evaluate(input, input.history, config[id]);
    if (result) matches.push(result);
  }
  for (const id of Object.keys(rules) as (keyof PlaybookConfig)[]) evaluate(id);
  return matches;
}
