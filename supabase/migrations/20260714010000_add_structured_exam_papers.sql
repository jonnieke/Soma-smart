-- Store paired exam papers, marking schemes, and reviewed structured questions.
alter table if exists public.knowledge_base
  add column if not exists marking_scheme_url text,
  add column if not exists marking_scheme_path text,
  add column if not exists exam_type text,
  add column if not exists exam_year integer,
  add column if not exists paper_code text,
  add column if not exists paper_number text,
  add column if not exists duration_minutes integer,
  add column if not exists total_marks integer,
  add column if not exists structured_questions jsonb default '[]'::jsonb,
  add column if not exists exam_instructions jsonb default '[]'::jsonb,
  add column if not exists marking_scheme_source text default 'AI_DRAFT',
  add column if not exists review_status text default 'PUBLISHED';

alter table if exists public.knowledge_base
  drop constraint if exists knowledge_base_exam_type_check,
  add constraint knowledge_base_exam_type_check
    check (exam_type is null or exam_type in ('KCSE', 'KPSEA', 'KJSEA', 'OTHER')),
  drop constraint if exists knowledge_base_marking_scheme_source_check,
  add constraint knowledge_base_marking_scheme_source_check
    check (marking_scheme_source in ('OFFICIAL', 'AI_DRAFT')),
  drop constraint if exists knowledge_base_review_status_check,
  add constraint knowledge_base_review_status_check
    check (review_status in ('DRAFT', 'PUBLISHED')),
  drop constraint if exists knowledge_base_exam_year_check,
  add constraint knowledge_base_exam_year_check
    check (exam_year is null or exam_year between 1980 and 2100),
  drop constraint if exists knowledge_base_duration_check,
  add constraint knowledge_base_duration_check
    check (duration_minutes is null or duration_minutes > 0),
  drop constraint if exists knowledge_base_total_marks_check,
  add constraint knowledge_base_total_marks_check
    check (total_marks is null or total_marks >= 0);

create index if not exists idx_knowledge_base_exam_catalog
  on public.knowledge_base (exam_type, exam_year, subject, paper_number, review_status)
  where type = 'PAST_PAPER';

comment on column public.knowledge_base.structured_questions is
  'Reviewed question objects extracted from the paper and paired to marking-scheme points.';
comment on column public.knowledge_base.marking_scheme_source is
  'OFFICIAL when a marking-scheme file was supplied; otherwise AI_DRAFT.';