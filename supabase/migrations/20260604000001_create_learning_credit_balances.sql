create table if not exists public.learning_credit_balances (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    credits integer not null default 0,
    updated_at timestamptz not null default now()
);

alter table public.learning_credit_balances enable row level security;

drop policy if exists "Users can read own learning credits" on public.learning_credit_balances;

create policy "Users can read own learning credits"
on public.learning_credit_balances
for select
to authenticated
using (auth.uid() = profile_id);

create or replace function public.grant_learning_credits(
    p_profile_id uuid,
    p_credits integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    next_credits integer;
begin
    if p_profile_id is null or coalesce(p_credits, 0) <= 0 then
        return 0;
    end if;

    insert into public.learning_credit_balances (profile_id, credits, updated_at)
    values (p_profile_id, p_credits, now())
    on conflict (profile_id)
    do update set
        credits = public.learning_credit_balances.credits + excluded.credits,
        updated_at = now()
    returning credits into next_credits;

    return coalesce(next_credits, 0);
end;
$$;

create or replace function public.consume_learning_credits(
    p_profile_id uuid,
    p_credits integer
)
returns table(allowed boolean, credits_remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
    current_credits integer;
    spend integer := greatest(coalesce(p_credits, 1), 1);
begin
    if p_profile_id is null then
        return query select false, 0;
        return;
    end if;

    insert into public.learning_credit_balances (profile_id, credits, updated_at)
    values (p_profile_id, 0, now())
    on conflict (profile_id) do nothing;

    select credits
    into current_credits
    from public.learning_credit_balances
    where profile_id = p_profile_id
    for update;

    current_credits := coalesce(current_credits, 0);

    if current_credits < spend then
        return query select false, current_credits;
        return;
    end if;

    update public.learning_credit_balances
    set credits = credits - spend,
        updated_at = now()
    where profile_id = p_profile_id
    returning credits into current_credits;

    return query select true, current_credits;
end;
$$;
