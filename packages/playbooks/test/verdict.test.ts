import { expect, it } from 'vitest';
import { VerdictSchema } from '@eko/shared';
import type { PlaybookMatch } from '@eko/shared';
import { assembleVerdict, evaluatePlaybooks, reasonForMatch } from '../src/index.js';
import { addr, cloneFixture, evidence, pons, serial } from './fixtures.js';

const meta = { coin: addr(1), asOfBlock: 100, receipt: { id: 'receipt-1', hash: '0x123', status: 'pending' as const } };
const make = (id: PlaybookMatch['id'], level: PlaybookMatch['level']): PlaybookMatch => ({ id, level, confidence: 1, evidence: [] });

it('Info never escalates and empty matches are Clear', () => {
  for (const matches of [[], [make('tax_trap', 'info')], [make('tax_trap', 'info'), make('honeypot', 'info')]]) {
    const verdict = assembleVerdict(matches, meta);
    expect(verdict.level).toBe('clear'); expect(VerdictSchema.parse(verdict)).toEqual(verdict);
    expect(verdict).toMatchObject({ ...meta, schemaVersion: 'verdict-1' }); expect(verdict).not.toHaveProperty('beta');
  }
});
it('Monitor escalates and Danger wins regardless of input order', () => {
  const matches = [make('agent_bait', 'monitor'), make('tax_trap', 'info')];
  expect(assembleVerdict(matches, meta).level).toBe('monitor'); matches.push(make('honeypot', 'danger'));
  for (const input of [matches, [...matches].reverse()]) {
    expect(assembleVerdict(input, meta)).toMatchObject({ level: 'danger' });
    expect(assembleVerdict(input, meta).reasons[0]).toContain('deep simulation');
  }
});
it('at most three deterministic templated reasons, with dangerous matches first', () => {
  const matches = [make('tax_trap', 'info'), make('clone_swarm', 'monitor'), make('honeypot', 'danger'),
    make('migration_dump', 'danger'), make('serial_deployer', 'monitor'), make('agent_bait', 'danger')];
  const before = cloneFixture(matches); const verdict = assembleVerdict(matches, meta);
  expect(verdict.reasons).toHaveLength(3); expect(verdict.playbooks).toEqual(matches);
  expect(verdict.reasons).toEqual(assembleVerdict([...matches].reverse(), meta).reasons); expect(matches).toEqual(before);
  expect(assembleVerdict([matches[0], matches[0]], meta).reasons).toHaveLength(1);
});
it('Pons reasons name actual creator-tax and fee getter observations without immutability claims', () => {
  for (const [creator, expected] of [[4, 'clear'], [5, 'monitor']] as const) {
    const input = pons(0, creator); input.pons!.exemptions = [];
    const verdict = assembleVerdict(evaluatePlaybooks(input), meta);
    expect(verdict.level).toBe(expected); expect(verdict.reasons).toEqual([`Observed creator-tax getter ${creator}% and Pons-fee getter 1%.`]);
  }
});
it('Pons reason has no universal fee fallback', () => {
  const input = pons(0, 4); input.pons!.feePct = 1.73;
  const match = evaluatePlaybooks(input).find(m => m.id === 'tax_trap')!;
  expect(reasonForMatch(match)).toBe('Observed creator-tax getter 4% and Pons-fee getter 1.73%.');
  match.evidence = match.evidence.filter(e => e.label !== 'Pons fee getter (%)');
  expect(reasonForMatch(match)).toBe('Measured trading tax meets a fixed-tax or mutable-tax threshold.');
});
it('token text cannot supply reasons, even when evidence includes malicious text', () => {
  const match = make('agent_bait', 'danger');
  match.evidence = [{ kind: 'text', ref: 'token', label: 'Token text', value: 'UNTRUSTED INJECTION',
    text: { text: 'UNTRUSTED INJECTION', truncated: false, flags: ['agent_bait'] } }];
  expect(assembleVerdict([match], meta).reasons).toEqual(['Token text contains instructions aimed at agents.']);
  expect(reasonForMatch({ ...make('tax_trap', 'info'), evidence: [{ kind: 'stat', ref: 'token', label: 'Fixed creator tax (%)', value: 'INJECTION' }] })).not.toContain('INJECTION');
});
it('uses the caller receipt reference, including committed receipts', () => {
  const receipt = { ...meta.receipt, status: 'committed' as const, batchId: 3, txHash: '0xabc' };
  expect(assembleVerdict([], { ...meta, receipt }).receipt).toEqual(receipt);
});

it.each(['deployer', 'crew'] as const)('serial reasons name three matured dumped priors of the %s', (relation) => {
  const input = serial(3, 'info'); input.history.launches.forEach((p) => { p.relation = relation; p.outcomes = [{ horizon: '1h', outcome: 'dumped', evidence: [evidence('Dumped horizon')] }]; });
  const verdict = assembleVerdict(evaluatePlaybooks(input), meta);
  expect(verdict.level).toBe('danger'); expect(verdict.reasons).toEqual([`3 earlier launches by this ${relation} dumped.`]);
  for (const p of input.history.launches) expect(verdict.playbooks[0].evidence.some((e) => e.kind === 'address' && e.ref === p.coin)).toBe(true);
});
it('serial reasons reject arbitrary text in outcome-count evidence', () => {
  const match = make('serial_deployer', 'danger'); match.evidence = [{ kind: 'stat', ref: 'sample', label: 'Earlier deployer launches dumped', value: 'INJECTION' }];
  expect(reasonForMatch(match)).not.toContain('INJECTION');
});
