DROP POLICY IF EXISTS "Authenticated users can read knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Anyone can read knowledge base" ON public.knowledge_base;
CREATE POLICY "Anyone can read knowledge base" ON public.knowledge_base FOR SELECT USING (true);
