ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS order_tracking_id TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_order_tracking_id
ON public.transactions(order_tracking_id);
