import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LearnerClassroom, type LearnerClassroomProps } from '../features/learner/classroom/LearnerClassroom';
import { initialClassroomLesson, isClassroomNoteSaved, nextClassroomTopic, starterClassroomLesson, isClassroomLimitError } from '../features/learner/classroom/classroomLessons';

afterEach(cleanup);
describe('classroom continuity', () => {
  it('routes both server and client allowance failures to the limit flow', () => {
    expect(isClassroomLimitError({ name: 'RateLimitError' })).toBe(true);
    expect(isClassroomLimitError({ name: 'PlanLimitError' })).toBe(true);
    expect(isClassroomLimitError(new Error('Network unavailable'))).toBe(false);
  });
  it('restores the latest full follow-up from history', () => {
    const answer = { ...starterClassroomLesson, explanation: 'An updated explanation.' };
    expect(initialClassroomLesson([{ id: 'followup', type: 'EXPLANATION', topic: answer.topic, date: '', details: JSON.stringify({ source: 'classroom_followup', explanation: answer }) }])).toEqual(answer);
  });
  it('selects a distinct related topic and falls back when none is available', () => {
    expect(nextClassroomTopic({ ...starterClassroomLesson, relatedTopics: ['', 'Soil erosion', ' Plant roots '] })).toBe('Plant roots');
    expect(nextClassroomTopic(starterClassroomLesson)).toBeUndefined();
  });
  it('recognizes saved answers but allows updated explanations to be saved again', () => {
    const notes = [{ title: 'soil erosion', source: 'ai_answer', content: `SUMMARY POINTS:\nKeep soil covered.\n\nFULL EXPLANATION:\n${starterClassroomLesson.explanation}` }];
    expect(isClassroomNoteSaved(starterClassroomLesson, notes)).toBe(true);
    expect(isClassroomNoteSaved({ ...starterClassroomLesson, explanation: 'Updated lesson' }, notes)).toBe(false);
    expect(isClassroomNoteSaved(starterClassroomLesson, [])).toBe(false);
  });
  it('uses persisted save state on remount and labels guided continuation', () => {
    const noop = vi.fn();
    const p: LearnerClassroomProps = { answer: { ...starterClassroomLesson, topic: 'Biology' }, name: 'Learner', grade: '', busy: false, listening: false, recording: false, examplesUsed: 0,
      saved: true, nextTopic: 'Cells', onHome: noop, onSubjects: noop, onNotes: noop, onPapers: noop, onProfile: noop, onHomepage: noop, onAsk: noop, onScan: noop, onUpload: noop, onSpeak: noop, onSimplify: noop, onExample: noop, onListen: noop, onPractise: noop, onSave: noop, onNext: noop, onVideos: noop };
    const { rerender } = render(<LearnerClassroom {...p} />);
    expect(screen.getByRole('button', { name: 'Saved in My notes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next: Cells →' })).toBeEnabled();
    rerender(<LearnerClassroom {...p} saved={false} nextTopic={undefined} />);
    expect(screen.getByRole('button', { name: 'Save in My notes' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Continue this lesson →' })).toBeEnabled();
  });
});
