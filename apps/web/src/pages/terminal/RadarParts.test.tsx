import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createRadarRows } from '../../mocks/demo/radar';
import { DisabledTradePanel, FlowBar, HotStrip, RadarRowView } from './RadarParts';
import partsSource from './RadarParts.tsx?raw';
import radarSource from './Radar.tsx?raw';
describe('Radar contract-driven row and trade slots', () => {
  const row=createRadarRows()[0];
  const renderRow=(c= row)=>renderToStaticMarkup(<table><tbody><RadarRowView c={c} selected={false} select={()=>undefined} trade={()=>undefined} pulse={0}/></tbody></table>);
  it('hides absent CA-31 elements and always tags optional Ape Score beta',()=>{
    const html=renderRow({...row,signal:undefined,spark8h:undefined,beta:{apeScore:87}});
    expect(html).not.toContain('rt-read'); expect(html).not.toContain('class="spark"'); expect(html).toContain('Beta'); expect(html).toContain('87');
    expect(renderRow()).not.toContain('Beta Ape Score');
  });
  it('shows an accessible unavailable value instead of an incomplete price spark',()=>{
    const html=renderRow({...row,spark8h:undefined,unavailable:['spark']});
    expect(html).toContain('class="c-spark"><span');expect(html).toContain('aria-label="Not checked yet"');expect(html).not.toContain('rt-spark');
  });
  it('escapes symbols and names instead of interpreting source instructions',()=>{
    const html=renderRow({...row,symbol:{text:'<img src=x onerror=alert(1)>',flags:['agent_bait'],truncated:false}});
    expect(html).not.toContain('<img'); expect(html).toContain('&lt;img'); expect(html).toContain('Agent bait');
  });
  it('never renders a beta flow without confidence, and hides an absent split',()=>{
    const html=renderToStaticMarkup(<FlowBar flow={row.flow} legend/>); expect(html).toContain('Beta'); expect(html).toContain('86% confidence'); expect(html).toContain('Declared agents'); expect(html).toContain('Likely agents');
    const noSplit=renderToStaticMarkup(<FlowBar flow={{...row.flow,declaredAgentPct:undefined,likelyAgentPct:undefined}} legend/>); expect(noSplit).not.toContain('Declared agents'); expect(noSplit).not.toContain('Likely agents');
  });
  it('shows one Signal beta marker and no agent confidence line in Hot tiles',()=>{
    const html=renderToStaticMarkup(<HotStrip coins={[row]} selected={null} select={()=>undefined}/>);
    expect(html.match(/>Beta</g)).toHaveLength(1); expect(html).not.toContain('confidence');
  });
  it('disables the whole trade fieldset and never emits a fabricated quote',()=>{
    const html=renderToStaticMarkup(<DisabledTradePanel row={row}/>); expect(html).toContain('<fieldset disabled=""'); expect(html).toContain('Trading opens with the guarded panel'); expect(html).toContain('Sell simulation'); expect(html).not.toContain('≈');
  });
  it('calls the signal "Signal · five readings", never agents, with one Beta marker in the column header (BACKEND §7.7)',()=>{
    expect(partsSource).toContain('Signal · five readings'); expect(partsSource).not.toMatch(/five[- ]agent/i);
    expect(renderRow()).not.toContain('signal-beta'); expect(radarSource).toContain('className="c-sig r">Signal <span className="tag signal-beta">Beta</span>');
  });
});
