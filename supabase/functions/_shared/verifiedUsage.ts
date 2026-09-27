/** A failed allowance lookup must never turn into free, unmetered AI usage. */
export function requireVerifiedUsageCount(count: number | null, error: unknown, headers: Record<string, string>): void {
  if (!error && Number.isSafeInteger(count) && count !== null && count >= 0) return;
  throw new Response(JSON.stringify({
    error: 'We could not verify your learning allowance. Please try again.',
    code: 'LIMIT_VERIFICATION_UNAVAILABLE',
    retryAfterSeconds: 30,
  }), {
    status: 503,
    headers: { ...headers, 'Content-Type': 'application/json', 'Retry-After': '30', 'Cache-Control': 'no-store' },
  });
}
