import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { record } = await req.json()

        if (!record || !record.file_url) {
            return new Response(JSON.stringify({ error: 'No record or file URL provided' }), { headers: corsHeaders })
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set')
        }

        // 1. Download File
        console.log(`Downloading: ${record.file_url}`)
        const response = await fetch(record.file_url)
        const blob = await response.blob()
        const text = await blob.text()

        // 2. Chunk Text (Simplified)
        const chunks = text.match(/[\s\S]{1,1000}/g) || []
        console.log(`Processing ${chunks.length} chunks`)

        // 3. Generate Embeddings using Gemini REST API
        for (const chunk of chunks) {
            const embeddingResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: { parts: [{ text: chunk }] }
                    })
                }
            )

            const result = await embeddingResponse.json()
            if (!result.embedding) {
                console.error('Gemini Embedding Error:', result)
                continue
            }

            const embedding = result.embedding.values

            await supabase.from('knowledge_vectors').insert({
                document_id: record.id,
                content: chunk,
                embedding: embedding
            })
        }

        return new Response(
            JSON.stringify({ success: true, chunks: chunks.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
