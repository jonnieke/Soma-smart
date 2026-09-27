create table public.learning_video_generations (
 id uuid primary key,
 video_id text not null check(video_id ~ '^[A-Za-z0-9_-]{11}$'),
 owner_id uuid not null default auth.uid() references auth.users(id),
 kind text not null check(kind in ('transcript','study')),
 input jsonb not null,
 result text,
 status text not null default 'pending' check(status in ('pending','complete','failed')),
 model text not null,
 usage jsonb,
 created_at timestamptz not null default now()
);
alter table public.learning_video_generations enable row level security;
revoke all on public.learning_video_generations from anon,authenticated;
grant select,insert,update on public.learning_video_generations to authenticated;
create policy video_generations_read on public.learning_video_generations for select to authenticated
 using ((select public.is_soma_admin()) and owner_id=(select auth.uid()));
create policy video_generations_insert on public.learning_video_generations for insert to authenticated
 with check ((select public.is_soma_admin()) and owner_id=(select auth.uid()));
create policy video_generations_update on public.learning_video_generations for update to authenticated
 using ((select public.is_soma_admin()) and owner_id=(select auth.uid()))
 with check ((select public.is_soma_admin()) and owner_id=(select auth.uid()));
create index video_generations_owner_created on public.learning_video_generations(owner_id,created_at desc);
