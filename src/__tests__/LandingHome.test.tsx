import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { LandingHome } from '../components/LandingHome';
import { examPaperBankService } from '../services/examPaperBankService';

const baseProps = {
  isRegistered: false,
  onStartLearning: vi.fn(),
  onAskQuestion: vi.fn(),
  onLearnerShortcut: vi.fn(),
  onTeacher: vi.fn(),
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

describe('LandingHome (Exact Reference Redesign)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('scrollTo', vi.fn());
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the brand, navigation links, and exact hero content', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    // Brand
    expect(screen.getByRole('link', { name: /soma ai homepage/i })).toBeInTheDocument();

    // Navigation links
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toHaveTextContent(/learners/i);
    expect(nav).toHaveTextContent(/teachers/i);
    expect(nav).toHaveTextContent(/parents/i);
    expect(nav).toHaveTextContent(/library/i);
    expect(nav).toHaveTextContent(/pricing/i);

    // Sign in pill
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

    // Hero Headline & Tagline
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /AI study help for CBC, KPSEA, and KCSE learners/i
    );
    expect(screen.getByLabelText(/Ask\. Listen\. Practise\. Remember\./i)).toBeInTheDocument();

    // Hero CTAs
    expect(screen.getByRole('button', { name: /start learning free/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /i'm a teacher/i })).toBeInTheDocument();

    // Trust badges
    expect(screen.getByText(/built for kenyan learners/i)).toBeInTheDocument();
  });

  it('submits an Ask Akili question from the hero interactive widget', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/ask a homework question/i), {
      target: { value: 'What is photosynthesis?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send question/i }));

    expect(baseProps.onAskQuestion).toHaveBeenCalledWith('What is photosynthesis?', undefined);
  });

  it('submits homework with attached photo file', () => {
    const { container } = render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    const cameraInput = container.querySelector<HTMLInputElement>('input[aria-label="Capture homework photo"]');
    const photoFile = new File(['image-bytes'], 'homework.jpg', { type: 'image/jpeg' });
    fireEvent.change(cameraInput!, { target: { files: [photoFile] } });

    expect(screen.getByText(/attached: homework\.jpg/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /send question/i }));

    expect(baseProps.onAskQuestion).toHaveBeenCalledWith(
      'Analyze and explain homework problem from homework.jpg',
      photoFile
    );
  });

  it('renders the 4 "What SomaAI helps with" cards and triggers corresponding actions', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /what somaai helps with/i })).toBeInTheDocument();
    expect(screen.getByText(/understand homework/i)).toBeInTheDocument();
    expect(screen.getAllByText(/listen & learn/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('heading', { name: /practise weak topics/i })).toBeInTheDocument();
    expect(screen.getByText(/save what you learn and revise it later/i)).toBeInTheDocument();

    // Clicking Practise weak topics calls onRevision
    fireEvent.click(screen.getByRole('heading', { name: /practise weak topics/i }).closest('button')!);
    expect(baseProps.onRevision).toHaveBeenCalled();
  });

  it('renders "Powerful tools for every learner" and "For Teachers" sections', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    expect(screen.getByText(/powerful tools for every learner/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /for teachers/i })).toBeInTheDocument();
    expect(screen.getByText(/create notes/i)).toBeInTheDocument();
    expect(screen.getByText(/create quiz/i)).toBeInTheDocument();
    expect(screen.getByText(/share with class/i)).toBeInTheDocument();
    expect(screen.getByText(/see weak topics/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/create notes/i).closest('button')!);
    expect(baseProps.onTeacher).toHaveBeenCalled();
  });

  it('renders "For Parents" progress report card and pricing tiers', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    // Parents report
    expect(screen.getByText(/weekly progress report/i)).toBeInTheDocument();
    expect(screen.getByText(/strong topics/i)).toBeInTheDocument();
    expect(screen.getByText(/needs revision/i)).toBeInTheDocument();

    // Pricing
    expect(screen.getByText(/simple, affordable pricing/i)).toBeInTheDocument();
    expect(screen.getByText(/KES 20/i)).toBeInTheDocument();
    expect(screen.getByText(/KES 499/i)).toBeInTheDocument();
    expect(screen.getByText(/best for exam preparation/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/KES 20/i).closest('button')!);
    expect(baseProps.onPricing).toHaveBeenCalled();
  });

  it('renders bottom trust strip columns with curriculum alignment', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    expect(screen.getByText(/CBC\/KPSEA\/KCSE aligned/i)).toBeInTheDocument();
    expect(screen.getByText(/trusted library materials/i)).toBeInTheDocument();
    expect(screen.getByText(/audio learning support/i)).toBeInTheDocument();
    expect(screen.getByText(/teacher-friendly/i)).toBeInTheDocument();
  });

  it('supports 24h pass restoration from the mobile drawer form', async () => {
    vi.spyOn(examPaperBankService, 'restoreByPhone').mockResolvedValueOnce({
      found: true,
      passActive: true,
      normalizedPhone: '+254123456789',
      last9: '123456789',
      hoursRemaining: 18,
      paperIds: ['kcse-2023-math-1'],
    });

    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    // Open mobile menu
    fireEvent.click(screen.getByRole('button', { name: /toggle navigation menu/i }));

    const phoneInput = screen.getByLabelText(/enter phone number to restore 24h pass/i);
    fireEvent.change(phoneInput, { target: { value: '0712345678' } });
    fireEvent.submit(phoneInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/24h pass active/i);
    });
  });
});
