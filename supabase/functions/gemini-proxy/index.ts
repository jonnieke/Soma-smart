// Supabase Edge Function: Proxies Gemini AI calls so the API key stays server-side.
// The client sends the prompt/model config, this function adds the key and forwards to Google.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-student-code',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const FREE_AI_DAILY_LIMIT = Number(Deno.env.get('FREE_AI_DAILY_LIMIT') || '25');  // Registered free users
const GUEST_AI_DAILY_LIMIT = Number(Deno.env.get('GUEST_AI_DAILY_LIMIT') || '3');  // Unregistered guests
const DEFAULT_GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
const KES_PER_USD = 130;

const FEATURE_LIMITS: Record<string, Record<string, number>> = {
    // Unauthenticated visitors — enough to demo the product, not enough to replace a plan
    GUEST: { ai_generation: 5, exam_guru: 1, exam_marking: 0, quiz_generation: 1, practice_generation: 1, notes_generation: 1, teacher_ai: 0 },
    // Registered free users — enough to feel real value and hit a natural upgrade moment
    FREE: { ai_generation: 10, exam_guru: 3, exam_marking: 1, quiz_generation: 3, practice_generation: 3, notes_generation: 3, teacher_ai: 3 },
    // Paid tiers — always clearly more than FREE so the upgrade makes sense
    DAILY: { ai_generation: 30, exam_guru: 15, exam_marking: 6, quiz_generation: 10, practice_generation: 12, notes_generation: 10, teacher_ai: 10 },
    WEEKLY: { ai_generation: 120, exam_guru: 80, exam_marking: 35, quiz_generation: 60, practice_generation: 80, notes_generation: 60, teacher_ai: 60 },
    MONTHLY: { ai_generation: 450, exam_guru: 300, exam_marking: 150, quiz_generation: 250, practice_generation: 300, notes_generation: 220, teacher_ai: 220 },
    TERMLY: { ai_generation: 1200, exam_guru: 800, exam_marking: 420, quiz_generation: 700, practice_generation: 850, notes_generation: 650, teacher_ai: 650 },
    ANNUAL: { ai_generation: 4000, exam_guru: 2500, exam_marking: 1500, quiz_generation: 2200, practice_generation: 2800, notes_generation: 2000, teacher_ai: 2000 },
    PRO: { ai_generation: 450, exam_guru: 300, exam_marking: 150, quiz_generation: 250, practice_generation: 300, notes_generation: 220, teacher_ai: 220 },
};

const MODEL_PRICING_USD_PER_1M: Record<string, { input: number; output: number }> = {
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    'gemini-2.5-flash': { input: 0.30, output: 2.50 },
    default: { input: 0.30, output: 2.50 },
};

const normalizeGeminiModel = (model: string) => {
    const requested = String(model || '').trim();
    if (!requested) return requested;

    // Older deployed clients can still request retired Gemini aliases. Keep the
    // proxy compatible so cached browser chunks do not break learner sessions.
    const retiredAliases = new Set([
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-2.0-flash',
    ]);

    return retiredAliases.has(requested) ? DEFAULT_GEMINI_MODEL : requested;
};

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

const effectivePlanForProfile = (profile: any) => {
    const tier = String(profile?.subscription_tier || profile?.subscription_status || 'FREE').toUpperCase();
    if (!tier || tier === 'TRIAL') return 'FREE';
    if (tier !== 'FREE') {
        const expiry = profile?.subscription_expiry || profile?.expiry;
        if (!expiry || new Date(expiry).getTime() > Date.now()) return tier;
    }
    return 'FREE';
};

const roughlyCountTokens = (value: unknown) => {
    try {
        const text = typeof value === 'string' ? value : JSON.stringify(value);
        return Math.max(1, Math.ceil((text || '').length / 4));
    } catch {
        return 1;
    }
};

const inferAiFeature = (contents: unknown, systemInstruction: unknown) => {
    const haystack = `${JSON.stringify(systemInstruction || {})} ${JSON.stringify(contents || {})}`.toLowerCase();
    if (haystack.includes('mark the candidate') || haystack.includes('knec chief examiner')) return 'exam_marking';
    if (haystack.includes('exam guru')) return 'exam_guru';
    if (haystack.includes('practice questions') || haystack.includes('generate 3 questions')) return 'practice_generation';
    if (haystack.includes('quiz')) return 'quiz_generation';
    if (haystack.includes('study notes') || haystack.includes('detailed study notes')) return 'notes_generation';
    if (haystack.includes('teacher') || haystack.includes('lesson plan') || haystack.includes('scheme of work')) return 'teacher_ai';
    return 'ai_generation';
};

const estimateGeminiCostKes = (model: string, inputTokens = 0, outputTokens = 0) => {
    const normalized = String(model || '').toLowerCase();
    const key = Object.keys(MODEL_PRICING_USD_PER_1M).find(k => normalized.includes(k)) || 'default';
    const pricing = MODEL_PRICING_USD_PER_1M[key];
    const usd = ((inputTokens / 1_000_000) * pricing.input) + ((outputTokens / 1_000_000) * pricing.output);
    return Number((usd * KES_PER_USD).toFixed(4));
};

const firstRpcRow = (data: any) => {
    if (Array.isArray(data)) return data[0];
    return data;
};

const limitResponse = (
    code: string,
    message: string,
    extra: Record<string, unknown> = {},
    retryAfterSeconds = 300,
) => new Response(JSON.stringify({
    error: message,
    code,
    retryAfterSeconds,
    ...extra,
}), {
    status: 429,
    headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
    }
});

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
                throw limitResponse('PLAN_LIMIT_REACHED', 'Daily free AI limit reached', {
                    limit: FREE_AI_DAILY_LIMIT,
                    usageCount: usage?.usage_count ?? FREE_AI_DAILY_LIMIT
                }, 86400);
            }

            return; // Authenticated, within limit — allow
        }
    }

    // No valid Supabase JWT — check for SOMA-XXXX learner code (custom session system)
    const studentCode = req.headers.get('x-student-code')?.trim();
    if (studentCode && studentCode.startsWith('SOMA-')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, subscription_tier, subscription_status, subscription_expiry, expiry')
            .eq('student_id', studentCode)
            .maybeSingle();

        if (profile) {
            if (isActivePro(profile)) return; // Pro learner: unlimited

            const { data: usageResult, error: usageError } = await supabase.rpc('increment_profile_ai_usage', {
                p_profile_id: profile.id,
                p_usage_kind: 'learner',
                p_limit: FREE_AI_DAILY_LIMIT
            });

            if (usageError) {
                console.error('Student code usage RPC failed — allowing call:', usageError);
                return; // Fail open rather than blocking a registered learner
            }

            const usage = firstRpcRow(usageResult);
            if (!usage?.allowed) {
                throw limitResponse('PLAN_LIMIT_REACHED', 'Daily free AI limit reached', {
                    limit: FREE_AI_DAILY_LIMIT,
                    usageCount: usage?.usage_count ?? FREE_AI_DAILY_LIMIT
                }, 86400);
            }

            return; // Registered learner, within limit — allow
        }
        // Code not found in DB — fall through to guest IP limiter
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
        throw limitResponse('GUEST_LIMIT_REACHED', 'Daily guest AI limit reached', {
            limit: GUEST_AI_DAILY_LIMIT,
            usageCount: guestUsage?.usage_count ?? GUEST_AI_DAILY_LIMIT
        }, 86400);
    }
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
                profile,
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
                profile,
            };
        }
    }

    const identifier = `ip:${getClientIp(req)}`;
    return { userId: null, studentCode: null, plan: 'GUEST', identifier, profile: null };
};

const enforceFeatureLimit = async (supabase: any, requester: any, feature: string) => {
    const plan = requester.plan || 'FREE';
    const limit = FEATURE_LIMITS[plan]?.[feature] ?? FEATURE_LIMITS.FREE[feature] ?? GUEST_AI_DAILY_LIMIT;
    if (limit <= 0) {
        throw limitResponse('FEATURE_NOT_INCLUDED', `${feature.replace(/_/g, ' ')} is not included in this plan`, {
            feature,
            plan,
            limit,
        }, 86400);
    }

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const query = supabase
        .from('usage_cost_events')
        .select('id', { count: 'exact', head: true })
        .eq('feature', feature)
        .gte('created_at', since.toISOString());

    if (requester.userId) query.eq('user_id', requester.userId);
    else query.eq('metadata->>identifier', requester.identifier);

    const { count, error } = await query;
    if (error) {
        console.error('Feature limit count failed, falling back to legacy limiter:', error);
        return;
    }

    if ((count || 0) >= limit) {
        if (requester.userId) {
            const { data: creditResult, error: creditError } = await supabase.rpc('consume_learning_credits', {
                p_profile_id: requester.userId,
                p_credits: 1
            });
            const creditRow = Array.isArray(creditResult) ? creditResult[0] : creditResult;
            if (!creditError && creditRow?.allowed) {
                requester.usedCredit = true;
                requester.creditsRemaining = creditRow.credits_remaining;
                return;
            }
        }
        throw limitResponse('FEATURE_LIMIT_REACHED', `${feature.replace(/_/g, ' ')} daily limit reached`, {
            feature,
            plan,
            limit,
            usageCount: count || 0,
            canBuyCredits: true
        }, 86400);
    }
};

const recordGeminiUsageCost = async (
    supabase: any,
    requester: any,
    model: string,
    feature: string,
    contents: unknown,
    systemInstruction: unknown,
    rawResponse: any,
) => {
    try {
        const usage = rawResponse?.usageMetadata || {};
        const inputTokens = Number(usage.promptTokenCount || usage.inputTokenCount || roughlyCountTokens({ contents, systemInstruction }));
        const outputText = rawResponse?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('\n') || '';
        const outputTokens = Number(usage.candidatesTokenCount || usage.outputTokenCount || roughlyCountTokens(outputText));
        await supabase.from('usage_cost_events').insert({
            user_id: requester.userId,
            student_code: requester.studentCode,
            plan: requester.plan,
            provider: 'gemini',
            model,
            feature,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            estimated_cost_kes: estimateGeminiCostKes(model, inputTokens, outputTokens),
            metadata: {
                identifier: requester.identifier,
                edge_enforced: true,
                used_credit: Boolean(requester.usedCredit),
                credits_remaining: requester.creditsRemaining ?? null,
                total_tokens: usage.totalTokenCount || inputTokens + outputTokens,
                local_estimate: !rawResponse?.usageMetadata,
            }
        });
    } catch (error) {
        console.error('Usage cost insert failed:', error);
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
        const normalizedModel = normalizeGeminiModel(model);
        const feature = inferAiFeature(contents, systemInstruction);
        const supabase = getSupabaseAdmin();
        const requester = await resolveRequester(req, supabase);

        if (!contents || !normalizedModel) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: model, contents' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        try {
            await enforceFeatureLimit(supabase, requester, feature);
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

        if (normalizedModel.includes('embedding')) {
            // For embeddings, use embedContent endpoint
            geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${normalizedModel}:embedContent?key=${GEMINI_API_KEY}`;
            geminiBody = { content: normalizedContents[0] }; // Embeddings take a single content object
        } else {
            // For generation, use generateContent or streamGenerateContent endpoint
            const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
            geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${normalizedModel}:${endpoint}?key=${GEMINI_API_KEY}`;
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
            if (geminiRes.status === 429) {
                return limitResponse('SYSTEM_BUSY', 'Akili is temporarily busy. Please try again in a few minutes.', {
                    details: errText,
                }, 300);
            }
            return new Response(
                JSON.stringify({ error: 'Gemini API request failed', details: errText }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: geminiRes.status }
            );
        }

        // Handle streaming response
        if (stream) {
            await recordGeminiUsageCost(supabase, requester, normalizedModel, feature, contents, systemInstruction, {
                usageMetadata: {
                    promptTokenCount: roughlyCountTokens({ contents, systemInstruction }),
                    candidatesTokenCount: 0,
                }
            });
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
        await recordGeminiUsageCost(supabase, requester, normalizedModel, feature, contents, systemInstruction, data);

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
