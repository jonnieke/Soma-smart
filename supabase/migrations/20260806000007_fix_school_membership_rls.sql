-- Replace the Phase 3 self-referencing policies, which recurse when queried.
-- is_active_school_member is SECURITY DEFINER and was introduced by Phase 4 billing.

drop policy if exists "School members can view school memberships" on public.school_memberships;
create policy "School members can view school memberships"
  on public.school_memberships
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_active_school_member(school_id::text)
  );

drop policy if exists "School admins can manage memberships" on public.school_memberships;
create policy "School admins can manage memberships"
  on public.school_memberships
  for all
  to authenticated
  using (
    public.is_active_school_member(school_id::text, array['OWNER', 'ADMIN']::text[])
  )
  with check (
    public.is_active_school_member(school_id::text, array['OWNER', 'ADMIN']::text[])
  );
