// Supabase Edge Function: Proxies Gemini AI calls so the API key stays server-side.
// The client sends the prompt/model config, this function adds the key and forwards to Google.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BASE_CORS_HEADERS = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-student-code',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
};

const PRODUCTION_ORIGINS = new Set([
    'https://somaai.co.ke',
    'https://www.somaai.co.ke',
]);

const PREVIEW_ORIGINS = new Set(
    String(Deno.env.get('ALLOWED_PREVIEW_ORIGINS') || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean)
);

const isAllowedOrigin = (origin: string | null) => {
    if (!origin) return true;
    if (PRODUCTION_ORIGINS.has(origin)) return true;
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
    return PREVIEW_ORIGINS.has(origin);
};

const corsHeadersFor = (req: Request) => {
    const origin = req.headers.get('Origin');
    return {
        ...BASE_CORS_HEADERS,
        ...(origin && isAllowedOrigin(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    };
};

const envFlag = (name: string) => String(Deno.env.get(name) || '').toLowerCase() === 'true';
const FREE_AI_DAILY_LIMIT = Number(Deno.env.get('FREE_AI_DAILY_LIMIT') || '10');
const GUEST_AI_DAILY_LIMIT = Number(Deno.env.get('GUEST_AI_DAILY_LIMIT') || '3');
const DEFAULT_GEMINI_MODEL = Deno.env.get('DEFAULT_GEMINI_MODEL') || Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
const HEAVY_GEMINI_MODEL = Deno.env.get('HEAVY_GEMINI_MODEL') || DEFAULT_GEMINI_MODEL;
const EMBEDDING_MODEL = Deno.env.get('GEMINI_EMBEDDING_MODEL') || 'gemini-embedding-001';
const MAX_OUTPUT_TOKENS_FREE = Math.max(3000, Number(Deno.env.get('MAX_OUTPUT_TOKENS_FREE') || '3000'));
const MAX_OUTPUT_TOKENS_PAID = Math.max(8000, Number(Deno.env.get('MAX_OUTPUT_TOKENS_PAID') || '8000'));
const MAX_OUTPUT_TOKENS_ADMIN = Math.max(16000, Number(Deno.env.get('MAX_OUTPUT_TOKENS_ADMIN') || '32768'));
const DISABLE_GUEST_AI = envFlag('DISABLE_GUEST_AI');
const DISABLE_AUDIO_GENERATION = envFlag('DISABLE_AUDIO_GENERATION');
const DISABLE_TALK_AND_LEARN = envFlag('DISABLE_TALK_AND_LEARN');
const KES_PER_USD = 130;

const getAdminEmails = () => new Set(
    String(Deno.env.get('ADMIN_EMAILS') || '')
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean)
);

const isAdminEmail = (email: unknown) => {
    const normalized = String(email || '').trim().toLowerCase();
    return Boolean(normalized && getAdminEmails().has(normalized));
};

const FEATURE_LIMITS: Record<string, Record<string, number>> = {
    GUEST: { ai_generation: 3, exam_guru: 1, exam_marking: 0, quiz_generation: 1, practice_generation: 1, notes_generation: 1, notebook_generation: 1, listen_and_learn: 1, talk_and_learn: 1, grounded_library_help: 0, deep_document_analysis: 0, teacher_ai: 0 },
    FREE: { ai_generation: 10, exam_guru: 3, exam_marking: 1, quiz_generation: 3, practice_generation: 3, notes_generation: 3, notebook_generation: 5, listen_and_learn: 3, talk_and_learn: 3, grounded_library_help: 1, deep_document_analysis: 0, teacher_ai: 3 },
    DAILY: { ai_generation: 30, exam_guru: 15, exam_marking: 6, quiz_generation: 10, practice_generation: 12, notes_generation: 10, notebook_generation: 15, listen_and_learn: 10, talk_and_learn: 10, grounded_library_help: 12, deep_document_analysis: 3, teacher_ai: 10 },
    WEEKLY: { ai_generation: 120, exam_guru: 80, exam_marking: 35, quiz_generation: 60, practice_generation: 80, notes_generation: 60, notebook_generation: 80, listen_and_learn: 50, talk_and_learn: 50, grounded_library_help: 70, deep_document_analysis: 18, teacher_ai: 60 },
    MONTHLY: { ai_generation: 450, exam_guru: 300, exam_marking: 150, quiz_generation: 250, practice_generation: 300, notes_generation: 220, notebook_generation: 250, listen_and_learn: 150, talk_and_learn: 150, grounded_library_help: 300, deep_document_analysis: 80, teacher_ai: 220 },
    TERMLY: { ai_generation: 1200, exam_guru: 800, exam_marking: 420, quiz_generation: 700, practice_generation: 850, notes_generation: 650, notebook_generation: 700, listen_and_learn: 500, talk_and_learn: 500, grounded_library_help: 850, deep_document_analysis: 240, teacher_ai: 650 },
    ANNUAL: { ai_generation: 4000, exam_guru: 2500, exam_marking: 1500, quiz_generation: 2200, practice_generation: 2800, notes_generation: 2000, notebook_generation: 2400, listen_and_learn: 1800, talk_and_learn: 1800, grounded_library_help: 3000, deep_document_analysis: 900, teacher_ai: 2000 },
    PRO: { ai_generation: 450, exam_guru: 300, exam_marking: 150, quiz_generation: 250, practice_generation: 300, notes_generation: 220, notebook_generation: 250, listen_and_learn: 150, talk_and_learn: 150, grounded_library_help: 300, deep_document_analysis: 80, teacher_ai: 220 },
};
const MODEL_PRICING_USD_PER_1M: Record<string, { input: number; output: number }> = {
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    'gemini-2.5-flash': { input: 0.30, output: 2.50 },
    default: { input: 0.30, output: 2.50 },
};

function base64url(buffer: Uint8Array): string {
    const bin = Array.from(buffer).map(x => String.fromCharCode(x)).join('');
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getVertexAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = privateKeyPem
        .replace(pemHeader, "")
        .replace(pemFooter, "")
        .replace(/\s/g, "");
    
    const binary = atob(pemContents);
    const der = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        der[i] = binary.charCodeAt(i);
    }

    const key = await crypto.subtle.importKey(
        "pkcs8",
        der,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;
    const header = { alg: "RS256", typ: "JWT" };
    const claim = {
        iss: clientEmail,
        scope: "https://www.googleapis.com/auth/cloud-platform",
        aud: "https://oauth2.googleapis.com/token",
        exp,
        iat
    };

    const encoder = new TextEncoder();
    const encodedHeader = base64url(encoder.encode(JSON.stringify(header)));
    const encodedClaim = base64url(encoder.encode(JSON.stringify(claim)));
    const jwtInput = `${encodedHeader}.${encodedClaim}`;

    const signatureBuffer = await crypto.subtle.sign(
        { name: "RSASSA-PKCS1-v1_5" },
        key,
        encoder.encode(jwtInput)
    );
    const jwt = `${jwtInput}.${base64url(new Uint8Array(signatureBuffer))}`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Google OAuth failed: ${res.status} ${err}`);
    }

    const data = await res.json();
    return data.access_token;
}

const normalizeFeatureHint = (hint: unknown, contents: unknown, systemInstruction: unknown) => {
    const aliases: Record<string, string> = {
        audio_learning: 'listen_and_learn',
        listen_and_learn_voice: 'listen_and_learn',
        listen_and_learn_podcast: 'listen_and_learn',
        conversational_voice: 'talk_and_learn',
    };
    const requested = String(hint || '').trim().toLowerCase();
    const normalized = aliases[requested] || requested;
    if (normalized && FEATURE_LIMITS.FREE[normalized] !== undefined) return normalized;
    return inferAiFeature(contents, systemInstruction);
};

const selectGeminiModel = (feature: string, requestedModel: unknown) => {
    const requested = String(requestedModel || '').trim().toLowerCase();
    if (requested.includes('embedding')) return EMBEDDING_MODEL;
    if (feature === 'deep_document_analysis' || feature === 'exam_marking') return HEAVY_GEMINI_MODEL;
    return DEFAULT_GEMINI_MODEL;
};
const getRequestToken = (req: Request) => {
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('access_token') || url.searchParams.get('token') || '';
    const authHeader = req.headers.get('Authorization') || '';
    const rawToken = (authHeader.replace(/^Bearer\s+/i, '').trim()) || queryToken.trim();
    return (rawToken && rawToken !== 'undefined' && rawToken !== 'null') ? rawToken : '';
};

const getRequestStudentCode = (req: Request) => {
    const url = new URL(req.url);
    const headerCode = req.headers.get('x-student-code')?.trim() || '';
    const queryCode = url.searchParams.get('student_code')?.trim() || '';
    return headerCode || queryCode;
};

const studentCodeVariants = (raw?: string | null): string[] => {
    const cleaned = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!cleaned) return [];
    const digits = cleaned.match(/\d+/)?.[0];
    const variants = new Set<string>([cleaned]);
    if (digits) {
        variants.add(`SOMA-${digits}`);
        variants.add(`SOM-${digits}`);
        variants.add(`SOMA${digits}`);
        variants.add(`SOM${digits}`);
    }
    return Array.from(variants);
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
    if (haystack.includes('rag') || haystack.includes('grounded') || haystack.includes('retrieved context') || haystack.includes('soma library')) return 'grounded_library_help';
    if (haystack.includes('full pdf') || haystack.includes('deep document') || haystack.includes('analyze this document') || haystack.includes('document-grounded')) return 'deep_document_analysis';
    if (haystack.includes('mark the candidate') || haystack.includes('knec chief examiner')) return 'exam_marking';
    if (haystack.includes('exam guru')) return 'exam_guru';
    if (haystack.includes('practice questions') || haystack.includes('generate 3 questions')) return 'practice_generation';
    if (haystack.includes('quiz')) return 'quiz_generation';
    if (haystack.includes('study notes') || haystack.includes('detailed study notes')) return 'notes_generation';
    if (haystack.includes('teacher') || haystack.includes('lesson plan') || haystack.includes('scheme of work')) return 'teacher_ai';
    return 'ai_generation';
};

const creditsForFeature = (feature: string) => {
    if (feature === 'deep_document_analysis') return 2;
    if (feature === 'exam_marking') return 2;
    return 1;
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
    corsHeaders: Record<string, string> = BASE_CORS_HEADERS,
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
    const token = getRequestToken(req);

    // Reject tokens that are literally the string "undefined" or "null" (client bug)

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

    // No valid Supabase JWT � check for learner code (custom session system)
    const studentCode = getRequestStudentCode(req);
    const codeVariants = studentCodeVariants(studentCode);
    if (codeVariants.length > 0) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, subscription_tier, subscription_status, subscription_expiry, expiry')
            .in('student_id', codeVariants)
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
    const token = getRequestToken(req);

    if (token) {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user?.id) {
            const isAdmin = isAdminEmail(userData.user.email);
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, role, subscription_tier, subscription_status, subscription_expiry, expiry, student_id')
                .eq('id', userData.user.id)
                .maybeSingle();
            const { data: creditBal } = await supabase
                .from('learning_credit_balances')
                .select('credits')
                .eq('profile_id', userData.user.id)
                .maybeSingle();
            return {
                userId: userData.user.id,
                studentCode: profile?.student_id || null,
                plan: profile ? effectivePlanForProfile(profile) : 'FREE',
                identifier: `user:${userData.user.id}`,
                profile,
                hasCredits: (creditBal?.credits || 0) > 0,
                isAdmin,
            };
        }
    }

    const studentCode = getRequestStudentCode(req);
    const codeVariants = studentCodeVariants(studentCode);
    if (codeVariants.length > 0) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, subscription_tier, subscription_status, subscription_expiry, expiry, student_id')
            .in('student_id', codeVariants)
            .maybeSingle();
        if (profile) {
            const { data: creditBal } = await supabase
                .from('learning_credit_balances')
                .select('credits')
                .eq('profile_id', profile.id)
                .maybeSingle();
            return {
                userId: profile.id,
                studentCode: profile.student_id || codeVariants[0],
                plan: effectivePlanForProfile(profile),
                identifier: `student:${profile.student_id || codeVariants[0]}`,
                profile,
                hasCredits: (creditBal?.credits || 0) > 0,
                isAdmin: false,
            };
        }
    }

    const identifier = `ip:${getClientIp(req)}`;
    return { userId: null, studentCode: null, plan: 'GUEST', identifier, profile: null, isAdmin: false };
};

const enforceFeatureLimit = async (supabase: any, requester: any, feature: string, corsHeaders: Record<string, string>) => {
    // Verify admin status server-side against the same allowlist used by admin-auth.
    // Costs are still recorded, but operational ingestion is never blocked by learner limits.
    if (requester.isAdmin) return;

    const plan = requester.plan || 'FREE';
    if (plan === 'GUEST' && DISABLE_GUEST_AI) {
        throw limitResponse('GUEST_AI_DISABLED', 'Guest AI is temporarily unavailable. Sign in to continue learning.', { feature, plan }, 900, corsHeaders);
    }
    if (feature === 'listen_and_learn' && DISABLE_AUDIO_GENERATION) {
        throw limitResponse('AUDIO_TEMPORARILY_DISABLED', 'Generated audio is temporarily unavailable. Text learning remains available.', { feature, plan }, 900, corsHeaders);
    }
    if (feature === 'talk_and_learn' && DISABLE_TALK_AND_LEARN) {
        throw limitResponse('TALK_TEMPORARILY_DISABLED', 'Talk & Learn is temporarily unavailable. Ask Akili remains available.', { feature, plan }, 900, corsHeaders);
    }
    const limit = FEATURE_LIMITS[plan]?.[feature] ?? FEATURE_LIMITS.FREE[feature] ?? GUEST_AI_DAILY_LIMIT;
    if (limit <= 0) {
        throw limitResponse('FEATURE_NOT_INCLUDED', `${feature.replace(/_/g, ' ')} is not included in this plan`, {
            feature,
            plan,
            limit,
        }, 86400, corsHeaders);
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
            const creditsNeeded = creditsForFeature(feature);
            const { data: creditResult, error: creditError } = await supabase.rpc('consume_learning_credits', {
                p_profile_id: requester.userId,
                p_credits: creditsNeeded
            });
            const creditRow = Array.isArray(creditResult) ? creditResult[0] : creditResult;
            if (!creditError && creditRow?.allowed) {
                requester.usedCredit = true;
                requester.creditsRemaining = creditRow.credits_remaining;
                requester.creditsUsed = creditsNeeded;
                return;
            }
        }
        throw limitResponse('FEATURE_LIMIT_REACHED', `${feature.replace(/_/g, ' ')} daily limit reached`, {
            feature,
            plan,
            limit,
            usageCount: count || 0,
            canBuyCredits: true
        }, 86400, corsHeaders);
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
                credits_used: requester.creditsUsed ?? 0,
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
    const corsHeaders = corsHeadersFor(req);
    const origin = req.headers.get('Origin');
    if (!isAllowedOrigin(origin)) {
        return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
            status: 403,
            headers: { ...BASE_CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.headers.get("upgrade") === "websocket") {
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            return new Response("GEMINI_API_KEY not configured on server", { status: 500 });
        }

        const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
        
        const googleSocket = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`);
        
        clientSocket.onmessage = (event) => {
            if (googleSocket.readyState === WebSocket.OPEN) {
                googleSocket.send(event.data);
            }
        };
        
        googleSocket.onmessage = (event) => {
            if (clientSocket.readyState === WebSocket.OPEN) {
                clientSocket.send(event.data);
            }
        };
        
        clientSocket.onclose = () => {
            if (googleSocket.readyState === WebSocket.OPEN) googleSocket.close();
        };
        
        googleSocket.onclose = () => {
            if (clientSocket.readyState === WebSocket.OPEN) clientSocket.close();
        };
        
        clientSocket.onerror = (err) => console.error("Client WS Error:", err);
        googleSocket.onerror = (err) => console.error("Google WS Error:", err);

        return response;
    }

    try {
        const GCP_PROJECT_ID = Deno.env.get('GCP_PROJECT_ID');
        const GCP_CLIENT_EMAIL = Deno.env.get('GCP_CLIENT_EMAIL');
        const GCP_PRIVATE_KEY = Deno.env.get('GCP_PRIVATE_KEY');
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

        const url = new URL(req.url);
        const isCacheRequest = url.pathname.endsWith('/cache') || url.pathname.endsWith('/cache/create');

        if (isCacheRequest) {
            if (!GEMINI_API_KEY) {
                return new Response(
                    JSON.stringify({ error: 'GEMINI_API_KEY not configured on server' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
                );
            }
            
            const supabase = getSupabaseAdmin();
            const requester = await resolveRequester(req, supabase);
            if (!requester.userId && !requester.studentCode) {
                return new Response(
                    JSON.stringify({ error: "Unauthorized access" }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
                );
            }

            const body = await req.json();
            const { model, contents, ttl, displayName, systemInstruction } = body;
            const normalizedModel = selectGeminiModel('deep_document_analysis', model);

            const requestBody: Record<string, any> = {
                model: `models/${normalizedModel}`,
                ttl: ttl || "1800s",
            };
            if (contents) requestBody.contents = contents;
            if (displayName) requestBody.displayName = displayName;
            if (systemInstruction) requestBody.systemInstruction = systemInstruction;

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const data = await res.json();
            if (!res.ok) {
                return new Response(
                    JSON.stringify({ error: "Failed to create context cache", details: data }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: res.status }
                );
            }
            return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const useVertex = !!(GCP_PROJECT_ID && GCP_CLIENT_EMAIL && GCP_PRIVATE_KEY);

        if (!useVertex && !GEMINI_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'GCP Service Account or GEMINI_API_KEY not configured on server' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
        }

        const { model, feature: featureHint, contents, generationConfig, systemInstruction, stream, cachedContent } = await req.json();
        const feature = normalizeFeatureHint(featureHint, contents, systemInstruction);
        const normalizedModel = selectGeminiModel(feature, model);
        const supabase = getSupabaseAdmin();
        const requester = await resolveRequester(req, supabase);
        const paidPlan = requester.isAdmin || !['GUEST', 'FREE'].includes(String(requester.plan || 'FREE')) || !!requester.hasCredits;
        const outputTokenCap = requester.isAdmin
            ? MAX_OUTPUT_TOKENS_ADMIN
            : paidPlan ? MAX_OUTPUT_TOKENS_PAID : MAX_OUTPUT_TOKENS_FREE;
        const maxAllowedOutputTokens = requester.isAdmin ? MAX_OUTPUT_TOKENS_ADMIN : MAX_OUTPUT_TOKENS_PAID;
        const requestedOutputTokens = Number(generationConfig?.maxOutputTokens || outputTokenCap);
        const cappedGenerationConfig = {
            ...(generationConfig || {}),
            // Always use at least outputTokenCap (the plan floor) regardless of what the client requests.
            // This prevents low client-side maxOutputTokens values (e.g. 2048) from truncating responses.
            maxOutputTokens: Math.max(
                outputTokenCap,
                Number.isFinite(requestedOutputTokens) ? Math.min(requestedOutputTokens, maxAllowedOutputTokens) : outputTokenCap
            ),
        };

        if (!contents) {
            return new Response(
                JSON.stringify({ error: 'Missing required field: contents' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        try {
            await enforceFeatureLimit(supabase, requester, feature, corsHeaders);
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
        let urlTarget;
        let geminiBody: Record<string, unknown> = {};
        const requestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

        if (useVertex) {
            const region = Deno.env.get('GCP_REGION') || 'us-central1';
            const cleanKey = GCP_PRIVATE_KEY!.replace(/\\n/g, '\n');
            const token = await getVertexAccessToken(GCP_CLIENT_EMAIL!, cleanKey);
            requestHeaders['Authorization'] = `Bearer ${token}`;

            if (normalizedModel.includes('embedding')) {
                urlTarget = `https://${region}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${region}/publishers/google/models/${normalizedModel}:embedContent`;
                geminiBody = { content: normalizedContents[0] };
            } else {
                const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
                urlTarget = `https://${region}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${region}/publishers/google/models/${normalizedModel}:${endpoint}`;
                geminiBody = { contents: normalizedContents };
                geminiBody.generationConfig = cappedGenerationConfig;
                if (systemInstruction) geminiBody.systemInstruction = systemInstruction;
                if (cachedContent) geminiBody.cachedContent = cachedContent;
            }
        } else {
            if (normalizedModel.includes('embedding')) {
                urlTarget = `https://generativelanguage.googleapis.com/v1beta/models/${normalizedModel}:embedContent?key=${GEMINI_API_KEY}`;
                geminiBody = { content: normalizedContents[0] };
            } else {
                const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
                urlTarget = `https://generativelanguage.googleapis.com/v1beta/models/${normalizedModel}:${endpoint}?key=${GEMINI_API_KEY}`;
                geminiBody = { contents: normalizedContents };
                geminiBody.generationConfig = cappedGenerationConfig;
                if (systemInstruction) geminiBody.systemInstruction = systemInstruction;
                if (cachedContent) geminiBody.cachedContent = cachedContent;
            }
        }

        const geminiRes = await fetch(urlTarget, {
            method: 'POST',
            headers: requestHeaders,
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
