import { describe, expect, it } from 'vitest';
import { canStudyExamPaper } from '../services/examPaperEntitlement';
import { requireVerifiedUsageCount } from '../../supabase/functions/_shared/verifiedUsage';

describe('recovered branch safeguards', () => {
  it('honours verified subscription study access without inventing a purchase', () => {
    expect(canStudyExamPaper({ paid: false, subscribed: true, canStudy: true })).toBe(true);
    expect(canStudyExamPaper({ paid: true })).toBe(true);
    expect(canStudyExamPaper({ paid: true, canStudy: false })).toBe(false);
    expect(canStudyExamPaper({ subscribed: true })).toBe(false);
    expect(canStudyExamPaper(undefined)).toBe(false);
  });
  it('accepts a verified zero or positive count', () => {
    expect(() => requireVerifiedUsageCount(0, null, {})).not.toThrow();
    expect(() => requireVerifiedUsageCount(20, null, {})).not.toThrow();
  });
  it.each([null, -1, NaN, 0.5])('rejects invalid counts (%s)', async count => {
    let response: Response | undefined;
    try { requireVerifiedUsageCount(count, null, {}); } catch (error) { response = error as Response; }
    expect(response?.status).toBe(503);
    expect(await response?.json()).toMatchObject({ code: 'LIMIT_VERIFICATION_UNAVAILABLE' });
  });
  it('fails closed on database errors without leaking the query', async () => {
    let response: Response | undefined;
    try { requireVerifiedUsageCount(0, { message: 'secret query details' }, { 'Access-Control-Allow-Origin': 'https://www.somaai.co.ke' }); } catch (error) { response = error as Response; }
    expect(response?.status).toBe(503);
    expect(response?.headers.get('Retry-After')).toBe('30');
    expect(response?.headers.get('Access-Control-Allow-Origin')).toBe('https://www.somaai.co.ke');
    expect(await response?.text()).not.toContain('secret');
  });
});
