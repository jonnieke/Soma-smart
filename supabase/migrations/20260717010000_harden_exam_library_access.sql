-- Learners may read and share the published question paper, but never receive
-- marking schemes, private storage paths, model answers, or marking points.

drop policy if exists "Public Access" on public.knowledge_base;
drop policy if exists "Admin Full Access" on public.knowledge_base;
drop policy if exists "Authenticated users can read knowledge base" on public.knowledge_base;
drop policy if exists "Anyone can read knowledge base" on public.knowledge_base;
drop policy if exists "Authenticated users can insert knowledge base" on public.knowledge_base;
drop policy if exists "Authenticated users can update knowledge base" on public.knowledge_base;
drop policy if exists "Authenticated users can delete knowledge base" on public.knowledge_base;
drop policy if exists "Published curriculum documents are readable" on public.knowledge_base;
drop policy if exists "Platform admins manage curriculum documents" on public.knowledge_base;

create policy "Published curriculum documents are readable"
  on public.knowledge_base
  for select
  to anon, authenticated
  using (
    type <> 'PAST_PAPER'
    and (review_status is null or review_status = 'PUBLISHED')
  );

create policy "Platform admins manage curriculum documents"
  on public.knowledge_base
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and upper(coalesce(p.role::text, '')) = 'ADMIN'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and upper(coalesce(p.role::text, '')) = 'ADMIN'
    )
  );

create or replace function public._public_exam_questions(raw_questions jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_strip_nulls(
        jsonb_build_object(
          'id', elem.q->'id',
          'number', elem.q->'number',
          'orderIndex', elem.q->'orderIndex',
          'text', elem.q->'text',
          'topic', elem.q->'topic',
          'section', elem.q->'section',
          'subStrand', elem.q->'subStrand',
          'competency', elem.q->'competency',
          'cognitiveLevel', elem.q->'cognitiveLevel',
          'marks', elem.q->'marks',
          'diagramUrl', coalesce(elem.q->'diagramUrl', elem.q->'diagram_url'),
          'questionType', elem.q->'questionType',
          'options', elem.q->'options',
          'answerFormat', jsonb_strip_nulls(jsonb_build_object(
            'options', coalesce(
              elem.q#>'{answerFormat,options}',
              elem.q#>'{answer_format,options}'
            )
          ))
        )
      )
      order by elem.ordinality
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(coalesce(raw_questions, '[]'::jsonb))
    with ordinality as elem(q, ordinality);
$$;

drop function if exists public.list_published_exams(text, text);

create function public.list_published_exams(
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
  file_url text,
  file_path text,
  marking_scheme_url text,
  marking_scheme_path text,
  homepage_featured boolean,
  created_at timestamptz,
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
security definer
set search_path = public
as $$
  select kb.id, kb.title, kb.grade, kb.subject, kb.type, kb.source,
    kb.is_official, kb.file_url, kb.file_path, kb.marking_scheme_url, kb.marking_scheme_path, coalesce(kb.homepage_featured, false),
    kb.created_at, kb.exam_type, kb.exam_year, kb.paper_code, kb.paper_number,
    kb.duration_minutes, kb.total_marks,
    public._public_exam_questions(kb.structured_questions),
    kb.exam_instructions, kb.marking_scheme_source, kb.review_status
  from public.knowledge_base kb
  where kb.type = 'PAST_PAPER'
    and kb.review_status = 'PUBLISHED'
    and (p_grade is null or kb.grade = p_grade)
    and (p_subject is null or kb.subject = p_subject)
  order by coalesce(kb.homepage_featured, false) desc, kb.created_at desc;
$$;

drop function if exists public.get_exam_for_attempt(bigint);

create function public.get_exam_for_attempt(p_exam_id bigint)
returns table (
  id bigint,
  title text,
  grade text,
  subject text,
  type text,
  source text,
  is_official boolean,
  file_url text,
  file_path text,
  marking_scheme_url text,
  marking_scheme_path text,
  homepage_featured boolean,
  created_at timestamptz,
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
security definer
set search_path = public
as $$
  select kb.id, kb.title, kb.grade, kb.subject, kb.type, kb.source,
    kb.is_official, kb.file_url, kb.file_path, kb.marking_scheme_url, kb.marking_scheme_path, coalesce(kb.homepage_featured, false),
    kb.created_at, kb.exam_type, kb.exam_year, kb.paper_code, kb.paper_number,
    kb.duration_minutes, kb.total_marks,
    public._public_exam_questions(kb.structured_questions),
    kb.exam_instructions, kb.marking_scheme_source, kb.review_status
  from public.knowledge_base kb
  where kb.id = p_exam_id
    and kb.type = 'PAST_PAPER'
    and kb.review_status = 'PUBLISHED';
$$;

revoke all on function public.list_published_exams(text, text) from public;
revoke all on function public.get_exam_for_attempt(bigint) from public;
grant execute on function public.list_published_exams(text, text) to anon, authenticated;
grant execute on function public.get_exam_for_attempt(bigint) to anon, authenticated;
