-- Run only after deploying sync-learning-videos and configuring YOUTUBE_API_KEY.
-- Requires pg_cron and pg_net. Store the same VIDEO_SYNC_SECRET in Edge secrets
-- and Vault (name: video_sync_secret); store project URL as video_sync_project_url.
-- No credentials are embedded in cron.job or this file.
do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name='video_sync_secret' and length(decrypted_secret) >= 32)
     or not exists (select 1 from vault.decrypted_secrets where name='video_sync_project_url' and decrypted_secret like 'https://%.supabase.co') then
    raise exception 'Configure video sync Vault secrets before enabling the schedule';
  end if;
end $$;
select cron.schedule('soma-learning-video-sync', '15 3 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='video_sync_project_url') || '/functions/v1/sync-learning-videos',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='video_sync_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
$$);
-- Daily 06:15 Africa/Nairobi. Re-running replaces the named schedule, not duplicates it.
-- Monitor cron.job_run_details AND net._http_response: dispatch success is not sync success.
