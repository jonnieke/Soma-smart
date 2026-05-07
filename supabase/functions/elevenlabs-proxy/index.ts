// Supabase Edge Function: Proxies ElevenLabs AI calls so the API key stays server-side.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
        if (!ELEVEN_LABS_API_KEY) {
            console.error("ELEVEN_LABS_API_KEY is missing from environment");
            return new Response(
                JSON.stringify({ error: 'Server configuration error' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
        }

        // Require authentication
        const authHeader = req.headers.get('Authorization') || '';
        const token = authHeader.replace(/^Bearer\s+/i, '');
        if (!token || token === 'undefined' || token === 'null') {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Missing token' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            );
        }

        // Verify token with Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        
        if (supabaseUrl && supabaseAnonKey) {
             const supabase = createClient(supabaseUrl, supabaseAnonKey);
             const { data: { user }, error: authError } = await supabase.auth.getUser(token);
             if (authError || !user) {
                 return new Response(
                     JSON.stringify({ error: 'Unauthorized: Invalid token' }),
                     { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
                 );
             }
        }

        // Parse request body
        const reqBody = await req.json();
        const { voiceId, ...elevenLabsPayload } = reqBody;

        if (!voiceId || !elevenLabsPayload.text) {
             return new Response(
                 JSON.stringify({ error: 'Bad Request: Missing voiceId or text' }),
                 { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
             );
        }

        // Forward to ElevenLabs
        const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        const elevenLabsRes = await fetch(elevenLabsUrl, {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVEN_LABS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(elevenLabsPayload)
        });

        if (!elevenLabsRes.ok) {
            const errText = await elevenLabsRes.text();
            console.error('ElevenLabs API Error:', elevenLabsRes.status, errText);
            return new Response(
                JSON.stringify({ error: 'ElevenLabs API request failed', details: errText }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: elevenLabsRes.status }
            );
        }

        // Stream binary data back directly
        return new Response(elevenLabsRes.body, {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': elevenLabsRes.headers.get('Content-Type') || 'audio/mpeg'
            }
        });

    } catch (error: any) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
