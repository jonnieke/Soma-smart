// Supabase Edge Function: Proxies Gemini AI calls so the API key stays server-side.
// The client sends the prompt/model config, this function adds the key and forwards to Google.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const FREE_AI_DAILY_LIMIT = Number(Deno.env.get('FREE_AI_DAILY_LIMIT') || '25');  // Registered free users
const GUEST_AI_DAILY_LIMIT = Number(Deno.env.get('GUEST_AI_DAILY_LIMIT') || '3');  // Unregistered guests

const getClientIp = (req: Request) => {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('cf-connecting-ip') ||
        req.headers.get('x-real-ip') ||
        'unknown'
    );
};

const isActivePro = (profile: any) => {
    const tier = String(profile?.subscription_tier || profile?.subscription_status || 'FREE').toUpperCase();
    if (!tier || tier === 'FREE' || tier === 'TRIAL') return false;

    const expiry = profile?.subscription_expiry || profile?.expiry;
    if (!expiry) return true;

    return new Date(expiry).getTime() > Date.now();
};

const usageKindForProfile = (profile: any) => {
    return profile?.role === 'TEACHER' ? 'teacher' : 'learner';
};

const firstRpcRow = (data: any) => {
    if (Array.isArray(data)) return data[0];
    return data;
};

const enforceUsageLimit = async (req: Request) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase service credentials are not configured');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const authHeader = req.headers.get('Authorization') || '';
    const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();

    // Reject tokens that are literally the string "undefined" or "null" (client bug)
    const token = (rawToken && rawToken !== 'undefined' && rawToken !== 'null') ? rawToken : '';

    if (token) {
        const { data: userData, error: authError } = await supabase.auth.getUser(token);

        if (authError || !userData?.user) {
            // Invalid token — fall through to guest IP limiter below
            console.warn('Invalid auth token, treating as guest:', authError?.message);
        } else {
            const userId = userData.user.id;

            // Try to load the profile — if missing, apply a generous fallback limit
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, role, subscription_tier, subscription_status, subscription_expiry, expiry')
                .eq('id', userId)
                .single();

            // Pro users: unlimited
            if (profile && isActivePro(profile)) return;

            // Free/no-profile users: apply FREE_AI_DAILY_LIMIT (25)
            const { data: usageResult, error: usageError } = await supabase.rpc('increment_profile_ai_usage', {
                p_profile_id: userId,
                p_usage_kind: profile ? usageKindForProfile(profile) : 'learner',
                p_limit: FREE_AI_DAILY_LIMIT
            });

            if (usageError) {
                // If the RPC fails (e.g. profile row truly missing), let the call through
                // rather than blocking a legitimate logged-in user
                console.error('Profile usage RPC failed — allowing call:', usageError);
                return;
            }

            const usage = firstRpcRow(usageResult);
            if (!usage?.allowed) {
                throw new Response(JSON.stringify({
                    error: 'Daily free AI limit reached',
                    limit: FREE_AI_DAILY_LIMIT,
                    usageCount: usage?.usage_count ?? FREE_AI_DAILY_LIMIT
                }), {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return; // Authenticated, within limit — allow
        }
    }

    // No valid auth token — apply guest IP-based limit
    const identifier = `ip:${getClientIp(req)}`;
    const { data: guestUsageResult, error: guestUsageError } = await supabase.rpc('increment_guest_ai_usage', {
        p_identifier: identifier,
        p_limit: GUEST_AI_DAILY_LIMIT
    });

    if (guestUsageError) {
        console.error('Guest usage RPC failed:', guestUsageError);
        throw new Error('Could not verify daily guest AI usage limit');
    }

    const guestUsage = firstRpcRow(guestUsageResult);
    if (!guestUsage?.allowed) {
        throw new Response(JSON.stringify({
            error: 'Daily guest AI limit reached',
            limit: GUEST_AI_DAILY_LIMIT,
            usageCount: guestUsage?.usage_count ?? GUEST_AI_DAILY_LIMIT
        }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
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

        const { model, contents, generationConfig, systemInstruction, stream } = await req.json();

        if (!contents || !model) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: model, contents' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        try {
            await enforceUsageLimit(req);
        } catch (limitError) {
            if (limitError instanceof Response) {
                return limitError;
            }
            throw limitError;
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
            // For generation, use generateContent or streamGenerateContent endpoint
            const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
            geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${GEMINI_API_KEY}`;
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

        // Handle streaming response
        if (stream) {
            return new Response(geminiRes.body, {
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                },
                status: 200
            });
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
