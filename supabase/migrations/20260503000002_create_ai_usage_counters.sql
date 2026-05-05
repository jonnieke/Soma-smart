CREATE TABLE IF NOT EXISTS public.ai_usage_counters (
    identifier TEXT NOT NULL,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (identifier, usage_date)
);

ALTER TABLE public.ai_usage_counters ENABLE ROW LEVEL SECURITY;
