-- Bind every persisted exam attempt to a verified learner session.

alter table public.exam_attempts enable row level security;
alter table public.exam_responses enable row level security;

drop policy if exists "Direct exam attempt access" on public.exam_attempts;
drop policy if exists "Direct exam response access" on public.exam_responses;

create or replace function public._learner_session_allowed(
  p_learner_id text,
  p_pin text default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_learner_id is not null
    and length(trim(p_learner_id)) > 0
    and (
      exists (
        select 1
        from public.profiles p
        where auth.uid() is not null
          and p.id = auth.uid()
          and (p.id::text = p_learner_id or p.student_id = p_learner_id)
      )
      or exists (
        select 1
        from public.profiles p
        where p.student_id = p_learner_id
          and p.recovery_pin is not null
          and p.recovery_pin = coalesce(p_pin, '')
      )
    );
$$;

drop function if exists public.start_exam_attempt_secure(bigint, text, text, jsonb);
drop function if exists public.save_exam_response_secure(uuid, text, text, jsonb, text, integer);
drop function if exists public.submit_exam_attempt_secure(uuid, integer);
drop function if exists public.get_exam_attempt_secure(uuid);

create function public.start_exam_attempt_secure(
  p_exam_id bigint,
  p_learner_id text,
  p_mode text,
  p_selected_questions jsonb default '[]'::jsonb,
  p_pin text default null
)
returns public.exam_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.exam_attempts;
begin
  if not public._learner_session_allowed(p_learner_id, p_pin) then
    raise exception 'A verified learner session is required';
  end if;

  if not exists (
    select 1
    from public.knowledge_base kb
    where kb.id = p_exam_id
      and kb.type = 'PAST_PAPER'
      and kb.review_status = 'PUBLISHED'
  ) then
    raise exception 'This exam is not available';
  end if;

  insert into public.exam_attempts (exam_id, learner_id, mode, selected_questions)
  values (
    p_exam_id,
    p_learner_id,
    coalesce(nullif(trim(p_mode), ''), 'PRACTICE'),
    coalesce(p_selected_questions, '[]'::jsonb)
  )
  returning * into v_attempt;

  return v_attempt;
end;
$$;

create function public.save_exam_response_secure(
  p_attempt_id uuid,
  p_question_id text,
  p_answer_text text default null,
  p_answer_data jsonb default null,
  p_working_image_path text default null,
  p_time_spent_seconds integer default 0,
  p_pin text default null
)
returns public.exam_responses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.exam_attempts;
  v_response public.exam_responses;
begin
  select * into v_attempt
  from public.exam_attempts
  where id = p_attempt_id;

  if v_attempt.id is null
    or not public._learner_session_allowed(v_attempt.learner_id, p_pin) then
    raise exception 'This attempt does not belong to the current learner';
  end if;

  if v_attempt.status <> 'IN_PROGRESS' then
    raise exception 'This attempt has already been submitted';
  end if;

  if not exists (
    select 1
    from public.knowledge_base kb,
      jsonb_array_elements(coalesce(kb.structured_questions, '[]'::jsonb)) q
    where kb.id = v_attempt.exam_id
      and (
        q->>'id' = p_question_id
        or q->>'number' = p_question_id
      )
  ) then
    raise exception 'Question does not belong to this exam';
  end if;

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
  returning * into v_response;

  return v_response;
end;
$$;

create function public.submit_exam_attempt_secure(
  p_attempt_id uuid,
  p_duration_seconds integer default null,
  p_pin text default null
)
returns public.exam_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.exam_attempts;
  v_score numeric := 0;
  v_maximum numeric := 0;
begin
  select * into v_attempt
  from public.exam_attempts
  where id = p_attempt_id;

  if v_attempt.id is null
    or not public._learner_session_allowed(v_attempt.learner_id, p_pin) then
    raise exception 'This attempt does not belong to the current learner';
  end if;

  select coalesce(sum(er.marks_awarded), 0)
  into v_score
  from public.exam_responses er
  where er.attempt_id = p_attempt_id;

  select coalesce(sum(coalesce((q->>'marks')::numeric, 0)), 0)
  into v_maximum
  from public.knowledge_base kb,
    jsonb_array_elements(coalesce(kb.structured_questions, '[]'::jsonb)) q
  where kb.id = v_attempt.exam_id
    and v_attempt.selected_questions ? coalesce(q->>'id', q->>'number');

  if v_maximum <= 0 then
    select coalesce(sum(er.marks_available), 0) into v_maximum
    from public.exam_responses er where er.attempt_id = p_attempt_id;
  end if;

  update public.exam_attempts
  set
    status = 'SUBMITTED',
    submitted_at = coalesce(submitted_at, timezone('utc'::text, now())),
    duration_seconds = coalesce(p_duration_seconds, duration_seconds),
    score = v_score,
    maximum_marks = v_maximum,
    percentage = case when v_maximum > 0 then round((v_score / v_maximum) * 100, 2) else 0 end,
    updated_at = timezone('utc'::text, now())
  where id = p_attempt_id
  returning * into v_attempt;

  return v_attempt;
end;
$$;

create function public.get_exam_attempt_secure(
  p_attempt_id uuid,
  p_pin text default null
)
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
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_learner_id text;
begin
  select ea.learner_id into v_learner_id
  from public.exam_attempts ea
  where ea.id = p_attempt_id;

  if v_learner_id is null
    or not public._learner_session_allowed(v_learner_id, p_pin) then
    return;
  end if;

  return query
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
end;
$$;

revoke all on function public._learner_session_allowed(text, text) from public;
revoke all on function public.start_exam_attempt_secure(bigint, text, text, jsonb, text) from public;
revoke all on function public.save_exam_response_secure(uuid, text, text, jsonb, text, integer, text) from public;
revoke all on function public.submit_exam_attempt_secure(uuid, integer, text) from public;
revoke all on function public.get_exam_attempt_secure(uuid, text) from public;

grant execute on function public.start_exam_attempt_secure(bigint, text, text, jsonb, text) to anon, authenticated;
grant execute on function public.save_exam_response_secure(uuid, text, text, jsonb, text, integer, text) to anon, authenticated;
grant execute on function public.submit_exam_attempt_secure(uuid, integer, text) to anon, authenticated;
grant execute on function public.get_exam_attempt_secure(uuid, text) to anon, authenticated;
