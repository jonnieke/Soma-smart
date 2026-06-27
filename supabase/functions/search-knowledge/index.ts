import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-student-code",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMBEDDING_MODEL = Deno.env.get("GEMINI_EMBEDDING_MODEL") || "text-embedding-005";

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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const embedQuery = async (query: string, apiKey: string) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: query }] },
      }),
    },
  );

  const result = await response.json();
  if (!response.ok || !result.embedding?.values) {
    throw new Error(`Gemini embedding failed: ${JSON.stringify(result).slice(0, 800)}`);
  }

  return result.embedding.values;
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const query = String(body.query || "").trim();

    if (!query) {
      return json({ error: "No query provided" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const embedding = await embedQuery(query, apiKey);
    const matchCount = Math.min(Math.max(Number(body.match_count || 8), 1), 20);
    const threshold = Number.isFinite(Number(body.match_threshold))
      ? Number(body.match_threshold)
      : 0.38;

    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: matchCount,
      filter_document_id: body.document_id || null,
      filter_grade: body.grade || null,
      filter_subject: body.subject || null,
      filter_type: body.type || null,
      query_text: query,
    });

    if (error) throw error;

    const chunks = (data || []) as KnowledgeChunk[];
    return json({
      chunks,
      sources: buildSources(chunks),
      context: buildContext(chunks),
      query,
      match_count: chunks.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 400);
  }
});
