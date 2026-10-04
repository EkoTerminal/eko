import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Lockup, LogoMark } from './brand';
import { Workspace } from '../pages/Workspace';

const MARK = 'M202 5H122a118 118 0 0 0 0 236h80V151l-52 48-17-17 50-49h-73v-22h73l-50-49 17-17 52 48V5Z';

describe('EKO shell branding', () => {
  it('renders the approved centre emblem without a retired asset request', () => {
    const html = renderToStaticMarkup(createElement(LogoMark));
    expect(html).toContain('viewBox="0 0 428 246"');
    expect(html).toContain('fill="none" stroke="currentColor" stroke-width="6.5"');
    expect(html).toContain(`d="${MARK}"`);
    expect(html).not.toContain('<img');
    expect(renderToStaticMarkup(createElement(Lockup))).toContain('EKO');
    expect(renderToStaticMarkup(createElement(Lockup))).toContain('class="eko-wordmark"');
  });

  it('renders a terminal placeholder after retiring the markets, analyst and paper UI', () => {
    const html = renderToStaticMarkup(createElement(Workspace));
    expect(html).toContain('EKO terminal');
    expect(html).toContain('The terminal is being built.');
    expect(html).not.toMatch(/Markets|analyst|BUY|SELL|Paper|Positions/);
  });
});
