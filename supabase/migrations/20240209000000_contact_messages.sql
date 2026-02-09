create table if not exists public.contact_messages (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    contact text not null,
    message text not null,
    status text default 'NEW',
    -- NEW, READ, ARCHIVED
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.contact_messages enable row level security;
-- Drop existing policies to ensure idempotency
drop policy if exists "Allow public insert" on public.contact_messages;
drop policy if exists "Allow service role to view" on public.contact_messages;
-- Allow anyone to insert (public form)
create policy "Allow public insert" on public.contact_messages for
insert with check (true);
-- Only allow authenticated users (admins/service role) to view
create policy "Allow service role to view" on public.contact_messages for
select using (auth.role() = 'service_role');