import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ExamPaperReaderPage } from '../pages/ExamPaperReaderPage';
const { getAccess } = vi.hoisted(() => ({ getAccess: vi.fn() }));
vi.mock('../services/examPaperBankService', () => ({ examPaperBankService: { getAccess } }));
vi.mock('../context/AppContext', () => ({ useApp: () => ({ isPro: true }) }));
const setup = () => render(<MemoryRouter><ExamPaperReaderPage /></MemoryRouter>);
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
it('opens a server-approved subscription study copy even when paid is false', async () => {
  getAccess.mockResolvedValue({ paid: false, subscribed: true, canStudy: true, title: 'Chemistry', paperUrl: 'https://example.test/paper.pdf' });
  setup();
  expect(await screen.findByTitle('Exam paper')).toHaveAttribute('src', 'https://example.test/paper.pdf');
});
it('does not grant access just because the local plan says Pro', async () => {
  getAccess.mockResolvedValue({ paid: false, canStudy: false });
  setup();
  expect(await screen.findByRole('alert')).toHaveTextContent('verified purchase');
  expect(screen.queryByTitle('Exam paper')).toBeNull();
});
it('offers retry rather than payment after a network error', async () => {
  getAccess.mockRejectedValueOnce(new Error('Offline')).mockResolvedValue({ paid: true, title: 'Chemistry', paperUrl: 'https://example.test/paper.pdf' });
  setup();
  fireEvent.click(await screen.findByRole('button', { name: 'Retry access' }));
  expect(await screen.findByTitle('Exam paper')).toBeTruthy();
});
