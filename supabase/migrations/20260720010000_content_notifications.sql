-- Notification engine for newly published notes, exam papers, and classroom posts.
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists parent_phone text;
alter table public.profiles add column if not exists parent_whatsapp_consent_at timestamptz;
alter table public.profiles add column if not exists grade text;
alter table public.profiles add column if not exists role text;

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  source_table text not null,
  source_id text not null,
  item_type text not null,
  title text not null,
  body text not null,
  grade text,
  subject text,
  action_url text,
  target_roles text[] not null default array['LEARNER','TEACHER']::text[],
  target_class_id uuid,
  channels text[] not null default array['IN_APP']::text[],
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(source_table, source_id, item_type)
);

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.notification_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  item_type text not null,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);

create table if not exists public.notification_delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.notification_events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  channel text not null check (channel in ('EMAIL','SMS','WHATSAPP')),
  recipient text not null,
  title text not null,
  body text not null,
  action_url text,
  status text not null default 'PENDING' check (status in ('PENDING','SENT','SKIPPED','FAILED')),
  provider text,
  provider_message_id text,
  error text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  whatsapp_enabled boolean not null default false,
  content_updates_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);
create index if not exists notification_delivery_jobs_status_idx
  on public.notification_delivery_jobs (status, channel, created_at);
create index if not exists notification_events_source_idx
  on public.notification_events (source_table, source_id, item_type);

alter table public.notification_events enable row level security;
alter table public.user_notifications enable row level security;
alter table public.notification_delivery_jobs enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "Users read own notifications" on public.user_notifications;
create policy "Users read own notifications" on public.user_notifications
  for select using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on public.user_notifications;
create policy "Users update own notifications" on public.user_notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own notification preferences" on public.notification_preferences;
create policy "Users read own notification preferences" on public.notification_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "Users upsert own notification preferences" on public.notification_preferences;
create policy "Users upsert own notification preferences" on public.notification_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.create_content_notification(
  p_source_table text,
  p_source_id text,
  p_item_type text,
  p_title text,
  p_body text,
  p_grade text default null,
  p_subject text default null,
  p_action_url text default null,
  p_target_roles text[] default array['LEARNER','TEACHER']::text[],
  p_channels text[] default array['IN_APP']::text[],
  p_target_class_id uuid default null,
  p_created_by uuid default null
)
returns table (
  event_id uuid,
  in_app_count integer,
  delivery_job_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_in_app_count integer := 0;
  v_delivery_count integer := 0;
begin
  insert into public.notification_events (
    source_table, source_id, item_type, title, body, grade, subject, action_url,
    target_roles, target_class_id, channels, created_by
  ) values (
    p_source_table, p_source_id, upper(p_item_type), p_title, p_body, p_grade, p_subject, p_action_url,
    coalesce(p_target_roles, array['LEARNER','TEACHER']::text[]), p_target_class_id,
    coalesce(p_channels, array['IN_APP']::text[]), p_created_by
  )
  on conflict (source_table, source_id, item_type) do update set
    title = excluded.title,
    body = excluded.body,
    grade = excluded.grade,
    subject = excluded.subject,
    action_url = excluded.action_url,
    target_roles = excluded.target_roles,
    target_class_id = excluded.target_class_id,
    channels = excluded.channels
  returning id into v_event_id;

  with target_users as (
    select distinct p.id, p.role, p.email, p.phone, p.parent_phone, p.parent_whatsapp_consent_at
    from public.profiles p
    where coalesce(p.role, '') = any(coalesce(p_target_roles, array['LEARNER','TEACHER']::text[]))
      and coalesce((select np.content_updates_enabled from public.notification_preferences np where np.user_id = p.id), true)
      and (
        p_target_class_id is null
        or exists (
          select 1 from public.class_members cm
          where cm.class_id = p_target_class_id
            and cm.student_id = p.id
        )
      )
      and (
        p_target_class_id is not null
        or p_grade is null
        or p_grade = ''
        or coalesce(p.grade, '') = ''
        or lower(coalesce(p.grade, '')) = lower(p_grade)
        or coalesce(p.role, '') = 'TEACHER'
      )
  ), inserted_in_app as (
    insert into public.user_notifications (event_id, user_id, title, body, item_type, action_url)
    select v_event_id, tu.id, p_title, p_body, upper(p_item_type), p_action_url
    from target_users tu
    where 'IN_APP' = any(coalesce(p_channels, array['IN_APP']::text[]))
      and coalesce((select np.in_app_enabled from public.notification_preferences np where np.user_id = tu.id), true)
    on conflict (event_id, user_id) do nothing
    returning id
  )
  select count(*)::integer into v_in_app_count from inserted_in_app;

  with target_users as (
    select distinct p.id, p.role, p.email, p.phone, p.parent_phone, p.parent_whatsapp_consent_at
    from public.profiles p
    where coalesce(p.role, '') = any(coalesce(p_target_roles, array['LEARNER','TEACHER']::text[]))
      and coalesce((select np.content_updates_enabled from public.notification_preferences np where np.user_id = p.id), true)
      and (
        p_target_class_id is null
        or exists (
          select 1 from public.class_members cm
          where cm.class_id = p_target_class_id
            and cm.student_id = p.id
        )
      )
      and (
        p_target_class_id is not null
        or p_grade is null
        or p_grade = ''
        or coalesce(p.grade, '') = ''
        or lower(coalesce(p.grade, '')) = lower(p_grade)
        or coalesce(p.role, '') = 'TEACHER'
      )
  ), delivery_rows as (
    select tu.id as user_id, 'EMAIL'::text as channel, nullif(trim(coalesce(tu.email, '')), '') as recipient
    from target_users tu
    where 'EMAIL' = any(coalesce(p_channels, array[]::text[]))
      and coalesce((select np.email_enabled from public.notification_preferences np where np.user_id = tu.id), true)
    union all
    select tu.id, 'SMS', nullif(trim(coalesce(tu.phone, tu.parent_phone, '')), '')
    from target_users tu
    where 'SMS' = any(coalesce(p_channels, array[]::text[]))
      and coalesce((select np.sms_enabled from public.notification_preferences np where np.user_id = tu.id), false)
    union all
    select tu.id, 'WHATSAPP', nullif(trim(coalesce(tu.phone, tu.parent_phone, '')), '')
    from target_users tu
    where 'WHATSAPP' = any(coalesce(p_channels, array[]::text[]))
      and (
        coalesce((select np.whatsapp_enabled from public.notification_preferences np where np.user_id = tu.id), false)
        or tu.parent_whatsapp_consent_at is not null
      )
  ), inserted_jobs as (
    insert into public.notification_delivery_jobs (event_id, user_id, channel, recipient, title, body, action_url)
    select v_event_id, dr.user_id, dr.channel, dr.recipient, p_title, p_body, p_action_url
    from delivery_rows dr
    where dr.recipient is not null
    returning id
  )
  select count(*)::integer into v_delivery_count from inserted_jobs;

  return query select v_event_id, v_in_app_count, v_delivery_count;
end;
$$;

revoke all on function public.create_content_notification(text, text, text, text, text, text, text, text, text[], text[], uuid, uuid) from public;
grant execute on function public.create_content_notification(text, text, text, text, text, text, text, text, text[], text[], uuid, uuid) to authenticated, anon;

create or replace function public.get_my_notifications(p_limit integer default 20)
returns table (
  id uuid,
  title text,
  body text,
  item_type text,
  action_url text,
  read_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select n.id, n.title, n.body, n.item_type, n.action_url, n.read_at, n.created_at
  from public.user_notifications n
  where n.user_id = auth.uid()
  order by n.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

grant execute on function public.get_my_notifications(integer) to authenticated;
