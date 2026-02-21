CREATE POLICY "Anon can insert knowledge base temporarily" ON public.knowledge_base FOR INSERT TO anon, authenticated WITH CHECK (true);
