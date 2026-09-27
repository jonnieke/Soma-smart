-- Explicit opt-in only. Existing default-true rows are not proof of consent.
alter table public.notification_preferences
  add column if not exists consent_version text,
  add column if not exists consent_updated_at timestamptz;
alter table public.notification_preferences alter column email_enabled set default false;

create or replace function public.save_my_communication_preferences(
  p_in_app boolean, p_email boolean, p_whatsapp boolean
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in to save communication preferences'; end if;
  if p_in_app is null or p_email is null or p_whatsapp is null then
    raise exception 'All preferences are required';
  end if;
  insert into public.notification_preferences
    (user_id, in_app_enabled, email_enabled, whatsapp_enabled, sms_enabled,
     content_updates_enabled, consent_version, consent_updated_at, updated_at)
  values (auth.uid(), p_in_app, p_email, p_whatsapp, false, true,
          'customer-updates-v1', now(), now())
  on conflict (user_id) do update set
    in_app_enabled = excluded.in_app_enabled, email_enabled = excluded.email_enabled,
    whatsapp_enabled = excluded.whatsapp_enabled, sms_enabled = false,
    content_updates_enabled = true, consent_version = excluded.consent_version,
    consent_updated_at = now(), updated_at = now();
end $$;
revoke all on function public.save_my_communication_preferences(boolean, boolean, boolean) from public, anon;
grant execute on function public.save_my_communication_preferences(boolean, boolean, boolean) to authenticated;
grant select, insert, update on public.notification_preferences to authenticated;

-- Only the authenticated/authorised publisher Edge Function may queue notices.
revoke execute on function public.create_content_notification(text,text,text,text,text,text,text,text,text[],text[],uuid,uuid) from public, anon, authenticated;
grant execute on function public.create_content_notification(text,text,text,text,text,text,text,text,text[],text[],uuid,uuid) to service_role;
