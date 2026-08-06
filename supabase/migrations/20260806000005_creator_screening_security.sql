-- Lock creator-controlled fields and expose a service-only SomaAI similarity search.

drop policy if exists "Creators manage own materials" on public.creator_materials;

create policy "Creators read own materials" on public.creator_materials
  for select to authenticated
  using (auth.uid() = creator_id or public.is_soma_admin());

create policy "Creators submit materials for review" on public.creator_materials
  for insert to authenticated
  with check (
    auth.uid() = creator_id
    and status = 'EDITORIAL_REVIEW'
    and screening_status in ('QUEUED', 'PASSED')
    and similarity_score is null
    and coalesce(sales_count, 0) = 0
    and published_at is null
    and reviewed_at is null
    and reviewed_by is null
  );

revoke update, delete on public.creator_materials from authenticated;
grant select, insert on public.creator_materials to authenticated;

create or replace function public.match_soma_original_chunks(
  query_embedding vector(768),
  match_count integer default 5
) returns table(
  document_id bigint,
  title text,
  content text,
  similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    kv.document_id,
    coalesce(kv.title, kb.title) as title,
    kv.content,
    (1 - (kv.embedding <=> query_embedding))::float as similarity
  from public.knowledge_vectors kv
  join public.knowledge_base kb on kb.id = kv.document_id
  where coalesce(kb.is_official, false) = true
     or upper(coalesce(kb.source, '')) = 'SOMA'
  order by kv.embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;

revoke all on function public.match_soma_original_chunks(vector, integer) from public;
grant execute on function public.match_soma_original_chunks(vector, integer) to service_role;

comment on function public.match_soma_original_chunks(vector, integer) is
  'Service-only similarity signal against SomaAI-owned or official knowledge chunks. Results require human editorial interpretation.';
