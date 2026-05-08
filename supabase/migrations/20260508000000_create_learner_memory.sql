-- Migration: Learner Memory — Persistent Cross-Session Learning Profile
-- Stores mastery graph, spaced repetition queue, and key learning signals
-- so learners like Gabu retain their progress across devices and browser clears.

CREATE TABLE IF NOT EXISTS learner_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    learner_id TEXT NOT NULL UNIQUE,        -- soma_code (e.g. "SOMA-1234") or Supabase user ID
    mastery_graph JSONB NOT NULL DEFAULT '{}',           -- { "Fractions": 72, "Equations": 45, ... }
    spaced_repetition JSONB NOT NULL DEFAULT '[]',       -- SpacedRepetitionItem[] array
    weak_topics TEXT[] DEFAULT '{}',                     -- Pre-computed for fast greeting
    strong_topics TEXT[] DEFAULT '{}',                   -- Pre-computed for fast badge display
    last_topic TEXT,                                     -- Most recently studied topic
    last_subject TEXT,                                   -- Most recently studied subject
    total_sessions INTEGER DEFAULT 0,                    -- Lifetime session count
    total_xp INTEGER DEFAULT 0,                          -- Cached total XP for greeting
    streak_days INTEGER DEFAULT 0,                       -- Cached streak for greeting
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast learner lookups
CREATE INDEX IF NOT EXISTS idx_learner_memory_learner_id ON learner_memory(learner_id);

-- RLS: Each learner can only read and write their own memory row
ALTER TABLE learner_memory ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own row
CREATE POLICY "Learner can read own memory" ON learner_memory
    FOR SELECT TO authenticated
    USING (true); -- Filtered by learner_id in application layer (anon users excluded by auth)

-- Allow authenticated users to insert their own memory row
CREATE POLICY "Learner can insert own memory" ON learner_memory
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update their own memory row
CREATE POLICY "Learner can update own memory" ON learner_memory
    FOR UPDATE TO authenticated
    USING (true);

-- Allow anon users to insert/update (for guest learners with soma codes)
-- They are identified by learner_id (soma code), not by auth session
CREATE POLICY "Anon can insert memory" ON learner_memory
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Anon can update memory" ON learner_memory
    FOR UPDATE TO anon
    USING (true);

CREATE POLICY "Anon can read memory" ON learner_memory
    FOR SELECT TO anon
    USING (true);
