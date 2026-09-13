import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getOwnPaymentHistory, getPaymentReceipt, getAdminPaymentRows } from '../services/transactionAccessService';
const mocks = vi.hoisted(() => ({ invoke: vi.fn(), getSession: vi.fn(), from: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { functions: { invoke: mocks.invoke }, auth: { getSession: mocks.getSession }, from: mocks.from } }));
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); mocks.getSession.mockResolvedValue({ data: { session: null } }); });
describe('restricted transaction access', () => {
  it('never lists guest transactions without a receipt', async () => {
    expect(await getOwnPaymentHistory('learner-a')).toEqual([]);
    expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('scopes guest recovery to its receipt and intended profile', async () => {
    localStorage.setItem('soma_last_payment_reference', 'SUB_test');
    mocks.invoke.mockResolvedValue({ data: { receipt: { reference_code: 'SUB_test', status: 'SUCCESS' } } });
    expect(await getOwnPaymentHistory('learner-a')).toHaveLength(1);
    expect(mocks.invoke).toHaveBeenCalledWith('pesapal/receipt-status', { body: { merchantReference: 'SUB_test', profileId: 'learner-a' } });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('does not enumerate another account through an authenticated session', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'different-user' } } } });
    expect(await getOwnPaymentHistory('learner-a')).toEqual([]);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('does not turn a verification error into payment success', async () => {
    mocks.invoke.mockResolvedValue({ error: new Error('Provider unavailable') });
    await expect(getPaymentReceipt('SUB_test')).rejects.toThrow('confirmation unavailable');
  });
  it('keeps admin reports behind the protected endpoint', async () => {
    mocks.invoke.mockResolvedValue({ error: new Error('Forbidden') });
    await expect(getAdminPaymentRows()).rejects.toThrow('report unavailable');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('allows owner history through the RLS-protected table', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'learner-a' } } } });
    const limit = vi.fn().mockResolvedValue({ data: [{ reference_code: 'SUB_owned' }] });
    const eq = vi.fn(() => ({ order: () => ({ limit }) }));
    mocks.from.mockReturnValue({ select: () => ({ eq }) });
    expect(await getOwnPaymentHistory('learner-a')).toHaveLength(1);
    expect(eq).toHaveBeenCalledWith('user_id', 'learner-a');
  });
});
