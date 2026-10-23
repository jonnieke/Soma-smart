-- Candidate revision progress (exam date, weak topics, study days), stored per learner.
-- Access is only through the two RPCs below, which verify the learner session
-- (signed-in account, or student code + PIN) via public._learner_session_allowed.

create table if not exists public.candidate_study_progress (
  learner_id text primary key,
  exam_date date,
  weak jsonb not null default '{}'::jsonb,
  practised_days jsonb not null default '[]'::jsonb,
  practised_count integer not null default 0 check (practised_count >= 0),
  client_updated_at bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.candidate_study_progress enable row level security;
revoke all on table public.candidate_study_progress from anon, authenticated;

create or replace function public._candidate_progress_json(r public.candidate_study_progress)
returns jsonb language sql immutable set search_path = public as $$
  select jsonb_build_object(
    'examDate', r.exam_date,
    'weak', r.weak,
    'practisedDays', r.practised_days,
    'practisedCount', r.practised_count,
    'updatedAt', r.client_updated_at
  );
$$;

create or replace function public.get_candidate_progress(
  p_learner_id text,
  p_pin text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_row public.candidate_study_progress;
begin
  if not public._learner_session_allowed(p_learner_id, p_pin) then
    raise exception 'A verified learner session is required';
  end if;
  select * into v_row from public.candidate_study_progress where learner_id = p_learner_id;
  if v_row.learner_id is null then return null; end if;
  return public._candidate_progress_json(v_row);
end $$;

create or replace function public.save_candidate_progress(
  p_learner_id text,
  p_exam_date date,
  p_weak jsonb,
  p_practised_days jsonb,
  p_practised_count integer,
  p_client_updated_at bigint,
  p_pin text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_row public.candidate_study_progress;
  v_key text;
  v_val jsonb;
  v_day jsonb;
begin
  if not public._learner_session_allowed(p_learner_id, p_pin) then
    raise exception 'A verified learner session is required';
  end if;

  p_weak := coalesce(p_weak, '{}'::jsonb);
  p_practised_days := coalesce(p_practised_days, '[]'::jsonb);
  if jsonb_typeof(p_weak) <> 'object' or jsonb_typeof(p_practised_days) <> 'array' then
    raise exception 'Invalid progress data';
  end if;
  if (select count(*) from jsonb_object_keys(p_weak)) > 200
     or jsonb_array_length(p_practised_days) > 120 then
    raise exception 'Progress data is too large';
  end if;
  for v_key, v_val in select * from jsonb_each(p_weak) loop
    if length(v_key) > 200 or jsonb_typeof(v_val) <> 'number'
       or (v_val)::numeric < 1 or (v_val)::numeric > 99 then
      raise exception 'Invalid weak-topic entry';
    end if;
  end loop;
  for v_day in select * from jsonb_array_elements(p_practised_days) loop
    if jsonb_typeof(v_day) <> 'string' or (v_day #>> '{}') !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'Invalid study day';
    end if;
  end loop;
  if p_exam_date is not null and (p_exam_date < date '2020-01-01' or p_exam_date > date '2035-12-31') then
    raise exception 'Exam date is out of range';
  end if;

  insert into public.candidate_study_progress as c
    (learner_id, exam_date, weak, practised_days, practised_count, client_updated_at, updated_at)
  values
    (p_learner_id, p_exam_date, p_weak, p_practised_days,
     greatest(coalesce(p_practised_count, 0), 0), coalesce(p_client_updated_at, 0), now())
  on conflict (learner_id) do update set
    -- A stale device can never overwrite newer data.
    exam_date = case when excluded.client_updated_at >= c.client_updated_at then excluded.exam_date else c.exam_date end,
    weak = case when excluded.client_updated_at >= c.client_updated_at then excluded.weak else c.weak end,
    practised_days = case when excluded.client_updated_at >= c.client_updated_at then excluded.practised_days else c.practised_days end,
    practised_count = greatest(c.practised_count, excluded.practised_count),
    client_updated_at = greatest(c.client_updated_at, excluded.client_updated_at),
    updated_at = now()
  returning * into v_row;

  return public._candidate_progress_json(v_row);
end $$;

revoke all on function public.get_candidate_progress(text, text) from public;
revoke all on function public.save_candidate_progress(text, date, jsonb, jsonb, integer, bigint, text) from public;
grant execute on function public.get_candidate_progress(text, text) to anon, authenticated;
grant execute on function public.save_candidate_progress(text, date, jsonb, jsonb, integer, bigint, text) to anon, authenticated;
