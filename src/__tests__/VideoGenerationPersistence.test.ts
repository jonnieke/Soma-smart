import { beforeEach, expect, it, vi } from 'vitest';
import { savedVideoGeneration } from '../services/videoGenerationService';
const mocks = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), eq: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { from: () => ({ insert: mocks.insert, update: mocks.update }) } }));
beforeEach(() => { vi.resetAllMocks(); mocks.insert.mockResolvedValue({ error: null }); mocks.update.mockReturnValue({ eq: mocks.eq }); mocks.eq.mockResolvedValue({ error: null }); });
it('does not spend AI credits if the private record cannot be created', async () => {
  mocks.insert.mockResolvedValue({ error: new Error('denied') });
  const generate = vi.fn();
  await expect(savedVideoGeneration('4oXDoJkprx0','study',{},'existing-model',generate)).rejects.toThrow('No AI request was sent');
  expect(generate).not.toHaveBeenCalled();
});
it('persists output and token metadata under the preallocated ID', async () => {
  const generate = vi.fn(async () => ({ text:'saved notes', usage:{ totalTokenCount:123 } }));
  expect(await savedVideoGeneration('4oXDoJkprx0','study',{ title:'Digestion' },'existing-model',generate)).toBe('saved notes');
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ id:expect.any(String), video_id:'4oXDoJkprx0',model:'existing-model' }));
  expect(mocks.update).toHaveBeenCalledWith({ result:'saved notes',usage:{ totalTokenCount:123 },status:'complete' });
  expect(mocks.eq).toHaveBeenCalledWith('id',mocks.insert.mock.calls[0][0].id);
});
it('retains paid output for manual recovery if persistence fails twice', async () => {
  mocks.eq.mockResolvedValue({ error: new Error('offline') });
  await expect(savedVideoGeneration('4oXDoJkprx0','study',{},'existing-model',async () => ({ text:'recover me',usage:null }))).rejects.toMatchObject({ generatedText:'recover me' });
  expect(mocks.eq).toHaveBeenCalledTimes(2);
});
it('marks failed requests without claiming a result exists', async () => {
  await expect(savedVideoGeneration('4oXDoJkprx0','transcript',{},'existing-model',async () => { throw new Error('quota'); })).rejects.toThrow('quota');
  expect(mocks.update).toHaveBeenCalledWith({ status:'failed' });
});
