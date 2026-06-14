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

    select credits
    into next_credits
    from public.learning_credit_balances
    where profile_id = p_profile_id;

    return coalesce(next_credits, 0);
end;
$$;
