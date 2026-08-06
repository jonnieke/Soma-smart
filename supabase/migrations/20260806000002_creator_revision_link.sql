alter table public.creator_materials
  add column if not exists knowledge_base_id bigint references public.knowledge_base(id) on delete set null;

