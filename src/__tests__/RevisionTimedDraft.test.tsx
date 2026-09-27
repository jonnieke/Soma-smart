import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import packet from '../../content/exams/soma-grade9-mathematics-original-01.json';
import { RevisionSession } from '../features/revision/RevisionSession';
import { RevisionMode, type TeacherActivity } from '../types';

const api = vi.hoisted(() => ({
  startAttempt: vi.fn(), saveResponse: vi.fn(), markResponse: vi.fn(), submitAttempt: vi.fn(), getAttemptResults: vi.fn(),
}));
vi.mock('../services/examService', () => ({ examService: api }));
vi.mock('../context/AppContext', () => ({ useApp: () => ({
  language: 'EN', isPro: true, studentCode: 'TEST-ONLY', studentProfile: {}, userId: 'test-owner',
}) }));
vi.mock('../services/geminiService', () => ({
  analyzeExamPaper: vi.fn(), fileToGenerativePart: vi.fn(), markStudentAnswer: vi.fn(),
  predictLikelyQuestions: vi.fn(), getPaperGuidance: vi.fn(), explainQuestion: vi.fn(),
}));

// Exercise the real component with public-shaped questions, never sending this draft to a live API.
const paper = {
  id: 419, subject: packet.exam.subject, grade: packet.exam.grade,
  duration_minutes: packet.exam.durationMinutes, total_marks: packet.exam.totalMarks,
  exam_instructions: packet.exam.instructions, marking_scheme_source: 'AI_DRAFT',
  structured_questions: packet.questions.map(({ markingScheme, modelAnswer, explanation, ...q }) => q),
} as unknown as TeacherActivity;

async function flush() { await act(async () => { await Promise.resolve(); }); }
async function start() {
  render(<RevisionSession data={paper} mode={RevisionMode.EXAM} onExit={vi.fn()} />);
  await flush();
  fireEvent.click(screen.getByRole('button', { name: 'Start paper' }));
  expect(screen.getByRole('heading', { name: 'Timed Paper Setup' })).toBeInTheDocument();
  expect(screen.queryByText('Official paper duration')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Start Exam/ }));
  await flush();
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-27T09:00:00Z'));
  localStorage.clear();
  vi.resetAllMocks();
  api.startAttempt.mockResolvedValue({ id: 'test-attempt' });
  api.getAttemptResults.mockResolvedValue({ id: 'test-attempt', exam_id: 419, learner_id: 'TEST-ONLY', mode: 'TIMED_QUIZ', status: 'IN_PROGRESS', selected_questions: packet.questions.map(q => q.id) });
  api.saveResponse.mockResolvedValue(null);
  api.submitAttempt.mockResolvedValue(null);
  api.markResponse.mockResolvedValue({ marksAwarded: 4, marksAvailable: 4, isCorrect: true,
    modelAnswer: 'Test marking result', feedback: 'Test feedback', examTip: '' });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Grade 9 draft in the timed-paper flow (mocked backend)', () => {
  it('retains answers across a marking failure and a subsequent refresh', async () => {
    await start();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Retain my answer' } });
    api.markResponse.mockRejectedValueOnce(new Error('Temporary outage'));
    vi.setSystemTime(new Date('2026-09-27T10:00:01Z'));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(screen.getByRole('alert')).toHaveTextContent('could not be marked');
    cleanup();
    render(<RevisionSession data={paper} mode={RevisionMode.EXAM} onExit={vi.fn()} />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Resume saved paper' }));
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Retry submission' }));
    await flush();
    expect(api.markResponse).toHaveBeenLastCalledWith('419', packet.questions[0].id, 'Retain my answer', 'TEST-ONLY', 'test-attempt', 'EN');
    expect(screen.getByText(/4\/48 marks/)).toBeInTheDocument();
  });
  it('recovers an unsynced answer after remount without creating an attempt or resetting time', async () => {
    await start();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My unsynced working' } });
    cleanup();
    vi.setSystemTime(new Date('2026-09-27T09:59:59Z'));
    render(<RevisionSession data={paper} mode={RevisionMode.EXAM} onExit={vi.fn()} />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Resume saved paper' }));
    await flush();
    expect(screen.getByRole('textbox')).toHaveValue('My unsynced working');
    expect(api.startAttempt).toHaveBeenCalledOnce();
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(api.markResponse).toHaveBeenCalledWith('419', packet.questions[0].id, 'My unsynced working', 'TEST-ONLY', 'test-attempt', 'EN');
    expect(api.submitAttempt).toHaveBeenCalledOnce();
  });

  it('does not reopen answers if secure verification fails', async () => {
    await start();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Private answer' } });
    cleanup();
    api.getAttemptResults.mockResolvedValue(null);
    render(<RevisionSession data={paper} mode={RevisionMode.EXAM} onExit={vi.fn()} />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Resume saved paper' }));
    await flush();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not verify');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('recognizes a confirmed submission after a lost response instead of submitting again', async () => {
    await start();
    cleanup();
    api.getAttemptResults.mockResolvedValue({ exam_id: 419, learner_id: 'TEST-ONLY', mode: 'TIMED_QUIZ', status: 'SUBMITTED', score: 42, maximum_marks: 48 });
    render(<RevisionSession data={paper} mode={RevisionMode.EXAM} onExit={vi.fn()} />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Resume saved paper' }));
    await flush();
    expect(screen.getByText(/already submitted: 42\/48/)).toBeInTheDocument();
    expect(api.submitAttempt).not.toHaveBeenCalled();
  });

  it('locks an expired recovered exam until submission is retried', async () => {
    await start();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Saved before expiry' } });
    cleanup();
    vi.setSystemTime(new Date('2026-09-27T11:00:00Z'));
    render(<RevisionSession data={paper} mode={RevisionMode.EXAM} onExit={vi.fn()} />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Resume saved paper' }));
    await flush();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry submission' }));
    await flush();
    expect(api.submitAttempt).toHaveBeenCalledOnce();
  });
  it('does not start the clock or pretend answers can sync when opening the attempt fails', async () => {
    api.startAttempt.mockRejectedValueOnce(new Error('Sign-in required'));
    await start();
    expect(screen.getByRole('alert')).toHaveTextContent('timer has not started');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(3600000); });
    expect(api.markResponse).not.toHaveBeenCalled();
    expect(api.submitAttempt).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Return to paper setup' }));
    expect(screen.getByRole('button', { name: 'Start paper' })).toBeInTheDocument();
  });

  it('loads 12 questions, retains navigation answers, and submits the complete 48-mark paper', async () => {
    await start();
    expect(api.startAttempt).toHaveBeenCalledWith(expect.objectContaining({
      examId: '419', selectedQuestions: packet.questions.map(q => q.id),
    }));
    for (let i = 0; i < packet.questions.length; i++) {
      fireEvent.change(screen.getByRole('textbox'), { target: { value: packet.questions[i].modelAnswer } });
      fireEvent.click(screen.getByRole('button', { name: i === 11 ? 'Submit Exam' : 'Save & Next' }));
      await flush();
    }
    expect(api.markResponse).toHaveBeenCalledTimes(12);
    expect(api.saveResponse).toHaveBeenCalledTimes(12);
    expect(api.submitAttempt).toHaveBeenCalledOnce();
    expect(screen.getByText(/48\/48 marks/)).toBeInTheDocument();
  });

  it('auto-submits the latest unsent answer after a background-clock jump', async () => {
    await start();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '12 divided by -3 plus 7 = 3' } });
    // Simulate a suspended/background tab: elapsed wall time, not interval counts, determines expiry.
    vi.setSystemTime(new Date('2026-09-27T10:00:01Z'));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(api.markResponse).toHaveBeenCalledWith('419', packet.questions[0].id,
      '12 divided by -3 plus 7 = 3', 'TEST-ONLY', 'test-attempt', 'EN');
    expect(api.submitAttempt).toHaveBeenCalledOnce();
    expect(screen.getByText(/4\/48 marks/)).toBeInTheDocument();
  });

  it('does not turn a marker outage into a zero score and retries only the failed answer', async () => {
    await start();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save & Next' }));
    await flush();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '15 cm and 1350 cm²' } });
    api.markResponse.mockResolvedValueOnce({ marksAwarded: 4, marksAvailable: 4, isCorrect: true,
      modelAnswer: '3', feedback: 'Correct', examTip: '' }).mockRejectedValueOnce(new Error('Marker unavailable'));
    vi.setSystemTime(new Date('2026-09-27T10:00:01Z'));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(screen.getByRole('alert')).toHaveTextContent('No final score');
    expect(localStorage.getItem('somo_performance_records')).toBeNull();
    expect(api.submitAttempt).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry submission' }));
    await flush();
    expect(api.markResponse).toHaveBeenCalledTimes(3);
    expect(api.submitAttempt).toHaveBeenCalledOnce();
    expect(screen.getByText(/8\/48 marks/)).toBeInTheDocument();
  });

  it('withholds completion on submission failure and retries without paying for marking again', async () => {
    api.submitAttempt.mockRejectedValueOnce(new Error('Network unavailable'));
    await start();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '3' } });
    vi.setSystemTime(new Date('2026-09-27T10:00:01Z'));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(screen.getByRole('alert')).toHaveTextContent('submission could not be confirmed');
    expect(localStorage.getItem('somo_performance_records')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry submission' }));
    await flush();
    expect(api.markResponse).toHaveBeenCalledOnce();
    expect(api.submitAttempt).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/4\/48 marks/)).toBeInTheDocument();
  });
});
