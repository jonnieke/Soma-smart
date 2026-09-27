-- Isolated PostgreSQL container ONLY. Do not run this bootstrap against Supabase.
create role anon;
create role authenticated;
create schema auth;
create table auth.users(id uuid primary key);
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create function public.is_soma_admin() returns boolean language sql stable as $$ select coalesce(current_setting('request.jwt.claim.email',true),'')='admin@soma.app' $$;
grant usage on schema auth to authenticated, anon;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$ begin if ok is not true then raise exception 'FAILED: %',label; end if; raise notice 'PASS: %',label; end $$;
create function pg_temp.expect_error(statement text, label text) returns void language plpgsql as $$
begin
  begin execute statement; exception when others then raise notice 'PASS: %',label; return; end;
  raise exception 'FAILED (unexpected success): %',label;
end $$;
