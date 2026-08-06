import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encode as encodeBase64 } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const EMBEDDING_MODEL = Deno.env.get('GEMINI_EMBEDDING_MODEL') || 'gemini-embedding-001';
const EXTRACTION_MODEL = Deno.env.get('GEMINI_EXTRACTION_MODEL') || 'gemini-2.5-flash';
const PROVIDER = 'GOOGLE_GEMINI';
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_CHUNKS = 30;

const getAdminEmails = () => new Set(String(Deno.env.get('ADMIN_EMAILS') || 'admin@soma.app,kariukinjoroge13@gmail.com')
  .split(',').map((email) => email.trim().toLowerCase()).filter(Boolean));

const chunkText = (text: string) => {
  const cleaned = text.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!cleaned) return [];
  const paragraphs = cleaned.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const paragraph of paragraphs) {
    if (`${current}\n\n${paragraph}`.length > 1400 && current.length > 0) {
      chunks.push(current.trim());
      current = current.split(/\s+/).slice(-35).join(' ');
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.flatMap((chunk) => chunk.length <= 1800 ? [chunk] : chunk.match(/[\s\S]{1,1600}/g) || [])
    .map((chunk) => chunk.trim()).filter((chunk) => chunk.length > 100).slice(0, MAX_CHUNKS);
};

const sha256 = async (bytes: Uint8Array) => {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, '0')).join('');
};

const extractText = async (apiKey: string, bytes: Uint8Array, mimeType: string, material: any) => {
  if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml')) {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${EXTRACTION_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [
        { text: [
          'Extract the educational text from this teacher-submitted material for originality screening.',
          'Preserve wording, questions, answer choices, headings, worked examples and marking points as written.',
          'Do not assess copyright, accuse the author, summarize, rewrite, or add commentary.',
          'Return extracted text only, sampling across the full document if it is long.',
          `Metadata: ${material.title}; ${material.grade}; ${material.subject}; ${material.category}.`,
        ].join('\n') },
        { inline_data: { mime_type: mimeType, data: encodeBase64(bytes) } },
      ] }],
      generationConfig: { temperature: 0, maxOutputTokens: 16000 },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'Gemini document extraction failed');
  return data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('\n').trim() || '';
};

const embedTexts = async (apiKey: string, texts: string[]) => {
  const model = `models/${EMBEDDING_MODEL}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:batchEmbedContents?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: texts.map((text) => ({ model, content: { parts: [{ text }] }, outputDimensionality: 768 })),
    }),
  });
  const data = await response.json();
  if (!response.ok || !Array.isArray(data?.embeddings)) throw new Error(data?.error?.message || 'Gemini embedding failed');
  return data.embeddings.map((embedding: any) => embedding.values);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const service = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
  let materialId = '';
  try {
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return json({ error: 'Teacher authentication is required' }, 401);
    const { data: authData, error: authError } = await service.auth.getUser(token);
    if (authError || !authData.user) return json({ error: 'Teacher authentication is invalid' }, 401);

    ({ materialId } = await req.json());
    if (!materialId) return json({ error: 'materialId is required' }, 400);
    const { data: material, error: materialError } = await service.from('creator_materials')
      .select('id,creator_id,title,grade,subject,category,source_file_path,file_name,ai_screening_consent_at,ai_screening_provider')
      .eq('id', materialId).single();
    if (materialError || !material) return json({ error: 'Material not found' }, 404);
    const isAdmin = getAdminEmails().has(String(authData.user.email || '').toLowerCase());
    if (material.creator_id !== authData.user.id && !isAdmin) return json({ error: 'You cannot screen another creator’s material' }, 403);
    if (!material.ai_screening_consent_at || material.ai_screening_provider !== PROVIDER) {
      return json({ error: 'Explicit Google Gemini screening consent is required' }, 409);
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
    await service.from('creator_materials').update({ screening_status: 'PROCESSING', updated_at: new Date().toISOString() }).eq('id', materialId);
    await service.from('creator_similarity_reports').insert({ material_id: materialId, status: 'PROCESSING', model: `${EXTRACTION_MODEL} + ${EMBEDDING_MODEL}` });

    const { data: file, error: downloadError } = await service.storage.from('creator-materials').download(material.source_file_path);
    if (downloadError || !file) throw downloadError || new Error('Source file could not be downloaded');
    if (file.size > MAX_FILE_BYTES) throw new Error('AI screening supports files up to 20 MB. The editor will review this file manually.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const fileHash = await sha256(bytes);
    const mimeType = file.type || (material.file_name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    const { data: duplicate } = await service.from('creator_materials').select('id,title').eq('file_sha256', fileHash).neq('id', materialId).limit(1).maybeSingle();
    const extracted = await extractText(apiKey, bytes, mimeType, material);
    const chunks = chunkText(extracted);
    if (!chunks.length) throw new Error('No text could be extracted. The editor will review the material manually.');
    const embeddings = await embedTexts(apiKey, chunks);

    await service.from('creator_material_chunks').delete().eq('material_id', materialId);
    const { error: chunkError } = await service.from('creator_material_chunks').insert(chunks.map((content, index) => ({
      material_id: materialId, chunk_index: index, content, embedding: embeddings[index],
    })));
    if (chunkError) throw chunkError;

    const matches: any[] = [];
    let maximumSimilarity = duplicate ? 1 : 0;
    let highSimilarityChunks = duplicate ? chunks.length : 0;
    for (let index = 0; index < embeddings.length; index++) {
      const embedding = embeddings[index];
      const [{ data: creatorMatches, error: creatorError }, { data: somaMatches, error: somaError }] = await Promise.all([
        service.rpc('match_creator_material_chunks', { query_embedding: embedding, excluded_material_id: materialId, match_count: 3 }),
        service.rpc('match_soma_original_chunks', { query_embedding: embedding, match_count: 3 }),
      ]);
      if (creatorError) throw creatorError;
      if (somaError) throw somaError;
      const candidates = [
        ...(creatorMatches || []).map((match: any) => ({ source: 'CREATOR', sourceId: match.material_id, title: null, ...match })),
        ...(somaMatches || []).map((match: any) => ({ source: 'SOMAAI', sourceId: match.document_id, ...match })),
      ].sort((a, b) => Number(b.similarity) - Number(a.similarity));
      const best = candidates[0];
      if (!best) continue;
      const score = Number(best.similarity || 0);
      maximumSimilarity = Math.max(maximumSimilarity, score);
      if (score >= 0.84) highSimilarityChunks++;
      if (score >= 0.78) matches.push({
        submittedChunk: index,
        source: best.source,
        sourceId: best.sourceId,
        title: best.title || undefined,
        similarity: Number(score.toFixed(4)),
        matchedExcerpt: String(best.content || '').slice(0, 260),
      });
    }

    if (duplicate) matches.unshift({ source: 'CREATOR', sourceId: duplicate.id, title: duplicate.title, similarity: 1, exactFileDuplicate: true });
    const highRatio = highSimilarityChunks / chunks.length;
    const reviewRequired = Boolean(duplicate) || maximumSimilarity >= 0.88 || highRatio >= 0.2;
    const status = reviewRequired ? 'REVIEW_REQUIRED' : 'PASSED';
    const summary = reviewRequired
      ? 'Similarity signals require editorial review. This result is not a copyright finding.'
      : 'No high-risk overlap was detected. Editorial quality and rights review still apply.';

    await service.from('creator_similarity_reports').delete().eq('material_id', materialId).eq('status', 'PROCESSING');
    await service.from('creator_similarity_reports').insert({
      material_id: materialId, status, maximum_similarity: Number(maximumSimilarity.toFixed(4)),
      exact_duplicate: Boolean(duplicate), summary, matches: matches.slice(0, 30), model: `${EXTRACTION_MODEL} + ${EMBEDDING_MODEL}`,
    });
    await service.from('creator_materials').update({
      file_sha256: fileHash, screening_status: status, similarity_score: Number(maximumSimilarity.toFixed(4)), updated_at: new Date().toISOString(),
    }).eq('id', materialId);

    return json({ success: true, status, maximumSimilarity: Number(maximumSimilarity.toFixed(4)), highSimilarityRatio: Number(highRatio.toFixed(4)), humanReviewRequired: reviewRequired });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (materialId) {
      await service.from('creator_similarity_reports').delete().eq('material_id', materialId).eq('status', 'PROCESSING');
      await service.from('creator_similarity_reports').insert({ material_id: materialId, status: 'FAILED', summary: message, model: `${EXTRACTION_MODEL} + ${EMBEDDING_MODEL}` });
      await service.from('creator_materials').update({ screening_status: 'FAILED', updated_at: new Date().toISOString() }).eq('id', materialId);
    }
    return json({ error: message, humanReviewRequired: true }, 400);
  }
});
