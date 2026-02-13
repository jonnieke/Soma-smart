-- Migration for Teacher Section Overhaul
-- 1. Add usage_teacher to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS usage_teacher INTEGER DEFAULT 0;
-- 2. Create teacher_wallets table
CREATE TABLE IF NOT EXISTS public.teacher_wallets (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'KES',
    last_withdrawal TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS for teacher_wallets
ALTER TABLE public.teacher_wallets ENABLE ROW LEVEL SECURITY;
-- 3. Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('EARNING', 'WITHDRAWAL')),
    amount NUMERIC NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('COMPLETED', 'PENDING', 'FAILED')) DEFAULT 'COMPLETED',
    date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- 4. Create marketplace_materials table
CREATE TABLE IF NOT EXISTS public.marketplace_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    teacher_name TEXT,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC DEFAULT 0,
    grade TEXT,
    subject TEXT,
    category TEXT CHECK (
        category IN (
            'NOTES',
            'REVISION_PAPER',
            'MARKING_SCHEME',
            'RECORDED_LESSON'
        )
    ),
    download_count INTEGER DEFAULT 0,
    rating NUMERIC DEFAULT 5.0,
    file_url TEXT,
    preview_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS for marketplace_materials
ALTER TABLE public.marketplace_materials ENABLE ROW LEVEL SECURITY;
-- 5. Create tutoring_requests table
CREATE TABLE IF NOT EXISTS public.tutoring_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic TEXT,
    description TEXT,
    status TEXT CHECK (
        status IN ('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED')
    ) DEFAULT 'PENDING',
    price NUMERIC DEFAULT 20,
    response TEXT,
    response_type TEXT CHECK (response_type IN ('TEXT', 'VOICE', 'VIDEO')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMPTZ
);
-- Enable RLS for tutoring_requests
ALTER TABLE public.tutoring_requests ENABLE ROW LEVEL SECURITY;
-- RLS Policies
-- Wallets: Teachers can see their own wallet
DROP POLICY IF EXISTS "Teachers can view own wallet" ON public.teacher_wallets;
CREATE POLICY "Teachers can view own wallet" ON public.teacher_wallets FOR
SELECT USING (auth.uid() = id);
-- Transactions: Teachers can see their own transactions
DROP POLICY IF EXISTS "Teachers can view own transactions" ON public.transactions;
CREATE POLICY "Teachers can view own transactions" ON public.transactions FOR
SELECT USING (auth.uid() = teacher_id);
-- Marketplace: Public can see materials, Teachers can manage their own
DROP POLICY IF EXISTS "Public can view materials" ON public.marketplace_materials;
CREATE POLICY "Public can view materials" ON public.marketplace_materials FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Teachers can manage own materials" ON public.marketplace_materials;
CREATE POLICY "Teachers can manage own materials" ON public.marketplace_materials FOR ALL USING (auth.uid() = teacher_id);
-- Tutoring: Students can see all (for now, or filter by student_id), Teachers can see active ones
DROP POLICY IF EXISTS "Public tutoring access" ON public.tutoring_requests;
CREATE POLICY "Public tutoring access" ON public.tutoring_requests FOR ALL USING (true);