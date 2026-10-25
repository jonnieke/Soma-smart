import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { expect, it, vi } from 'vitest';
import { LandingHome } from '../components/LandingHome';
import LearningVideosPage from '../pages/LearningVideosPage';
import videos from '../data/learningVideoSeed.json';
vi.mock('../services/learningVideoService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/learningVideoService')>()),
  learningVideoService: {
    list: vi.fn(async () => videos),
    isAdmin: vi.fn(async () => false),
    rating: vi.fn(async () => ({ average: null, count: 0 })),
  },
}));

const props = () => ({
  isRegistered: false,
  onStartLearning: vi.fn(),
  onAskQuestion: vi.fn(),
  onLearnerShortcut: vi.fn(),
  onTeacher: vi.fn(),
  onTeacherPreview: vi.fn(),
  onTeacherSignUp: vi.fn(),
  onTeacherCompose: vi.fn(),
  onParent: vi.fn(),
  onLibrary: vi.fn(),
  onExamPapers: vi.fn(),
  onSomaGuide: vi.fn(),
  onRevision: vi.fn(),
  onStartPaper: vi.fn(),
  onPreviewPaper: vi.fn(),
  onPricing: vi.fn(),
  onSignIn: vi.fn(),
  onDashboard: vi.fn(),
  onTrack: vi.fn(),
  onPrivacy: vi.fn(),
  onTerms: vi.fn(),
});
it('keeps the homepage focused on one action and three doors', () => {
  const p = props();
  render(
    <MemoryRouter>
      <LandingHome {...p} />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Understand more.');
  // Header offers exactly the three learner doors.
  const nav = screen.getByRole('navigation', { name: 'Main navigation' });
  expect(nav.querySelectorAll('button')).toHaveLength(3);
  // Secondary audiences live in the footer, not as page sections.
  expect(screen.getByRole('link', { name: 'Learning videos' })).toHaveAttribute(
    'href',
    '/learning-videos'
  );
  fireEvent.click(screen.getByRole('button', { name: 'For teachers' }));
  expect(p.onTeacher).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'For parents' }));
  expect(p.onParent).toHaveBeenCalledOnce();
  // Doors route to the right place.
  fireEvent.click(screen.getByRole('button', { name: /Revise a topic/ }));
  expect(p.onRevision).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: /Find a paper/ }));
  expect(p.onExamPapers).toHaveBeenCalledOnce();
  // Clutter removed.
  expect(screen.queryByRole('button', { name: 'Start learning' })).not.toBeInTheDocument();
  expect(screen.queryByText('Teaching today?')).not.toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Latest past papers' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
});
it('keeps the real Ask Akili submission and camera controls', () => {
  const p = props();
  render(
    <MemoryRouter>
      <LandingHome {...p} />
    </MemoryRouter>
  );
  fireEvent.change(screen.getByLabelText('Ask a homework question'), {
    target: { value: 'What is soil erosion?' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send question' }));
  expect(p.onAskQuestion).toHaveBeenCalledWith('What is soil erosion?', undefined);
  expect(screen.getByLabelText('Capture homework photo')).toHaveAttribute('capture', 'environment');
});
it('loads the selected learning video only on request', async () => {
  render(
    <MemoryRouter>
      <HelmetProvider>
        <LearningVideosPage />
      </HelmetProvider>
    </MemoryRouter>
  );
  expect(screen.queryByTitle('The Journey of Human Digestion')).not.toBeInTheDocument();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Watch The Journey of Human Digestion' })
  );
  expect(screen.getByTitle('The Journey of Human Digestion')).toHaveAttribute(
    'src',
    'https://www.youtube-nocookie.com/embed/4oXDoJkprx0?autoplay=1&playsinline=1&rel=0&cc_load_policy=1'
  );
  expect(screen.getByRole('link', { name: /Open on YouTube/ })).toHaveAttribute(
    'href',
    'https://www.youtube.com/watch?v=4oXDoJkprx0'
  );
});
