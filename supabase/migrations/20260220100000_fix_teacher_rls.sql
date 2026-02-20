-- Fix missing RLS policies for teacher workflow
-- Wallets
DROP POLICY IF EXISTS "Teachers can insert own wallet" ON public.teacher_wallets;
CREATE POLICY "Teachers can insert own wallet" ON public.teacher_wallets FOR
INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Teachers can update own wallet" ON public.teacher_wallets;
CREATE POLICY "Teachers can update own wallet" ON public.teacher_wallets FOR
UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Transactions
DROP POLICY IF EXISTS "Teachers can insert own transactions" ON public.transactions;
CREATE POLICY "Teachers can insert own transactions" ON public.transactions FOR
INSERT WITH CHECK (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Teachers can update own transactions" ON public.transactions;
CREATE POLICY "Teachers can update own transactions" ON public.transactions FOR
UPDATE USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
-- Tutoring Requests
DROP POLICY IF EXISTS "Teachers can update tutoring requests" ON public.tutoring_requests;
CREATE POLICY "Teachers can update tutoring requests" ON public.tutoring_requests FOR
UPDATE USING (true) WITH CHECK (true);
-- Adding INSERT for tutoring requests just in case (students need to create this normally, but good to ensure Teachers can test it locally if needed)
DROP POLICY IF EXISTS "Anyone can insert tutoring requests" ON public.tutoring_requests;
CREATE POLICY "Anyone can insert tutoring requests" ON public.tutoring_requests FOR
INSERT WITH CHECK (true);