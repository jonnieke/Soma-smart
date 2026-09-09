import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { PaymentFlow } from '../features/subscription/PaymentFlow';

const mocks = vi.hoisted(() => ({
  app: {} as Record<string, unknown>,
  initiatePayment: vi.fn(),
  registerStudent: vi.fn(),
  maybeSingle: vi.fn(),
}));
vi.mock('../context/AppContext', () => ({ useApp: () => mocks.app }));
vi.mock('../services/pesapalService', () => ({ pesapalService: { initiatePayment: mocks.initiatePayment } }));
vi.mock('../services/subscriptionService', () => ({ verifyAndFixSubscription: vi.fn() }));
vi.mock('../services/analyticsEventService', () => ({ trackAnalyticsEvent: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { from: () => ({ select: () => ({ in: () => ({ maybeSingle: mocks.maybeSingle }) }) }) } }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.app = { role: 'LEARNER', registerStudent: mocks.registerStudent };
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
  mocks.initiatePayment.mockResolvedValue({});
});
afterEach(cleanup);

async function pay(subscription = false) {
  // A material purchase exercises identity resolution without subscription repair calls.
  render(<PaymentFlow plan={{ id: subscription ? 'daily' : 'material', name: 'Notes', price: 20, segment: subscription ? 'STUDENT' : undefined }} materialId={subscription ? undefined : 'notes-id'} onSuccess={vi.fn()} onCancel={vi.fn()} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '700000000' } });
  fireEvent.click(screen.getByRole('button', { name: /Pay KES 20/ }));
}

describe('checkout identity safeguards', () => {
  it('blocks an unidentified learner buying the daily subscription', async () => {
    await pay(true);
    expect(await screen.findByRole('alert')).toHaveTextContent('No payment has been started');
    expect(mocks.registerStudent).not.toHaveBeenCalled();
    expect(mocks.initiatePayment).not.toHaveBeenCalled();
  });
  it.each(['', 'SOMA-7672'])('blocks unresolved identity with stored code %s', async (code) => {
    if (code) localStorage.setItem('soma_active_student', code);
    await pay();
    expect(await screen.findByRole('alert')).toHaveTextContent('No payment has been started');
    expect(mocks.registerStudent).not.toHaveBeenCalled();
    expect(mocks.initiatePayment).not.toHaveBeenCalled();
  });
  it('blocks the dummy account', async () => {
    mocks.app.userId = '00000000-0000-0000-0000-000000000000';
    await pay();
    expect(await screen.findByRole('alert')).toHaveTextContent('could not confirm');
    expect(mocks.initiatePayment).not.toHaveBeenCalled();
  });
  it('blocks a failed profile lookup without registering a replacement', async () => {
    localStorage.setItem('soma_active_student', 'SOMA-7672');
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: 'Unavailable' } });
    await pay();
    expect(await screen.findByRole('alert')).toHaveTextContent('No payment has been started');
    expect(mocks.initiatePayment).not.toHaveBeenCalled();
    expect(mocks.registerStudent).not.toHaveBeenCalled();
  });
  it('keeps the signed-in learner as payment recipient', async () => {
    mocks.app.studentProfile = { id: 'learner-id', name: 'Test learner' };
    await pay();
    await waitFor(() => expect(mocks.initiatePayment).toHaveBeenCalled());
    expect(mocks.initiatePayment.mock.calls[0][0]).toBe('learner-id');
    expect(mocks.registerStudent).not.toHaveBeenCalled();
  });
  it('uses the resolved saved account when profile state is not loaded', async () => {
    localStorage.setItem('soma_active_student', 'SOMA-7672');
    mocks.maybeSingle.mockResolvedValue({ data: { id: 'saved-learner-id', full_name: 'Test learner' } });
    await pay();
    await waitFor(() => expect(mocks.initiatePayment).toHaveBeenCalled());
    expect(mocks.initiatePayment.mock.calls[0][0]).toBe('saved-learner-id');
  });
});

it('wires the database Student ID into both authenticated restoration paths', () => {
  const source = readFileSync('src/context/AppContext.tsx', 'utf8');
  const refresh = source.slice(source.indexOf('const refreshProfile ='), source.indexOf('const refreshProfile =') + 2300);
  const init = source.slice(source.indexOf('if (session) {', source.indexOf('const initSession')), source.indexOf('if (session) {', source.indexOf('const initSession')) + 4000);
  expect(refresh).toContain("setStudentCode(profile.student_id || '')");
  expect(init).toContain("setStudentCode(profile.student_id || '')");
});
