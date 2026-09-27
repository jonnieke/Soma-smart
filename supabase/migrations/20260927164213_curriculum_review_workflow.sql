-- Editorial queue only. Never use this table as a public curriculum catalogue.
-- Filename aligned with the version assigned by the remote migration service.
create table public.curriculum_mapping_reviews (
  id text primary key,
  source_id text not null check (source_id in ('kicd-regular-grade6-mathematics','kicd-regular-grade9-mathematics')),
  title text not null check (length(trim(title)) between 1 and 200),
  viewer_page integer not null,
  printed_page text not null check (length(trim(printed_page)) between 1 and 20),
  summaries jsonb not null,
  author_id uuid not null references auth.users(id),
  reviewer_id uuid references auth.users(id),
  status text not null default 'draft' check (status in ('draft','in_review','changes_requested','approved')),
  review_note text not null default '' check (length(review_note) <= 4000),
  reviewed_at timestamptz,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reviewer_id is null or reviewer_id <> author_id),
  check (viewer_page between 1 and case when source_id='kicd-regular-grade6-mathematics' then 57 else 69 end),
  check (jsonb_typeof(summaries)='array' and jsonb_array_length(summaries) between 1 and 20)
);
create index curriculum_review_assignee on public.curriculum_mapping_reviews(reviewer_id, status);
alter table public.curriculum_mapping_reviews enable row level security;
revoke all on public.curriculum_mapping_reviews from anon, authenticated;
grant select, insert, update on public.curriculum_mapping_reviews to authenticated;
create policy curriculum_review_read on public.curriculum_mapping_reviews for select to authenticated
 using ((select public.is_soma_admin()) or reviewer_id=(select auth.uid()));
create policy curriculum_review_create on public.curriculum_mapping_reviews for insert to authenticated
 with check ((select public.is_soma_admin()) and author_id=(select auth.uid()));
create policy curriculum_review_update on public.curriculum_mapping_reviews for update to authenticated
 using ((select public.is_soma_admin()) or reviewer_id=(select auth.uid()))
 with check ((select public.is_soma_admin()) or reviewer_id=(select auth.uid()));

create function public.guard_curriculum_mapping_review() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare item jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  for item in select value from jsonb_array_elements(new.summaries) loop
    if jsonb_typeof(item) <> 'string' or length(trim(item #>> '{}')) not between 1 and 1000 then
      raise exception 'Summaries must be non-empty text, at most 1000 characters each';
    end if;
  end loop;
  if tg_op='INSERT' then
    if not public.is_soma_admin() or new.author_id <> auth.uid() then raise exception 'Admin author required'; end if;
    if new.status <> 'draft' or new.reviewer_id is not null or new.review_note <> '' or new.reviewed_at is not null then
      raise exception 'New mappings must be unassigned drafts';
    end if;
    new.revision := 1; new.created_at := now();
  else
    if new.id <> old.id or new.author_id <> old.author_id or new.source_id <> old.source_id or new.created_at <> old.created_at then
      raise exception 'Mapping identity is immutable';
    end if;
    if old.status='approved' then raise exception 'Approved mappings are immutable; create a new draft version'; end if;
    if old.status='in_review' then
      if auth.uid() is distinct from old.reviewer_id then raise exception 'Only the assigned reviewer can decide'; end if;
      if new.status not in ('approved','changes_requested') or length(trim(new.review_note))=0 then
        raise exception 'A review decision and note are required';
      end if;
      if new.title <> old.title or new.summaries <> old.summaries or new.viewer_page <> old.viewer_page or new.printed_page <> old.printed_page or new.reviewer_id is distinct from old.reviewer_id then
        raise exception 'Reviewers cannot change the submitted mapping';
      end if;
      new.reviewed_at := now();
    else
      if not public.is_soma_admin() then raise exception 'Only admins may edit and assign drafts'; end if;
      if new.status not in ('draft','in_review') then raise exception 'Submit for review before approval'; end if;
      if new.status='in_review' and (new.reviewer_id is null or new.reviewer_id=auth.uid()) then
        raise exception 'Assign a different reviewer';
      end if;
      new.review_note := ''; new.reviewed_at := null;
    end if;
    new.revision := old.revision + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.guard_curriculum_mapping_review() from public, anon, authenticated;
create trigger guard_curriculum_mapping_review before insert or update on public.curriculum_mapping_reviews
 for each row execute function public.guard_curriculum_mapping_review();
