alter table if exists public.knowledge_base
  add column if not exists homepage_featured boolean not null default false;

create index if not exists idx_knowledge_base_homepage_featured
  on public.knowledge_base (homepage_featured desc, created_at desc)
  where type = 'PAST_PAPER' and review_status = 'PUBLISHED';

create or replace function public.list_published_exams(
  p_grade text default null,
  p_subject text default null
)
returns table (
  id bigint,
  title text,
  grade text,
  subject text,
  type text,
  source text,
  is_official boolean,
  homepage_featured boolean,
  rating numeric,
  download_count integer,
  created_at timestamptz,
  indexing_status text,
  indexed_at timestamptz,
  chunk_count integer,
  last_index_error text,
  exam_type text,
  exam_year integer,
  paper_code text,
  paper_number text,
  duration_minutes integer,
  total_marks integer,
  structured_questions jsonb,
  exam_instructions jsonb,
  marking_scheme_source text,
  review_status text
)
language sql
stable
as $$
  select
    kb.id,
    kb.title,
    kb.grade,
    kb.subject,
    kb.type,
    kb.source,
    kb.is_official,
    coalesce(kb.homepage_featured, false) as homepage_featured,
    null::numeric as rating,
    null::integer as download_count,
    kb.created_at,
    kb.indexing_status,
    kb.indexed_at,
    kb.chunk_count,
    kb.last_index_error,
    kb.exam_type,
    kb.exam_year,
    kb.paper_code,
    kb.paper_number,
    kb.duration_minutes,
    kb.total_marks,
    public._public_exam_questions(kb.structured_questions) as structured_questions,
    kb.exam_instructions,
    kb.marking_scheme_source,
    kb.review_status
  from public.knowledge_base kb
  where kb.type = 'PAST_PAPER'
    and kb.review_status = 'PUBLISHED'
    and (p_grade is null or kb.grade = p_grade)
    and (p_subject is null or kb.subject = p_subject)
  order by coalesce(kb.homepage_featured, false) desc, kb.created_at desc;
$$;

create or replace function public.get_exam_for_attempt(p_exam_id bigint)
returns table (
  id bigint,
  title text,
  grade text,
  subject text,
  type text,
  source text,
  is_official boolean,
  homepage_featured boolean,
  rating numeric,
  download_count integer,
  created_at timestamptz,
  indexing_status text,
  indexed_at timestamptz,
  chunk_count integer,
  last_index_error text,
  exam_type text,
  exam_year integer,
  paper_code text,
  paper_number text,
  duration_minutes integer,
  total_marks integer,
  structured_questions jsonb,
  exam_instructions jsonb,
  marking_scheme_source text,
  review_status text
)
language sql
stable
as $$
  select
    kb.id,
    kb.title,
    kb.grade,
    kb.subject,
    kb.type,
    kb.source,
    kb.is_official,
    coalesce(kb.homepage_featured, false) as homepage_featured,
    null::numeric as rating,
    null::integer as download_count,
    kb.created_at,
    kb.indexing_status,
    kb.indexed_at,
    kb.chunk_count,
    kb.last_index_error,
    kb.exam_type,
    kb.exam_year,
    kb.paper_code,
    kb.paper_number,
    kb.duration_minutes,
    kb.total_marks,
    public._public_exam_questions(kb.structured_questions) as structured_questions,
    kb.exam_instructions,
    kb.marking_scheme_source,
    kb.review_status
  from public.knowledge_base kb
  where kb.id = p_exam_id
    and kb.type = 'PAST_PAPER'
    and kb.review_status = 'PUBLISHED';
$$;
