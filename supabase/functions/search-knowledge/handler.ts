export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-student-code',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export class SearchFailure extends Error {
  constructor(public code: string, public status: number, message: string) { super(message); }
}

export type SearchInput = {
  query: string;
  match_count: number;
  match_threshold: number;
  document_id: string | number | null;
  grade: string | null;
  subject: string | null;
  type: string | null;
};

const invalid = () => new SearchFailure('INVALID_REQUEST', 400, 'Provide a question and valid search filters.');
export function parseSearchInput(value: unknown): SearchInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
  const body = value as Record<string, unknown>;
  if (typeof body.query !== 'string' || !body.query.trim()) throw invalid();
  const count = body.match_count ?? 8;
  const threshold = body.match_threshold ?? 0.38;
  if (typeof count !== 'number' || !Number.isFinite(count) || !Number.isInteger(count) || count < 1 ||
      typeof threshold !== 'number' || !Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw invalid();
  const filter = (key: string) => {
    const field = body[key];
    if (field == null || field === '') return null;
    if (typeof field !== 'string') throw invalid();
    return field.trim() || null;
  };
  const id = body.document_id;
  if (id != null && id !== '' && !(typeof id === 'number' && Number.isSafeInteger(id) && id > 0) &&
      !(typeof id === 'string' && /^[1-9]\d*$/.test(id))) throw invalid();
  return { query: body.query.trim(), match_count: Math.min(count, 20), match_threshold: threshold,
    document_id: id === '' || id == null ? null : id as string | number,
    grade: filter('grade'), subject: filter('subject'), type: filter('type') };
}

// Dependency injection keeps the HTTP contract testable without paid API calls or database access.
export function createSearchHandler(search: (input: SearchInput) => Promise<unknown>) {
  return async (req: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return json({ error: 'Use POST for search.', code: 'METHOD_NOT_ALLOWED', request_id: requestId }, 405);
    try {
      let body: unknown;
      try { body = await req.json(); } catch { throw invalid(); }
      return json(await search(parseSearchInput(body)));
    } catch (failure) {
      const known = failure instanceof SearchFailure;
      const status = known ? failure.status : 500;
      const code = known ? failure.code : 'SEARCH_UNAVAILABLE';
      // Do not expose provider responses, question text, keys, or database internals.
      if (status >= 500) console.error('Knowledge search failed', { request_id: requestId, code });
      return json({ error: known ? failure.message : 'Library search is temporarily unavailable. Please try again.', code, request_id: requestId }, status);
    }
  };
}
