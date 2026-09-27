import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LearnerLibrary,
  libraryContents,
  recentStudyIds,
  SUBJECT_GRADES,
  type LibraryEntry,
} from '../features/learner/home/LearnerLibrary';

afterEach(cleanup);
const entries: LibraryEntry[] = [
  ...Array.from({ length: 8 }, (_, index) => ({
    id: String(index),
    title: `Chapter ${index + 1}`,
    subject: index % 2 ? 'MATHEMATICS' : 'Mathematics',
    grade: 'Grade 7',
    category: 'NOTES',
    access: 'FREE' as const,
  })),
  {
    id: 'g8',
    title: 'Another grade',
    subject: 'Mathematics',
    grade: 'Grade 8',
    category: 'NOTES',
    access: 'FREE',
  },
  {
    id: 'paper',
    title: 'Revision paper',
    subject: 'English',
    grade: 'Grade 7',
    category: 'PAST_PAPER',
    access: 'FREE',
  },
  {
    id: 'paid',
    title: 'Purchased notes',
    subject: 'English',
    grade: 'Grade 7',
    category: 'NOTES',
    access: 'OWNED',
  },
];
const props = () => ({
  entries,
  grade: 'Grade 7',
  subject: 'ALL',
  onGrade: vi.fn(),
  onSubject: vi.fn(),
  onHome: vi.fn(),
  onOpen: vi.fn(),
  onPractice: vi.fn(),
});

describe('Learner subject contents', () => {
  it('connects visible navigation and scanning', () => {
    const onNotes = vi.fn(),
      onVideos = vi.fn(),
      onScan = vi.fn(),
      onProfile = vi.fn(),
      onHomepage = vi.fn();
    const callbacks = props();
    render(
      <LearnerLibrary {...callbacks} {...{ onNotes, onVideos, onScan, onProfile, onHomepage }} />
    );
    for (const [label, callback] of [
      ['My notes', onNotes],
      ['Learning videos', onVideos],
      ['Scan a question', onScan],
      ['Open your profile', onProfile],
      ['Soma AI homepage', onHomepage],
      ['My classroom', callbacks.onHome],
      ['Past papers', callbacks.onPractice],
    ] as const) {
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(callback).toHaveBeenCalledOnce();
    }
  });
  it('keeps all supported grades selectable even with an empty library', () => {
    render(<LearnerLibrary {...props()} entries={[]} />);
    for (const grade of SUBJECT_GRADES)
      expect(screen.getByRole('option', { name: grade })).toBeInTheDocument();
    expect(screen.getByText('No materials here yet')).toBeInTheDocument();
  });
  it.each(SUBJECT_GRADES)('sends the selected subject, topic and %s into learning', (grade) => {
    const onLearnTopic = vi.fn();
    render(
      <LearnerLibrary
        {...props()}
        grade={grade}
        subject="Mathematics"
        onLearnTopic={onLearnTopic}
      />
    );
    fireEvent.change(screen.getByLabelText('What topic shall we learn?'), {
      target: { value: 'Fractions' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start learning with Akili' }));
    expect(onLearnTopic).toHaveBeenCalledWith('Fractions', 'Mathematics', grade);
  });
  it('requires a grade and subject before requesting an AI lesson', () => {
    render(<LearnerLibrary {...props()} grade="" onLearnTopic={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('What topic shall we learn?'), {
      target: { value: 'Fractions' },
    });
    expect(screen.getByRole('button', { name: 'Start learning with Akili' })).toBeDisabled();
    expect(screen.getByText(/Choose your grade above/)).toBeInTheDocument();
  });
  it('supports topics without published material while clearly stating their AI origin', () => {
    const onLearnTopic = vi.fn();
    render(<LearnerLibrary {...props()} entries={[]} onLearnTopic={onLearnTopic} />);
    fireEvent.change(screen.getByLabelText('Subject', { exact: true }), {
      target: { value: '__other' },
    });
    fireEvent.change(screen.getByLabelText('Subject name'), {
      target: { value: 'Integrated Science' },
    });
    fireEvent.change(screen.getByLabelText('What topic shall we learn?'), {
      target: { value: 'Soil erosion' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start learning with Akili' }));
    expect(onLearnTopic).toHaveBeenCalledWith('Soil erosion', 'Integrated Science', 'Grade 7');
    expect(screen.getByText(/AI lessons use your learning allowance/)).toBeInTheDocument();
  });
  it('keeps new AI lessons disabled offline', () => {
    render(
      <LearnerLibrary {...props()} subject="Mathematics" online={false} onLearnTopic={vi.fn()} />
    );
    fireEvent.change(screen.getByLabelText('What topic shall we learn?'), {
      target: { value: 'Fractions' },
    });
    expect(screen.getByRole('button', { name: 'Start learning with Akili' })).toBeDisabled();
  });
  it('offers continuation only for real matching study records and retains the access callback', () => {
    const callbacks = props();
    render(<LearnerLibrary {...callbacks} recentIds={['g8', 'paid']} />);
    expect(screen.queryByText('Another grade')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue this lesson' }));
    expect(callbacks.onOpen).toHaveBeenCalledWith('paid');
  });
  it('skips malformed history and deduplicates opened materials without inventing completion', () => {
    expect(
      recentStudyIds([
        { type: 'STUDY', details: '{' },
        { type: 'QUIZ', details: '{"materialId":"wrong"}' },
        { type: 'STUDY', details: '{"materialId":"real"}' },
        { type: 'STUDY', details: '{"materialId":"real"}' },
      ])
    ).toEqual(['real']);
  });
  it('matches exact grades without falling back to a different grade', () => {
    expect(libraryContents(entries, 'Grade 9', 'ALL', '')).toEqual([]);
    expect(libraryContents(entries, 'Grade 7 (JSS)', 'mathematics', '')).toHaveLength(8);
  });
  it('combines subject casing variants into one shelf', () => {
    const callbacks = props();
    render(<LearnerLibrary {...callbacks} />);
    const maths = screen.getAllByRole('button', { name: /mathematics\s*explore topics/i });
    expect(maths).toHaveLength(1);
    fireEvent.click(maths[0]);
    expect(callbacks.onSubject).toHaveBeenCalledOnce();
  });
  it('shows every reading title, including items beyond the former six-item limit', () => {
    const callbacks = props();
    render(<LearnerLibrary {...callbacks} subject="Mathematics" />);
    expect(screen.getByText('Chapter 8')).toBeInTheDocument();
    expect(screen.queryByText('Another grade')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Chapter 8/ }));
    expect(callbacks.onOpen).toHaveBeenCalledWith('7');
  });
  it('offers search and a recoverable no-results state', () => {
    render(<LearnerLibrary {...props()} subject="Mathematics" />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'unknown title' } });
    expect(screen.getByText('No matching titles')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
  });
  it('resets the subject when changing grade', () => {
    const callbacks = props();
    render(<LearnerLibrary {...callbacks} subject="Mathematics" />);
    fireEvent.change(screen.getByLabelText('Grade or level'), { target: { value: 'Grade 8' } });
    expect(callbacks.onGrade).toHaveBeenCalledWith('Grade 8');
    expect(callbacks.onSubject).toHaveBeenCalledWith('ALL');
  });
  it('keeps purchased materials findable without a separate dashboard', () => {
    render(<LearnerLibrary {...props()} subject="English" />);
    fireEvent.click(screen.getByLabelText('Only materials I have purchased'));
    expect(screen.getByText('Purchased notes')).toBeInTheDocument();
    expect(screen.queryByText('Revision paper')).toBeNull();
  });
  it('labels paid access instead of pretending a locked material can be read', () => {
    render(
      <LearnerLibrary
        {...props()}
        subject="English"
        entries={[{ ...entries[0], subject: 'English', access: 'PURCHASE' }]}
      />
    );
    expect(screen.getByText('View access')).toBeInTheDocument();
  });
});
