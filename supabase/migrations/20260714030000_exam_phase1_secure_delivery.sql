-- Phase 1: secure exam delivery and attempt persistence
create extension if not exists pgcrypto;

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id bigint not null references public.knowledge_base(id) on delete cascade,
  learner_id text not null,
  mode text not null,
  status text not null default 'IN_PROGRESS',
  started_at timestamptz not null default timezone('utc'::text, now()),
  submitted_at timestamptz,
  duration_seconds integer,
  score numeric,
  maximum_marks numeric,
  percentage numeric,
  selected_questions jsonb not null default '[]'::jsonb,
  weak_topics jsonb not null default '[]'::jsonb,
  strong_topics jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.exam_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  question_id text not null,
  answer_text text,
  answer_data jsonb,
  working_image_path text,
  time_spent_seconds integer not null default 0,
  marks_awarded numeric,
  marks_available numeric,
  marking_breakdown jsonb,
  error_code text,
  error_tags jsonb not null default '[]'::jsonb,
  marking_status text not null default 'PENDING',
  marked_by text,
  saved_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique(attempt_id, question_id)
);

create index if not exists idx_exam_attempts_learner_exam
  on public.exam_attempts (learner_id, exam_id, started_at desc);

create index if not exists idx_exam_responses_attempt
  on public.exam_responses (attempt_id, saved_at desc);

create or replace function public._public_exam_questions(raw_questions jsonb)
returns jsonb
language sql
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'id', elem.q->'id',
          'number', elem.q->'number',
          'text', elem.q->'text',
          'topic', elem.q->'topic',
          'section', elem.q->'section',
          'subStrand', elem.q->'subStrand',
          'competency', elem.q->'competency',
          'cognitiveLevel', elem.q->'cognitiveLevel',
          'marks', elem.q->'marks',
          'diagramUrl', elem.q->'diagramUrl',
          'questionType', elem.q->'questionType'
        )
      )
      order by elem.ordinality
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(coalesce(raw_questions, '[]'::jsonb)) with ordinality as elem(q, ordinality);
$$;

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
  order by kb.created_at desc;
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

create or replace function public.start_exam_attempt_secure(
  p_exam_id bigint,
  p_learner_id text,
  p_mode text,
  p_selected_questions jsonb default '[]'::jsonb
)
returns public.exam_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  new_attempt public.exam_attempts;
begin
  insert into public.exam_attempts (exam_id, learner_id, mode, selected_questions)
  values (p_exam_id, p_learner_id, p_mode, coalesce(p_selected_questions, '[]'::jsonb))
  returning * into new_attempt;

  return new_attempt;
end;
$$;

create or replace function public.save_exam_response_secure(
  p_attempt_id uuid,
  p_question_id text,
  p_answer_text text default null,
  p_answer_data jsonb default null,
  p_working_image_path text default null,
  p_time_spent_seconds integer default 0
)
returns public.exam_responses
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_response public.exam_responses;
begin
  insert into public.exam_responses (
    attempt_id,
    question_id,
    answer_text,
    answer_data,
    working_image_path,
    time_spent_seconds
  )
  values (
    p_attempt_id,
    p_question_id,
    p_answer_text,
    p_answer_data,
    p_working_image_path,
    greatest(coalesce(p_time_spent_seconds, 0), 0)
  )
  on conflict (attempt_id, question_id)
  do update set
    answer_text = excluded.answer_text,
    answer_data = excluded.answer_data,
    working_image_path = excluded.working_image_path,
    time_spent_seconds = excluded.time_spent_seconds,
    updated_at = timezone('utc'::text, now())
  returning * into saved_response;

  return saved_response;
end;
$$;

create or replace function public.submit_exam_attempt_secure(
  p_attempt_id uuid,
  p_duration_seconds integer default null
)
returns public.exam_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  submitted_attempt public.exam_attempts;
begin
  update public.exam_attempts
  set
    status = 'SUBMITTED',
    submitted_at = timezone('utc'::text, now()),
    duration_seconds = coalesce(p_duration_seconds, duration_seconds),
    updated_at = timezone('utc'::text, now())
  where id = p_attempt_id
  returning * into submitted_attempt;

  return submitted_attempt;
end;
$$;

create or replace function public.get_exam_attempt_secure(p_attempt_id uuid)
returns table (
  id uuid,
  exam_id bigint,
  learner_id text,
  mode text,
  status text,
  started_at timestamptz,
  submitted_at timestamptz,
  duration_seconds integer,
  score numeric,
  maximum_marks numeric,
  percentage numeric,
  selected_questions jsonb,
  weak_topics jsonb,
  strong_topics jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
as $$
  select
    ea.id,
    ea.exam_id,
    ea.learner_id,
    ea.mode,
    ea.status,
    ea.started_at,
    ea.submitted_at,
    ea.duration_seconds,
    ea.score,
    ea.maximum_marks,
    ea.percentage,
    ea.selected_questions,
    ea.weak_topics,
    ea.strong_topics,
    ea.created_at,
    ea.updated_at
  from public.exam_attempts ea
  where ea.id = p_attempt_id;
$$;