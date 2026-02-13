-- ROBUST FIX for Teacher Tables
-- Run this in Supabase SQL Editor
-- 1. Profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS usage_teacher INTEGER DEFAULT 0;
-- 2. Teacher Wallets (Create if missing)
CREATE TABLE IF NOT EXISTS public.teacher_wallets (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'KES',
    last_withdrawal TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.teacher_wallets ENABLE ROW LEVEL SECURITY;
-- 3. Transactions (Create + Fix Columns)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount NUMERIC NOT NULL,
    date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Ensure columns exist individually
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('EARNING', 'WITHDRAWAL'));
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'COMPLETED';
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- 4. Marketplace Materials
CREATE TABLE IF NOT EXISTS public.marketplace_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    price NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.marketplace_materials
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.marketplace_materials
ADD COLUMN IF NOT EXISTS teacher_name TEXT;
ALTER TABLE public.marketplace_materials
ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.marketplace_materials
ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE public.marketplace_materials
ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.marketplace_materials
ADD COLUMN IF NOT EXISTS category TEXT CHECK (
        category IN (
            'NOTES',
            'REVISION_PAPER',
            'MARKING_SCHEME',
            'RECORDED_LESSON'
        )
    );
ALTER TABLE public.marketplace_materials
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE public.marketplace_materials
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0;
ALTER TABLE public.marketplace_materials
ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.marketplace_materials
ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE public.marketplace_materials ENABLE ROW LEVEL SECURITY;
-- 5. Tutoring Requests
CREATE TABLE IF NOT EXISTS public.tutoring_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 20;
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS response TEXT;
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS response_type TEXT;
ALTER TABLE public.tutoring_requests
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.tutoring_requests ENABLE ROW LEVEL SECURITY;
-- POLICIES (Drop first to avoid conflicts)
DROP POLICY IF EXISTS "Teachers can view own wallet" ON public.teacher_wallets;
CREATE POLICY "Teachers can view own wallet" ON public.teacher_wallets FOR
SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Teachers can view own transactions" ON public.transactions;
CREATE POLICY "Teachers can view own transactions" ON public.transactions FOR
SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Public can view materials" ON public.marketplace_materials;
CREATE POLICY "Public can view materials" ON public.marketplace_materials FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Teachers can manage own materials" ON public.marketplace_materials;
CREATE POLICY "Teachers can manage own materials" ON public.marketplace_materials FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Public tutoring access" ON public.tutoring_requests;
CREATE POLICY "Public tutoring access" ON public.tutoring_requests FOR ALL USING (true);