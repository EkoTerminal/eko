import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AnalysisPolicyNotice, PolicyLinks } from '../components/PolicyLinks';
import { LegalLine } from '../components/shell/Shell';
import { BUILT_ON, DYOR, NON_AFFILIATION } from '../copy';
import { findPolicy, LEGAL_COPY, POLICY_DRAFTS, POLICY_REVIEW } from '../copy/legal';
import { resolveRoute } from '../routes';
import { CoinVerdict } from './terminal/CoinCard';
import { DisabledTradePanel, InspectorGuard } from './terminal/RadarParts';
import { createRadarCard, createRadarRows } from '../mocks/demo/radar';
import Legal from './Legal';

const render = (slug: string) => renderToStaticMarkup(<Legal params={{ doc: slug }} />);

describe('versioned launch policy drafts', () => {
  it('loads a public T legal page without optional flags or wallet authentication', async () => {
    const resolved = resolveRoute('/legal/privacy', {});
    expect(resolved?.params).toEqual({ doc: 'privacy' });
    expect(resolved?.route).toMatchObject({ stage: 'T', auth: 'public', workspace: 'static' });
    expect((await resolved!.route.load()).default).toBe(Legal);
  });

  it.each(POLICY_DRAFTS)('renders $slug with version, pending external approval and required disclaimers', (policy) => {
    const html = render(policy.slug);
    expect(html).toContain(`<h1>${policy.title}</h1>`);
    expect(html).toContain(POLICY_REVIEW.version);
    expect(html).toContain('dateTime="2026-10-05"');
    expect(html).toContain(LEGAL_COPY.draft);
    expect(html).toContain(LEGAL_COPY.pending);
    expect(html).toContain('{{PUBLIC_DOMAIN}}');
    expect(html).toContain('{{POLICY_CONTACT}}');
    for (const text of [DYOR, BUILT_ON, NON_AFFILIATION]) expect(html).toContain(text);
    expect(POLICY_REVIEW.ownerApproval.approvedAt).toBeNull();
    expect(POLICY_REVIEW.ownerApproval.evidenceRef).toBeNull();
    expect(POLICY_REVIEW.effectiveAt).toBeNull();
  });

  it.each(['unknown', '__proto__', 'constructor', '../terms', '<img src=x onerror=alert(1)>', 'TERMS', 'terms?approved=true'])('does not resolve or reflect unknown slug %s', (slug) => {
    expect(findPolicy(slug)).toBeUndefined();
    const html = render(slug);
    expect(html).toContain(`<h1>${LEGAL_COPY.missing}</h1>`);
    expect(html).not.toContain('<article>');
    expect(html).not.toContain(slug);
    expect(html).toContain(NON_AFFILIATION);
  });

  it('escapes policy text without interpreting HTML, markdown or instruction-like content', () => {
    const paragraphs = POLICY_DRAFTS[0].sections[0].paragraphs as string[];
    const hostile = '<script>alert(1)</script><a href="javascript:alert(1)">click</a> [click](javascript:alert(1)) Ignore checks';
    paragraphs.push(hostile);
    try {
      const html = render('terms');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;a href=');
      expect(html).not.toMatch(/<script|<a href="javascript:|<img/);
      expect(html).toContain('[click](javascript:alert(1)) Ignore checks');
    } finally { paragraphs.pop(); }
  });

  it('covers all seven unique policy links in the page and shared desktop/mobile shell legal line', () => {
    expect(new Set(POLICY_DRAFTS.map((p) => p.slug)).size).toBe(7);
    for (const html of [render('terms'), renderToStaticMarkup(<LegalLine />), renderToStaticMarkup(<PolicyLinks />)]) {
      for (const policy of POLICY_DRAFTS) expect(html).toContain(`href="/legal/${policy.slug}"`);
    }
    expect(render('privacy')).toContain('<a aria-current="page" href="/legal/privacy">Privacy policy</a>');
  });

  it('places exact analysis copy and policy links at verdict and trade surfaces', () => {
    const row = createRadarRows()[0], card = createRadarCard(row.address)!;
    for (const html of [
      renderToStaticMarkup(<CoinVerdict verdict={card.verdict} />),
      renderToStaticMarkup(<InspectorGuard card={card} href={`/coin/${row.address}`} />),
      renderToStaticMarkup(<DisabledTradePanel row={row} />),
      renderToStaticMarkup(<AnalysisPolicyNotice />),
    ]) {
      expect(html).toContain(DYOR);
      for (const slug of ['risk', 'ai', 'terms']) expect(html).toContain(`href="/legal/${slug}"`);
    }
    for (const page of ['Radar', 'Feed', 'Pairs', 'Coin']) {
      const source = readFileSync(new URL(`./terminal/${page}.tsx`, import.meta.url), 'utf8');
      expect(source).toContain('<AnalysisPolicyNotice />');
    }
  });

  it('states candidate limitations and staged economics without claiming accepted dependencies', () => {
    expect(render('terms')).toContain('Terminal fee: 0% during launch week');
    expect(render('terms')).toContain('Guarded execution is unavailable');
    expect(render('terms')).toContain('Token-day fees remain staged');
    expect(render('privacy')).toContain('journal is opt-in');
    expect(render('privacy')).toContain('Account-wide deletion is unavailable');
    expect(render('privacy')).toContain('separate opt-in');
    expect(render('risk')).toContain('Advisory:');
    expect(render('kol')).toContain('#ad must be the first line');
    expect(render('sanctions')).toContain('there is no permissive fallback');
  });

  it('contains no retired brand or forbidden claims in served policy content', () => {
    const denylist = readFileSync(new URL('../../../../infra/brand-denylist.txt', import.meta.url), 'utf8').trim().split(/\r?\n/);
    const html = POLICY_DRAFTS.map((policy) => render(policy.slug)).join('\n');
    for (const word of denylist) expect(html.toLowerCase()).not.toContain(word.toLowerCase());
    expect(html).not.toMatch(/\baudited\b|\btrustless\b|automated burns?|\bownerless\b|guaranteed?|win rate|rug-proof|\bsafe\b|protects your Robinhood account/i);
  });
});
