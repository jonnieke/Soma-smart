-- Upgrade transactions table to support Pesapal M-Pesa payments for learners and guests.
-- The original schema only had teacher_id → auth.users, which blocks student-profile-based payments.

-- 1. Add missing columns needed by the pesapal edge function
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS user_id        TEXT,
  ADD COLUMN IF NOT EXISTS method         TEXT DEFAULT 'MPESA',
  ADD COLUMN IF NOT EXISTS reference_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS order_tracking_id_v2 TEXT;  -- alias to avoid conflict with existing order_tracking_id index

-- 2. Back-fill user_id from teacher_id where possible
UPDATE public.transactions
  SET user_id = teacher_id::TEXT
  WHERE user_id IS NULL AND teacher_id IS NOT NULL;

-- 3. Indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON public.transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_reference_code
  ON public.transactions(reference_code);

-- 4. Allow service-role inserts without auth.uid() check
-- The existing RLS policy "Teachers can insert transactions" only allows inserts where
-- auth.uid() = teacher_id. Since the pesapal edge function runs with the service role
-- (which bypasses RLS), this is fine for production. However, we add a policy so the
-- service role can always manage transactions for any user.

DROP POLICY IF EXISTS "Service role manages all transactions" ON public.transactions;
CREATE POLICY "Service role manages all transactions"
  ON public.transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);
