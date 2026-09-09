import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { QuizRunner } from '../features/learner/QuizRunner';

afterEach(cleanup);
const data = { topic: 'Fractions', questions: [1, 2, 3].map(id => ({
  id, type: 'MCQ' as const, question: `Question ${id}`, options: ['A', 'B'], correctAnswer: 'A', explanation: 'Keep equal parts.'
})) };

it('lets learners return to notes before answering', () => {
  const onExit = vi.fn();
  render(<QuizRunner data={data} exitLabel="Back to notes" onExit={onExit} onComplete={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Back to notes' }));
  expect(onExit).toHaveBeenCalledOnce();
});

it('shows feedback and finishes after three questions', async () => {
  render(<QuizRunner data={data} exitLabel="Back to notes" onExit={vi.fn()} onComplete={vi.fn()} />);
  for (let index = 1; index <= 3; index++) {
    expect(await screen.findByText(`Question ${index}`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^A$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Check Answer' }));
    expect(await screen.findByText('Keep equal parts.')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: index === 3 ? /Finish Quiz/ : /Next Question/ }));
  }
  expect(await screen.findByText('Quiz Review')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Back to notes' })).toBeInTheDocument();
});
