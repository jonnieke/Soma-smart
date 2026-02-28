-- Drop existing function if permissions changed over time
DROP FUNCTION IF EXISTS match_documents(vector, float, int);
DROP FUNCTION IF EXISTS match_documents(vector, float, int, bigint);
DROP FUNCTION IF EXISTS match_documents(vector, float, int, bigint, text, text);

-- Create updated function supporting multiple optional filters
CREATE OR REPLACE FUNCTION match_documents (
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_document_id bigint DEFAULT NULL,
    filter_grade text DEFAULT NULL,
    filter_subject text DEFAULT NULL
) RETURNS TABLE (
    id bigint,
    content text,
    similarity float,
    document_id bigint,
    title text,
    grade text,
    subject text
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kv.id,
        kv.content,
        1 - (kv.embedding <=> query_embedding) AS similarity,
        kv.document_id,
        kb.title,
        kb.grade,
        kb.subject
    FROM knowledge_vectors kv
    JOIN knowledge_base kb ON kb.id = kv.document_id
    WHERE 1 - (kv.embedding <=> query_embedding) > match_threshold
      AND (filter_document_id IS NULL OR kv.document_id = filter_document_id)
      AND (filter_grade IS NULL OR filter_grade = 'All' OR kb.grade = filter_grade)
      AND (filter_subject IS NULL OR filter_subject = 'All' OR kb.subject = filter_subject)
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;
