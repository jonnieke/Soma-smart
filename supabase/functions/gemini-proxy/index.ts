// Supabase Edge Function: Proxies Gemini AI calls so the API key stays server-side.
// The client sends the prompt/model config, this function adds the key and forwards to Google.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
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

        // Gemini expects contents to be an array of objects with { role: "user|model", parts: [...] }
        // The client often sends an array of strings or simple objects for generateContent.
        // We need to normalize it here before sending to the generative API.
        let normalizedContents = contents;

        if (Array.isArray(contents)) {
            // Check if it's an array of raw elements (strings / inline fetchObjects)
            // or if it's already properly formatted as {role, parts}
            const isRawElements = contents.every(c => typeof c === 'string' || (typeof c === 'object' && !c.role && !c.parts));

            if (isRawElements) {
                const parts = [];
                for (const item of contents) {
                    if (typeof item === 'string') {
                        parts.push({ text: item });
                    } else if (typeof item === 'object' && item.fetchUrl) {
                        try {
                            const targetUrl = typeof item.fetchUrl === 'string' ? item.fetchUrl : item.fetchUrl.url;
                            const targetMime = typeof item.fetchUrl === 'object' ? item.fetchUrl.mimeType : 'application/pdf';

                            if (!targetUrl) throw new Error("fetchUrl object missing 'url' property");

                            const fileRes = await fetch(targetUrl);
                            if (!fileRes.ok) throw new Error(`Failed to fetch URL: ${fileRes.statusText}`);
                            const arrayBuffer = await fileRes.arrayBuffer();
                            const bytes = new Uint8Array(arrayBuffer);
                            const base64 = encodeBase64(bytes);

                            parts.push({
                                inlineData: {
                                    mimeType: targetMime || 'application/pdf',
                                    data: base64
                                }
                            });
                        } catch (e) {
                            console.error('Error fetching remote file:', e);
                            throw new Error('Could not download file for analysis: ' + e.message);
                        }
                    } else {
                        // Other object, presumably a part object already
                        parts.push(item);
                    }
                }
                normalizedContents = [{ role: "user", parts }];
            } else {
                // It might already be formatted as [{ role, parts }], 
                // but we still need to process any fetchUrls deeply
                for (const content of normalizedContents) {
                    if (content.parts && Array.isArray(content.parts)) {
                        for (const part of content.parts) {
                            if (part.fetchUrl) {
                                try {
                                    const fileRes = await fetch(part.fetchUrl.url);
                                    if (!fileRes.ok) throw new Error(`Failed to fetch URL: ${fileRes.statusText}`);
                                    const arrayBuffer = await fileRes.arrayBuffer();
                                    const bytes = new Uint8Array(arrayBuffer);
                                    const base64 = encodeBase64(bytes);

                                    part.inlineData = {
                                        mimeType: part.fetchUrl.mimeType || 'application/pdf',
                                        data: base64
                                    };
                                    delete part.fetchUrl;
                                } catch (e) {
                                    console.error('Error fetching remote file deeply:', e);
                                    throw new Error('Could not download file for analysis deeply: ' + e.message);
                                }
                            }
                        }
                    }
                }
            }
        } else if (typeof contents === 'string') {
            normalizedContents = [{ role: 'user', parts: [{ text: contents }] }];
        }

        // Build the Gemini API request based on model type
        let geminiUrl;
        let geminiBody: Record<string, unknown> = {};

        if (model.includes('embedding')) {
            // For embeddings, use embedContent endpoint
            geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${GEMINI_API_KEY}`;
            geminiBody = { content: normalizedContents[0] }; // Embeddings take a single content object
        } else {
            // For generation, use generateContent endpoint
            geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            geminiBody = { contents: normalizedContents };
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
