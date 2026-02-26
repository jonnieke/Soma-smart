-- Allow authenticated users to insert, update, delete knowledge base items
-- This is needed for the Admin Knowledge Base upload feature
DROP POLICY IF EXISTS "Authenticated users can insert knowledge base" ON public.knowledge_base;
CREATE POLICY "Authenticated users can insert knowledge base" ON public.knowledge_base FOR
INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update knowledge base" ON public.knowledge_base;
CREATE POLICY "Authenticated users can update knowledge base" ON public.knowledge_base FOR
UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can delete knowledge base" ON public.knowledge_base;
CREATE POLICY "Authenticated users can delete knowledge base" ON public.knowledge_base FOR DELETE TO authenticated USING (true);