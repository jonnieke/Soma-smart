import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { CreatePaperWizard } from '../features/teacher/paperStudio/CreatePaperWizard';
import { generatePaperDraft } from '../services/assessmentEngine/paperGeneration';
vi.mock('../services/assessmentEngine/paperGeneration', () => ({ generatePaperDraft: vi.fn() }));
vi.mock('../services/paperStudioService', () => ({ paperStudioService: {} }));
beforeEach(() => vi.clearAllMocks());
it('shows server usage for paid teachers without asking them to subscribe again', async () => {
  vi.mocked(generatePaperDraft).mockRejectedValue(Object.assign(new Error('teacher ai daily limit reached'), {
    allowance: { plan: 'MONTHLY', limit: 220, usageCount: 220 },
  }));
  render(<CreatePaperWizard onCancel={vi.fn()} onPaperCreated={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Class'), { target: { value: 'Grade 6' } });
  fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Science' } });
  fireEvent.change(screen.getByLabelText('What should the paper cover?'), { target: { value: 'Soil erosion' } });
  fireEvent.click(screen.getByRole('button', { name: 'Generate my paper' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('220 of 220 daily AI requests used');
  expect(screen.getByRole('alert')).toHaveTextContent('do not need to buy the same subscription again');
  expect(screen.queryByRole('link', { name: /View teacher plans/ })).not.toBeInTheDocument();
  expect(screen.getByLabelText('What should the paper cover?')).toHaveValue('Soil erosion');
});
it('starts with generation rather than the six-step bank wizard', () => {
  render(<CreatePaperWizard onCancel={vi.fn()} onPaperCreated={vi.fn()} />);
  expect(screen.getByRole('heading', { name: 'Generate a paper' })).toBeInTheDocument();
  expect(screen.queryByText('Step 1 of 6')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Or build from a question bank'));
  expect(screen.getByText('Examination Details & School Header')).toBeInTheDocument();
});
it('opens the returned saved paper and submits only once', async () => {
  const created = vi.fn();
  vi.mocked(generatePaperDraft).mockResolvedValue({ id: 'saved-paper' } as never);
  render(<CreatePaperWizard onCancel={vi.fn()} onPaperCreated={created} />);
  fireEvent.change(screen.getByLabelText('Class'), { target: { value: 'Grade 6' } });
  fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Science' } });
  fireEvent.change(screen.getByLabelText('What should the paper cover?'), { target: { value: 'Soil erosion' } });
  fireEvent.click(screen.getByRole('button', { name: 'Generate my paper' }));
  await waitFor(() => expect(created).toHaveBeenCalledWith('saved-paper'));
  expect(generatePaperDraft).toHaveBeenCalledTimes(1);
});
it('offers teacher subscriptions at the AI limit without losing the question', async () => {
  vi.mocked(generatePaperDraft).mockRejectedValue(new Error('teacher ai daily limit reached Your request is retained in My papers; no sample questions were substituted.'));
  render(<CreatePaperWizard onCancel={vi.fn()} onPaperCreated={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Class'), { target: { value: 'Grade 6' } });
  fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Science' } });
  fireEvent.change(screen.getByLabelText('What should the paper cover?'), { target: { value: 'Soil erosion' } });
  fireEvent.click(screen.getByRole('button', { name: 'Generate my paper' }));
  const plans = await screen.findByRole('link', { name: /View teacher plans/ });
  expect(plans).toHaveAttribute('href', '/pricing?segment=TEACHER');
  expect(plans).toHaveAttribute('target', '_blank');
  expect(screen.getByLabelText('What should the paper cover?')).toHaveValue('Soil erosion');
  expect(screen.queryByText(/no sample questions were substituted/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Generate my paper' })).toBeEnabled();
});
it('does not advertise an upgrade for an unrelated generation error', async () => {
  vi.mocked(generatePaperDraft).mockRejectedValue(new Error('Network unavailable'));
  render(<CreatePaperWizard onCancel={vi.fn()} onPaperCreated={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Class'), { target: { value: 'Grade 6' } });
  fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Science' } });
  fireEvent.change(screen.getByLabelText('What should the paper cover?'), { target: { value: 'Soil erosion' } });
  fireEvent.click(screen.getByRole('button', { name: 'Generate my paper' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
  expect(screen.queryByRole('link', { name: /View teacher plans/ })).not.toBeInTheDocument();
});
