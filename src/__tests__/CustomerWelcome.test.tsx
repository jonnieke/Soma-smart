import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PurchaseThankYou, purchaseNextStep } from '../components/PurchaseThankYou';
import CommunicationPreferencesPage from '../pages/CommunicationPreferencesPage';
import type { PaymentRecord } from '../services/transactionAccessService';

const mocks = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn() }));
vi.mock('../services/communicationPreferencesService', () => ({
  communicationPreferencesService: mocks,
  defaultPreferences: { inApp: true, email: false, whatsapp: false },
}));
const receipt: PaymentRecord = { reference_code: 'ref', amount: 20, status: 'SUCCESS', type: 'SUBSCRIPTION', description: '', created_at: '' };
beforeEach(() => { vi.clearAllMocks(); mocks.load.mockResolvedValue({ inApp: true, email: false, whatsapp: false }); mocks.save.mockResolvedValue(undefined); });

it.each(['PENDING', 'FAILED'])('does not thank an unconfirmed %s payment', status => {
  render(<PurchaseThankYou receipt={{ ...receipt, status }} onContinue={vi.fn()} />);
  expect(screen.queryByText('Thank you for choosing Soma!')).not.toBeInTheDocument();
});
it('waits for the customer to continue', () => {
  const go = vi.fn(); render(<PurchaseThankYou receipt={receipt} onContinue={go} />);
  expect(go).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Continue learning' }));
  expect(go).toHaveBeenCalledTimes(1);
});
it.each(['CREDIT_PACK', 'MARKETPLACE_PURCHASE', 'PAST_PAPER'])('does not describe %s as a subscription', type => {
  expect(purchaseNextStep({ ...receipt, type }).text).not.toContain('Thank you for subscribing');
});
it('offers teacher workspace for a teacher subscription', () => {
  expect(purchaseNextStep(receipt, 'TEACHER').path).toBe('/teacher');
});
it('does not preselect external channels and saves explicit choices', async () => {
  render(<MemoryRouter><CommunicationPreferencesPage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save preferences' })).toBeEnabled());
  expect(screen.getByLabelText('Email updates')).not.toBeChecked();
  expect(screen.getByLabelText('WhatsApp updates')).not.toBeChecked();
  fireEvent.click(screen.getByLabelText('Email updates'));
  fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
  await screen.findByText(/Preferences saved/);
  expect(mocks.save).toHaveBeenCalledWith({ inApp: true, email: true, whatsapp: false });
});
it('does not claim a save succeeded when the backend fails', async () => {
  mocks.save.mockRejectedValue(new Error('Could not save'));
  render(<MemoryRouter><CommunicationPreferencesPage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save preferences' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
  await screen.findByText('Could not save');
  expect(screen.queryByText(/Preferences saved/)).not.toBeInTheDocument();
});
it('blocks saves when authentication or loading fails', async () => {
  mocks.load.mockRejectedValue(new Error('Sign in first'));
  render(<MemoryRouter><CommunicationPreferencesPage /></MemoryRouter>);
  await screen.findByText('Sign in first');
  expect(screen.getByRole('button', { name: 'Save preferences' })).toBeDisabled();
});
import { vi, beforeEach, it, expect } from 'vitest';

it.each([false, true])('offers an optional community link after purchase (guest=%s)', guest => {
  const go = vi.fn();
  render(<PurchaseThankYou receipt={receipt} guest={guest} onContinue={go} />);
  const link = screen.getByRole('link', { name: /Join the Soma community/ });
  expect(link).toHaveAttribute('href', 'https://chat.whatsapp.com/GOUM9g5U75s4YcUcW0j8yS');
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  fireEvent.click(link);
  expect(go).not.toHaveBeenCalled();
  expect(mocks.save).not.toHaveBeenCalled();
});

it('keeps community joining separate from update consent even if preferences cannot load', async () => {
  mocks.load.mockRejectedValue(new Error('Sign in first'));
  render(<MemoryRouter><CommunicationPreferencesPage /></MemoryRouter>);
  await screen.findByText('Sign in first');
  fireEvent.click(screen.getByRole('link', { name: /Join the Soma community/ }));
  expect(mocks.save).not.toHaveBeenCalled();
  expect(screen.getByLabelText('WhatsApp updates')).not.toBeChecked();
  expect(screen.getByText(/Manage or leave the community in WhatsApp/)).toBeInTheDocument();
});
