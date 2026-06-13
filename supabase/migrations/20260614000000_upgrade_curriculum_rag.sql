-- Upgrade Soma knowledge base into a curriculum-aware RAG store.
create extension if not exists vector;

alter table if exists public.knowledge_base
  add column if not exists source text default 'SOMA',
  add column if not exists is_official boolean default true,
  add column if not exists indexing_status text default 'PENDING',
  add column if not exists indexed_at timestamp with time zone,
  add column if not exists chunk_count integer default 0,
  add column if not exists last_index_error text;

alter table if exists public.knowledge_vectors
  add column if not exists chunk_index integer default 0,
  add column if not exists token_count integer default 0,
  add column if not exists title text,
  add column if not exists grade text,
  add column if not exists subject text,
  add column if not exists source_type text,
  add column if not exists metadata jsonb default '{}'::jsonb;

create index if not exists idx_knowledge_base_filters
  on public.knowledge_base (type, grade, subject, source, is_official);

create index if not exists idx_knowledge_vectors_filters
  on public.knowledge_vectors (document_id, source_type, grade, subject);

create index if not exists idx_knowledge_vectors_metadata
  on public.knowledge_vectors using gin (metadata);

create index if not exists idx_knowledge_vectors_content_fts
  on public.knowledge_vectors using gin (to_tsvector('english', content));

create index if not exists idx_knowledge_vectors_embedding_cosine
  on public.knowledge_vectors using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

drop function if exists match_documents(vector, float, int);
drop function if exists match_documents(vector, float, int, bigint);
drop function if exists match_documents(vector, float, int, bigint, text, text);
drop function if exists match_documents(vector, float, int, bigint, text, text, text, text);

create or replace function match_documents (
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_document_id bigint default null,
    filter_grade text default null,
    filter_subject text default null,
    filter_type text default null,
    query_text text default null
) returns table (
    id bigint,
    content text,
    similarity float,
    keyword_rank float,
    combined_score float,
    document_id bigint,
    title text,
    grade text,
    subject text,
    type text,
    file_url text,
    source text,
    is_official boolean,
    chunk_index integer,
    metadata jsonb
) language plpgsql stable as $$
begin
    return query
    with scored as (
        select
            kv.id,
            kv.content,
            1 - (kv.embedding <=> query_embedding) as vector_score,
            case
                when query_text is null or length(trim(query_text)) = 0 then 0::float
                else ts_rank_cd(to_tsvector('english', kv.content), plainto_tsquery('english', query_text))
            end as text_score,
            kv.document_id,
            coalesce(kv.title, kb.title) as resolved_title,
            coalesce(kv.grade, kb.grade) as resolved_grade,
            coalesce(kv.subject, kb.subject) as resolved_subject,
            kb.type,
            kb.file_url,
            kb.source,
            kb.is_official,
            kv.chunk_index,
            kv.metadata
        from public.knowledge_vectors kv
        join public.knowledge_base kb on kb.id = kv.document_id
        where 1 - (kv.embedding <=> query_embedding) > match_threshold
          and (filter_document_id is null or kv.document_id = filter_document_id)
          and (filter_grade is null or filter_grade = 'All' or filter_grade = 'ALL' or kb.grade = filter_grade or kv.grade = filter_grade)
          and (filter_subject is null or filter_subject = 'All' or filter_subject = 'ALL' or kb.subject = filter_subject or kv.subject = filter_subject)
          and (filter_type is null or filter_type = 'ALL' or kb.type = filter_type)
    )
    select
        scored.id,
        scored.content,
        scored.vector_score as similarity,
        scored.text_score as keyword_rank,
        (scored.vector_score * 0.82 + least(scored.text_score, 1) * 0.18) as combined_score,
        scored.document_id,
        scored.resolved_title as title,
        scored.resolved_grade as grade,
        scored.resolved_subject as subject,
        scored.type,
        scored.file_url,
        scored.source,
        scored.is_official,
        scored.chunk_index,
        scored.metadata
    from scored
    order by combined_score desc, similarity desc
    limit match_count;
end;
$$;
