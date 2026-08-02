import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import * as copy from './index';

const src = dirname(dirname(fileURLToPath(import.meta.url)));
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]);
}
const sourceFiles = files(src).filter((file) => /\.(tsx?|css)$/.test(file) && !/\.test\./.test(file));
const FORBIDDEN = [/price support/i, /\bfloor\b/i, /\bbid\b/i, /our chart gets bought/i, /number go up/i,
  /strict(ly)? (guardrail|enforced)/i, /guaranteed?/i, /rug-?proof/i, /100% safe/i, /win rate/i, /\balpha\b/i,
  /never lose/i, /\bthe only\b/i, /first ever/i, /partner(ed|ship)? with Robinhood/i, /\$HOOD/i, /\bHood\b/,
  /\bHood Chain/i, /29M agents/i, /express this view/i,
  /only way out/i, /only leave as a burn/i, /leaves? only as a burn/i,
  /buys? the dip/i, /speeds? up on dips?/i, /dip accelerator/i,
  /trustless burns?/i, /automated burns?/i, /\baudited\b/i,
  /ownerless/i, /(no ?one|nobody) can touch/i];

describe('canonical §8 copy', () => {
  it('snapshots every exact constant and fee wording', () => {
    expect({ ...copy, FEE_TO_BURN: copy.FEE_TO_BURN('0.5%') }).toMatchSnapshot();
    expect(copy.FEE_TO_BURN('0%')).toBe('0% → burn wallet (burned daily)');
  });
  it('keeps disclaimers out of hard-coded source text outside copy/', () => {
    const violations: string[] = [];
    for (const file of sourceFiles.filter((file) => !file.startsWith(join(src, 'copy') + '/'))) {
      const content = readFileSync(file, 'utf8');
      if (content.includes(copy.NON_AFFILIATION)) violations.push(file);
      const ast = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const visit = (node: ts.Node) => {
        if ((ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node) || ts.isJsxText(node)) && /\bDYOR\b/.test(node.text)) violations.push(file);
        ts.forEachChild(node, visit);
      };
      visit(ast);
    }
    expect(violations).toEqual([]);
  });
  it('rejects forbidden claims in canonical copy and marketing', () => {
    const violations: string[] = [];
    for (const file of sourceFiles.filter((file) => file.startsWith(join(src, 'copy') + '/') || file.startsWith(join(src, 'marketing') + '/'))) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (line.includes('// copy-allow:')) return;
        if (FORBIDDEN.some((pattern) => pattern.test(line))) violations.push(`${file}:${i + 1}`);
      });
    }
    expect(violations).toEqual([]);
  });
});
