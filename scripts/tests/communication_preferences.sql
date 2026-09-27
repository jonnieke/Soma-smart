-- Disposable local PostgreSQL only, after curriculum_review_bootstrap.sql.
create role service_role;
-- Signature-only fixture for the existing publisher RPC; test its grants below.
create function public.create_content_notification(text,text,text,text,text,text,text,text,text[],text[],uuid,uuid)
returns void language sql security definer as $$ select $$;
create table public.profiles (id uuid primary key);
insert into public.profiles select id from auth.users;
create table public.notification_preferences (
 user_id uuid primary key references public.profiles(id),
 in_app_enabled boolean not null default true, email_enabled boolean not null default true,
 sms_enabled boolean not null default false, whatsapp_enabled boolean not null default false,
 content_updates_enabled boolean not null default true,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.notification_preferences enable row level security;
create policy own_preferences on public.notification_preferences for all to authenticated
 using (auth.uid() = user_id) with check (auth.uid() = user_id);
\i /tmp/preferences-migration.sql
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.save_my_communication_preferences(true,true,false);
select pg_temp.assert_true((select email_enabled and consent_version='customer-updates-v1' and consent_updated_at is not null from public.notification_preferences),'explicit consent saved');
select public.save_my_communication_preferences(false,false,false);
select pg_temp.assert_true((select not email_enabled and not whatsapp_enabled and not in_app_enabled from public.notification_preferences),'opt-out saved');
select pg_temp.assert_true((select count(*)=1 from public.notification_preferences),'retries update one row');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select pg_temp.assert_true((select count(*)=0 from public.notification_preferences),'other user cannot read');
select pg_temp.expect_error($q$insert into public.notification_preferences(user_id) values ('00000000-0000-0000-0000-000000000001')$q$,'other user cannot insert preference');
reset role;
set role anon;
select pg_temp.expect_error('select public.save_my_communication_preferences(true,true,true)','anonymous cannot save');
reset role;
select pg_temp.assert_true((select prosecdef=false from pg_proc where proname='save_my_communication_preferences'),'save does not bypass RLS');
select pg_temp.assert_true(not has_function_privilege('anon','public.create_content_notification(text,text,text,text,text,text,text,text,text[],text[],uuid,uuid)','EXECUTE'),'anonymous cannot queue notifications');
select pg_temp.assert_true(not has_function_privilege('authenticated','public.create_content_notification(text,text,text,text,text,text,text,text,text[],text[],uuid,uuid)','EXECUTE'),'signed-in users cannot bypass publisher authorization');
select pg_temp.assert_true(has_function_privilege('service_role','public.create_content_notification(text,text,text,text,text,text,text,text,text[],text[],uuid,uuid)','EXECUTE'),'backend can queue authorized notifications');
