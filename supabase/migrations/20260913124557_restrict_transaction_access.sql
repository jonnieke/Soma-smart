-- All payment creation and fulfillment must pass through the verified backend.
-- Deploy receipt-status polling and protected admin reporting BEFORE this migration.
alter table public.transactions enable row level security;
do $$
declare existing_policy record;
begin
  for existing_policy in select policyname from pg_policies where schemaname = 'public' and tablename = 'transactions'
  loop
    execute format('drop policy %I on public.transactions', existing_policy.policyname);
  end loop;
end $$;
revoke all on public.transactions from public, anon, authenticated;
grant select on public.transactions to authenticated;
grant select, insert, update, delete on public.transactions to service_role;
create policy "Authenticated owners read transaction history"
on public.transactions for select to authenticated
using ((select auth.uid())::text = user_id or (select auth.uid()) = teacher_id);
-- service_role bypasses RLS; no PUBLIC policy is needed or permitted for it.
