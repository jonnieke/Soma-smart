// Guest purchases use the same unguessable browser capability as /access.
// Never accept a phone number, email, or client-side "paid" flag as ownership.
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const pageSize = 200;
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers });
type ReadOrders = (
  buyerToken: string,
  from: number,
  to: number
) => Promise<{ data: { exam_id: string | number }[] | null; error: unknown }>;

export async function handlePaperLibraryRequest(
  req: Request,
  readOrders: ReadOrders
): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  const token = body?.buyerToken;
  const offset = body?.offset ?? 0;
  if (
    typeof token !== 'string' ||
    !uuid.test(token) ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    offset > 10000
  ) {
    return json({ error: 'Valid purchase token and offset required.' }, 400);
  }
  try {
    // One extra row tells the client whether another page is required.
    const { data, error } = await readOrders(token, offset, offset + pageSize);
    if (error || !data) return json({ error: 'Could not restore purchases. Please retry.' }, 503);
    const paperIds = [...new Set(data.slice(0, pageSize).map((row) => String(row.exam_id)))];
    return json({ paperIds, nextOffset: data.length > pageSize ? offset + pageSize : null });
  } catch {
    // Do not leak query details, buyer tokens, or customer records in errors/logs.
    return json({ error: 'Could not restore purchases. Please retry.' }, 503);
  }
}
