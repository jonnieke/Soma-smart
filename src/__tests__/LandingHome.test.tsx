import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { LandingHome } from '../components/LandingHome';

const baseProps = {
  isRegistered: false,
  onStartLearning: vi.fn(),
  onAskQuestion: vi.fn(),
  onLearnerShortcut: vi.fn(),
  onTeacher: vi.fn(),
  onParent: vi.fn(),
  onLibrary: vi.fn(),
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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('routes learner shortcut cards to the right tool', () => {
    render(<LandingHome {...baseProps} />);

    fireEvent.click(screen.getAllByRole('button', { name: /listen & learn/i })[0]);

    expect(baseProps.onLearnerShortcut).toHaveBeenCalledWith('TALKBACK', 'listen_and_learn');
  });

  it('opens the library from the learner tools section', () => {
    render(<LandingHome {...baseProps} />);

    fireEvent.click(screen.getAllByRole('button', { name: /library/i })[0]);

    expect(baseProps.onLibrary).toHaveBeenCalledTimes(1);
  });

  it('submits an Ask Akili question from the hero demo', () => {
    render(<LandingHome {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/ask a homework question/i), {
      target: { value: 'What is photosynthesis?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send question/i }));

    expect(baseProps.onAskQuestion).toHaveBeenCalledWith('What is photosynthesis?');
  });
});
