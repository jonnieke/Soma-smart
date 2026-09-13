begin;
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


insert into public.transactions (id,user_id,amount,type,status,method,reference_code)
values ('d8518dab-0001-4000-a000-000000000001','d8518dab-1001-4000-a000-000000000001',20,'SUBSCRIPTION','PENDING','MPESA','SECURITY_TEST_A'),
       ('d8518dab-0002-4000-a000-000000000002','d8518dab-1002-4000-a000-000000000002',20,'SUBSCRIPTION','PENDING','MPESA','SECURITY_TEST_B');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"d8518dab-1001-4000-a000-000000000001","role":"authenticated"}',true);
do $$
begin
  if (select count(*) from public.transactions where reference_code in ('SECURITY_TEST_A','SECURITY_TEST_B')) <> 1 then raise exception 'Owner isolation failed'; end if;
  if not exists (select 1 from public.transactions where reference_code='SECURITY_TEST_A') then raise exception 'Own history missing'; end if;
  begin
    update public.transactions set status='SUCCESS' where reference_code='SECURITY_TEST_A';
    raise exception 'Browser payment update was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.transactions (user_id,amount,type,status,method,reference_code)
    values ('d8518dab-1001-4000-a000-000000000001',20,'SUBSCRIPTION','SUCCESS','MPESA','SECURITY_TEST_FORGED');
    raise exception 'Browser payment creation was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.transactions where reference_code='SECURITY_TEST_A';
    raise exception 'Browser payment deletion was allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
set local role anon;
do $$
begin
  begin
    perform id from public.transactions limit 1;
    raise exception 'Anonymous payment read was allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
set local role service_role;
update public.transactions set status='SUCCESS' where reference_code='SECURITY_TEST_B';
do $$
begin
  if not exists (select 1 from public.transactions where reference_code='SECURITY_TEST_B' and status='SUCCESS') then raise exception 'Backend fulfillment blocked'; end if;
end $$;
reset role;
select 'PASS: owner isolated; cross-account hidden; browser insert/update/delete denied; anonymous read denied; backend fulfillment allowed' as verification;
rollback;
