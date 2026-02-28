// Supabase Edge Function: Proxies Gemini AI calls so the API key stays server-side.
// The client sends the prompt/model config, this function adds the key and forwards to Google.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'GEMINI_API_KEY not configured on server' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
        }

        const { model, contents, generationConfig, systemInstruction } = await req.json();

        if (!contents || !model) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: model, contents' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // Build the Gemini API request based on model type
        let geminiUrl;
        let geminiBody: Record<string, unknown> = {};

        if (model.includes('embedding')) {
            // For embeddings, use embedContent endpoint
            geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${GEMINI_API_KEY}`;
            geminiBody = { content: contents[0] }; // Embeddings take a single content object
        } else {
            // For generation, use generateContent endpoint
            geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            geminiBody = { contents };
            if (generationConfig) geminiBody.generationConfig = generationConfig;
            if (systemInstruction) geminiBody.systemInstruction = systemInstruction;
        }

        const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody),
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error('Gemini API Error:', geminiRes.status, errText);
            return new Response(
                JSON.stringify({ error: 'Gemini API request failed', details: errText }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: geminiRes.status }
            );
        }

        const data = await geminiRes.json();

        return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
