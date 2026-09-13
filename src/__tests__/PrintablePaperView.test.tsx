import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { exportPaper } from './fixtures/exportPaper';
const download = vi.hoisted(() => vi.fn());
vi.mock('../services/paperDocxExport', () => ({ downloadPaperDocx: download }));
import { PrintablePaperView } from '../features/teacher/paperStudio/PrintablePaperView';
beforeEach(() => { download.mockReset(); });
it('exports questions by default and the marking scheme only when selected', async () => {
  download.mockResolvedValue(undefined);
  render(<PrintablePaperView paper={exportPaper} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Export Word (.docx)' }));
  await waitFor(() => expect(download).toHaveBeenCalledWith(exportPaper, 'QUESTION_PAPER'));
  await screen.findByText(/Word download started/);
  fireEvent.click(screen.getByRole('button', { name: 'Marking Scheme & Answer Key' }));
  fireEvent.click(screen.getByRole('button', { name: 'Export Word (.docx)' }));
  await waitFor(() => expect(download).toHaveBeenLastCalledWith(exportPaper, 'MARKING_SCHEME'));
});
it('keeps the preview and allows retry when exporting fails', async () => {
  download.mockRejectedValue(new Error('Diagram export is unavailable.'));
  render(<PrintablePaperView paper={exportPaper} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Export Word (.docx)' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Diagram export is unavailable.');
  expect(screen.getByRole('button', { name: 'Export Word (.docx)' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Back to paper editor' })).toBeEnabled();
});
it('shows attached diagrams and prevents printing when one fails to load', () => {
  const paper = structuredClone(exportPaper);
  paper.sections[0].questions[0].imageUrls = ['https://example.com/diagram.png'];
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  render(<PrintablePaperView paper={paper} onClose={vi.fn()} />);
  fireEvent.error(screen.getByRole('img', { name: 'Question 1 diagram 1' }));
  expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded');
  fireEvent.click(screen.getByRole('button', { name: 'Print / Save as PDF' }));
  expect(screen.getByRole('status')).toHaveTextContent('An image is missing');
  expect(print).not.toHaveBeenCalled();
  print.mockRestore();
});
