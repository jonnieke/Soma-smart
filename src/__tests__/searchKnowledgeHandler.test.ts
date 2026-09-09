// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createSearchHandler, SearchFailure } from '../../supabase/functions/search-knowledge/handler';

const request = (body: unknown) => new Request('https://example.test/search-knowledge', { method: 'POST', body: JSON.stringify(body) });
describe('knowledge search HTTP contract', () => {
  it('passes a transcribed question and curriculum filters unchanged', async () => {
    const search = vi.fn(async () => ({ context: 'A lesson', sources: [], chunks: [] }));
    const response = await createSearchHandler(search)(request({ query: 'What is photosynthesis?', grade: 'Grade 7', subject: 'Science' }));
    expect(response.status).toBe(200);
    expect(search).toHaveBeenCalledWith({ query: 'What is photosynthesis?', grade: 'Grade 7', subject: 'Science', type: null, document_id: null, match_count: 8, match_threshold: 0.38 });
    expect(await response.json()).toHaveProperty('context', 'A lesson');
  });
  it.each([null, [], {}, { query: {} }, { query: ' ' }, { query: 'Question', match_count: 'bad' }, { query: 'Question', match_threshold: 2 }, { query: 'Question', grade: {} }, { query: 'Question', document_id: 'invalid' }])('rejects invalid input before querying dependencies: %j', async body => {
    const search = vi.fn(); const response = await createSearchHandler(search)(request(body));
    expect(response.status).toBe(400); expect(search).not.toHaveBeenCalled();
  });
  it('distinguishes malformed JSON from service failures', async () => {
    const response = await createSearchHandler(vi.fn())(new Request('https://example.test', { method: 'POST', body: '{' }));
    expect(response.status).toBe(400);
  });
  it.each([['EMBEDDING_UNAVAILABLE', 502], ['SEARCH_DATABASE', 503]] as const)('returns a diagnostic code for %s without blaming input', async (code, status) => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await createSearchHandler(async () => { throw new SearchFailure(code, status, 'Library search is temporarily unavailable.'); })(request({ query: 'What is photosynthesis?' }));
      expect(response.status).toBe(status);
      expect(await response.json()).toMatchObject({ code, request_id: expect.any(String) });
    } finally { log.mockRestore(); }
  });
  it('does not expose unexpected provider or database error details', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await createSearchHandler(async () => { throw new Error('private database detail'); })(request({ query: 'Question' }));
      expect(response.status).toBe(500); expect(await response.text()).not.toContain('private database detail');
      expect(JSON.stringify(log.mock.calls)).not.toContain('private database detail');
    } finally { log.mockRestore(); }
  });
  it('supports preflight and rejects other methods without invoking search', async () => {
    const search = vi.fn(); const handler = createSearchHandler(search);
    expect((await handler(new Request('https://example.test', { method: 'OPTIONS' }))).headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect((await handler(new Request('https://example.test'))).status).toBe(405);
    expect(search).not.toHaveBeenCalled();
  });
});
