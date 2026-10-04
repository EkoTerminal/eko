// Offline validator for the deliberately restricted PromQL used by launch rules.
// Deployment still requires the target Prometheus version's promtool check rules.
export function validateRules(input, { metrics, measurements, checks }) {
  const fail = () => { throw new Error('Invalid Prometheus launch rules'); };
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const only = (value, keys) => object(value) && Object.keys(value).every(k => keys.includes(k));
  if (!only(input, ['groups']) || !Array.isArray(input.groups) || !input.groups.length) fail();
  const names = new Set();
  const parse = source => {
    if (typeof source !== 'string' || !source.length) fail();
    const tokens = source.match(/\s+|"(?:[^"\\]|\\.)*"|[a-zA-Z_:][a-zA-Z0-9_:]*|(?:\d+(?:\.\d+)?)(?:ms|[smhdwy])?|==|!=|=~|!~|>=|<=|[{}()[\],=<>+\-*/]/g) ?? [];
    if (tokens.join('') !== source) fail();
    const t = tokens.filter(v => !/^\s+$/.test(v)); let i = 0;
    const take = expected => { if (t[i++] !== expected) fail(); };
    const identifier = () => { const v = t[i++]; if (!/^[a-zA-Z_:][a-zA-Z0-9_:]*$/.test(v ?? '')) fail(); return v; };
    const precedence = { or: 1, and: 2, '==': 3, '!=': 3, '>': 3, '<': 3, '>=': 3, '<=': 3, '+': 4, '-': 4, '*': 5, '/': 5 };
    const primary = () => {
      if (t[i] === '(') { i++; const kind = expression(0); take(')'); return kind; }
      if (/^\d+(\.\d+)?$/.test(t[i] ?? '')) { i++; return 'scalar'; }
      const name = identifier();
      if (t[i] === '(') {
        i++;
        if (name === 'time') { take(')'); return 'scalar'; }
        if (!['absent', 'increase'].includes(name)) fail();
        const kind = expression(0); take(')');
        if (kind !== (name === 'increase' ? 'range' : 'vector')) fail();
        return 'vector';
      }
      if (!metrics.includes(name)) fail();
      if (t[i] === '{') {
        i++; const labels = new Set();
        while (t[i] !== '}') {
          const label = identifier(); if (labels.has(label)) fail(); labels.add(label);
          const op = t[i++]; if (!['=', '!=', '=~', '!~'].includes(op)) fail();
          const raw = t[i++]; if (!raw?.startsWith('"')) fail();
          let value; try { value = JSON.parse(raw); } catch { fail(); }
          const allowed = label === 'metric' ? measurements : label === 'check' ? checks : null;
          if (allowed) {
            if (op === '=~' || op === '!~') {
              let pattern; try { pattern = new RegExp(`^(?:${value})$`); } catch { fail(); }
              if (!allowed.some(n => pattern.test(n)) || value.split('|').some(n => !allowed.includes(n))) fail();
            } else if (!allowed.includes(value)) fail();
          } else if (!['instance', 'job'].includes(label)) fail();
          if (t[i] !== ',') break; i++;
        }
        take('}');
      }
      if (t[i] === '[') {
        i++; if (!/^\d+(ms|[smhdwy])$/.test(t[i++] ?? '')) fail(); take(']'); return 'range';
      }
      return 'vector';
    };
    const expression = min => {
      let kind = primary();
      while (precedence[t[i]] >= min) {
        const op = t[i++], logical = ['or', 'and'].includes(op);
        if (['on', 'ignoring'].includes(t[i])) {
          if (kind !== 'vector') fail(); i++; take('('); identifier();
          while (t[i] === ',') { i++; identifier(); } take(')');
        }
        const right = expression(precedence[op] + 1);
        if (kind === 'range' || right === 'range' || logical && (kind !== 'vector' || right !== 'vector')) fail();
        kind = kind === 'vector' || right === 'vector' ? 'vector' : 'scalar';
      }
      return kind;
    };
    if (expression(0) !== 'vector' || i !== t.length) fail();
  };
  for (const group of input.groups) {
    if (!only(group, ['name', 'rules']) || typeof group.name !== 'string' || !group.name || !Array.isArray(group.rules) || !group.rules.length) fail();
    for (const rule of group.rules) {
      if (!only(rule, ['alert', 'expr', 'for', 'labels', 'annotations']) || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(rule.alert ?? '') || names.has(rule.alert)) fail();
      names.add(rule.alert);
      if (!object(rule.labels) || !['1', '2', '3'].includes(rule.labels.severity) || !object(rule.annotations) || !rule.annotations.summary) fail();
      if (![...Object.values(rule.labels), ...Object.values(rule.annotations)].every(v => typeof v === 'string')) fail();
      if (rule.for !== undefined && !/^\d+(ms|[smhdwy])$/.test(rule.for)) fail();
      parse(rule.expr);
    }
  }
  return input;
}
