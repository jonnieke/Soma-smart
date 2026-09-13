/** Deliberately bounded LaTeX subset, shared by preview MathML and Word OMML. */
export type EquationNode =
  | { kind: 'text'; value: string }
  | { kind: 'fraction'; numerator: EquationNode[]; denominator: EquationNode[] }
  | { kind: 'root'; children: EquationNode[]; degree?: EquationNode[] }
  | { kind: 'scripts'; base: EquationNode[]; sub?: EquationNode[]; sup?: EquationNode[] };
export type EquationSegment = { kind: 'text'; value: string } | { kind: 'equation'; nodes: EquationNode[]; source: string; display: boolean };

const symbols: Record<string, string> = {
  times: '×', div: '÷', cdot: '·', pm: '±', mp: '∓', le: '≤', leq: '≤', ge: '≥', geq: '≥',
  ne: '≠', neq: '≠', approx: '≈', pi: 'π', theta: 'θ', alpha: 'α', beta: 'β', gamma: 'γ',
  delta: 'δ', Delta: 'Δ', lambda: 'λ', mu: 'μ', sigma: 'σ', omega: 'ω', Omega: 'Ω',
  infty: '∞', degree: '°', circ: '∘', '%': '%', '{': '{', '}': '}', ',': ' ', ';': ' ', ' ': ' ',
};
const fail = (detail: string): never => { throw new Error(`Equation needs attention: ${detail} Your paper is unchanged.`); };

export function parsePaperEquation(source: string): EquationNode[] {
  if (!source.trim() || source.length > 4000) return fail('use a non-empty equation under 4,000 characters.');
  let cursor = 0;
  const skipSpace = () => { while (/\s/.test(source[cursor] || '') && cursor < source.length) cursor++; };
  const group = (depth: number, open = '{', close = '}'): EquationNode[] => {
    skipSpace();
    if (source[cursor++] !== open) return fail(`expected ${open} around an equation argument.`);
    const nodes = sequence(depth + 1, close);
    if (source[cursor++] !== close || !nodes.length) return fail('an equation argument is empty or has an unmatched bracket.');
    return nodes;
  };
  const atom = (depth: number): EquationNode[] => {
    if (depth > 24) return fail('the equation is nested too deeply.');
    skipSpace();
    const char = source[cursor];
    if (!char) return fail('an equation argument is missing.');
    if (char === '{') return group(depth);
    cursor++;
    if (char === '\\') {
      const match = /^[a-zA-Z]+/.exec(source.slice(cursor));
      const command = match?.[0] || source[cursor] || '';
      cursor += command.length;
      if (command === 'frac' || command === 'dfrac' || command === 'tfrac') {
        return [{ kind: 'fraction', numerator: group(depth), denominator: group(depth) }];
      }
      if (command === 'sqrt') {
        skipSpace();
        const degree = source[cursor] === '[' ? group(depth, '[', ']') : undefined;
        return [{ kind: 'root', degree, children: group(depth) }];
      }
      if (Object.hasOwn(symbols, command)) return [{ kind: 'text', value: symbols[command] }];
      return fail(`the command \\${command} is not supported yet.`);
    }
    if ('}^_$&#%'.includes(char)) return fail(`unexpected ${char} in the equation.`);
    return [{ kind: 'text', value: char }];
  };
  const sequence = (depth: number, end?: string): EquationNode[] => {
    if (depth > 24) return fail('the equation is nested too deeply.');
    const nodes: EquationNode[] = [];
    skipSpace();
    while (cursor < source.length && source[cursor] !== end) {
      const base = atom(depth);
      let sub: EquationNode[] | undefined;
      let sup: EquationNode[] | undefined;
      skipSpace();
      while (source[cursor] === '^' || source[cursor] === '_') {
        const script = source[cursor++];
        if ((script === '^' && sup) || (script === '_' && sub)) return fail('a base has repeated powers or subscripts; use braces to show the intended grouping.');
        const value = atom(depth + 1);
        if (script === '^') sup = value; else sub = value;
        skipSpace();
      }
      nodes.push(...(sub || sup ? [{ kind: 'scripts' as const, base, sub, sup }] : base));
    }
    return nodes;
  };
  return sequence(0);
}

export function splitPaperEquations(text: string): EquationSegment[] {
  const segments: EquationSegment[] = [];
  let plain = '';
  const flush = () => { if (plain) { segments.push({ kind: 'text', value: plain }); plain = ''; } };
  for (let i = 0; i < text.length;) {
    if (text.startsWith('\\$', i)) { plain += '$'; i += 2; continue; }
    const opener = text.startsWith('$$', i) ? '$$' : text.startsWith('\\(', i) ? '\\(' : text.startsWith('\\[', i) ? '\\[' : text[i] === '$' ? '$' : '';
    if (!opener) {
      if (text[i] === '\\' && /[a-zA-Z)\]]/.test(text[i + 1] || '')) return fail('place the complete formula between $...$ or \\( ... \\).');
      plain += text[i++]; continue;
    }
    const closer = opener === '\\(' ? '\\)' : opener === '\\[' ? '\\]' : opener;
    const end = text.indexOf(closer, i + opener.length);
    // Keep ordinary currency prose such as "$20 and $30" untouched.
    if (opener === '$' && /\d/.test(text[i + 1] || '') && (end < 0 || /\s$/.test(text.slice(i + 1, end)))) {
      plain += '$'; i++; continue;
    }
    if (end < 0) return fail(`the closing ${closer} delimiter is missing.`);
    const source = text.slice(i + opener.length, end);
    flush();
    segments.push({ kind: 'equation', nodes: parsePaperEquation(source), source, display: opener === '$$' || opener === '\\[' });
    i = end + closer.length;
  }
  flush();
  return segments;
}
