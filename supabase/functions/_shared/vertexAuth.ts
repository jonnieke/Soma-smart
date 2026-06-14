// Exchanges a Google service account JSON for a short-lived Vertex AI Bearer token.
// Tokens are valid for 1 hour. Edge functions are stateless so we fetch one per invocation.

export async function getVertexAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  if (!sa.client_email || !sa.private_key) {
    throw new Error('Service account JSON must contain client_email and private_key');
  }

  const b64url = (s: string) =>
    btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  const signingInput = `${header}.${payload}`;

  const pemKey = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const keyBytes = Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const jwt = `${signingInput}.${sig}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Vertex AI token exchange failed: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token as string;
}

export function vertexGenerateUrl(
  projectId: string,
  region: string,
  model: string,
  stream = false
): string {
  const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
  const sse = stream ? '?alt=sse' : '';
  return `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:${endpoint}${sse}`;
}

export function vertexEmbedUrl(projectId: string, region: string, model: string): string {
  return `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:predict`;
}

// Normalises a Vertex AI embedding response to the AI Studio shape so
// callers don't need two code paths.
// Vertex: { predictions: [{ embeddings: { values: [] } }] }
// AI Studio: { embedding: { values: [] } }
export function normalizeVertexEmbedResponse(raw: Record<string, unknown>): Record<string, unknown> {
  const predictions = raw.predictions as Array<{ embeddings?: { values: number[] } }> | undefined;
  if (predictions?.[0]?.embeddings) {
    return { embedding: { values: predictions[0].embeddings.values } };
  }
  return raw;
}
