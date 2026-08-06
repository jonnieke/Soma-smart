alter table public.creator_materials
  add column if not exists ai_screening_consent_at timestamptz,
  add column if not exists ai_screening_provider text;

