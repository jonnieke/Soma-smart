import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ExamPaperPreviewPage } from '../pages/ExamPaperPreviewPage';

const mocks = vi.hoisted(() => ({
  listPapers: vi.fn(),
  getAccess: vi.fn(),
  readPhoneSession: vi.fn(),
}));

vi.mock('../services/examPaperBankService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/examPaperBankService')>();
  return {
    ...actual,
    EXAM_PAPER_PRICE_KES: 20,
    examPaperBankService: {
      ...actual.examPaperBankService,
      listPapers: mocks.listPapers,
      getAccess: mocks.getAccess,
      readPhoneSession: mocks.readPhoneSession,
    },
  };
});

vi.mock('../context/AppContext', () => ({ useApp: () => ({ isPro: false }) }));

const renderAt = (id = '101') =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/exam-papers/${id}`]}>
        <Routes>
          <Route path="/exam-papers/:id" element={<ExamPaperPreviewPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.readPhoneSession.mockReturnValue(null);
});
afterEach(cleanup);

describe('ExamPaperPreviewPage', () => {
  it('renders paper metadata and KES 20 unlock CTA when locked', async () => {
    mocks.listPapers.mockResolvedValue([
      {
        id: 101,
        title: 'KCSE 2024 Mathematics Paper 1',
        subject: 'Mathematics',
        grade: 'Form 4',
        exam_body: 'KNEC',
        duration_minutes: 150,
        has_marking_scheme: true,
      },
    ]);
    mocks.getAccess.mockResolvedValue({ paid: false, canStudy: false });

    renderAt('101');
    expect(await screen.findByRole('heading', { level: 1, name: 'KCSE 2024 Mathematics Paper 1' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Unlock Paper & 24h AI Pass · KES 20/i })).toBeVisible();
  });

  it('offers direct reader CTA when paper access is unlocked', async () => {
    mocks.listPapers.mockResolvedValue([
      {
        id: 101,
        title: 'KCSE 2024 Mathematics Paper 1',
        subject: 'Mathematics',
        grade: 'Form 4',
        has_marking_scheme: true,
      },
    ]);
    mocks.getAccess.mockResolvedValue({ paid: true, canStudy: true, paperUrl: 'https://example.test/p.pdf' });

    renderAt('101');
    expect(await screen.findByRole('button', { name: /Open Full Paper & Scheme/i })).toBeVisible();
  });

  it('renders a helpful recovery state when the paper is not found', async () => {
    mocks.listPapers.mockResolvedValue([]);
    mocks.getAccess.mockResolvedValue(null);

    renderAt('999');
    expect(await screen.findByRole('heading', { level: 1, name: 'Exam paper unavailable' })).toBeVisible();
  });
});
