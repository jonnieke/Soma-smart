import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LearnerHome } from '../features/learner/home/LearnerHome';

afterEach(cleanup);
const props = () => ({
  learnerName: 'Amina', grade: 'Grade 7', subjects: ['Mathematics', 'English'],
  onOpenMenu: vi.fn(), onProfile: vi.fn(), onTeach: vi.fn(), onScan: vi.fn(),
  onUpload: vi.fn(), onVoice: vi.fn(), onSubject: vi.fn(), onContinue: vi.fn(),
  onViewAll: vi.fn(), onOpenRevision: vi.fn(),
});

describe('Learner reading homepage', () => {
  it('does not invent a lesson or progress for a new learner', () => {
    render(<LearnerHome {...props()} />);
    expect(screen.queryByRole('button', { name: 'Continue reading' })).toBeNull();
    expect(screen.queryByText(/Photosynthesis|Linear Equations|completed|Quiz not attempted/)).toBeNull();
  });
  it('resumes a saved lesson and opens subject materials', () => {
    const callbacks = props();
    render(<LearnerHome {...callbacks} latestTopic="Fractions" />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue reading' }));
    expect(callbacks.onContinue).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /Mathematics/ }));
    expect(callbacks.onSubject).toHaveBeenCalledWith('Mathematics');
    expect(callbacks.onTeach).not.toHaveBeenCalled();
  });
  it('keeps scan, record, upload and practice actions explicitly labelled', () => {
    const callbacks = props();
    render(<LearnerHome {...callbacks} />);
    fireEvent.click(screen.getByRole('button', { name: 'Scan a question' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record a question' }));
    fireEvent.click(screen.getByRole('button', { name: 'Upload a page' }));
    fireEvent.click(screen.getByRole('button', { name: /Practice papers/ }));
    expect(callbacks.onScan).toHaveBeenCalledOnce();
    expect(callbacks.onVoice).toHaveBeenCalledOnce();
    expect(callbacks.onUpload).toHaveBeenCalledOnce();
    expect(callbacks.onOpenRevision).toHaveBeenCalledOnce();
  });
  it('submits a trimmed question but not an empty question', () => {
    const callbacks = props();
    render(<LearnerHome {...callbacks} />);
    expect(screen.getByRole('button', { name: 'Ask Akili' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Or type your question'), { target: { value: '  Explain fractions  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask Akili' }));
    expect(callbacks.onTeach).toHaveBeenCalledWith('Explain fractions');
  });
  it('provides a browse action when subject materials are unavailable', () => {
    const callbacks = props();
    render(<LearnerHome {...callbacks} subjects={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open subjects' }));
    expect(callbacks.onViewAll).toHaveBeenCalledOnce();
  });
});
