import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildLearnerNotes,
  LearnerAnswerNotes,
} from '../features/learner/answer/LearnerAnswerNotes';
import type { ExplanationResult } from '../types';
vi.mock('../components/Shared', () => ({
  MarkdownText: ({ content }: { content: string }) => <div>{content}</div>,
}));
afterEach(cleanup);
const answer: ExplanationResult = {
  topic: 'Photosynthesis',
  explanation: 'Plants make food using light.',
  summaryPoints: ['Plants need water.'],
  level: 'Simple',
};
const props = () => ({
  answer,
  onBack: vi.fn(),
  onListen: vi.fn(),
  listening: false,
  onPractise: vi.fn(),
  onExample: vi.fn(),
  examplesUsed: 1,
  busy: false,
});
describe('learner answer notes', () => {
  it('does not start a quiz automatically and lets the learner leave', () => {
    const callbacks = props();
    render(<LearnerAnswerNotes {...callbacks} />);
    expect(callbacks.onPractise).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Back to learning/ }));
    expect(callbacks.onBack).toHaveBeenCalledOnce();
    expect(callbacks.onPractise).not.toHaveBeenCalled();
  });
  it('disables new requests while busy but lets audio stop', () => {
    const callbacks = props();
    render(<LearnerAnswerNotes {...callbacks} busy listening />);
    expect(screen.getByRole('button', { name: /Quick quiz/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Stop listening' }));
    expect(callbacks.onListen).toHaveBeenCalledOnce();
  });
  it('shows one explanation and clear primary actions', () => {
    const callbacks = props();
    render(<LearnerAnswerNotes {...callbacks} />);
    expect(screen.getAllByText(answer.explanation)).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Quick quiz · 3 questions' }));
    expect(callbacks.onListen).toHaveBeenCalledOnce();
    expect(callbacks.onPractise).toHaveBeenCalledOnce();
  });
  it('renders structured paragraphs and list blocks, not just subtopic titles', () => {
    const notes = buildLearnerNotes({
      ...answer,
      subtopics: [
        {
          title: 'Ingredients',
          blocks: [
            { type: 'paragraph', text: 'Leaves absorb light.' },
            { type: 'list', items: ['Water', 'Carbon dioxide'] },
          ],
        },
      ],
    });
    expect(notes[0].content).toBe('Leaves absorb light.\n\n- Water\n- Carbon dioxide');
  });
  it('deduplicates exact repeated notes and overview text', () => {
    expect(
      buildLearnerNotes({
        ...answer,
        summaryPoints: [answer.explanation, 'Water is needed.', 'Water is needed.'],
      })
    ).toEqual([{ title: '', content: 'Water is needed.' }]);
  });
  it('keeps legacy detailed paragraphs accessible without repeating the introduction', () => {
    render(
      <LearnerAnswerNotes
        {...props()}
        answer={{ ...answer, explanation: 'Introduction.\n\nMore detail.' }}
      />
    );
    expect(screen.getAllByText('Introduction.')).toHaveLength(1);
    expect(screen.getByText('Read the full explanation').closest('details')).not.toHaveAttribute(
      'open'
    );
    expect(screen.getByText('More detail.')).toBeInTheDocument();
  });
  it('puts a worked example after notes and retains the three-example limit', () => {
    render(
      <LearnerAnswerNotes
        {...props()}
        examplesUsed={3}
        answer={{
          ...answer,
          practice: {
            isProblem: true,
            originalQuestion: '2 + 3 = ?',
            workedExample: '4 + 5 = 9',
            yourTurnPrompt: '',
          },
        }}
      />
    );
    expect(screen.getByRole('heading', { name: 'Worked example' })).toBeInTheDocument();
    expect(
      screen.getByText('Now it’s your turn to try the question. You can do it!')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try the question using your notes' })
    ).toBeDisabled();
  });
  it('keeps secondary tools under collapsed More', () => {
    render(
      <LearnerAnswerNotes {...props()}>
        <button>Share</button>
      </LearnerAnswerNotes>
    );
    expect(screen.getByText('More').closest('details')).not.toHaveAttribute('open');
    expect(
      screen.getByRole('button', { name: 'Share', hidden: true }).closest('details')
    ).not.toHaveAttribute('open');
  });
});
