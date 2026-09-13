-- Authorized live smoke test. Never COMMIT this script.
-- Before execution, inspect custom triggers on auth.users and this paper table.
-- No passwords, login tokens, messages or existing user data are used.
begin;
set local statement_timeout = '15s';
select set_config('soma_test.owner_a', gen_random_uuid()::text, true);
select set_config('soma_test.owner_b', gen_random_uuid()::text, true);
select set_config('soma_test.paper_id', 'soma-storage-smoke-' || gen_random_uuid()::text, true);
insert into auth.users (id, raw_user_meta_data) values
(current_setting('soma_test.owner_a')::uuid, '{"test":"paper-storage-rollback"}'),
(current_setting('soma_test.owner_b')::uuid, '{"test":"paper-storage-rollback"}');
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('soma_test.owner_a'), true);
do $$ declare affected integer; payload jsonb; begin
  payload := jsonb_build_object('id', current_setting('soma_test.paper_id'),
    'ownerId', current_setting('soma_test.owner_a'), 'title', 'TEST ONLY - rolled back',
    'sections', jsonb_build_array(jsonb_build_object('title', 'Section A', 'questions',
      jsonb_build_array(jsonb_build_object('text', 'What is soil erosion?', 'marks', 2)))));
  insert into public.teacher_paper_documents(id, owner_id, document)
  values(current_setting('soma_test.paper_id'), current_setting('soma_test.owner_a')::uuid, payload);
  if (select document from public.teacher_paper_documents where id=current_setting('soma_test.paper_id')) is distinct from payload then
    raise exception 'Full document read-back failed';
  end if;
  update public.teacher_paper_documents set revision=2 where id=current_setting('soma_test.paper_id') and revision=1;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner update failed'; end if;
  update public.teacher_paper_documents set revision=3 where id=current_setting('soma_test.paper_id') and revision=1;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Stale revision update allowed'; end if;
  begin
    update public.teacher_paper_documents set owner_id=current_setting('soma_test.owner_b')::uuid,
      document=jsonb_set(document, '{ownerId}', to_jsonb(current_setting('soma_test.owner_b')))
      where id=current_setting('soma_test.paper_id');
    raise exception 'Ownership reassignment allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub', current_setting('soma_test.owner_b'), true);
do $$ declare affected integer; begin
  if exists(select 1 from public.teacher_paper_documents where id=current_setting('soma_test.paper_id')) then
    raise exception 'Cross-account read allowed';
  end if;
  update public.teacher_paper_documents set deleted=true where id=current_setting('soma_test.paper_id');
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-account update allowed'; end if;
  begin
    insert into public.teacher_paper_documents(id, owner_id, document)
    values(current_setting('soma_test.paper_id') || '-forged', current_setting('soma_test.owner_a')::uuid,
      jsonb_build_object('id', current_setting('soma_test.paper_id') || '-forged', 'ownerId', current_setting('soma_test.owner_a')));
    raise exception 'Cross-account insert allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub', current_setting('soma_test.owner_a'), true);
do $$ declare affected integer; begin
  update public.teacher_paper_documents set deleted=true, revision=3
    where id=current_setting('soma_test.paper_id') and revision=2;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner soft delete failed'; end if;
  update public.teacher_paper_documents set deleted=false, revision=4
    where id=current_setting('soma_test.paper_id') and revision=3 and deleted=false;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Repository tombstone guard failed'; end if;
  begin
    delete from public.teacher_paper_documents where id=current_setting('soma_test.paper_id');
    raise exception 'Hard delete allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform 1 from public.teacher_paper_documents where id=current_setting('soma_test.paper_id');
    raise exception 'Anonymous read allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
select 'PASS: full document, owner save, account isolation, stale revision, ownership guard, soft deletion and anonymous denial; fixtures rolled back' as result;
