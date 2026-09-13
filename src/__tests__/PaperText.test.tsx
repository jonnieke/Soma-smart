import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { PaperText } from '../features/teacher/paperStudio/PaperText';
it('renders native MathML fractions and powers without HTML injection', () => {
  const { container } = render(<PaperText text={String.raw`Find $\frac{x^2}{\sqrt{4}}$. <script>alert(1)</script>`} />);
  expect(container.querySelector('math mfrac')).not.toBeNull();
  expect(container.querySelector('math msup')).not.toBeNull();
  expect(container.querySelector('math msqrt')).not.toBeNull();
  expect(container.querySelector('script')).toBeNull();
  expect(container.textContent).not.toContain('\\frac');
});
it('shows a visible correction message rather than hiding unsupported notation', () => {
  const { container } = render(<PaperText text={String.raw`$\unknown{x}$`} />);
  expect(screen.getByRole('alert')).toHaveTextContent('not supported');
  expect(container.querySelector('[data-paper-equation-error]')).not.toBeNull();
  expect(container.textContent).toContain(String.raw`$\unknown{x}$`);
});
