-- Complete private paper documents, separate from published/sold examination data.
create table public.teacher_paper_documents (
    id text not null,
    owner_id uuid not null references auth.users(id) on delete cascade,
    document jsonb not null,
    revision integer not null default 1 check (revision > 0),
    deleted boolean not null default false,
    primary key (owner_id, id),
    constraint paper_document_identity check (
        jsonb_typeof(document) = 'object'
        and document ? 'id' and document ? 'ownerId'
        and jsonb_typeof(document->'id') = 'string'
        and jsonb_typeof(document->'ownerId') = 'string'
        and document->>'id' = id and document->>'ownerId' = owner_id::text
    )
);
alter table public.teacher_paper_documents enable row level security;
revoke all on public.teacher_paper_documents from public, anon, authenticated;
grant select, insert, update on public.teacher_paper_documents to authenticated;
create policy paper_owner_read on public.teacher_paper_documents for select to authenticated
using ((select auth.uid()) = owner_id);
create policy paper_owner_insert on public.teacher_paper_documents for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy paper_owner_update on public.teacher_paper_documents for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
