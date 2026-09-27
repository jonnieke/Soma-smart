import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import LearnerMarkdown, { learnerMathMarkdown } from '../components/LearnerMarkdown';
import { normalizeLearnerText } from '../services/learnerText';

afterEach(cleanup);
describe('learner maths and saved notes', () => {
  it('preserves TeX commands while normalizing escaped whitespace', () => {
    const math = String.raw`\(2 \times 3 \neq 5\)`;
    expect(normalizeLearnerText(math)).toBe(math);
    expect(normalizeLearnerText(String.raw`First\n Second\t point`)).toBe('First\n Second  point');
  });
  it('renders bold notes and accessible fractions without raw delimiters', () => {
    const { container } = render(<LearnerMarkdown content={String.raw`**Example:** \(\frac{1}{2} \times 4 = 2\)`} />);
    expect(container.querySelector('strong')?.textContent).toBe('Example:');
    expect(container.querySelector('math mfrac')).toBeTruthy();
    expect(container.querySelector('.katex-error')).toBeNull();
  });
  it('leaves code alone and never renders untrusted HTML', () => {
    const code = '`\\(x\\)`';
    expect(learnerMathMarkdown(code)).toBe(code);
    const { container } = render(<LearnerMarkdown content={'<img src=x onerror=alert(1) />'} />);
    expect(container.querySelector('img')).toBeNull();
  });
});
