import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const admins = () => new Set(String(Deno.env.get('ADMIN_EMAILS') || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean));
serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const client = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
    const { data: auth, error: authError } = await client.auth.getUser(token);
    if (authError || !auth.user?.email || !admins().has(auth.user.email.toLowerCase())) return json({ error: 'Admin authorization required' }, 403);
    const learnerId = String((await req.json())?.learnerId || '').trim();
    const { data: learner } = await client.from('profiles').select('id, role, student_id').eq('id', learnerId).maybeSingle();
    if (!learner || !['LEARNER', 'REVISION'].includes(String(learner.role).toUpperCase())) return json({ error: 'Learner account not found' }, 404);
    const bytes = new Uint32Array(1); crypto.getRandomValues(bytes); const pin = String(1000 + (bytes[0] % 9000));
    const { error } = await client.from('profiles').update({ recovery_pin: pin, session_id: null, active_sessions: [] }).eq('id', learner.id);
    if (error) return json({ error: 'PIN reset could not be saved' }, 500);
    const audit = await client.from('admin_pin_resets').insert({ learner_id: learner.id, admin_id: auth.user.id, student_id: learner.student_id });
    if (audit.error) return json({ error: 'PIN reset audit could not be recorded' }, 500);
    return json({ studentId: learner.student_id, temporaryPin: pin });
  } catch { return json({ error: 'Invalid reset request' }, 400); }
});
