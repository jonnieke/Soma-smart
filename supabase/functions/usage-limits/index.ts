import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BASE_CORS_HEADERS = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
};

const PRODUCTION_ORIGINS = new Set(['https://somaai.co.ke', 'https://www.somaai.co.ke']);

const PREVIEW_ORIGINS = new Set(
    String(Deno.env.get('ALLOWED_PREVIEW_ORIGINS') || '').split(',').map(o => o.trim()).filter(Boolean)
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

type UsageType = 'learner' | 'revision' | 'download' | 'teacher';

const usageColumns: Record<UsageType, string> = {
    learner: 'usage_learner',
    revision: 'usage_revision',
    download: 'usage_download',
    teacher: 'usage_teacher'
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeadersFor(req) });
    }

    try {
        const url = new URL(req.url);
        if (!url.pathname.toLowerCase().endsWith('/increment')) {
            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' }
            });
        }

        const authHeader = req.headers.get('Authorization') || '';
        const token = authHeader.replace(/^Bearer\s+/i, '');
        if (!token) {
            return new Response(JSON.stringify({ error: 'Authentication required' }), {
                status: 401,
                headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' }
            });
        }

        const { type } = await req.json() as { type?: UsageType };
        if (!type || !usageColumns[type]) {
            return new Response(JSON.stringify({ error: 'Invalid usage type' }), {
                status: 400,
                headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' }
            });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) {
            return new Response(JSON.stringify({ error: 'Invalid session' }), {
                status: 401,
                headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' }
            });
        }

        const today = new Date().toISOString().slice(0, 10);
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('usage_date, usage_learner, usage_revision, usage_download, usage_teacher')
            .eq('id', userData.user.id)
            .single();

        if (profileError || !profile) {
            return new Response(JSON.stringify({ error: 'Profile not found' }), {
                status: 404,
                headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' }
            });
        }

        const shouldReset = profile.usage_date !== today;
        const baseCounts = {
            usage_learner: shouldReset ? 0 : Number(profile.usage_learner || 0),
            usage_revision: shouldReset ? 0 : Number(profile.usage_revision || 0),
            usage_download: shouldReset ? 0 : Number(profile.usage_download || 0),
            usage_teacher: shouldReset ? 0 : Number(profile.usage_teacher || 0)
        };

        const targetColumn = usageColumns[type];
        const nextCounts = {
            ...baseCounts,
            [targetColumn]: baseCounts[targetColumn as keyof typeof baseCounts] + 1
        };

        const { data: updated, error: updateError } = await supabase
            .from('profiles')
            .update({ ...nextCounts, usage_date: today })
            .eq('id', userData.user.id)
            .select('usage_learner, usage_revision, usage_download, usage_teacher')
            .single();

        if (updateError) {
            throw updateError;
        }

        return new Response(JSON.stringify({ counts: updated }), {
            headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' }
        });
    }
});
