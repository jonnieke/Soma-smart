-- Restore admin exam-package writes without reopening knowledge_base to all authenticated users.
-- The previous hardening required profiles.role = 'ADMIN' exactly; this fails when
-- the admin session has a valid auth email but the profile role is missing/stale.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        upper(coalesce(p.role::text, '')) in ('ADMIN', 'SUPER_ADMIN')
        or lower(coalesce(p.email, '')) in ('admin@soma.app', 'kariukinjoroge13@gmail.com')
        or lower(coalesce(auth.jwt() ->> 'email', '')) in ('admin@soma.app', 'kariukinjoroge13@gmail.com')
      )
  )
  or lower(coalesce(auth.jwt() ->> 'email', '')) in ('admin@soma.app', 'kariukinjoroge13@gmail.com');
$$;

grant execute on function public.is_platform_admin() to authenticated;

-- Normalize the known admin profile when it exists so other admin dashboards that
-- read profiles.role also behave consistently.
update public.profiles
set role = 'ADMIN'
where lower(coalesce(email, '')) in ('admin@soma.app', 'kariukinjoroge13@gmail.com')
  and coalesce(role, '') <> 'ADMIN';

drop policy if exists "Platform admins manage curriculum documents" on public.knowledge_base;
create policy "Platform admins manage curriculum documents"
  on public.knowledge_base
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
