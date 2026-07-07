alter table public.learning_credit_balances
    add column if not exists credit_expires_at timestamptz;

update public.learning_credit_balances
set credits = least(greatest(coalesce(credits, 0), 0), 9999),
    updated_at = now()
where credits is distinct from least(greatest(coalesce(credits, 0), 0), 9999);

create or replace function public.grant_learning_credits(
    p_profile_id uuid,
    p_credits integer,
    p_expires_at timestamptz default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    next_credits integer;
    active_expires_at timestamptz;
begin
    if p_profile_id is null or coalesce(p_credits, 0) <= 0 then
        return 0;
    end if;

    insert into public.learning_credit_balances (profile_id, credits, credit_expires_at, updated_at)
    values (p_profile_id, p_credits, p_expires_at, now())
    on conflict (profile_id)
    do update set
        credits = least(
            case
                when public.learning_credit_balances.credit_expires_at is not null
                     and public.learning_credit_balances.credit_expires_at < now()
                then excluded.credits
                else public.learning_credit_balances.credits + excluded.credits
            end,
            9999
        ),
        credit_expires_at = case
            when excluded.credit_expires_at is null then public.learning_credit_balances.credit_expires_at
            when public.learning_credit_balances.credit_expires_at is null then excluded.credit_expires_at
            else greatest(public.learning_credit_balances.credit_expires_at, excluded.credit_expires_at)
        end,
        updated_at = now()
    returning credits, credit_expires_at into next_credits, active_expires_at;

    if active_expires_at is not null and active_expires_at < now() then
        return 0;
    end if;

    return coalesce(least(next_credits, 9999), 0);
end;
$$;

create or replace function public.get_learning_credit_status(
    p_profile_id uuid,
    p_student_id text default null
)
returns table(credits integer, credit_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
    next_credits integer;
    next_expires_at timestamptz;
begin
    if p_profile_id is null then
        return query select 0, null::timestamptz;
        return;
    end if;

    if auth.uid() is not null and auth.uid() <> p_profile_id then
        return query select 0, null::timestamptz;
        return;
    end if;

    if auth.uid() is null then
        if p_student_id is null or not exists (
            select 1
            from public.profiles
            where id = p_profile_id
              and student_id = upper(p_student_id)
        ) then
            return query select 0, null::timestamptz;
            return;
        end if;
    end if;

    select least(coalesce(credits, 0), 9999), credit_expires_at
    into next_credits, next_expires_at
    from public.learning_credit_balances
    where profile_id = p_profile_id;

    if next_expires_at is not null and next_expires_at < now() then
        update public.learning_credit_balances
        set credits = 0,
            updated_at = now()
        where profile_id = p_profile_id;
        return query select 0, null::timestamptz;
        return;
    end if;

    return query select coalesce(next_credits, 0), next_expires_at;
end;
$$;

create or replace function public.get_learning_credits(
    p_profile_id uuid,
    p_student_id text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    wallet_row record;
begin
    select *
    into wallet_row
    from public.get_learning_credit_status(p_profile_id, p_student_id)
    limit 1;

    return coalesce(wallet_row.credits, 0);
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
    current_expires_at timestamptz;
    spend integer := greatest(coalesce(p_credits, 1), 1);
begin
    if p_profile_id is null then
        return query select false, 0;
        return;
    end if;

    insert into public.learning_credit_balances (profile_id, credits, updated_at)
    values (p_profile_id, 0, now())
    on conflict (profile_id) do nothing;

    select credits, credit_expires_at
    into current_credits, current_expires_at
    from public.learning_credit_balances
    where profile_id = p_profile_id
    for update;

    current_credits := least(coalesce(current_credits, 0), 9999);

    if current_expires_at is not null and current_expires_at < now() then
        update public.learning_credit_balances
        set credits = 0,
            updated_at = now()
        where profile_id = p_profile_id;
        return query select false, 0;
        return;
    end if;

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
