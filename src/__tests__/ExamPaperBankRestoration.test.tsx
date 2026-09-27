import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ExamPaperBankPage } from '../pages/ExamPaperBankPage';
import { rememberPaperMode } from '../services/paperCheckoutIntent';
const service = vi.hoisted(() => ({
  listPapers: vi.fn(),
  listPurchasedPaperIds: vi.fn(),
  getAccess: vi.fn(),
  initiatePurchase: vi.fn(),
}));
vi.mock('../services/examPaperBankService', () => ({
  EXAM_PAPER_PRICE_KES: 20,
  examPaperBankService: service,
}));
vi.mock('../context/AppContext', () => ({ useApp: () => ({ isPro: false }) }));
vi.mock('../components/ExamPaperTickerBelt', () => ({ FALLBACK_LATEST_PAPERS: [] }));
const setup = (entry = '/exam-papers') =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/exam-papers" element={<ExamPaperBankPage />} />
          <Route path="/exam-papers/:id/read" element={<h1>Reader screen</h1>} />
          <Route path="/revision" element={<h1>Revision screen</h1>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  rememberPaperMode(7, 'read');
  HTMLElement.prototype.scrollIntoView = vi.fn();
  service.listPapers.mockResolvedValue([
    {
      id: 7,
      title: 'My Mathematics Paper',
      grade: 'Grade 6',
      subject: 'Mathematics',
      has_exam_paper: true,
      has_marking_scheme: true,
    },
  ]);
  service.listPurchasedPaperIds.mockResolvedValue(['7']);
});
afterEach(cleanup);
describe('returning paper buyers', () => {
  it('does not show a thank-you for pending access', async () => {
    service.listPurchasedPaperIds.mockResolvedValue([]);
    service.getAccess.mockResolvedValue({ paid: false });
    setup('/exam-papers?paper=7&status=verifying&ref=test-reference');
    await waitFor(() => expect(service.getAccess).toHaveBeenCalled());
    expect(screen.queryByText('Thank you for choosing Soma!')).toBeNull();
    expect(screen.queryByText('Reader screen')).toBeNull();
  });
  it('does not let restored access bypass the confirmation after checkout', async () => {
    service.getAccess.mockResolvedValue({ paid: true, title: 'Verified paper title' });
    setup('/exam-papers?paper=7&status=verifying&ref=test-reference');
    expect(await screen.findByText('Verified paper title')).toBeTruthy();
    expect(screen.queryByText('Reader screen')).toBeNull();
    expect(screen.queryByText(/KES 20/)).toBeNull();
    expect(await screen.findByText(/You have not been signed up for updates/)).toBeTruthy();
  });
  it('returns to revision after payment verification instead of the reader', async () => {
    rememberPaperMode(7, 'revision');
    service.listPurchasedPaperIds.mockResolvedValue([]);
    service.getAccess.mockResolvedValue({ paid: true });
    setup('/exam-papers?paper=7&status=verifying&ref=test-reference');
    fireEvent.click(await screen.findByRole('button', { name: 'Continue revision' }));
    expect(await screen.findByText('Revision screen')).toBeTruthy();
    expect(service.getAccess).toHaveBeenCalledWith('7', 'test-reference');
    expect(screen.queryByText('Reader screen')).toBeNull();
  });
  it('keeps the default read destination after payment verification', async () => {
    service.listPurchasedPaperIds.mockResolvedValue([]);
    service.getAccess.mockResolvedValue({ paid: true });
    setup('/exam-papers?paper=7&status=verifying&ref=test-reference');
    expect(await screen.findByText('Thank you for choosing Soma!')).toBeTruthy();
    expect(screen.queryByText('Reader screen')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open your paper' }));
    expect(await screen.findByText('Reader screen')).toBeTruthy();
  });
  it('restores purchases again after a fresh page mount', async () => {
    const first = setup();
    expect(await screen.findByRole('button', { name: 'Read paper' })).toBeTruthy();
    first.unmount();
    setup();
    expect(await screen.findByRole('button', { name: 'Read paper' })).toBeTruthy();
    expect(service.listPurchasedPaperIds).toHaveBeenCalledTimes(2);
  });
  it('opens a restored paper without checkout', async () => {
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Read paper' }));
    expect(await screen.findByText('Reader screen')).toBeTruthy();
    expect(service.initiatePurchase).not.toHaveBeenCalled();
  });
  it('keeps the revision destination instead of redirecting to the reader', async () => {
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Practise now' }));
    expect(await screen.findByText('Revision screen')).toBeTruthy();
    expect(screen.queryByText('Reader screen')).toBeNull();
  });
  it('restores on retry after a server failure without prompting another payment', async () => {
    service.listPurchasedPaperIds
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue(['7']);
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'My papers', pressed: false }));
    fireEvent.click(await screen.findByRole('button', { name: 'Retry restoration' }));
    expect(await screen.findByRole('button', { name: 'Read paper' })).toBeTruthy();
    expect(service.initiatePurchase).not.toHaveBeenCalled();
  });
});
