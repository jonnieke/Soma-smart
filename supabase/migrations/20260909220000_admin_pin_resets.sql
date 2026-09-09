create table if not exists public.admin_pin_resets (id uuid primary key default gen_random_uuid(), learner_id uuid not null references public.profiles(id) on delete cascade, admin_id uuid not null references auth.users(id) on delete restrict, student_id text, created_at timestamptz not null default now());
alter table public.admin_pin_resets enable row level security;
revoke all on public.admin_pin_resets from anon, authenticated;
