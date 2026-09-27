import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LearnerClassroom,
  type LearnerClassroomProps,
} from '../features/learner/classroom/LearnerClassroom';
import {
  initialClassroomLesson,
  starterClassroomLesson,
} from '../features/learner/classroom/classroomLessons';

afterEach(cleanup);
function props(): LearnerClassroomProps {
  return {
    answer: starterClassroomLesson,
    name: 'Gabu Learner',
    grade: 'Grade 7',
    busy: false,
    listening: false,
    recording: false,
    examplesUsed: 0,
    onHome: vi.fn(),
    onSubjects: vi.fn(),
    onNotes: vi.fn(),
    onPapers: vi.fn(),
    onProfile: vi.fn(),
    onHomepage: vi.fn(),
    onAsk: vi.fn(),
    onScan: vi.fn(),
    onUpload: vi.fn(),
    onSpeak: vi.fn(),
    onSimplify: vi.fn(),
    onExample: vi.fn(),
    onListen: vi.fn(),
    onPractise: vi.fn(),
    onSave: vi.fn(),
    onNext: vi.fn(),
    onVideos: vi.fn(),
  };
}
describe('learner classroom', () => {
  it('personalizes the classroom and connects navigation', () => {
    const p = props();
    render(<LearnerClassroom {...p} />);
    expect(screen.getByRole('heading', { name: 'Welcome back, Gabu.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose your grade' })).toHaveTextContent('Grade 7');
    fireEvent.click(screen.getByRole('button', { name: 'Subjects' }));
    fireEvent.click(screen.getByRole('button', { name: 'My notes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Past papers' }));
    expect(p.onSubjects).toHaveBeenCalledOnce();
    expect(p.onNotes).toHaveBeenCalledOnce();
    expect(p.onPapers).toHaveBeenCalledOnce();
  });
  it('checks the learner attempt and allows a retry', () => {
    render(<LearnerClassroom {...props()} />);
    const check = screen.getByRole('button', { name: 'Check my answer' });
    expect(check).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: 'The grassy hillside' }));
    fireEvent.click(check);
    expect(screen.getByText('Let’s look together.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'The bare hillside' }));
    fireEvent.click(check);
    expect(screen.getByText('Yes, you’ve got it!')).toBeInTheDocument();
  });
  it('submits the question and connects the input and tutor controls', () => {
    const p = props();
    render(<LearnerClassroom {...p} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: ' Why do roots help? ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));
    expect(p.onAsk).toHaveBeenCalledWith('Why do roots help?');
    for (const label of [
      'Scan',
      'Upload',
      'Speak',
      'Explain more simply',
      'Show me an example',
      'Read this aloud',
    ])
      fireEvent.click(screen.getByRole('button', { name: label }));
    for (const handler of [p.onScan, p.onUpload, p.onSpeak, p.onSimplify, p.onExample, p.onListen])
      expect(handler).toHaveBeenCalledOnce();
  });
  it('does not claim to have saved before the save action and continues the topic', () => {
    const p = props();
    render(<LearnerClassroom {...p} />);
    expect(screen.queryByRole('button', { name: 'Saved in My notes' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save in My notes' }));
    expect(p.onSave).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Saved in My notes' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Next: Protecting/ }));
    expect(p.onNext).toHaveBeenCalledOnce();
  });
  it('restores a full saved lesson and safely skips malformed history', () => {
    expect(initialClassroomLesson([])).toEqual(starterClassroomLesson);
    const answer = {
      ...starterClassroomLesson,
      topic: 'Biology',
      explanation: 'Biology is the scientific study of life.',
    };
    expect(
      initialClassroomLesson([
        { id: 'bad', type: 'EXPLANATION', topic: 'Old', date: '', details: 'invalid' },
        {
          id: 'saved',
          type: 'EXPLANATION',
          topic: 'Biology',
          date: '',
          details: JSON.stringify({ explanation: answer }),
        },
      ])
    ).toEqual(answer);
  });
});
