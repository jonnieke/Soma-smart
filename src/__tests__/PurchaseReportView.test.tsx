import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PurchaseReport } from '../features/admin/views/PurchaseReport';
const invoke = vi.hoisted(() => vi.fn());
vi.mock('../lib/supabase', () => ({ supabase: { functions: { invoke } } }));
beforeEach(() => invoke.mockReset());
it('shows failures instead of zero revenue', async () => {
  invoke.mockResolvedValue({ error: new Error('Forbidden') });
  render(<PurchaseReport />);
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
  expect(screen.queryByText('KES 0')).not.toBeInTheDocument();
});
it('filters purchases and prepares a message without sending it', async () => {
  invoke.mockResolvedValue({ data: { purchases: [{ id: '1', name: 'Test Buyer', studentId: 'SOMA-TEST', reference: 'SUB_test', category: 'Learning subscription', product: 'Daily Dash', amount: 20, status: 'SUCCESS', phone: '0700000000', email: '', contactSource: 'Profile contact', createdAt: '2026-09-13T00:00:00Z', planStatus: '', planExpiry: '' }] } });
  render(<PurchaseReport />);
  expect(await screen.findByText('Test Buyer')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Message buyer'));
  expect(screen.getByRole('link', { name: 'Open WhatsApp draft' })).toHaveAttribute('href', expect.stringContaining('https://wa.me/254700000000?text='));
  expect(invoke).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText('Message purpose'), { target: { value: 'offer' } });
  expect(screen.queryByRole('link', { name: 'Open WhatsApp draft' })).not.toBeInTheDocument();
  expect(screen.getByText('Copy message')).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Purchase type'), { target: { value: 'Past paper' } });
  expect(screen.getByText(/No purchases match/)).toBeInTheDocument();
});
