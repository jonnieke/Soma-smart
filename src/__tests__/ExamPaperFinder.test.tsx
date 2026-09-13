import React from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ExamPaperFinder } from '../components/ExamPaperFinder';
vi.mock('../services/examPaperBankService', () => ({ EXAM_PAPER_PRICE_KES: 20 }));
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
const papers = [
  { id: 1, title: 'Biology Paper 1', grade: 'Form 4', subject: 'Biology' },
  { id: 2, title: 'Math Paper 1', grade: 'Grade 7', subject: 'Math' },
];
describe('paper finder', () => {
  it('guides a learner to the selected paper without initiating payment', () => {
    const choose = vi.fn();
    render(
      <ExamPaperFinder papers={papers} loading={false} onChoose={choose} isUnlocked={() => false} />
    );
    fireEvent.click(screen.getByText('Help me find a paper'));
    expect(screen.getByText('Next')).toBeDisabled();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Form 4' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Biology' } });
    fireEvent.click(screen.getByText('Next'));
    expect(screen.queryByText('Math Paper 1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText(/one-off paper purchase/)).toBeInTheDocument();
    expect(choose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Continue to checkout'));
    expect(choose).toHaveBeenCalledWith(papers[0]);
  });
  it('does not allow proceeding while the catalogue is unavailable', () => {
    render(
      <ExamPaperFinder papers={[]} loading={true} onChoose={vi.fn()} isUnlocked={() => false} />
    );
    fireEvent.click(screen.getByText('Help me find a paper'));
    expect(screen.getByText('Next')).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });
});
