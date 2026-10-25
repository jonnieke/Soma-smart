import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { TeacherComposer } from '../features/teacher/TeacherComposer';

const baseProps = {
  isRegistered: false,
  onPreview: vi.fn().mockResolvedValue('Photosynthesis notes begin here with a clear learning objective.\n\nKey point 1\nKey point 2\nKey point 3\nKey point 4\nKey point 5\nKey point 6\nKey point 7\nKey point 8\nKey point 9: a learner check that should remain hidden.'),
  onSignUp: vi.fn(),
  onSubmit: vi.fn(),
  onTrack: vi.fn(),
};

describe('TeacherComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a view-only sample before handing a teacher request to the dashboard', async () => {
    render(<TeacherComposer {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/what would you like to prepare for your learners/i), {
      target: { value: 'Mark these Grade 8 mathematics answers.' },
    });
    fireEvent.click(screen.getByRole('tab', { name: /mark learner work/i }));
    fireEvent.click(screen.getByRole('button', { name: /create sample/i }));

    const previewDialog = await screen.findByRole('dialog', { name: /your notes have started/i });
    expect(previewDialog).toHaveTextContent(/photosynthesis notes begin/i);
    expect(previewDialog).not.toHaveTextContent(/learner check that should remain hidden/i);
    expect(screen.getByRole('button', { name: /create teacher account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /teacher login/i })).toBeInTheDocument();
    expect(baseProps.onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /teacher login/i }));

    expect(baseProps.onSubmit).toHaveBeenCalledWith({
      prompt: 'Mark these Grade 8 mathematics answers.',
      intent: 'MARK',
      file: undefined,
      source: 'TEXT',
      generatedContent: expect.stringContaining('Photosynthesis notes begin here'),
    });
  }, 15000);

  it('explains the fallback when voice input is unsupported', () => {
    render(<TeacherComposer {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /start voice input/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/voice input is not supported/i);
    expect(baseProps.onTrack).toHaveBeenCalledWith('teacher_composer_error', {
      stage: 'voice',
      reason: 'unsupported_browser',
    });
  });

  it('opens teacher registration from the sample preview', async () => {
    render(<TeacherComposer {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/what would you like to prepare for your learners/i), {
      target: { value: 'Create Grade 6 agriculture notes.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create sample/i }));
    await screen.findByRole('dialog', { name: /your notes have started/i });
    fireEvent.click(screen.getByRole('button', { name: /create teacher account/i }));

    expect(baseProps.onSignUp).toHaveBeenCalledWith({
      prompt: 'Create Grade 6 agriculture notes.',
      intent: 'CREATE',
      file: undefined,
      source: 'TEXT',
      generatedContent: expect.stringContaining('Photosynthesis notes begin here'),
    });
  }, 15000);

  it('keeps the request in place while the teacher is offline', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    render(<TeacherComposer {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/what would you like to prepare for your learners/i), {
      target: { value: 'Create a Grade 7 science quiz.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create sample/i }));

    expect(baseProps.onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(/offline/i);
  });

  it('rejects unsupported attachment types with a useful message', () => {
    render(<TeacherComposer {...baseProps} />);
    const upload = screen.getByLabelText<HTMLInputElement>(/attach notes or work/i);
    const file = new File(['unsafe'], 'answers.exe', { type: 'application/x-msdownload' });

    fireEvent.change(upload, { target: { files: [file] } });

    expect(screen.getByRole('status')).toHaveTextContent(/file type is not supported/i);
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });
});
