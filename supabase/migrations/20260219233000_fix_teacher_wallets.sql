-- Create teacher_wallets table if it somehow doesn't exist (safety)
CREATE TABLE IF NOT EXISTS public.teacher_wallets (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'KES',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS
ALTER TABLE public.teacher_wallets ENABLE ROW LEVEL SECURITY;
-- Ensure all existing teachers have a wallet (only for those who have a profile)
INSERT INTO public.teacher_wallets (id, balance)
SELECT id,
    0.00
FROM public.profiles
WHERE id NOT IN (
        SELECT id
        FROM public.teacher_wallets
    );
-- Re-apply policies to be safe
DROP POLICY IF EXISTS "Teachers can view own wallet" ON public.teacher_wallets;
DROP POLICY IF EXISTS "Teachers can update own wallet" ON public.teacher_wallets;
CREATE POLICY "Teachers can view own wallet" ON public.teacher_wallets FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Teachers can update own wallet" ON public.teacher_wallets FOR
UPDATE USING (auth.uid() = id);
-- Ensure transactions table exists
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Changed from user_id to match AppContext logic if needed, but schema said teacher_id
    -- Note: Previous migration used 'teacher_id'. AppContext uses 'user_id' in insert? Let's check.
    -- AppContext uses: user_id: userId
    -- Migration 150000 uses: teacher_id
    -- I should ALIGN them. I will add user_id alias or fix AppContext. 
    -- Let's stick to teacher_id in schema and fix AppContext.
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Teachers can insert transactions" ON public.transactions;
CREATE POLICY "Teachers can view own transactions" ON public.transactions FOR
SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can insert transactions" ON public.transactions FOR
INSERT WITH CHECK (auth.uid() = teacher_id);