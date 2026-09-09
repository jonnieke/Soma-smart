import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LearnerLibrary, libraryContents, type LibraryEntry } from '../features/learner/home/LearnerLibrary';

afterEach(cleanup);
const entries: LibraryEntry[] = [
  ...Array.from({ length: 8 }, (_, index) => ({ id: String(index), title: `Chapter ${index + 1}`, subject: index % 2 ? 'MATHEMATICS' : 'Mathematics', grade: 'Grade 7', category: 'NOTES', access: 'FREE' as const })),
  { id: 'g8', title: 'Another grade', subject: 'Mathematics', grade: 'Grade 8', category: 'NOTES', access: 'FREE' },
  { id: 'paper', title: 'Revision paper', subject: 'English', grade: 'Grade 7', category: 'PAST_PAPER', access: 'FREE' },
  { id: 'paid', title: 'Purchased notes', subject: 'English', grade: 'Grade 7', category: 'NOTES', access: 'OWNED' },
];
const props = () => ({ entries, grade: 'Grade 7', subject: 'ALL', onGrade: vi.fn(), onSubject: vi.fn(), onHome: vi.fn(), onOpen: vi.fn(), onPractice: vi.fn() });

describe('Learner subject contents', () => {
  it('matches exact grades without falling back to a different grade', () => {
    expect(libraryContents(entries, 'Grade 9', 'ALL', '')).toEqual([]);
    expect(libraryContents(entries, 'Grade 7 (JSS)', 'mathematics', '')).toHaveLength(8);
  });
  it('combines subject casing variants into one shelf', () => {
    const callbacks = props();
    render(<LearnerLibrary {...callbacks} />);
    const maths = screen.getAllByRole('button', { name: /mathematics\s*view contents/i });
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
    render(<LearnerLibrary {...props()} subject="English" entries={[{ ...entries[0], subject: 'English', access: 'PURCHASE' }]} />);
    expect(screen.getByText('View access')).toBeInTheDocument();
  });
});
