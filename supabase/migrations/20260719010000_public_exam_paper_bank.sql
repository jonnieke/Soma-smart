-- Public SomaAI Original paper catalogue and guest purchase entitlements.
create table if not exists public.exam_paper_orders (
  id uuid primary key default gen_random_uuid(),
  exam_id bigint not null references public.knowledge_base(id) on delete restrict,
  buyer_token uuid not null,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text,
  amount numeric(10,2) not null default 20 check (amount = 20),
  currency text not null default 'KES',
  status text not null default 'PENDING' check (status in ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  reference_code text not null unique,
  order_tracking_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exam_paper_orders_buyer_exam_idx
  on public.exam_paper_orders (buyer_token, exam_id, status);
create index if not exists exam_paper_orders_tracking_idx
  on public.exam_paper_orders (order_tracking_id)
  where order_tracking_id is not null;

alter table public.exam_paper_orders enable row level security;

-- No browser table policies: the service-role Edge Function owns checkout and access.
create or replace function public.list_exam_paper_bank(
  p_grade text default null,
  p_subject text default null
)
returns table (
  id bigint,
  title text,
  subject text,
  grade text,
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

revoke all on function public.list_exam_paper_bank(text, text) from public;
grant execute on function public.list_exam_paper_bank(text, text) to anon, authenticated;
