-- Composite index for authenticated users' feature limit queries
CREATE INDEX IF NOT EXISTS idx_usage_cost_events_limit_check 
ON public.usage_cost_events (user_id, feature, created_at);

-- Expression index for anonymous guest users' feature limit queries
CREATE INDEX IF NOT EXISTS idx_usage_cost_events_guest_check 
ON public.usage_cost_events ((metadata->>'identifier'), feature, created_at);
