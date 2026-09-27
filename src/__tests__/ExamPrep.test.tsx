import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { RevisionLanding } from '../features/revision/RevisionLanding';
import {
  readPrepSession,
  savePrepSession,
  remainingSeconds,
  type PrepSession,
} from '../features/revision/examPrepState';
import { RevisionMode } from '../types';
import { saveTimedExam } from '../features/revision/timedExamRecovery';
const mocks = vi.hoisted(() => ({
  app: {
    userId: 'learner-one',
    studentCode: '',
    studentProfile: { name: 'Gabu', grade: 'Grade 9' },
    isOnline: true,
  },
  generate: vi.fn(),
  papers: vi.fn(),
}));
vi.mock('../context/AppContext', () => ({ useApp: () => mocks.app }));
vi.mock('../services/examService', () => ({ examService: { listPublishedExams: mocks.papers } }));
vi.mock('../services/geminiService', () => ({
  generatePracticeQuestions: mocks.generate,
  RateLimitError: class extends Error {},
  SystemQuotaError: class extends Error {},
}));
vi.mock('../services/planLimitService', () => ({ PlanLimitError: class extends Error {} }));
vi.mock('../features/revision/ExamGuruPanel', () => ({
  ExamGuruPanel: ({ initialPrompt }: { initialPrompt: string }) => (
    <div role="dialog">{initialPrompt}</div>
  ),
}));
const questions = [
  {
    number: 1,
    text: 'Find half of 12.',
    topic: 'Fractions',
    marks: 2,
    modelAnswerOutline: '12 divided by 2 is 6.',
  },
];
const draft = (): PrepSession => ({
  version: 1,
  grade: 'Grade 9',
  subject: 'Mathematics',
  exam: 'KJSEA',
  topic: 'Fractions',
  questions,
  answers: ['6'],
  reviewed: [false],
  needsHelp: [false],
  completed: false,
  deadline: Date.now() + 600000,
});
function Path() {
  const l = useLocation();
  return (
    <output data-testid="path">
      {l.pathname}
      {l.search}
    </output>
  );
}
function setup() {
  const props = {
    onStartSession: vi.fn(),
    onNavigate: vi.fn(),
    onNotes: vi.fn(),
    onProfile: vi.fn(),
    onBack: vi.fn(),
  };
  render(
    <HelmetProvider>
      <MemoryRouter>
        <RevisionLanding {...props} />
        <Path />
      </MemoryRouter>
    </HelmetProvider>
  );
  return props;
}
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  mocks.app.userId = 'learner-one';
  mocks.app.isOnline = true;
  mocks.generate.mockResolvedValue(questions);
  mocks.papers.mockResolvedValue([]);
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
afterEach(cleanup);
describe('Exam Prep redesign', () => {
  it('makes unfinished timed papers discoverable and links to the existing access-checked paper route', () => {
    saveTimedExam('learner-one', { version: 1, examId: '419', attemptId: 'test-attempt',
      questionIds: ['q1'], answers: { q1: '6' }, index: 0, startedAt: Date.now(),
      deadline: Date.now() + 60000, timeLimit: 60, submitting: false });
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Unfinished paper #419/ }));
    expect(screen.getByTestId('path')).toHaveTextContent('/revision/dashboard?paper=419');
  });
  it('shows real identity, no invented progress, and connected navigation', () => {
    const p = setup();
    expect(screen.getByRole('heading', { name: 'SomaAI Exam Prep' })).toBeInTheDocument();
    expect(screen.getByText('Gabu · Grade 9')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'My notes' }));
    expect(p.onNotes).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Open your profile' }));
    expect(p.onProfile).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Back to classroom' }));
    expect(p.onBack).toHaveBeenCalledOnce();
  });
  it('keeps grade and exam coherent and carries filters to past papers', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Exam'), { target: { value: 'KPSEA' } });
    expect(screen.getByLabelText('Grade')).toHaveValue('Grade 6');
    fireEvent.click(screen.getByRole('button', { name: /Browse papers/ }));
    expect(screen.getByTestId('path')).toHaveTextContent(
      '/exam-papers?grade=Grade%206&subject=Mathematics'
    );
  });
  it('generates once, saves answers and resumes without another paid generation', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Start 10-minute/ }));
    await screen.findByRole('dialog');
    expect(mocks.generate).toHaveBeenCalledWith('Mathematics', '', 'JSS', 3, 'Grade 9');
    fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and close practice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('Your answer')).toHaveValue('6');
    expect(mocks.generate).toHaveBeenCalledOnce();
    expect(readPrepSession('learner-one')?.answers).toEqual(['6']);
  });
  it('retains the topic on generation failure without substituted questions', async () => {
    mocks.generate.mockRejectedValue(new Error('offline'));
    setup();
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose a topic' })[0]);
    fireEvent.change(screen.getByLabelText(/What would you/), { target: { value: 'Fractions' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start topic practice' }));
    await screen.findByRole('alert');
    expect(screen.getByLabelText(/What would you/)).toHaveValue('Fractions');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('uses published papers and preserves the existing exam-session gate', async () => {
    mocks.papers.mockResolvedValue([
      { id: 'paper1', title: 'Maths mock', grade: 'Grade 9', subject: 'Mathematics' },
    ]);
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: /Start a mock/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Maths mock' }));
    expect(p.onStartSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'paper1' }),
      RevisionMode.EXAM
    );
  });
  it('has a retry for catalogue failures', async () => {
    mocks.papers.mockRejectedValueOnce(new Error('network'));
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Start a mock/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(mocks.papers).toHaveBeenCalledTimes(2));
  });
  it('can resume offline and does not reveal a different learner’s draft', () => {
    savePrepSession('another-learner', draft());
    mocks.app.isOnline = false;
    setup();
    expect(screen.getByRole('button', { name: /Start 10-minute/ })).toBeDisabled();
    expect(screen.queryByText('Fractions')).not.toBeInTheDocument();
    cleanup();
    savePrepSession('learner-one', draft());
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('Your answer')).toHaveValue('6');
  });
  it('labels self review and counts only reviewed answers', () => {
    savePrepSession('learner-one', draft());
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByText('Compare with answer guidance'));
    fireEvent.click(screen.getByLabelText('I have reviewed my answer'));
    expect(readPrepSession('learner-one')?.completed).toBe(true);
    expect(screen.getByText(/not an exam score/)).toBeInTheDocument();
  });
});
describe('practice storage', () => {
  it('rejects corrupted state and isolates owners', () => {
    sessionStorage.setItem('soma_exam_prep_v1:bad', '{');
    expect(readPrepSession('bad')).toBeNull();
    savePrepSession('one', draft());
    expect(readPrepSession('two')).toBeNull();
    expect(readPrepSession('one')?.topic).toBe('Fractions');
  });
  it('uses an absolute timer across reloads and never goes negative', () => {
    expect(remainingSeconds(10000, 5000)).toBe(5);
    expect(remainingSeconds(10000, 11000)).toBe(0);
  });
});
