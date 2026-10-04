import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadSdn } from '../src/sanctions/service.js';
afterEach(() => vi.unstubAllGlobals());
const source = 'https://ofac.treasury.gov/fixture.xml';
function stream(chunks: Uint8Array[], headers: Record<string, string> = {}) {
  const read = vi.fn(async () => chunks.length ? { done: false, value: chunks.shift()! } : { done: true });
  const cancel = vi.fn(async () => {});
  const fetch = vi.fn(async () => ({ status: 200, headers: new Headers(headers), body: { getReader: () => ({ read, cancel }) } }));
  vi.stubGlobal('fetch', fetch);
  return { fetch, read, cancel };
}
describe('bounded sanctions downloader', () => {
  it('decodes chunked UTF-8 and sends no credentials or redirects', async () => {
    const bytes = new TextEncoder().encode('<fixture>€</fixture>');
    const f = stream([bytes.slice(0, 10), bytes.slice(10)]);
    expect(await downloadSdn(source)).toBe('<fixture>€</fixture>');
    expect(f.fetch).toHaveBeenCalledWith(new URL(source), { redirect: 'error', signal: expect.any(AbortSignal), headers: { accept: 'application/xml, text/xml' } });
    expect(f.cancel).toHaveBeenCalledOnce();
  });
  it('rejects oversized declared bodies before reading', async () => {
    const f = stream([], { 'content-length': String(32 * 1024 * 1024 + 1) });
    await expect(downloadSdn(source)).rejects.toThrow('Source unavailable');
    expect(f.read).not.toHaveBeenCalled();
  });
  it('cancels oversized streamed bodies and malformed UTF-8', async () => {
    const f = stream([new Uint8Array(32 * 1024 * 1024), new Uint8Array(1)]);
    await expect(downloadSdn(source)).rejects.toThrow('Source too large'); expect(f.cancel).toHaveBeenCalledOnce();
    const invalid = stream([new Uint8Array([0xff])]);
    await expect(downloadSdn(source)).rejects.toThrow(); expect(invalid.cancel).toHaveBeenCalledOnce();
  });
  it('refuses error statuses, missing bodies and untrusted sources', async () => {
    const fetch = vi.fn(async () => ({ status: 503, headers: new Headers(), body: null }));
    vi.stubGlobal('fetch', fetch);
    await expect(downloadSdn(source)).rejects.toThrow('Source unavailable');
    fetch.mockResolvedValue({ status: 200, headers: new Headers(), body: null });
    await expect(downloadSdn(source)).rejects.toThrow('Source unavailable');
    fetch.mockClear();
    for (const url of ['https://treasury.gov.evil.test/list', source + '#fragment', 'http://treasury.gov/list'])
      await expect(downloadSdn(url)).rejects.toThrow('Invalid source');
    expect(fetch).not.toHaveBeenCalled();
  });
});
