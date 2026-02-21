ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Anyone can read knowledge base" ON public.knowledge_base;
CREATE POLICY "Anyone can read knowledge base" ON public.knowledge_base FOR SELECT USING (true);

ALTER TABLE public.marketplace_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read marketplace materials" ON public.marketplace_materials;
CREATE POLICY "Anyone can read marketplace materials" ON public.marketplace_materials FOR SELECT USING (true);
