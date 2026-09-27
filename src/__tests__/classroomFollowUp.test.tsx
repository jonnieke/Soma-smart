import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { parseClassroomFollowUp } from '../services/classroomFollowUp';
import { MarkdownText } from '../components/Shared';

afterEach(cleanup);
describe('classroom follow-up paragraph boundaries', () => {
  it('renders separate readable paragraphs even when the model prefixes a heading marker', () => {
    const answer = parseClassroomFollowUp(
      {
        topic: 'Soil erosion',
        explanationParagraphs: [
          '### What is soil erosion?',
          'Water or wind carries soil away.',
          '**Roots** help hold soil in place.',
        ],
        summaryPoints: ['Keep soil covered.'],
        relatedTopics: ['Plant roots'],
      },
      'Simple'
    );
    const { container } = render(<MarkdownText content={answer.explanation} />);
    expect(container.querySelectorAll('p')).toHaveLength(3);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Roots').tagName).toBe('STRONG');
    expect(answer.summaryPoints).toEqual(['Keep soil covered.']);
  });
  it('rejects incomplete responses instead of replacing the current lesson with an empty answer', () => {
    for (const explanationParagraphs of [undefined, [], [''], ['Good paragraph', null]]) {
      expect(() =>
        parseClassroomFollowUp({ topic: 'Soil erosion', explanationParagraphs }, 'Simple')
      ).toThrow();
    }
  });
});
