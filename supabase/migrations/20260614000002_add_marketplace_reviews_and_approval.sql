-- Add collaborative and approval columns to marketplace_materials table
ALTER TABLE public.marketplace_materials
ADD COLUMN IF NOT EXISTS approval_status TEXT CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING';

ALTER TABLE public.marketplace_materials
ADD COLUMN IF NOT EXISTS approved_by TEXT;

ALTER TABLE public.marketplace_materials
ADD COLUMN IF NOT EXISTS reviews JSONB DEFAULT '[]'::jsonb;
