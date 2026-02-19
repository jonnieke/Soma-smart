-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Teachers can view own wallet" ON public.teacher_wallets;
DROP POLICY IF EXISTS "Teachers can update own wallet" ON public.teacher_wallets;
DROP POLICY IF EXISTS "Teachers can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Teachers can insert transactions" ON public.transactions;
-- Drop triggers
DROP TRIGGER IF EXISTS on_teacher_wallets_updated ON public.teacher_wallets;
-- Create teacher_wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.teacher_wallets (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'KES',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS for teacher_wallets
ALTER TABLE public.teacher_wallets ENABLE ROW LEVEL SECURITY;
-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    -- 'EARNING', 'WITHDRAWAL', 'REFUND'
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    -- 'PENDING', 'COMPLETED', 'FAILED'
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- Re-create Policies for teacher_wallets
-- Teachers can view their own wallet
CREATE POLICY "Teachers can view own wallet" ON public.teacher_wallets FOR
SELECT USING (auth.uid() = id);
-- Only system/triggers should update wallets directly, but for now allow teachers to update (in a real app, this should be restricted)
CREATE POLICY "Teachers can update own wallet" ON public.teacher_wallets FOR
UPDATE USING (auth.uid() = id);
-- Re-create Policies for transactions
-- Teachers can view their own transactions
CREATE POLICY "Teachers can view own transactions" ON public.transactions FOR
SELECT USING (auth.uid() = teacher_id);
-- Allow teachers to insert transactions (e.g. when earning)
CREATE POLICY "Teachers can insert transactions" ON public.transactions FOR
INSERT WITH CHECK (auth.uid() = teacher_id);
-- Create trigger to update updated_at on teacher_wallets
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_teacher_wallets_updated BEFORE
UPDATE ON public.teacher_wallets FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
-- OPTIONAL: Insert a wallet for the current user if they exist and don't have one (Manual fix for existing users)
-- INSERT INTO public.teacher_wallets (id, balance)
-- SELECT id, 0.00 FROM auth.users
-- WHERE id = auth.uid()
-- AND NOT EXISTS (SELECT 1 FROM public.teacher_wallets WHERE id = auth.users.id);