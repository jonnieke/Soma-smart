-- 1. Phone-number purchase restoration & 24-hour AI Revision Pass tracking
-- Normalizes +254xxx, 254xxx, 0xxx, or 9-digit xxx phone inputs to the canonical last 9 digits.

create or replace function public.normalize_kenyan_phone_last9(p_phone text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_digits text;
begin
  v_digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if length(v_digits) = 9 then
    return v_digits;
  elsif length(v_digits) = 10 and left(v_digits, 1) = '0' then
    return right(v_digits, 9);
  elsif length(v_digits) = 12 and left(v_digits, 3) = '254' then
    return right(v_digits, 9);
  elsif length(v_digits) = 13 and left(v_digits, 4) = '2540' then
    return right(v_digits, 9);
  elsif length(v_digits) > 9 and (left(v_digits, 3) = '254' or left(v_digits, 1) = '0') then
    return right(v_digits, 9);
  end if;
  return null;
end;
$$;

create index if not exists exam_paper_orders_phone_last9_idx
  on public.exam_paper_orders (right(regexp_replace(buyer_phone, '\D', '', 'g'), 9), status);

create or replace function public.restore_candidate_by_phone(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last9 text;
  v_latest_token uuid;
  v_buyer_name text;
  v_latest_paid timestamptz;
  v_expires_at timestamptz;
  v_paper_ids jsonb;
begin
  v_last9 := public.normalize_kenyan_phone_last9(p_phone);
  if v_last9 is null or length(v_last9) <> 9 then
    raise exception 'Please enter a valid phone number (last 9 digits required)';
  end if;

  select o.buyer_token, o.buyer_name, coalesce(o.paid_at, o.created_at)
  into v_latest_token, v_buyer_name, v_latest_paid
  from public.exam_paper_orders o
  where o.status = 'SUCCESS'
    and right(regexp_replace(o.buyer_phone, '\D', '', 'g'), 9) = v_last9
  order by coalesce(o.paid_at, o.created_at) desc
  limit 1;

  if v_latest_token is null then
    return jsonb_build_object(
      'found', false,
      'normalizedPhone', '254' || v_last9,
      'last9', v_last9,
      'paperIds', '[]'::jsonb,
      'passActive', false,
      'hoursRemaining', 0
    );
  end if;

  -- Link all successful orders for this phone number to the latest buyer_token
  -- so the candidate can read and revise all their purchased papers on this device.
  update public.exam_paper_orders
  set buyer_token = v_latest_token,
      updated_at = now()
  where status = 'SUCCESS'
    and right(regexp_replace(buyer_phone, '\D', '', 'g'), 9) = v_last9
    and buyer_token <> v_latest_token;

  select coalesce(jsonb_agg(distinct o.exam_id::text), '[]'::jsonb)
  into v_paper_ids
  from public.exam_paper_orders o
  where o.status = 'SUCCESS'
    and right(regexp_replace(o.buyer_phone, '\D', '', 'g'), 9) = v_last9;

  v_expires_at := v_latest_paid + interval '24 hours';

  return jsonb_build_object(
    'found', true,
    'buyerToken', v_latest_token,
    'buyerName', v_buyer_name,
    'normalizedPhone', '254' || v_last9,
    'last9', v_last9,
    'paperIds', v_paper_ids,
    'latestPaidAt', v_latest_paid,
    'passExpiresAt', v_expires_at,
    'passActive', (v_expires_at > now()),
    'hoursRemaining', greatest(0, round((extract(epoch from (v_expires_at - now())) / 3600.0)::numeric, 1))
  );
end;
$$;

revoke all on function public.normalize_kenyan_phone_last9(text) from public;
revoke all on function public.restore_candidate_by_phone(text) from public;
grant execute on function public.normalize_kenyan_phone_last9(text) to anon, authenticated;
grant execute on function public.restore_candidate_by_phone(text) to anon, authenticated;

-- 2. Shared Learner Knowledge Pool (Deduplicated AI Materials & Community Study Pool)

create table if not exists public.learner_knowledge_pool (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('PRACTICE_DRILL', 'TOPIC_EXPLANATION', 'CAPTURED_QUESTION', 'REVISION_PAPER')),
  exam_pathway text not null default 'KJSEA',
  grade text not null,
  subject text not null,
  topic text not null,
  query_fingerprint text not null unique,
  search_tokens text[] not null default '{}',
  prompt_text text not null,
  summary_preview text not null default '',
  content_json jsonb not null,
  reuse_count integer not null default 1 check (reuse_count >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists learner_knowledge_pool_lookup_idx
  on public.learner_knowledge_pool (item_type, lower(subject), lower(grade));

create index if not exists learner_knowledge_pool_tokens_gin_idx
  on public.learner_knowledge_pool using gin (search_tokens);

create index if not exists learner_knowledge_pool_popular_idx
  on public.learner_knowledge_pool (lower(subject), lower(grade), reuse_count desc, updated_at desc);

alter table public.learner_knowledge_pool enable row level security;
revoke all on table public.learner_knowledge_pool from anon, authenticated;

create or replace function public._pool_item_json(r public.learner_knowledge_pool)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select jsonb_build_object(
    'id', r.id,
    'itemType', r.item_type,
    'examPathway', r.exam_pathway,
    'grade', r.grade,
    'subject', r.subject,
    'topic', r.topic,
    'queryFingerprint', r.query_fingerprint,
    'searchTokens', r.search_tokens,
    'promptText', r.prompt_text,
    'summaryPreview', r.summary_preview,
    'contentJson', r.content_json,
    'reuseCount', r.reuse_count,
    'createdAt', r.created_at,
    'updatedAt', r.updated_at
  );
$$;

create or replace function public.find_pooled_learning_material(
  p_item_type text,
  p_grade text,
  p_subject text,
  p_fingerprint text,
  p_tokens text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.learner_knowledge_pool;
begin
  -- Tier 1: Exact canonical fingerprint match
  select * into v_row
  from public.learner_knowledge_pool
  where query_fingerprint = p_fingerprint
  limit 1;

  -- Tier 2: Relatable query token-overlap similarity match (>= 75% token overlap in same grade & subject)
  if v_row.id is null and coalesce(cardinality(p_tokens), 0) > 0 then
    select p.*
    into v_row
    from public.learner_knowledge_pool p
    where p.item_type = p_item_type
      and lower(p.subject) = lower(coalesce(p_subject, ''))
      and (coalesce(p_grade, '') = '' or lower(p.grade) = lower(p_grade))
      and p.search_tokens && p_tokens
      and (
        (
          select count(*)::numeric
          from (
            select unnest(p.search_tokens)
            intersect
            select unnest(p_tokens)
          ) shared
        ) / greatest(1, least(cardinality(p.search_tokens), cardinality(p_tokens)))::numeric
      ) >= 0.75
    order by
      (
        select count(*)::numeric
        from (
          select unnest(p.search_tokens)
          intersect
          select unnest(p_tokens)
        ) shared
      ) / greatest(1, greatest(cardinality(p.search_tokens), cardinality(p_tokens)))::numeric desc,
      p.reuse_count desc,
      p.updated_at desc
    limit 1;
  end if;

  if v_row.id is null then
    return null;
  end if;

  update public.learner_knowledge_pool
  set reuse_count = reuse_count + 1,
      updated_at = now()
  where id = v_row.id
  returning * into v_row;

  return public._pool_item_json(v_row);
end;
$$;

create or replace function public.save_pooled_learning_material(
  p_item_type text,
  p_exam_pathway text,
  p_grade text,
  p_subject text,
  p_topic text,
  p_fingerprint text,
  p_tokens text[],
  p_prompt_text text,
  p_summary_preview text,
  p_content_json jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.learner_knowledge_pool;
begin
  if p_item_type not in ('PRACTICE_DRILL', 'TOPIC_EXPLANATION', 'CAPTURED_QUESTION', 'REVISION_PAPER') then
    raise exception 'Invalid pool item type';
  end if;
  if coalesce(trim(p_fingerprint), '') = '' or coalesce(trim(p_subject), '') = '' or coalesce(trim(p_topic), '') = '' then
    raise exception 'Missing required pool metadata';
  end if;

  insert into public.learner_knowledge_pool as pool (
    item_type,
    exam_pathway,
    grade,
    subject,
    topic,
    query_fingerprint,
    search_tokens,
    prompt_text,
    summary_preview,
    content_json,
    reuse_count,
    updated_at
  )
  values (
    p_item_type,
    coalesce(nullif(trim(p_exam_pathway), ''), 'KJSEA'),
    coalesce(nullif(trim(p_grade), ''), 'Grade 9'),
    trim(p_subject),
    left(trim(p_topic), 200),
    trim(p_fingerprint),
    coalesce(p_tokens, '{}'),
    left(coalesce(trim(p_prompt_text), trim(p_topic)), 1000),
    left(coalesce(trim(p_summary_preview), ''), 400),
    p_content_json,
    1,
    now()
  )
  on conflict (query_fingerprint) do update set
    reuse_count = pool.reuse_count + 1,
    updated_at = now()
  returning * into v_row;

  return public._pool_item_json(v_row);
end;
$$;

create or replace function public.list_learner_knowledge_pool(
  p_grade text default null,
  p_subject text default null,
  p_item_type text default null,
  p_search text default null,
  p_limit integer default 24
)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    jsonb_agg(public._pool_item_json(sub)),
    '[]'::jsonb
  )
  from (
    select p.*
    from public.learner_knowledge_pool p
    where (coalesce(trim(p_grade), '') = '' or lower(p.grade) = lower(trim(p_grade)))
      and (coalesce(trim(p_subject), '') = '' or lower(p.subject) = lower(trim(p_subject)))
      and (coalesce(trim(p_item_type), '') = '' or p.item_type = trim(p_item_type))
      and (
        coalesce(trim(p_search), '') = ''
        or p.topic ilike '%' || trim(p_search) || '%'
        or p.prompt_text ilike '%' || trim(p_search) || '%'
        or p.summary_preview ilike '%' || trim(p_search) || '%'
      )
    order by p.reuse_count desc, p.updated_at desc
    limit greatest(1, least(coalesce(p_limit, 24), 60))
  ) sub;
$$;

revoke all on function public.find_pooled_learning_material(text, text, text, text, text[]) from public;
revoke all on function public.save_pooled_learning_material(text, text, text, text, text, text, text[], text, text, jsonb) from public;
revoke all on function public.list_learner_knowledge_pool(text, text, text, text, integer) from public;

grant execute on function public.find_pooled_learning_material(text, text, text, text, text[]) to anon, authenticated;
grant execute on function public.save_pooled_learning_material(text, text, text, text, text, text, text[], text, text, jsonb) to anon, authenticated;
grant execute on function public.list_learner_knowledge_pool(text, text, text, text, integer) to anon, authenticated;
