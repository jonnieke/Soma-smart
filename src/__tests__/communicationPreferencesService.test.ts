const mocks = vi.hoisted(() => ({ getUser: vi.fn(), maybeSingle: vi.fn(), rpc: vi.fn(), eq: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: {
  auth: { getUser: mocks.getUser }, rpc: mocks.rpc,
  from: () => ({ select: () => ({ eq: (...args: unknown[]) => { mocks.eq(...args); return { maybeSingle: mocks.maybeSingle }; } }) }),
} }));
import { communicationPreferencesService as service } from '../services/communicationPreferencesService';
beforeEach(() => { vi.clearAllMocks(); mocks.getUser.mockResolvedValue({ data: { user: { id: 'own-id' } } }); });
it('ignores old default-true values without explicit consent', async () => {
  mocks.maybeSingle.mockResolvedValue({ data: { email_enabled: true, whatsapp_enabled: true } });
  expect(await service.load()).toEqual({ inApp: true, email: false, whatsapp: false });
  expect(mocks.eq).toHaveBeenCalledWith('user_id', 'own-id');
});
it('fails closed for signed-out users', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null } });
  await expect(service.load()).rejects.toThrow('Sign in');
  expect(mocks.maybeSingle).not.toHaveBeenCalled();
});
it('saves only choices, never a caller-supplied account ID', async () => {
  mocks.rpc.mockResolvedValue({ error: null });
  await service.save({ inApp: true, email: false, whatsapp: false });
  expect(mocks.rpc).toHaveBeenCalledWith('save_my_communication_preferences', { p_in_app: true, p_email: false, p_whatsapp: false });
});
import { vi, beforeEach, it, expect } from 'vitest';
