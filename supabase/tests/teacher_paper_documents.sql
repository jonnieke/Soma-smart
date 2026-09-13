-- Run ONLY in a disposable local/test database after the migration. Rolls back all fixtures.
-- This is a prepared security regression test, not evidence of a successful execution.
begin;
insert into auth.users (id) values
('10000000-0000-4000-8000-000000000001'),
('10000000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
insert into public.teacher_paper_documents (id, owner_id, document) values
('fixture-paper', '10000000-0000-4000-8000-000000000001',
'{"id":"fixture-paper","ownerId":"10000000-0000-4000-8000-000000000001","title":"Owner one paper"}');
do $$ begin
    if (select count(*) from public.teacher_paper_documents where id='fixture-paper') <> 1 then
        raise exception 'Owner cannot read saved paper';
    end if;
end $$;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
do $$ declare affected integer; begin
    if exists(select 1 from public.teacher_paper_documents where id='fixture-paper') then
        raise exception 'Cross-account read allowed';
    end if;
    update public.teacher_paper_documents set deleted=true where id='fixture-paper';
    get diagnostics affected = row_count;
    if affected <> 0 then raise exception 'Cross-account update allowed'; end if;
    begin
        insert into public.teacher_paper_documents (id,owner_id,document) values
        ('forged','10000000-0000-4000-8000-000000000001',
        '{"id":"forged","ownerId":"10000000-0000-4000-8000-000000000001"}');
        raise exception 'Cross-account insert allowed';
    exception when insufficient_privilege then null;
    end;
end $$;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
do $$ declare affected integer; begin
    update public.teacher_paper_documents set revision=2 where id='fixture-paper' and revision=1;
    get diagnostics affected = row_count;
    if affected <> 1 then raise exception 'Owner update failed'; end if;
    update public.teacher_paper_documents set revision=2 where id='fixture-paper' and revision=1;
    get diagnostics affected = row_count;
    if affected <> 0 then raise exception 'Stale revision updated'; end if;
    begin
        update public.teacher_paper_documents
        set owner_id='10000000-0000-4000-8000-000000000002',
            document=jsonb_set(document, '{ownerId}', '"10000000-0000-4000-8000-000000000002"')
        where id='fixture-paper';
        raise exception 'Owner reassignment allowed';
    exception when insufficient_privilege then null;
    end;
end $$;
reset role;
rollback;
