import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handlePaperLibraryRequest } from '../../supabase/functions/_shared/paperLibrary';
import { examPaperBankService } from '../services/examPaperBankService';
const { invoke, rpc } = vi.hoisted(() => ({ invoke: vi.fn(), rpc: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { functions: { invoke }, rpc } }));
const token = '11111111-1111-4111-8111-111111111111';
const otherToken = '22222222-2222-4222-8222-222222222222';
const request = (body: unknown) =>
  new Request('https://example.test/library', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('purchase library endpoint', () => {
  it('sends the existing learner credential pair for server subscription verification', async () => {
    localStorage.setItem('soma_active_student', 'SOMA-TEST');
    localStorage.setItem('soma_active_student_pin', '1234');
    invoke.mockResolvedValue({ data: { canStudy: true }, error: null });
    await examPaperBankService.getAccess(7);
    expect(invoke).toHaveBeenLastCalledWith('exam-paper-bank/access', expect.objectContaining({
      body: expect.objectContaining({ examId: 7, learnerCode: 'SOMA-TEST', learnerPin: '1234' }),
    }));
    localStorage.removeItem('soma_active_student_pin');
    await examPaperBankService.getAccess(7);
    expect(invoke.mock.calls.at(-1)?.[1].body).not.toHaveProperty('learnerCode');
  });
  it('uses the legacy catalog signature and preserves redacted file availability', async () => {
    rpc.mockResolvedValueOnce({ error: { message: 'Unavailable' } })
      .mockResolvedValueOnce({ data: [{ id: 7, has_exam_paper: true, has_marking_scheme: true }], error: null });
    expect(await examPaperBankService.listPapers()).toEqual([{ id: 7, has_exam_paper: true, has_marking_scheme: true }]);
    expect(rpc).toHaveBeenLastCalledWith('list_published_exams', { p_grade: null, p_subject: null });
  });
  it('rejects invalid ownership before reading any orders', async () => {
    const read = vi.fn();
    for (const buyerToken of [undefined, '', '0712345678', 'not-a-token', { token }]) {
      expect((await handlePaperLibraryRequest(request({ buyerToken }), read)).status).toBe(400);
    }
    expect(read).not.toHaveBeenCalled();
  });
  it('supports preflight and rejects other methods', async () => {
    const read = vi.fn();
    expect(
      (
        await handlePaperLibraryRequest(
          new Request('https://example.test', { method: 'OPTIONS' }),
          read
        )
      ).status
    ).toBe(200);
    expect(
      (await handlePaperLibraryRequest(new Request('https://example.test'), read)).status
    ).toBe(405);
    expect(read).not.toHaveBeenCalled();
  });
  it('passes only the validated capability and page bounds to the lookup', async () => {
    const read = vi
      .fn()
      .mockResolvedValue({ data: [{ exam_id: 7 }, { exam_id: 7 }, { exam_id: 8 }], error: null });
    const response = await handlePaperLibraryRequest(
      request({ buyerToken: token, buyerPhone: 'ignored' }),
      read
    );
    expect(read).toHaveBeenCalledWith(token, 0, 200);
    expect(await response.json()).toEqual({ paperIds: ['7', '8'], nextOffset: null });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
  it('does not return another buyer’s results', async () => {
    const read = vi.fn(async (buyerToken: string) => ({
      data: buyerToken === token ? [{ exam_id: 7 }] : [],
      error: null,
    }));
    const response = await handlePaperLibraryRequest(request({ buyerToken: otherToken }), read);
    expect(await response.json()).toEqual({ paperIds: [], nextOffset: null });
    expect(read).toHaveBeenCalledWith(otherToken, 0, 200);
  });
  it('does not leak errors or pretend failures are empty libraries', async () => {
    const response = await handlePaperLibraryRequest(request({ buyerToken: token }), async () => {
      throw new Error('private database information');
    });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private database information');
  });
  it('paginates without dropping purchases', async () => {
    const response = await handlePaperLibraryRequest(
      request({ buyerToken: token, offset: 200 }),
      async () => ({
        data: Array.from({ length: 201 }, (_, i) => ({ exam_id: i + 1 })),
        error: null,
      })
    );
    const body = await response.json();
    expect(body.paperIds).toHaveLength(200);
    expect(body.nextOffset).toBe(400);
  });
  it('rejects invalid pagination', async () => {
    const read = vi.fn();
    for (const offset of [-1, 1.5, '0', 10001])
      expect(
        (await handlePaperLibraryRequest(request({ buyerToken: token, offset }), read)).status
      ).toBe(400);
    expect(read).not.toHaveBeenCalled();
  });
});

describe('purchase restoration client', () => {
  it('does not create an identity or call the server for a new visitor', async () => {
    expect(await examPaperBankService.listPurchasedPaperIds()).toEqual([]);
    expect(invoke).not.toHaveBeenCalled();
    expect(localStorage.getItem('soma_exam_paper_buyer_token')).toBeNull();
  });
  it('restores server-verified IDs using the existing browser token on every visit', async () => {
    localStorage.setItem('soma_exam_paper_buyer_token', token);
    invoke.mockResolvedValue({ data: { paperIds: ['7'], nextOffset: null }, error: null });
    expect(await examPaperBankService.listPurchasedPaperIds()).toEqual(['7']);
    expect(await examPaperBankService.listPurchasedPaperIds()).toEqual(['7']);
    expect(invoke).toHaveBeenCalledTimes(2);
    expect(invoke).toHaveBeenCalledWith('exam-paper-library', {
      body: { buyerToken: token, offset: 0 },
    });
  });
  it('combines pages without duplicate papers', async () => {
    localStorage.setItem('soma_exam_paper_buyer_token', token);
    invoke
      .mockResolvedValueOnce({ data: { paperIds: ['7'], nextOffset: 200 }, error: null })
      .mockResolvedValueOnce({ data: { paperIds: ['7', '8'], nextOffset: null }, error: null });
    expect(await examPaperBankService.listPurchasedPaperIds()).toEqual(['7', '8']);
  });
  it('propagates network failures for the retry screen', async () => {
    localStorage.setItem('soma_exam_paper_buyer_token', token);
    invoke.mockResolvedValue({ data: null, error: new Error('Unavailable') });
    await expect(examPaperBankService.listPurchasedPaperIds()).rejects.toThrow('Unavailable');
  });
  it('rejects malformed server results rather than trusting them', async () => {
    localStorage.setItem('soma_exam_paper_buyer_token', token);
    invoke.mockResolvedValue({ data: { paperIds: ['paid'], nextOffset: null }, error: null });
    await expect(examPaperBankService.listPurchasedPaperIds()).rejects.toThrow(
      'Invalid purchase library response'
    );
  });
});
