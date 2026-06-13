import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMBEDDING_MODEL = Deno.env.get("GEMINI_EMBEDDING_MODEL") || "text-embedding-004";
const EXTRACTION_MODEL = Deno.env.get("GEMINI_EXTRACTION_MODEL") || "gemini-2.5-flash";
const MAX_CHUNKS = Number(Deno.env.get("RAG_MAX_CHUNKS_PER_DOCUMENT") || "240");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const roughTokens = (text: string) => Math.max(1, Math.ceil(text.length / 4));

const inferMimeType = (record: any, response: Response) => {
  const fromHeader = response.headers.get("content-type")?.split(";")[0]?.trim();
  if (fromHeader) return fromHeader;
  const path = String(record?.file_path || record?.file_url || "").toLowerCase();
  if (path.endsWith(".pdf")) return "application/pdf";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".mp3")) return "audio/mpeg";
  if (path.endsWith(".wav")) return "audio/wav";
  return "text/plain";
};

const chunkText = (text: string) => {
  const cleaned = text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned) return [];

  const paragraphs = cleaned.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).length > 1400 && current.length > 0) {
      chunks.push(current.trim());
      const words = current.split(/\s+/);
      current = words.slice(-45).join(" ");
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }

  if (current.trim()) chunks.push(current.trim());

  return chunks
    .flatMap(chunk => chunk.length <= 1800 ? [chunk] : chunk.match(/[\s\S]{1,1600}/g) || [])
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 80)
    .slice(0, MAX_CHUNKS);
};

const extractWithGemini = async (apiKey: string, bytes: Uint8Array, mimeType: string, record: any) => {
  const base64 = encodeBase64(bytes);
  const prompt = [
    "Extract clean educational text from this learning material for retrieval-augmented tutoring.",
    "Preserve questions, answer choices, marking-scheme points, formulas, headings, topic names, and page/section cues where visible.",
    "Do not summarize. Do not add commentary. Return only the extracted text.",
    `Known metadata: title=${record?.title || "Untitled"}, grade=${record?.grade || "Unknown"}, subject=${record?.subject || "Unknown"}, type=${record?.type || "Unknown"}.`,
  ].join("\n");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${EXTRACTION_MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 12000,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Gemini extraction failed");
  return data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || "").join("\n").trim() || "";
};

const extractText = async (apiKey: string, bytes: Uint8Array, mimeType: string, record: any) => {
  const isTextLike =
    mimeType.startsWith("text/") ||
    mimeType.includes("json") ||
    mimeType.includes("csv") ||
    mimeType.includes("xml") ||
    mimeType.includes("markdown");

  if (isTextLike) {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }

  return extractWithGemini(apiKey, bytes, mimeType, record);
};

const embedText = async (apiKey: string, text: string) => {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
    }),
  });

  const data = await res.json();
  if (!res.ok || !data?.embedding?.values) {
    throw new Error(data?.error?.message || "Gemini embedding failed");
  }

  return data.embedding.values;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let record: any = null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const body = await req.json();
    record = body.record || body;
    if (!record?.id || !record?.file_url) return json({ error: "record.id and record.file_url are required" }, 400);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    await supabase
      .from("knowledge_base")
      .update({ indexing_status: "PROCESSING", last_index_error: null })
      .eq("id", record.id);

    const fileResponse = await fetch(record.file_url);
    if (!fileResponse.ok) throw new Error(`Could not download file: ${fileResponse.status}`);

    const mimeType = inferMimeType(record, fileResponse);
    const bytes = new Uint8Array(await fileResponse.arrayBuffer());
    const extractedText = await extractText(apiKey, bytes, mimeType, record);
    const chunks = chunkText(extractedText);

    if (chunks.length === 0) throw new Error("No searchable text was extracted from this document");

    await supabase.from("knowledge_vectors").delete().eq("document_id", record.id);

    const rows = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embedText(apiKey, chunk);
      rows.push({
        document_id: record.id,
        content: chunk,
        embedding,
        chunk_index: i,
        token_count: roughTokens(chunk),
        title: record.title,
        grade: record.grade,
        subject: record.subject,
        source_type: record.type,
        metadata: {
          title: record.title,
          grade: record.grade,
          subject: record.subject,
          type: record.type,
          file_url: record.file_url,
          file_path: record.file_path,
          mime_type: mimeType,
          source: record.source || "SOMA",
          is_official: record.is_official ?? true,
        },
      });
    }

    const { error: insertError } = await supabase.from("knowledge_vectors").insert(rows);
    if (insertError) throw insertError;

    await supabase
      .from("knowledge_base")
      .update({
        indexing_status: "READY",
        indexed_at: new Date().toISOString(),
        chunk_count: rows.length,
        last_index_error: null,
      })
      .eq("id", record.id);

    return json({ success: true, document_id: record.id, chunks: rows.length, mimeType });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (record?.id) {
      await supabase
        .from("knowledge_base")
        .update({ indexing_status: "FAILED", last_index_error: message })
        .eq("id", record.id);
    }
    return json({ error: message }, 400);
  }
});
