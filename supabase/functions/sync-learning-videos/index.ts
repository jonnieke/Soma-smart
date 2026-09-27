import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { collectVideos, newVideo, metadataUpdate } from '../_shared/youtubeSync.ts';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const authorization = req.headers.get('Authorization') || '';
    const schedulerSecret = Deno.env.get('VIDEO_SYNC_SECRET');
    const scheduled = !!schedulerSecret && authorization === `Bearer ${schedulerSecret}`;
    if (!scheduled) {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authorization } } }
      );
      const { data: auth, error } = await userClient.auth.getUser();
      if (error || !auth.user) return json({ error: 'Administrator sign-in required' }, 401);
      const admin = await userClient.rpc('is_soma_admin');
      if (admin.error || admin.data !== true)
        return json({ error: 'Administrator access required' }, 403);
    }
    const key = Deno.env.get('YOUTUBE_API_KEY');
    if (!key)
      return json(
        { error: 'YouTube sync is not connected yet. Add the server-side YOUTUBE_API_KEY first.' },
        503
      );
    // Fetch all playlists successfully before writing anything, so upstream errors are not treated as removals.
    const videos = await collectVideos(key);
    const client = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    let inserted = 0,
      refreshed = 0;
    for (const video of videos) {
      const insert = await client
        .from('learning_videos')
        .upsert(newVideo(video), { onConflict: 'id', ignoreDuplicates: true })
        .select('id');
      if (insert.error)
        throw new Error('Database sync failed. Retry safely; existing lessons are retained.');
      if (insert.data?.length) inserted++;
      else {
        const update = await client
          .from('learning_videos')
          .update(metadataUpdate(video))
          .eq('id', video.id);
        if (update.error)
          throw new Error('Metadata refresh failed. Retry safely; existing lessons are retained.');
        refreshed++;
      }
    }
    console.info('[video-sync] complete', { inserted, refreshed });
    return json({ inserted, refreshed, completedAt: new Date().toISOString() });
  } catch {
    console.error('[video-sync] failed; check YouTube API access or database availability');
    return json(
      {
        error:
          'Sync could not finish. Check YouTube API access/quota and retry. Existing study materials were not replaced.',
      },
      502
    );
  }
});
