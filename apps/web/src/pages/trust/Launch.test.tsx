import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { resolveRoute } from '../../routes';
import { BUILT_ON, DYOR, NON_AFFILIATION } from '../../copy';
import { LegalLine } from '../../components/shell/Shell';
import { Official, Transparency } from './Launch';

describe('prepared public launch pages', () => {
  it.each([['/official', Official], ['/transparency', Transparency]] as const)('loads %s publicly without activation flags', async (path, Page) => {
    const route = resolveRoute(path, {});
    expect(route?.route).toMatchObject({ stage: 'T', auth: 'public', workspace: 'trust' });
    expect((await route!.route.load()).default).toBe(Page);
    const html = renderToStaticMarkup(<Page />);
    for (const text of [BUILT_ON, NON_AFFILIATION, DYOR, 'We have no token yet at T', 'release evidence pending']) expect(html).toContain(text);
    expect(html).not.toMatch(/href="(?:https?:|mailto:)|0x[0-9a-fA-F]{40}|<button/);
    expect(html).not.toMatch(/\baudited\b|\btrustless\b|automated burns?|\bownerless\b|guaranteed?|win rate|rug-proof|\bsafe\b|protects your Robinhood account/i);
  });
  it('keeps unresolved identifiers and disclosure delivery visibly pending', () => {
    const html = renderToStaticMarkup(<Official />);
    expect(html).toContain('{{PUBLIC_DOMAIN}}');
    expect(html).toContain('Forwarding pending owner confirmation');
    expect(html).toContain('No live or funded bounty');
    expect((html.match(/verified public record pending/g) ?? []).length).toBe(6);
    for (const name of ['contracts', 'playbooks', 'receipts-verifier']) expect(html).toContain(name);
  });
  it('distinguishes dates, historical evidence and deployment from acceptance', () => {
    const html = renderToStaticMarkup(<Transparency />);
    for (const text of ['October 13, 2026, 13:00 UTC', 'October 16, 2026, 13:00 UTC', 'October 18', 'restarts the full 72 hours', '92.04%', 'Three contract findings remain open', 'No final sign-off', 'before its review is accepted', 'verification remains unavailable']) expect(html).toContain(text);
  });
  it('links both pages from the shared desktop/mobile legal footer', () => {
    const html = renderToStaticMarkup(<LegalLine />);
    expect(html).toContain('href="/official"');
    expect(html).toContain('href="/transparency"');
  });
});
