create table public.learning_videos (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{11}$'),
  title text not null check (length(title) between 1 and 200),
  subject text not null, level text not null, duration text not null default '',
  description text not null default '', notes text not null default '',
  terms jsonb not null default '[]' check (jsonb_typeof(terms) = 'array'),
  quiz jsonb not null default '[]' check (jsonb_typeof(quiz) = 'array'),
  transcript text not null default '' check (length(transcript) <= 100000),
  source_note text not null default '', published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.learning_videos enable row level security;
revoke all on public.learning_videos from anon, authenticated;
grant select on public.learning_videos to anon, authenticated;
grant insert, update on public.learning_videos to authenticated;
create policy video_public_read on public.learning_videos for select to anon, authenticated
  using (published or (select public.is_soma_admin()));
create policy video_admin_insert on public.learning_videos for insert to authenticated
  with check ((select public.is_soma_admin()));
create policy video_admin_update on public.learning_videos for update to authenticated
  using ((select public.is_soma_admin())) with check ((select public.is_soma_admin()));

create schema if not exists video_hub_private;
create table video_hub_private.ratings (
  video_id text references public.learning_videos(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  primary key(video_id, user_id)
);
alter table video_hub_private.ratings enable row level security;
revoke all on video_hub_private.ratings from public, anon, authenticated;
-- The private definer writes only for the verified caller; clients cannot supply an owner.
create function video_hub_private.rate(p_video text, p_stars integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'Sign in to rate a video';
  end if;
  if p_stars is null or p_stars not between 1 and 5 then raise exception 'Invalid rating'; end if;
  if not exists(select 1 from public.learning_videos where id=p_video and published) then
    raise exception 'Video unavailable';
  end if;
  insert into video_hub_private.ratings(video_id,user_id,stars) values(p_video,auth.uid(),p_stars)
  on conflict(video_id,user_id) do update set stars=excluded.stars;
end $$;
-- Deliberately public aggregate only: never return individual users or their votes.
create function video_hub_private.summary(p_video text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('average', round(avg(r.stars),1), 'count', count(*))
  from video_hub_private.ratings r join public.learning_videos v on v.id=r.video_id
  where r.video_id=p_video and v.published;
$$;
revoke all on function video_hub_private.rate(text,integer) from public;
revoke all on function video_hub_private.summary(text) from public;
grant usage on schema video_hub_private to anon, authenticated;
grant execute on function video_hub_private.rate(text,integer) to authenticated;
grant execute on function video_hub_private.summary(text) to anon, authenticated;
create function public.rate_learning_video(p_video text,p_stars integer) returns void
language sql security invoker set search_path = '' as $$ select video_hub_private.rate(p_video,p_stars); $$;
create function public.learning_video_rating_summary(p_video text) returns jsonb
language sql stable security invoker set search_path = '' as $$ select video_hub_private.summary(p_video); $$;
revoke all on function public.rate_learning_video(text,integer) from public,anon;
grant execute on function public.rate_learning_video(text,integer) to authenticated;
revoke all on function public.learning_video_rating_summary(text) from public;
grant execute on function public.learning_video_rating_summary(text) to anon,authenticated;
