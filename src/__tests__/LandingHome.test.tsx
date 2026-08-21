import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { LandingHome } from '../components/LandingHome';

const baseProps = {
  isRegistered: false,
  onStartLearning: vi.fn(),
  onAskQuestion: vi.fn(),
  onLearnerShortcut: vi.fn(),
  onTeacher: vi.fn(),
  onTeacherCompose: vi.fn(),
  onParent: vi.fn(),
  onLibrary: vi.fn(),
  onExamPapers: vi.fn(),
  onStartPaper: vi.fn(),
  onPreviewPaper: vi.fn(),
  onSomaGuide: vi.fn(),
  onRevision: vi.fn(),
  onPricing: vi.fn(),
  onSignIn: vi.fn(),
  onDashboard: vi.fn(),
  onTrack: vi.fn(),
};

describe('LandingHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('scrollTo', vi.fn());
  });
    vi.restoreAllMocks();

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('routes learner shortcut cards to the right tool', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByRole('button', { name: /listen & learn/i })[0]);

    expect(baseProps.onLearnerShortcut).toHaveBeenCalledWith('TALKBACK', 'listen_and_learn');
  });

  it('opens the library from the learner tools section', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByRole('button', { name: /library/i })[0]);

    expect(baseProps.onLibrary).toHaveBeenCalledTimes(1);
  });

  it('submits an Ask Akili question from the hero demo', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/ask a homework question/i), {
      target: { value: 'What is photosynthesis?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send question/i }));

    expect(baseProps.onAskQuestion).toHaveBeenCalledWith('What is photosynthesis?');
  });

  it('hands a teacher request to the selected workflow', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/describe what you want soma to do/i), {
      target: { value: 'Mark these Grade 8 mathematics answers.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /mark learner work/i }));
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

    expect(baseProps.onTeacherCompose).toHaveBeenCalledWith({
      prompt: 'Mark these Grade 8 mathematics answers.',
      intent: 'MARK',
      file: undefined,
      source: 'TEXT',
    });
  });
  it('explains the fallback when voice input is unsupported', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /start voice input/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/voice input is not supported/i);
    expect(baseProps.onTrack).toHaveBeenCalledWith('teacher_composer_error', {
      stage: 'voice',
      reason: 'unsupported_browser',
    });
  });

  it('keeps the request in place while the teacher is offline', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/describe what you want soma to do/i), {
      target: { value: 'Create a Grade 7 science quiz.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));

    expect(baseProps.onTeacherCompose).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(/offline/i);
  });

  it('rejects unsupported attachment types with a useful message', () => {
    const { container } = render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );
    const upload = container.querySelector<HTMLInputElement>('input[accept*=".pdf"]');
    const file = new File(['unsafe'], 'answers.exe', { type: 'application/x-msdownload' });

    fireEvent.change(upload!, { target: { files: [file] } });

    expect(screen.getByRole('status')).toHaveTextContent(/file type is not supported/i);
    expect(baseProps.onTeacherCompose).not.toHaveBeenCalled();
  });
});