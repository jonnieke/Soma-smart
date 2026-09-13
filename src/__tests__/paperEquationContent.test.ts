import { expect, it } from 'vitest';
import { parsePaperEquation, splitPaperEquations } from '../services/paperEquationContent';

it('shares grouped formula structure without evaluating or changing its values', () => {
  const nodes = parsePaperEquation(String.raw`\frac{x_i^2+1}{\sqrt[3]{8}}`);
  expect(nodes[0]).toMatchObject({ kind: 'fraction', numerator: [
    { kind: 'scripts', base: [{ kind: 'text', value: 'x' }], sub: [{ kind: 'text', value: 'i' }], sup: [{ kind: 'text', value: '2' }] },
    { kind: 'text', value: '+' }, { kind: 'text', value: '1' },
  ], denominator: [{ kind: 'root', degree: [{ kind: 'text', value: '3' }], children: [{ kind: 'text', value: '8' }] }] });
});
it('supports inline and display delimiters and keeps prose and line breaks', () => {
  const result = splitPaperEquations('Find $x^2$.\nThen \\(y_1\\), $$a+b$$ and \\[c+d\\].');
  expect(result.filter(s => s.kind === 'equation')).toHaveLength(4);
  expect(result[2]).toEqual({ kind: 'text', value: '.\nThen ' });
  expect(result.filter(s => s.kind === 'equation' && s.display)).toHaveLength(2);
});
it('keeps money and escaped currency as ordinary text', () => {
  expect(splitPaperEquations('Pay $20 and $30.')).toEqual([{ kind: 'text', value: 'Pay $20 and $30.' }]);
  expect(splitPaperEquations(String.raw`Pay \$20.`)).toEqual([{ kind: 'text', value: 'Pay $20.' }]);
});
it('keeps nested fractions and grouped powers', () => {
  expect(parsePaperEquation(String.raw`{ab}^{12}`)[0]).toMatchObject({ kind: 'scripts', base: [{ kind: 'text', value: 'a' }, { kind: 'text', value: 'b' }], sup: [{ kind: 'text', value: '1' }, { kind: 'text', value: '2' }] });
  expect(parsePaperEquation(String.raw`\frac{1}{\frac{2}{3}}`)[0]).toMatchObject({ kind: 'fraction', denominator: [{ kind: 'fraction' }] });
});
it('preserves common symbols', () => {
  expect(parsePaperEquation(String.raw`\pi\times2\leq\theta`).map(n => n.kind === 'text' ? n.value : '')).toEqual(['π', '×', '2', '≤', 'θ']);
});
it.each([String.raw`\frac{1}`, String.raw`\sqrt{}`, 'x^^2', 'x_1_2', '{x', 'x}', String.raw`\begin{matrix}x\end{matrix}`, 'a&b'])('fails explicitly for invalid or unsupported notation: %s', source => {
  expect(() => parsePaperEquation(source)).toThrow('Equation needs attention');
});
it('rejects unmatched delimiters, undelimited commands and excessive nesting', () => {
  expect(() => splitPaperEquations('Solve $x^2')).toThrow('closing');
  expect(() => splitPaperEquations(String.raw`Solve \frac{1}{2}`)).toThrow('complete formula');
  expect(() => parsePaperEquation('{'.repeat(40) + 'x' + '}'.repeat(40))).toThrow('nested');
  expect(() => parsePaperEquation('x'.repeat(4001))).toThrow('4,000');
});
