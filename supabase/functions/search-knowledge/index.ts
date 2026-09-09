import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { createSearchHandler, SearchFailure } from './handler.ts';

// Keep search vectors compatible with ingest-document and knowledge_vectors.embedding
// (vector(768)). The previous text-embedding-005 default could return a rejected
// request or a dimension mismatch after a learner recorded a voice question.
const EMBEDDING_MODEL = Deno.env.get("GEMINI_EMBEDDING_MODEL") || "gemini-embedding-001";

type KnowledgeChunk = {
  id: number;
  content: string;
  similarity: number;
  keyword_rank?: number;
  combined_score?: number;
  document_id: number;
  title?: string | null;
  grade?: string | null;
  subject?: string | null;
  type?: string | null;
  file_url?: string | null;
  source?: string | null;
  is_official?: boolean | null;
  chunk_index?: number | null;
  metadata?: Record<string, unknown> | null;
};


const embedQuery = async (query: string, apiKey: string) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        content: { parts: [{ text: query }] },
        outputDimensionality: 768,
      }),
    },
  );

  const result = await response.json();
  if (!response.ok || !result.embedding?.values) {
    throw new SearchFailure('EMBEDDING_UNAVAILABLE', 502, 'Library search is temporarily unavailable. Please try again.');
  }

  const values = result.embedding.values;
  if (!Array.isArray(values) || values.length !== 768 || !values.every((value: unknown) => typeof value === 'number' && Number.isFinite(value))) {
    throw new SearchFailure('EMBEDDING_INVALID', 502, 'Library search is temporarily unavailable. Please try again.');
  }
  return values;
};

const buildSources = (chunks: KnowledgeChunk[]) => {
  const sources = new Map<number, {
    document_id: number;
    title: string;
    grade: string;
    subject: string;
    type: string;
    source: string;
    file_url?: string | null;
    chunk_count: number;
    top_score: number;
  }>();

  for (const chunk of chunks) {
    const existing = sources.get(chunk.document_id);
    const score = chunk.combined_score ?? chunk.similarity ?? 0;
    if (existing) {
      existing.chunk_count += 1;
      existing.top_score = Math.max(existing.top_score, score);
      continue;
    }

    sources.set(chunk.document_id, {
      document_id: chunk.document_id,
      title: chunk.title || "Soma study material",
      grade: chunk.grade || "All grades",
      subject: chunk.subject || "General",
      type: chunk.type || "MATERIAL",
      source: chunk.source || (chunk.is_official ? "Soma Official" : "Teacher Material"),
      file_url: chunk.file_url,
      chunk_count: 1,
      top_score: score,
    });
  }

  return Array.from(sources.values()).sort((a, b) => b.top_score - a.top_score);
};

const buildContext = (chunks: KnowledgeChunk[]) =>
  chunks
    .map((chunk, index) => {
      const sourceNumber = index + 1;
      const heading = [
        `S${sourceNumber}`,
        chunk.title || "Soma study material",
        chunk.grade,
        chunk.subject,
        chunk.type,
      ].filter(Boolean).join(" | ");
      return `[${heading}]\n${chunk.content.trim()}`;
    })
    .join("\n\n---\n\n");

serve(createSearchHandler(async (body) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new SearchFailure('SEARCH_CONFIGURATION', 503, 'Library search is temporarily unavailable.');
  let embedding: number[];
  try { embedding = await embedQuery(body.query, apiKey); }
  catch (failure) {
    if (failure instanceof SearchFailure) throw failure;
    throw new SearchFailure('EMBEDDING_UNAVAILABLE', 502, 'Library search is temporarily unavailable. Please try again.');
  }
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: body.match_threshold,
    match_count: body.match_count,
    filter_document_id: body.document_id,
    filter_grade: body.grade,
    filter_subject: body.subject,
    filter_type: body.type,
    query_text: body.query,
  });
  if (error) throw new SearchFailure('SEARCH_DATABASE', 503, 'Library search is temporarily unavailable. Please try again.');
  const chunks = (data || []) as KnowledgeChunk[];
  return { chunks, sources: buildSources(chunks), context: buildContext(chunks), query: body.query, match_count: chunks.length };
}));
