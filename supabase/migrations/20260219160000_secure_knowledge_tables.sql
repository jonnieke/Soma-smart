-- Enable RLS on knowledge_base table
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
-- Enable RLS on knowledge_vectors table (if it exists)
-- Using DO block to handle conditional check in pure SQL if needed, 
-- but usually safe to run ALTER TABLE if it exists.
-- Assuming standard Supabase vector setup
ALTER TABLE IF EXISTS public.knowledge_vectors ENABLE ROW LEVEL SECURITY;
-- 1. Policies for knowledge_base
-- Allow authenticated users (students/teachers) to READ all knowledge base items
CREATE POLICY "Authenticated users can read knowledge base" ON public.knowledge_base FOR
SELECT TO authenticated USING (true);
-- Allow admins/service_role to INSERT/UPDATE/DELETE
-- Assuming service_role is used for ingestion, or a specific admin role.
-- For now, letting service_role bypass RLS is default, but we can add explicit policy if needed for specific users.
-- If you have an 'admin' role in your app metadata:
-- USING (auth.jwt() ->> 'role' = 'admin') or similar.
-- For now, we will assume only service_role (backend) writes to this, or we rely on dashboard RLS.
-- In many RAG setups, vectors are written by a backend process.
-- Let's allow insert for authenticated users if this is a "Upload Document" feature, 
-- otherwise restrict to service_role.
-- Based on previous context, this seems to be an Admin-curated knowledge base.
-- So we might strictly limit WRITEs.
-- 2. Policies for knowledge_vectors
-- Allow authenticated users to READ vectors (for similarity search via RPC or direct select)
CREATE POLICY "Authenticated users can read vectors" ON public.knowledge_vectors FOR
SELECT TO authenticated USING (true);
-- Allow full access to service_role (implicitly done by Supabase usually, but good to be aware)