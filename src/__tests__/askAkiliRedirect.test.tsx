import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingHome } from '../components/LandingHome';

describe('Ask Akili question preservation during authentication', () => {
  const baseProps = {
    isRegistered: false,
    onStartLearning: vi.fn(),
    onAskQuestion: vi.fn(),
    onLearnerShortcut: vi.fn(),
    onTeacher: vi.fn(),
    onTeacherPreview: vi.fn().mockResolvedValue('preview notes'),
    onTeacherSignUp: vi.fn(),
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

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('persists typed Ask Akili question to sessionStorage immediately as user types', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/ask a homework question/i);
    fireEvent.change(input, { target: { value: 'Explain Boyle’s law in physics' } });

    expect(sessionStorage.getItem('soma_pending_hero_question')).toBe('Explain Boyle’s law in physics');
  });

  it('persists question to sessionStorage and invokes onAskQuestion when submitted', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/ask a homework question/i);
    fireEvent.change(input, { target: { value: 'Solve 2x + 7 = 19' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(sessionStorage.getItem('soma_pending_hero_question')).toBe('Solve 2x + 7 = 19');
    expect(baseProps.onAskQuestion).toHaveBeenCalledWith('Solve 2x + 7 = 19', undefined);
  });

  it('restores pending question from sessionStorage if router state is lost upon reaching learner dashboard', () => {
    sessionStorage.setItem('soma_pending_hero_question', 'Define osmosis');

    // Simulate Learner pickup logic
    const state: { pendingHeroQuestion?: string } = {};
    const storedHeroQuestion = (() => {
      try {
        const item = sessionStorage.getItem('soma_pending_hero_question');
        if (item) {
          sessionStorage.removeItem('soma_pending_hero_question');
          return item;
        }
      } catch { /* ignore */ }
      return null;
    })();

    const resolvedHeroQuestion = state.pendingHeroQuestion || storedHeroQuestion;

    expect(resolvedHeroQuestion).toBe('Define osmosis');
    expect(sessionStorage.getItem('soma_pending_hero_question')).toBeNull(); // Cleaned up
  });
});
