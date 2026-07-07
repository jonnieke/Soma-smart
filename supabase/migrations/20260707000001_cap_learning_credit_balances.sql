update public.learning_credit_balances
set credits = least(greatest(coalesce(credits, 0), 0), 9999),
    updated_at = now()
where credits is distinct from least(greatest(coalesce(credits, 0), 0), 9999);

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
        credits = least(public.learning_credit_balances.credits + excluded.credits, 9999),
        updated_at = now()
    returning credits into next_credits;

    return coalesce(least(next_credits, 9999), 0);
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
    next_credits integer;
begin
    if p_profile_id is null then
        return 0;
    end if;

    if auth.uid() is not null and auth.uid() <> p_profile_id then
        return 0;
    end if;

    if auth.uid() is null then
        if p_student_id is null or not exists (
            select 1
            from public.profiles
            where id = p_profile_id
              and student_id = upper(p_student_id)
        ) then
            return 0;
        end if;
    end if;

    select least(coalesce(credits, 0), 9999)
    into next_credits
    from public.learning_credit_balances
    where profile_id = p_profile_id;

    return coalesce(next_credits, 0);
end;
$$;