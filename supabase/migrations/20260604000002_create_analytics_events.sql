create extension if not exists pgcrypto;

create table if not exists public.analytics_events (
    id uuid primary key default gen_random_uuid(),
    event_type text not null,
    event_name text not null,
    path text,
    previous_path text,
    user_id uuid references auth.users(id) on delete set null,
    role text,
    session_id text,
    referrer text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at desc);
create index if not exists idx_analytics_events_event_type on public.analytics_events(event_type);
create index if not exists idx_analytics_events_event_name on public.analytics_events(event_name);
create index if not exists idx_analytics_events_path on public.analytics_events(path);
create index if not exists idx_analytics_events_user_id on public.analytics_events(user_id);
create index if not exists idx_analytics_events_session_id on public.analytics_events(session_id);

alter table public.analytics_events enable row level security;

drop policy if exists "Allow analytics event inserts" on public.analytics_events;
create policy "Allow analytics event inserts"
on public.analytics_events
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated users can read analytics events" on public.analytics_events;
create policy "Authenticated users can read analytics events"
on public.analytics_events
for select
to authenticated
using (true);
