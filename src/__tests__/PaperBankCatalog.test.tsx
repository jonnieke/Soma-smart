import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PaperBankCatalog, paperLevel, paperSubject } from '../components/PaperBankCatalog';
import type { ExamPaperBankItem } from '../services/examPaperBankService';
vi.mock('../services/examPaperBankService', () => ({ EXAM_PAPER_PRICE_KES: 20 }));

const papers: ExamPaperBankItem[] = [
  {
    id: 1,
    title: 'Mathematics Paper A',
    grade: 'Grade 6',
    subject: 'MATHEMATICS',
    exam_body: 'SomaAI',
    duration_minutes: 80,
    has_marking_scheme: true,
  },
  {
    id: 2,
    title: 'Biology Paper B',
    grade: 'KCSE Level',
    subject: 'Biology',
    exam_body: 'SomaAI',
    has_marking_scheme: true,
  },
  {
    id: 3,
    title: 'English Paper C',
    grade: 'KPSEA',
    subject: 'English Language',
    has_marking_scheme: true,
  },
];
const onOpen = vi.fn(),
  onRevision = vi.fn(),
  onRetry = vi.fn(),
  onClearFilters = vi.fn();
function setup(extra = {}) {
  return render(
    <MemoryRouter>
      <PaperBankCatalog
        papers={papers}
        loading={false}
        loadError=""
        restoringPurchases={false}
        purchaseRestoreError=""
        onRestorePurchases={onRetry}
        isUnlocked={(id) => id === 2}
        onOpen={onOpen}
        onRevision={onRevision}
        onRetry={onRetry}
        onClearFilters={onClearFilters}
        {...extra}
      />
    </MemoryRouter>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
describe('paper bank redesign', () => {
  it('normalises known labels without inventing grades', () => {
    expect(paperLevel('KCSE Level')).toBe('Form 4');
    expect(paperLevel('KPSEA')).toBe('Grade 6');
    expect(paperLevel('Secondary Education')).toBe('Secondary Education');
    expect(paperSubject('MATHEMATICS')).toBe('Mathematics');
    expect(paperSubject('English Language')).toBe('English');
  });
  it('renders actual catalog results and clear prices', () => {
    setup();
    expect(screen.getByRole('status').textContent).toBe('3 papers');
    expect(screen.getAllByText('KES 20')).toHaveLength(2);
  });
  it('searches ignoring case and surrounding whitespace', () => {
    setup();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search papers' }), {
      target: { value: '  mathematics  ' },
    });
    expect(screen.getByRole('status').textContent).toBe('1 paper');
  });
  it('recovers from a missing initial grade', () => {
    setup({ initialGrade: 'Grade 7' });
    expect(screen.getByText('No papers match these filters yet')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show all papers' }));
    expect(screen.getByRole('status').textContent).toBe('3 papers');
    expect(onClearFilters).toHaveBeenCalled();
  });
  it('groups KCSE aliases together', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'KCSE' }));
    expect(screen.getByRole('status').textContent).toBe('1 paper');
    expect(screen.getByText('Biology Paper B')).toBeTruthy();
  });
  it('does not describe a load failure as missing papers', () => {
    setup({ loadError: 'offline' });
    expect(screen.queryByText('No papers match these filters yet')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
  it('previews metadata before invoking paid access', () => {
    setup();
    fireEvent.click(screen.getAllByRole('button', { name: 'Preview paper details' })[0]);
    expect(onOpen).not.toHaveBeenCalled();
    const modal = screen.getByRole('dialog');
    expect(within(modal).getByText(/not a sample of the questions/)).toBeTruthy();
    fireEvent.click(within(modal).getByRole('button', { name: /Read \/ restore access/ }));
    expect(onOpen).toHaveBeenCalledWith(papers[0]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('preserves revision actions', () => {
    setup();
    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock & practise' })[0]);
    expect(onRevision).toHaveBeenCalledWith(papers[0]);
  });
  it('filters the helper by both class and subject', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Choose your class'), { target: { value: 'Grade 6' } });
    fireEvent.change(screen.getByLabelText('Choose your subject'), {
      target: { value: 'English' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Find my paper' }));
    expect(screen.getByRole('status').textContent).toBe('1 paper');
    expect(screen.getByText('English Paper C')).toBeTruthy();
  });
  it('shows only verified access and explains restoration', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'My papers', pressed: false }));
    expect(screen.getByRole('status').textContent).toBe('1 paper');
    expect(screen.getByText(/Paid papers are restored securely/)).toBeTruthy();
  });
  it('shows restoration progress instead of an empty purchase library', () => {
    setup({ restoringPurchases: true });
    fireEvent.click(screen.getByRole('button', { name: 'My papers', pressed: false }));
    expect(screen.getByText('Checking your previous purchases…')).toBeTruthy();
    expect(screen.queryByText('No purchased papers found on this browser')).toBeNull();
  });
  it('does not turn restoration errors into an empty result', () => {
    setup({ purchaseRestoreError: 'Retry before paying again.' });
    fireEvent.click(screen.getByRole('button', { name: 'My papers', pressed: false }));
    expect(screen.getByRole('alert').textContent).toContain('Retry before paying again.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry restoration' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
  it('offers read and practice directly for restored access', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Read paper' }));
    expect(onOpen).toHaveBeenCalledWith(papers[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Practise now' }));
    expect(onRevision).toHaveBeenCalledWith(papers[1]);
  });
});
