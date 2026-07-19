-- Add exam body metadata for public exam paper bank filtering.
alter table public.knowledge_base
  add column if not exists exam_body text;

update public.knowledge_base
set exam_body = case
  when nullif(trim(coalesce(exam_body, '')), '') is not null then exam_body
  when upper(coalesce(source, '')) in ('SOMA', 'STRUCTURED_IMPORT') then 'SomaAI'
  when exam_type in ('KCSE', 'KPSEA', 'KJSEA') then 'KNEC'
  else null
end
where type = 'PAST_PAPER';

create index if not exists knowledge_base_exam_body_idx
  on public.knowledge_base (exam_body)
  where type = 'PAST_PAPER';

drop function if exists public.list_exam_paper_bank(text, text);
drop function if exists public.list_exam_paper_bank(text, text, text);

create or replace function public.list_exam_paper_bank(
  p_grade text default null,
  p_subject text default null,
  p_exam_body text default null
)
returns table (
  id bigint,
  title text,
  subject text,
  grade text,
  exam_body text,
  exam_type text,
  exam_year integer,
  paper_number text,
  duration_minutes integer,
  total_marks integer,
  source text,
  homepage_featured boolean,
  has_exam_paper boolean,
  has_marking_scheme boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    kb.id,
    kb.title,
    kb.subject,
    kb.grade,
    kb.exam_body,
    kb.exam_type,
    kb.exam_year,
    kb.paper_number,
    kb.duration_minutes,
    kb.total_marks,
    kb.source,
    coalesce(kb.homepage_featured, false),
    (nullif(trim(coalesce(kb.file_url, '')), '') is not null
      or nullif(trim(coalesce(kb.file_path, '')), '') is not null),
    (nullif(trim(coalesce(kb.marking_scheme_url, '')), '') is not null
      or nullif(trim(coalesce(kb.marking_scheme_path, '')), '') is not null),
    kb.created_at
  from public.knowledge_base kb
  where kb.type = 'PAST_PAPER'
    and kb.review_status = 'PUBLISHED'
    and (p_grade is null or kb.grade = p_grade)
    and (p_subject is null or kb.subject = p_subject)
    and (p_exam_body is null or kb.exam_body = p_exam_body)
    and (
      nullif(trim(coalesce(kb.file_url, '')), '') is not null
      or nullif(trim(coalesce(kb.file_path, '')), '') is not null
    )
    and (
      nullif(trim(coalesce(kb.marking_scheme_url, '')), '') is not null
      or nullif(trim(coalesce(kb.marking_scheme_path, '')), '') is not null
    )
  order by coalesce(kb.homepage_featured, false) desc, kb.created_at desc;
$$;

revoke all on function public.list_exam_paper_bank(text, text, text) from public;
grant execute on function public.list_exam_paper_bank(text, text, text) to anon, authenticated;
