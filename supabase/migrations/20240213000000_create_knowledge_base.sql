-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;
-- Create a table to store your knowledge base documents
create table if not exists knowledge_base (
    id bigint primary key generated always as identity,
    title text not null,
    grade text not null,
    -- e.g., "Grade 4", "Grade 5"
    subject text not null,
    -- e.g., "Math", "English"
    type text not null check (type in ('SYLLABUS', 'PAST_PAPER', 'NOTES')),
    file_url text not null,
    file_path text not null,
    -- path in storage bucket
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Create a table to store the actual text chunks and their embeddings
create table if not exists knowledge_vectors (
    id bigint primary key generated always as identity,
    document_id bigint references knowledge_base(id) on delete cascade,
    content text not null,
    -- the actual chunk of text
    embedding vector(768),
    -- 768 is the standard dimension for Gemini text-embedding-004
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Create a function to search for documents
create or replace function match_documents (
        query_embedding vector(768),
        match_threshold float,
        match_count int
    ) returns table (
        id bigint,
        content text,
        similarity float,
        document_id bigint
    ) language plpgsql as $$ begin return query
select knowledge_vectors.id,
    knowledge_vectors.content,
    1 - (knowledge_vectors.embedding <=> query_embedding) as similarity,
    knowledge_vectors.document_id
from knowledge_vectors
where 1 - (knowledge_vectors.embedding <=> query_embedding) > match_threshold
order by similarity desc
limit match_count;
end;
$$;
-- Create Storage Bucket for Syllabus Compliance
insert into storage.buckets (id, name, public)
values ('syllabus-docs', 'syllabus-docs', true) on conflict (id) do nothing;
-- Allow public access to syllabus-docs (read only)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Public Access'
        AND tablename = 'objects'
        AND schemaname = 'storage'
) THEN CREATE POLICY "Public Access" ON storage.objects FOR
SELECT USING (bucket_id = 'syllabus-docs');
END IF;
END $$;
-- Allow authenticated uploads (for admin)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Admin Upload'
        AND tablename = 'objects'
        AND schemaname = 'storage'
) THEN CREATE POLICY "Admin Upload" ON storage.objects FOR
INSERT WITH CHECK (bucket_id = 'syllabus-docs');
END IF;
END $$;