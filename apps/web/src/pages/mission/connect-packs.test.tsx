import { renderToStaticMarkup as render } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PackSchema } from '@eko/shared';
import generated from '../../../../../harness-packs/generated/packs.json';
import { connectionReceived, fillPack, packAvailable } from '../../lib/mission';
import { demoPresets } from '../../mocks/demo/mission-packs';
import { ConnectScreen, PackCards } from './Connect';
import { createMissionDemo } from '../../mocks/demo/mission';
const packs = generated.map(p => PackSchema.parse(p));
afterEach(() => vi.unstubAllGlobals());
describe('096 Connect with generated launch packs', () => {
  it('renders real pack config/instructions, key issuance and pending connector stage', () => {
    const html = render(<ConnectScreen packs={packs} presets={demoPresets} flags={{}} phase="launch_week" />);
    expect(html).toContain('Generate key'); expect(html).toContain('MCP config');
    expect(html).toContain('approval_unavailable'); expect(html).toContain('session_start');
    expect(html).toContain('trade approvals are on'); expect(html).not.toContain('Customize → Connectors');
    const cards = render(<PackCards packs={packs} flags={{}} phase="launch_week" selected="claude_code" select={() => {}} />);
    expect(cards).toContain('Claude Code'); expect(cards).toContain('Generic MCP');
    expect(cards).not.toContain('Claude Desktop');
    expect(packAvailable(packs[2], {}, 'launch_week')).toBe(false);
    expect(packAvailable(packs[2], {}, 'token_live')).toBe(false);
    expect(packAvailable(packs[2], {}, 'tiers')).toBe(false);
    const snippet = fillPack(packs[0].configTemplate, 'synthetic-test-key', 'https://fixture.invalid/mcp');
    expect(JSON.parse(snippet).mcpServers.eko).toMatchObject({ url: 'https://fixture.invalid/mcp', headers: { Authorization: 'Bearer synthetic-test-key' } });
  });
  it('only confirms a persisted journal entry, never a successful auth or empty result; surfaces errors', async () => {
    const entry = createMissionDemo(1790852400000).journals.dca[0];
    const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ rows: [], cursor: null })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ rows: [entry], cursor: null })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'internal_error', message: 'Journal storage is unavailable' }), { status: 500 }));
    vi.stubGlobal('fetch', fetch);
    expect(await connectionReceived('sample-agent')).toBe(false);
    expect(await connectionReceived('sample-agent')).toBe(true);
    await expect(connectionReceived('sample-agent')).rejects.toMatchObject({ status: 500 });
    expect(fetch.mock.calls.every(([path]) => path === '/v1/agents/sample-agent/journal?limit=1')).toBe(true);
  });
});
