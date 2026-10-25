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

describe('LandingHome (Streamlined)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('scrollTo', vi.fn());
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the primary brand and the three distinct doors', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /soma ai homepage/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /homework help/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /revise a topic/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^past papers$/i })).toBeInTheDocument();
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

    expect(baseProps.onAskQuestion).toHaveBeenCalledWith('What is photosynthesis?', undefined);
  });

  it('populates question when a quick syllabus chip is clicked', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Grade 8 Science' }));
    expect(screen.getByLabelText(/ask a homework question/i)).toHaveValue(
      'Grade 8 Science: How do plants adapt to arid environments?'
    );
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

  it('routes to revision when the Revise door is clicked', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /revise a topic/i }));
    expect(baseProps.onRevision).toHaveBeenCalledTimes(1);
  });

  it('routes to exam papers when the Past Papers door is clicked', () => {
    render(
      <MemoryRouter>
        <LandingHome {...baseProps} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('heading', { name: /^past papers$/i }).closest('button')!);
    expect(baseProps.onExamPapers).toHaveBeenCalledTimes(1);
  });

  it('supports 24h pass restoration from the header form', async () => {
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

    const phoneInput = screen.getByLabelText(/enter phone number to restore 24h pass/i);
    fireEvent.change(phoneInput, { target: { value: '0712345678' } });
    fireEvent.submit(phoneInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/24h pass active/i);
    });
  });
});
