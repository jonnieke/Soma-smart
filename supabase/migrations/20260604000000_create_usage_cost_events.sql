create table if not exists public.usage_cost_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  student_code text,
  plan text,
  provider text not null default 'other',
  model text not null default 'unknown',
  feature text not null default 'unknown',
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_kes numeric(12, 4) not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_usage_cost_events_created_at on public.usage_cost_events(created_at desc);
create index if not exists idx_usage_cost_events_feature on public.usage_cost_events(feature);
create index if not exists idx_usage_cost_events_user_id on public.usage_cost_events(user_id);
create index if not exists idx_usage_cost_events_student_code on public.usage_cost_events(student_code);

alter table public.usage_cost_events enable row level security;

drop policy if exists "Allow usage cost inserts" on public.usage_cost_events;
create policy "Allow usage cost inserts"
  on public.usage_cost_events
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can read usage costs" on public.usage_cost_events;
create policy "Admins can read usage costs"
  on public.usage_cost_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and upper(coalesce(p.role::text, '')) in ('ADMIN', 'SUPER_ADMIN')
    )
  );
