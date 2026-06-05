// Supabase Edge Function: Proxies ElevenLabs AI calls so the API key stays server-side.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-student-code',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const KES_PER_USD = 130;
const ELEVENLABS_USD_PER_1000_CHARS = 0.30;

const VOICE_LIMITS: Record<string, Record<string, number>> = {
    FREE: { listen_and_learn_voice: 1200, listen_and_learn_podcast: 0, conversational_voice: 1200 },
    DAILY: { listen_and_learn_voice: 9000, listen_and_learn_podcast: 7000, conversational_voice: 7000 },
    WEEKLY: { listen_and_learn_voice: 50000, listen_and_learn_podcast: 35000, conversational_voice: 35000 },
    MONTHLY: { listen_and_learn_voice: 180000, listen_and_learn_podcast: 120000, conversational_voice: 120000 },
    TERMLY: { listen_and_learn_voice: 500000, listen_and_learn_podcast: 330000, conversational_voice: 330000 },
    ANNUAL: { listen_and_learn_voice: 1800000, listen_and_learn_podcast: 1200000, conversational_voice: 1200000 },
    PRO: { listen_and_learn_voice: 180000, listen_and_learn_podcast: 120000, conversational_voice: 120000 },
};

const getClientIp = (req: Request) => (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown'
);

const effectivePlanForProfile = (profile: any) => {
    const tier = String(profile?.subscription_tier || profile?.subscription_status || 'FREE').toUpperCase();
    if (!tier || tier === 'TRIAL') return 'FREE';
    if (tier !== 'FREE') {
        const expiry = profile?.subscription_expiry || profile?.expiry;
        if (!expiry || new Date(expiry).getTime() > Date.now()) return tier;
    }
    return 'FREE';
};

const getSupabaseAdmin = () => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase service credentials are not configured');
    return createClient(supabaseUrl, serviceRoleKey);
};

const resolveRequester = async (req: Request, supabase: any) => {
    const authHeader = req.headers.get('Authorization') || '';
    const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    const token = (rawToken && rawToken !== 'undefined' && rawToken !== 'null') ? rawToken : '';

    if (token) {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user?.id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, role, subscription_tier, subscription_status, subscription_expiry, expiry, student_id')
                .eq('id', userData.user.id)
                .maybeSingle();
            return {
                userId: userData.user.id,
                studentCode: profile?.student_id || null,
                plan: profile ? effectivePlanForProfile(profile) : 'FREE',
                identifier: `user:${userData.user.id}`,
            };
        }
    }

    const studentCode = req.headers.get('x-student-code')?.trim();
    if (studentCode && studentCode.startsWith('SOMA-')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, subscription_tier, subscription_status, subscription_expiry, expiry, student_id')
            .eq('student_id', studentCode)
            .maybeSingle();
        if (profile) {
            return {
                userId: profile.id,
                studentCode,
                plan: effectivePlanForProfile(profile),
                identifier: `student:${studentCode}`,
            };
        }
    }

    return { userId: null, studentCode: null, plan: 'FREE', identifier: `ip:${getClientIp(req)}` };
};

const featureFromPayload = (payload: any) => {
    const hinted = String(payload?.feature || '').trim();
    if (hinted && VOICE_LIMITS.FREE[hinted] !== undefined) return hinted;
    const text = String(payload?.text || '').toLowerCase();
    if (text.includes('host:') || text.includes('guest:')) return 'listen_and_learn_podcast';
    return 'listen_and_learn_voice';
};

const estimateElevenLabsCostKes = (characters: number) => {
    return Number((((characters / 1000) * ELEVENLABS_USD_PER_1000_CHARS) * KES_PER_USD).toFixed(4));
};

const enforceVoiceLimit = async (supabase: any, requester: any, feature: string, characters: number) => {
    const plan = requester.plan || 'FREE';
    const limit = VOICE_LIMITS[plan]?.[feature] ?? VOICE_LIMITS.FREE[feature] ?? 0;
    const creditsNeeded = Math.max(1, Math.ceil(characters / 1000));

    if (limit <= 0 || characters > limit) {
        if (requester.userId) {
            const { data: creditResult, error: creditError } = await supabase.rpc('consume_learning_credits', {
                p_profile_id: requester.userId,
                p_credits: creditsNeeded
            });
            const creditRow = Array.isArray(creditResult) ? creditResult[0] : creditResult;
            if (!creditError && creditRow?.allowed) {
                requester.usedCredit = true;
                requester.creditsRemaining = creditRow.credits_remaining;
                return;
            }
        }
        throw new Response(JSON.stringify({ error: `${feature.replace(/_/g, ' ')} is not included in this plan`, feature, plan, limit }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const query = supabase
        .from('usage_cost_events')
        .select('input_tokens')
        .eq('feature', feature)
        .gte('created_at', since.toISOString());

    if (requester.userId) query.eq('user_id', requester.userId);
    else query.eq('metadata->>identifier', requester.identifier);

    const { data, error } = await query;
    if (error) {
        console.error('Voice limit count failed, allowing request:', error);
        return;
    }

    const used = (data || []).reduce((sum: number, row: any) => sum + (Number(row.input_tokens) || 0), 0);
    if (used + characters > limit) {
        if (requester.userId) {
            const { data: creditResult, error: creditError } = await supabase.rpc('consume_learning_credits', {
                p_profile_id: requester.userId,
                p_credits: creditsNeeded
            });
            const creditRow = Array.isArray(creditResult) ? creditResult[0] : creditResult;
            if (!creditError && creditRow?.allowed) {
                requester.usedCredit = true;
                requester.creditsRemaining = creditRow.credits_remaining;
                return;
            }
        }
        throw new Response(JSON.stringify({
            error: `${feature.replace(/_/g, ' ')} daily limit reached`,
            feature,
            plan,
            limit,
            usageCount: used,
            canBuyCredits: true
        }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
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

        const supabase = getSupabaseAdmin();
        const requester = await resolveRequester(req, supabase);
        if (!requester.userId && !requester.studentCode) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Missing learner session' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            );
        }

        // Parse request body
        const reqBody = await req.json();
        const { voiceId, feature: featureHint, ...elevenLabsPayload } = reqBody;
        if (featureHint) elevenLabsPayload.feature = featureHint;
        const feature = featureFromPayload(elevenLabsPayload);
        delete elevenLabsPayload.feature;
        const characters = String(elevenLabsPayload.text || '').length;

        if (!voiceId || !elevenLabsPayload.text) {
             return new Response(
                 JSON.stringify({ error: 'Bad Request: Missing voiceId or text' }),
                 { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
             );
        }

        try {
            await enforceVoiceLimit(supabase, requester, feature, characters);
        } catch (limitError) {
            if (limitError instanceof Response) return limitError;
            throw limitError;
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

        await supabase.from('usage_cost_events').insert({
            user_id: requester.userId,
            student_code: requester.studentCode,
            plan: requester.plan,
            provider: 'elevenlabs',
            model: elevenLabsPayload.model_id || 'eleven_multilingual_v2',
            feature,
            input_tokens: characters,
            output_tokens: 0,
            estimated_cost_kes: estimateElevenLabsCostKes(characters),
            metadata: {
                identifier: requester.identifier,
                voice_id: voiceId,
                edge_enforced: true,
                used_credit: Boolean(requester.usedCredit),
                credits_remaining: requester.creditsRemaining ?? null,
            }
        });

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
