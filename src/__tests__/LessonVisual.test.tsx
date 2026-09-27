import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LessonVisual } from '../features/learner/answer/LessonVisual';
import {
  findLessonIllustration,
  lessonIllustrations,
} from '../features/learner/answer/lessonIllustrations';

afterEach(cleanup);
describe('shared lesson visuals', () => {
  it('matches supported topics without borrowing an unrelated erosion image', () => {
    expect(findLessonIllustration('What is erosion?')?.id).toBe('soil-erosion');
    expect(findLessonIllustration('Preventing soil erosion')?.id).toBe('soil-erosion');
    expect(findLessonIllustration('PHOTOSYNTHESIS')?.id).toBe('photosynthesis');
    expect(findLessonIllustration('Equivalent fractions')?.id).toBe('fractions');
    for (const topic of [
      'Dental erosion',
      'Coastal erosion',
      'Glacial erosion',
      'Algebra',
      'Fractional distillation',
    ])
      expect(findLessonIllustration(topic)).toBeUndefined();
  });
  it('requires an attempt, gives explanatory feedback and lets the learner retry', () => {
    render(<LessonVisual visual={lessonIllustrations.fractions} />);
    const check = screen.getByRole('button', { name: 'Check this answer' });
    expect(check).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: 'One quarter' }));
    fireEvent.click(check);
    expect(screen.getByRole('status')).toHaveTextContent('Let’s look together.');
    expect(screen.getByRole('status')).toHaveTextContent('Two quarters cover one half');
    fireEvent.click(screen.getByRole('radio', { name: 'Two quarters' }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    fireEvent.click(check);
    expect(screen.getByRole('status')).toHaveTextContent('Yes, you’ve got it!');
  });
  it('keeps the lesson usable when its illustration cannot load', () => {
    render(<LessonVisual visual={lessonIllustrations['soil-erosion']} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(/Both hillsides receive rain/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'The bare hillside' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check this answer' }));
    expect(screen.getByRole('status')).toHaveTextContent('Yes, you’ve got it!');
  });
});
