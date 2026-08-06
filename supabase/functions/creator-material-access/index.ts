import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const service = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
  try {
    const { materialId, asset = 'PREVIEW' } = await req.json();
    if (!materialId) return json({ error: 'materialId is required' }, 400);
    const { data: material, error } = await service.from('creator_materials').select('id,creator_id,status,source_file_path,preview_file_path,marking_scheme_path').eq('id', materialId).single();
    if (error || !material || material.status !== 'PUBLISHED') return json({ error: 'Published material not found' }, 404);

    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: authData } = token ? await service.auth.getUser(token) : { data: { user: null } };
    const userId = authData?.user?.id || null;
    let authorized = asset === 'PREVIEW' && Boolean(material.preview_file_path);
    if (!authorized && userId) {
      if (userId === material.creator_id) authorized = true;
      else {
        const { data: entitlement } = await service.from('material_entitlements').select('id').eq('material_id', material.id).eq('buyer_id', userId).eq('access_status', 'ACTIVE').maybeSingle();
        authorized = Boolean(entitlement);
      }
    }
    if (!authorized) return json({ error: asset === 'PREVIEW' ? 'A free preview is not available.' : 'Purchase this material to open it.' }, 403);

    const path = asset === 'MARKING_SCHEME' ? material.marking_scheme_path : asset === 'SOURCE' ? material.source_file_path : material.preview_file_path;
    if (!path) return json({ error: 'This file is not attached.' }, 404);
    const { data: signed, error: signedError } = await service.storage.from('creator-materials').createSignedUrl(path, 900);
    if (signedError) throw signedError;
    return json({ url: signed.signedUrl, expiresIn: 900 });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
});
